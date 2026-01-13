
import UploadArea from '@/components/UploadArea';
import ClipsList from '@/components/ClipsList';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Video Atomizer</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Turn your long-form videos into viral clips automatically using AI.
                Upload a video to get started.
            </p>
        </header>
        
        <UploadArea />
        
        <div className="mt-16">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Recent Clips</h2>
            <ClipsList />
        </div>
      </div>
    </main>
  );
}
