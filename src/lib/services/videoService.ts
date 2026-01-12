
import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";

export class VideoService {
  async updateStatus(id: number, status: "uploaded" | "processing" | "completed" | "error") {
    return await db.update(videos)
      .set({ status })
      .where(eq(videos.id, id));
  }

  async getVideoById(id: number) {
    const [video] = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
    return video;
  }
}

export const videoService = new VideoService();
