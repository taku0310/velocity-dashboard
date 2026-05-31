import type { Issue } from '../types';

// 指定 ID の子孫課題 ID 一覧を返す（自身は含まない）
export function getDescendantIds(issues: Issue[], id: string): Set<string> {
  const result = new Set<string>();
  const stack = [id];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const i of issues) {
      if (i.parentId === current && !result.has(i.id)) {
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
  if (!newParentId) return true; // ルート化は常に OK
  if (childId === newParentId) return false;
  const descendants = getDescendantIds(issues, childId);
  return !descendants.has(newParentId);
}

// 親→子の DFS 順に並べた配列（深さ情報付き）
export interface HierarchyRow {
  issue: Issue;
  depth: number;
}

export function buildHierarchy(issues: Issue[]): HierarchyRow[] {
  const byParent = new Map<string | undefined, Issue[]>();
  const idSet = new Set(issues.map((i) => i.id));

  for (const issue of issues) {
    // 親が存在しない場合はルート扱い
    const key = issue.parentId && idSet.has(issue.parentId) ? issue.parentId : undefined;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(issue);
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
