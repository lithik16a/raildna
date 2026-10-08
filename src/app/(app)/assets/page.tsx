import type { Metadata } from "next";
import { AssetRegistry } from "@/components/assets/AssetRegistry";
import { PageHeader } from "@/components/ui/Card";
import { listAssetSummaries } from "@/database/repositories/assets";

export const metadata: Metadata = { title: "Asset Registry" };

type Params = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AssetsPage({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const assets = listAssetSummaries();
  return (
    <>
      <PageHeader title="Asset Registry" description="Every track asset with its digital identity. Search, filter and open any asset's digital twin." />
      <AssetRegistry
        key={JSON.stringify(sp)} // remount when the URL query changes (e.g. header search while already on this page)
        assets={assets}
        initial={{ q: one(sp.q), type: one(sp.type), condition: one(sp.condition), risk: one(sp.risk) }}
      />
    </>
  );
}
