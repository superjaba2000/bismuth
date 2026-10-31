import logger from '../util/logger.js';
import { EventEmitter } from 'node:events';
import { StreamAudioContext } from '@descript/web-audio-js';
import Speaker from 'speaker';
import path, { basename } from 'node:path';
import { state } from '../app.js';
import AudioLoader from './AudioLoader.js';
import Track from '../tracks/Track.js';

export default class AudioSystem extends EventEmitter {
    context = null;
    sourceNode = null;
    gainNode = null;
    speaker = null;
    loader = new AudioLoader();
    playbackStartTime = 0;
    playbackOffset = 0;
    isPlaying = false;
    currentPosition = 0;
    positionTimer = null;

    get currentTrack() {
        return state.get('current-track');
    }

    get currentPlaylist() {
        return state.get('current-playlist');
    }

    getDiagnostics() {
        return {
            contextState: this.context?.state ?? 'unavailable',
            sourceActive: Boolean(this.sourceNode),
            speaker: this.speaker
                ? {
                    destroyed: this.speaker.destroyed,
                    writableEnded: this.speaker.writableEnded
                }
                : 'unavailable',
            isPlaying: this.isPlaying,
            playbackOffset: Number(this.playbackOffset.toFixed(2)),
            trackPath: this.currentTrack?.path ? basename(this.currentTrack.path) : null
        };
    }

    createContext() {
        this.context = new StreamAudioContext();
        this.gainNode = this.context.createGain();
        this.gainNode.connect(this.context.destination);
        this.updateVolume();

        if (this.speaker) {
            this.context.pipe(this.speaker);
        }
    }

    closeContext() {
        const context = this.context;
        this.context = null;
        this.gainNode = null;

        if (context && context.state !== 'closed') {
            queueMicrotask(() => {
                if (context.state !== 'closed') {
                    context.close().catch(error => {
                        logger.errorWithContext('Failed to close audio context', error, {
                            state: state.getDiagnostics(),
                            audio: this.getDiagnostics()
                        });
                    });
                }
            });
        }
    }

    changeRepeatType() {
        const repeatTypes = ['none', 'playlist', 'track'];
        const currentIndex = repeatTypes.indexOf(state.get('repeat-type'));
        state.set('repeat-type', repeatTypes[(currentIndex + 1) % repeatTypes.length]);
    }

    setVolume(volume) {
        const boundedVolume = Math.max(0, Math.min(1, Number(volume) || 0));
        state.set('volume', boundedVolume);
    }

    toggleShuffle() {
        const enabled = !state.get('shuffle');
        const playlist = this.currentPlaylist;
        playlist.shuffle = enabled;

        if (enabled) {
            playlist.shuffle_tracks(this.currentTrack);
        } else {
            playlist.shuffled_tracks = [];
            const currentIndex = playlist.tracks.indexOf(this.currentTrack);
            playlist.current_position = Math.max(0, currentIndex);
        }

        state.set('shuffle', enabled);
    }

    init() {
        if (this.context) {
            return;
        }

        this.createContext();
        if (this.positionTimer) {
            return;
        }

        state.on('change:volume', () => this.updateVolume());
        this.positionTimer = setInterval(() => {
            if (!this.isPlaying) {
                return;
            }

            const position = this.getCurrentPosition();
            state.set('current-position', position);
            if (position >= this.currentTrack.duration) {
                this.handleTrackEnd();
            }
        }, 250);
        this.positionTimer.unref?.();

        logger.info('Audio system initialized.');
    }

    async loadAndPlayFile(filePath) {
        if (typeof filePath !== 'string' || filePath.length === 0) {
            throw new Error('No file path was selected');
        }
        if (!this.context || !this.gainNode) {
            this.createContext();
        }

        const absolutePath = path.resolve(filePath);
        let track = this.currentPlaylist.tracks.find(
            item => path.resolve(item.path) === absolutePath && item.loaded
        );

        if (!track) {
            track = await new Track(absolutePath).load(this.loader, this.context);
            this.currentPlaylist.add(track);
        }

        this.loadAndPlayTrack(track);
        return track;
    }

    loadAndPlayTrack(track) {
        if (!track?.loaded || !track.audioBuffer) {
            throw new Error('Selected track has no decoded audio');
        }
        if (!this.context || !this.gainNode) {
            throw new Error('Audio system is not initialized');
        }

        this.stopSource();

        this.currentPosition = 0;
        state.set('current-position', 0);
        state.set('current-track', track);
        this.emit('track-changed', track);
        this.playFrom(0);
    }

    createSpeaker(track) {
        if (this.speaker) {
            return this.speaker;
        }

        try {
            const speaker = new Speaker({
                channels: Math.min(track.audioBuffer.numberOfChannels || 2, 2),
                sampleRate: track.audioBuffer.sampleRate || 44100,
                bitDepth: 16
            });
            this.speaker = speaker;
            speaker.on('error', error => {
                if (this.speaker !== speaker) {
                    return;
                }

                logger.errorWithContext('Audio output failed', error, {
                    state: state.getDiagnostics(),
                    audio: this.getDiagnostics()
                });
                this.speaker = null;
                try {
                    speaker.close(false);
                } catch (closeError) {
                    logger.errorWithContext('Failed to close audio output', closeError, {
                        state: state.getDiagnostics(),
                        audio: this.getDiagnostics()
                    });
                }

                if (this.isPlaying) {
                    this.currentPosition = this.getCurrentPosition();
                    this.stopSource();
                    this.closeContext();
                    state.set('current-position', this.currentPosition);
                    state.set('playback-state', 'paused');
                } else {
                    this.closeContext();
                }
                this.emit('output-error', error);
            });
            this.context.pipe(speaker);
            return speaker;
        } catch (error) {
            this.speaker = null;
            logger.errorWithContext('Failed to initialize audio output', error, {
                state: state.getDiagnostics(),
                audio: this.getDiagnostics()
            });
            throw error;
        }
    }

