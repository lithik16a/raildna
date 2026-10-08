"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AssetSummary } from "@/types";
import { ConditionBadge, RiskScore } from "@/components/domain/StatusBadges";
import { cn } from "@/utils/cn";

/**
 * Schematic map. No external map API is configured, so demo lat/lng are projected onto an SVG canvas
 * with section corridors and labels. Replace with Leaflet/Mapbox later; the AssetSummary data is unchanged.
 */

const W = 1000;
const H = 640;
const BOUNDS = { minLat: 16.0, maxLat: 27.6, minLng: 71.8, maxLng: 80.6 };

function project(lat: number, lng: number): [number, number] {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * (W - 80) + 40;
  const y = (1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * (H - 80) + 40;
  return [x, y];
}

const COLOR = { Good: "#16a34a", Moderate: "#f59e0b", "High Risk": "#dc2626", none: "#94a3b8" } as const;

type Filter = "all" | "Good" | "Moderate" | "High Risk" | "none";

export function AssetMap({ assets, compact = false }: { assets: AssetSummary[]; compact?: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sections = useMemo(() => {
    const m = new Map<string, { lat: number; lng: number; n: number }>();
    for (const a of assets) {
      const s = m.get(a.location) ?? { lat: 0, lng: 0, n: 0 };
      s.lat += a.latitude; s.lng += a.longitude; s.n++;
      m.set(a.location, s);
    }
    return [...m.entries()].map(([name, s]) => ({ name: name.replace(" Railway Section", "").replace(" Section", ""), lat: s.lat / s.n, lng: s.lng / s.n }));
  }, [assets]);

  const visible = assets.filter((a) => filter === "all" || (filter === "none" ? a.condition === null : a.condition === filter));
  // Draw high risk last so they stay on top.
  const ordered = [...visible].sort((a, b) => (a.riskScore ?? -1) - (b.riskScore ?? -1));
  const selected = assets.find((a) => a.assetId === selectedId) ?? null;

  const filters: { id: Filter; label: string; color: string }[] = [
    { id: "all", label: "All", color: "#2563eb" },
    { id: "Good", label: "Normal", color: COLOR.Good },
    { id: "Moderate", label: "Moderate", color: COLOR.Moderate },
    { id: "High Risk", label: "High risk", color: COLOR["High Risk"] },
    { id: "none", label: "Not inspected", color: COLOR.none },
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="Filter markers by condition">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === f.id ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: f.color }} aria-hidden />
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">{visible.length.toLocaleString("en-IN")} markers</span>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        <svg viewBox={`0 0 ${W} ${H}`} className={cn("block w-full", compact ? "max-h-[420px]" : "max-h-[640px]")} role="img" aria-label="Schematic map of railway assets">
          <defs>
            <pattern id="map-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#dbe3ee" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="#eef2f7" />
          <rect width={W} height={H} fill="url(#map-grid)" />
          {sections.map((s) => {
            const [x, y] = project(s.lat, s.lng);
            return (
              <g key={s.name}>
                <circle cx={x} cy={y} r={28} fill="#1b447d" opacity="0.07" />
                <text x={x} y={y - 34} textAnchor="middle" fontSize="12" fontWeight="600" fill="#475569" style={{ paintOrder: "stroke" }} stroke="#eef2f7" strokeWidth="3">
                  {s.name}
                </text>
              </g>
            );
          })}
          {ordered.map((a) => {
            const [x, y] = project(a.latitude, a.longitude);
            const key = a.condition ?? "none";
            const isSel = a.assetId === selectedId;
            return (
              <circle
                key={a.assetId}
                cx={x}
                cy={y}
                r={isSel ? 9 : a.condition === "High Risk" ? 5.5 : 3.8}
                fill={COLOR[key]}
                fillOpacity={a.condition === null ? 0.55 : 0.9}
                stroke={isSel ? "#0f172a" : "#ffffff"}
                strokeWidth={isSel ? 2.5 : 1}
                tabIndex={a.condition === "High Risk" || isSel ? 0 : -1}
                role="button"
                aria-label={`${a.assetId}, ${a.assetType}, ${a.condition ?? "not inspected"}`}
                className="cursor-pointer"
                onClick={() => setSelectedId(a.assetId)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedId(a.assetId)}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-white/90 px-3 py-2 text-[11px] text-slate-600 shadow-sm ring-1 ring-slate-200">
          <p className="mb-1 font-semibold text-slate-700">Legend</p>
          <p><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-600" />Normal</p>
          <p><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-500" />Moderate</p>
          <p><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-red-600" />High risk</p>
          <p className="mt-1 text-slate-400">Schematic, demo coordinates</p>
        </div>

        {selected && (
          <div className="absolute right-3 top-3 w-64 rounded-lg border border-slate-200 bg-white p-4 shadow-lg" role="dialog" aria-label={`Asset ${selected.assetId}`}>
            <div className="mb-2 flex items-start justify-between">
              <p className="font-semibold text-slate-900">{selected.assetId}</p>
              <button onClick={() => setSelectedId(null)} aria-label="Close" className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Type</dt><dd>{selected.assetType}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Condition</dt><dd><ConditionBadge condition={selected.condition} /></dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Risk score</dt><dd><RiskScore score={selected.riskScore} /></dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Section</dt><dd className="text-right">{selected.location.replace(" Railway Section", "")}</dd></div>
            </dl>
            <Link href={`/assets/${selected.assetId}`} className="mt-3 block rounded-md bg-blue-600 py-1.5 text-center text-sm font-medium text-white hover:bg-blue-700">
              Open digital twin
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
