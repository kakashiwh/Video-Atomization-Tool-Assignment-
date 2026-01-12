import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import ffmpegInstaller from 'ffmpeg-static';
import ffprobeInstaller from 'ffprobe-static';
import { IMediaProcessor } from './types';

export class FFmpegProcessor implements IMediaProcessor {
  constructor() {
    this.setupPaths();
  }

  private setupPaths() {
    if (ffmpegInstaller) {
      let ffmpegPath = ffmpegInstaller;
      if (!fs.existsSync(ffmpegPath)) {
        const localPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
        if (fs.existsSync(localPath)) {
          ffmpegPath = localPath;
        } else {
          const parentPath = path.join(process.cwd(), '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
          if (fs.existsSync(parentPath)) {
            ffmpegPath = parentPath;
          }
        }
      }
      ffmpeg.setFfmpegPath(ffmpegPath);
    }

    if (ffprobeInstaller && ffprobeInstaller.path) {
      ffmpeg.setFfprobePath(ffprobeInstaller.path);
    }
  }

  async extractAudio(videoPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(outputPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }

  async createClip(
    sourcePath: string,
    startTime: number,
    endTime: number,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const duration = endTime - startTime;
      ffmpeg(sourcePath)
        .setStartTime(startTime)
        .duration(duration)
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }

  async convertToVertical(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters('crop=ih*9/16:ih:iw/2-(ih*9/16)/2:0')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }
}

export const mediaProcessor = new FFmpegProcessor();
