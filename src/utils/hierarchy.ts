import type { Issue } from '../types';

// 親 ID（直接親が無ければ Epic ID を仮想親として扱う）
export function effectiveParentId(issue: Issue, idSet: Set<string>): string | undefined {
  if (issue.parentId && idSet.has(issue.parentId)) return issue.parentId;
  // Epic 配下: 自身が Epic でない & epicId が存在課題を指す場合のみ
  if (issue.type !== 'Epic' && issue.epicId && idSet.has(issue.epicId)) return issue.epicId;
  return undefined;
}

// 指定 ID の子孫課題 ID 一覧を返す（自身は含まない）
export function getDescendantIds(issues: Issue[], id: string): Set<string> {
  const idSet = new Set(issues.map((i) => i.id));
  const result = new Set<string>();
  const stack = [id];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const i of issues) {
      const parent = effectiveParentId(i, idSet);
      if (parent === current && !result.has(i.id)) {
        result.add(i.id);
        stack.push(i.id);
      }
    }
  }
  return result;
}

// child を newParent の子にできるか（循環や自己参照を弾く）
export function canSetParent(
  issues: Issue[],
  childId: string,
  newParentId: string | undefined,
): boolean {
  if (!newParentId) return true;
  if (childId === newParentId) return false;
  const descendants = getDescendantIds(issues, childId);
  return !descendants.has(newParentId);
}

// 親→子の DFS 順に並べた配列（深さ情報付き）
export interface HierarchyRow {
  issue: Issue;
  depth: number;
}

// 兄弟は order の昇順、order が無いものは id の昇順
function sortSiblings(arr: Issue[]): Issue[] {
  return [...arr].sort((a, b) => {
    const ao = a.order ?? Number.POSITIVE_INFINITY;
    const bo = b.order ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    return a.id.localeCompare(b.id);
  });
}

export function buildHierarchy(issues: Issue[]): HierarchyRow[] {
  const idSet = new Set(issues.map((i) => i.id));
  const byParent = new Map<string | undefined, Issue[]>();

  for (const issue of issues) {
    const key = effectiveParentId(issue, idSet);
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(issue);
  }

  // 各親の子をソート
  for (const [k, list] of byParent) {
    byParent.set(k, sortSiblings(list));
  }

  const rows: HierarchyRow[] = [];
  const visit = (parentId: string | undefined, depth: number) => {
    const children = byParent.get(parentId) || [];
    for (const child of children) {
      rows.push({ issue: child, depth });
      visit(child.id, depth + 1);
    }
  };
  visit(undefined, 0);
  return rows;
}

// 兄弟一覧を返す（指定課題の effectiveParent を共有する課題、自身を含む、ソート済み）
export function getSiblings(issues: Issue[], issueId: string): Issue[] {
  const idSet = new Set(issues.map((i) => i.id));
  const me = issues.find((i) => i.id === issueId);
  if (!me) return [];
  const parent = effectiveParentId(me, idSet);
  const siblings = issues.filter((i) => effectiveParentId(i, idSet) === parent);
  return sortSiblings(siblings);
}

// reference の上 or 下に moved を挿入したい時の新しい order 値
export function computeReorderOrder(
  siblings: Issue[],
  refId: string,
  position: 'above' | 'below',
): number {
  const sorted = sortSiblings(siblings);
  const refIdx = sorted.findIndex((s) => s.id === refId);
  if (refIdx < 0) return Date.now();

  const refOrder = sorted[refIdx].order ?? refIdx;
  if (position === 'above') {
    const above = sorted[refIdx - 1];
    if (!above) return refOrder - 1;
    const aboveOrder = above.order ?? refIdx - 1;
    return (aboveOrder + refOrder) / 2;
  } else {
    const below = sorted[refIdx + 1];
    if (!below) return refOrder + 1;
    const belowOrder = below.order ?? refIdx + 1;
    return (refOrder + belowOrder) / 2;
  }
}
