import { describe, expect, it } from 'vitest';
import { countStaleIssues, getStaleness } from './staleness';
import type { Issue } from '../../types';

function makeIssue(overrides: Partial<Issue>): Issue {
  return {
    id: 'ECOM-1',
    title: 'test',
    points: 1,
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

const now = new Date('2026-06-03T00:00:00.000Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

describe('getStaleness', () => {
  it('Done/To Do の課題は対象外', () => {
    expect(getStaleness(makeIssue({ status: 'Done', completionDate: daysAgo(100) }), now)).toBeNull();
    expect(getStaleness(makeIssue({ status: 'To Do' }), now)).toBeNull();
  });

  it('In Progress で worklog の最終が 3 日未満なら null', () => {
    const issue = makeIssue({
      status: 'In Progress',
      worklogs: [{ id: 'w1', author: 't', date: daysAgo(1).slice(0, 10), timeSpentHours: 1 }],
    });
    expect(getStaleness(issue, now)).toBeNull();
  });

  it('3-5 日で warning', () => {
    const issue = makeIssue({
      status: 'In Progress',
      worklogs: [{ id: 'w1', author: 't', date: daysAgo(4).slice(0, 10), timeSpentHours: 1 }],
    });
    const result = getStaleness(issue, now);
    expect(result?.level).toBe('warning');
  });

  it('6-10 日で alert', () => {
    const issue = makeIssue({
      status: 'Review',
      worklogs: [{ id: 'w1', author: 't', date: daysAgo(7).slice(0, 10), timeSpentHours: 1 }],
    });
    const result = getStaleness(issue, now);
    expect(result?.level).toBe('alert');
  });

  it('11 日以上で critical', () => {
    const issue = makeIssue({
      status: 'In Progress',
      worklogs: [{ id: 'w1', author: 't', date: daysAgo(15).slice(0, 10), timeSpentHours: 1 }],
    });
    const result = getStaleness(issue, now);
    expect(result?.level).toBe('critical');
    expect(result?.days).toBe(15);
  });

  it('worklog が無ければ startDate にフォールバック', () => {
    const issue = makeIssue({
      status: 'In Progress',
      startDate: daysAgo(20),
    });
    expect(getStaleness(issue, now)?.level).toBe('critical');
  });
});

describe('countStaleIssues', () => {
  it('停滞中のみカウント', () => {
    const issues = [
      makeIssue({ id: 'A', status: 'In Progress', worklogs: [{ id: 'w', author: 't', date: daysAgo(1).slice(0, 10), timeSpentHours: 1 }] }),
      makeIssue({ id: 'B', status: 'In Progress', worklogs: [{ id: 'w', author: 't', date: daysAgo(5).slice(0, 10), timeSpentHours: 1 }] }),
      makeIssue({ id: 'C', status: 'Done', completionDate: daysAgo(100) }),
    ];
    expect(countStaleIssues(issues, now)).toBe(1);
  });
});
