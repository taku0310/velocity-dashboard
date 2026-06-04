import { useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronRight, Save, Trash2, X } from 'lucide-react';
import type { Issue, IssuePriority, IssueStatus, IssueType } from '../types';
import { canSetParent } from '../utils/hierarchy';
import { Modal } from './Modal';

interface Props {
  issue: Issue | null;
  isNew: boolean;
  assignees: string[];
  allIssues: Issue[];
  onSave: (issue: Issue) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const STATUSES: IssueStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];
const TYPES: IssueType[] = ['Feature', 'Bug', 'Improvement', 'Task'];
const PRIORITIES: IssuePriority[] = ['Low', 'Medium', 'High', 'Critical'];

const NEW_ASSIGNEE_VALUE = '__NEW__';
const UNASSIGNED_VALUE = '';

function toInputDate(iso?: string): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function fromInputDate(date: string): string | undefined {
  if (!date) return undefined;
  return new Date(date).toISOString();
}

// 数値文字列を受け付けるバリデーション
function parseNonNegativeNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function IssueEditModal({
  issue,
  isNew,
  assignees,
  allIssues,
  onSave,
  onDelete,
  onClose,
}: Props) {
  // 数値フィールドは入力中の状態を保つため string で持つ
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<IssueStatus>('To Do');
  const [assignee, setAssignee] = useState('');
  const [assigneeMode, setAssigneeMode] = useState<'select' | 'custom'>('select');
  const [pointsStr, setPointsStr] = useState('0');
  const [estStr, setEstStr] = useState('0');
  const [actStr, setActStr] = useState('0');
  const [type, setType] = useState<IssueType>('Task');
  const [priority, setPriority] = useState<IssuePriority>('Medium');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [labelsStr, setLabelsStr] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [epicId, setEpicId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  useEffect(() => {
    if (!issue) return;
    setId(issue.id);
    setTitle(issue.title);
    setStatus(issue.status);
    setAssignee(issue.assignee || '');
    // 既存の担当者が選択肢に含まれていない場合はカスタムモード
    if (issue.assignee && !assignees.includes(issue.assignee)) {
      setAssigneeMode('custom');
    } else {
      setAssigneeMode('select');
    }
    setPointsStr(String(issue.points));
    setEstStr(String(issue.estimatedHours));
    setActStr(String(issue.actualHours));
    setType(issue.type);
    setPriority(issue.priority);
    setStartDate(toInputDate(issue.startDate));
    setDueDate(toInputDate(issue.dueDate));
    setLabelsStr(issue.labels.join(', '));
    setParentId(issue.parentId || '');
    setEpicId(issue.epicId || '');
    setError(null);
  }, [issue, assignees]);

  if (!issue) return null;

  // 親候補: 自分自身と子孫を除く / Epic は親候補から除外（Epic は別フィールドで指定）
  const parentCandidates = allIssues.filter((i) => {
    if (i.id === issue.id) return false;
    if (i.type === 'Epic') return false;
    return canSetParent(allIssues, issue.id, i.id);
  });
  // エピック候補: type === 'Epic' のもの。Epic 同士は紐付けない
  const epicCandidates =
    issue.type === 'Epic' ? [] : allIssues.filter((i) => i.type === 'Epic' && i.id !== issue.id);

  const handleAssigneeChange = (value: string) => {
    if (value === NEW_ASSIGNEE_VALUE) {
      setAssigneeMode('custom');
      setAssignee('');
    } else {
      setAssigneeMode('select');
      setAssignee(value);
    }
  };

  const handleSave = () => {
    // バリデーション
    if (!title.trim()) {
      setError('タイトルは必須です');
      return;
    }
    const points = parseNonNegativeNumber(pointsStr);
    const est = parseNonNegativeNumber(estStr);
    const act = parseNonNegativeNumber(actStr);
    if (points === null) {
      setError('Points を 0 以上の数値で入力してください');
      return;
    }
    if (est === null) {
      setError('見積（h）を 0 以上の数値で入力してください');
      return;
    }
    if (act === null) {
      setError('実績（h）を 0 以上の数値で入力してください');
      return;
    }
    if (!id.trim()) {
      setError('ID は必須です');
      return;
    }

    onSave({
      ...issue,
      id: id.trim(),
      title: title.trim(),
      status,
      assignee: assignee.trim(),
      points,
      estimatedHours: est,
      actualHours: act,
      type,
      priority,
      startDate: fromInputDate(startDate),
      dueDate: fromInputDate(dueDate),
      labels: labelsStr
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean),
      parentId: parentId || undefined,
      epicId: issue.type === 'Epic' ? undefined : epicId || undefined,
    });
  };

  const footer = (
    <div className="flex items-center justify-between">
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
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm flex items-center gap-2"
        >
          <Save size={16} />
          保存
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? '課題を追加' : `課題を編集 (${issue.id})`}
      footer={footer}
    >
      <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">ID *</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">タイトル *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">ステータス</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IssueStatus)}
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
              {assigneeMode === 'select' ? (
                <select
                  value={assignee}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value={UNASSIGNED_VALUE}>未アサイン</option>
                  {assignees.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                  <option value={NEW_ASSIGNEE_VALUE}>＋ 新しい担当者を入力…</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="新しい担当者名"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAssigneeMode('select');
                      setAssignee('');
                    }}
                    className="px-2 text-slate-400 hover:text-white"
                    title="プルダウンに戻す"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Points *</label>
              <input
                type="text"
                inputMode="decimal"
                value={pointsStr}
                onChange={(e) => setPointsStr(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">見積 (h) *</label>
              <input
                type="text"
                inputMode="decimal"
                value={estStr}
                onChange={(e) => setEstStr(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">実績 (h) *</label>
              <input
                type="text"
                inputMode="decimal"
                value={actStr}
                onChange={(e) => setActStr(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDetailsExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white py-1 -ml-1"
          >
            {detailsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            詳細{detailsExpanded ? 'を隠す' : 'を表示'}
          </button>

          {detailsExpanded && (
            <div className="space-y-4 pl-2 border-l-2 border-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">タイプ</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as IssueType)}
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
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
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
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">期限</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {issue.type !== 'Epic' && (
            <div>
              <label className="block text-sm text-slate-300 mb-1">エピック</label>
              <select
                value={epicId}
                onChange={(e) => setEpicId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">なし</option>
                {epicCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-300 mb-1">親課題（サブタスク化）</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">なし</option>
              {parentCandidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              ラベル（カンマ区切り）
            </label>
            <input
              type="text"
              value={labelsStr}
              onChange={(e) => setLabelsStr(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-900/30 border border-red-700 text-red-200 px-3 py-2 rounded-lg text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
      </div>
    </Modal>
  );
}
