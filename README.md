
# Video Atomization Tool

A Next.js application that automatically transforms long-form videos into short, shareable clips using AI and FFmpeg.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- FFmpeg (installed on host)
- OpenAI API Key

### Setup

1.  **Clone & Install**
    ```bash
    npm install
    ```

2.  **Environment Setup**
    Copy `.env` and fill in your keys:
    ```bash
    cp .env.example .env.local
    ```
    Required keys:
    - `DATABASE_URL`: Postgres connection string
    - `OPENAI_API_KEY`: For Whisper and GPT-4o

3.  **Start Database (Local)**
    ```bash
    docker-compose up -d
    npx drizzle-kit push
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

## 🏗 System Architecture

### Core Pipeline
1.  **Upload**: Video is uploaded to `/public/uploads`.
2.  **Preprocessing**: Audio is extracted using `fluent-ffmpeg`.
3.  **Intelligence**:
    -   **Whisper API** generates a transcript.
    -   **GPT-4o** analyzes text to find 3-5 key "moments" (viral topics).
4.  **Atomization**:
    -   Clips are cut based on timestamps.
    -   Vertical (9:16) versions are automatically cropped from the center.
5.  **Persistence**: Metadata (videos, clips) stored in Postgres via Drizzle ORM.

### Tech Stack
-   **Framework**: Next.js 15 (App Router)
-   **Database**: Postgres (local Docker) + Drizzle ORM
-   **Video**: FFmpeg (system binary + node wrappers)
-   **AI**: OpenAI Node SDK

## 🤖 AI Usage Policy

This project utilized AI assistants (Gemini/Claude) for:
-   **Boilerplate**: Initial Next.js structure and Tailwind components.
-   **FFmpeg Commands**: Generating complex `crop` filters for vertical video.
-   **React Components**: generating the Upload and List UI.
-   **Debugging**: Solving Docker networking issues and TS types.

## 📝 Design Decisions

-   **Local Storage**: For MVP simplicity, files are stored locally in `public/uploads`. In production, this would be S3/R2.
-   **Async Processing**: The pipeline is triggered asynchronously to avoid blocking the HTTP response, though for a robust production app, a queue (BullMQ) is recommended.
-   **Drizzle ORM**: Chosen for type safety and lightweight execution compared to Prisma.

## License
MIT

 rm -Force -Recurse .next; npm install; npm run dev

 Here is how to run the project successfully:

1. Prerequisites
Ensure you have Docker Desktop installed and running.

2. Environment Setup
You need to create a .env file in the video-atomizer directory with the following content: (I have already created a template for you, but please verify the API key)

env
DATABASE_URL="postgres://postgres:password@localhost:5432/video_atomizer"
OPENAI_API_KEY="sk-proj-..."
3. Start Database & Push Schema
Open your terminal in video-atomizer and run:

powershell
docker-compose up -d
$env:DATABASE_URL='postgres://postgres:password@localhost:5432/video_atomizer'; npx drizzle-kit push
(Note: We set the env var explicitly for the push command because correct loading from .env sometimes varies by shell)

4. Run the Application
powershell
npm run dev
Then open http://localhost:3000.

Status:

Database: Running (Docker)
Server: Running (I just verified it starts locally)
Pipeline: Ready (API Configured)
