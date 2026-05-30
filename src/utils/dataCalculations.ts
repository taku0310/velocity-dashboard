import type {
  Sprint,
  KPIMetrics,
  EstimateAccuracy,
  AssigneePerformance,
} from '../types';

// パーセンテージ計算（小数点以下切り捨て、ゼロ除算対応）
function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

// KPI メトリクスを算出
export function calculateKPI(sprint: Sprint): KPIMetrics {
  const totalIssues = sprint.issues.length;
  const completedIssues = sprint.issues.filter((i) => i.status === 'Done').length;
  const totalPoints = sprint.plannedPoints;
  const completedPoints = sprint.completedPoints;
  const estimatedHours = sprint.plannedHours;
  const actualHours = sprint.actualHours;
  const totalBugs = sprint.issues.filter((i) => i.type === 'Bug').length;

  // 見積もり精度: 実績と見積もりの近さ。100% が完全一致。
  let hoursAccuracy = 0;
  if (estimatedHours > 0 && actualHours > 0) {
    const ratio = Math.min(estimatedHours, actualHours) / Math.max(estimatedHours, actualHours);
    hoursAccuracy = Math.round(ratio * 100);
  }

  return {
    pointsCompletion: pct(completedPoints, totalPoints),
    issuesCompletion: pct(completedIssues, totalIssues),
    hoursAccuracy,
    velocity: completedPoints,
    completedPoints,
    totalPoints,
    completedIssues,
    totalIssues,
    estimatedHours: Math.round(estimatedHours * 10) / 10,
    actualHours: Math.round(actualHours * 10) / 10,
    totalBugs,
  };
}

// Velocity 推移用データ
export function buildVelocityData(sprints: Sprint[]): Array<{
  name: string;
  planned: number;
  completed: number;
}> {
  return sprints.map((s) => ({
    name: s.name,
    planned: s.plannedPoints,
    completed: s.completedPoints,
  }));
}

// 見積もり精度（散布図用）
export function buildEstimateAccuracy(sprint: Sprint): EstimateAccuracy[] {
  return sprint.issues
    .filter((i) => i.estimatedHours > 0 && i.actualHours > 0)
    .map((i) => {
      const accuracy =
        Math.round(
          (Math.min(i.estimatedHours, i.actualHours) /
            Math.max(i.estimatedHours, i.actualHours)) *
            100,
        );
      return {
        id: i.id,
        title: i.title,
        estimated: i.estimatedHours,
        actual: i.actualHours,
        accuracy,
        assignee: i.assignee,
      };
    });
}

// 担当者別パフォーマンス
export function buildAssigneePerformance(sprint: Sprint): AssigneePerformance[] {
  const byAssignee = new Map<string, AssigneePerformance>();

  for (const issue of sprint.issues) {
    const existing = byAssignee.get(issue.assignee) ?? {
      assignee: issue.assignee,
      completedPoints: 0,
      completedIssues: 0,
      totalIssues: 0,
      estimatedHours: 0,
      actualHours: 0,
      accuracy: 0,
      completionRate: 0,
    };
    existing.totalIssues += 1;
    existing.estimatedHours += issue.estimatedHours;
    existing.actualHours += issue.actualHours;
    if (issue.status === 'Done') {
      existing.completedIssues += 1;
      existing.completedPoints += issue.points;
    }
    byAssignee.set(issue.assignee, existing);
  }

  return Array.from(byAssignee.values())
    .map((a) => ({
      ...a,
      estimatedHours: Math.round(a.estimatedHours * 10) / 10,
      actualHours: Math.round(a.actualHours * 10) / 10,
      accuracy:
        a.estimatedHours > 0 && a.actualHours > 0
          ? Math.round(
              (Math.min(a.estimatedHours, a.actualHours) /
                Math.max(a.estimatedHours, a.actualHours)) *
                100,
            )
          : 0,
      completionRate: pct(a.completedIssues, a.totalIssues),
    }))
    .sort((a, b) => b.completedPoints - a.completedPoints);
}

// 上司向けの日本語サマリー
export function buildSprintSummary(sprint: Sprint, metrics: KPIMetrics): string {
  const parts: string[] = [];

  if (metrics.pointsCompletion >= 95) {
    parts.push(`${sprint.name}は計画通り進捗し、Story Points 達成率は ${metrics.pointsCompletion}% を記録しました。`);
  } else if (metrics.pointsCompletion >= 80) {
    parts.push(`${sprint.name}は概ね順調で、Story Points 達成率は ${metrics.pointsCompletion}% でした。`);
  } else {
    parts.push(`${sprint.name}は計画未達となり、Story Points 達成率は ${metrics.pointsCompletion}% に留まりました。`);
  }

  if (metrics.hoursAccuracy >= 90) {
    parts.push(`見積もり精度は ${metrics.hoursAccuracy}% と高水準を維持しています。`);
  } else if (metrics.hoursAccuracy >= 75) {
    parts.push(`見積もり精度は ${metrics.hoursAccuracy}% で改善余地があります。`);
  } else {
    parts.push(`見積もり精度は ${metrics.hoursAccuracy}% と低下傾向です。複雑な課題は見積もりを増やす検討が必要です。`);
  }

  if (metrics.totalBugs > 0) {
    parts.push(`今スプリントの Bug 件数は ${metrics.totalBugs} 件でした。`);
  }

  return parts.join(' ');
}
