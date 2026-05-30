import { Users } from 'lucide-react';
import type { AssigneePerformance } from '../types';

interface Props {
  data: AssigneePerformance[];
}

function accuracyClass(accuracy: number): string {
  if (accuracy >= 95) return 'text-emerald-400';
  if (accuracy >= 85) return 'text-blue-400';
  return 'text-orange-400';
}

export function AssigneeTable({ data }: Props) {
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
              <th className="text-left py-2 px-2">担当者</th>
              <th className="text-right py-2 px-2">完了 pt</th>
              <th className="text-right py-2 px-2">完了 / 全</th>
              <th className="text-right py-2 px-2">見積精度</th>
              <th className="text-right py-2 px-2">完了率</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.assignee} className="border-b border-slate-800 hover:bg-slate-700/20">
                <td className="py-2 px-2 font-medium">{row.assignee}</td>
                <td className="py-2 px-2 text-right">{row.completedPoints}</td>
                <td className="py-2 px-2 text-right">
                  {row.completedIssues} / {row.totalIssues}
                </td>
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
