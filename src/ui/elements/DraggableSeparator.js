import blessed from 'reblessed';
import UIElement from './UIElement.js';

export default class DraggableSeparator extends UIElement {
    enabled = false;
    dragging = false;
    styleName;
    screen;
    originalColor;
    fixedTop;
    minX;
    maxX;
    dragTolerance;
    dragHandle;
    isDraggable;

    resolveLimit(value, width, name, fallback) {
        if (value === undefined) {
            return fallback;
        }

        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === 'string' && /^\d+(?:\.\d+)?%$/.test(value)) {
            return Math.round(Number.parseFloat(value) / 100 * width);
        }

        throw new Error(`Separator "${this.styleName}" ${name} must be a number or percentage`);
    }

    getXBounds() {
        const width = this.screen.width;
        const min = Math.max(
            0,
            Math.min(width - 1, this.resolveLimit(this.minX, width, 'min-x', 0))
        );
        const max = Math.max(
            0,
            Math.min(width - 1, this.resolveLimit(this.maxX, width, 'max-x', width - 1))
        );
        if (min > max) {
            throw new Error(`Separator "${this.styleName}" min-x cannot exceed max-x`);
        }
        return { min, max };
    }

    clampX() {
        const { min, max } = this.getXBounds();
        this.e.left = Math.max(min, Math.min(max, this.e.left));
    }

    getDragTolerance() {
        const tolerance = this.dragTolerance ?? 0;
        if (!Number.isInteger(tolerance) || tolerance < 0) {
            throw new Error(`Separator "${this.styleName}" drag-tolerance must be a non-negative integer`);
        }
        return tolerance;
    }

    constructor(styleName, screen) {
        super();
        this.styleName = styleName;
        this.screen = screen;
    }

    init(styles) {
        const style = styles[this.styleName];
        const lineStyle = { ...style };
        delete lineStyle.draggable;
        this.e = blessed.line(lineStyle);
        this.originalColor = style.style?.fg ?? this.e.style.fg;
        this.fixedTop = style.top;
        this.minX = style['min-x'];
        this.maxX = style['max-x'];
        this.dragTolerance = style['drag-tolerance'];
        this.isDraggable = style.draggable === true;
        const tolerance = this.getDragTolerance();
        this.dragHandle = blessed.box({
            top: style.top,
            left: style.left,
            width: tolerance * 2 + 1,
            height: style.height,
            content: '',
            transparent: true,
            style: { transparent: true },
            draggable: this.isDraggable
        });
        // Keep the hit area interactive without painting its blank cells.
        this.dragHandle._noFill = true;

        this.dragHandle.on('mousedown', () => {
            if (!this.isDraggable) {
                return;
            }
            this.dragging = true;
            this.e.style.fg = 'white';
            this.emit('needs-rerender');
        });
        this.dragHandle.on('mouseout', () => {
            if (!this.dragging) {
                this.restoreColor();
            }
        });
        this.screen.on('mouse', event => {
            if (event.action === 'mouseup' && this.dragging) {
                this.dragging = false;
                this.restoreColor();
            }
        });
        this.screen.on('prerender', () => this.prerender());
    }

    restoreColor() {
        if (this.e.style.fg === this.originalColor) {
            return;
        }

        this.e.style.fg = this.originalColor;
        this.emit('needs-rerender');
    }

    prerender() {
        if (!this.enabled || !this.e.parent || !this.dragHandle.parent) {
            return;
        }

        const previousLeft = this.e.left;
        const previousTop = this.e.top;
        const tolerance = this.getDragTolerance();
        this.e.left = this.dragHandle.left + tolerance;
        this.e.top = this.fixedTop;
        this.clampX();
        this.dragHandle.left = this.e.left - tolerance;
        this.dragHandle.top = this.fixedTop;

        if (this.e.left !== previousLeft || this.e.top !== previousTop) {
            this.emit('drag');
        }
    }

    appendTo(parent) {
        super.appendTo(parent);
        this.clampX();
        this.dragHandle.left = this.e.left - this.getDragTolerance();
        this.dragHandle.top = this.fixedTop;
        parent.append(this.dragHandle);
    }

    show() {
        this.enabled = true;
        super.show();
        this.dragHandle.show();
    }

    hide() {
        this.enabled = false;
        this.dragging = false;
        this.restoreColor();
        super.hide();
        this.dragHandle.hide();
    }
}
