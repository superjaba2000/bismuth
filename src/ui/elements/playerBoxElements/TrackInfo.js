import blessed from 'reblessed';
import { screen, state } from '../../../app.js';
import UIElement from '../UIElement.js';

export default class TrackInfo extends UIElement {
    init(styles) {
        this.styles = styles;
        this.addChild('time', blessed.box(styles['track-time']));
        this.addChild('title', blessed.box(styles['track-title']));
        this.addChild('artist', blessed.box(styles['track-artist']));

        state.on('change:current-track', () => this.update());
        state.on('change:current-position', () => this.update());

        super.init(styles);
    }

    get track() {
        return state.get('current-track');
    }

    get maxTitleLength() {
        return Math.floor(screen.width / 4);
    }

    get maxArtistLength() {
        return Math.max(0, Math.floor(screen.width / 2 - 14) - this.getChild('title').e.width);
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
        const trackTime = this.getChild('time').e;
        const trackTitle = this.getChild('title').e;
        const trackArtist = this.getChild('artist').e;
        const title = this.truncate(this.track?.title ?? 'Track title', this.maxTitleLength);
        const artist = this.truncate(`- ${this.track?.artist ?? 'Unknown'}`, this.maxArtistLength);

        trackTime.setContent(this.trackTimeContent);
        trackTitle.setContent(title);
        trackTitle.width = Math.min(title.length, this.maxTitleLength);
        trackArtist.setContent(artist);
        trackArtist.width = Math.min(artist.length, this.maxArtistLength);
        trackArtist.left = this.styles['track-title'].left + trackTitle.width + 1;

        this.emit('needs-rerender');
    }
}
