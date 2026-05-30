import { Target, CheckCircle, Clock, Gauge } from 'lucide-react';
import type { KPIMetrics } from '../types';

interface Props {
  metrics: KPIMetrics;
}

export function KPICards({ metrics }: Props) {
  const cards = [
    {
      label: 'Story Points',
      value: `${metrics.pointsCompletion}%`,
      subtitle: `${metrics.completedPoints} / ${metrics.totalPoints}pt`,
      color: 'from-blue-600',
      icon: Target,
    },
    {
      label: '課題完了率',
      value: `${metrics.issuesCompletion}%`,
      subtitle: `${metrics.completedIssues} / ${metrics.totalIssues}件`,
      color: 'from-emerald-600',
      icon: CheckCircle,
    },
    {
      label: '見積もり精度',
      value: `${metrics.hoursAccuracy}%`,
      subtitle: `${metrics.actualHours}h / ${metrics.estimatedHours}h`,
      color: 'from-purple-600',
      icon: Clock,
    },
    {
      label: 'Velocity',
      value: `${metrics.velocity}pt`,
      subtitle: '完了ポイント',
      color: 'from-orange-600',
      icon: Gauge,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.color} to-transparent p-6 rounded-xl border border-slate-600 border-opacity-30 backdrop-blur`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-300 text-sm">{card.label}</p>
              <Icon className="text-white opacity-60" size={20} />
            </div>
            <p className="text-4xl font-bold mb-1">{card.value}</p>
            <p className="text-slate-300 text-sm">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
