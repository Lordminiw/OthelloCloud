import { StyleSheet } from "react-native";

export const headerControlStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  compactButton: {
    minHeight: 48,
    justifyContent: "center",
  },
  content: {
    minHeight: 48,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
