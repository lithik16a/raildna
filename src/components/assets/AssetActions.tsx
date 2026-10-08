"use client";

import { useState } from "react";
import { ScanSearch, Wrench } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CreateMaintenanceDialog, type MaintenanceDefaults } from "@/components/maintenance/CreateMaintenanceDialog";

export function AssetActions({ assetId, defaults }: { assetId: string; defaults: MaintenanceDefaults }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ButtonLink href={`/inspections?asset=${assetId}`} variant="secondary">
        <ScanSearch className="h-4 w-4" aria-hidden /> Run AI inspection
      </ButtonLink>
      <Button onClick={() => setOpen(true)}>
        <Wrench className="h-4 w-4" aria-hidden /> Create maintenance action
      </Button>
      <CreateMaintenanceDialog
        key={open ? "open" : "closed"}
        open={open}
        onClose={() => setOpen(false)}
        lockAsset
        defaults={{ ...defaults, assetId }}
      />
    </>
  );
}
