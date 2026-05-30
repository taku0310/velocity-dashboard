import { useState } from 'react';
import { LogIn, AlertCircle, Beaker } from 'lucide-react';
import type { JiraCredentials } from '../types';

interface Props {
  onLogin: (creds: JiraCredentials) => Promise<boolean>;
  onMockMode: () => void;
  loading: boolean;
  error: string | null;
}

export function LoginForm({ onLogin, onMockMode, loading, error }: Props) {
  const [instanceUrl, setInstanceUrl] = useState(
    import.meta.env.VITE_JIRA_INSTANCE_URL || '',
  );
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [boardId, setBoardId] = useState(import.meta.env.VITE_JIRA_BOARD_ID || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin({ instanceUrl, email, token, boardId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-md bg-slate-800 bg-opacity-50 border border-slate-700 rounded-2xl p-8 backdrop-blur shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Velocity Dashboard
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Jira スプリント実績分析ダッシュボード
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Jira インスタンス URL
            </label>
            <input
              type="url"
              required
              placeholder="https://your-domain.atlassian.net"
              value={instanceUrl}
              onChange={(e) => setInstanceUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">API Token</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">ボード ID</label>
            <input
              type="text"
              required
              placeholder="例: 123"
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-900 bg-opacity-30 border border-red-700 text-red-200 p-3 rounded-lg text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            {loading ? '認証中…' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-700">
          <button
            onClick={onMockMode}
            className="w-full bg-slate-700 hover:bg-slate-600 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            <Beaker size={18} />
            モックデータで試す
          </button>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Jira への接続なしでダッシュボードをプレビューします
          </p>
        </div>
      </div>
    </div>
  );
}
