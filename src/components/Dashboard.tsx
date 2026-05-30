import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Download,
  LogOut,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import type { Sprint } from '../types';
import { KPICards } from './KPICards';
import { BurndownChart } from './BurndownChart';
import { VelocityChart } from './VelocityChart';
import { EstimateAccuracyChart } from './EstimateAccuracyChart';
import { AssigneeTable } from './AssigneeTable';
import { IssuesTable } from './IssuesTable';
import { WorkLogList } from './WorkLogList';
import {
  buildAssigneePerformance,
  buildEstimateAccuracy,
  buildSprintSummary,
  buildVelocityData,
  calculateKPI,
} from '../utils/dataCalculations';
import { downloadMarkdown, generateMarkdownReport } from '../utils/markdownExport';

type ViewMode = 'summary' | 'detailed';

interface Props {
  sprints: Sprint[];
  onLogout: () => void;
  onRefresh: () => void;
  warning?: string | null;
}

export function Dashboard({ sprints, onLogout, onRefresh, warning }: Props) {
  const [selectedSprintId, setSelectedSprintId] = useState(sprints[0]?.id);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem('viewMode');
    return stored === 'detailed' ? 'detailed' : 'summary';
  });

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (!sprints.find((s) => s.id === selectedSprintId)) {
      setSelectedSprintId(sprints[0]?.id);
    }
  }, [sprints, selectedSprintId]);

  const selectedSprint = useMemo(
    () => sprints.find((s) => s.id === selectedSprintId) || sprints[0],
    [sprints, selectedSprintId],
  );

  const metrics = useMemo(() => calculateKPI(selectedSprint), [selectedSprint]);
  const velocityData = useMemo(() => buildVelocityData(sprints), [sprints]);
  const accuracyData = useMemo(() => buildEstimateAccuracy(selectedSprint), [selectedSprint]);
  const assigneeData = useMemo(
    () => buildAssigneePerformance(selectedSprint),
    [selectedSprint],
  );
  const summary = useMemo(
    () => buildSprintSummary(selectedSprint, metrics),
    [selectedSprint, metrics],
  );

  const handleExport = () => {
    const md = generateMarkdownReport(selectedSprint, metrics, assigneeData);
    downloadMarkdown(md, `${selectedSprint.name}-retrospective.md`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6 text-white">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Velocity Dashboard
            </h1>
            <p className="text-slate-400 text-sm">Jira スプリント実績分析</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="inline-flex rounded-lg overflow-hidden border border-slate-700">
              <button
                onClick={() => setViewMode('summary')}
                className={`px-4 py-2 text-sm flex items-center gap-2 transition ${
                  viewMode === 'summary'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <LayoutDashboard size={16} />
                上司向け
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-4 py-2 text-sm flex items-center gap-2 transition ${
                  viewMode === 'detailed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Users size={16} />
                チーム向け
              </button>
            </div>
            <button
              onClick={onRefresh}
              title="データを再取得"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm flex items-center gap-2"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm flex items-center gap-2"
            >
              <Download size={16} />
              MD 出力
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm flex items-center gap-2"
            >
              <LogOut size={16} />
              ログアウト
            </button>
          </div>
        </header>

        {warning && (
          <div className="mb-4 flex items-start gap-2 bg-amber-900 bg-opacity-30 border border-amber-700 text-amber-100 px-4 py-3 rounded-lg text-sm">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{warning}</span>
          </div>
        )}

        <div className="flex gap-2 flex-wrap mb-6">
          {sprints.map((sprint) => (
            <button
              key={sprint.id}
              onClick={() => setSelectedSprintId(sprint.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedSprintId === sprint.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {sprint.name}
            </button>
          ))}
        </div>

        <KPICards metrics={metrics} />

        {viewMode === 'summary' && (
          <div className="mb-6 bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
            <h2 className="text-lg font-bold mb-2">スプリント結果サマリー</h2>
            <p className="text-slate-200 leading-relaxed">{summary}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <BurndownChart data={selectedSprint.burndown} />
          <VelocityChart data={velocityData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <EstimateAccuracyChart data={accuracyData} />
          <AssigneeTable data={assigneeData} />
        </div>

        {viewMode === 'detailed' && (
          <div className="space-y-6">
            <IssuesTable issues={selectedSprint.issues} />
            <WorkLogList issues={selectedSprint.issues} />
          </div>
        )}

        <footer className="mt-10 text-center text-slate-500 text-xs">
          Velocity Dashboard · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
