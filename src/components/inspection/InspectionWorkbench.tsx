"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScanSearch } from "lucide-react";
import { SAMPLE_IMAGES, SCENARIO_LABELS, getSample, type ScenarioId } from "@/data/samples";
import type { InspectionResult } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/Feedback";
import { Field, Select } from "@/components/ui/Form";
import { analyzeInspection, type InspectionImage } from "@/services/inspectionService";
import { cn } from "@/utils/cn";
import { AssetPicker, type PickerAsset } from "./AssetPicker";
import { ImageDropzone } from "./ImageDropzone";
import { InspectionResultPanel } from "./InspectionResultPanel";
import { ConditionBadge, RiskScore } from "@/components/domain/StatusBadges";

type Source = { kind: "file"; file: File; url: string } | { kind: "sample"; sampleId: string } | null;

export function InspectionWorkbench({ assets, initialAssetId }: { assets: PickerAsset[]; initialAssetId: string | null }) {
  const router = useRouter();
  const [asset, setAsset] = useState<PickerAsset | null>(() => assets.find((a) => a.assetId === initialAssetId) ?? null);
  const [source, setSource] = useState<Source>(null);
  const [scenario, setScenario] = useState<ScenarioId | "auto">("auto");
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<InspectionResult | null>(null);

  // Release object URLs.
  useEffect(() => () => { if (source?.kind === "file") URL.revokeObjectURL(source.url); }, [source]);

  const previewUrl = source?.kind === "file" ? source.url : source?.kind === "sample" ? getSample(source.sampleId)?.url ?? null : null;
  const fileName = source?.kind === "file" ? source.file.name : source?.kind === "sample" ? getSample(source.sampleId)?.label ?? null : null;
  const ready = !!asset && !!source;

  async function run() {
    if (!asset || !source) return;
    setError(null);
    setResult(null);
    setAnalyzing(true);
    const image: InspectionImage = source.kind === "file" ? { kind: "file", file: source.file } : { kind: "sample", sampleId: source.sampleId };
    try {
      // Small pause so the loading state is perceptible; the demo engine itself is instant.
      const [res] = await Promise.all([
        analyzeInspection(asset.assetId, image, { scenario: scenario === "auto" ? undefined : scenario }),
        new Promise((r) => setTimeout(r, 900)),
      ]);
      setResult(res);
      router.refresh(); // refresh server data (recent inspections) so the whole system reflects the new record
      setTimeout(() => document.getElementById("inspection-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="1. Select asset" subtitle="The inspection is recorded against this asset's digital twin">
          <AssetPicker assets={assets} value={asset} onChange={(a) => { setAsset(a); setResult(null); }} />
          {asset && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2.5 text-sm">
              <span><span className="font-medium text-slate-900">{asset.assetType}</span> <span className="text-slate-500">· {asset.location}</span></span>
              <span className="flex items-center gap-3"><ConditionBadge condition={asset.condition} /><RiskScore score={asset.riskScore} /></span>
            </div>
          )}
        </Card>

        <Card title="2. Component image" subtitle="Upload a photo or use a bundled demo image">
          <ImageDropzone
            previewUrl={previewUrl}
            fileName={fileName}
            onError={setError}
            onClear={() => { setSource(null); setResult(null); }}
            onFile={(file) => { setError(null); setSource({ kind: "file", file, url: URL.createObjectURL(file) }); setResult(null); }}
          />
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Or choose a demo image</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SAMPLE_IMAGES.map((s) => {
                const active = source?.kind === "sample" && source.sampleId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => { setError(null); setSource({ kind: "sample", sampleId: s.id }); setResult(null); }}
                    className={cn("overflow-hidden rounded-md border text-left transition-colors", active ? "border-blue-600 ring-2 ring-blue-500/30" : "border-slate-200 hover:border-slate-400")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.url} alt="" className="h-16 w-full bg-slate-100 object-cover" />
                    <span className="block px-2 py-1.5">
                      <span className="block text-xs font-medium text-slate-800">{s.label}</span>
                      <span className="block text-[11px] text-slate-500">{s.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <Card title="3. Run analysis">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Demo scenario" htmlFor="scenario" className="min-w-64" hint="Demo engine only. Auto derives the result from the image.">
            <Select id="scenario" value={scenario} onChange={(e) => setScenario(e.target.value as ScenarioId | "auto")}>
              {(Object.keys(SCENARIO_LABELS) as (ScenarioId | "auto")[]).map((k) => (
                <option key={k} value={k}>{SCENARIO_LABELS[k]}</option>
              ))}
            </Select>
          </Field>
          <Button onClick={run} loading={analyzing} disabled={!ready} className="px-6">
            <ScanSearch className="h-4 w-4" aria-hidden /> {analyzing ? "Analyzing…" : "Analyze Asset"}
          </Button>
          {!ready && <p className="text-sm text-slate-500">{!asset ? "Select an asset" : "Add an image"} to enable analysis.</p>}
        </div>
        {error && <div className="mt-4"><ErrorBanner message={error} /></div>}
      </Card>

      {result && (
        <div id="inspection-result" className="scroll-mt-20">
          <InspectionResultPanel result={result} />
        </div>
      )}
    </div>
  );
}
