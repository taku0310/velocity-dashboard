import type { BurndownData, Issue, IssueStatus, KPIMetrics } from '../../types';
import type { EpicProgress } from '../../lib/calc/epic';
import { BurndownChart } from '../../components/BurndownChart';
import { KPICards } from '../../components/KPICards';
import { ProgressBoard } from '../../components/ProgressBoard';

interface Props {
  metrics: KPIMetrics;
  burndown: BurndownData[];
  filteredIssues: Issue[];
  epicProgressById: Map<string, EpicProgress>;
  onIssueClick: (issue: Issue) => void;
  onAdd: (status: IssueStatus, epicId?: string) => void;
  onStatusChange: (issueId: string, newStatus: IssueStatus) => void;
}

export function ProgressTab({
  metrics,
  burndown,
  filteredIssues,
  epicProgressById,
  onIssueClick,
  onAdd,
  onStatusChange,
}: Props) {
  return (
    <div className="space-y-6">
      <KPICards metrics={metrics} />
      <ProgressBoard
        issues={filteredIssues}
        epicProgressById={epicProgressById}
        onIssueClick={onIssueClick}
        onAdd={onAdd}
        onStatusChange={onStatusChange}
      />
      <BurndownChart data={burndown} />
    </div>
  );
}
