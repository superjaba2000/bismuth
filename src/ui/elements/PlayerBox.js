import blessed from 'reblessed';
import UIElement from './UIElement.js';
import ProgressBar from './playerBoxElements/ProgressBar.js';
import CentralButtons from './playerBoxElements/CentralButtons.js';
import RightButtons from './playerBoxElements/RightButtons.js';
import TrackInfo from './playerBoxElements/TrackInfo.js';
import { state } from '../../app.js';

export default class PlayerBox extends UIElement {
    constructor() {
        super();
        this.addChild('progress-bar', new ProgressBar());
        this.addChild('central-buttons', new CentralButtons());
        this.addChild('right-buttons', new RightButtons());
        this.addChild('track-info', new TrackInfo());
    }

    init(styles) {
        this.e = blessed.box(styles['player-box']);
        super.init(styles);
    }

    update() {
        const track = state.get('current-track');
        const duration = track?.duration ?? 0;
        const position = state.get('current-position') ?? 0;
        this.getChild('progress-bar').setPercent(duration > 0 ? position / duration * 100 : 0);
        this.getChild('central-buttons').update();
        this.getChild('right-buttons').update();
        this.getChild('track-info').update();
    }
}