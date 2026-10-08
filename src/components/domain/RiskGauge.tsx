import { riskLabel, riskLevelFromScore } from "@/utils/format";

const COLORS = { Low: "#16a34a", Moderate: "#d97706", High: "#dc2626" } as const;

/** Semi-circular gauge. Pure SVG, safe to render on the server. */
export function RiskGauge({ score, size = 220 }: { score: number | null; size?: number }) {
  if (score === null) {
    return <p className="py-6 text-center text-sm text-slate-500">No risk score yet. Run an inspection.</p>;
  }
  const level = riskLevelFromScore(score);
  const color = COLORS[level];
  const r = 80;
  const cx = 100;
  const cy = 100;
  const circumference = Math.PI * r;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <div className="flex flex-col items-center" role="img" aria-label={`Risk score ${score} out of 100, ${riskLabel(level)}`}>
      <svg viewBox="0 0 200 118" width={size} height={(size * 118) / 200}>
        <path d={arc} fill="none" stroke="#e2e8f0" strokeWidth="16" strokeLinecap="round" />
        <path d={arc} fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" strokeDasharray={`${filled} ${circumference}`} />
        <text x={cx} y={cy - 12} textAnchor="middle" fontSize="38" fontWeight="700" fill="#0f172a">{score}</text>
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="11" fill="#64748b">/ 100</text>
      </svg>
      <span className="-mt-1 rounded-full px-3 py-1 text-xs font-bold tracking-wider text-white" style={{ background: color }}>
        {riskLabel(level)}
      </span>
    </div>
  );
}
