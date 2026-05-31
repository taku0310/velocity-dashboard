import { useEffect, useState } from 'react';
import { Save, Trash2, X } from 'lucide-react';
import type { Issue, IssuePriority, IssueStatus, IssueType } from '../types';

interface Props {
  issue: Issue | null;
  isNew: boolean;
  onSave: (issue: Issue) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const STATUSES: IssueStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];
const TYPES: IssueType[] = ['Feature', 'Bug', 'Improvement', 'Task'];
const PRIORITIES: IssuePriority[] = ['Low', 'Medium', 'High', 'Critical'];

function toInputDate(iso?: string): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function fromInputDate(date: string): string | undefined {
  if (!date) return undefined;
  return new Date(date).toISOString();
}

export function IssueEditModal({ issue, isNew, onSave, onDelete, onClose }: Props) {
  const [draft, setDraft] = useState<Issue | null>(issue);

  useEffect(() => {
    setDraft(issue);
  }, [issue]);

  if (!draft) return null;

  const update = <K extends keyof Issue>(key: K, value: Issue[K]) => {
    setDraft({ ...draft, [key]: value });
  };

  const handleSave = () => {
    if (!draft.title.trim()) return;
    onSave(draft);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{isNew ? '課題を追加' : `課題を編集 (${draft.id})`}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">ID</label>
            <input
              type="text"
              value={draft.id}
              onChange={(e) => update('id', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">タイトル *</label>
            <input
              type="text"
              required
              value={draft.title}
              onChange={(e) => update('title', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">ステータス</label>
              <select
                value={draft.status}
                onChange={(e) => update('status', e.target.value as IssueStatus)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">担当者</label>
              <input
                type="text"
                value={draft.assignee}
                onChange={(e) => update('assignee', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Points</label>
              <input
                type="number"
                min={0}
                value={draft.points}
                onChange={(e) => update('points', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">見積 (h)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={draft.estimatedHours}
                onChange={(e) => update('estimatedHours', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">実績 (h)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={draft.actualHours}
                onChange={(e) => update('actualHours', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">タイプ</label>
              <select
                value={draft.type}
                onChange={(e) => update('type', e.target.value as IssueType)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">優先度</label>
              <select
                value={draft.priority}
                onChange={(e) => update('priority', e.target.value as IssuePriority)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">着手日</label>
              <input
                type="date"
                value={toInputDate(draft.startDate)}
                onChange={(e) => update('startDate', fromInputDate(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">期限</label>
              <input
                type="date"
                value={toInputDate(draft.dueDate)}
                onChange={(e) => update('dueDate', fromInputDate(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">ラベル（カンマ区切り）</label>
            <input
              type="text"
              value={draft.labels.join(', ')}
              onChange={(e) =>
                update(
                  'labels',
                  e.target.value
                    .split(',')
                    .map((l) => l.trim())
                    .filter(Boolean),
                )
              }
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
          {!isNew && onDelete ? (
            <button
              onClick={onDelete}
              className="px-3 py-2 text-red-400 hover:text-red-300 flex items-center gap-2 text-sm"
            >
              <Trash2 size={16} />
              削除
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={!draft.title.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-sm flex items-center gap-2"
            >
              <Save size={16} />
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
