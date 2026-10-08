import type { Metadata } from "next";
import { MaintenanceBoard } from "@/components/maintenance/MaintenanceBoard";
import { PageHeader } from "@/components/ui/Card";
import { countByStatus, listMaintenance } from "@/database/repositories/maintenance";

export const metadata: Metadata = { title: "Maintenance" };

export default function MaintenancePage() {
  return (
    <>
      <PageHeader title="Maintenance" description="Track maintenance actions from due, through scheduled and in progress, to completed." />
      <MaintenanceBoard records={listMaintenance(50)} counts={countByStatus()} />
    </>
  );
}
