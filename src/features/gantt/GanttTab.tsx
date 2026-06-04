import type { Issue, Sprint } from '../../types';
import { GanttChart } from '../../components/GanttChart';

interface Props {
  sprints: Sprint[];
  onIssueClick: (issue: Issue) => void;
  onSetParent: (childId: string, newParentId: string | undefined) => void;
  onReorder: (movedId: string, refId: string, position: 'above' | 'below') => void;
}

export function GanttTab({ sprints, onIssueClick, onSetParent, onReorder }: Props) {
  return (
    <GanttChart
      sprints={sprints}
      onIssueClick={onIssueClick}
      onSetParent={onSetParent}
      onReorder={onReorder}
    />
  );
}
