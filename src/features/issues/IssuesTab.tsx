import { Plus } from 'lucide-react';
import type { Issue, Sprint } from '../../types';
import { IssuesTable } from '../../components/IssuesTable';
import { WorkLogList } from '../../components/WorkLogList';

interface Props {
  issues: Issue[];
  selectedSprint: Sprint;
  showAllSprints: boolean;
  onToggleShowAllSprints: (next: boolean) => void;
  onIssueClick: (issue: Issue) => void;
  onAdd: () => void;
}

export function IssuesTab({
  issues,
  selectedSprint,
  showAllSprints,
  onToggleShowAllSprints,
  onIssueClick,
  onAdd,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={showAllSprints}
            onChange={(e) => onToggleShowAllSprints(e.target.checked)}
            className="rounded"
          />
          全スプリントの課題を表示
        </label>
        <button
          onClick={onAdd}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm flex items-center gap-2"
        >
          <Plus size={16} />
          課題を追加（{selectedSprint.name}）
        </button>
      </div>
      <IssuesTable issues={issues} onIssueClick={onIssueClick} groupByEpic />
      <WorkLogList issues={issues} />
    </div>
  );
}
