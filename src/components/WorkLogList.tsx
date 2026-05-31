import { useMemo } from 'react';
import { ScrollText } from 'lucide-react';
import type { Issue } from '../types';

interface Props {
  issues: Issue[];
}

interface FlatLog {
  date: string;
  issueId: string;
  issueTitle: string;
  author: string;
  hours: number;
  comment?: string;
}

export function WorkLogList({ issues }: Props) {
  const logs = useMemo<FlatLog[]>(() => {
    const all: FlatLog[] = [];
    for (const issue of issues) {
      for (const w of issue.worklogs || []) {
        all.push({
          date: w.date,
          issueId: issue.id,
          issueTitle: issue.title,
          author: w.author,
          hours: w.timeSpentHours,
          comment: w.comment,
        });
      }
    }
    return all.sort((a, b) => b.date.localeCompare(a.date));
  }, [issues]);

  return (
    <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <ScrollText size={22} className="text-purple-400" />
        ワークログ詳細（{logs.length}件）
      </h2>
      {logs.length === 0 ? (
        <p className="text-slate-400 text-sm">ワークログがありません。</p>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="sticky top-0 bg-slate-800">
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-2 px-2">日付</th>
                <th className="text-left py-2 px-2">課題</th>
                <th className="text-left py-2 px-2">担当者</th>
                <th className="text-right py-2 px-2">時間</th>
                <th className="text-left py-2 px-2">作業内容</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, idx) => (
                <tr key={idx} className="border-b border-slate-800 hover:bg-slate-700/20">
                  <td className="py-2 px-2 text-slate-300">{l.date}</td>
                  <td className="py-2 px-2 font-mono text-xs text-blue-300">{l.issueId}</td>
                  <td className="py-2 px-2 text-slate-300">{l.author}</td>
                  <td className="py-2 px-2 text-right">{l.hours}h</td>
                  <td className="py-2 px-2 text-slate-400 text-xs">{l.comment || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
