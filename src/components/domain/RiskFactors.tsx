import type { RiskFactor } from "@/types";

const CATEGORY_ORDER: RiskFactor["category"][] = ["Findings", "Condition & Age", "Maintenance History", "Inspection Schedule"];

/** Explains WHY a score is what it is: every point is attributed to a named factor. */
export function RiskFactors({ factors, score }: { factors: RiskFactor[]; score: number }) {
  if (factors.length === 0) {
    return <p className="text-sm text-slate-500">No contributing risk factors recorded for this assessment.</p>;
  }
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: factors.filter((f) => f.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <ul className="space-y-4">
        {groups.map((g) => {
          const subtotal = g.items.reduce((s, f) => s + f.points, 0);
          return (
            <li key={g.category}>
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>{g.category}</span>
                <span className="tabular-nums text-slate-700">+{subtotal}</span>
              </div>
              <ul className="space-y-1.5">
                {g.items.map((f, i) => (
                  <li key={`${f.label}-${i}`} className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{f.label}</p>
                      <p className="text-xs text-slate-500">{f.detail}</p>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold tabular-nums ${f.points < 0 ? "text-slate-500" : "text-red-600"}`}>
                      {f.points > 0 ? "+" : ""}
                      {f.points}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
        <span className="font-medium text-slate-600">Total risk score</span>
        <span className="font-semibold tabular-nums text-slate-900">{score} / 100</span>
      </div>
    </div>
  );
}
