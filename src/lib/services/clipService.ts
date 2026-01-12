
import { db } from "@/db";
import { clips } from "@/db/schema";
import { Moment } from "../types";

export class ClipService {
  async createClip(videoId: number, moment: Moment, filePath: string, orientation: "horizontal" | "vertical") {
    return await db.insert(clips).values({
      videoId,
      title: orientation === "vertical" ? `${moment.title} (Vertical)` : moment.title,
      summary: moment.summary,
      startTime: moment.startTime,
      endTime: moment.endTime,
      filePath,
      orientation
    });
  }
}

export const clipService = new ClipService();
