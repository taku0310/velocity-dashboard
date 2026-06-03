import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FolderTree, ListChecks } from 'lucide-react';
import type { Issue, IssueStatus } from '../types';
import { SortableHeader, compareValues, nextSortState } from './SortableHeader';
import { getStaleness } from '../lib/calc/staleness';
import { StalenessBadge } from './Badge';

interface Props {
  issues: Issue[];
  onIssueClick?: (issue: Issue) => void;
  groupByEpic?: boolean;
}

function statusBadge(status: IssueStatus): string {
  switch (status) {
    case 'Done':
      return 'bg-emerald-700 text-emerald-100';
    case 'In Progress':
      return 'bg-blue-700 text-blue-100';
    case 'Review':
      return 'bg-purple-700 text-purple-100';
    default:
      return 'bg-slate-700 text-slate-200';
  }
}

function accuracyValue(issue: Issue): number {
  if (issue.estimatedHours <= 0 || issue.actualHours <= 0) return 0;
  return Math.round(
    (Math.min(issue.estimatedHours, issue.actualHours) /
      Math.max(issue.estimatedHours, issue.actualHours)) *
      100,
  );
}

interface EnrichedIssue extends Issue {
  accuracy: number;
}

const NO_EPIC_ID = '__NO_EPIC__';

