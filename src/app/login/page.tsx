import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Cpu, History, ShieldCheck, TrainTrack } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const POINTS = [
  { icon: ShieldCheck, text: "A permanent digital identity for every track asset" },
  { icon: History, text: "Inspection and maintenance history in one place" },
  { icon: Cpu, text: "AI-assisted inspection with transparent risk scoring" },
];

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden flex-col justify-between bg-navy-900 p-12 text-slate-200 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white">
            <TrainTrack className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <div className="text-xl font-semibold text-white">RailDNA</div>
            <div className="text-xs text-slate-400">Railway Asset Intelligence Platform</div>
          </div>
        </div>
        <div>
          <h1 className="max-w-md text-3xl font-semibold leading-snug text-white">
            From manual identification to data-driven maintenance decisions.
          </h1>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10">
                  <Icon className="h-4 w-4 text-blue-300" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-400">Hackathon MVP. All data shown is synthetic demonstration data, not real railway records.</p>
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <TrainTrack className="h-6 w-6 text-blue-600" aria-hidden />
            <span className="text-lg font-semibold">RailDNA</span>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
          <p className="mb-6 mt-1 text-sm text-slate-500">Field engineer access</p>
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
