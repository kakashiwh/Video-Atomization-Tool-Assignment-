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
        
        command = command.videoFilters([
          `setpts=PTS+${startTime}/TB`,
          `subtitles=f='${escapedSubPath}':force_style='Alignment=2,FontSize=24,Outline=2,Shadow=2,MarginV=40'`,
          `setpts=PTS-STARTPTS`,
          `setsar=1`
        ]);
      } else {
        command = command.videoFilters(`setsar=1`);
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

      // 1. Crop original video to 9:16 center
      const cropFilter = `crop=ih*9/16:ih:(iw-ih*9/16)/2:0`;

      if (subtitlePath) {
        const escapedSubPath = subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:');
        
        // Filter order is CRITICAL for vertical captions:
        // 1. Crop and scale to final 9:16 vertical resolution (720x1280)
        // 2. Shift PTS to match global SRT timing
        // 3. Apply subtitles (now they wrap correctly for 720px width)
        // 4. Shift PTS back for zero-start output
        // 5. Force square pixels (setsar=1) to prevent stretching
        command = command.videoFilters([
          cropFilter,
          `scale=1080:1920`,
          `setpts=PTS+${startTime}/TB`,
          `subtitles=f='${escapedSubPath}':force_style='Alignment=5,FontSize=28,Outline=2,Shadow=2,MarginV=120'`, 
          `setpts=PTS-STARTPTS`,
          `setsar=1`
        ]);
      } else {
        command = command.videoFilters([
          cropFilter,
          `scale=720:1280`,
          `setsar=1`
        ]);
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
