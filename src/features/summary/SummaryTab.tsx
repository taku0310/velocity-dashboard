import type {
  AssigneePerformance,
  BurndownData,
  EstimateAccuracy,
  Issue,
  KPIMetrics,
} from '../../types';
import { AssigneeTable } from '../../components/AssigneeTable';
import { BurndownChart } from '../../components/BurndownChart';
import { EstimateAccuracyChart } from '../../components/EstimateAccuracyChart';
import { KPICards } from '../../components/KPICards';
import { MyTasksCard } from '../../components/MyTasksCard';
import { VelocityChart } from '../../components/VelocityChart';

interface Props {
  metrics: KPIMetrics;
  summary: string;
  burndown: BurndownData[];
  velocityData: Array<{ name: string; planned: number; completed: number }>;
  accuracyData: EstimateAccuracy[];
  assigneeData: AssigneePerformance[];
  filteredIssues: Issue[];
  allIssues: Issue[];
  allAssignees: string[];
  currentUser: string | null;
  onSetCurrentUser: (name: string | null) => void;
  onIssueClick: (issue: Issue) => void;
}

export function SummaryTab({
  metrics,
  summary,
  burndown,
  velocityData,
  accuracyData,
  assigneeData,
  filteredIssues,
  allIssues,
  allAssignees,
  currentUser,
  onSetCurrentUser,
  onIssueClick,
}: Props) {
  return (
    <div className="space-y-6">
      <MyTasksCard
        currentUser={currentUser}
        assignees={allAssignees}
        issues={allIssues}
        onSetCurrentUser={onSetCurrentUser}
        onIssueClick={onIssueClick}
      />
      <KPICards metrics={metrics} />
      <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
        <h2 className="text-lg font-bold mb-2">スプリント結果サマリー</h2>
        <p className="text-slate-200 leading-relaxed">{summary}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BurndownChart data={burndown} />
        <VelocityChart data={velocityData} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EstimateAccuracyChart data={accuracyData} />
        <AssigneeTable data={assigneeData} issues={filteredIssues} />
      </div>
    </div>
  );
}
