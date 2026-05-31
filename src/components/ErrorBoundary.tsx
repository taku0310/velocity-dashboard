import { AlertTriangle } from 'lucide-react';

interface Props {
  error: string;
  retry?: () => void;
}

export function ErrorBoundary({ error, retry }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white flex items-center justify-center">
      <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-xl p-6 max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-red-400" />
          <h2 className="text-2xl font-bold">エラーが発生しました</h2>
        </div>
        <p className="text-red-200 mb-4 break-words">{error}</p>
        {retry && (
          <button
            onClick={retry}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
          >
            再試行
          </button>
        )}
      </div>
    </div>
  );
}
