import { useCallback, useEffect, useState } from 'react';

/**
 * 最小のハッシュルーティング。
 *
 * URL 形式（`#` 以降を扱う）:
 *   /                    → サマリ
 *   /summary, /progress, /gantt, /issues, /reports
 *   /issues/ECOM-1234    → 課題管理タブ + 該当チケット選択
 *
 * 外部ライブラリ非依存（wouter 等は導入しない）。
 */

export interface ParsedRoute {
  tab: 'summary' | 'progress' | 'gantt' | 'issues' | 'reports';
  issueId?: string;
}

const TABS = ['summary', 'progress', 'gantt', 'issues', 'reports'] as const;

export function parseRoute(path: string): ParsedRoute {
  // 先頭の "/" を除去して segments に
  const trimmed = path.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!trimmed) return { tab: 'summary' };

  const segments = trimmed.split('/');
  const first = segments[0];
  if (first === 'issues' && segments[1]) {
    return { tab: 'issues', issueId: segments[1] };
  }
  if ((TABS as readonly string[]).includes(first)) {
    return { tab: first as ParsedRoute['tab'] };
  }
  return { tab: 'summary' };
}

export function buildRoute(route: ParsedRoute): string {
  if (route.tab === 'issues' && route.issueId) {
    return `/issues/${route.issueId}`;
  }
  return `/${route.tab}`;
}

function readLocationHash(): string {
  const raw = window.location.hash;
  if (!raw || raw === '#') return '/';
  return raw.slice(1);
}

export function useHashRoute() {
  const [path, setPath] = useState<string>(() => readLocationHash());

  useEffect(() => {
    const onChange = () => setPath(readLocationHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((next: string) => {
    if (next === readLocationHash()) return;
    window.location.hash = next;
  }, []);

  const route = parseRoute(path);
  return { route, navigate };
}
