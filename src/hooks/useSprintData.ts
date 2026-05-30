import { useCallback, useEffect, useState } from 'react';
import { JiraApiService } from '../services/jiraApi';
import { generateMockSprintData } from '../services/mockDataGenerator';
import type { DataSource, JiraCredentials, Sprint } from '../types';

interface UseSprintDataOptions {
  dataSource: DataSource;
  credentials: JiraCredentials | null;
  fallbackToMock?: boolean;
}

interface UseSprintDataResult {
  data: Sprint[] | null;
  loading: boolean;
  error: string | null;
  usingFallback: boolean;
  refetch: () => void;
}

export function useSprintData(options: UseSprintDataOptions): UseSprintDataResult {
  const { dataSource, credentials, fallbackToMock = true } = options;
  const [data, setData] = useState<Sprint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  const refetch = useCallback(() => setReloadCounter((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setUsingFallback(false);

      try {
        if (dataSource === 'mock' || !credentials) {
          const sprints = generateMockSprintData();
          if (!cancelled) {
            setData(sprints);
            if (!credentials && dataSource === 'jira-api') {
              setUsingFallback(true);
              setError('認証情報がないためモックデータを使用しています');
            }
          }
          return;
        }

        const api = new JiraApiService(
          credentials.instanceUrl,
          credentials.email,
          credentials.token,
        );
        const sprints = await api.fetchSprintsWithIssues(credentials.boardId);
        if (!cancelled) setData(sprints);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'データ取得に失敗しました';
        if (fallbackToMock) {
          if (!cancelled) {
            setData(generateMockSprintData());
            setUsingFallback(true);
            setError(`${message} - モックデータで継続表示しています`);
          }
        } else if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [dataSource, credentials, fallbackToMock, reloadCounter]);

  return { data, loading, error, usingFallback, refetch };
}
