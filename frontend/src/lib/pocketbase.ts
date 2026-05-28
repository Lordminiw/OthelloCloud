import AsyncStorage from "@react-native-async-storage/async-storage";
import PocketBase, { AsyncAuthStore } from "pocketbase";

const pocketBaseUrl = process.env.EXPO_PUBLIC_POCKETBASE_URL;
const AUTH_STORAGE_KEY = "othellocloud:pb_auth";

if (!pocketBaseUrl) {
  throw new Error("Missing EXPO_PUBLIC_POCKETBASE_URL");
}

const initialAuthState = AsyncStorage.getItem(AUTH_STORAGE_KEY).catch(() => null);

const authStore = new AsyncAuthStore({
  save: async (serialized) => AsyncStorage.setItem(AUTH_STORAGE_KEY, serialized),
  clear: async () => AsyncStorage.removeItem(AUTH_STORAGE_KEY),
  initial: initialAuthState,
});

export const authStoreReady = initialAuthState.then(() => undefined);
export const pb = new PocketBase(pocketBaseUrl, authStore);
