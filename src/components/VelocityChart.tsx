import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface Props {
  data: Array<{ name: string; planned: number; completed: number }>;
}

export function VelocityChart({ data }: Props) {
  return (
    <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <TrendingUp size={22} className="text-blue-400" />
        Velocity 推移（過去6スプリント）
      </h2>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
          <XAxis dataKey="name" stroke="rgb(148,163,184)" />
          <YAxis stroke="rgb(148,163,184)" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
          />
          <Legend />
          <Bar dataKey="planned" fill="#64748b" name="計画" radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" fill="#3b82f6" name="実績" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
