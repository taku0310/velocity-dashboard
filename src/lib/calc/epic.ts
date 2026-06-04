import type { Issue, Sprint } from '../../types';

export interface EpicProgress {
  epic: Issue;
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
  percentComplete: number;
  childCount: number;
  doneCount: number;
  etaSprintsAhead: number | null; // 平均 Velocity から推定。null = 推定不能
  etaLabel: string; // "Sprint +2" / "完了済" / "推定不能" / etc.
}

// 直近 N スプリントの平均 Velocity
function recentVelocity(sprints: Sprint[], windowSize: number = 3): number {
  const closed = sprints.filter((s) => new Date(s.endDate).getTime() < Date.now());
  const recent = closed.slice(-windowSize);
  if (recent.length === 0) return 0;
  const total = recent.reduce((s, sp) => s + sp.completedPoints, 0);
  return total / recent.length;
}

// エピックごとの進捗 + ETA を算出
export function calculateEpicProgress(sprints: Sprint[]): EpicProgress[] {
  const allIssues = sprints.flatMap((s) => s.issues);
  const epics = allIssues.filter((i) => i.type === 'Epic');
  const velocity = recentVelocity(sprints);

  return epics.map((epic) => {
    const children = allIssues.filter((i) => i.epicId === epic.id);
    const totalPoints = children.reduce((s, c) => s + c.points, 0);
    const completedPoints = children
      .filter((c) => c.status === 'Done')
      .reduce((s, c) => s + c.points, 0);
    const remainingPoints = totalPoints - completedPoints;
    const percentComplete = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
    const doneCount = children.filter((c) => c.status === 'Done').length;

    let etaSprintsAhead: number | null = null;
    let etaLabel = '';
    if (remainingPoints === 0 && children.length > 0) {
      etaLabel = '完了';
    } else if (velocity <= 0) {
      etaLabel = '推定不能';
    } else {
      etaSprintsAhead = Math.ceil(remainingPoints / velocity);
      etaLabel = `+${etaSprintsAhead} sprint`;
    }

    return {
      epic,
      totalPoints,
      completedPoints,
      remainingPoints,
      percentComplete,
      childCount: children.length,
      doneCount,
      etaSprintsAhead,
      etaLabel,
    };
  });
}
