import { useState } from 'react';
import { Kanban, Plus, User } from 'lucide-react';
import type { Issue, IssueStatus } from '../types';

interface Props {
  issues: Issue[];
  onIssueClick?: (issue: Issue) => void;
  onAdd?: (status: IssueStatus) => void;
  onStatusChange?: (issueId: string, newStatus: IssueStatus) => void;
}

const COLUMNS: Array<{ status: IssueStatus; color: string; accent: string }> = [
  { status: 'To Do', color: 'bg-slate-700/40', accent: 'text-slate-300' },
  { status: 'In Progress', color: 'bg-blue-900/30', accent: 'text-blue-300' },
  { status: 'Review', color: 'bg-purple-900/30', accent: 'text-purple-300' },
  { status: 'Done', color: 'bg-emerald-900/30', accent: 'text-emerald-300' },
];

const DRAG_MIME = 'application/x-issue-id';

export function ProgressBoard({ issues, onIssueClick, onAdd, onStatusChange }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<IssueStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, issue: Issue) => {
    e.dataTransfer.setData(DRAG_MIME, issue.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(issue.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTargetStatus(null);
  };

  const handleDragOver = (e: React.DragEvent, status: IssueStatus) => {
    if (!onStatusChange) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTargetStatus !== status) setDropTargetStatus(status);
  };

  const handleDragLeave = (status: IssueStatus) => {
    if (dropTargetStatus === status) setDropTargetStatus(null);
  };

  const handleDrop = (e: React.DragEvent, status: IssueStatus) => {
    if (!onStatusChange) return;
    e.preventDefault();
    const id = e.dataTransfer.getData(DRAG_MIME);
    setDropTargetStatus(null);
    setDraggingId(null);
    if (!id) return;
    const issue = issues.find((i) => i.id === id);
    if (!issue || issue.status === status) return;
    onStatusChange(id, status);
  };

  return (
    <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
      <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
        <Kanban size={22} className="text-blue-400" />
        進捗ボード
      </h2>
      {onStatusChange && (
        <p className="text-xs text-slate-400 mb-4">
          ※ カードを別の列にドラッグ&ドロップしてステータスを変更できます
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {COLUMNS.map((col) => {
          const colIssues = issues.filter((i) => i.status === col.status);
          const totalPoints = colIssues.reduce((s, i) => s + i.points, 0);
          const isTarget = dropTargetStatus === col.status;
          return (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={() => handleDragLeave(col.status)}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`${col.color} rounded-lg p-3 min-h-[300px] transition-all ${
                isTarget ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900' : ''
              }`}
            >
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
                {colIssues.map((issue) => {
                  const dragging = draggingId === issue.id;
                  return (
                    <div
                      key={issue.id}
                      draggable={!!onStatusChange}
                      onDragStart={(e) => handleDragStart(e, issue)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onIssueClick?.(issue)}
                      className={`bg-slate-900/60 hover:bg-slate-900 border border-slate-700 rounded-lg p-3 transition cursor-pointer ${
                        dragging ? 'opacity-50' : ''
                      } ${onStatusChange ? 'active:cursor-grabbing' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs text-blue-300">{issue.id}</span>
                        <span className="text-xs text-slate-400">{issue.points}pt</span>
                      </div>
                      <p className="text-sm text-slate-200 line-clamp-2 mb-2">{issue.title}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-slate-400">
                          <User size={12} />
                          {issue.assignee || '未アサイン'}
                        </span>
                        <span className="text-slate-400">
                          {issue.actualHours}h / {issue.estimatedHours}h
                        </span>
                      </div>
                    </div>
                  );
                })}
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
