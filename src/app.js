import logger from './util/logger.js';
import Application from './core/Application.js';

export const app = new Application();

export const config = app.config;
export const state = app.state;
export const screen = app.screen;
export const as = app.as;
export const ui = app.ui;

export function fire(...args) { app.fire(...args); };

app.init();
