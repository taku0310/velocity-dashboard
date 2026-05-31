import { Kanban, Plus, User } from 'lucide-react';
import type { Issue, IssueStatus } from '../types';

interface Props {
  issues: Issue[];
  onIssueClick?: (issue: Issue) => void;
  onAdd?: (status: IssueStatus) => void;
}

const COLUMNS: Array<{ status: IssueStatus; color: string; accent: string }> = [
  { status: 'To Do', color: 'bg-slate-700/40', accent: 'text-slate-300' },
  { status: 'In Progress', color: 'bg-blue-900/30', accent: 'text-blue-300' },
  { status: 'Review', color: 'bg-purple-900/30', accent: 'text-purple-300' },
  { status: 'Done', color: 'bg-emerald-900/30', accent: 'text-emerald-300' },
];

export function ProgressBoard({ issues, onIssueClick, onAdd }: Props) {
  return (
    <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Kanban size={22} className="text-blue-400" />
        進捗ボード
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {COLUMNS.map((col) => {
          const colIssues = issues.filter((i) => i.status === col.status);
          const totalPoints = colIssues.reduce((s, i) => s + i.points, 0);
          return (
            <div key={col.status} className={`${col.color} rounded-lg p-3 min-h-[300px]`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-bold ${col.accent}`}>
                  {col.status}
                  <span className="ml-2 text-xs text-slate-400">
                    {colIssues.length}件 / {totalPoints}pt
                  </span>
                </h3>
                {onAdd && (
                  <button
                    onClick={() => onAdd(col.status)}
                    title="この列に課題を追加"
                    className="text-slate-400 hover:text-white transition"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {colIssues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => onIssueClick?.(issue)}
                    className="w-full text-left bg-slate-900/60 hover:bg-slate-900 border border-slate-700 rounded-lg p-3 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-blue-300">{issue.id}</span>
                      <span className="text-xs text-slate-400">{issue.points}pt</span>
                    </div>
                    <p className="text-sm text-slate-200 line-clamp-2 mb-2">{issue.title}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-slate-400">
                        <User size={12} />
                        {issue.assignee || '—'}
                      </span>
                      <span className="text-slate-400">
                        {issue.actualHours}h / {issue.estimatedHours}h
                      </span>
                    </div>
                  </button>
                ))}
                {colIssues.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">課題なし</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
