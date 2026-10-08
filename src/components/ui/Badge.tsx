import { cn } from "@/utils/cn";

export type Tone = "green" | "yellow" | "red" | "blue" | "slate";

const tones: Record<Tone, string> = {
  green: "bg-green-50 text-green-700 ring-green-600/20",
  yellow: "bg-amber-50 text-amber-700 ring-amber-600/25",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const dots: Record<Tone, string> = {
  green: "bg-green-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
  slate: "bg-slate-400",
};

export function Badge({ tone = "slate", children, dot = true, className }: { tone?: Tone; children: React.ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", tones[tone], className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dots[tone])} aria-hidden />}
      {children}
    </span>
  );
}
