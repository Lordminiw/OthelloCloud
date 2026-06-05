import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Menu } from "react-native-paper";
import { useAppTheme } from "@/constants/theme";
import { getHeaderControlStyles } from "@/components/header-control-styles";
import { useHousehold } from "@/context/household-context";
import { useLanguage } from "@/context/language-context";

export function HouseholdDropdown() {
  const { households, activeHousehold, setActiveHousehold } = useHousehold();
  const { t } = useLanguage();
  const theme = useAppTheme();
  const headerControlStyles = getHeaderControlStyles(theme);
  const [visible, setVisible] = useState(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  if (households.length === 0) return null;

  return (
    <View style={styles.container}>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <Button
            mode="outlined"
            onPress={openMenu}
            icon="home-group"
            style={[headerControlStyles.button, styles.button]}
            contentStyle={headerControlStyles.content}
            labelStyle={[headerControlStyles.label, { color: theme.brand.palette.text }]}
            textColor={theme.brand.palette.text}
            compact
          >
            {activeHousehold?.name || t("common.chooseHousehold")}
          </Button>
        }
      >
        {households.map((household) => (
          <Menu.Item
            key={household.id}
            onPress={() => {
              setActiveHousehold(household);
              closeMenu();
            }}
            title={household.name}
            leadingIcon={household.id === activeHousehold?.id ? "check" : "home"}
          />
        ))}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  button: {
    maxWidth: 220,
  },
});
