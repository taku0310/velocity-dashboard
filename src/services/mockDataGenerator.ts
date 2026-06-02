import type {
  Sprint,
  Issue,
  BurndownData,
  IssueStatus,
  IssueType,
  IssuePriority,
  WorkLog,
} from '../types';

const ASSIGNEES = ['田中 太郎', '佐藤 花子', '鈴木 一郎', '高橋 美咲', '渡辺 健'];
const LABELS = ['frontend', 'backend', 'api', 'ui', 'bugfix', 'refactor', 'urgent'];
const NON_EPIC_TYPES: IssueType[] = ['Feature', 'Bug', 'Improvement', 'Task'];
const PRIORITIES: IssuePriority[] = ['Low', 'Medium', 'High', 'Critical'];

const EPIC_THEMES = [
  '決済基盤刷新',
  '管理画面リニューアル',
  'モバイル対応',
  '検索改善',
  '通知システム',
  '在庫管理基盤',
];

// 0以上1未満の擬似乱数（シード付き）
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randomLabels(rand: () => number): string[] {
  const count = Math.floor(rand() * 3);
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const label = pick(rand, LABELS);
    if (!result.includes(label)) result.push(label);
  }
  return result;
}

function generateWorklogs(
  rand: () => number,
  assignee: string,
  actualHours: number,
  startDate: Date,
  endDate: Date,
): WorkLog[] {
  if (actualHours <= 0) return [];
  const logs: WorkLog[] = [];
  const dayMs = 1000 * 60 * 60 * 24;
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs));
  let remaining = actualHours;
  const entries = Math.min(totalDays, Math.max(1, Math.ceil(actualHours / 3)));

  for (let i = 0; i < entries; i++) {
    const t = i === entries - 1 ? remaining : Math.round(rand() * Math.min(remaining, 4) * 10) / 10;
    const dayOffset = Math.floor(rand() * totalDays);
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayOffset);
    logs.push({
      id: `wl-${i}-${Math.floor(rand() * 100000)}`,
      author: assignee,
      date: date.toISOString().split('T')[0],
      timeSpentHours: Math.max(0.1, t),
      comment: pick(rand, ['実装', 'デバッグ', 'レビュー対応', 'リファクタ', 'テスト']),
    });
    remaining -= t;
    if (remaining <= 0) break;
  }
  return logs.sort((a, b) => a.date.localeCompare(b.date));
}

function generateIssues(
  rand: () => number,
  sprintIndex: number,
  startDate: Date,
  endDate: Date,
  availableEpicIds: string[],
): Issue[] {
  const issues: Issue[] = [];
  const issueCount = 12 + Math.floor(rand() * 6);

  for (let i = 0; i < issueCount; i++) {
    const points = [1, 2, 3, 5, 8][Math.floor(rand() * 5)];
    const estimatedHours = points * (2 + rand() * 2);
    const accuracyVariance = 0.5 + rand();
    const isDone = rand() < 0.75;
    const status: IssueStatus = isDone
      ? 'Done'
      : pick(rand, ['To Do', 'In Progress', 'Review']);
    const actualHours = isDone ? estimatedHours * accuracyVariance : estimatedHours * rand() * 0.7;
    const assignee = pick(rand, ASSIGNEES);

    const total = endDate.getTime() - startDate.getTime();
    const issueStartOffset = rand() * total * 0.6;
    const issueStart = new Date(startDate.getTime() + issueStartOffset);
    const issueDueOffset = issueStartOffset + (1 + rand() * 5) * 24 * 60 * 60 * 1000;
    const issueDue = new Date(
      Math.min(endDate.getTime(), startDate.getTime() + issueDueOffset),
    );

    let completionDate: string | undefined;
    if (isDone) {
      const offset = issueStartOffset + rand() * (total - issueStartOffset);
      completionDate = new Date(startDate.getTime() + offset).toISOString();
    }

    // 70% の確率でエピックに紐付ける
    const epicId =
      availableEpicIds.length > 0 && rand() < 0.7
        ? pick(rand, availableEpicIds)
        : undefined;

    issues.push({
      id: `ECOM-${1000 + sprintIndex * 100 + i}`,
      title: `${pick(rand, ['ユーザー', '商品', '注文', '支払い', 'カート'])}${pick(rand, [
        '一覧画面',
        '詳細画面',
        '登録機能',
        '更新処理',
        'API実装',
        'バグ修正',
      ])}`,
      points,
      status,
      assignee,
      estimatedHours: Math.round(estimatedHours * 10) / 10,
      actualHours: Math.round(actualHours * 10) / 10,
      labels: randomLabels(rand),
      type: pick(rand, NON_EPIC_TYPES),
      priority: pick(rand, PRIORITIES),
      completionDate,
      startDate: issueStart.toISOString(),
      dueDate: issueDue.toISOString(),
      epicId,
      order: i,
      worklogs: generateWorklogs(rand, assignee, actualHours, startDate, endDate),
    });
  }
  return issues;
}

