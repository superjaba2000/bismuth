import { copyFileSync, existsSync, mkdirSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import logger from '../util/logger.js';

const execFileAsync = promisify(execFile);

export default class AudioDecoder {
    ffmpegPath = null;

    async init() {
        if (this.ffmpegPath) {
            return this.ffmpegPath;
        }

        this.ffmpegPath = process.env.FFMPEG_PATH || await this.findSystemFfmpegPath();
        logger.info(`AudioDecoder initialized with ffmpeg at ${this.ffmpegPath}`);
        return this.ffmpegPath;
    }

    async findSystemFfmpegPath() {
        const finderCommand = process.platform === 'win32' ? 'where' : 'which';

        try {
            const { stdout } = await execFileAsync(finderCommand, ['ffmpeg']);
            const candidates = stdout.trim().split(/\r?\n/).filter(Boolean);
            for (const candidate of candidates) {
                try {
                    await execFileAsync(candidate, ['-version']);
                    return candidate;
                } catch (error) {
                    logger.debug(`ffmpeg candidate "${candidate}" is not usable: ${error.message}`);
                }
            }
        } catch (error) {
            logger.debug(`Could not locate ffmpeg in PATH: ${error.message}`);
        }

        return this.getBundledFfmpegPath();
    }

    async getBundledFfmpegPath() {
        let bundledPath;
        try {
            ({ default: bundledPath } = await import('ffmpeg-static'));
        } catch (error) {
            throw new Error('ffmpeg was not found. Install FFmpeg or keep ffmpeg-static installed.', {
                cause: error
            });
        }

        if (!bundledPath || !existsSync(bundledPath)) {
            throw new Error('The bundled ffmpeg binary is unavailable');
        }

        const tempDirectory = path.join(tmpdir(), 'bismuth');
        const targetPath = path.join(
            tempDirectory,
            `ffmpeg${process.platform === 'win32' ? '.exe' : ''}`
        );
        mkdirSync(tempDirectory, { recursive: true });

        if (!existsSync(targetPath)) {
            copyFileSync(bundledPath, targetPath);
        }
        if (process.platform !== 'win32') {
            chmodSync(targetPath, 0o755);
        }

        return targetPath;
    }

    async decode(inputPath, options = {}) {
        if (!this.ffmpegPath) {
            throw new Error('AudioDecoder is not initialized');
        }

        const audioContext = options.audioContext;
        if (!audioContext) {
            throw new Error('AudioContext is required to decode audio');
        }

        const sampleRate = options.sampleRate ?? 44100;
        const channels = options.channels ?? 2;
        if (!Number.isInteger(sampleRate) || sampleRate <= 0) {
            throw new Error('Audio sample rate must be a positive integer');
        }
        if (![1, 2].includes(channels)) {
            throw new Error('Audio output must have one or two channels');
        }

        const chunks = [];
        let stderr = '';
        const ffmpegProcess = spawn(this.ffmpegPath, [
            '-v', 'error',
            '-i', inputPath,
            '-vn',
            '-f', 's16le',
            '-acodec', 'pcm_s16le',
            '-ar', String(sampleRate),
            '-ac', String(channels),
            'pipe:1'
        ], { windowsHide: true });

        ffmpegProcess.stdout.on('data', chunk => chunks.push(chunk));
        ffmpegProcess.stderr.on('data', chunk => {
            if (stderr.length < 64 * 1024) {
                stderr += chunk.toString();
            }
        });

        await new Promise((resolve, reject) => {
            ffmpegProcess.once('error', reject);
            ffmpegProcess.once('close', code => {
                if (code === 0) {
                    resolve();
                    return;
                }

                reject(new Error(
                    `ffmpeg exited with code ${code}${stderr.trim() ? `: ${stderr.trim()}` : ''}`
                ));
            });
        }).catch(error => {
            logger.error(`Failed to decode "${inputPath}":`, error);
            throw error;
        });

        const pcmData = Buffer.concat(chunks);
        const frameSize = channels * Int16Array.BYTES_PER_ELEMENT;
        if (pcmData.length === 0 || pcmData.length % frameSize !== 0) {
            throw new Error(`ffmpeg returned empty or invalid PCM data for "${inputPath}"`);
        }

        const frameCount = pcmData.length / frameSize;
        const audioBuffer = audioContext.createBuffer(channels, frameCount, sampleRate);
        const dataView = new DataView(
            pcmData.buffer,
            pcmData.byteOffset,
            pcmData.byteLength
        );

        for (let channel = 0; channel < channels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            for (let frame = 0; frame < frameCount; frame++) {
                const byteOffset = (frame * channels + channel) * Int16Array.BYTES_PER_ELEMENT;
                channelData[frame] = dataView.getInt16(byteOffset, true) / 32768;
            }
        }

        return audioBuffer;
    }
}
