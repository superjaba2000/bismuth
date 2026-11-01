import blessed from "reblessed";
import UIElement from "./UIElement.js";

export default class MessageBox extends UIElement {
    init(styles) {
        this.e = blessed.message(styles['message-box']);
        this.hide();
    }

    display(text, timeout) {
        this.e.display(text, timeout);
        this.emit('needs-rerender');
    }
}