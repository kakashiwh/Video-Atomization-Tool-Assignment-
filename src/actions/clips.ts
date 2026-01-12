
'use server';

import { db } from "@/db";
import { clips, videos } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

import { UPLOAD_DIR } from "@/lib/constants";
import fs from "fs/promises";
import path from "path";

export async function getRecentClips() {
  const recentClips = await db
    .select({
      id: clips.id,
      title: clips.title,
      summary: clips.summary,
      filePath: clips.filePath,
      orientation: clips.orientation,
      createdAt: clips.createdAt,
      type: clips.orientation, // redundant map for UI
    })
    .from(clips)
    .orderBy(desc(clips.createdAt))
    .limit(20); // Get more to account for filtered items
    
  // Filter clips based on file existence
  const filteredClips = [];
  for (const clip of recentClips) {
    try {
      const fullPath = path.join(UPLOAD_DIR, clip.filePath);
      await fs.access(fullPath);
      filteredClips.push(clip);
    } catch (e) {
      // File doesn't exist, skip this clip
      console.log(`Clip ${clip.id} file not found: ${clip.filePath}`);
    }
  }

  return filteredClips.slice(0, 10);
}

export async function getVideos() {
    return await db.select().from(videos).orderBy(desc(videos.createdAt));
}
