import { StyleProp, TextStyle, ViewStyle } from "react-native";
import { AppTheme } from "@/constants/theme";

type HeaderControlStyles = {
  button: StyleProp<ViewStyle>;
  content: StyleProp<ViewStyle>;
  label: StyleProp<TextStyle>;
};

export function getHeaderControlStyles(theme: AppTheme): HeaderControlStyles {
  return {
    button: {
      borderRadius: theme.brand.radius.pill,
      borderWidth: 1,
      borderColor: theme.brand.palette.chromeStrong,
      backgroundColor: theme.brand.palette.chrome,
      overflow: "hidden",
    },
    content: {
      minHeight: 40,
      paddingHorizontal: 8,
    },
    label: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
  };
}
