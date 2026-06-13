import { ReactNode } from "react";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useTheme } from "react-native-paper";
import { AppHeader } from "./app-header";
import { AppSurface } from "./app-surface";

export type AppShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  centered?: boolean;
  maxWidth?: number;
  showBrand?: boolean;
};

export function AppShell({
  title,
  subtitle,
  actions,
  children,
  centered = false,
  maxWidth,
  showBrand = true,
}: AppShellProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 900;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, centered && styles.centered]}
      >
        <AppSurface compact={compact} maxWidth={maxWidth}>
          <AppHeader title={title} subtitle={subtitle} actions={actions} showBrand={showBrand} />
          <View style={styles.body}>{children}</View>
        </AppSurface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 96,
  },
  centered: {
    justifyContent: "center",
  },
  body: {
    gap: 12,
  },
});
