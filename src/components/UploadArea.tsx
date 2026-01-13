
'use client';

import { useState } from 'react';
import { Upload, FileVideo, CheckCircle, AlertCircle } from 'lucide-react';

export default function UploadArea() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0); // Mock progress for now
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus('uploading');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      const videoId = data.videoId;

      if (data.cached) {
        setStatus('success');
        window.location.reload();
        return;
      }

      // Start Listening for status updates via Redis Pub/Sub
      startListening(videoId);
      
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const startListening = (videoId: number) => {
    const eventSource = new EventSource(`/api/videos/${videoId}/events`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === 'processing') {
        setStatus('uploading'); // Or keep as is
      } else if (data.status === 'completed') {
        eventSource.close();
        setStatus('success');
        window.location.reload();
      } else if (data.status === 'error') {
        eventSource.close();
        setStatus('error');
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource error:", err);
      eventSource.close();
    };

    // Return cleanup function if needed, but here it's managed internally
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:bg-slate-50 transition-colors">
        <input 
          type="file" 
          accept="video/*" 
          onChange={handleFileChange}
          className="hidden" 
          id="video-upload"
        />
        <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center gap-4">
          <div className="bg-blue-50 p-4 rounded-full">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Upload Video</h3>
            <p className="text-slate-500 text-sm mt-1">MP4, MOV or WebM up to 500MB</p>
          </div>
        </label>
      </div>

      {file && (
        <div className="mt-6 p-4 bg-slate-50 rounded-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileVideo className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="text-sm min-w-0">
                    <p className="font-medium text-slate-900 truncate" title={file.name}>{file.name}</p>
                    <p className="text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
            </div>
            <div className="shrink-0">
              {status === 'idle' && (
                  <button 
                      onClick={handleUpload}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap"
                  >
                      Start Processing
                  </button>
              )}
               {status === 'uploading' && (
                  <div className="text-blue-600 text-sm font-medium animate-pulse whitespace-nowrap">Uploading...</div>
              )}
              {status === 'success' && (
                  <div className="flex items-center text-green-600 gap-2 whitespace-nowrap">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Uploaded</span>
                  </div>
              )}
               {status === 'error' && (
                  <div className="flex items-center text-red-600 gap-2 whitespace-nowrap">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Failed</span>
                  </div>
              )}
            </div>
        </div>
      )}
    </div>
  );
}
