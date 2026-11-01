import blessed from 'reblessed';
import logger from '../../util/logger.js';
import { screenSize } from '../../util/util.js';
import DraggableSeparator from '../elements/DraggableSeparator.js';
import { app, screen, state } from '../../app.js';
import UITab from './UITab.js';

// old old code
// export function update_playlist() {
//     tab_files_playlist.clearItems();
//     for (const track of current_playlist.tracks) {
//         tab_files_playlist.add(_track_content(track));
//     }
// }

export default class FilesTab extends UITab {
    name = 'files';

    init(styles) { 
        logger.debug('[FilesTab] Initializing...');

        const playlist =  blessed.list(styles['tab1-playlist']);
        const playlistHeader = blessed.box(styles['tab1-playlist-header']);

        const fileManager = blessed.filemanager(styles['tab1-filemanager']);

        app.as.on('track-changed', () => this.updatePlaylist());
        app.as.on('output-error', error => {
            this.emit('message', `Audio output failed: ${error.message}`, 5);
        });

        fileManager.on('file', async filePath => {
            this.emit('message', 'Loading file...', 0);

            try {
                const track = await app.as.loadAndPlayFile(filePath);
                this.updatePlaylist();
                this.emit('message', `Playing: ${track.title}`, 2);
            } catch (error) {
                logger.errorWithContext(`Failed to play selected file "${filePath}"`, error, {
                    state: state.getDiagnostics(),
                    audio: app.as.getDiagnostics()
                });
                this.emit('message', `Could not play file: ${error.message}`, 5);
            }
        });

        fileManager.refresh(process.cwd(), () => {
            if(this.isActive) {
                fileManager.focus();
            }
        });

        const separator = this.addChild('separator', new DraggableSeparator('tab1-separator', screen));
        separator.on('drag', () => {
            this.resize();
        });
        this.addChild('playlist', playlist);
        this.addChild('playlist-header', playlistHeader);
        this.addChild('filemanager', fileManager);
        this.updatePlaylist();

        super.init(styles);
        logger.debug('[FilesTab] initialized');
    }

    updatePlaylist() {
        const playlist = this.getChild('playlist').e;
        const tracks = state.get('current-playlist')?.tracks ?? [];
        const currentTrack = state.get('current-track');
        playlist.clearItems();
        for (const track of tracks) {
            const marker = track === currentTrack ? '> ' : '  ';
            playlist.add(`${marker}${track.title} - ${track.artist}`);
        }
    }

    resize() {
        const separator = this.getChild('separator');
        separator.clampX();
        const s = separator.e;
        const p = this.getChild('playlist').e;
        const ph = this.getChild('playlist-header').e;
        const fm = this.getChild('filemanager').e;

        p.width = s.left - 2;
        ph.width = p.width;
        fm.left = s.left + 2;
        fm.width = screenSize().width - s.left - 3;
    }

    prerender() {
        this.resize();
        super.prerender();
    }

    show() {
        super.show();
        this.getChild('filemanager').e.focus();
    }
}