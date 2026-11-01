import blessed from 'reblessed';
import { app, screen, state } from '../../app.js';
import { screenSize } from '../../util/util.js';
import DraggableSeparator from '../elements/DraggableSeparator.js';
import PlaylistElement from '../elements/PlaylistElement.js';
import UITab from './UITab.js';

export default class PlaylistTab extends UITab {
    name = 'playlist';
    leftPanelWidth = null;

    init(styles) {
        this.addChild('info-panel', blessed.box(styles['tab-playlist-info-panel']));
        this.addChild('track-title', blessed.box(styles['tab-playlist-track-title']));
        this.addChild('track-artist', blessed.box(styles['tab-playlist-track-artist']));
        const separator = this.addChild(
            'separator',
            new DraggableSeparator('tab-playlist-separator', screen)
        );
        separator.on('drag', () => {
            this.leftPanelWidth = separator.e.left;
            this.updatePlaylistLayout();
        });
        this.addChild('playlist-header', blessed.box(styles['tab-playlist-header']));
        this.addChild('playlist', new PlaylistElement());

        this.getChild('playlist').on('track-focused', track => {
            this.getChild('track-title').e.setContent(track?.title ?? '');
            this.getChild('track-artist').e.setContent(track?.artist ?? '');
            this.emit('needs-rerender');
        });

        app.as.on('track-changed', () => this.getChild('playlist').updatePlaylist());
        state.on('change:current-track', () => this.getChild('playlist').updatePlaylist());

        super.init(styles);
    }

    appendTo(parent) {
        super.appendTo(parent);
        if (this.leftPanelWidth === null) {
            const width = screenSize().width;
            this.leftPanelWidth = Math.floor((Number.isFinite(width) ? width : 80) * 0.35);
        }
        this.updatePlaylistLayout();
    }

    updatePlaylistLayout() {
        const terminalWidth = screenSize().width;
        const width = Number.isFinite(terminalWidth) ? terminalWidth : 80;
        const separator = this.getChild('separator');
        separator.e.left = this.leftPanelWidth ?? Math.floor(width * 0.35);
        separator.clampX();
        const leftPanelWidth = separator.e.left;
        this.leftPanelWidth = leftPanelWidth;

        this.getChild('info-panel').e.width = Math.max(1, leftPanelWidth - 2);
        this.getChild('track-title').e.width = Math.max(1, leftPanelWidth - 6);
        this.getChild('track-artist').e.width = Math.max(1, leftPanelWidth - 6);
        this.getChild('playlist-header').e.left = leftPanelWidth + 2;
        this.getChild('playlist-header').e.width = Math.max(1, width - leftPanelWidth - 3);
        this.getChild('playlist').resize(
            leftPanelWidth + 2,
            Math.max(1, width - leftPanelWidth - 3)
        );
    }

    updatePlaylist() {
        this.getChild('playlist').updatePlaylist();
    }

    prerender() {
        this.updatePlaylistLayout();
        super.prerender();
    }

    show() {
        super.show();
        this.getChild('playlist').focus();
    }
}
