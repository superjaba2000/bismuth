import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import logger from '../util/logger.js';

const execFileAsync = promisify(execFile);

function findTag(name, ...tagSets) {
    for (const tags of tagSets) {
        if (!tags) {
            continue;
        }

        for (const [key, value] of Object.entries(tags)) {
            if (key.toLowerCase() === name && value) {
                return value;
            }
        }
    }
    return null;
}

export default class AudioExplorer {
    ffprobePath = null;

    async init() {
        if (this.ffprobePath) {
            return this.ffprobePath;
        }

        this.ffprobePath = process.env.FFPROBE_PATH || await this.findSystemFfprobePath();
        logger.info(`AudioExplorer initialized with ffprobe at ${this.ffprobePath}`);
        return this.ffprobePath;
    }

    async findSystemFfprobePath() {
        const finderCommand = process.platform === 'win32' ? 'where' : 'which';
        const candidates = [];

        if (process.env.FFMPEG_PATH) {
            const siblingName = process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
            candidates.push(path.join(path.dirname(process.env.FFMPEG_PATH), siblingName));
        }

        try {
            const { stdout } = await execFileAsync(finderCommand, ['ffprobe']);
            candidates.push(...stdout.trim().split(/\r?\n/));
        } catch (error) {
            logger.debug(`Could not locate ffprobe in PATH: ${error.message}`);
        }

        for (const candidate of candidates) {
            if (!candidate) {
                continue;
            }

            try {
                await execFileAsync(candidate, ['-version']);
                return candidate;
            } catch (error) {
                logger.debug(`ffprobe candidate "${candidate}" is not usable: ${error.message}`);
            }
        }

        throw new Error('ffprobe was not found. Install FFmpeg (including ffprobe) or set FFPROBE_PATH.');
    }

    async getInfo(filePath) {
        if (!this.ffprobePath) {
            throw new Error('AudioExplorer is not initialized');
        }

        let stdout;
        try {
            ({ stdout } = await execFileAsync(
                this.ffprobePath,
                ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', filePath],
                { maxBuffer: 8 * 1024 * 1024, windowsHide: true }
            ));
        } catch (error) {
            throw new Error(`ffprobe could not read "${filePath}": ${error.stderr?.trim() || error.message}`, {
                cause: error
            });
        }

        let probe;
        try {
            probe = JSON.parse(stdout);
        } catch (error) {
            throw new Error(`ffprobe returned invalid metadata for "${filePath}"`, { cause: error });
        }

        const audioStream = probe.streams?.find(stream => stream.codec_type === 'audio');
        if (!audioStream) {
            throw new Error(`"${filePath}" does not contain an audio stream`);
        }

        const format = probe.format ?? {};
        const title = findTag('title', format.tags, audioStream.tags)
            || path.basename(filePath, path.extname(filePath));
        let artist = findTag('artist', format.tags, audioStream.tags) || 'Unknown';
        let displayTitle = title;

        if (artist === 'Unknown' && displayTitle.includes(' - ')) {
            [artist, displayTitle] = displayTitle.replace(/\[.*?\]/g, '').trim().split(' - ', 2);
        }

        const duration = Number(format.duration ?? audioStream.duration);
        return {
            title: displayTitle,
            artist,
            duration: Number.isFinite(duration) && duration > 0 ? duration : null,
            format: format.format_name ?? null,
            sampleRate: Number(audioStream.sample_rate) || null,
            channels: Number(audioStream.channels) || null
        };
    }
}
