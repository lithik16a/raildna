"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";

export interface TabDef {
  id: string;
  label: string;
  count?: number;
}

/** Accessible tab strip. Panels are server-rendered nodes passed in by the page. */
export function Tabs({ tabs, panels, initial }: { tabs: TabDef[]; panels: Record<string, React.ReactNode>; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0].id);
  return (
    <div>
      <div role="tablist" aria-label="Asset sections" className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setActive(t.id)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              active === t.id ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{t.count}</span>
            )}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={active !== t.id}>
          {panels[t.id]}
        </div>
      ))}
    </div>
  );
}
