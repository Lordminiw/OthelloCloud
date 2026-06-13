import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

type ActionStripProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ActionStrip({ children, style }: ActionStripProps) {
  return <View style={[styles.strip, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
});
