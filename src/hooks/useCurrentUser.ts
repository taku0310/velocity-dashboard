import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'velocity-dashboard-current-user';

/**
 * 現在ログイン中のユーザーの displayName を保持する。
 *
 * 実装方針:
 * - Jira ログイン時: email から逆引きしたいところだが、現状の useJiraAuth は
 *   displayName を取れていないので、ユーザーが手動で選択する。
 * - モックモード: ユーザーが選択する。
 *
 * 将来サーバー API 経由になれば `/api/users/me` から自動取得に置き換える。
 */
export function useCurrentUser() {
  const [currentUser, setCurrentUserState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const setCurrentUser = useCallback((name: string | null) => {
    setCurrentUserState(name);
    try {
      if (name) localStorage.setItem(STORAGE_KEY, name);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
  }, []);

  // ストレージ変更を監視（別タブからの変更も拾う）
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCurrentUserState(e.newValue);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return { currentUser, setCurrentUser };
}
