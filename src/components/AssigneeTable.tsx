import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import type { AssigneePerformance } from '../types';
import { SortableHeader, compareValues, nextSortState } from './SortableHeader';

interface Props {
  data: AssigneePerformance[];
}

function accuracyClass(accuracy: number): string {
  if (accuracy >= 95) return 'text-emerald-400';
  if (accuracy >= 85) return 'text-blue-400';
  return 'text-orange-400';
}

type SortKey = keyof AssigneePerformance;

export function AssigneeTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<string | null>('completedPoints');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    const next = nextSortState(sortKey, sortDir, key);
    setSortKey(next.key);
    setSortDir(next.dir);
  };

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const k = sortKey as SortKey;
    return [...data].sort((a, b) => compareValues(a[k], b[k], sortDir));
  }, [data, sortKey, sortDir]);

  return (
    <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Users size={22} className="text-emerald-400" />
        担当者別パフォーマンス
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <SortableHeader
                label="担当者"
                sortKey="assignee"
                currentKey={sortKey}
                currentDir={sortDir}
                onChange={handleSort}
              />
              <SortableHeader
                label="完了 pt"
                sortKey="completedPoints"
                currentKey={sortKey}
                currentDir={sortDir}
                onChange={handleSort}
                align="right"
              />
              <SortableHeader
                label="完了数"
                sortKey="completedIssues"
                currentKey={sortKey}
                currentDir={sortDir}
                onChange={handleSort}
                align="right"
              />
              <SortableHeader
                label="全課題数"
                sortKey="totalIssues"
                currentKey={sortKey}
                currentDir={sortDir}
                onChange={handleSort}
                align="right"
              />
              <SortableHeader
                label="見積精度"
                sortKey="accuracy"
                currentKey={sortKey}
                currentDir={sortDir}
                onChange={handleSort}
                align="right"
              />
              <SortableHeader
                label="完了率"
                sortKey="completionRate"
                currentKey={sortKey}
                currentDir={sortDir}
                onChange={handleSort}
                align="right"
              />
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.assignee} className="border-b border-slate-800 hover:bg-slate-700/20">
                <td className="py-2 px-2 font-medium">{row.assignee || '未アサイン'}</td>
                <td className="py-2 px-2 text-right">{row.completedPoints}</td>
                <td className="py-2 px-2 text-right">{row.completedIssues}</td>
                <td className="py-2 px-2 text-right">{row.totalIssues}</td>
                <td className={`py-2 px-2 text-right font-medium ${accuracyClass(row.accuracy)}`}>
                  {row.accuracy}%
                </td>
                <td className="py-2 px-2 text-right">{row.completionRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
