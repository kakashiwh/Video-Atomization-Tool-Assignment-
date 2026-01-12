
import { getRecentClips } from '@/actions/clips';
import { Play } from 'lucide-react';

export default async function ClipsList() {
  const clips = await getRecentClips();

  if (clips.length === 0) {
    return (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed text-slate-400">
            No clips generated yet
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clips.map((clip) => (
        <div key={clip.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className={`relative bg-slate-100 ${clip.orientation === 'vertical' ? 'aspect-[9/16]' : 'aspect-video'}`}>
             <video 
                src={`/uploads/${clip.filePath}`} 
                controls 
                className="w-full h-full object-cover"
             />
             <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full uppercase font-bold tracking-wider">
                {clip.orientation}
             </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1" title={clip.title}>{clip.title}</h3>
            <p className="text-sm text-slate-500 line-clamp-2" title={clip.summary || ''}>{clip.summary}</p>
            <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">{new Date(clip.createdAt!).toLocaleDateString()}</span>
                <a 
                    href={`/uploads/${clip.filePath}`} 
                    download
                    className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"
                >
                    Download
                </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
