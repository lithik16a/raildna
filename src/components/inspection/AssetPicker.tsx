"use client";

import { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { AssetType, Condition } from "@/types";
import { ConditionBadge } from "@/components/domain/StatusBadges";
import { inputClass } from "@/components/ui/Form";
import { cn } from "@/utils/cn";

export interface PickerAsset {
  assetId: string;
  assetType: AssetType;
  location: string;
  condition: Condition | null;
  riskScore: number | null;
}

/** Searchable asset selector (1,000+ assets, so a plain <select> is not usable). */
export function AssetPicker({
  assets,
  value,
  onChange,
}: {
  assets: PickerAsset[];
  value: PickerAsset | null;
  onChange: (a: PickerAsset | null) => void;
}) {
  const listId = useId();
  const [text, setText] = useState(value?.assetId ?? "");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const n = text.trim().toLowerCase();
    if (!n) return assets.slice(0, 8);
    return assets.filter((a) => a.assetId.toLowerCase().includes(n) || a.assetType.toLowerCase().includes(n) || a.location.toLowerCase().includes(n)).slice(0, 8);
  }, [assets, text]);

  function pick(a: PickerAsset) {
    setText(a.assetId);
    setOpen(false);
    onChange(a);
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label="Select asset"
        className={cn(inputClass, "pl-9")}
        placeholder="Search asset ID, e.g. RDNA-TRK-4587"
        value={text}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          if (value && e.target.value !== value.assetId) onChange(null);
          const exact = assets.find((a) => a.assetId.toLowerCase() === e.target.value.trim().toLowerCase());
          if (exact) onChange(exact);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && open && matches[0]) {
            e.preventDefault();
            pick(matches[0]);
          }
          if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && (
        <ul id={listId} role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">No assets found</li>
          ) : (
            matches.map((a) => (
              <li key={a.assetId} role="option" aria-selected={value?.assetId === a.assetId}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); pick(a); }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <span>
                    <span className="font-medium text-slate-900">{a.assetId}</span>
                    <span className="block text-xs text-slate-500">{a.assetType} · {a.location}</span>
                  </span>
                  <ConditionBadge condition={a.condition} />
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
