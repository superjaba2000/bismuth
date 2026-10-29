import logger from "../util/logger.js";
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import YAML from 'yaml';

const APP_NAME = 'bismuth/';
const CONFIG_FILE_NAME = 'config.yml';
const BASE_CONFIG = {
    "theme": "basic",
    "show-welcome-screen": true,
    "binds": {
        "change-tab": ["tab"],
        "play-pause": ["space"],
        "next-track": ["right"],
        "previous-track": ["left"],
    }
};

export default class ConfigManager {
    config = {};

    constructor() {
        this.config = BASE_CONFIG;
    }

    get(key) {
        return key.split('.').reduce((value, part) => value?.[part], this.config);
    }

    set(key, value) {
        this.config[key] = value;
        this.writeConfig();
    }

    get configDir() {
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

    get configFilePath() {
        return path.join(this.configDir, CONFIG_FILE_NAME);
    }

    createConfigDir() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
            logger.info(`Created config directory at ${this.configDir}`);
        }

        if (!fs.existsSync(this.configFilePath)) {
            fs.writeFileSync(this.configFilePath, "", 'utf8');
            this.writeConfig();
            logger.info(`Created config file at ${this.configFilePath}`);
        }
    }

    readConfig() {
        this.createConfigDir();

        const fileContent = fs.readFileSync(this.configFilePath, 'utf8');
        let parsedConfig = {};

        try {
            parsedConfig = YAML.parse(fileContent);
            logger.info(`Config file loaded from ${this.configFilePath}`);
        } catch (error) {
            logger.error(`Error parsing config file: ${error.message}`);
        }

        this.config = {
            ...BASE_CONFIG,
            ...parsedConfig,
            binds: {
                ...BASE_CONFIG.binds,
                ...parsedConfig?.binds
            }
        };
    }

    writeConfig() {
        this.createConfigDir();

        const yamlContent = YAML.stringify(this.config);
        fs.writeFileSync(this.configFilePath, yamlContent, 'utf8');
        logger.info(`Config file written to ${this.configFilePath}`);
    }
}
