
import { db } from "@/db";
import { videos, clips } from "@/db/schema";
import { eq } from "drizzle-orm";
import { extractAudio, createClip, convertToVertical } from "./ffmpeg";
import { transcribeAudio, analyzeTranscript, type Moment } from "./ai";
import path from "path";
import { UPLOAD_DIR } from "./constants";


export async function processVideoPipeline(videoId: number, videoPath: string) {
    console.log(`[Pipeline] Starting for Video ${videoId}`);
    
    try {
        // 1. Update Status to Processing
        await db.update(videos)
            .set({ status: 'processing' })
            .where(eq(videos.id, videoId));

        const baseName = path.basename(videoPath, path.extname(videoPath));
        console.log(`baseName: ${baseName}`);
        console.log(`videoPath: ${videoPath}`);
        const audioPath = path.join(UPLOAD_DIR, `${baseName}.mp3`);
        console.log(`audioPath: ${audioPath}`);

        console.log(`before extract audio`);
        // 2. Extract Audio
        console.log(`[Pipeline] Extracting Audio...`);
        await extractAudio(videoPath, audioPath);

        console.log(`after extract audio`);
        // 3. Transcribe
        console.log(`[Pipeline] Transcribing...`);
        // Check if mock mode or real key exists. 
        // For now trusting the key is there or it will fail nicely.
        const transcript = await transcribeAudio(audioPath);
        
        // 4. Analyze Moments
        console.log(`[Pipeline] Analyzing Transcript...`);
        const moments = await analyzeTranscript(transcript);
        console.log(`[Pipeline] Found ${moments.length} moments`);

        // 5. Generate Clips
        for (const moment of moments) {
            console.log(`[Pipeline] Processing Moment: ${moment.title}`);
            const safeTitle = moment.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            
            // Generate Horizontal Clip
            const horizontalFilename = `${baseName}_clip_${safeTitle}_16x9.mp4`;
            const horizontalPath = path.join(UPLOAD_DIR, horizontalFilename);
            await createClip(videoPath, moment.startTime, moment.endTime, horizontalPath);

            // Save Horizontal Clip to DB
            await db.insert(clips).values({
                videoId,
                title: moment.title,
                summary: moment.summary,
                startTime: moment.startTime,
                endTime: moment.endTime,
                filePath: horizontalFilename, // Store relative path/filename
                orientation: 'horizontal'
            });

            // Generate Vertical Clip
            const verticalFilename = `${baseName}_clip_${safeTitle}_9x16.mp4`;
            const verticalPath = path.join(UPLOAD_DIR, verticalFilename);
            await convertToVertical(horizontalPath, verticalPath);

            // Save Vertical Clip to DB
            await db.insert(clips).values({
                videoId,
                title: `${moment.title} (Vertical)`,
                summary: moment.summary,
                startTime: moment.startTime,
                endTime: moment.endTime,
                filePath: verticalFilename,
                orientation: 'vertical'
            });
        }

        // 6. Cleanup & Complete
        // Optional: Delete audio file? await fs.unlink(audioPath);
        
        await db.update(videos)
            .set({ status: 'completed' })
            .where(eq(videos.id, videoId));
            
        console.log(`[Pipeline] Completed Video ${videoId}`);

    } catch (error) {
        console.error(`[Pipeline] Error for Video ${videoId}:`, error);
        await db.update(videos)
            .set({ status: 'error' })
            .where(eq(videos.id, videoId));
    }
}
