import { EventEmitter } from "node:events";
import logger from '../util/logger.js';
import Track from '../tracks/Track.js';
import Playlist from '../tracks/Playlist.js';
import { config } from '../app.js';

export default class ApplicationState extends EventEmitter {
    _state = {};
    
    init() {
        this.set("current-track", new Track());
        this.set("current-playlist", new Playlist());

        this.set("current-position", 0);
        this.set("playback-state", "paused"); // or playing
        this.set("volume", 0.5);
        this.set("muted", false);
        this.set("repeat-type", 'none');
        this.set("shuffle", false);

        this.set("active-tab", config.get("show-welcome-screen") ? "welcome" : "files");
        this.set("current-theme", config.get("theme"));
    }

    set(key, value) {
        if(this._state[key] == value) return false;

        logger.debug("state changed", key, value)

        this._state[key] = value;
        this.emit(`change:${key}`, value);

        return true;
    }

    get(key) {
        return this._state[key];
    }
}
