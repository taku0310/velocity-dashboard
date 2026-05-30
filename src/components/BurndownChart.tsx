import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingDown } from 'lucide-react';
import type { BurndownData } from '../types';

interface Props {
  data: BurndownData[];
}

export function BurndownChart({ data }: Props) {
  return (
    <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <TrendingDown size={22} className="text-blue-400" />
        バーンダウングラフ
      </h2>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
          <XAxis
            dataKey="day"
            stroke="rgb(148,163,184)"
            label={{ value: 'Day', position: 'insideBottomRight', offset: -5, fill: '#94a3b8' }}
          />
          <YAxis
            stroke="rgb(148,163,184)"
            label={{ value: 'Points', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
            formatter={(value: number) => `${Math.round(value)} pt`}
            labelFormatter={(label) => `Day ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="remaining"
            stroke="#3b82f6"
            strokeWidth={3}
            name="実績"
            dot={{ fill: '#3b82f6', r: 3 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="理想線"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
