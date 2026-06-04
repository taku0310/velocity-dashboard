import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import type { AssigneePerformance, Issue } from '../types';
import { SortableHeader, compareValues, nextSortState } from './SortableHeader';
import { calculateAssigneeLoads, flagOverload } from '../lib/calc/overload';
import { OverloadBadge } from './Badge';

interface Props {
  data: AssigneePerformance[];
  // overload 計算用の生課題一覧（同スプリント or 横断、呼び出し元判断）
  issues?: Issue[];
}

function accuracyClass(accuracy: number): string {
  if (accuracy >= 95) return 'text-emerald-400';
  if (accuracy >= 85) return 'text-blue-400';
  return 'text-orange-400';
}

type ExtendedRow = AssigneePerformance & {
  inProgressCount: number;
  reviewStallCount: number;
  remainingPoints: number;
};

export function AssigneeTable({ data, issues }: Props) {
  const [sortKey, setSortKey] = useState<string | null>('completedPoints');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    const next = nextSortState(sortKey, sortDir, key);
    setSortKey(next.key);
    setSortDir(next.dir);
  };

  const { rows, overloadFlags } = useMemo(() => {
    const loads = issues ? calculateAssigneeLoads(issues) : [];
    const loadByAssignee = new Map(loads.map((l) => [l.assignee, l]));
    const flags = issues ? flagOverload(loads) : new Map();

    const extended: ExtendedRow[] = data.map((row) => {
      const load = loadByAssignee.get(row.assignee || '未アサイン');
      return {
        ...row,
        inProgressCount: load?.inProgressCount ?? 0,
        reviewStallCount: load?.reviewStallCount ?? 0,
        remainingPoints: load?.remainingPoints ?? 0,
      };
    });

    return { rows: extended, overloadFlags: flags };
  }, [data, issues]);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const k = sortKey as keyof ExtendedRow;
    return [...rows].sort((a, b) => compareValues(a[k], b[k], sortDir));
  }, [rows, sortKey, sortDir]);

  return (
    <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users size={22} className="text-emerald-400" />
          担当者別パフォーマンス
        </h2>
        {issues && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-700 rounded-sm" /> 進行中5+
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-orange-700 rounded-sm" /> Review滞留
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-amber-700 rounded-sm" /> 負荷大
            </span>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <SortableHeader label="担当者" sortKey="assignee" currentKey={sortKey} currentDir={sortDir} onChange={handleSort} />
              <SortableHeader label="完了 pt" sortKey="completedPoints" currentKey={sortKey} currentDir={sortDir} onChange={handleSort} align="right" />
              <SortableHeader label="完了数" sortKey="completedIssues" currentKey={sortKey} currentDir={sortDir} onChange={handleSort} align="right" />
              <SortableHeader label="全課題数" sortKey="totalIssues" currentKey={sortKey} currentDir={sortDir} onChange={handleSort} align="right" />
              {issues && (
                <>
                  <SortableHeader label="進行中" sortKey="inProgressCount" currentKey={sortKey} currentDir={sortDir} onChange={handleSort} align="right" />
                  <SortableHeader label="Review滞留" sortKey="reviewStallCount" currentKey={sortKey} currentDir={sortDir} onChange={handleSort} align="right" />
                  <SortableHeader label="未完了pt" sortKey="remainingPoints" currentKey={sortKey} currentDir={sortDir} onChange={handleSort} align="right" />
                </>
              )}
              <SortableHeader label="見積精度" sortKey="accuracy" currentKey={sortKey} currentDir={sortDir} onChange={handleSort} align="right" />
              <SortableHeader label="完了率" sortKey="completionRate" currentKey={sortKey} currentDir={sortDir} onChange={handleSort} align="right" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const flags = overloadFlags.get(row.assignee || '未アサイン');
              const rowClass = flags?.highInProgress
                ? 'bg-red-900/20'
                : flags?.highReviewStall
                  ? 'bg-orange-900/15'
                  : flags?.highRemainingPoints
                    ? 'bg-amber-900/15'
                    : '';
              return (
                <tr
                  key={row.assignee}
                  className={`border-b border-slate-800 hover:bg-slate-700/20 ${rowClass}`}
                  data-testid={`assignee-row-${row.assignee || '未アサイン'}`}
                >
                  <td className="py-2 px-2 font-medium">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{row.assignee || '未アサイン'}</span>
                      {flags?.highInProgress && <OverloadBadge variant="inProgress" />}
                      {flags?.highReviewStall && <OverloadBadge variant="reviewStall" />}
                      {flags?.highRemainingPoints && <OverloadBadge variant="remainingPoints" />}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right">{row.completedPoints}</td>
                  <td className="py-2 px-2 text-right">{row.completedIssues}</td>
                  <td className="py-2 px-2 text-right">{row.totalIssues}</td>
                  {issues && (
                    <>
                      <td className={`py-2 px-2 text-right ${flags?.highInProgress ? 'text-red-300 font-bold' : ''}`}>
                        {row.inProgressCount}
                      </td>
                      <td className={`py-2 px-2 text-right ${flags?.highReviewStall ? 'text-orange-300 font-bold' : ''}`}>
                        {row.reviewStallCount}
                      </td>
                      <td className={`py-2 px-2 text-right ${flags?.highRemainingPoints ? 'text-amber-300 font-bold' : ''}`}>
                        {row.remainingPoints}
                      </td>
                    </>
                  )}
                  <td className={`py-2 px-2 text-right font-medium ${accuracyClass(row.accuracy)}`}>
                    {row.accuracy}%
                  </td>
                  <td className="py-2 px-2 text-right">{row.completionRate}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
