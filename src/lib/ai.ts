import { AssemblyAI } from "assemblyai";
import { OpenRouter } from "@openrouter/sdk";
import { IAIService, Moment } from "./types";

export class AIService implements IAIService {
  private client: AssemblyAI;
  private openrouter: OpenRouter;

  constructor() {
    this.client = new AssemblyAI({
      apiKey: process.env.ASSEMBLY_AI_KEY!,
    });
    this.openrouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!
    });
  }

  async transcribe(audioPath: string): Promise<{ text: string, srt: string }> {
    const params = {
      audio: audioPath,
      speech_models: ["universal"],
    };

    const transcript = await this.client.transcripts.transcribe(params);
    
    // Fetch SRT subtitles
    const srt = await this.client.transcripts.subtitles(transcript.id, 'srt');
    
    return { 
      text: transcript.text || "", 
      srt: srt || "" 
    };
  }

  async analyze(transcript: string): Promise<Moment[]> {
    const prompt = `This is a transcript of a video. Identify 3-5 key moments or interesting segments that would make good short clips.
    Return ONLY a JSON array of objects with the following structure:
    [
        {
            "title": "Brief catchy title",
            "startTime": number (in seconds, approximate start of the topic),
            "endTime": number (in seconds, approximate end),
            "summary": "One sentence summary"
        }
    ]
    
    Transcript:
    ${transcript.substring(0, 50000)}`;

    try {
      const stream = await this.openrouter.chat.send({
        model: "mistralai/devstral-2512:free",
        messages: [
          {
            "role": "user",
            "content": prompt
          }
        ],
        stream: true
      });

      let content = "";
      for await (const chunk of stream) {
        content += chunk.choices[0]?.delta?.content;
      }

      console.log("Full AI response:", content);

      const cleaned = content
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed)) {
        return parsed as Moment[];
      }

      if (parsed.moments && Array.isArray(parsed.moments)) {
        return parsed.moments;
      }

      console.warn("Response was not an array:", parsed);
      return [];
    } catch (e) {
      console.error("Failed to parse AI response or OpenRouter error", e);
      return [];
    }
  }
}

export const aiService = new AIService();
