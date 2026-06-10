import { ReactNode, useContext, useEffect } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { NavigationContext } from "@react-navigation/native";
import { Text, useTheme } from "react-native-paper";
import { LanguageSelector } from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { brand } from "@/src/theme/brand";

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
  const headerSurface = theme.dark ? "rgba(58, 44, 38, 0.9)" : "rgba(255, 250, 246, 0.94)";
  const headerBorder = theme.dark ? "rgba(110, 86, 72, 0.5)" : "rgba(231, 215, 201, 0.92)";
  const headerInset = theme.dark ? "rgba(247, 237, 229, 0.04)" : "rgba(184, 92, 56, 0.07)";
  const brandColor = theme.dark ? theme.colors.primary : theme.colors.onSurfaceVariant;

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
        <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
          <View
            style={[
              styles.header,
              {
                shadowColor: theme.colors.primary,
              },
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.headerShell,
                {
                  backgroundColor: headerSurface,
                  borderColor: headerBorder,
                },
              ]}
            >
              <View
                style={[styles.headerInset, { backgroundColor: headerInset }]}
              />
            </View>
            <View style={styles.brandBlock}>
              {showBrand ? (
                <Text variant="labelSmall" style={[styles.brand, { color: brandColor }]}>
                  OthelloCloud
                </Text>
              ) : null}
              <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
                {title}
              </Text>
            </View>
            <View style={styles.headerRight}>
              {right ? <View style={styles.headerAction}>{right}</View> : null}
              <LanguageSelector />
              <ThemeToggle />
            </View>
          </View>

          {children}
        </View>
      </ScrollView>
    </View>
  );
}

export const layout = StyleSheet.create({
  stack: {
    gap: brand.spacing.section,
  },
  sectionGrid: {
    gap: brand.spacing.section,
  },
  wideRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: brand.spacing.section,
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
    borderRadius: brand.radius.card,
  },
  listCardContent: {
    paddingHorizontal: 0,
  },
  formContent: {
    gap: 14,
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: brand.spacing.cluster,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: brand.spacing.pageX,
    paddingTop: brand.spacing.pageTop,
    paddingBottom: 112,
    alignItems: "center",
  },
  centeredScroll: {
    justifyContent: "center",
  },
  content: {
    width: "100%",
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
    flexWrap: "wrap",
    marginBottom: 4,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 28,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  headerShell: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  headerInset: {
    ...StyleSheet.absoluteFillObject,
  },
  brandBlock: {
    gap: 4,
    flexShrink: 1,
    minWidth: 220,
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
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  headerAction: {
    flexShrink: 0,
  },
});
