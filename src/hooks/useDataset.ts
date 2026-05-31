import { useCallback, useEffect, useRef, useState } from 'react';
import type { Issue, Sprint } from '../types';
import { createEmptyIssue, createEmptySprint, recomputeSprint } from '../utils/sprintCalculations';

const STORAGE_KEY = 'velocity-dashboard-dataset-v1';

interface UseDatasetResult {
  sprints: Sprint[];
  hasLocalEdits: boolean;
  addIssue: (sprintId: string, issue?: Partial<Issue>) => Issue | null;
  updateIssue: (sprintId: string, issueId: string, updates: Partial<Issue>) => void;
  deleteIssue: (sprintId: string, issueId: string) => void;
  addSprint: (name?: string) => Sprint | null;
  updateSprint: (sprintId: string, updates: Partial<Sprint>) => void;
  deleteSprint: (sprintId: string) => void;
  resetToSource: () => void;
  importDataset: (sprints: Sprint[]) => void;
  exportDataset: () => Sprint[];
}

function readLocal(): Sprint[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as Sprint[];
  } catch {
    return null;
  }
}

function writeLocal(sprints: Sprint[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sprints));
  } catch {
    // 容量超過などはスキップ
  }
}

function clearLocal(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

export function useDataset(sourceSprints: Sprint[] | null): UseDatasetResult {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [hasLocalEdits, setHasLocalEdits] = useState(false);
  const initializedRef = useRef(false);

  // 初期化: ローカルに編集済みデータがあればそれを優先
  useEffect(() => {
    if (initializedRef.current) return;
    if (!sourceSprints) return;
    const local = readLocal();
    if (local && local.length > 0) {
      setSprints(local);
      setHasLocalEdits(true);
    } else {
      setSprints(sourceSprints);
    }
    initializedRef.current = true;
  }, [sourceSprints]);

  // 編集があれば自動保存
  useEffect(() => {
    if (!initializedRef.current) return;
    if (!hasLocalEdits) return;
    writeLocal(sprints);
  }, [sprints, hasLocalEdits]);

  const markEdited = useCallback(() => setHasLocalEdits(true), []);

  const addIssue = useCallback<UseDatasetResult['addIssue']>(
    (sprintId, partial) => {
      let created: Issue | null = null;
      setSprints((prev) => {
        const updated = prev.map((s) => {
          if (s.id !== sprintId) return s;
          const base = createEmptyIssue(s.startDate, s.endDate);
          const newIssue: Issue = { ...base, ...partial, id: partial?.id || base.id };
          created = newIssue;
          return recomputeSprint({ ...s, issues: [...s.issues, newIssue] });
        });
        return updated;
      });
      markEdited();
      return created;
    },
    [markEdited],
  );

  const updateIssue = useCallback<UseDatasetResult['updateIssue']>(
    (sprintId, issueId, updates) => {
      setSprints((prev) =>
        prev.map((s) => {
          if (s.id !== sprintId) return s;
          const issues = s.issues.map((i) => {
            if (i.id !== issueId) return i;
            const merged = { ...i, ...updates };
            // Done に変わった瞬間に完了日が無ければ補完
            if (merged.status === 'Done' && !merged.completionDate) {
              merged.completionDate = new Date().toISOString();
            }
            if (merged.status !== 'Done') {
              merged.completionDate = undefined;
            }
            return merged;
          });
          return recomputeSprint({ ...s, issues });
        }),
      );
      markEdited();
    },
    [markEdited],
  );

  const deleteIssue = useCallback<UseDatasetResult['deleteIssue']>(
    (sprintId, issueId) => {
      setSprints((prev) =>
        prev.map((s) => {
          if (s.id !== sprintId) return s;
          return recomputeSprint({ ...s, issues: s.issues.filter((i) => i.id !== issueId) });
        }),
      );
      markEdited();
    },
    [markEdited],
  );

  const addSprint = useCallback<UseDatasetResult['addSprint']>(
    (name) => {
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + 14);
      const newSprint = createEmptySprint(
        name || `Sprint ${sprints.length + 1}`,
        now.toISOString(),
        end.toISOString(),
      );
      setSprints((prev) => [newSprint, ...prev]);
      markEdited();
      return newSprint;
    },
    [sprints.length, markEdited],
  );

  const updateSprint = useCallback<UseDatasetResult['updateSprint']>(
    (sprintId, updates) => {
      setSprints((prev) =>
        prev.map((s) => {
          if (s.id !== sprintId) return s;
          return recomputeSprint({ ...s, ...updates });
        }),
      );
      markEdited();
    },
    [markEdited],
  );

  const deleteSprint = useCallback<UseDatasetResult['deleteSprint']>(
    (sprintId) => {
      setSprints((prev) => prev.filter((s) => s.id !== sprintId));
      markEdited();
    },
    [markEdited],
  );

  const resetToSource = useCallback(() => {
    if (!sourceSprints) return;
    clearLocal();
    setSprints(sourceSprints);
    setHasLocalEdits(false);
  }, [sourceSprints]);

  const importDataset = useCallback<UseDatasetResult['importDataset']>((data) => {
    setSprints(data.map(recomputeSprint));
    setHasLocalEdits(true);
  }, []);

  const exportDataset = useCallback<UseDatasetResult['exportDataset']>(() => sprints, [sprints]);

  return {
    sprints,
    hasLocalEdits,
    addIssue,
    updateIssue,
    deleteIssue,
    addSprint,
    updateSprint,
    deleteSprint,
    resetToSource,
    importDataset,
    exportDataset,
  };
}
