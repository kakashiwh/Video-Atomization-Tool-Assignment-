# Video Atomization Tool - Technical Documentation

This document provides a deep dive into the architecture, setup, and features of the Video Atomization Tool.

## 🏗 System Architecture

The project is built with a **SOLID-compliant architecture**, separating concerns into specialized services.

### 🧩 Core Components

- **Frontend**: Next.js 15 (App Router) with Tailwind CSS for a modern, responsive UI.
- **Database**: PostgreSQL with **Drizzle ORM** for type-safe schema and query management.
- **Processing Pipeline**: An asynchronous orchestration layer that coordinates audio extraction, AI analysis, and video processing.

### 🛠 Refactored Service Layer (SOLID)

We refactored the codebase to adhere to the Dependency Inversion Principle using the following structure:

- **`VideoService`**: Handles all metadata operations for the main video entries.
- **`ClipService`**: Manages the persistence and retrieval of generated clips.
- **`AIService`**: Implements `IAIService`. Decouples the application from specific AI providers. Currently uses **AssemblyAI** (Transcription) and **OpenRouter/Mistral** (Moment Analysis).
- **`FFmpegProcessor`**: Implements `IMediaProcessor`. Wraps complex FFmpeg logic for extraction, clipping, and vertical conversion.

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

## 🤖 AI Usage & Implementation

### 1. Transcription (AssemblyAI)
The system uses AssemblyAI for high-accuracy audio-to-text conversion. 
- **Subtitles**: We generate `.srt` files alongside the text to enable burned-in captions.

### 2. Moment Detection (OpenRouter / Mistral)
The transcript is analyzed by LLMs (Mistral 7B via OpenRouter) to identify "viral moments". 
- **Criteria**: The AI looks for high-impact segments with clear start/end points.
- **Auto-titles**: Engaging, SEO-friendly titles are generated for each clip automatically.

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
