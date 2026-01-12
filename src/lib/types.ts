
export interface Moment {
  title: string;
  summary: string;
  startTime: number;
  endTime: number;
}

export interface IAIService {
  transcribe(audioPath: string): Promise<string>;
  analyze(transcript: string): Promise<Moment[]>;
}

export interface IMediaProcessor {
  extractAudio(videoPath: string, audioPath: string): Promise<void>;
  createClip(videoPath: string, startTime: number, endTime: number, outputPath: string): Promise<void>;
  convertToVertical(inputPath: string, outputPath: string): Promise<void>;
}
