import path from "path";
import { UPLOAD_DIR } from "./constants";
import { aiService } from "./ai";
import { mediaProcessor } from "./ffmpeg";
import { videoService } from "./services/videoService";
import { clipService } from "./services/clipService";
import { IAIService, IMediaProcessor } from "./types";

export async function processVideoPipeline(
    videoId: number, 
    videoPath: string,
    ai: IAIService = aiService,
    processor: IMediaProcessor = mediaProcessor
) {
    console.log(`[Pipeline] Starting for Video ${videoId}`);
    
    try {
        // 1. Update Status to Processing
        await videoService.updateStatus(videoId, 'processing');

        const baseName = path.basename(videoPath, path.extname(videoPath));
        const audioPath = path.join(UPLOAD_DIR, `${baseName}.mp3`);

        // 2. Extract Audio
        console.log(`[Pipeline] Extracting Audio...`);
        await processor.extractAudio(videoPath, audioPath);

        // 3. Transcribe
        console.log(`[Pipeline] Transcribing...`);
        const transcript = await ai.transcribe(audioPath);
        
        // 4. Analyze Moments
        console.log(`[Pipeline] Analyzing Transcript...`);
        const moments = await ai.analyze(transcript);
        console.log(`[Pipeline] Found ${moments.length} moments`);

        // 5. Generate Clips
        for (const moment of moments) {
            console.log(`[Pipeline] Processing Moment: ${moment.title}`);
            const safeTitle = moment.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            
            // Generate Horizontal Clip
            const horizontalFilename = `${baseName}_clip_${safeTitle}_16x9.mp4`;
            const horizontalPath = path.join(UPLOAD_DIR, horizontalFilename);
            await processor.createClip(videoPath, moment.startTime, moment.endTime, horizontalPath);

            // Save Horizontal Clip to DB
            await clipService.createClip(videoId, moment, horizontalFilename, 'horizontal');

            // Generate Vertical Clip
            const verticalFilename = `${baseName}_clip_${safeTitle}_9x16.mp4`;
            const verticalPath = path.join(UPLOAD_DIR, verticalFilename);
            await processor.convertToVertical(horizontalPath, verticalPath);

            // Save Vertical Clip to DB
            await clipService.createClip(videoId, moment, verticalFilename, 'vertical');
        }

        // 6. Complete
        await videoService.updateStatus(videoId, 'completed');
        console.log(`[Pipeline] Completed Video ${videoId}`);

    } catch (error) {
        console.error(`[Pipeline] Error for Video ${videoId}:`, error);
        await videoService.updateStatus(videoId, 'error');
    }
}
