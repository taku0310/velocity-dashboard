import { useCallback, useEffect, useState } from 'react';
import { JiraApiService } from '../services/jiraApi';
import type { JiraCredentials } from '../types';

const STORAGE_KEYS = {
  email: 'jira-email',
  token: 'jira-token',
  instanceUrl: 'jira-instance-url',
  boardId: 'jira-board-id',
};

export function useJiraAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<JiraCredentials | null>(null);

  // 起動時にセッションストレージから復元
  useEffect(() => {
    const email = sessionStorage.getItem(STORAGE_KEYS.email);
    const token = sessionStorage.getItem(STORAGE_KEYS.token);
    const instanceUrl = sessionStorage.getItem(STORAGE_KEYS.instanceUrl);
    const boardId = sessionStorage.getItem(STORAGE_KEYS.boardId);
    if (email && token && instanceUrl && boardId) {
      setCredentials({ email, token, instanceUrl, boardId });
      setIsAuthenticated(true);
    }
  }, []);

  const authenticate = useCallback(
    async (creds: JiraCredentials): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const api = new JiraApiService(creds.instanceUrl, creds.email, creds.token);
        const ok = await api.verifyAuth();
        if (!ok) throw new Error('認証に失敗しました。Email/Token を確認してください。');

        sessionStorage.setItem(STORAGE_KEYS.email, creds.email);
        sessionStorage.setItem(STORAGE_KEYS.token, creds.token);
        sessionStorage.setItem(STORAGE_KEYS.instanceUrl, creds.instanceUrl);
        sessionStorage.setItem(STORAGE_KEYS.boardId, creds.boardId);

        setCredentials(creds);
        setIsAuthenticated(true);
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '不明なエラーが発生しました。';
        setError(message);
        setIsAuthenticated(false);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((k) => sessionStorage.removeItem(k));
    setCredentials(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  // モックモード用に資格情報なしで認証通過させる
  const enterMockMode = useCallback(() => {
    setIsAuthenticated(true);
    setCredentials(null);
    setError(null);
  }, []);

  return {
    isAuthenticated,
    loading,
    error,
    credentials,
    authenticate,
    logout,
    enterMockMode,
  };
}
