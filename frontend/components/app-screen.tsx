import { ReactNode, useEffect } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

type AppScreenProps = {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  centered?: boolean;
  maxWidth?: number;
  showBrand?: boolean;
  browserTitle?: string;
};

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
  const contentMaxWidth = maxWidth ?? (width >= 900 ? 1040 : 640);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.title = browserTitle ?? (title === "OthelloCloud" ? "OthelloCloud" : `OthelloCloud - ${title}`);
  }, [browserTitle, title]);

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
          <View style={styles.header}>
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
            {right ? <View style={styles.headerRight}>{right}</View> : null}
          </View>

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
  },
});
