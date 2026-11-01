export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function screenSize() {
    return {
        width: process.stdout.columns,
        height: process.stdout.rows
    };
}