export function IssuesTable({ issues, onIssueClick, groupByEpic = false }: Props) {
  const [sortKey, setSortKey] = useState<string | null>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [collapsedEpics, setCollapsedEpics] = useState<Set<string>>(new Set());

  const enriched: EnrichedIssue[] = useMemo(
    () => issues.map((i) => ({ ...i, accuracy: accuracyValue(i) })),
    [issues],
  );

  const handleSort = (key: string) => {
    const next = nextSortState(sortKey, sortDir, key);
    setSortKey(next.key);
    setSortDir(next.dir);
  };

  const sortFn = (list: EnrichedIssue[]) => {
    if (!sortKey) return list;
    const k = sortKey as keyof EnrichedIssue;
    return [...list].sort((a, b) => {
      const av = k === 'labels' ? (a.labels || []).join(',') : a[k];
      const bv = k === 'labels' ? (b.labels || []).join(',') : b[k];
      return compareValues(av, bv, sortDir);
    });
  };

  const renderRow = (issue: EnrichedIssue) => {
    const staleness = getStaleness(issue);
    return (
      <tr
        key={issue.id}
        onClick={() => onIssueClick?.(issue)}
        data-testid={`issue-row-${issue.id}`}
        className={`border-b border-slate-800 hover:bg-slate-700/20 ${
          onIssueClick ? 'cursor-pointer' : ''
        }`}
      >
        <td className="py-2 px-2 font-mono text-xs text-blue-300">
          <div className="flex items-center gap-1.5">
            <span>{issue.id}</span>
            {staleness && <StalenessBadge staleness={staleness} compact />}
          </div>
        </td>
        <td className="py-2 px-2 max-w-[280px] truncate">{issue.title}</td>
        <td className="py-2 px-2 text-slate-400 text-xs">{issue.type}</td>
      <td className="py-2 px-2 text-right">{issue.points}</td>
      <td className="py-2 px-2 text-right">{issue.estimatedHours}</td>
      <td className="py-2 px-2 text-right">{issue.actualHours}</td>
      <td className="py-2 px-2 text-right">{issue.accuracy > 0 ? `${issue.accuracy}%` : '—'}</td>
      <td className="py-2 px-2">
        <span className={`px-2 py-0.5 rounded text-xs ${statusBadge(issue.status)}`}>
          {issue.status}
        </span>
      </td>
      <td className="py-2 px-2 text-slate-300">{issue.assignee || '未アサイン'}</td>
      <td className="py-2 px-2 text-slate-400 text-xs">{(issue.labels || []).join(', ') || '—'}</td>
    </tr>
    );
  };

  const header = (
    <thead>
      <tr className="text-slate-400 border-b border-slate-700">
        <SortableHeader
          label="ID"
          sortKey="id"
          currentKey={sortKey}
          currentDir={sortDir}
          onChange={handleSort}
        />
        <SortableHeader
          label="タイトル"
          sortKey="title"
          currentKey={sortKey}
          currentDir={sortDir}
          onChange={handleSort}
        />
        <SortableHeader
          label="タイプ"
          sortKey="type"
          currentKey={sortKey}
          currentDir={sortDir}
          onChange={handleSort}
        />
        <SortableHeader
          label="pt"
          sortKey="points"
          currentKey={sortKey}
          currentDir={sortDir}
          onChange={handleSort}
          align="right"
        />
        <SortableHeader
          label="見積(h)"
          sortKey="estimatedHours"
          currentKey={sortKey}
          currentDir={sortDir}
          onChange={handleSort}
          align="right"
        />
        <SortableHeader
          label="実績(h)"
          sortKey="actualHours"
          currentKey={sortKey}
          currentDir={sortDir}
          onChange={handleSort}
          align="right"
        />
        <SortableHeader
          label="精度"
          sortKey="accuracy"
          currentKey={sortKey}
          currentDir={sortDir}
          onChange={handleSort}
          align="right"
        />
        <SortableHeader
          label="ステータス"
          sortKey="status"
          currentKey={sortKey}
          currentDir={sortDir}
          onChange={handleSort}
        />
        <SortableHeader
          label="担当者"
          sortKey="assignee"
          currentKey={sortKey}
          currentDir={sortDir}
          onChange={handleSort}
        />
        <SortableHeader
          label="ラベル"
          sortKey="labels"
          currentKey={sortKey}
          currentDir={sortDir}
          onChange={handleSort}
        />
      </tr>
    </thead>
  );

  // エピックグループ表示
  if (groupByEpic) {
    const epics = enriched.filter((i) => i.type === 'Epic');
    const nonEpics = enriched.filter((i) => i.type !== 'Epic');

    const groups = new Map<string, EnrichedIssue[]>();
    for (const epic of epics) groups.set(epic.id, []);
    groups.set(NO_EPIC_ID, []);

    for (const issue of nonEpics) {
      const key = issue.epicId && groups.has(issue.epicId) ? issue.epicId : NO_EPIC_ID;
      groups.get(key)!.push(issue);
    }

    const toggle = (id: string) => {
      setCollapsedEpics((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    };

    const renderGroup = (
      title: string,
      titleNode: React.ReactNode,
      list: EnrichedIssue[],
      groupId: string,
    ) => {
      const collapsed = collapsedEpics.has(groupId);
      const totalPoints = list.reduce((s, i) => s + i.points, 0);
      const donePoints = list
        .filter((i) => i.status === 'Done')
        .reduce((s, i) => s + i.points, 0);
      return (
        <div
          key={groupId}
          className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/30"
        >
          <button
            onClick={() => toggle(groupId)}
            className="w-full flex items-center justify-between px-4 py-2 bg-slate-800/50 hover:bg-slate-800 transition text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              {collapsed ? (
                <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
              )}
              {titleNode}
            </div>
            <div className="text-xs text-slate-400 flex-shrink-0">
              {list.length}件 · {donePoints}/{totalPoints}pt
            </div>
          </button>
          {!collapsed && list.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                {header}
                <tbody>{sortFn(list).map(renderRow)}</tbody>
              </table>
            </div>
          )}
          {!collapsed && list.length === 0 && (
            <p className="text-xs text-slate-500 px-4 py-3 text-center">課題なし</p>
          )}
        </div>
      );
    };

    return (
      <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FolderTree size={22} className="text-blue-400" />
          全課題一覧（エピック別）
        </h2>
        <div className="space-y-3">
          {epics.map((epic) =>
            renderGroup(
              epic.title,
              <>
                <span className="px-2 py-0.5 bg-purple-700 rounded text-xs text-purple-100">
                  EPIC
                </span>
                <span className="font-mono text-xs text-blue-300">{epic.id}</span>
                <span className="text-slate-200 truncate">{epic.title}</span>
              </>,
              groups.get(epic.id) || [],
              epic.id,
            ),
          )}
          {renderGroup(
            '未分類',
            <>
              <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                未分類
              </span>
              <span className="text-slate-300">エピック未割り当て</span>
            </>,
            groups.get(NO_EPIC_ID) || [],
            NO_EPIC_ID,
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <ListChecks size={22} className="text-blue-400" />
        全課題一覧（{enriched.length}件）
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          {header}
          <tbody>{sortFn(enriched).map(renderRow)}</tbody>
        </table>
      </div>
    </div>
  );
}