function calculateBurndown(
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

// プロジェクト共通のエピック群（複数スプリントにまたがる）
function generateEpics(rand: () => number, projectStart: Date, projectEnd: Date): Issue[] {
  const epics: Issue[] = [];
  const count = 4;
  for (let i = 0; i < count; i++) {
    const theme = EPIC_THEMES[i % EPIC_THEMES.length];
    const total = projectEnd.getTime() - projectStart.getTime();
    const start = new Date(projectStart.getTime() + rand() * total * 0.4);
    const due = new Date(projectStart.getTime() + total * (0.5 + rand() * 0.5));
    epics.push({
      id: `EPIC-${i + 1}`,
      title: theme,
      points: 0,
      status: 'In Progress',
      assignee: pick(rand, ASSIGNEES),
      estimatedHours: 0,
      actualHours: 0,
      labels: [],
      type: 'Epic',
      priority: 'High',
      startDate: start.toISOString(),
      dueDate: due.toISOString(),
      order: i,
    });
  }
  return epics;
}

export function generateMockSprintData(): Sprint[] {
  const sprints: Sprint[] = [];
  const now = new Date();

  // プロジェクト全体の期間
  const projectEnd = new Date(now);
  const projectStart = new Date(now);
  projectStart.setDate(projectStart.getDate() - 6 * 14);

  // エピックは最古スプリントに置く（全期間を覆う）
  const epicRand = seededRandom(9999);
  const epics = generateEpics(epicRand, projectStart, projectEnd);
  const epicIds = epics.map((e) => e.id);

  // 過去 6 スプリント分（直近スプリントが最後）
  for (let s = 5; s >= 0; s--) {
    const rand = seededRandom(1234 + s * 17);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() - s * 14);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 14);

    let issues = generateIssues(rand, 5 - s, startDate, endDate, epicIds);

    // 最古スプリントにエピックを含めて配置（時系列の最初）
    if (s === 5) {
      issues = [...epics, ...issues];
    }

    const plannedPoints = issues.reduce((sum, i) => sum + i.points, 0);
    const completedPoints = issues
      .filter((i) => i.status === 'Done')
      .reduce((sum, i) => sum + i.points, 0);
    const plannedHours = issues.reduce((sum, i) => sum + i.estimatedHours, 0);
    const actualHours = issues.reduce((sum, i) => sum + i.actualHours, 0);
    const burndown = calculateBurndown(issues, plannedPoints, startDate, endDate);

    sprints.push({
      id: `sprint-${24 - s}`,
      name: `Sprint ${24 - s}`,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      plannedPoints,
      completedPoints,
      plannedHours: Math.round(plannedHours * 10) / 10,
      actualHours: Math.round(actualHours * 10) / 10,
      issues,
      burndown,
    });
  }

  return sprints;
}
