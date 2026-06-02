import { useMemo, useState } from 'react';
import { Kanban, Plus, User } from 'lucide-react';
import type { Issue, IssueStatus } from '../types';

interface Props {
  issues: Issue[];
  onIssueClick?: (issue: Issue) => void;
  onAdd?: (status: IssueStatus, epicId?: string) => void;
  onStatusChange?: (issueId: string, newStatus: IssueStatus) => void;
}

const COLUMNS: Array<{ status: IssueStatus; color: string; accent: string }> = [
  { status: 'To Do', color: 'bg-slate-700/40', accent: 'text-slate-300' },
  { status: 'In Progress', color: 'bg-blue-900/30', accent: 'text-blue-300' },
  { status: 'Review', color: 'bg-purple-900/30', accent: 'text-purple-300' },
  { status: 'Done', color: 'bg-emerald-900/30', accent: 'text-emerald-300' },
];

const DRAG_MIME = 'application/x-issue-id';
const NO_EPIC_KEY = '__NO_EPIC__';

interface EpicGroup {
  epic: Issue | null; // null = "No Epic"
  key: string;
  issues: Issue[];
}

export function ProgressBoard({ issues, onIssueClick, onAdd, onStatusChange }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ epicKey: string; status: IssueStatus } | null>(
    null,
  );

  const groups = useMemo<EpicGroup[]>(() => {
    const epics = issues.filter((i) => i.type === 'Epic');
    const nonEpics = issues.filter((i) => i.type !== 'Epic');
    const epicById = new Map(epics.map((e) => [e.id, e]));

    const buckets = new Map<string, Issue[]>();
    for (const e of epics) buckets.set(e.id, []);
    buckets.set(NO_EPIC_KEY, []);

    for (const issue of nonEpics) {
      const key = issue.epicId && epicById.has(issue.epicId) ? issue.epicId : NO_EPIC_KEY;
      buckets.get(key)!.push(issue);
    }

    const result: EpicGroup[] = epics.map((e) => ({
      epic: e,
      key: e.id,
      issues: buckets.get(e.id) || [],
    }));
    const noEpicIssues = buckets.get(NO_EPIC_KEY) || [];
    if (noEpicIssues.length > 0 || epics.length === 0) {
      result.push({ epic: null, key: NO_EPIC_KEY, issues: noEpicIssues });
    }
    return result;
  }, [issues]);

  const handleDragStart = (e: React.DragEvent, issue: Issue) => {
    e.dataTransfer.setData(DRAG_MIME, issue.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(issue.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, epicKey: string, status: IssueStatus) => {
    if (!onStatusChange) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (
      !dropTarget ||
      dropTarget.epicKey !== epicKey ||
      dropTarget.status !== status
    ) {
      setDropTarget({ epicKey, status });
    }
  };

  const handleDragLeave = (epicKey: string, status: IssueStatus) => {
    if (dropTarget?.epicKey === epicKey && dropTarget.status === status) {
      setDropTarget(null);
    }
  };

  const handleDrop = (e: React.DragEvent, status: IssueStatus) => {
    if (!onStatusChange) return;
    e.preventDefault();
    const id = e.dataTransfer.getData(DRAG_MIME);
    setDropTarget(null);
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
        進捗ボード（エピック別スイムレーン）
      </h2>
      {onStatusChange && (
        <p className="text-xs text-slate-400 mb-4">
          ※ カードを別の列にドラッグ&ドロップしてステータスを変更できます
        </p>
      )}

      <div className="space-y-4">
        {groups.map((group) => {
          const totalPoints = group.issues.reduce((s, i) => s + i.points, 0);
          const donePoints = group.issues
            .filter((i) => i.status === 'Done')
            .reduce((s, i) => s + i.points, 0);
          return (
            <div key={group.key} className="border border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-slate-800/60 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {group.epic ? (
                    <>
                      <span className="px-2 py-0.5 bg-purple-700 rounded text-xs text-purple-100 flex-shrink-0">
                        EPIC
                      </span>
                      <span className="font-mono text-xs text-blue-300 flex-shrink-0">
                        {group.epic.id}
                      </span>
                      <span className="text-slate-100 truncate">{group.epic.title}</span>
                    </>
                  ) : (
                    <>
                      <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300 flex-shrink-0">
                        未分類
                      </span>
                      <span className="text-slate-200">エピック未割り当て</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-slate-400 flex-shrink-0 ml-2">
                  {group.issues.length}件 · {donePoints}/{totalPoints}pt
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 p-2 bg-slate-900/30">
                {COLUMNS.map((col) => {
                  const colIssues = group.issues.filter((i) => i.status === col.status);
                  const colPoints = colIssues.reduce((s, i) => s + i.points, 0);
                  const isTarget =
                    dropTarget?.epicKey === group.key && dropTarget?.status === col.status;
                  return (
                    <div
                      key={col.status}
                      onDragOver={(e) => handleDragOver(e, group.key, col.status)}
                      onDragLeave={() => handleDragLeave(group.key, col.status)}
                      onDrop={(e) => handleDrop(e, col.status)}
                      className={`${col.color} rounded p-2 min-h-[140px] transition-all ${
                        isTarget ? 'ring-2 ring-blue-400' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-xs font-bold ${col.accent}`}>
                          {col.status}
                          <span className="ml-2 text-[10px] text-slate-400">
                            {colIssues.length}件 / {colPoints}pt
                          </span>
                        </h3>
                        {onAdd && (
                          <button
                            onClick={() =>
                              onAdd(col.status, group.epic ? group.epic.id : undefined)
                            }
                            title="この列に課題を追加"
                            className="text-slate-400 hover:text-white transition"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {colIssues.map((issue) => {
                          const dragging = draggingId === issue.id;
                          return (
                            <div
                              key={issue.id}
                              draggable={!!onStatusChange}
                              onDragStart={(e) => handleDragStart(e, issue)}
                              onDragEnd={handleDragEnd}
                              onClick={() => onIssueClick?.(issue)}
                              className={`bg-slate-900/60 hover:bg-slate-900 border border-slate-700 rounded-lg p-2 transition cursor-pointer ${
                                dragging ? 'opacity-50' : ''
                              } ${onStatusChange ? 'active:cursor-grabbing' : ''}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono text-[10px] text-blue-300">
                                  {issue.id}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {issue.points}pt
                                </span>
                              </div>
                              <p className="text-xs text-slate-200 line-clamp-2 mb-1">
                                {issue.title}
                              </p>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="flex items-center gap-1 text-slate-400">
                                  <User size={10} />
                                  {issue.assignee || '未アサイン'}
                                </span>
                                <span className="text-slate-500">{issue.type}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
