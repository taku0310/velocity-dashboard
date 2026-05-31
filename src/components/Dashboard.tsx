import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Download,
  FileText,
  Kanban,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Plus,
  RefreshCw,
  RotateCcw,
  Upload,
} from 'lucide-react';
import type { Issue, IssueStatus, Sprint } from '../types';
import { TabBar, type TabItem } from './TabBar';
import { KPICards } from './KPICards';
import { BurndownChart } from './BurndownChart';
import { VelocityChart } from './VelocityChart';
import { EstimateAccuracyChart } from './EstimateAccuracyChart';
import { AssigneeTable } from './AssigneeTable';
import { IssuesTable } from './IssuesTable';
import { WorkLogList } from './WorkLogList';
import { ProgressBoard } from './ProgressBoard';
import { GanttChart } from './GanttChart';
import { IssueEditModal } from './IssueEditModal';
import { SprintEditModal } from './SprintEditModal';
import { FiltersBar, type IssueFilters } from './FiltersBar';
import {
  buildAssigneePerformance,
  buildEstimateAccuracy,
  buildSprintSummary,
  buildVelocityData,
  calculateKPI,
} from '../utils/dataCalculations';
import { downloadMarkdown, generateMarkdownReport } from '../utils/markdownExport';

type TabId = 'overview' | 'progress' | 'velocity' | 'gantt' | 'issues' | 'reports';

const TABS: TabItem[] = [
  { id: 'overview', label: '概要', icon: LayoutDashboard },
  { id: 'progress', label: '進捗', icon: Kanban },
  { id: 'velocity', label: 'ベロシティ', icon: BarChart3 },
  { id: 'gantt', label: 'ガント', icon: CalendarDays },
  { id: 'issues', label: '課題管理', icon: ListChecks },
  { id: 'reports', label: 'レポート', icon: FileText },
];

