"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { ASSET_TYPES, CONDITIONS, type AssetSummary } from "@/types";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { Input, Select } from "@/components/ui/Form";
import { ConditionBadge, MaintenanceBadge, RiskScore } from "@/components/domain/StatusBadges";
import { formatDate } from "@/utils/dates";
import { riskLevelFromScore } from "@/utils/format";

type SortKey = "assetId" | "assetType" | "location" | "riskScore" | "lastInspection" | "maintenanceStatus";

const PAGE_SIZE = 20;
const MAINT_RANK = { Due: 0, "In Progress": 1, Scheduled: 2, None: 3 } as const;

const COLUMNS: { key: SortKey | null; label: string }[] = [
  { key: "assetId", label: "Asset ID" },
  { key: "assetType", label: "Asset Type" },
  { key: "location", label: "Location" },
  { key: null, label: "Condition" },
  { key: "riskScore", label: "Risk" },
  { key: "lastInspection", label: "Last Inspection" },
  { key: "maintenanceStatus", label: "Maintenance Status" },
  { key: null, label: "Action" },
];

export function AssetRegistry({
  assets,
  initial,
}: {
  assets: AssetSummary[];
  initial: { q: string; type: string; condition: string; risk: string };
}) {
  const [q, setQ] = useState(initial.q);
  const [type, setType] = useState(initial.type);
  const [condition, setCondition] = useState(initial.condition);
  const [risk, setRisk] = useState(initial.risk);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "riskScore", dir: -1 });
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = assets.filter((a) => {
      if (needle && !(a.assetId.toLowerCase().includes(needle) || a.location.toLowerCase().includes(needle) || a.assetType.toLowerCase().includes(needle))) return false;
      if (type && a.assetType !== type) return false;
      if (condition) {
        if (condition === "Not inspected" ? a.condition !== null : a.condition !== condition) return false;
      }
      if (risk) {
        if (a.riskScore === null) return false;
        if (riskLevelFromScore(a.riskScore) !== risk) return false;
      }
      return true;
    });
    const { key, dir } = sort;
    return list.sort((a, b) => {
      let av: string | number, bv: string | number;
      if (key === "maintenanceStatus") { av = MAINT_RANK[a.maintenanceStatus as keyof typeof MAINT_RANK] ?? 9; bv = MAINT_RANK[b.maintenanceStatus as keyof typeof MAINT_RANK] ?? 9; }
      else if (key === "riskScore") { av = a.riskScore ?? -1; bv = b.riskScore ?? -1; }
      else if (key === "lastInspection") { av = a.lastInspection ?? ""; bv = b.lastInspection ?? ""; }
      else { av = a[key]; bv = b[key]; }
      return av < bv ? -dir : av > bv ? dir : a.assetId.localeCompare(b.assetId);
    });
  }, [assets, q, type, condition, risk, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);
  const hasFilters = !!(q || type || condition || risk);

  const toggleSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "riskScore" || key === "lastInspection" ? -1 : 1 }));
    setPage(0);
  };
  const onFilter = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(0); };

  return (
    <Card bodyClassName="p-0">
      <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_repeat(3,minmax(0,180px))_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input aria-label="Search assets" type="search" className="pl-9" placeholder="Search ID, location or type" value={q} onChange={(e) => onFilter(setQ)(e.target.value)} />
        </div>
        <Select aria-label="Filter by asset type" value={type} onChange={(e) => onFilter(setType)(e.target.value)}>
          <option value="">All types</option>
          {ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}
        </Select>
        <Select aria-label="Filter by condition" value={condition} onChange={(e) => onFilter(setCondition)(e.target.value)}>
          <option value="">All conditions</option>
          {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
          <option>Not inspected</option>
        </Select>
        <Select aria-label="Filter by risk level" value={risk} onChange={(e) => onFilter(setRisk)(e.target.value)}>
          <option value="">All risk levels</option>
          <option value="Low">Low (0-30)</option>
          <option value="Moderate">Moderate (31-60)</option>
          <option value="High">High (61-100)</option>
        </Select>
        {hasFilters && (
          <button onClick={() => { setQ(""); setType(""); setCondition(""); setRisk(""); setPage(0); }} className="text-sm font-medium text-blue-600 hover:underline">
            Clear
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No assets match your filters" hint="Try a different search term or clear the filters." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.label} scope="col" className="px-4 py-2.5 font-medium" aria-sort={c.key && sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}>
                    {c.key ? (
                      <button onClick={() => toggleSort(c.key!)} className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-slate-800">
                        {c.label}
                        {sort.key === c.key && (sort.dir === 1 ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden />)}
                      </button>
                    ) : c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((a) => (
                <tr key={a.assetId} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <Link href={`/assets/${a.assetId}`} className="font-medium text-blue-700 hover:underline">{a.assetId}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{a.assetType}</td>
                  <td className="px-4 py-3 text-slate-600">{a.location}</td>
                  <td className="px-4 py-3"><ConditionBadge condition={a.condition} /></td>
                  <td className="whitespace-nowrap px-4 py-3"><RiskScore score={a.riskScore} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(a.lastInspection)}</td>
                  <td className="px-4 py-3"><MaintenanceBadge status={a.maintenanceStatus} /></td>
                  <td className="px-4 py-3">
                    <Link href={`/assets/${a.assetId}`} className={buttonClass("secondary", "sm")}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
        <span>
          {filtered.length === 0 ? "0 assets" : `${current * PAGE_SIZE + 1}–${Math.min(filtered.length, (current + 1) * PAGE_SIZE)} of ${filtered.length.toLocaleString("en-IN")} assets`}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(current - 1)} disabled={current === 0} aria-label="Previous page" className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <span className="px-2 tabular-nums">Page {current + 1} / {pages}</span>
          <button onClick={() => setPage(current + 1)} disabled={current >= pages - 1} aria-label="Next page" className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </Card>
  );
}
