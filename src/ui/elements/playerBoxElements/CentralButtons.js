import blessed from "reblessed";
import UIElement from "../UIElement.js";
import { state, fire } from '../../../app.js';

export default class CentralButtons extends UIElement {
    // TODO custom chars and colors from styles
    activeColor;
    inactiveColor;

    active = true;
    styles = {};
    
    init(styles) {
        this.styles = styles;

        const buttonPlay = this.addChild('play', blessed.box(styles['button-play'])).e;
        const buttonPrev = this.addChild('previous', blessed.box(styles['button-prev'])).e;
        const buttonNext = this.addChild('next', blessed.box(styles['button-next'])).e;
    
        buttonPlay.on('click', () => fire('ui:play-pause'));
        buttonPrev.on('click', () => fire('ui:previous-track'));
        buttonNext.on('click', () => fire('ui:next-track'));

        state.on('change:current-track', () => this.update());
        state.on('change:playback-state', () => this.update());
        super.init(styles);
    }

    get buttonPlayContent() {
        if(!this.active) {
            return '{gray-fg}( {gray-fg}={gray-fg} )';
        }

        switch(state.get('playback-state')) {
            case 'paused':
                return '{white-fg}( {yellow-fg}>{white-fg} )';
            case 'playing':
                return '{white-fg}( {yellow-fg}={white-fg} )';
        }
    }

    get buttonPrevContent() {
        if(!this.active) {
            return '{gray-fg}({gray-fg} < {gray-fg})';
        }

        return '{white-fg}({yellow-fg} < {white-fg})';
    }
    
    get buttonNextContent() {
        if(!this.active) {
            return '{gray-fg}({gray-fg} > {gray-fg})';
        }

        return '{white-fg}({yellow-fg} > {white-fg})';
    }

    update() {
        this.active = Boolean(state.get('current-track')?.loaded);
        this.getChild('play').e.setContent(this.buttonPlayContent);
        this.getChild('next').e.setContent(this.buttonNextContent);
        this.getChild('previous').e.setContent(this.buttonPrevContent);

        this.emit('needs-rerender');
    }
}