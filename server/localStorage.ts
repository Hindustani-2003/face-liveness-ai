import fs from "node:fs";
import path from "node:path";

const UPLOADS_DIR = path.resolve(import.meta.dirname, "..", "uploads");

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export function getUploadsDir(): string {
  return UPLOADS_DIR;
}

export function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export async function localStoragePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  ensureUploadsDir();
  const key = appendHashSuffix(normalizeKey(relKey));
  const filePath = path.join(UPLOADS_DIR, key);
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  const buffer =
    typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  await fs.promises.writeFile(filePath, buffer);

  return { key, url: `/uploads/${key.replace(/\\/g, "/")}` };
}

export function localStorageGetPath(key: string): string | null {
  const normalized = normalizeKey(key);
  const filePath = path.resolve(UPLOADS_DIR, normalized);
  if (!filePath.startsWith(UPLOADS_DIR)) return null;
  if (!fs.existsSync(filePath)) return null;
  return filePath;
}
