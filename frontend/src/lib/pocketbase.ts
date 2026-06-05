import PocketBase from "pocketbase";

export const pocketBaseUrl = process.env.EXPO_PUBLIC_POCKETBASE_URL;

if (!pocketBaseUrl) {
  throw new Error("Missing EXPO_PUBLIC_POCKETBASE_URL");
}

export const pb = new PocketBase(pocketBaseUrl);
const resolvedPocketBaseUrl = pocketBaseUrl;

export function buildPocketBaseUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (typeof window !== "undefined" && path.startsWith("/")) {
    return new URL(path, window.location.origin).toString();
  }

  return new URL(path, resolvedPocketBaseUrl).toString();
}
