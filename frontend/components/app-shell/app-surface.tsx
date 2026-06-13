import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

type AppSurfaceProps = {
  children: ReactNode;
  compact?: boolean;
  maxWidth?: number;
};

export function AppSurface({
  children,
  compact = false,
  maxWidth,
}: AppSurfaceProps) {
  const contentMaxWidth = maxWidth ?? (compact ? 640 : 1040);

  return <View style={[styles.surface, { maxWidth: contentMaxWidth }]}>{children}</View>;
}

const styles = StyleSheet.create({
  surface: {
    width: "100%",
    alignSelf: "center",
    gap: 12,
  },
});
