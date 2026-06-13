import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

type StateBlockProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function StateBlock({ children, style }: StateBlockProps) {
  return <View style={[styles.block, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
});
