
import path from 'path';

export const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];


