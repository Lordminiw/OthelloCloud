export const TAB_KEYS = [
  "home",
  "shopping",
  "expenses",
  "calendar",
  "polls",
  "settings",
] as const;

export type TabKey = (typeof TAB_KEYS)[number];

const TAB_ALIASES: Record<TabKey, string[]> = {
  home: ["home", "dashboard", "start"],
  shopping: ["shopping", "einkauf"],
  expenses: ["expenses", "ausgaben"],
  calendar: ["calendar", "kalender"],
  polls: ["polls", "umfragen"],
  settings: ["settings", "einstellungen", "profile", "profil"],
};

export function resolveTabKey(value: string | null | undefined): TabKey | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  for (const [key, aliases] of Object.entries(TAB_ALIASES) as [TabKey, string[]][]) {
    if (aliases.includes(normalized)) {
      return key;
    }
  }

  return undefined;
}
