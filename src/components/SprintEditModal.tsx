import { useEffect, useState } from 'react';
import { Save, Trash2, X } from 'lucide-react';
import type { Sprint } from '../types';

interface Props {
  sprint: Sprint | null;
  isNew: boolean;
  onSave: (updates: { name: string; startDate: string; endDate: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

function toInputDate(iso: string): string {
  return iso.slice(0, 10);
}

export function SprintEditModal({ sprint, isNew, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (sprint) {
      setName(sprint.name);
      setStartDate(toInputDate(sprint.startDate));
      setEndDate(toInputDate(sprint.endDate));
    }
  }, [sprint]);

  if (!sprint) return null;

  const handleSave = () => {
    if (!name.trim() || !startDate || !endDate) return;
    onSave({
      name: name.trim(),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{isNew ? 'スプリントを追加' : 'スプリントを編集'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">名前 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">開始日</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">終了日</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
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
              disabled={!name.trim() || !startDate || !endDate}
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
