"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { ENGINEERS } from "@/data/engineers";
import { PRIORITIES, type MaintenanceRecord, type Priority } from "@/types";
import { Button, buttonClass } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/Feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { createMaintenanceAction } from "@/services/maintenanceService";
import { formatDateLong, todayIso } from "@/utils/dates";

export interface MaintenanceDefaults {
  assetId?: string;
  issue?: string;
  priority?: Priority;
  dueDate?: string;
  notes?: string;
}

export function CreateMaintenanceDialog({
  open,
  onClose,
  defaults = {},
  lockAsset = false,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  defaults?: MaintenanceDefaults;
  /** When true the asset ID cannot be edited (opened from an asset context). */
  lockAsset?: boolean;
  onCreated?: (record: MaintenanceRecord) => void;
}) {
  const router = useRouter();
  const [assetId, setAssetId] = useState(defaults.assetId ?? "");
  const [issue, setIssue] = useState(defaults.issue ?? "");
  const [priority, setPriority] = useState<Priority>(defaults.priority ?? "Medium");
  const [assignedTo, setAssignedTo] = useState(ENGINEERS[0]);
  const [dueDate, setDueDate] = useState(defaults.dueDate ?? "");
  const [notes, setNotes] = useState(defaults.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<MaintenanceRecord | null>(null);

  function close() {
    setCreated(null);
    setError(null);
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const record = await createMaintenanceAction({ assetId: assetId.trim().toUpperCase(), issue, priority, assignedTo, dueDate, notes });
      setCreated(record);
      onCreated?.(record);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the maintenance action.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={close} title={created ? "Maintenance action created" : "Create maintenance action"}>
      {created ? (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" aria-hidden />
          <div>
            <p className="font-medium text-slate-900">{created.priority} priority action logged for {created.assetId}</p>
            <p className="mt-1 text-sm text-slate-600">
              {created.issue}. Due {formatDateLong(created.dueDate)}. It now appears in the asset history and counts toward <strong>Maintenance Due</strong> on the dashboard.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href={`/assets/${created.assetId}`} onClick={close} className={buttonClass("secondary")}>View asset history</Link>
            <Link href="/" className={buttonClass("primary")}>Go to Dashboard</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && <ErrorBanner message={error} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Asset ID" htmlFor="m-asset">
              <Input id="m-asset" value={assetId} onChange={(e) => setAssetId(e.target.value)} readOnly={lockAsset} required placeholder="RDNA-TRK-4587" />
            </Field>
            <Field label="Priority" htmlFor="m-priority">
              <Select id="m-priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Issue" htmlFor="m-issue">
            <Input id="m-issue" value={issue} onChange={(e) => setIssue(e.target.value)} required maxLength={200} placeholder="e.g. Corrosion detected" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Assigned engineer" htmlFor="m-engineer">
              <Select id="m-engineer" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                {ENGINEERS.map((n) => <option key={n}>{n}</option>)}
              </Select>
            </Field>
            <Field label="Due date" htmlFor="m-due">
              <Input id="m-due" type="date" min={todayIso()} value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </Field>
          </div>
          <Field label="Notes" htmlFor="m-notes">
            <Textarea id="m-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="Action required, e.g. inspection and component replacement" />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
            <Button type="submit" loading={loading}>Create action</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
