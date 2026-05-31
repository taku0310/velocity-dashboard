import type { BurndownData, Issue, Sprint } from '../types';

// バーンダウンを再計算
export function calculateBurndown(
  issues: Issue[],
  plannedPoints: number,
  startDate: Date,
  endDate: Date,
): BurndownData[] {
  const dayMs = 1000 * 60 * 60 * 24;
  const sprintDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs));
  const idealDecrement = plannedPoints / sprintDays;
  const burndown: BurndownData[] = [];

  for (let day = 0; day <= sprintDays; day++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + day);
    const completed = issues
      .filter(
        (i) =>
          i.status === 'Done' &&
          i.completionDate &&
          new Date(i.completionDate).getTime() <= checkDate.getTime(),
      )
      .reduce((s, i) => s + i.points, 0);
    burndown.push({
      day,
      remaining: Math.max(0, plannedPoints - completed),
      ideal: Math.max(0, plannedPoints - idealDecrement * day),
    });
  }
  return burndown;
}

// スプリント内の課題変更に応じて集計値とバーンダウンを再計算
export function recomputeSprint(sprint: Sprint): Sprint {
  const plannedPoints = sprint.issues.reduce((s, i) => s + i.points, 0);
  const completedPoints = sprint.issues
    .filter((i) => i.status === 'Done')
    .reduce((s, i) => s + i.points, 0);
  const plannedHours = sprint.issues.reduce((s, i) => s + i.estimatedHours, 0);
  const actualHours = sprint.issues.reduce((s, i) => s + i.actualHours, 0);
  const burndown = calculateBurndown(
    sprint.issues,
    plannedPoints,
    new Date(sprint.startDate),
    new Date(sprint.endDate),
  );
  return {
    ...sprint,
    plannedPoints,
    completedPoints,
    plannedHours: Math.round(plannedHours * 10) / 10,
    actualHours: Math.round(actualHours * 10) / 10,
    burndown,
  };
}

// 空のスプリントを生成
export function createEmptySprint(name: string, startDate: string, endDate: string): Sprint {
  const empty: Sprint = {
    id: `sprint-${Date.now()}`,
    name,
    startDate,
    endDate,
    plannedPoints: 0,
    completedPoints: 0,
    plannedHours: 0,
    actualHours: 0,
    issues: [],
    burndown: [],
  };
  return recomputeSprint(empty);
}

// 空の課題を生成
export function createEmptyIssue(sprintStartDate: string, sprintEndDate: string): Issue {
  return {
    id: `LOCAL-${Date.now()}`,
    title: '',
    points: 0,
    status: 'To Do',
    assignee: '',
    estimatedHours: 0,
    actualHours: 0,
    labels: [],
    type: 'Task',
    priority: 'Medium',
    startDate: sprintStartDate,
    dueDate: sprintEndDate,
  };
}
