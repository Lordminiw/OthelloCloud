import { ReactNode, useContext, useEffect } from "react";
import { StyleSheet } from "react-native";
import { NavigationContext } from "@react-navigation/native";
import { AppShell } from "@/components/app-shell/app-shell";
import { APP_BRAND } from "@/components/app-shell/app-header";

type AppScreenProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  centered?: boolean;
  maxWidth?: number;
  showBrand?: boolean;
  browserTitle?: string;
};

export function AppScreen({
  title,
  subtitle,
  actions,
  right,
  children,
  centered = false,
  maxWidth,
  showBrand = true,
  browserTitle,
}: AppScreenProps) {
  const navigation = useContext(NavigationContext);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const nextTitle =
      browserTitle ?? (title === APP_BRAND ? APP_BRAND : `${APP_BRAND} | ${title}`);

    const applyTitle = () => {
      document.title = nextTitle;
    };

    if (!navigation) {
      applyTitle();
      return;
    }

    if (navigation.isFocused()) {
      applyTitle();
    }

    return navigation.addListener("focus", applyTitle);
  }, [browserTitle, navigation, title]);

  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      actions={actions ?? right}
      centered={centered}
      maxWidth={maxWidth}
      showBrand={showBrand}
    >
      {children}
    </AppShell>
  );
}

export const layout = StyleSheet.create({
  stack: {
    gap: 12,
  },
  sectionGrid: {
    gap: 12,
  },
  wideRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  wideForm: {
    width: 360,
  },
  widePanel: {
    flex: 1,
    minWidth: 0,
  },
  twoColumnCard: {
    flex: 1,
    minWidth: 280,
  },
  card: {
    borderRadius: 8,
  },
  listCardContent: {
    paddingHorizontal: 0,
  },
  formContent: {
    gap: 12,
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
