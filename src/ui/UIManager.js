import blessed from 'reblessed';
import logger from '../util/logger.js';
import { screen } from '../app.js';
import MessageBox from './elements/MessageBox.js';
import PlayerBox from './elements/PlayerBox.js';
import ThemeManager from './ThemeManager.js';
import TabManager from './TabManager.js';

export default class UIManager{
    themeManager;
    tabManager;
    playerBox;
    messageBox;

    currentStyles = {};

    constructor() {
        this.messageBox = new MessageBox();
        this.playerBox = new PlayerBox();

        this.themeManager = new ThemeManager();
        this.tabManager = new TabManager();
    }

    nextTab() {
        this.tabManager.nextTab();
    }

    init() {
        logger.info('[UI] initializing ui...');

        process.title = 'Bismuth Player';

        this.themeManager.load();
        this.currentStyles = this.themeManager.getStyles();

        this.playerBox.init(this.currentStyles);
        this.playerBox.on('needs-rerender', () => this.render());

        this.tabManager.init(this.currentStyles);
        this.tabManager.on('needs-rerender', () => this.render());
        this.tabManager.on('message', (text, timeout) => this.messageBox.display(text, timeout));

        // after all to be on top
        this.messageBox.init(this.currentStyles);
        this.messageBox.on('needs-rerender', () => this.render());

        logger.info('[UI] ui initialized');
    }

    appendToScreen() {
        this.playerBox.appendTo(screen);
        this.messageBox.appendTo(screen);
        this.tabManager.appendTo(screen);

        this.tabManager.update();
        this.playerBox.update();
    }

    render() {
        this.tabManager.prerender();
        this.playerBox.prerender();

        screen.render();
    }
}
