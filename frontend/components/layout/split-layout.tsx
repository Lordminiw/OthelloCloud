import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

type SplitLayoutProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SplitLayout({ children, style }: SplitLayoutProps) {
  return <View style={[styles.layout, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  layout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
});
