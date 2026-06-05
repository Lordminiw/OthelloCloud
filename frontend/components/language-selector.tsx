import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Menu } from "react-native-paper";
import { useAppTheme } from "@/constants/theme";
import { getHeaderControlStyles } from "@/components/header-control-styles";
import { useLanguage } from "@/context/language-context";

export function LanguageSelector() {
  const { language, languages, setLanguage, t } = useLanguage();
  const theme = useAppTheme();
  const headerControlStyles = getHeaderControlStyles(theme);
  const [menuVisible, setMenuVisible] = useState(false);

  const currentLabel = language === "de" ? "DE" : "EN";

  return (
    <View style={styles.container}>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            icon="translate"
            compact
            onPress={() => setMenuVisible(true)}
            style={headerControlStyles.button}
            contentStyle={headerControlStyles.content}
            labelStyle={[headerControlStyles.label, { color: theme.brand.palette.text }]}
            textColor={theme.brand.palette.text}
          >
            {currentLabel}
          </Button>
        }
      >
        {languages.map((candidate) => (
          <Menu.Item
            key={candidate}
            title={candidate === "de" ? t("language.german") : t("language.english")}
            onPress={() => {
              setLanguage(candidate);
              setMenuVisible(false);
            }}
            leadingIcon={candidate === language ? "check" : undefined}
          />
        ))}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },
});
