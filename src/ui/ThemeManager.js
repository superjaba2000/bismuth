import YAML from 'yaml';
import path from 'node:path';
import fs from 'node:fs';
import logger from '../util/logger.js';
import { state } from '../app.js';
import Environment from '../core/Environment.js';

function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function mergeComponents(base, overrides) {
    if (!isObject(base) || !isObject(overrides)) {
        return overrides;
    }

    const merged = { ...base };
    for (const [key, value] of Object.entries(overrides)) {
        merged[key] = Object.hasOwn(base, key)
            ? mergeComponents(base[key], value)
            : value;
    }
    return merged;
}

function resolveReferences(value, components, references = []) {
    if (typeof value === 'string') {
        const match = /^([A-Za-z0-9_-]+):([A-Za-z0-9_-]+)$/.exec(value);
        if (!match) {
            return value;
        }

        const reference = `${match[1]}:${match[2]}`;
        if (references.includes(reference)) {
            throw new Error(`Circular theme variable reference: ${[...references, reference].join(' -> ')}`);
        }

        const component = components[match[1]];
        if (!isObject(component) || !Object.hasOwn(component, match[2])) {
            throw new Error(`Theme variable "${reference}" does not exist`);
        }

        return resolveReferences(component[match[2]], components, [...references, reference]);
    }

    if (Array.isArray(value)) {
        return value.map(item => resolveReferences(item, components, references));
    }

    if (isObject(value)) {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [
                key,
                resolveReferences(item, components, references)
            ])
        );
    }

    return value;
}

export default class ThemeManager {
    themes = [];

    load() {
        this.themes = [];

        const themeDir = Environment.themesDir;
        if (!fs.existsSync(themeDir)) {
            logger.error(`The theme directory was not found at ${themeDir}`);
            return;
        }

        const dirContent = fs.readdirSync(themeDir, { withFileTypes: true });
        const themePaths = dirContent
            .filter(entry => entry.isDirectory())
            .map(entry => path.join(themeDir, entry.name));
        const rawThemes = new Map();

        for (const themePath of themePaths) {
            const theme = this.loadTheme(themePath);
            if (!theme) {
                continue;
            }

            if (rawThemes.has(theme.name)) {
                logger.error(`Duplicate theme name "${theme.name}" in ${themePath}`);
                continue;
            }

            rawThemes.set(theme.name, theme);
        }

        const resolvedThemes = new Map();
        for (const themeName of rawThemes.keys()) {
            try {
                const theme = this.resolveTheme(themeName, rawThemes, resolvedThemes);
                theme.components = resolveReferences(theme.components, theme.components);
                this.themes.push(theme);
                logger.info(`Theme "${theme.name}" successfully loaded.`);
            } catch (error) {
                logger.error(`Failed to load theme "${themeName}": ${error.message}`);
            }
        }
    }

    loadTheme(themeDir) {
        try {
            const configPath = path.join(themeDir, 'theme.yml');
            if (!fs.existsSync(configPath)) {
                logger.error(`Config file for theme ${themeDir} is not found!`);
                return null;
            }

            const config = YAML.parse(fs.readFileSync(configPath, 'utf8'));
            const name = config?.theme?.name ?? config?.name;
            if (typeof name !== 'string' || name.length === 0) {
                throw new Error('Theme config must define a non-empty theme.name');
            }

            const basedOn = config?.['based-on'] ?? config?.theme?.['based-on'];
            if (basedOn !== undefined && (typeof basedOn !== 'string' || basedOn.length === 0)) {
                throw new Error('"based-on" must be a non-empty theme name');
            }

            const components = {};
            const componentsPath = path.join(themeDir, 'components');
            if (fs.existsSync(componentsPath)) {
                const files = fs.readdirSync(componentsPath, { recursive: true })
                    .filter(file => file.endsWith('.yml'))
                    .map(file => path.join(componentsPath, file));

                for (const filePath of files) {
                    const fileComponents = YAML.parse(fs.readFileSync(filePath, 'utf8'));
                    if (!isObject(fileComponents)) {
                        throw new Error(`Components file ${filePath} must contain a YAML mapping`);
                    }

                    Object.assign(components, mergeComponents(components, fileComponents));
                }
            }

            return { name, basedOn, config, components };
        } catch (error) {
            logger.error(`Failed to read or parse theme ${themeDir}: ${error.message}`);
            return null;
        }
    }

    resolveTheme(themeName, rawThemes, resolvedThemes, resolving = []) {
        if (resolvedThemes.has(themeName)) {
            return resolvedThemes.get(themeName);
        }

        if (resolving.includes(themeName)) {
            throw new Error(`Circular theme inheritance: ${[...resolving, themeName].join(' -> ')}`);
        }

        const theme = rawThemes.get(themeName);
        if (!theme) {
            throw new Error(`Base theme "${themeName}" does not exist`);
        }

        let components = {};
        if (theme.basedOn) {
            const parent = this.resolveTheme(
                theme.basedOn,
                rawThemes,
                resolvedThemes,
                [...resolving, themeName]
            );
            components = parent.components;
        }

        const resolvedTheme = {
            ...theme,
            components: mergeComponents(components, theme.components)
        };
        resolvedThemes.set(themeName, resolvedTheme);
        return resolvedTheme;
    }

    getStyles() {
        const selectedTheme = this.themes.find(
            theme => theme.name === state.get('current-theme')
        );

        if (!selectedTheme) {
            throw new Error(`Theme "${state.get('current-theme')}" is not loaded`);
        }

        return selectedTheme.components;
    }
}
