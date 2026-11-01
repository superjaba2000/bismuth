import { EventEmitter } from "node:events";
import logger from '../util/logger.js';
import Track from '../tracks/Track.js';
import Playlist from '../tracks/Playlist.js';
import { config } from '../app.js';

export default class ApplicationState extends EventEmitter {
    _state = {};
    lastPositionLog = null;
    
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
        const previousValue = this._state[key];
        if (previousValue == value) return false;

        this.logChanges(key, value, previousValue);
        this._state[key] = value;
        this.emit(`change:${key}`, value);

        return true;
    }

    logChanges(key, value, previousValue) {
        if (key === 'current-position') {
            const position = Number(value);
            if (!Number.isFinite(position)) {
                logger.debug(`Playback position changed to an invalid value: ${value}`);
                return;
            }

            const isReset = position === 0 && Number(previousValue) > 0;
            const movedEnough = this.lastPositionLog === null
                || Math.abs(position - this.lastPositionLog) >= 10;

            if (isReset || movedEnough) {
                logger.debug(`Playback position: ${position.toFixed(2)}s`);
                this.lastPositionLog = position;
            }
            return;
        }

        if (key === 'current-track') {
            logger.info(`Current track changed: ${JSON.stringify(value?.toLogDetails() ?? null)}`);
            return;
        }

        if (key === 'current-playlist') {
            logger.info(`Playlist changed: ${value?.length ?? 0} track(s)`);
            return;
        }

        if (key === 'volume') {
            logger.debug(`State changed: ${key}=${Number(value).toFixed(2)}`);
            return;
        }

        logger.debug(`State changed: ${key}=${JSON.stringify(value)}`);
    }

    getDiagnostics() {
        const playlist = this.get('current-playlist');
        const tracks = playlist?._tracks ?? [];
        const currentTrack = this.get('current-track');
        const currentTrackIndex = tracks.indexOf(currentTrack);

        return {
            playbackState: this.get('playback-state'),
            currentPosition: this.get('current-position'),
            currentTrack: currentTrack?.toLogDetails() ?? null,
            playlist: {
                length: tracks.length,
                currentIndex: currentTrackIndex >= 0 ? currentTrackIndex + 1 : null,
                shuffle: Boolean(playlist?.shuffle)
            },
            repeatType: this.get('repeat-type'),
            volume: this.get('volume'),
            activeTab: this.get('active-tab')
        };
    }

    get(key) {
        return this._state[key];
    }
}
