
import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  filename: text("filename").notNull(), // stored filename
  originalName: text("original_name"),
  duration: real("duration"),
  status: text("status").default("uploaded").notNull(), // uploaded, processing, completed, error
  hash: text("hash"), // Content hash for caching
  createdAt: timestamp("created_at").defaultNow(),
});

export const clips = pgTable("clips", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").references(() => videos.id).notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  startTime: real("start_time").notNull(),
  endTime: real("end_time").notNull(),
  filePath: text("file_path").notNull(),
  orientation: text("orientation").notNull(), // horizontal, vertical
  createdAt: timestamp("created_at").defaultNow(),
});