    stopSource() {
        if (!this.sourceNode) {
            return;
        }

        this.sourceNode.onended = null;
        try {
            this.sourceNode.stop();
        } catch (error) {
            logger.debug('Audio source was already stopped:', error);
        }
        this.sourceNode = null;
        this.isPlaying = false;
    }

    updateVolume() {
        const volume = Math.max(0, Math.min(1, Number(state.get('volume')) || 0));
        if (volume !== state.get('volume')) {
            state.set('volume', volume);
        }
        if (this.gainNode) {
            this.gainNode.gain.value = volume;
        }
    }

    playFrom(position) {
        if (!this.currentTrack?.loaded || !this.currentTrack.audioBuffer) {
            throw new Error('No decoded track is loaded');
        }
        if (!this.context || !this.gainNode) {
            this.createContext();
        }

        this.createSpeaker(this.currentTrack);
        this.stopSource();
        const boundedPosition = Math.max(0, Math.min(position, this.currentTrack.duration));
        this.sourceNode = this.context.createBufferSource();
        this.sourceNode.buffer = this.currentTrack.audioBuffer;
        this.sourceNode.connect(this.gainNode);
        const sourceNode = this.sourceNode;
        sourceNode.onended = () => {
            if (this.sourceNode === sourceNode) {
                queueMicrotask(() => {
                    if (this.sourceNode === sourceNode) {
                        this.handleTrackEnd();
                    }
                });
            }
        };

        this.playbackStartTime = this.context.currentTime;
        this.playbackOffset = boundedPosition;
        this.currentPosition = boundedPosition;
        state.set('current-position', boundedPosition);
        this.sourceNode.start(0, boundedPosition);

        if (this.context.state === 'suspended') {
            this.context.resume().catch(error => {
                logger.errorWithContext('Failed to resume audio context', error, {
                    state: state.getDiagnostics(),
                    audio: this.getDiagnostics()
                });
            });
        }
        this.isPlaying = true;
        state.set('playback-state', 'playing');
        this.emit('playback-state', 'playing');
    }

    getCurrentPosition() {
        if (!this.isPlaying || !this.context || !this.currentTrack?.loaded) {
            return this.currentPosition;
        }

        this.currentPosition = Math.min(
            this.currentTrack.duration,
            this.playbackOffset + this.context.currentTime - this.playbackStartTime
        );
        return this.currentPosition;
    }

    playPause() {
        if (!this.currentTrack?.loaded) {
            logger.info('Cannot toggle playback: no track is loaded');
            return;
        }

        if (this.isPlaying) {
            this.currentPosition = this.getCurrentPosition();
            this.stopSource();
            this.closeContext();
            state.set('current-position', this.currentPosition);
            state.set('playback-state', 'paused');
            this.emit('playback-state', 'paused');
            return;
        }

        if (this.currentPosition >= this.currentTrack.duration) {
            this.currentPosition = 0;
        }
        this.playFrom(this.currentPosition);
    }

    rewindTo(position) {
        if (!this.currentTrack?.loaded) {
            logger.info('Cannot seek: no track is loaded');
            return;
        }

        const boundedPosition = Math.max(0, Math.min(position, this.currentTrack.duration));
        if (this.isPlaying) {
            this.playFrom(boundedPosition);
            return;
        }

        this.currentPosition = boundedPosition;
        state.set('current-position', boundedPosition);
    }

    handleTrackEnd() {
        if (!this.isPlaying) {
            return;
        }

        this.sourceNode = null;
        this.isPlaying = false;

        if (state.get('repeat-type') === 'track') {
            this.playFrom(0);
            return;
        }

        if (state.get('repeat-type') === 'playlist' && this.currentPlaylist.length > 0) {
            this.nextTrack();
            return;
        }

        this.currentPosition = this.currentTrack.duration;
        this.closeContext();
        state.set('current-position', this.currentPosition);
        state.set('playback-state', 'paused');
        this.emit('playback-state', 'paused');
    }

    nextTrack() {
        const tracks = this.currentPlaylist._tracks;
        if (tracks.length === 0) {
            logger.info('Cannot skip: playlist is empty');
            return;
        }

        const currentIndex = tracks.indexOf(this.currentTrack);
        const nextIndex = (currentIndex + 1) % tracks.length;
        this.loadAndPlayTrack(tracks[nextIndex]);
    }

    previousTrack() {
        if (!this.currentTrack?.loaded) {
            logger.info('Cannot go back: no track is loaded');
            return;
        }

        if (this.getCurrentPosition() > 3) {
            this.playFrom(0);
            return;
        }

        const tracks = this.currentPlaylist._tracks;
        const currentIndex = tracks.indexOf(this.currentTrack);
        if (tracks.length < 2 || currentIndex < 0) {
            this.playFrom(0);
            return;
        }

        const previousIndex = (currentIndex - 1 + tracks.length) % tracks.length;
        this.loadAndPlayTrack(tracks[previousIndex]);
    }

    destroy() {
        clearInterval(this.positionTimer);
        this.positionTimer = null;
        this.stopSource();
        this.closeContext();
        this.speaker?.close(false);
        this.speaker = null;
    }
}
