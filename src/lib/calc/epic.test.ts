import { describe, expect, it } from 'vitest';
import { calculateEpicProgress } from './epic';
import type { Issue, Sprint } from '../../types';

function makeIssue(overrides: Partial<Issue>): Issue {
  return {
    id: 'ECOM-1',
    title: 'test',
    points: 0,
    status: 'To Do',
    assignee: 'tester',
    estimatedHours: 0,
    actualHours: 0,
    labels: [],
    type: 'Task',
    priority: 'Medium',
    ...overrides,
  };
}

function makeSprint(overrides: Partial<Sprint>): Sprint {
  return {
    id: 's-1',
    name: 'Sprint 1',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-01-15T00:00:00.000Z',
    plannedPoints: 0,
    completedPoints: 0,
    plannedHours: 0,
    actualHours: 0,
    issues: [],
    burndown: [],
    ...overrides,
  };
}

describe('calculateEpicProgress', () => {
  it('エピックが無ければ空配列', () => {
    const sprint = makeSprint({ issues: [makeIssue({ id: 'A' })] });
    expect(calculateEpicProgress([sprint])).toEqual([]);
  });

  it('完了率を算出', () => {
    const epic = makeIssue({ id: 'EPIC-1', type: 'Epic', title: 'A' });
    const child1 = makeIssue({ id: 'A', points: 4, status: 'Done', epicId: 'EPIC-1' });
    const child2 = makeIssue({ id: 'B', points: 6, status: 'To Do', epicId: 'EPIC-1' });
    const sprint = makeSprint({
      endDate: '2025-01-15T00:00:00.000Z', // 過去スプリント
      completedPoints: 10,
      issues: [epic, child1, child2],
    });
    const progress = calculateEpicProgress([sprint]);
    expect(progress).toHaveLength(1);
    expect(progress[0]).toMatchObject({
      totalPoints: 10,
      completedPoints: 4,
      remainingPoints: 6,
      percentComplete: 40,
    });
  });

  it('残り 0 pt なら ETA は "完了"', () => {
    const epic = makeIssue({ id: 'EPIC-1', type: 'Epic' });
    const child = makeIssue({ id: 'A', points: 4, status: 'Done', epicId: 'EPIC-1' });
    const sprint = makeSprint({
      endDate: '2025-01-15T00:00:00.000Z',
      completedPoints: 4,
      issues: [epic, child],
    });
    expect(calculateEpicProgress([sprint])[0].etaLabel).toBe('完了');
  });

  it('過去 Velocity 0 なら "推定不能"', () => {
    const epic = makeIssue({ id: 'EPIC-1', type: 'Epic' });
    const child = makeIssue({ id: 'A', points: 10, status: 'To Do', epicId: 'EPIC-1' });
    const sprint = makeSprint({
      endDate: '2025-01-15T00:00:00.000Z',
      completedPoints: 0,
      issues: [epic, child],
    });
    expect(calculateEpicProgress([sprint])[0].etaLabel).toBe('推定不能');
  });

  it('Velocity と残り pt から ETA を算出', () => {
    const epic = makeIssue({ id: 'EPIC-1', type: 'Epic' });
    const child = makeIssue({ id: 'A', points: 20, status: 'To Do', epicId: 'EPIC-1' });
    // 過去 3 スプリント全部完了 10pt → 平均 Velocity 10 → 残り 20pt → 2 スプリント
    const sprints = [1, 2, 3].map((i) =>
      makeSprint({
        id: `s-${i}`,
        name: `Sprint ${i}`,
        endDate: `2025-0${i}-15T00:00:00.000Z`,
        completedPoints: 10,
        issues: i === 1 ? [epic, child] : [],
      }),
    );
    const eta = calculateEpicProgress(sprints)[0];
    expect(eta.etaSprintsAhead).toBe(2);
    expect(eta.etaLabel).toBe('+2 sprint');
  });
});
