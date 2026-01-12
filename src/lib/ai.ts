import { AssemblyAI } from "assemblyai";
import { OpenRouter } from "@openrouter/sdk";


const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
});

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

export async function transcribeAudio(audioPath: string): Promise<any> {
 const audioFile = audioPath;

const params = {
  audio: audioFile,
  speech_models: ["universal"],
};


  const transcript = await client.transcripts.transcribe(params);

return transcript.text
}

export interface Moment {
    title: string;
    startTime: number; // seconds
    endTime: number; // seconds
    summary: string;
}

export async function analyzeTranscript(transcript: string): Promise<Moment[]> {
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
    ${transcript.substring(0, 50000)}`

    try {
        // Using OpenRouter SDK as requested
       const stream = await openrouter.chat.send({
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

    // Clean possible code fences / whitespace
    const cleaned = content
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed)) {
      return parsed as Moment[];
    }

    // Fallback: sometimes model wraps it
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
