import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import type { Issue, IssueStatus, Sprint } from '../types';

interface Props {
  sprint: Sprint;
  onIssueClick?: (issue: Issue) => void;
}

const STATUS_COLORS: Record<IssueStatus, string> = {
  'To Do': 'bg-slate-500',
  'In Progress': 'bg-blue-500',
  Review: 'bg-purple-500',
  Done: 'bg-emerald-500',
};

const DAY_MS = 1000 * 60 * 60 * 24;

function diffDays(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / DAY_MS;
}

function clampDate(d: Date, min: Date, max: Date): Date {
  if (d.getTime() < min.getTime()) return min;
  if (d.getTime() > max.getTime()) return max;
  return d;
}

export function GanttChart({ sprint, onIssueClick }: Props) {
  const start = useMemo(() => new Date(sprint.startDate), [sprint.startDate]);
  const end = useMemo(() => new Date(sprint.endDate), [sprint.endDate]);
  const totalDays = Math.max(1, Math.ceil(diffDays(start, end)));

  const today = new Date();
  const todayOffset = diffDays(start, today);
  const todayPct = (todayOffset / totalDays) * 100;
  const showToday = todayOffset >= 0 && todayOffset <= totalDays;

  const rows = useMemo(() => {
    return sprint.issues.map((issue) => {
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
        offsetPct: (offset / totalDays) * 100,
        lengthPct: (length / totalDays) * 100,
      };
    });
  }, [sprint.issues, start, end, totalDays]);

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

  return (
    <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
      <div className="flex items-center justify-between mb-4">
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

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* ヘッダー（日付） */}
          <div className="flex border-b border-slate-700 pb-2 mb-2">
            <div className="w-56 flex-shrink-0 text-xs text-slate-400">課題</div>
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
                style={{ left: `calc(14rem + (100% - 14rem) * ${todayPct / 100})` }}
                aria-label="今日"
              />
            )}

            {rows.length === 0 && (
              <p className="text-slate-400 text-sm py-8 text-center">課題がありません</p>
            )}

            {rows.map(({ issue, offsetPct, lengthPct }) => (
              <div
                key={issue.id}
                className="flex items-center py-1.5 hover:bg-slate-700/20 rounded"
              >
                <div className="w-56 flex-shrink-0 pr-2 truncate text-sm">
                  <span className="font-mono text-xs text-blue-300 mr-2">{issue.id}</span>
                  <span className="text-slate-200">{issue.title}</span>
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
                    title={`${issue.id} ${issue.title} (${issue.assignee})`}
                  >
                    {issue.assignee || issue.id}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-3">
        ※ 縦線は本日。バーは着手日〜完了日（未完了は期限日）の期間を示します。
      </p>
    </div>
  );
}
