import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function saveUpload(
  dataUrl: string,
  prefix: string
): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const extMatch = dataUrl.match(/data:image\/(\w+);/);
  const ext = extMatch?.[1] ?? "png";
  const name = `${prefix}-${Date.now()}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, name);
  await fs.writeFile(filePath, Buffer.from(base64, "base64"));
  return `/uploads/${name}`;
}
