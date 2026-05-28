import PocketBase from "pocketbase";

const pocketBaseUrl = process.env.EXPO_PUBLIC_POCKETBASE_URL;

if (!pocketBaseUrl) {
  throw new Error("Missing EXPO_PUBLIC_POCKETBASE_URL");
}

const resolvedPocketBaseUrl =
  typeof window !== "undefined" && pocketBaseUrl.startsWith("/")
    ? window.location.origin
    : pocketBaseUrl;

export const pb = new PocketBase(resolvedPocketBaseUrl);
