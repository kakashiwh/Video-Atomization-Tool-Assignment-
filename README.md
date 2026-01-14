# Video Atomization Tool - Technical Documentation

This document provides a deep dive into the architecture, setup, and features of the Video Atomization Tool.

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js**: 18.x or higher
- **Docker** or **Neon (PostgreSQL)**: For running the PostgreSQL database  
- **FFmpeg**: Must be available on the system path (or provided by `ffmpeg-static`)

### Environment Variables
Store these in a `.env` file at the root:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/video_atomizer"
REDIS_URL="redis://localhost:6379"
ASSEMBLY_AI_KEY="your_assembly_ai_key"
OPENROUTER_API_KEY="your_openrouter_key"
```

### Installation & Initialization

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the database**:
   ```bash
   docker-compose up -d
   ``` 
   or

   if you have Neon (PostgreSQL) link just paste that in the DATABASE_URL in .env file

3. **Push the database schema**:
   ```bash
   npx drizzle-kit push
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```
   if Any error occurs just run (it might occur due to tailwindcss)
   ```bash
   rm -Force -Recurse .next; npm install; npm run dev
   ```

---


## 🏗 System Architecture & Design Rationale

The Video Atomization Tool is designed with a **decoupled, service-oriented architecture**. We prioritize user experience (UX) through real-time feedback and developer maintainability through clean abstraction layers.

### 1. Why This Architecture?

#### Decoupled Processing Pipeline
Video editing (FFmpeg) and AI analysis (Transcription) are heavy, long-running tasks.
- **Decision**: We handle uploads via a fast API response, then trigger the processing pipeline in the background.
- **Benefit**: Prevents browser timeouts and allows the server to process complex tasks without blocking new user requests.

#### Redis Pub/Sub + Server-Sent Events (SSE)
Real-time feedback is critical for long-running tasks.
- **Implementation**: 
    - **The Publisher**: `pipeline.ts` emits status changes to a specific Redis channel.
    - **The Subscriber**: An API route (`/api/videos/[id]/events`) listens to Redis and streams messages to the client using SSE.
- **Why Redis?**: It's extremely low-latency for signaling and allows for easy horizontal scaling (Workers and the Web API can run on different servers).
- **Why SSE?**: Simpler than WebSockets for one-way server-to-client updates.

#### Layered Service Architecture (`src/lib/services`)
We separated concerns into `VideoService`, `ClipService`, `AIService`, and `FFmpegProcessor`.
- **The Rationale**: This allows us to swap components (e.g., switching from AssemblyAI to Whisper) by changing a single class implementation rather than the core business logic.

### 2. Trade-offs and Assumptions

| Trade-off | Description |
| :--- | :--- |
| **Redis Pub/Sub vs. Polling** | **Pro**: Instant updates, reduced DB load. **Con**: If the client disconnects briefly, missed "middle" status updates aren't replayed (fire-and-forget). |
| **Monolithic vs. Microservices** | **Pro**: Single codebase is easier to deploy and manage for MVP. **Con**: CPU-heavy FFmpeg processes share the same resources as the web server. |
| **SSE vs. WebSockets** | **Pro**: Direct browser support, automatic reconnection. **Con**: Uni-directional only (which fits our "status update" use case perfectly). |

### 3.  Future Scaling Path (The "Work Queue" Shift)
The current architecture is perfect for an MVP or medium-scale use. To scale to thousands of users, we would make one major change:

From: Running the pipeline as a background function call.
To: Passing a "job" to a persistent queue (like BullMQ or Temporal).
Because we already use Redis, this transition would be straightforward. The API would push a job to Redis, and a dedicated "Worker" fleet (independent of the web server) would pick it up and process it.

---

---

## 🤖 AI API Selection & Rationale

We utilize two distinct AI providers to power the intelligence of this tool. The primary driver for these choices was **accessibility**—specifically the availability of generous free tiers and easy-to-use API keys for development and testing.

### 1. Transcription & Subtitles (AssemblyAI)
- **Use Case**: Converting video audio into high-accuracy text and generating synchronized `.srt` subtitle files.
- **Why AssemblyAI?**: It provides a specialized, production-ready speech-to-text API that includes subtitle generation out of the box. Its free tier allows for extensive testing without upfront credit card requirements.

### 2. Segment Analysis (Mistral / devstral via OpenRouter)
- **Use Case**: Analyzing the transcript to identify "viral" moments and generating catchy titles/summaries.
- **Why Mistral?**: By using **OpenRouter**, we gain access to the `mistralai/devstral-2512:free` model. 
- **Rationale for skipping OpenAI/Gemini/Claude**: While models like GPT-4 or Gemini are powerful, they often require a paid subscription or have complex free-tier restrictions that limit immediate developer testing. **Mistral via OpenRouter** provides a high-quality, free-to-use alternative that allows any developer to clone this repo and start testing immediately.

---

## 💾 Database Schema

The system uses two primary tables:

### `videos`
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary Key |
| title | text | Original filename |
| filename | text | Stored unique filename |
| status | text | uploaded, processing, completed, error |
| hash | text | MD5 content hash for **Smart Caching** |

### `clips`
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary Key |
| videoId | integer | Foreign Key to `videos` |
| title | text | AI-generated title |
| startTime | real | Start offset in seconds |
| endTime | real | End offset in seconds |
| filePath | text | Path to the generated `.mp4` |
| orientation | text | horizontal or vertical |

---

## ✨ Features Implemented

1.  **AI-Generated Titles**: Every clip is assigned a catchy title by the LLM.
2.  **Burned-in Captions**: Subtitles are automatically generated from transcript timestamps and hard-coded into the video clips using FFmpeg filters.
3.  **Smart Caching**: The system computes a content hash (MD5) for every upload. If the same file has been processed before, it immediately returns the original results, saving time and API costs.
4.  **Real-time Updates (Redis Pub/Sub)**: Replaced polling with a robust event-driven architecture. Status updates are published to Redis and streamed to the frontend via Server-Sent Events (SSE).
5.  **Auto-Refresh**: Background synchronization ensures the UI stays updated if files are manually deleted from the server.
