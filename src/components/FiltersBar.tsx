import { Filter, X } from 'lucide-react';
import type { IssueStatus } from '../types';

export interface IssueFilters {
  search: string;
  status: 'all' | IssueStatus;
  assignee: string;
  label: string;
}

interface Props {
  filters: IssueFilters;
  onChange: (filters: IssueFilters) => void;
  assignees: string[];
  labels: string[];
}

export function FiltersBar({ filters, onChange, assignees, labels }: Props) {
  const hasActive =
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.assignee !== '' ||
    filters.label !== '';

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 flex flex-wrap gap-2 items-center mb-4">
      <Filter size={16} className="text-slate-400" />
      <input
        type="text"
        placeholder="検索…"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm focus:outline-none focus:border-blue-500 flex-1 min-w-[160px]"
      />
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value as IssueFilters['status'] })}
        className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm focus:outline-none focus:border-blue-500"
      >
        <option value="all">すべてのステータス</option>
        <option value="To Do">To Do</option>
        <option value="In Progress">In Progress</option>
        <option value="Review">Review</option>
        <option value="Done">Done</option>
      </select>
      <select
        value={filters.assignee}
        onChange={(e) => onChange({ ...filters, assignee: e.target.value })}
        className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm focus:outline-none focus:border-blue-500"
      >
        <option value="">すべての担当者</option>
        {assignees.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      <select
        value={filters.label}
        onChange={(e) => onChange({ ...filters, label: e.target.value })}
        className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm focus:outline-none focus:border-blue-500"
      >
        <option value="">すべてのラベル</option>
        {labels.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
      {hasActive && (
        <button
          onClick={() => onChange({ search: '', status: 'all', assignee: '', label: '' })}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 ml-auto"
        >
          <X size={14} />
          クリア
        </button>
      )}
    </div>
  );
}
