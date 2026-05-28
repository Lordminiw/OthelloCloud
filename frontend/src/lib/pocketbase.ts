import PocketBase from "pocketbase";

const configuredPocketBaseUrl = process.env.EXPO_PUBLIC_POCKETBASE_URL;

if (!configuredPocketBaseUrl) {
  throw new Error("Missing EXPO_PUBLIC_POCKETBASE_URL");
}

const pocketBaseUrl =
  typeof window !== "undefined" &&
  (configuredPocketBaseUrl === "/" || configuredPocketBaseUrl === "/api")
    ? window.location.origin
    : configuredPocketBaseUrl;

export const pb = new PocketBase(pocketBaseUrl);
