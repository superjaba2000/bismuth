import blessed from 'reblessed';
import UIElement from '../UIElement.js';
import { fire, state } from '../../../app.js';

export default class ProgressBar extends UIElement {
    percent = 0;
    mouseDown = false;

    activeChar;
    inactiveChar;
    activeColor;
    inactiveColor;

    init(styles) {
        this.e = blessed.box(styles['progress-bar-box']);

        this.activeChar = styles['progress-bar-char1'] || '-';
        this.inactiveChar = styles['progress-bar-char0'] || '-';
        this.activeColor = styles['progress-bar-color1'];
        this.inactiveColor = styles['progress-bar-color0'];

        this.e.on('mouse', data => {
            if (data.action === 'mousedown' && data.button === 'left') {
                this.mouseDown = true;
                return;
            }

            if (data.action !== 'mouseup' || data.button !== 'left' || !this.mouseDown) {
                return;
            }

            this.mouseDown = false;

            const track = state.get('current-track');
            if (!track?.loaded || !Number.isFinite(track.duration) || track.duration <= 0) {
                return;
            }

            const width = Math.max(1, this.e.width);
            const progress = Math.max(0, Math.min(1, (data.x - this.e.aleft) / width));
            fire('ui:seek', progress * track.duration);
        });
    }

    update() {
        const width = Math.max(0, Math.floor(this.e.width));
        const percent = Number.isFinite(this.percent)
            ? Math.max(0, Math.min(100, this.percent))
            : 0;
        const activeLength = Math.floor(percent / 100 * width);
        const inactiveLength = width - activeLength;
        this.e.content = '\n' + // 2 chars heigth (larger area to click)
            `{${this.activeColor}-fg}${this.activeChar.repeat(activeLength)}` + 
            `{${this.inactiveColor}-fg}${this.inactiveChar.repeat(inactiveLength)}`;
        this.emit('needs-rerender');
    }

    setPercent(percent) {
        this.percent = percent;
        this.update();
    }
}