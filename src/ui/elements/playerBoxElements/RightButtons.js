import blessed from 'reblessed';
import UIElement from '../UIElement.js';
import { fire, state } from '../../../app.js';

export default class RightButtons extends UIElement {
    styles = {};

    init(styles) {
        this.styles = styles;
        this.e = blessed.box(styles['button-repeat-type']);

        this.e.on('click', () => fire('ui:change-repeat-type'));
        state.on('change:repeat-type', () => this.update());
    }

    get buttonRepeatTypeContent() {
        const repeatType = state.get('repeat-type');

        if (repeatType === 'none') {
            return `{${this.styles['fg-color-inactive']}-fg}[ - ]`;
        }

        const symbol = repeatType === 'playlist' ? 'p' : '1';
        return `{${this.styles['button-repeat-type-fg']}-fg}[ ${symbol} ]`;
    }

    update() {
        this.e.setContent(this.buttonRepeatTypeContent);
        this.emit('needs-rerender');
    }
}
