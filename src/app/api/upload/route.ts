
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { db } from '@/db';
import { videos } from '@/db/schema';
import { UPLOAD_DIR, MAX_FILE_SIZE, ACCEPTED_VIDEO_TYPES } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';
import { processVideoPipeline } from '@/lib/pipeline';

// Ensure upload directory exists
await mkdir(UPLOAD_DIR, { recursive: true });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueId = uuidv4();
    const extension = path.extname(file.name);
    const filename = `${uniqueId}${extension}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Save file to disk
    await writeFile(filepath, buffer);

    // Create DB Record
    const [video] = await db.insert(videos).values({
      title: file.name,
      filename: filename,
      originalName: file.name,
      status: 'uploaded', // Initial status
    }).returning();

    // Trigger Pipeline (Fire and Forget)
    // In a real app, use a queue (Bull/Redis). Here we just call async without await logic blocking response.
    processVideoPipeline(video.id, filepath).catch((err: unknown) => {
        console.error("Pipeline Error Background:", err);
    });

    return NextResponse.json({ success: true, videoId: video.id });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
