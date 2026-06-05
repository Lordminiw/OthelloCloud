import { Button } from "react-native-paper";
import { useAppTheme } from "@/constants/theme";
import { getHeaderControlStyles } from "@/components/header-control-styles";
import { useLanguage } from "@/context/language-context";
import { useThemeContext } from "@/context/theme-context";

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useThemeContext();
  const { t } = useLanguage();
  const theme = useAppTheme();
  const headerControlStyles = getHeaderControlStyles(theme);
  const isDark = colorScheme === "dark";

  return (
    <Button
      mode="outlined"
      icon={isDark ? "weather-sunny" : "weather-night"}
      compact
      onPress={toggleColorScheme}
      style={headerControlStyles.button}
      contentStyle={headerControlStyles.content}
      labelStyle={[headerControlStyles.label, { color: theme.brand.palette.text }]}
      textColor={theme.brand.palette.text}
    >
      {isDark ? t("theme.light") : t("theme.dark")}
    </Button>
  );
}
