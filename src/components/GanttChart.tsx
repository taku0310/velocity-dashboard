import { useMemo, useState } from 'react';
import { Bug, CalendarDays, ChevronRight, FileText, Home, Sparkles, Wrench } from 'lucide-react';
import type { Issue, IssueStatus, IssueType, Sprint } from '../types';
import { buildHierarchy, canSetParent, effectiveParentId, getSiblings } from '../utils/hierarchy';

interface Props {
  sprints: Sprint[];
  onIssueClick?: (issue: Issue) => void;
  // 親変更: childId, newParentId（undefined でルート化）
  onSetParent?: (childId: string, newParentId: string | undefined) => void;
  // 兄弟並べ替え: movedId を refId の above/below に挿入
  onReorder?: (movedId: string, refId: string, position: 'above' | 'below') => void;
}

const STATUS_COLORS: Record<IssueStatus, string> = {
  'To Do': 'bg-slate-500',
  'In Progress': 'bg-blue-500',
  Review: 'bg-purple-500',
  Done: 'bg-emerald-500',
};

const TYPE_META: Record<IssueType, { label: string; color: string; Icon: typeof FileText }> = {
  Epic: { label: 'Epic', color: 'bg-purple-600 text-purple-100', Icon: Sparkles },
  Feature: { label: 'Feature', color: 'bg-blue-600 text-blue-100', Icon: FileText },
  Bug: { label: 'Bug', color: 'bg-red-600 text-red-100', Icon: Bug },
  Improvement: { label: 'Imp.', color: 'bg-teal-600 text-teal-100', Icon: Wrench },
  Task: { label: 'Task', color: 'bg-slate-600 text-slate-100', Icon: FileText },
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

type DropMode = 'above' | 'below' | 'child';

export function GanttChart({ sprints, onIssueClick, onSetParent, onReorder }: Props) {
  // 全スプリントの範囲をプロジェクト全体として算出
  const { start, end, allIssues } = useMemo(() => {
    const issues: Issue[] = [];
    let minStart = Number.POSITIVE_INFINITY;
    let maxEnd = Number.NEGATIVE_INFINITY;
    for (const s of sprints) {
      const ss = new Date(s.startDate).getTime();
      const se = new Date(s.endDate).getTime();
      if (ss < minStart) minStart = ss;
      if (se > maxEnd) maxEnd = se;
      issues.push(...s.issues);
    }
    if (!Number.isFinite(minStart)) {
      const now = Date.now();
      minStart = now;
      maxEnd = now + 14 * DAY_MS;
    }
    return {
      start: new Date(minStart),
      end: new Date(maxEnd),
      allIssues: issues,
    };
  }, [sprints]);

  const totalDays = Math.max(1, Math.ceil(diffDays(start, end)));

  const today = new Date();
  const todayOffset = diffDays(start, today);
  const todayPct = (todayOffset / totalDays) * 100;
  const showToday = todayOffset >= 0 && todayOffset <= totalDays;

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; mode: DropMode } | null>(null);
  const [rootHovered, setRootHovered] = useState(false);

  // 階層順
  const hierarchyRows = useMemo(() => buildHierarchy(allIssues), [allIssues]);

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
      const length = Math.max(0.3, diffDays(issueStartClamped, issueEnd));
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
    const step = totalDays <= 14 ? 1 : Math.max(1, Math.ceil(totalDays / 14));
    for (let d = 0; d <= totalDays; d += step) {
      const day = new Date(start);
      day.setDate(day.getDate() + d);
      labels.push(`${day.getMonth() + 1}/${day.getDate()}`);
    }
    return labels;
  }, [start, totalDays]);

  const handleDragStart = (e: React.DragEvent, issue: Issue) => {
    if (!onSetParent && !onReorder) return;
    e.dataTransfer.setData(DRAG_MIME, issue.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(issue.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
    setRootHovered(false);
  };

  const computeDropMode = (e: React.DragEvent): DropMode => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    if (ratio < 0.3) return 'above';
    if (ratio > 0.7) return 'below';
    return 'child';
  };

  const isDropAllowed = (target: Issue, mode: DropMode): boolean => {
    if (!draggingId) return false;
    if (draggingId === target.id) return false;
    if (mode === 'child') {
      if (!onSetParent) return false;
      return canSetParent(allIssues, draggingId, target.id);
    }
    // above / below: 兄弟並べ替えとして扱う → 親変更も伴う場合は禁止
    if (!onReorder) return false;
    // 並べ替え後の親は target.effectiveParent
    const idSet = new Set(allIssues.map((i) => i.id));
    const newParent = effectiveParentId(target, idSet);
    return canSetParent(allIssues, draggingId, newParent);
  };

  const handleRowDragOver = (e: React.DragEvent, target: Issue) => {
    const mode = computeDropMode(e);
    if (!isDropAllowed(target, mode)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTarget?.id !== target.id || dropTarget.mode !== mode) {
      setDropTarget({ id: target.id, mode });
    }
  };

  const handleRowDragLeave = (target: Issue) => {
    if (dropTarget?.id === target.id) setDropTarget(null);
  };

  const handleRowDrop = (e: React.DragEvent, target: Issue) => {
    e.preventDefault();
    const movedId = e.dataTransfer.getData(DRAG_MIME);
    const mode = computeDropMode(e);
    setDropTarget(null);
    setDraggingId(null);
    if (!movedId || movedId === target.id) return;

    if (mode === 'child') {
      if (!onSetParent) return;
      if (!canSetParent(allIssues, movedId, target.id)) return;
      onSetParent(movedId, target.id);
      return;
    }

    // above / below → 兄弟並べ替え。target と同じ effective parent に揃え、orderを更新
    if (!onReorder) return;
    const idSet = new Set(allIssues.map((i) => i.id));
    const targetParent = effectiveParentId(target, idSet);
    const moved = allIssues.find((i) => i.id === movedId);
    if (!moved) return;
    if (!canSetParent(allIssues, movedId, targetParent)) return;

    const movedParent = effectiveParentId(moved, idSet);
    // 親が違う場合はまず親を揃える
    if (movedParent !== targetParent) {
      if (!onSetParent) return;
      // ここで parentId/epicId をどう書くべきか: target の effectiveParent と同じにしたい
      // targetParent が Epic の id なら epicId を、それ以外なら parentId を設定すべき
      const parentIssue = targetParent ? allIssues.find((i) => i.id === targetParent) : undefined;
      if (parentIssue && parentIssue.type === 'Epic') {
        onSetParent(movedId, parentIssue.id);
      } else {
        onSetParent(movedId, targetParent);
      }
    }
    onReorder(movedId, target.id, mode);
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

  const dragEnabled = !!onSetParent || !!onReorder;

  return (
    <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarDays size={22} className="text-blue-400" />
          ガントチャート（プロジェクト全体）
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

      {dragEnabled && (
        <p className="text-xs text-slate-400 mb-3">
          ※ 課題名をドラッグ → 行の<strong className="text-slate-300">上端</strong>/
          <strong className="text-slate-300">下端</strong>にドロップで並べ替え、
          <strong className="text-slate-300">中央</strong>にドロップで子課題化。下の
          <strong className="text-amber-300">ルートゾーン</strong>にドロップで親子解除。
        </p>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* ヘッダー（日付） */}
          <div className="flex border-b border-slate-700 pb-2 mb-2">
            <div className="w-72 flex-shrink-0 text-xs text-slate-400">課題</div>
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
                style={{ left: `calc(18rem + (100% - 18rem) * ${todayPct / 100})` }}
                aria-label="今日"
              />
            )}

            {rows.length === 0 && (
              <p className="text-slate-400 text-sm py-8 text-center">課題がありません</p>
            )}

            {rows.map(({ issue, depth, offsetPct, lengthPct }) => {
              const isDragging = draggingId === issue.id;
              const target = dropTarget?.id === issue.id ? dropTarget : null;
              const TypeIcon = TYPE_META[issue.type].Icon;
              return (
                <div
                  key={issue.id}
                  onDragOver={(e) => handleRowDragOver(e, issue)}
                  onDragLeave={() => handleRowDragLeave(issue)}
                  onDrop={(e) => handleRowDrop(e, issue)}
                  className={`flex items-center py-1.5 rounded transition relative ${
                    isDragging ? 'opacity-40' : ''
                  } ${target?.mode === 'child' ? 'bg-blue-500/20 ring-1 ring-blue-400' : 'hover:bg-slate-700/20'}`}
                >
                  {target?.mode === 'above' && (
                    <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-blue-400 z-20" />
                  )}
                  {target?.mode === 'below' && (
                    <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-blue-400 z-20" />
                  )}
                  <div
                    className="w-72 flex-shrink-0 pr-2 truncate text-sm flex items-center gap-1"
                    style={{ paddingLeft: `${depth * 16}px` }}
                    draggable={dragEnabled}
                    onDragStart={(e) => handleDragStart(e, issue)}
                    onDragEnd={handleDragEnd}
                    title={dragEnabled ? 'ドラッグして並べ替え／親変更' : undefined}
                  >
                    {depth > 0 && (
                      <ChevronRight size={12} className="text-slate-500 flex-shrink-0" />
                    )}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 flex-shrink-0 ${
                        TYPE_META[issue.type].color
                      }`}
                      title={issue.type}
                    >
                      <TypeIcon size={10} />
                      {TYPE_META[issue.type].label}
                    </span>
                    <span
                      className={`font-mono text-xs text-blue-300 flex-shrink-0 ${
                        dragEnabled ? 'cursor-grab active:cursor-grabbing' : ''
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

          {/* ルートゾーン: 親子解除 */}
          {dragEnabled && (
            <div
              onDragOver={handleRootDragOver}
              onDragLeave={() => setRootHovered(false)}
              onDrop={handleRootDrop}
              className={`mt-3 border-2 border-dashed rounded-lg py-3 text-center text-sm transition ${
                rootHovered
                  ? 'border-amber-400 bg-amber-500/10 text-amber-200'
                  : draggingId
                    ? 'border-amber-600 text-amber-300 bg-amber-900/10'
                    : 'border-slate-600 text-slate-400'
              }`}
            >
              <Home size={14} className="inline mr-1" />
              ルートゾーン: ここにドロップで親子関係を解除
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
