import "server-only";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

export type ImageType = "png" | "jpeg" | "webp";

const MIME: Record<ImageType, string> = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" };

export function uploadsDir(): string {
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), path.dirname(process.env.DATABASE_PATH ?? "data/raildna.db"), "uploads");
}

/** Identify the image from its magic bytes; never trust the client's filename or MIME type. */
export function detectImageType(b: Buffer): ImageType | null {
  if (b.length > 12 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export function saveUpload(bytes: Buffer, type: ImageType): string {
  const dir = uploadsDir();
  fs.mkdirSync(dir, { recursive: true });
  const name = `${randomUUID()}.${type === "jpeg" ? "jpg" : type}`;
  fs.writeFileSync(path.join(/* turbopackIgnore: true */ dir, name), bytes);
  return `/api/uploads/${name}`;
}

const NAME_RE = /^[a-f0-9-]{36}\.(png|jpg|webp)$/;

export function readUpload(name: string): { bytes: Buffer; mime: string } | null {
  if (!NAME_RE.test(name)) return null; // blocks path traversal
  const file = path.join(/* turbopackIgnore: true */ uploadsDir(), name);
  if (!fs.existsSync(file)) return null;
  const ext = name.split(".").pop() as string;
  const type: ImageType = ext === "jpg" ? "jpeg" : (ext as ImageType);
  return { bytes: fs.readFileSync(file), mime: MIME[type] };
}
