import Link from "next/link";
import { cn } from "@/utils/cn";

const ACCENT = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  red: "bg-red-50 text-red-600",
  yellow: "bg-amber-50 text-amber-600",
} as const;

export function KpiCard({
  label,
  value,
  hint,
  icon,
  accent,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  accent: keyof typeof ACCENT;
  href?: string;
}) {
  const body = (
    <div className="flex items-center gap-4">
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg", ACCENT[accent])}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-3xl font-semibold tabular-nums leading-tight text-slate-900">{value}</p>
        {hint && <p className="truncate text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
  const cls = "block rounded-lg border border-slate-200 bg-white p-5 shadow-sm";
  return href ? (
    <Link href={href} className={cn(cls, "transition-shadow hover:shadow-md")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
