import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { AccountMenu } from "@/components/account-menu";
import { ThemeToggle } from "@/components/theme-toggle";

export const APP_BRAND = "Othello-Cloud";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  showBrand?: boolean;
};

export function AppHeader({
  title,
  subtitle,
  actions,
  showBrand = true,
}: AppHeaderProps) {
  const theme = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: theme.colors.surfaceVariant }]}>
      <View style={styles.brandBlock}>
        {showBrand ? (
          <Text variant="labelSmall" style={[styles.brand, { color: theme.colors.primary }]}>
            {APP_BRAND}
          </Text>
        ) : null}
        <Text variant="headlineMedium" style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodyMedium" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.headerRight}>
        {actions ? <View style={styles.headerAction}>{actions}</View> : null}
        <ThemeToggle />
        <AccountMenu />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
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
  subtitle: {
    opacity: 0.72,
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
