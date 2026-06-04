import { describe, expect, it } from 'vitest';
import { calculateAssigneeLoads, flagOverload } from './overload';
import type { Issue } from '../../types';

function makeIssue(overrides: Partial<Issue>): Issue {
  return {
    id: 'ECOM-1',
    title: 'test',
    points: 3,
    status: 'In Progress',
    assignee: 'tester',
    estimatedHours: 1,
    actualHours: 0,
    labels: [],
    type: 'Task',
    priority: 'Medium',
    ...overrides,
  };
}

describe('calculateAssigneeLoads', () => {
  it('担当者別に集計', () => {
    const issues = [
      makeIssue({ id: 'A', assignee: '田中', status: 'In Progress', points: 3 }),
      makeIssue({ id: 'B', assignee: '田中', status: 'To Do', points: 5 }),
      makeIssue({ id: 'C', assignee: '田中', status: 'Done', points: 8 }),
      makeIssue({ id: 'D', assignee: '佐藤', status: 'In Progress', points: 2 }),
    ];
    const loads = calculateAssigneeLoads(issues);
    const tanaka = loads.find((l) => l.assignee === '田中');
    const sato = loads.find((l) => l.assignee === '佐藤');
    expect(tanaka).toMatchObject({ inProgressCount: 1, remainingPoints: 8 });
    expect(sato).toMatchObject({ inProgressCount: 1, remainingPoints: 2 });
  });

  it('未アサインは "未アサイン" にまとまる', () => {
    const issues = [makeIssue({ assignee: '' })];
    const loads = calculateAssigneeLoads(issues);
    expect(loads[0].assignee).toBe('未アサイン');
  });
});

describe('flagOverload', () => {
  it('進行中 5 件で highInProgress', () => {
    const loads = [
      { assignee: '田中', inProgressCount: 5, reviewStallCount: 0, remainingPoints: 10 },
      { assignee: '佐藤', inProgressCount: 1, reviewStallCount: 0, remainingPoints: 5 },
    ];
    const flags = flagOverload(loads);
    expect(flags.get('田中')?.highInProgress).toBe(true);
    expect(flags.get('佐藤')?.highInProgress).toBe(false);
  });

  it('Review 滞留 3 件で highReviewStall', () => {
    const loads = [
      { assignee: 'A', inProgressCount: 0, reviewStallCount: 3, remainingPoints: 1 },
      { assignee: 'B', inProgressCount: 0, reviewStallCount: 1, remainingPoints: 1 },
      { assignee: 'C', inProgressCount: 0, reviewStallCount: 0, remainingPoints: 1 },
    ];
    const flags = flagOverload(loads);
    expect(flags.get('A')?.highReviewStall).toBe(true);
    expect(flags.get('B')?.highReviewStall).toBe(false);
  });

  it('未完了pt が 平均 + 1.5σ 超で highRemainingPoints', () => {
    // 平均 12.5、母集団 σ = 16 → 閾値 ≈ 36.5
    const loads = [
      { assignee: 'A', inProgressCount: 0, reviewStallCount: 0, remainingPoints: 40 },
      { assignee: 'B', inProgressCount: 0, reviewStallCount: 0, remainingPoints: 5 },
      { assignee: 'C', inProgressCount: 0, reviewStallCount: 0, remainingPoints: 5 },
      { assignee: 'D', inProgressCount: 0, reviewStallCount: 0, remainingPoints: 0 },
    ];
    const flags = flagOverload(loads);
    expect(flags.get('A')?.highRemainingPoints).toBe(true);
    expect(flags.get('B')?.highRemainingPoints).toBe(false);
  });

  it('担当者 3 人未満なら highRemainingPoints は出さない', () => {
    const loads = [
      { assignee: 'A', inProgressCount: 0, reviewStallCount: 0, remainingPoints: 100 },
      { assignee: 'B', inProgressCount: 0, reviewStallCount: 0, remainingPoints: 1 },
    ];
    const flags = flagOverload(loads);
    expect(flags.get('A')?.highRemainingPoints).toBe(false);
  });
});
