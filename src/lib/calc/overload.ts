import type { Issue } from '../../types';
import { getStaleness } from './staleness';

export interface AssigneeLoad {
  assignee: string;
  inProgressCount: number;
  reviewStallCount: number;
  remainingPoints: number; // To Do + In Progress + Review の pt 合計
}

export interface OverloadFlags {
  highInProgress: boolean; // 進行中 5 件以上
  highReviewStall: boolean; // Review で停滞 3 件以上
  highRemainingPoints: boolean; // remainingPoints が 平均 + 1.5σ 超
}

const IN_PROGRESS_THRESHOLD = 5;
const REVIEW_STALL_THRESHOLD = 3;

// 担当者ごとの負荷を集計
export function calculateAssigneeLoads(issues: Issue[]): AssigneeLoad[] {
  const byAssignee = new Map<string, AssigneeLoad>();
  for (const issue of issues) {
    const key = issue.assignee || '未アサイン';
    const load = byAssignee.get(key) ?? {
      assignee: key,
      inProgressCount: 0,
      reviewStallCount: 0,
      remainingPoints: 0,
    };
    if (issue.status === 'In Progress') load.inProgressCount += 1;
    if (issue.status === 'Review' && getStaleness(issue)) load.reviewStallCount += 1;
    if (issue.status !== 'Done') load.remainingPoints += issue.points;
    byAssignee.set(key, load);
  }
  return Array.from(byAssignee.values());
}

// 平均 + 1.5σ を計算
function meanPlus15Sigma(values: number[]): number {
  if (values.length === 0) return Number.POSITIVE_INFINITY;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return mean + 1.5 * stdDev;
}

// 各担当者に overload フラグを付ける
export function flagOverload(loads: AssigneeLoad[]): Map<string, OverloadFlags> {
  const threshold = meanPlus15Sigma(loads.map((l) => l.remainingPoints));
  const result = new Map<string, OverloadFlags>();
  for (const load of loads) {
    result.set(load.assignee, {
      highInProgress: load.inProgressCount >= IN_PROGRESS_THRESHOLD,
      highReviewStall: load.reviewStallCount >= REVIEW_STALL_THRESHOLD,
      highRemainingPoints: load.remainingPoints >= threshold && loads.length >= 3,
    });
  }
  return result;
}

// 任意の OverloadFlags がいずれか true か
export function isAnyOverload(flags: OverloadFlags | undefined): boolean {
  return !!flags && (flags.highInProgress || flags.highReviewStall || flags.highRemainingPoints);
}
