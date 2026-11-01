import logger from "../../util/logger.js";
import { state } from '../../app.js';
import UIElement from '../elements/UIElement.js';

export default class UITab extends UIElement {
    name = 'tab';

    get isActive() {
        return state.get("active-tab") == this.name;
    }

    init(styles) {
        super.init(styles);
        state.on("change:active-tab", () => {
            if(this.isActive) {
                logger.debug(`Active tab changed to "${this.name}"`);
                this.show();
            } else {
                this.hide();
            }
        });
    }
}