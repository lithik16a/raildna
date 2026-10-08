"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface Slice {
  name: string;
  value: number;
  color: string;
}

export const CHART_COLORS = {
  green: "#16a34a",
  yellow: "#f59e0b",
  red: "#dc2626",
  blue: "#2563eb",
  slate: "#94a3b8",
  navy: "#1b447d",
};

const axisProps = { tick: { fill: "#64748b", fontSize: 12 }, axisLine: { stroke: "#cbd5e1" }, tickLine: false } as const;

export function DonutChart({ data, height = 240 }: { data: Slice[]; height?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div role="img" aria-label={`Distribution: ${data.map((d) => `${d.name} ${d.value}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke="none">
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v, n) => [`${Number(v).toLocaleString("en-IN")} (${total ? Math.round((Number(v) / total) * 100) : 0}%)`, n]} />
          <Legend verticalAlign="bottom" iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleBarChart({
  data,
  series,
  height = 260,
  stacked = false,
}: {
  data: Record<string, string | number>[];
  series: { key: string; name: string; color: string }[];
  height?: number;
  stacked?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip cursor={{ fill: "#f1f5f9" }} />
        {series.length > 1 && <Legend iconType="circle" />}
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={stacked ? 0 : [3, 3, 0, 0]} stackId={stacked ? "a" : undefined} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleLineChart({
  data,
  series,
  height = 260,
  yDomain,
}: {
  data: Record<string, string | number>[];
  series: { key: string; name: string; color: string }[];
  height?: number;
  yDomain?: [number, number];
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis domain={yDomain} allowDecimals={false} {...axisProps} />
        <Tooltip />
        {series.length > 1 && <Legend iconType="circle" />}
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2.5} dot={{ r: 3 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
