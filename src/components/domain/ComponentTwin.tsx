import type { AssetType, Condition, FindingType } from "@/types";

/**
 * Schematic "digital twin" of a track component. This is a clean illustration, not a 3D model:
 * the body is drawn per asset type, tinted by current condition, with hotspots for defects
 * found in the latest inspection.
 */

const OUTLINE: Record<Condition | "none", string> = {
  Good: "#22c55e",
  Moderate: "#f59e0b",
  "High Risk": "#ef4444",
  none: "#64748b",
};

const ANCHOR: Record<AssetType, { x: number; y: number }> = {
  Fishplate: { x: 150, y: 120 },
  "Rail Clip": { x: 135, y: 140 },
  "Base Plate": { x: 130, y: 160 },
  Sleeper: { x: 200, y: 135 },
  Fastener: { x: 200, y: 72 },
};

const STEEL = "#aab7c7";
const DARK = "#475569";
const RAIL = "#64748b";

function Body({ type, outline }: { type: AssetType; outline: string }) {
  const stroke = { stroke: outline, strokeWidth: 3 };
  switch (type) {
    case "Fishplate":
      return (
        <g>
          <rect x="20" y="95" width="172" height="50" fill={RAIL} />
          <rect x="208" y="95" width="172" height="50" fill={RAIL} />
          <rect x="100" y="72" width="200" height="96" rx="10" fill={STEEL} {...stroke} />
          {[135, 175, 225, 265].map((x) => (
            <g key={x}>
              <circle cx={x} cy="120" r="11" fill="#334155" />
              <circle cx={x} cy="120" r="5" fill="#94a3b8" />
            </g>
          ))}
        </g>
      );
    case "Rail Clip":
      return (
        <g>
          <rect x="20" y="172" width="360" height="40" fill={DARK} />
          <rect x="40" y="150" width="320" height="22" fill={RAIL} />
          <rect x="170" y="62" width="60" height="90" fill={DARK} />
          <path d="M 120 190 L 120 150 Q 120 128 152 134 L 214 150" fill="none" stroke={outline} strokeWidth="14" strokeLinecap="round" />
          <path d="M 120 190 L 120 150 Q 120 128 152 134 L 214 150" fill="none" stroke={STEEL} strokeWidth="8" strokeLinecap="round" />
          <path d="M 280 190 L 280 150 Q 280 128 248 134 L 186 150" fill="none" stroke={STEEL} strokeWidth="8" strokeLinecap="round" opacity="0.55" />
        </g>
      );
    case "Base Plate":
      return (
        <g>
          <rect x="20" y="176" width="360" height="40" fill={DARK} />
          <rect x="160" y="52" width="80" height="88" fill={RAIL} />
          <rect x="140" y="130" width="120" height="14" fill={RAIL} />
          <rect x="70" y="142" width="260" height="38" rx="6" fill={STEEL} {...stroke} />
          {[95, 135, 265, 305].map((x) => (
            <g key={x}>
              <circle cx={x} cy="161" r="9" fill="#334155" />
              <circle cx={x} cy="161" r="4" fill="#94a3b8" />
            </g>
          ))}
        </g>
      );
    case "Sleeper":
      return (
        <g>
          <rect x="30" y="100" width="340" height="76" rx="6" fill={STEEL} {...stroke} />
          <rect x="92" y="58" width="26" height="150" fill={RAIL} opacity="0.9" />
          <rect x="282" y="58" width="26" height="150" fill={RAIL} opacity="0.9" />
          {[92, 118, 282, 308].map((x) => (
            <circle key={x} cx={x} cy="138" r="5" fill="#334155" />
          ))}
        </g>
      );
    case "Fastener":
      return (
        <g>
          <rect x="182" y="96" width="36" height="104" fill="#8a99ac" />
          {[108, 122, 136, 150, 164, 178].map((y) => (
            <line key={y} x1="182" x2="218" y1={y} y2={y + 6} stroke="#64748b" strokeWidth="2" />
          ))}
          <ellipse cx="200" cy="96" rx="44" ry="8" fill="#cbd5e1" />
          <polygon points="160,72 180,46 220,46 240,72 220,98 180,98" fill={STEEL} {...stroke} />
          <circle cx="200" cy="72" r="12" fill="#64748b" />
          <rect x="164" y="198" width="72" height="14" rx="3" fill="#cbd5e1" />
        </g>
      );
  }
}

function Hotspot({ type, at }: { type: FindingType; at: { x: number; y: number } }) {
  switch (type) {
    case "corrosion":
      return (
        <g opacity="0.75" aria-label="Corrosion">
          <circle cx={at.x + 8} cy={at.y - 6} r="16" fill="#c2410c" />
          <circle cx={at.x + 30} cy={at.y + 8} r="11" fill="#9a3412" />
          <circle cx={at.x - 14} cy={at.y + 12} r="9" fill="#ea580c" />
        </g>
      );
    case "surface_wear":
      return <ellipse cx={at.x + 70} cy={at.y - 4} rx="34" ry="16" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="5 4" />;
    case "crack":
      return (
        <polyline
          points={`${at.x + 40},${at.y - 30} ${at.x + 50},${at.y - 8} ${at.x + 42},${at.y + 6} ${at.x + 58},${at.y + 30}`}
          fill="none" stroke="#ef4444" strokeWidth="3.5" strokeLinejoin="round"
        />
      );
    case "loose_fastener":
      return <circle cx={at.x + 20} cy={at.y} r="24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4 4" />;
    case "deformation":
      return <path d={`M ${at.x} ${at.y + 26} q 30 -20 60 0`} fill="none" stroke="#ef4444" strokeWidth="3" />;
  }
}

const HOTSPOT_LABEL: Record<FindingType, string> = {
  corrosion: "Corrosion",
  surface_wear: "Surface wear",
  crack: "Crack",
  loose_fastener: "Loose fastener",
  deformation: "Deformation",
};

export function ComponentTwin({
  assetId,
  assetType,
  condition,
  detected = [],
}: {
  assetId: string;
  assetType: AssetType;
  condition: Condition | null;
  detected?: FindingType[];
}) {
  const outline = OUTLINE[condition ?? "none"];
  const at = ANCHOR[assetType];
  const unique = [...new Set(detected)];
  return (
    <figure className="m-0">
      <svg viewBox="0 0 400 260" className="w-full rounded-lg bg-navy-900" role="img" aria-label={`Digital twin illustration of ${assetType} ${assetId}, condition ${condition ?? "not inspected"}`}>
        <defs>
          <pattern id="twin-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1b447d" strokeWidth="0.6" opacity="0.7" />
          </pattern>
        </defs>
        <rect width="400" height="260" fill="url(#twin-grid)" />
        <Body type={assetType} outline={outline} />
        {unique.map((t) => (
          <Hotspot key={t} type={t} at={at} />
        ))}
        <text x="14" y="24" fill="#93c5fd" fontSize="11" fontWeight="600" letterSpacing="1.2">DIGITAL TWIN</text>
        <text x="14" y="40" fill="#cbd5e1" fontSize="11">{assetId}</text>
        <g transform="translate(386 22)">
          <circle r="6" fill={outline} />
        </g>
        <text x="200" y="248" fill="#94a3b8" fontSize="10" textAnchor="middle">Schematic view · {assetType}</text>
      </svg>
      {unique.length > 0 && (
        <figcaption className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-600">
          <span className="font-medium">Latest findings:</span>
          {unique.map((t) => (
            <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5">{HOTSPOT_LABEL[t]}</span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