interface Props {
  sprints: Sprint[];
  hasLocalEdits: boolean;
  onAddIssue: (sprintId: string, issue?: Partial<Issue>) => Issue | null;
  onUpdateIssue: (sprintId: string, issueId: string, updates: Partial<Issue>) => void;
  onDeleteIssue: (sprintId: string, issueId: string) => void;
  onAddSprint: () => Sprint | null;
  onUpdateSprint: (sprintId: string, updates: Partial<Sprint>) => void;
  onDeleteSprint: (sprintId: string) => void;
  onResetToSource: () => void;
  onImportDataset: (sprints: Sprint[]) => void;
  onLogout: () => void;
  onRefresh: () => void;
  warning?: string | null;
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadCsv(rows: string[][], filename: string) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function Dashboard(props: Props) {
  const {
    sprints,
    hasLocalEdits,
    onAddIssue,
    onUpdateIssue,
    onDeleteIssue,
    onAddSprint,
    onUpdateSprint,
    onDeleteSprint,
    onResetToSource,
    onImportDataset,
    onLogout,
    onRefresh,
    warning,
  } = props;

  const [selectedSprintId, setSelectedSprintId] = useState(sprints[0]?.id);
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const stored = localStorage.getItem('activeTab') as TabId | null;
    return stored && TABS.some((t) => t.id === stored) ? stored : 'overview';
  });
  const [editingIssue, setEditingIssue] = useState<{ issue: Issue; isNew: boolean } | null>(null);
  const [editingSprint, setEditingSprint] = useState<{ sprint: Sprint; isNew: boolean } | null>(
    null,
  );
  const [filters, setFilters] = useState<IssueFilters>({
    search: '',
    status: 'all',
    assignee: '',
    label: '',
  });

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!sprints.find((s) => s.id === selectedSprintId)) {
      setSelectedSprintId(sprints[0]?.id);
    }
  }, [sprints, selectedSprintId]);

  const selectedSprint = useMemo(
    () => sprints.find((s) => s.id === selectedSprintId) || sprints[0],
    [sprints, selectedSprintId],
  );

  // フィルタ適用後の課題
  const filteredIssues = useMemo(() => {
    if (!selectedSprint) return [];
    const lower = filters.search.toLowerCase();
    return selectedSprint.issues.filter((i) => {
      if (filters.status !== 'all' && i.status !== filters.status) return false;
      if (filters.assignee && i.assignee !== filters.assignee) return false;
      if (filters.label && !i.labels.includes(filters.label)) return false;
      if (lower) {
        const match =
          i.id.toLowerCase().includes(lower) ||
          i.title.toLowerCase().includes(lower) ||
          i.assignee.toLowerCase().includes(lower);
        if (!match) return false;
      }
      return true;
    });
  }, [selectedSprint, filters]);

  const filteredSprintView: Sprint | null = useMemo(() => {
    if (!selectedSprint) return null;
    return { ...selectedSprint, issues: filteredIssues };
  }, [selectedSprint, filteredIssues]);

  const metrics = useMemo(
    () => (filteredSprintView ? calculateKPI(filteredSprintView) : null),
    [filteredSprintView],
  );
  const velocityData = useMemo(() => buildVelocityData(sprints), [sprints]);
  const accuracyData = useMemo(
    () => (filteredSprintView ? buildEstimateAccuracy(filteredSprintView) : []),
    [filteredSprintView],
  );
  const assigneeData = useMemo(
    () => (filteredSprintView ? buildAssigneePerformance(filteredSprintView) : []),
    [filteredSprintView],
  );
  const summary = useMemo(
    () => (filteredSprintView && metrics ? buildSprintSummary(filteredSprintView, metrics) : ''),
    [filteredSprintView, metrics],
  );

  const allAssignees = useMemo(() => {
    const set = new Set<string>();
    sprints.forEach((s) => s.issues.forEach((i) => set.add(i.assignee)));
    return Array.from(set).filter(Boolean).sort();
  }, [sprints]);

  const allLabels = useMemo(() => {
    const set = new Set<string>();
    sprints.forEach((s) => s.issues.forEach((i) => i.labels.forEach((l) => set.add(l))));
    return Array.from(set).sort();
  }, [sprints]);

  const handleExportMarkdown = () => {
    if (!filteredSprintView || !metrics) return;
    const md = generateMarkdownReport(filteredSprintView, metrics, assigneeData);
    downloadMarkdown(md, `${selectedSprint.name}-retrospective.md`);
  };

  const handleExportJson = () => {
    downloadJson(sprints, `dataset-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleExportCsv = () => {
    if (!selectedSprint) return;
    const header = [
      'ID',
      'Title',
      'Status',
      'Assignee',
      'Points',
      'EstimatedHours',
      'ActualHours',
      'Type',
      'Priority',
      'StartDate',
      'DueDate',
      'CompletionDate',
      'Labels',
    ];
    const rows = filteredIssues.map((i) => [
      i.id,
      i.title,
      i.status,
      i.assignee,
      String(i.points),
      String(i.estimatedHours),
      String(i.actualHours),
      i.type,
      i.priority,
      i.startDate || '',
      i.dueDate || '',
      i.completionDate || '',
      i.labels.join('|'),
    ]);
    downloadCsv([header, ...rows], `${selectedSprint.name}-issues.csv`);
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('JSON はスプリント配列である必要があります');
      onImportDataset(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '読み込みに失敗しました';
      alert(`インポート失敗: ${msg}`);
    }
    e.target.value = '';
  };

  const openNewIssue = (status?: IssueStatus) => {
    if (!selectedSprint) return;
    const created = onAddIssue(selectedSprint.id, status ? { status } : {});
    if (created) setEditingIssue({ issue: created, isNew: true });
  };

  const handleAddSprint = () => {
    const created = onAddSprint();
    if (created) {
      setSelectedSprintId(created.id);
      setEditingSprint({ sprint: created, isNew: true });
    }
  };

  if (!selectedSprint || !metrics || !filteredSprintView) {
    return null;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <KPICards metrics={metrics} />
            <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
              <h2 className="text-lg font-bold mb-2">スプリント結果サマリー</h2>
              <p className="text-slate-200 leading-relaxed">{summary}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BurndownChart data={filteredSprintView.burndown} />
              <VelocityChart data={velocityData} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EstimateAccuracyChart data={accuracyData} />
              <AssigneeTable data={assigneeData} />
            </div>
          </div>
        );

      case 'progress':
        return (
          <div className="space-y-6">
            <KPICards metrics={metrics} />
            <ProgressBoard
              issues={filteredIssues}
              onIssueClick={(issue) => setEditingIssue({ issue, isNew: false })}
              onAdd={(status) => openNewIssue(status)}
            />
            <BurndownChart data={filteredSprintView.burndown} />
          </div>
        );

      case 'velocity':
        return (
          <div className="space-y-6">
            <KPICards metrics={metrics} />
            <VelocityChart data={velocityData} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BurndownChart data={filteredSprintView.burndown} />
              <EstimateAccuracyChart data={accuracyData} />
            </div>
            <AssigneeTable data={assigneeData} />
          </div>
        );

      case 'gantt':
        return (
          <GanttChart
            sprint={filteredSprintView}
            onIssueClick={(issue) => setEditingIssue({ issue, isNew: false })}
          />
        );

      case 'issues':
        return (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => openNewIssue()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm flex items-center gap-2"
              >
                <Plus size={16} />
                課題を追加
              </button>
            </div>
            <IssuesTable
              issues={filteredIssues}
              onIssueClick={(issue) => setEditingIssue({ issue, isNew: false })}
            />
            <WorkLogList issues={filteredIssues} />
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-6">
            <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
              <h2 className="text-xl font-bold mb-4">エクスポート</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={handleExportMarkdown}
                  className="px-4 py-3 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Markdown レポート
                </button>
                <button
                  onClick={handleExportCsv}
                  className="px-4 py-3 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  CSV（課題一覧）
                </button>
                <button
                  onClick={handleExportJson}
                  className="px-4 py-3 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  JSON（全スプリント）
                </button>
              </div>
            </div>
            <VelocityChart data={velocityData} />
            <AssigneeTable data={assigneeData} />
            <EstimateAccuracyChart data={accuracyData} />
            <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
              <h2 className="text-lg font-bold mb-2">サマリー</h2>
              <p className="text-slate-200 leading-relaxed">{summary}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6 text-white">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Velocity Dashboard
            </h1>
            <p className="text-slate-400 text-sm">Jira スプリント実績分析 & 進捗管理</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onRefresh}
              title="データを再取得"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm flex items-center gap-2"
            >
              <RefreshCw size={16} />
            </button>
            {hasLocalEdits && (
              <button
                onClick={onResetToSource}
                title="ローカル編集を破棄してソースに戻す"
                className="px-3 py-2 bg-amber-700 hover:bg-amber-600 rounded-lg text-sm flex items-center gap-2"
              >
                <RotateCcw size={16} />
                編集を破棄
              </button>
            )}
            <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm flex items-center gap-2 cursor-pointer">
              <Upload size={16} />
              インポート
              <input type="file" accept="application/json" onChange={handleImportJson} className="hidden" />
            </label>
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

        {hasLocalEdits && (
          <div className="mb-4 bg-blue-900/30 border border-blue-700 text-blue-100 px-4 py-2 rounded-lg text-xs">
            ローカル編集が保存されています（ブラウザに永続化）
          </div>
        )}

        <div className="flex gap-2 flex-wrap mb-6 items-center">
          {sprints.map((sprint) => (
            <button
              key={sprint.id}
              onClick={() => setSelectedSprintId(sprint.id)}
              onDoubleClick={() => setEditingSprint({ sprint, isNew: false })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedSprintId === sprint.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="ダブルクリックで編集"
            >
              {sprint.name}
            </button>
          ))}
          <button
            onClick={handleAddSprint}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-dashed border-slate-600 rounded-lg text-sm flex items-center gap-1 text-slate-300"
          >
            <Plus size={14} />
            新規スプリント
          </button>
        </div>

        <TabBar tabs={TABS} activeId={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

        <FiltersBar
          filters={filters}
          onChange={setFilters}
          assignees={allAssignees}
          labels={allLabels}
        />

        {renderTab()}

        <footer className="mt-10 text-center text-slate-500 text-xs">
          Velocity Dashboard · {new Date().getFullYear()}
        </footer>
      </div>

      {editingIssue && selectedSprint && (
        <IssueEditModal
          issue={editingIssue.issue}
          isNew={editingIssue.isNew}
          onSave={(updated) => {
            onUpdateIssue(selectedSprint.id, editingIssue.issue.id, updated);
            setEditingIssue(null);
          }}
          onDelete={() => {
            onDeleteIssue(selectedSprint.id, editingIssue.issue.id);
            setEditingIssue(null);
          }}
          onClose={() => setEditingIssue(null)}
        />
      )}

      {editingSprint && (
        <SprintEditModal
          sprint={editingSprint.sprint}
          isNew={editingSprint.isNew}
          onSave={(updates) => {
            onUpdateSprint(editingSprint.sprint.id, updates);
            setEditingSprint(null);
          }}
          onDelete={() => {
            onDeleteSprint(editingSprint.sprint.id);
            setEditingSprint(null);
          }}
          onClose={() => setEditingSprint(null)}
        />
      )}
    </div>
  );
}
