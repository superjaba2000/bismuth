import fs from 'node:fs/promises';
import AudioDecoder from './AudioDecoder.js';
import AudioExplorer from './AudioExplorer.js';

export default class AudioLoader {
    constructor(explorer = new AudioExplorer(), decoder = new AudioDecoder()) {
        this.explorer = explorer;
        this.decoder = decoder;
        this.initialization = null;
    }

    async init() {
        if (!this.initialization) {
            this.initialization = Promise.all([
                this.explorer.init(),
                this.decoder.init()
            ]).catch(error => {
                this.initialization = null;
                throw error;
            });
        }

        await this.initialization;
    }

    async load(track, audioContext) {
        if (!track?.path) {
            throw new Error('A track with a file path is required');
        }
        if (!audioContext) {
            throw new Error('AudioContext is required to load a track');
        }

        await this.init();
        const file = await fs.stat(track.path);
        if (!file.isFile()) {
            throw new Error(`"${track.path}" is not a regular file`);
        }

        const metadata = await this.explorer.getInfo(track.path);
        const audioBuffer = await this.decoder.decode(track.path, { audioContext });

        track.metadata = metadata;
        track.audioBuffer = audioBuffer;
        return track;
    }
}
