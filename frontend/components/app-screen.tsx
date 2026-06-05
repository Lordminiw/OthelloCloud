import { ReactNode, useEffect } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Text } from "react-native-paper";
import { useAppTheme } from "@/constants/theme";
import { BrandBackdrop, ScreenReveal, SectionEyebrow } from "@/components/brand-ui";
import { LanguageSelector } from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";

type AppScreenProps = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  centered?: boolean;
  maxWidth?: number;
  showBrand?: boolean;
  browserTitle?: string;
};

export function AppScreen({
  title,
  eyebrow,
  subtitle,
  right,
  children,
  centered = false,
  maxWidth,
  showBrand = true,
  browserTitle,
}: AppScreenProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const contentMaxWidth = maxWidth ?? (width >= 1240 ? 1180 : width >= 900 ? 1040 : 680);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.title = browserTitle ?? (title === "OthelloCloud" ? "OthelloCloud" : `OthelloCloud - ${title}`);
  }, [browserTitle, title]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <BrandBackdrop />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          centered && styles.centeredScroll,
        ]}
      >
        <ScreenReveal style={[styles.content, { maxWidth: contentMaxWidth }]}>
          <View
            style={[
              styles.header,
              {
                backgroundColor: theme.brand.palette.chrome,
                borderColor: theme.brand.palette.chromeStrong,
                shadowColor: theme.brand.shadowColor,
              },
            ]}
          >
            <View style={styles.headerRail}>
              <View style={styles.brandBlock}>
                {showBrand ? (
                  <SectionEyebrow style={{ marginBottom: 6 }}>
                    OthelloCloud
                  </SectionEyebrow>
                ) : null}
                {eyebrow ? <SectionEyebrow>{eyebrow}</SectionEyebrow> : null}
                <Text variant="headlineMedium" style={styles.title}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.brand.palette.textMuted, maxWidth: 680 }}
                  >
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <View style={styles.headerRight}>
                {right ? <View style={styles.headerAction}>{right}</View> : null}
                <LanguageSelector />
                <ThemeToggle />
              </View>
            </View>
            <View
              style={[
                styles.headerRule,
                { backgroundColor: theme.brand.palette.chromeStrong },
              ]}
            />
          </View>

          {children}
        </ScreenReveal>
      </ScrollView>
    </View>
  );
}

export const layout = StyleSheet.create({
  stack: {
    gap: 18,
  },
  sectionGrid: {
    gap: 18,
  },
  wideRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 18,
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
    borderRadius: 24,
    overflow: "hidden",
  },
  listCardContent: {
    paddingHorizontal: 0,
    paddingBottom: 8,
  },
  formContent: {
    gap: 14,
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
    paddingTop: 20,
    paddingBottom: 112,
    alignItems: "center",
  },
  centeredScroll: {
    justifyContent: "center",
  },
  content: {
    width: "100%",
    gap: 18,
  },
  header: {
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 16,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  headerRail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
    flexWrap: "wrap",
  },
  headerRule: {
    height: 1,
    opacity: 0.75,
  },
  brandBlock: {
    gap: 4,
    flexShrink: 1,
  },
  title: {
    flexShrink: 1,
    letterSpacing: -0.6,
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
