/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE?: 'jira-api' | 'mock';
  readonly VITE_USE_MOCK_FALLBACK?: string;
  readonly VITE_JIRA_INSTANCE_URL?: string;
  readonly VITE_JIRA_BOARD_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
