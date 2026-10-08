import { HttpError, handler } from "@/server/api";
import { readUpload } from "@/server/storage";

export const GET = handler(async (_req, _user, ctx: { params: Promise<{ name: string }> }) => {
  const { name } = await ctx.params;
  const file = readUpload(name);
  if (!file) throw new HttpError(404, "Image not found.");
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mime,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
});
