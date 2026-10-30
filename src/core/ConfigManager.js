import logger from "../util/logger.js";
import fs from 'node:fs';
import YAML from 'yaml';
import Environment from './Environment.js';

export default class ConfigManager {
    config = {};

    get(key) {
        return key.split('.').reduce((value, part) => value?.[part], this.config);
    }

    set(key, value) {
        this.config[key] = value;
        // this.writeConfig();
        logger.warn("The config has been changed, but the changes will not be written to the configuration file!");
    }

    get configDir() {
        return Environment.configDir;
    }

    get configFilePath() {
        return Environment.configFilePath;
    }

    readConfig() {
        const fileContent = fs.readFileSync(this.configFilePath, 'utf8');
        const defaultConfigContent = fs.readFileSync(Environment.defaultConfigFilePath, 'utf8');
        const defaultConfig = YAML.parse(defaultConfigContent);
        let parsedConfig = {};

        try {
            parsedConfig = YAML.parse(fileContent);
            logger.info(`Config file loaded from ${this.configFilePath}`);
        } catch (error) {
            logger.error(`Error parsing config file: ${error.message}`);
        }

        this.config = {
            ...defaultConfig,
            ...parsedConfig,
            binds: {
                ...defaultConfig?.binds,
                ...parsedConfig?.binds
            }
        };
    }
}
