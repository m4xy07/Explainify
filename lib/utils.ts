import { type ClassValue, clsx } from "clsx";
import removeMarkdown from "remove-markdown";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function stringifyUnknown(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string" ? item : stringifyUnknown(item)
      )
      .join("\n");
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function normalizeDocContent(value: unknown): string | undefined {
  const raw = stringifyUnknown(value);
  if (!raw.trim()) return undefined;
  const plain = removeMarkdown(raw, {
    stripListLeaders: true,
    listUnicodeChar: "",
    gfm: true,
    useImgAltText: false,
  })
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[{}[\]]/g, "")
    .replace(/"([^"]+)":/g, "$1:")
    .replace(/:\s*"([^"]+)"/g, ": $1")
    .replace(/""/g, '"')
    .replace(/\s{2,}/g, " ");

  const trimmed = plain.trim();
  if (trimmed) return trimmed;

  const fallback = raw.replace(/\s+/g, " ").trim();
  return fallback || undefined;
}
