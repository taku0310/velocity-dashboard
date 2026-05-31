import { useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, Home } from 'lucide-react';
import type { Issue, IssueStatus, Sprint } from '../types';
import { buildHierarchy, canSetParent } from '../utils/hierarchy';

interface Props {
  sprint: Sprint;
  onIssueClick?: (issue: Issue) => void;
  onSetParent?: (childId: string, newParentId: string | undefined) => void;
}

const STATUS_COLORS: Record<IssueStatus, string> = {
  'To Do': 'bg-slate-500',
  'In Progress': 'bg-blue-500',
  Review: 'bg-purple-500',
  Done: 'bg-emerald-500',
};

const DAY_MS = 1000 * 60 * 60 * 24;
const DRAG_MIME = 'application/x-gantt-issue-id';

function diffDays(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / DAY_MS;
}

function clampDate(d: Date, min: Date, max: Date): Date {
  if (d.getTime() < min.getTime()) return min;
  if (d.getTime() > max.getTime()) return max;
  return d;
}

export function GanttChart({ sprint, onIssueClick, onSetParent }: Props) {
  const start = useMemo(() => new Date(sprint.startDate), [sprint.startDate]);
  const end = useMemo(() => new Date(sprint.endDate), [sprint.endDate]);
  const totalDays = Math.max(1, Math.ceil(diffDays(start, end)));

  const today = new Date();
  const todayOffset = diffDays(start, today);
  const todayPct = (todayOffset / totalDays) * 100;
  const showToday = todayOffset >= 0 && todayOffset <= totalDays;

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [rootHovered, setRootHovered] = useState(false);

  // 階層順に並んだ行データ
  const hierarchyRows = useMemo(() => buildHierarchy(sprint.issues), [sprint.issues]);

  const rows = useMemo(() => {
    return hierarchyRows.map(({ issue, depth }) => {
      const issueStart = issue.startDate ? new Date(issue.startDate) : start;
      const rawEnd = issue.completionDate
        ? new Date(issue.completionDate)
        : issue.dueDate
          ? new Date(issue.dueDate)
          : end;
      const issueEnd = clampDate(rawEnd, start, end);
      const issueStartClamped = clampDate(issueStart, start, end);
      const offset = diffDays(start, issueStartClamped);
      const length = Math.max(0.5, diffDays(issueStartClamped, issueEnd));
      return {
        issue,
        depth,
        offsetPct: (offset / totalDays) * 100,
        lengthPct: (length / totalDays) * 100,
      };
    });
  }, [hierarchyRows, start, end, totalDays]);

  const dayLabels = useMemo(() => {
    const labels: string[] = [];
    const step = totalDays <= 14 ? 1 : Math.ceil(totalDays / 14);
    for (let d = 0; d <= totalDays; d += step) {
      const day = new Date(start);
      day.setDate(day.getDate() + d);
      labels.push(`${day.getMonth() + 1}/${day.getDate()}`);
    }
    return labels;
  }, [start, totalDays]);

  const handleDragStart = (e: React.DragEvent, issue: Issue) => {
    if (!onSetParent) return;
    e.dataTransfer.setData(DRAG_MIME, issue.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(issue.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTargetId(null);
    setRootHovered(false);
  };

  const isDropAllowed = (targetIssueId: string): boolean => {
    if (!draggingId) return false;
    if (draggingId === targetIssueId) return false;
    return canSetParent(sprint.issues, draggingId, targetIssueId);
  };

  const handleRowDragOver = (e: React.DragEvent, targetIssue: Issue) => {
    if (!onSetParent) return;
    if (!isDropAllowed(targetIssue.id)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTargetId !== targetIssue.id) setDropTargetId(targetIssue.id);
  };

  const handleRowDragLeave = (targetIssue: Issue) => {
    if (dropTargetId === targetIssue.id) setDropTargetId(null);
  };

  const handleRowDrop = (e: React.DragEvent, targetIssue: Issue) => {
    if (!onSetParent) return;
    e.preventDefault();
    const childId = e.dataTransfer.getData(DRAG_MIME);
    setDropTargetId(null);
    setDraggingId(null);
    if (!childId || childId === targetIssue.id) return;
    if (!canSetParent(sprint.issues, childId, targetIssue.id)) return;
    onSetParent(childId, targetIssue.id);
  };

  const handleRootDragOver = (e: React.DragEvent) => {
    if (!onSetParent || !draggingId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setRootHovered(true);
  };

  const handleRootDrop = (e: React.DragEvent) => {
    if (!onSetParent) return;
    e.preventDefault();
    const childId = e.dataTransfer.getData(DRAG_MIME);
    setRootHovered(false);
    setDraggingId(null);
    if (!childId) return;
    onSetParent(childId, undefined);
  };

  return (
    <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarDays size={22} className="text-blue-400" />
          ガントチャート
        </h2>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {(['To Do', 'In Progress', 'Review', 'Done'] as IssueStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded-sm ${STATUS_COLORS[s]}`} />
              {s}
            </span>
          ))}
        </div>
      </div>

      {onSetParent && (
        <p className="text-xs text-slate-400 mb-3">
          ※ 課題名をドラッグ → 別の課題行にドロップで子課題化／下の「ルート」エリアにドロップで階層解除
        </p>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* ヘッダー（日付） */}
          <div className="flex border-b border-slate-700 pb-2 mb-2">
            <div className="w-64 flex-shrink-0 text-xs text-slate-400">課題</div>
            <div className="flex-1 relative h-5 text-xs text-slate-400">
              {dayLabels.map((label, i) => (
                <span
                  key={i}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${(i * 100) / (dayLabels.length - 1 || 1)}%` }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* ガント行 */}
          <div className="relative">
            {showToday && (
              <div
                className="absolute top-0 bottom-0 w-px bg-amber-400 z-10 pointer-events-none"
                style={{ left: `calc(16rem + (100% - 16rem) * ${todayPct / 100})` }}
                aria-label="今日"
              />
            )}

            {rows.length === 0 && (
              <p className="text-slate-400 text-sm py-8 text-center">課題がありません</p>
            )}

            {rows.map(({ issue, depth, offsetPct, lengthPct }) => {
              const isDragging = draggingId === issue.id;
              const isDropTarget = dropTargetId === issue.id;
              return (
                <div
                  key={issue.id}
                  onDragOver={(e) => handleRowDragOver(e, issue)}
                  onDragLeave={() => handleRowDragLeave(issue)}
                  onDrop={(e) => handleRowDrop(e, issue)}
                  className={`flex items-center py-1.5 rounded transition ${
                    isDragging ? 'opacity-40' : ''
                  } ${isDropTarget ? 'bg-blue-500/20 ring-1 ring-blue-400' : 'hover:bg-slate-700/20'}`}
                >
                  <div
                    className="w-64 flex-shrink-0 pr-2 truncate text-sm flex items-center"
                    style={{ paddingLeft: `${depth * 16}px` }}
                    draggable={!!onSetParent}
                    onDragStart={(e) => handleDragStart(e, issue)}
                    onDragEnd={handleDragEnd}
                    title={onSetParent ? 'ドラッグして親課題を変更' : undefined}
                  >
                    {depth > 0 && (
                      <ChevronRight size={12} className="text-slate-500 flex-shrink-0 mr-1" />
                    )}
                    <span
                      className={`font-mono text-xs text-blue-300 mr-2 ${
                        onSetParent ? 'cursor-grab active:cursor-grabbing' : ''
                      }`}
                    >
                      {issue.id}
                    </span>
                    <span className="text-slate-200 truncate">{issue.title}</span>
                  </div>
                  <div className="flex-1 relative h-7">
                    <div className="absolute inset-y-0 left-0 right-0 bg-slate-900/40 rounded" />
                    <button
                      onClick={() => onIssueClick?.(issue)}
                      className={`absolute h-6 top-0.5 rounded ${
                        STATUS_COLORS[issue.status]
                      } bg-opacity-80 hover:bg-opacity-100 transition cursor-pointer text-xs text-white truncate px-2 text-left`}
                      style={{
                        left: `${offsetPct}%`,
                        width: `${Math.max(2, lengthPct)}%`,
                      }}
                      title={`${issue.id} ${issue.title} (${issue.assignee || '未アサイン'})`}
                    >
                      {issue.assignee || issue.id}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ルートにドロップして階層解除 */}
          {onSetParent && draggingId && (
            <div
              onDragOver={handleRootDragOver}
              onDragLeave={() => setRootHovered(false)}
              onDrop={handleRootDrop}
              className={`mt-3 border-2 border-dashed rounded-lg py-3 text-center text-sm transition ${
                rootHovered
                  ? 'border-amber-400 bg-amber-500/10 text-amber-200'
                  : 'border-slate-600 text-slate-400'
              }`}
            >
              <Home size={14} className="inline mr-1" />
              ここにドロップして階層を解除（ルート課題化）
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-3">
        ※ 縦線は本日。バーは着手日〜完了日（未完了は期限日）の期間を示します。
      </p>
    </div>
  );
}
