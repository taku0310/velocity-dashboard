import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// React の本物のエラーバウンダリ。チャート等の描画時例外をキャッチして
// 真っ黒な空白画面を防ぐ。
export class RenderErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 開発時にスタックを確認するためコンソールにも残す
    console.error('Render error:', error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white flex items-center justify-center">
          <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-xl p-6 max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-400" />
              <h2 className="text-2xl font-bold">画面の描画でエラーが発生しました</h2>
            </div>
            <pre className="text-red-200 text-sm whitespace-pre-wrap break-words mb-4">
              {this.state.error.message}
            </pre>
            <button
              onClick={this.handleReset}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
            >
              再試行
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
