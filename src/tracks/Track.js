export default class Track{
    path = null;
    metadata = {};
    audioBuffer = null;

    constructor(path) {
        this.path = path;
    }

    get loaded() {
        return this.audioBuffer !== null;
    }

    get title() {
        return this.loaded ? this.metadata.title : 'Track not loaded';
    }

    get artist() {
        return this.loaded ? this.metadata.artist : 'Unknown';
    }

    get duration() {
        return this.loaded ? (this.audioBuffer.duration || this.metadata.duration || 0) : 0;
    }

    toLogDetails() {
        return {
            title: this.title,
            artist: this.artist,
            duration: Number.isFinite(this.duration) ? Number(this.duration.toFixed(2)) : null,
            loaded: this.loaded
        };
    }

    async load(loader, audioContext) {
        if (!loader || !audioContext) {
            throw new Error('AudioLoader and AudioContext are required to load a track');
        }

        return loader.load(this, audioContext);
    }
}