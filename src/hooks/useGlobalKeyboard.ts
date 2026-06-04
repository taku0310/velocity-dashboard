import { useEffect } from 'react';

interface Handlers {
  onCmdK?: () => void;
  onSlash?: () => void;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    // 検索系の input にフォーカスがあっても "/" を反応させたくない
    return true;
  }
  return false;
}

/**
 * グローバルキーボードショートカット。
 * - Cmd+K / Ctrl+K → onCmdK
 * - "/" （typing 中でなければ） → onSlash
 *
 * Esc はモーダル / パレット側で個別ハンドリングする（伝搬を分離するため）。
 */
export function useGlobalKeyboard({ onCmdK, onSlash }: Handlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onCmdK?.();
        return;
      }
      if (e.key === '/' && !isTypingTarget(e.target)) {
        e.preventDefault();
        onSlash?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCmdK, onSlash]);
}
