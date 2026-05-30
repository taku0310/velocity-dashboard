import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = '読み込み中…' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-blue-400" size={48} />
        <p className="text-slate-300">{message}</p>
      </div>
    </div>
  );
}
