import { useMemo, useState } from 'react';
import { ListChecks, Search } from 'lucide-react';
import type { Issue, IssueStatus } from '../types';

interface Props {
  issues: Issue[];
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

export function IssuesTable({ issues }: Props) {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | IssueStatus>('all');

  const filtered = useMemo(() => {
    const lower = filter.toLowerCase();
    return issues.filter((i) => {
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (!lower) return true;
      return (
        i.id.toLowerCase().includes(lower) ||
        i.title.toLowerCase().includes(lower) ||
        i.assignee.toLowerCase().includes(lower)
      );
    });
  }, [issues, filter, statusFilter]);

  return (
    <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ListChecks size={22} className="text-blue-400" />
          全課題一覧（{filtered.length} / {issues.length}）
        </h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="検索…"
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | IssueStatus)}
            className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">すべて</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Review">Review</option>
            <option value="Done">Done</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-2 px-2">ID</th>
              <th className="text-left py-2 px-2">タイトル</th>
              <th className="text-right py-2 px-2">pt</th>
              <th className="text-right py-2 px-2">見積(h)</th>
              <th className="text-right py-2 px-2">実績(h)</th>
              <th className="text-right py-2 px-2">精度</th>
              <th className="text-left py-2 px-2">ステータス</th>
              <th className="text-left py-2 px-2">担当者</th>
              <th className="text-left py-2 px-2">ラベル</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((issue) => {
              const acc = accuracyValue(issue);
              return (
                <tr key={issue.id} className="border-b border-slate-800 hover:bg-slate-700/20">
                  <td className="py-2 px-2 font-mono text-xs text-blue-300">{issue.id}</td>
                  <td className="py-2 px-2 max-w-[280px] truncate">{issue.title}</td>
                  <td className="py-2 px-2 text-right">{issue.points}</td>
                  <td className="py-2 px-2 text-right">{issue.estimatedHours}</td>
                  <td className="py-2 px-2 text-right">{issue.actualHours}</td>
                  <td className="py-2 px-2 text-right">{acc > 0 ? `${acc}%` : '—'}</td>
                  <td className="py-2 px-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${statusBadge(issue.status)}`}
                    >
                      {issue.status}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-slate-300">{issue.assignee}</td>
                  <td className="py-2 px-2 text-slate-400 text-xs">
                    {issue.labels.join(', ') || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
