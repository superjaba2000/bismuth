import blessed from 'reblessed';
import { screen, state } from '../../../app.js';
import UIElement from '../UIElement.js';

export default class TrackInfo extends UIElement {
    init(styles) {
        this.styles = styles;
        this.trackTime = blessed.box(styles['track-time']);
        this.trackTitle = blessed.box(styles['track-title']);
        this.trackArtist = blessed.box(styles['track-artist']);

        state.on('change:current-track', () => this.update());
        state.on('change:current-position', () => this.update());
    }

    get track() {
        return state.get('current-track');
    }

    get maxTitleLength() {
        return Math.floor(screen.width / 4);
    }

    get maxArtistLength() {
        return Math.max(0, Math.floor(screen.width / 2 - 14) - this.trackTitle.width);
    }

    get trackTimeContent() {
        const formatTime = seconds =>
            `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
        const position = state.get('current-position') ?? 0;
        const duration = this.track?.duration ?? 0;

        return this.track?.loaded
            ? `${formatTime(position)}|${formatTime(duration)}`
            : '00:00|00:00';
    }

    truncate(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }

        return maxLength <= 3 ? text.slice(0, maxLength) : `${text.slice(0, maxLength - 3)}...`;
    }

    update() {
        const title = this.truncate(this.track?.title ?? 'Track title', this.maxTitleLength);
        const artist = this.truncate(`- ${this.track?.artist ?? 'Unknown'}`, this.maxArtistLength);

        this.trackTime.setContent(this.trackTimeContent);
        this.trackTitle.setContent(title);
        this.trackTitle.width = Math.min(title.length, this.maxTitleLength);
        this.trackArtist.setContent(artist);
        this.trackArtist.width = Math.min(artist.length, this.maxArtistLength);
        this.trackArtist.left = this.styles['track-title'].left + this.trackTitle.width + 1;

        this.emit('needs-rerender');
    }

    appendTo(playerBox) {
        playerBox.append(this.trackTime);
        playerBox.append(this.trackTitle);
        playerBox.append(this.trackArtist);
    }

    show() {
        this.trackTime.show();
        this.trackTitle.show();
        this.trackArtist.show();
    }

    hide() {
        this.trackTime.hide();
        this.trackTitle.hide();
        this.trackArtist.hide();
    }
}
