import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, User, UserCircle } from 'lucide-react';
import type { Issue, IssueStatus } from '../types';
import { getStaleness } from '../lib/calc/staleness';
import { StalenessBadge } from './Badge';

interface Props {
  currentUser: string | null;
  assignees: string[];
  issues: Issue[]; // 全スプリント横断
  onSetCurrentUser: (name: string | null) => void;
  onIssueClick?: (issue: Issue) => void;
}

const STATUS_ORDER: Record<IssueStatus, number> = {
  'In Progress': 0,
  Review: 1,
  'To Do': 2,
  Done: 3,
};

const STATUS_COLOR: Record<IssueStatus, string> = {
  'In Progress': 'text-blue-300',
  Review: 'text-purple-300',
  'To Do': 'text-slate-300',
  Done: 'text-emerald-300',
};

export function MyTasksCard({
  currentUser,
  assignees,
  issues,
  onSetCurrentUser,
  onIssueClick,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const myTasks = useMemo(() => {
    if (!currentUser) return [];
    return issues
      .filter((i) => i.assignee === currentUser && i.status !== 'Done')
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [issues, currentUser]);

  // ユーザー未設定: 選択 UI を出す
  if (!currentUser) {
    return (
      <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <UserCircle size={20} className="text-blue-400" />
          <h2 className="text-base font-bold text-blue-100">あなたの今日のタスクを表示するには</h2>
        </div>
        <p className="text-sm text-blue-200 mb-3">
          下からあなたの担当者名を選択してください（localStorage に保存されます）。
        </p>
        <select
          onChange={(e) => onSetCurrentUser(e.target.value || null)}
          defaultValue=""
          className="w-full max-w-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">— 選択してください —</option>
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <User size={18} className="text-blue-400" />
          {currentUser} さんの今日のタスク
          <span className="text-xs text-slate-400 font-normal">({myTasks.length} 件)</span>
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSetCurrentUser(null)}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
            title="ユーザーを切り替え"
          >
            変更
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-slate-400 hover:text-white p-1"
            aria-label={collapsed ? '展開' : '折りたたみ'}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {myTasks.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              今日のタスクはありません 🎉
            </p>
          ) : (
            <div className="space-y-1.5">
              {myTasks.map((issue) => {
                const staleness = getStaleness(issue);
                return (
                  <button
                    key={issue.id}
                    onClick={() => onIssueClick?.(issue)}
                    className="w-full text-left bg-slate-900/40 hover:bg-slate-900/80 border border-slate-700/50 rounded-lg p-2.5 transition flex items-center gap-3"
                  >
                    <span className={`text-xs ${STATUS_COLOR[issue.status]} flex-shrink-0`}>
                      ●
                    </span>
                    <span className="font-mono text-xs text-blue-300 flex-shrink-0">
                      {issue.id}
                    </span>
                    <span className="text-sm text-slate-100 truncate flex-1">{issue.title}</span>
                    {staleness && <StalenessBadge staleness={staleness} compact />}
                    <span className={`text-xs ${STATUS_COLOR[issue.status]} flex-shrink-0`}>
                      {issue.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
