import { ReactNode, useContext, useEffect } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { NavigationContext } from "@react-navigation/native";
import { Text, useTheme } from "react-native-paper";
import { AccountMenu } from "@/components/account-menu";
import { ThemeToggle } from "@/components/theme-toggle";

type AppScreenProps = {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  centered?: boolean;
  maxWidth?: number;
  showBrand?: boolean;
  browserTitle?: string;
};

const BROWSER_TITLE_BRAND = "Othello-Cloud";

export function AppScreen({
  title,
  right,
  children,
  centered = false,
  maxWidth,
  showBrand = true,
  browserTitle,
}: AppScreenProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const navigation = useContext(NavigationContext);
  const contentMaxWidth = maxWidth ?? (width >= 900 ? 1040 : 640);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const nextTitle =
      browserTitle ?? (title === BROWSER_TITLE_BRAND ? BROWSER_TITLE_BRAND : `${BROWSER_TITLE_BRAND} | ${title}`);

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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          centered && styles.centeredScroll,
        ]}
      >
        <View style={[styles.header, { maxWidth: contentMaxWidth }]}>
            <View style={styles.brandBlock}>
              {showBrand ? (
                <Text variant="labelSmall" style={[styles.brand, { color: theme.colors.primary }]}>
                  OthelloCloud
                </Text>
              ) : null}
              <Text variant="headlineMedium" style={styles.title}>
                {title}
              </Text>
            </View>
            <View style={styles.headerRight}>
              {right ? <View style={styles.headerAction}>{right}</View> : null}
              <ThemeToggle />
              <AccountMenu />
            </View>
        </View>

        <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
          {children}
        </View>
      </ScrollView>
    </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 96,
    alignItems: "center",
  },
  centeredScroll: {
    justifyContent: "center",
  },
  content: {
    width: "100%",
    gap: 12,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 2,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "rgba(127, 127, 127, 0.08)",
  },
  brandBlock: {
    gap: 2,
    flexShrink: 1,
  },
  brand: {
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  title: {
    flexShrink: 1,
  },
  headerRight: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  headerAction: {
    flexShrink: 0,
  },
});
