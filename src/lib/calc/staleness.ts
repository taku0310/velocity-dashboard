import type { Issue } from '../../types';

// 動いていない日数から段階を返す。color と日本語ラベル付き。
export interface StalenessLevel {
  level: 'fresh' | 'warning' | 'alert' | 'critical';
  days: number;
  label: string;
  color: string; // Tailwind class
}

export const STALE_THRESHOLDS = {
  warning: 3,
  alert: 6,
  critical: 11,
};

const DAY_MS = 1000 * 60 * 60 * 24;

// 課題の "最終アクティビティ" 推定日付を返す。
// 優先度: lastActivityAt > 最新 worklog > completionDate > startDate
function lastActivityDate(issue: Issue): Date | null {
  // 将来 lastActivityAt フィールドが入った時のため
  const explicit = (issue as Issue & { lastActivityAt?: string }).lastActivityAt;
  if (explicit) return new Date(explicit);

  if (issue.worklogs && issue.worklogs.length > 0) {
    const latest = issue.worklogs.reduce((latest, w) => {
      const d = new Date(w.date);
      return !latest || d > latest ? d : latest;
    }, null as Date | null);
    if (latest) return latest;
  }

  if (issue.completionDate) return new Date(issue.completionDate);
  if (issue.startDate) return new Date(issue.startDate);
  return null;
}

// 停滞判定。Done / To Do は対象外（In Progress / Review のみ）
export function getStaleness(issue: Issue, now: Date = new Date()): StalenessLevel | null {
  if (issue.status !== 'In Progress' && issue.status !== 'Review') return null;
  const last = lastActivityDate(issue);
  if (!last) return null;
  const days = Math.floor((now.getTime() - last.getTime()) / DAY_MS);
  if (days >= STALE_THRESHOLDS.critical) {
    return { level: 'critical', days, label: `停滞 ${days}日`, color: 'bg-red-700 text-red-100' };
  }
  if (days >= STALE_THRESHOLDS.alert) {
    return { level: 'alert', days, label: `停滞 ${days}日`, color: 'bg-orange-700 text-orange-100' };
  }
  if (days >= STALE_THRESHOLDS.warning) {
    return { level: 'warning', days, label: `停滞 ${days}日`, color: 'bg-yellow-700 text-yellow-100' };
  }
  return null;
}

// 停滞中の課題数（任意のリストに対して）
export function countStaleIssues(issues: Issue[], now: Date = new Date()): number {
  return issues.filter((i) => getStaleness(i, now) !== null).length;
}
