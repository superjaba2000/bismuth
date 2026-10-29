import blessed from 'reblessed';
import UIElement from './UIElement.js';
import ProgressBar from './playerBoxElements/ProgressBar.js';
import CentralButtons from './playerBoxElements/CentralButtons.js';
import RightButtons from './playerBoxElements/RightButtons.js';
import { state } from '../../app.js';

// extends UITab but really a element (with some children)
export default class PlayerBox extends UIElement {
    children = [];

    constructor() {
        super();
        this.progressBar = new ProgressBar();
        this.centralButtons = new CentralButtons();
        this.rightButtons = new RightButtons();
    }

    init(styles) {
        this.e = blessed.box(styles['player-box']);

        this.progressBar.init(styles);
        this.progressBar.on('needs-rerender', () => this.emit('needs-rerender'));
        
        this.centralButtons.init(styles);
        this.centralButtons.on('needs-rerender', () => this.emit('needs-rerender'));

        this.rightButtons.init(styles);
        this.rightButtons.on('needs-rerender', () => this.emit('needs-rerender'));
    }

    appendTo(parent) {
        parent.append(this.e);

        this.progressBar.appendTo(this.e);
        this.centralButtons.appendTo(this.e);
        this.rightButtons.appendTo(this.e);
    }

    show() {
        super.show();

        this.progressBar.show();
        this.centralButtons.show();
        this.rightButtons.show();
    }

    update() {
        const track = state.get('current-track');
        const duration = track?.duration ?? 0;
        const position = state.get('current-position') ?? 0;
        this.progressBar.setPercent(duration > 0 ? position / duration * 100 : 0);
        this.centralButtons.update();
        this.rightButtons.update();
    }
}