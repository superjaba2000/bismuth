import { EventEmitter } from 'node:events';

export default class UIElement extends EventEmitter {
    e;
    children = new Map();

    constructor(element = null) {
        super();
        this.e = element;
    }

    get childrenList() {
        return [...this.children.values()];
    }

    addChild(name, child) {
        if (this.children.has(name)) {
            throw new Error(`UI child "${name}" already exists`);
        }

        const component = child instanceof UIElement ? child : new UIElement(child);

        component.on('needs-rerender', (...args) => this.emit('needs-rerender', ...args));
        component.on('message', (...args) => this.emit('message', ...args));
        this.children.set(name, component);
        return component;
    }

    getChild(name) {
        const child = this.children.get(name);
        if (!child) {
            throw new Error(`UI child "${name}" does not exist`);
        }
        return child;
    }

    init(styles) {
        for (const child of this.childrenList) {
            child.init(styles);
        }
    }

    appendTo(parent) {
        const childParent = this.e ?? parent;
        if (this.e) {
            parent.append(this.e);
        }

        for (const child of this.childrenList) {
            child.appendTo(childParent);
        }
    }

    show() {
        this.e?.show();
        for (const child of this.childrenList) {
            child.show();
        }
    }

    hide() {
        this.e?.hide();
        for (const child of this.childrenList) {
            child.hide();
        }
    }

    prerender() {
        for (const child of this.childrenList) {
            child.prerender();
        }
    }
}