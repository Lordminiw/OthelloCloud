import { Button } from "react-native-paper";
import { headerControlStyles } from "@/components/header-control-styles";
import { useLanguage } from "@/context/language-context";
import { useThemeContext } from "@/context/theme-context";

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useThemeContext();
  const { t } = useLanguage();
  const isDark = colorScheme === "dark";

  return (
    <Button
      mode="outlined"
      icon={isDark ? "weather-sunny" : "weather-night"}
      compact
      accessibilityLabel={`${isDark ? t("theme.light") : t("theme.dark")} theme`}
      onPress={toggleColorScheme}
      style={[headerControlStyles.button, headerControlStyles.compactButton]}
      contentStyle={headerControlStyles.content}
      labelStyle={headerControlStyles.label}
    >
      {isDark ? t("theme.light") : t("theme.dark")}
    </Button>
  );
}
