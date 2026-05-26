import { ReactNode } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

type AppScreenProps = {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  centered?: boolean;
  maxWidth?: number;
};

export function AppScreen({
  title,
  right,
  children,
  centered = false,
  maxWidth,
}: AppScreenProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const contentMaxWidth = maxWidth ?? (width >= 900 ? 1040 : 640);

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
            <Text variant="headlineMedium" style={styles.title}>
              {title}
            </Text>
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
    paddingBottom: 28,
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
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 2,
  },
  title: {
    flexShrink: 1,
  },
  headerRight: {
    flexShrink: 0,
  },
});
