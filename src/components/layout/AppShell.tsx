"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ListTree,
  LogOut,
  Map,
  Menu,
  RotateCcw,
  ScanSearch,
  Search,
  TrainTrack,
  Wrench,
  X,
} from "lucide-react";
import type { User } from "@/types";
import { cn } from "@/utils/cn";
import { request } from "@/services/apiClient";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Asset Registry", icon: ListTree },
  { href: "/map", label: "Map View", icon: Map },
  { href: "/inspections", label: "Inspections", icon: ScanSearch },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: FileText },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  async function resetDemo() {
    if (!window.confirm("Reset all demo data to the original seed? Inspections and maintenance you created will be removed.")) return;
    setBusy(true);
    try {
      await request("/api/demo/reset", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-900 text-slate-300">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white">
          <TrainTrack className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <div className="text-lg font-semibold leading-tight text-white">RailDNA</div>
          <div className="text-[11px] leading-tight text-slate-400">Railway Asset Intelligence Platform</div>
        </div>
      </div>
      <nav aria-label="Main" className="flex-1 space-y-0.5 px-3 py-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-blue-600/90 text-white" : "hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4 text-xs text-slate-400">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardList className="h-4 w-4" aria-hidden />
          <span>
            <span className="block font-medium text-slate-200">{user.name}</span>
            Field Engineer
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={signOut} className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-white/15 px-2 py-1.5 hover:bg-white/5">
            <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
          </button>
          <button
            onClick={resetDemo}
            disabled={busy}
            title="Restore original demo data"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-white/15 px-2 py-1.5 hover:bg-white/5 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset demo
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-xl">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-2 top-2 z-10 rounded p-1.5 text-slate-300 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <form action="/assets" method="get" role="search" className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            name="q"
            type="search"
            aria-label="Search assets"
            placeholder="Search asset ID, e.g. RDNA-TRK-4587"
            className="w-full rounded-md border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </form>
        <span
          title="All assets, inspections and maintenance records are synthetic demonstration data."
          className="ml-auto hidden whitespace-nowrap rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/30 sm:inline-flex"
        >
          DEMO DATA
        </span>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
