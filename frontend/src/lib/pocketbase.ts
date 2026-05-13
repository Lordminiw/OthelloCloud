import PocketBase from "pocketbase";

const pocketBaseUrl = process.env.EXPO_PUBLIC_POCKETBASE_URL;

if (!pocketBaseUrl) {
  throw new Error("Missing EXPO_PUBLIC_POCKETBASE_URL");
}

export const pb = new PocketBase(pocketBaseUrl);