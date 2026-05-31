// 課題のステータス
export type IssueStatus = 'To Do' | 'In Progress' | 'Done' | 'Review';

// 課題タイプ
export type IssueType = 'Feature' | 'Bug' | 'Improvement' | 'Task';

// 優先度
export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical';

// ワークログエントリ
export interface WorkLog {
  id: string;
  author: string;
  date: string;
  timeSpentHours: number;
  comment?: string;
}

// 課題
export interface Issue {
  id: string;
  title: string;
  points: number;
  status: IssueStatus;
  assignee: string;
  estimatedHours: number;
  actualHours: number;
  labels: string[];
  type: IssueType;
  priority: IssuePriority;
  completionDate?: string;
  startDate?: string; // ガント表示用（着手日）
  dueDate?: string;   // ガント表示用（期限）
  parentId?: string;  // 親課題 ID（階層化用）
  worklogs?: WorkLog[];
}

// バーンダウンの 1 日分
export interface BurndownData {
  day: number;
  remaining: number;
  ideal: number;
}

// スプリント
export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  plannedPoints: number;
  completedPoints: number;
  plannedHours: number;
  actualHours: number;
  issues: Issue[];
  burndown: BurndownData[];
}

// 見積もり精度（散布図用）
export interface EstimateAccuracy {
  id: string;
  title: string;
  estimated: number;
  actual: number;
  accuracy: number;
  assignee: string;
}

// KPI メトリクス
export interface KPIMetrics {
  pointsCompletion: number;
  issuesCompletion: number;
  hoursAccuracy: number;
  velocity: number;
  completedPoints: number;
  totalPoints: number;
  completedIssues: number;
  totalIssues: number;
  estimatedHours: number;
  actualHours: number;
  totalBugs: number;
}

// 担当者別パフォーマンス
export interface AssigneePerformance {
  assignee: string;
  completedPoints: number;
  completedIssues: number;
  totalIssues: number;
  estimatedHours: number;
  actualHours: number;
  accuracy: number;
  completionRate: number;
}

// データソース種別
export type DataSource = 'jira-api' | 'mock';

// 認証情報
export interface JiraCredentials {
  instanceUrl: string;
  email: string;
  token: string;
  boardId: string;
}
