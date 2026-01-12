import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import ffmpegInstaller from 'ffmpeg-static';
import ffprobeInstaller from 'ffprobe-static';

// Ensure ffmpeg is available
if (ffmpegInstaller) {
    let ffmpegPath = ffmpegInstaller;
    // Log the detected path for debugging
    console.log("ffmpeg-static path:", ffmpegPath);

    // Fallback logic for Next.js/Webpack issues
    if (!fs.existsSync(ffmpegPath)) {
        console.log("ffmpeg-static path not found, trying local node_modules...");
        const localPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
        if (fs.existsSync(localPath)) {
            ffmpegPath = localPath;
            console.log("Found local ffmpeg:", ffmpegPath);
        } else {
             // Try one level up if in nested structure (though process.cwd should be root)
            const parentPath = path.join(process.cwd(), '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
             if (fs.existsSync(parentPath)) {
                ffmpegPath = parentPath;
                console.log("Found parent ffmpeg:", ffmpegPath);
            }
        }
    }

    ffmpeg.setFfmpegPath(ffmpegPath);
}

if (ffprobeInstaller && ffprobeInstaller.path) {
  ffmpeg.setFfprobePath(ffprobeInstaller.path);
}

export async function extractAudio(videoPath: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(outputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
}

export async function createClip(
  sourcePath: string,
  startTime: number,
  endTime: number,
  outputPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const duration = endTime - startTime;
    ffmpeg(sourcePath)
      .setStartTime(startTime)
      .duration(duration)
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
}

export async function convertToVertical(inputPath: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // Crop to 9:16 aspect ratio centered
        // ih*9/16 is the width we want
        ffmpeg(inputPath)
            .videoFilters('crop=ih*9/16:ih:iw/2-(ih*9/16)/2:0')
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(err))
            .run();
    });
}
