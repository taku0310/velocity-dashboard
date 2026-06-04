import { Download } from 'lucide-react';
import type {
  AssigneePerformance,
  EstimateAccuracy,
  Issue,
} from '../../types';
import { AssigneeTable } from '../../components/AssigneeTable';
import { EstimateAccuracyChart } from '../../components/EstimateAccuracyChart';
import { VelocityChart } from '../../components/VelocityChart';

interface Props {
  velocityData: Array<{ name: string; planned: number; completed: number }>;
  assigneeData: AssigneePerformance[];
  accuracyData: EstimateAccuracy[];
  filteredIssues: Issue[];
  summary: string;
  onExportMarkdown: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
}

export function ReportsTab({
  velocityData,
  assigneeData,
  accuracyData,
  filteredIssues,
  summary,
  onExportMarkdown,
  onExportCsv,
  onExportJson,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
        <h2 className="text-xl font-bold mb-4">エクスポート</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={onExportMarkdown}
            className="px-4 py-3 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Markdown レポート
          </button>
          <button
            onClick={onExportCsv}
            className="px-4 py-3 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm flex items-center justify-center gap-2"
          >
            <Download size={16} />
            CSV（課題一覧）
          </button>
          <button
            onClick={onExportJson}
            className="px-4 py-3 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm flex items-center justify-center gap-2"
          >
            <Download size={16} />
            JSON（全スプリント）
          </button>
        </div>
      </div>
      <VelocityChart data={velocityData} />
      <AssigneeTable data={assigneeData} issues={filteredIssues} />
      <EstimateAccuracyChart data={accuracyData} />
      <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
        <h2 className="text-lg font-bold mb-2">サマリー</h2>
        <p className="text-slate-200 leading-relaxed">{summary}</p>
      </div>
    </div>
  );
}
