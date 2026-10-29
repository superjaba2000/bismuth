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

        this.buttonPlay = blessed.box(styles['button-play']);
        this.buttonPrev = blessed.box(styles['button-prev']);
        this.buttonNext = blessed.box(styles['button-next']);
    
        this.buttonPlay.on('click', () => fire('ui:play-pause'));
        this.buttonPrev.on('click', () => fire('ui:previous-track'));
        this.buttonNext.on('click', () => fire('ui:next-track'));

        state.on('change:current-track', () => this.update());
        state.on('change:playback-state', () => this.update());
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
        this.buttonPlay.setContent(this.buttonPlayContent);
        this.buttonNext.setContent(this.buttonNextContent);
        this.buttonPrev.setContent(this.buttonPrevContent);

        this.emit('needs-rerender');
    }

    appendTo(playerBox) {
        playerBox.append(this.buttonPlay);
        playerBox.append(this.buttonPrev);
        playerBox.append(this.buttonNext);
    }
}