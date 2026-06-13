import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

type PageSectionProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PageSection({ children, style }: PageSectionProps) {
  return <View style={[styles.section, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
});
