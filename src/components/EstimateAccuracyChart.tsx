import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Crosshair } from 'lucide-react';
import type { EstimateAccuracy } from '../types';

interface Props {
  data: EstimateAccuracy[];
}

export function EstimateAccuracyChart({ data }: Props) {
  const max = Math.max(10, ...data.map((d) => Math.max(d.estimated, d.actual)));
  const diagonal = [
    { x: 0, y: 0 },
    { x: max, y: max },
  ];

  return (
    <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-6 backdrop-blur">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Crosshair size={22} className="text-purple-400" />
        見積もり精度分析
      </h2>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
          <XAxis
            type="number"
            dataKey="estimated"
            name="見積もり"
            unit="h"
            stroke="rgb(148,163,184)"
            domain={[0, max]}
          />
          <YAxis
            type="number"
            dataKey="actual"
            name="実績"
            unit="h"
            stroke="rgb(148,163,184)"
            domain={[0, max]}
          />
          <ZAxis range={[60, 60]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
            formatter={(value: number) => `${value.toFixed(1)}h`}
            labelFormatter={() => ''}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const d = payload[0].payload as EstimateAccuracy;
              return (
                <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm">
                  <p className="font-bold">{d.id}</p>
                  <p className="text-slate-300 truncate max-w-[240px]">{d.title}</p>
                  <p>見積もり: {d.estimated}h</p>
                  <p>実績: {d.actual}h</p>
                  <p>精度: {d.accuracy}%</p>
                  <p className="text-slate-400 text-xs">{d.assignee}</p>
                </div>
              );
            }}
          />
          <ReferenceLine
            segment={diagonal}
            stroke="#94a3b8"
            strokeDasharray="5 5"
            ifOverflow="extendDomain"
          />
          <Scatter name="課題" data={data} fill="#a855f7" />
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-400 mt-2">
        ※ 対角線上の点 = 見積もり通り。上側 = 超過、下側 = 短縮で完了。
      </p>
    </div>
  );
}
