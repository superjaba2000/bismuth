import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_NAME = 'bismuth';
const CONFIG_FILE_NAME = 'config.yml';
const MODULE_DIR = typeof __dirname === 'string' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const DEFAULTS_DIRS = [
    path.resolve(MODULE_DIR, '../defaults'),
    path.resolve(MODULE_DIR, '../src/defaults')
];

export const IS_DEV = process.env.NODE_ENV === 'development';

export default class Environment {
    static get IS_DEV() {
        return IS_DEV;
    }

    static get defaultsDir() {
        return DEFAULTS_DIRS.find(dir => fs.existsSync(dir)) ?? DEFAULTS_DIRS[0];
    }

    static get configDir() {
        if (this.IS_DEV) {
            return this.defaultsDir;
        }

        switch (process.platform) {
            case 'win32':
                return path.join(
                    process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'),
                    APP_NAME
                );

            case 'darwin':
                return path.join(os.homedir(), 'Library', 'Application Support', APP_NAME);

            default:
                return path.join(
                    process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config'),
                    APP_NAME
                );
        }
    }

    static get configFilePath() {
        return path.join(this.configDir, CONFIG_FILE_NAME);
    }

    static get defaultConfigFilePath() {
        return path.join(this.defaultsDir, CONFIG_FILE_NAME);
    }

    static get themesDir() {
        return path.join(this.configDir, 'themes');
    }

    static get defaultThemesDir() {
        return path.join(this.defaultsDir, 'themes');
    }

    static initialize() {
        if (this.IS_DEV) {
            return;
        }

        fs.mkdirSync(this.configDir, { recursive: true });

        if (!fs.existsSync(this.configFilePath)) {
            fs.copyFileSync(this.defaultConfigFilePath, this.configFilePath);
        }

        if (!fs.existsSync(this.themesDir)) {
            fs.cpSync(this.defaultThemesDir, this.themesDir, { recursive: true });
        }
    }
}