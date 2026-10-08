import { NextResponse } from "next/server";
import { z } from "zod";
import { SAMPLE_IMAGES, getSample, type ScenarioId } from "@/data/samples";
import { HttpError, handler } from "@/server/api";
import { runInspection } from "@/server/workflows/inspection";
import { MAX_UPLOAD_BYTES, detectImageType, saveUpload } from "@/server/storage";
import type { EngineImage } from "@/server/ai/types";

const SCENARIOS = ["corrosion_wear", "crack", "loose_fastener", "healthy"] as const;

const fieldsSchema = z.object({
  assetId: z.string().regex(/^RDNA-TRK-\d{3,6}$/, "must look like RDNA-TRK-4587"),
  scenario: z.enum(SCENARIOS).optional(),
  sampleId: z.string().max(60).optional(),
});

const emptyToUndefined = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v.trim() : undefined);

export const POST = handler(async (req, user) => {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, "Expected multipart form data.");
  }

  const fields = fieldsSchema.parse({
    assetId: emptyToUndefined(form.get("assetId")),
    scenario: emptyToUndefined(form.get("scenario")),
    sampleId: emptyToUndefined(form.get("sampleId")),
  });

  let image: EngineImage;
  let imageUrl: string;

  const file = form.get("image");
  if (fields.sampleId) {
    const sample = getSample(fields.sampleId);
    if (!sample) throw new HttpError(400, `Unknown sample image. Choose one of: ${SAMPLE_IMAGES.map((s) => s.id).join(", ")}`);
    image = { bytes: null, filename: sample.url, scenarioHint: sample.scenario };
    imageUrl = sample.url;
  } else if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, "Image is too large (max 8 MB).");
    const bytes = Buffer.from(await file.arrayBuffer());
    const type = detectImageType(bytes);
    if (!type) throw new HttpError(415, "Unsupported image. Upload a PNG, JPEG or WebP file.");
    imageUrl = saveUpload(bytes, type);
    image = { bytes, filename: file.name };
  } else {
    throw new HttpError(400, "Upload an inspection image or choose a sample image.");
  }

  const result = await runInspection({
    assetId: fields.assetId,
    image,
    imageUrl,
    scenario: fields.scenario as ScenarioId | undefined,
    user,
  });
  return NextResponse.json(result, { status: 201 });
});
