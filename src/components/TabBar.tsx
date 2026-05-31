import type { LucideIcon } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export function TabBar({ tabs, activeId, onChange }: Props) {
  return (
    <div className="flex gap-1 border-b border-slate-700 mb-6 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              active
                ? 'border-blue-500 text-white bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
            aria-selected={active}
            role="tab"
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
