import { describe, expect, it } from 'vitest';
import { buildHierarchy, canSetParent, computeReorderOrder, getSiblings } from './hierarchy';
import type { Issue } from '../types';

function mk(id: string, overrides: Partial<Issue> = {}): Issue {
  return {
    id,
    title: id,
    points: 0,
    status: 'To Do',
    assignee: '',
    estimatedHours: 0,
    actualHours: 0,
    labels: [],
    type: 'Task',
    priority: 'Medium',
    ...overrides,
  };
}

describe('canSetParent', () => {
  it('自分自身は不可', () => {
    expect(canSetParent([mk('A')], 'A', 'A')).toBe(false);
  });

  it('undefined（ルート化）は常に可', () => {
    expect(canSetParent([mk('A'), mk('B')], 'A', undefined)).toBe(true);
  });

  it('A の子孫を A の親にしようとすると不可', () => {
    const issues = [mk('A'), mk('B', { parentId: 'A' }), mk('C', { parentId: 'B' })];
    expect(canSetParent(issues, 'A', 'C')).toBe(false);
  });

  it('無関係な兄弟を親にするのは可', () => {
    const issues = [mk('A'), mk('B'), mk('C')];
    expect(canSetParent(issues, 'A', 'B')).toBe(true);
  });
});

describe('buildHierarchy', () => {
  it('深さ順 (DFS) に並べる', () => {
    const issues = [
      mk('A'),
      mk('A1', { parentId: 'A' }),
      mk('A2', { parentId: 'A' }),
      mk('A1a', { parentId: 'A1' }),
      mk('B'),
    ];
    const rows = buildHierarchy(issues);
    expect(rows.map((r) => `${r.depth}:${r.issue.id}`)).toEqual([
      '0:A',
      '1:A1',
      '2:A1a',
      '1:A2',
      '0:B',
    ]);
  });

  it('Epic も親として扱う', () => {
    const issues = [
      mk('E', { type: 'Epic' }),
      mk('child', { epicId: 'E' }),
      mk('orphan'),
    ];
    const rows = buildHierarchy(issues);
    const ids = rows.map((r) => r.issue.id);
    expect(ids.indexOf('E')).toBeLessThan(ids.indexOf('child'));
  });
});

describe('computeReorderOrder + getSiblings', () => {
  it('兄弟内で below 配置: refOrder と次の中点', () => {
    const issues = [
      mk('A', { order: 0 }),
      mk('B', { order: 10 }),
      mk('C', { order: 20 }),
    ];
    // B の below に移動した時の order は (10 + 20) / 2 = 15
    const siblings = getSiblings(issues, 'B');
    expect(computeReorderOrder(siblings, 'B', 'below')).toBe(15);
  });

  it('末尾の below は ref.order + 1', () => {
    const issues = [mk('A', { order: 0 }), mk('B', { order: 10 })];
    const siblings = getSiblings(issues, 'B');
    expect(computeReorderOrder(siblings, 'B', 'below')).toBe(11);
  });

  it('先頭の above は ref.order - 1', () => {
    const issues = [mk('A', { order: 0 }), mk('B', { order: 10 })];
    const siblings = getSiblings(issues, 'A');
    expect(computeReorderOrder(siblings, 'A', 'above')).toBe(-1);
  });
});
