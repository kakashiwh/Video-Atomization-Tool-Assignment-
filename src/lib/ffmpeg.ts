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
    outputPath: string,
    subtitlePath?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const duration = endTime - startTime;
      let command = ffmpeg(sourcePath)
        .setStartTime(startTime)
        .duration(duration);

      if (subtitlePath) {
        // For Windows, paths in the subtitles filter need special escaping
        const escapedSubPath = subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:');
        
        // Use PTS shift instead of seek_point for better compatibility
        // 1. Shift PTS forward so the first frame matches the SRT timestamp
        // 2. Apply subtitles (it will find the entry at original video time)
        // 3. Shift PTS back so the output file starts at 0
        command = command.videoFilters([
          `setpts=PTS+${startTime}/TB`,
          `subtitles=f='${escapedSubPath}'`,
          `setpts=PTS-STARTPTS`
        ]);
      }

      command
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }

  async createVerticalClip(
    sourcePath: string,
    startTime: number,
    endTime: number,
    outputPath: string,
    subtitlePath?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const duration = endTime - startTime;
      let command = ffmpeg(sourcePath)
        .setStartTime(startTime)
        .duration(duration);

      const cropFilter = 'crop=ih*9/16:ih:iw/2-(ih*9/16)/2:0';

      if (subtitlePath) {
        const escapedSubPath = subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:');
        
        command = command.videoFilters([
          cropFilter,
          `setpts=PTS+${startTime}/TB`,
          `subtitles=f='${escapedSubPath}':force_style='FontSize=16,MarginV=140'`, 
          `setpts=PTS-STARTPTS`
        ]);
      } else {
        command = command.videoFilters(cropFilter);
      }

      command
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }
}

export const mediaProcessor = new FFmpegProcessor();
