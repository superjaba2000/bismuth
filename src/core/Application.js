import { EventEmitter } from "node:events";
import blessed from "reblessed";
import logger from "../util/logger.js";
import ConfigManager from "./ConfigManager.js";
import ApplicationState from "./ApplicationState.js";
import KeybindsManager from "./KeybindsManager.js";
import UIManager from "../ui/UIManager.js";
import AudioSystem from "../audio/AudioSystem.js";
import Environment from "./Environment.js";


export default class Application extends EventEmitter {
    config = new ConfigManager();
    state = new ApplicationState();
    binds = new KeybindsManager();
    as = new AudioSystem();
    ui = new UIManager();

    screen;
    
    constructor() {
        super();
        this.screen = blessed.screen({
            smartCSR: true,
            terminal: 'xterm-256color',
            fullUnicode: false
        });

        this.screen.key(['C-c'], () => process.exit(0));
    }

    init() {
        logger.info('started Application.init()');

        Environment.initialize();

        this.config.readConfig();
        this.state.init();
        this.binds.init();
        this.as.init();
        this.ui.init();
        this.ui.appendToScreen();

        this.on('ui:play-pause', () => this.runAudioCommand(() => this.as.playPause()));
        this.on('ui:next-track', () => this.runAudioCommand(() => this.as.nextTrack()));
        this.on('ui:previous-track', () => this.runAudioCommand(() => this.as.previousTrack()));
        this.on('ui:change-repeat-type', () => this.runAudioCommand(() => this.as.changeRepeatType()));
        this.on('ui:seek', position => this.runAudioCommand(() => this.as.rewindTo(position)));

        for (const key of ['current-track', 'current-position', 'playback-state']) {
            this.state.on(`change:${key}`, () => {
                this.ui.playerBox.update();
                this.ui.render();
            });
        }

        logger.info('Application.init() finished');
    }

    runAudioCommand(command) {
        try {
            command();
        } catch (error) {
            logger.errorWithContext('Audio command failed', error, {
                state: this.state.getDiagnostics(),
                audio: this.as.getDiagnostics()
            });
            this.ui.messageBox.display(`Audio playback failed: ${error.message}`, 5);
        }
    }

    fire(eventName, ...args) {
        this.emit(eventName, ...args);
    }
}