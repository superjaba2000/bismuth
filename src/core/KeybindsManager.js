import logger from "../util/logger.js";
import { config, screen, ui, fire } from "../app.js";

export default class KeybindsManager {
    initialized = false;

    init() {
        if (this.initialized) {
            return;
        }

        logger.info('started KeybindsManager.init()');

        screen.key(config.get('binds.change-tab'), () => {
            ui.nextTab();
        });

        screen.key(config.get('binds.play-pause'), () => {
            fire("ui:play-pause");
        });

        screen.key(config.get('binds.next-track'), () => {
            fire("ui:next-track");
        });

        screen.key(config.get('binds.previous-track'), () => {
            fire("ui:previous-track");
        });

        this.initialized = true;
        logger.info('KeybindsManager.init() finished');
    }
}
