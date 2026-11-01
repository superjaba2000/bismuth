import blessed from 'reblessed';
import UIElement from './UIElement.js';
import { state } from '../../app.js';

export default class PlaylistElement extends UIElement {
    selectedTrack = null;
    updating = false;
    basicTrackPrefix = '';
    currentTrackPrefix = '';

    init(styles) {
        this.basicTrackPrefix = styles['basic-track-prefix'] || '  ';
        this.currentTrackPrefix = styles['current-track-prefix'] || '> ';
        this.addChild('list', blessed.list(styles['tab-playlist-list']));

        this.getChild('list').e.on('select item', (_, index) => {
            if (this.updating) {
                return;
            }

            const tracks = state.get('current-playlist')?.tracks ?? [];
            this.selectedTrack = tracks[index] ?? null;
            this.emit('track-focused', this.selectedTrack);
        });

        this.updatePlaylist();
        super.init(styles);
    }

    updatePlaylist() {
        const list = this.getChild('list').e;
        const tracks = state.get('current-playlist')?.tracks ?? [];
        const currentTrack = state.get('current-track');
        const selectedTrack = tracks.includes(this.selectedTrack)
            ? this.selectedTrack
            : tracks.includes(currentTrack) ? currentTrack : tracks[0] ?? null;

        this.updating = true;
        list.setItems(tracks.map(track => {
            const prefix = track === currentTrack
                ? this.currentTrackPrefix
                : this.basicTrackPrefix;
            return `${prefix}${track.title} - ${track.artist}`;
        }));

        const selectedIndex = tracks.indexOf(selectedTrack);
        if (selectedIndex >= 0) {
            list.select(selectedIndex);
        }
        this.updating = false;

        this.selectedTrack = selectedTrack;
        this.emit('track-focused', selectedTrack);
    }

    focus() {
        this.getChild('list').e.focus();
    }

    resize(left, width) {
        const list = this.getChild('list').e;
        list.left = left;
        list.width = width;
    }
}
