import { Filter, X, Search } from 'lucide-react';
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

const STATUS_OPTIONS: Array<{ value: IssueFilters['status']; label: string }> = [
  { value: 'all', label: 'すべて' },
  { value: 'To Do', label: 'To Do' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Review', label: 'Review' },
  { value: 'Done', label: 'Done' },
];

function isActive(f: IssueFilters): boolean {
  return f.search !== '' || f.status !== 'all' || f.assignee !== '' || f.label !== '';
}

interface ChipProps {
  label: string;
  onRemove: () => void;
}

function Chip({ label, onRemove }: ChipProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-700/40 border border-blue-600 rounded text-xs text-blue-100">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-white"
        aria-label={`${label} を解除`}
      >
        <X size={12} />
      </button>
    </span>
  );
}

export function FiltersBar({ filters, onChange, assignees, labels }: Props) {
  const active = isActive(filters);

  const removeSearch = () => onChange({ ...filters, search: '' });
  const removeStatus = () => onChange({ ...filters, status: 'all' });
  const removeAssignee = () => onChange({ ...filters, assignee: '' });
  const removeLabel = () => onChange({ ...filters, label: '' });
  const clearAll = () => onChange({ search: '', status: 'all', assignee: '', label: '' });

  return (
    <div
      className={`border rounded-lg p-3 mb-4 transition-colors ${
        active
          ? 'bg-blue-900/15 border-blue-700/60'
          : 'bg-slate-800/30 border-slate-700'
      }`}
    >
      <div className="flex flex-wrap gap-2 items-center">
        <Filter size={16} className={active ? 'text-blue-400' : 'text-slate-400'} />
        <div className="relative flex-1 min-w-[180px]">
          <Search
            size={14}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
          <input
            id="global-search"
            type="text"
            placeholder="検索… (/ で集中)"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-7 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) =>
            onChange({ ...filters, status: e.target.value as IssueFilters['status'] })
          }
          className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm focus:outline-none focus:border-blue-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label === 'すべて' ? 'すべてのステータス' : o.label}
            </option>
          ))}
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
        {active && (
          <button
            onClick={clearAll}
            className="ml-auto text-xs text-slate-300 hover:text-white flex items-center gap-1 px-2 py-1"
          >
            <X size={14} />
            クリア
          </button>
        )}
      </div>

      {active && (
        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-blue-700/30">
          <span className="text-[10px] text-blue-300 uppercase tracking-wider self-center">
            適用中
          </span>
          {filters.search && (
            <Chip label={`検索: ${filters.search}`} onRemove={removeSearch} />
          )}
          {filters.status !== 'all' && (
            <Chip label={`状態: ${filters.status}`} onRemove={removeStatus} />
          )}
          {filters.assignee && (
            <Chip label={`担当者: ${filters.assignee}`} onRemove={removeAssignee} />
          )}
          {filters.label && <Chip label={`ラベル: ${filters.label}`} onRemove={removeLabel} />}
        </div>
      )}
    </div>
  );
}
