import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Sparkles, FileText, Calendar, X } from 'lucide-react';
import type { Issue, Sprint } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  sprints: Sprint[];
  allIssues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onSelectSprint: (sprint: Sprint) => void;
}

type ResultKind = 'issue' | 'epic' | 'sprint';

interface Result {
  kind: ResultKind;
  id: string;
  primary: string;
  secondary: string;
  issue?: Issue;
  sprint?: Sprint;
}

const MAX_PER_GROUP = 8;

function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  return lower.includes(q);
}

export function CommandPalette({
  open,
  onClose,
  sprints,
  allIssues,
  onSelectIssue,
  onSelectSprint,
}: Props) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 開閉時に状態リセット + autofocus
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      // タイミング上 next tick が確実
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    if (!open) return [];
    const list: Result[] = [];

    // Issues
    const matchedIssues = allIssues.filter(
      (i) => i.type !== 'Epic' && (fuzzyMatch(i.id, query) || fuzzyMatch(i.title, query) || fuzzyMatch(i.assignee, query)),
    );
    for (const issue of matchedIssues.slice(0, MAX_PER_GROUP)) {
      list.push({
        kind: 'issue',
        id: issue.id,
        primary: `${issue.id}  ${issue.title}`,
        secondary: `${issue.status} · ${issue.assignee || '未アサイン'}`,
        issue,
      });
    }

    // Epics
    const matchedEpics = allIssues.filter(
      (i) => i.type === 'Epic' && (fuzzyMatch(i.id, query) || fuzzyMatch(i.title, query)),
    );
    for (const epic of matchedEpics.slice(0, MAX_PER_GROUP)) {
      list.push({
        kind: 'epic',
        id: epic.id,
        primary: `${epic.id}  ${epic.title}`,
        secondary: 'エピック',
        issue: epic,
      });
    }

    // Sprints
    const matchedSprints = sprints.filter((s) => fuzzyMatch(s.name, query) || fuzzyMatch(s.id, query));
    for (const sprint of matchedSprints.slice(0, MAX_PER_GROUP)) {
      list.push({
        kind: 'sprint',
        id: sprint.id,
        primary: sprint.name,
        secondary: `${new Date(sprint.startDate).toLocaleDateString('ja-JP')} 〜 ${new Date(sprint.endDate).toLocaleDateString('ja-JP')}`,
        sprint,
      });
    }

    return list;
  }, [open, query, allIssues, sprints]);

  // Reset selected index when results change
  useEffect(() => {
    if (selectedIndex >= results.length) setSelectedIndex(0);
  }, [results, selectedIndex]);

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const target = results[selectedIndex];
        if (!target) return;
        if (target.kind === 'sprint' && target.sprint) {
          onSelectSprint(target.sprint);
          onClose();
        } else if (target.issue) {
          onSelectIssue(target.issue);
          onClose();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, results, selectedIndex, onClose, onSelectIssue, onSelectSprint]);

  // Scroll selected into view
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(`[data-cmdk-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  const groupedIndices = {
    issue: results.findIndex((r) => r.kind === 'issue'),
    epic: results.findIndex((r) => r.kind === 'epic'),
    sprint: results.findIndex((r) => r.kind === 'sprint'),
  };

  return (
    <div
      role="dialog"
      aria-label="Command palette"
      className="fixed inset-0 bg-black/60 z-[60] flex items-start justify-center pt-[10vh] p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-xl shadow-2xl flex flex-col max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
          <Search size={18} className="text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="課題・エピック・スプリントを検索…"
            className="flex-1 bg-transparent text-slate-100 focus:outline-none"
          />
          <button onClick={onClose} aria-label="閉じる" className="text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {results.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">該当する項目がありません</p>
          ) : (
            <div className="py-2">
              {results.map((r, idx) => {
                const isFirstOfKind =
                  idx === groupedIndices.issue ||
                  idx === groupedIndices.epic ||
                  idx === groupedIndices.sprint;
                const label =
                  r.kind === 'issue' ? '課題' : r.kind === 'epic' ? 'エピック' : 'スプリント';
                const Icon =
                  r.kind === 'epic' ? Sparkles : r.kind === 'sprint' ? Calendar : FileText;
                const selected = idx === selectedIndex;
                return (
                  <div key={`${r.kind}-${r.id}`}>
                    {isFirstOfKind && (
                      <div className="px-4 py-1 text-[10px] uppercase tracking-wider text-slate-500 mt-2 first:mt-0">
                        {label}
                      </div>
                    )}
                    <button
                      data-cmdk-index={idx}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => {
                        if (r.kind === 'sprint' && r.sprint) {
                          onSelectSprint(r.sprint);
                        } else if (r.issue) {
                          onSelectIssue(r.issue);
                        }
                        onClose();
                      }}
                      className={`w-full text-left px-4 py-2 flex items-center gap-3 transition ${
                        selected ? 'bg-blue-600/30' : 'hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon
                        size={14}
                        className={selected ? 'text-blue-300' : 'text-slate-500'}
                      />
                      <span className="text-sm text-slate-100 truncate flex-1">{r.primary}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0">{r.secondary}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-700 text-[10px] text-slate-500">
          <span>↑↓ 移動 · Enter 開く · Esc 閉じる</span>
          <span>{results.length} 件</span>
        </div>
      </div>
    </div>
  );
}
