import blessed from 'reblessed';
import UIElement from './UIElement.js';

const SLIDE_FRAMES = 3;
const PAUSE_FRAMES = 6;
const MS_PER_FRAME = 150;

export default class TabHeader extends UIElement {
    init(styles) {
        this.e = blessed.box(styles['tab-header']);
    }

    generateContent(tabName) {
        return `switch to tab: ${tabName}`;
    }

    changeTab(newTab) {
        this.e.setContent(this.generateContent(newTab.name));
        this.slideDown();
    }

    slideDown() {
        this.e.top = -3;
        this.show();
        this.animationFrame = 0;
        clearInterval(this.animationInterval);

        this.animationInterval = setInterval(() => {
            if (this.animationFrame < SLIDE_FRAMES) {
                // slide down
                this.e.top += 1;
                this.emit('needs-rerender');
            } else if(this.animationFrame <= SLIDE_FRAMES + PAUSE_FRAMES) {
                // show
            } else {
                clearInterval(this.animationInterval);
                this.slideUp();
            }

            this.animationFrame += 1;
        }, MS_PER_FRAME);
    }

    slideUp() {
        // this.e.top = 0;
        this.animationFrame = 0;
        clearInterval(this.animationInterval);

        this.animationInterval = setInterval(() => {
            if (this.animationFrame < SLIDE_FRAMES) {
                this.e.top -= 1;
                this.emit('needs-rerender');
            } else {
                this.hide();
                this.emit('needs-rerender');
                clearInterval(this.animationInterval);
            }

            this.animationFrame += 1;
        }, MS_PER_FRAME);
    }
}