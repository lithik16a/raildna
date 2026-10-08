import type { Metadata } from "next";
import { AssetMap } from "@/components/map/AssetMap";
import { Card, PageHeader } from "@/components/ui/Card";
import { listAssetSummaries } from "@/database/repositories/assets";

export const metadata: Metadata = { title: "Map View" };

export default function MapPage() {
  return (
    <>
      <PageHeader title="Map View" description="Asset locations on a schematic railway map (demo coordinates). Select a marker for details." />
      <Card>
        <AssetMap assets={listAssetSummaries()} />
      </Card>
    </>
  );
}
