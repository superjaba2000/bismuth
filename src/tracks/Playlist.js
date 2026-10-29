export default class Playlist {
    tracks = [];

    current_position = 0;
    shuffle = false;

    shuffled_tracks = [];

    constructor(tracks = []) {
        this.tracks = tracks;
    }

    get _tracks() {
        return this.shuffle ? this.shuffled_tracks : this.tracks;
    }

    get current_track() {
        return this._tracks[this.current_position];
    }

    get is_last_track() {
        return this.current_position === (this._tracks.length - 1);
    }

    get next_position() {
        return this._tracks.length === 0
            ? 0
            : (this.current_position + 1) % this._tracks.length;
    }

    get next_track() {
        return this._tracks[this.next_position];
    }

    get length() {
        return this._tracks.length;
    }

    next() {
        this.current_position = this.next_position;
    }

    shuffle_tracks(currentTrack = this.current_track) {
        this.shuffled_tracks = this.tracks.slice();

        for (let i = this.shuffled_tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [this.shuffled_tracks[i], this.shuffled_tracks[j]] =
                [this.shuffled_tracks[j], this.shuffled_tracks[i]];
        }

        const currentIndex = this.shuffled_tracks.indexOf(currentTrack);
        if (currentIndex > 0) {
            [this.shuffled_tracks[0], this.shuffled_tracks[currentIndex]] =
                [this.shuffled_tracks[currentIndex], this.shuffled_tracks[0]];
        }
        this.current_position = 0;

        return this;
    }

    add(track) {
        this.tracks.push(track);
        if (this.shuffle) {
            this.shuffled_tracks.push(track);
        }

        return this;
    }

    remove_index(index) {
        if (index < 0 || index >= this.tracks.length) {
            return this;
        }

        const [removedTrack] = this.tracks.splice(index, 1);
        this.shuffled_tracks = this.shuffled_tracks.filter(track => track !== removedTrack);
        if (this.current_position >= this._tracks.length) {
            this.current_position = Math.max(0, this._tracks.length - 1);
        }

        return this;
    }

    remove(track) {
        const index = this.tracks.indexOf(track);
        if (index < 0) {
            return this;
        }
        return this.remove_index(index);
    }
}