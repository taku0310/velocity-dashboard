import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

interface Props {
  label: string;
  sortKey: string;
  currentKey: string | null;
  currentDir: 'asc' | 'desc';
  onChange: (key: string) => void;
  align?: 'left' | 'right' | 'center';
}

export function SortableHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onChange,
  align = 'left',
}: Props) {
  const active = currentKey === sortKey;
  const Icon = active ? (currentDir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
  const alignClass =
    align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';
  return (
    <th className={`text-${align} py-2 px-2`}>
      <button
        type="button"
        onClick={() => onChange(sortKey)}
        className={`flex items-center gap-1 hover:text-white transition w-full ${alignClass}`}
      >
        <span>{label}</span>
        <Icon size={14} className={active ? 'text-blue-400' : 'text-slate-500'} />
      </button>
    </th>
  );
}

// 汎用比較関数
export function compareValues(a: unknown, b: unknown, dir: 'asc' | 'desc'): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  let cmp = 0;
  if (typeof a === 'number' && typeof b === 'number') cmp = a - b;
  else cmp = String(a).localeCompare(String(b), 'ja');
  return dir === 'asc' ? cmp : -cmp;
}

// クリック時のソート状態更新ヘルパー
export function nextSortState(
  currentKey: string | null,
  currentDir: 'asc' | 'desc',
  clickedKey: string,
): { key: string | null; dir: 'asc' | 'desc' } {
  if (currentKey !== clickedKey) return { key: clickedKey, dir: 'asc' };
  if (currentDir === 'asc') return { key: clickedKey, dir: 'desc' };
  return { key: null, dir: 'asc' };
}
