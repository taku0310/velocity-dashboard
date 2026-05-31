import { useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useJiraAuth } from './hooks/useJiraAuth';
import { useSprintData } from './hooks/useSprintData';
import { useDataset } from './hooks/useDataset';
import type { DataSource } from './types';

const envDataSource =
  (import.meta.env.VITE_DATA_SOURCE as DataSource | undefined) || 'jira-api';
const useMockFallback = import.meta.env.VITE_USE_MOCK_FALLBACK !== 'false';

export default function App() {
  const auth = useJiraAuth();
  const [mockMode, setMockMode] = useState(false);
  const effectiveDataSource: DataSource = mockMode ? 'mock' : envDataSource;

  const sprintState = useSprintData({
    dataSource: effectiveDataSource,
    credentials: auth.isAuthenticated ? auth.credentials : null,
    fallbackToMock: useMockFallback,
  });

  const dataset = useDataset(sprintState.data);

  if (!auth.isAuthenticated) {
    return (
      <LoginForm
        onLogin={auth.authenticate}
        onMockMode={() => {
          setMockMode(true);
          auth.enterMockMode();
        }}
        loading={auth.loading}
        error={auth.error}
      />
    );
  }

  if (sprintState.loading && dataset.sprints.length === 0) {
    return <LoadingSpinner message="スプリントデータを取得中…" />;
  }

  if (dataset.sprints.length === 0) {
    return (
      <ErrorBoundary
        error={sprintState.error || 'スプリントデータが見つかりません'}
        retry={sprintState.refetch}
      />
    );
  }

  return (
    <Dashboard
      sprints={dataset.sprints}
      hasLocalEdits={dataset.hasLocalEdits}
      onAddIssue={dataset.addIssue}
      onUpdateIssue={dataset.updateIssue}
      onDeleteIssue={dataset.deleteIssue}
      onAddSprint={dataset.addSprint}
      onUpdateSprint={dataset.updateSprint}
      onDeleteSprint={dataset.deleteSprint}
      onResetToSource={dataset.resetToSource}
      onImportDataset={dataset.importDataset}
      onLogout={() => {
        setMockMode(false);
        auth.logout();
      }}
      onRefresh={sprintState.refetch}
      warning={sprintState.usingFallback ? sprintState.error : null}
    />
  );
}
