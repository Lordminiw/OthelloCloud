import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Menu } from "react-native-paper";
import { headerControlStyles } from "@/components/header-control-styles";
import { useHousehold } from "@/context/household-context";
import { useLanguage } from "@/context/language-context";

export function HouseholdDropdown() {
  const { households, activeHousehold, setActiveHousehold } = useHousehold();
  const { t } = useLanguage();
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
            accessibilityLabel={
              activeHousehold?.name
                ? `${t("common.chooseHousehold")}: ${activeHousehold.name}`
                : t("common.chooseHousehold")
            }
            style={[
              headerControlStyles.button,
              headerControlStyles.compactButton,
              styles.button,
            ]}
            contentStyle={headerControlStyles.content}
            labelStyle={headerControlStyles.label}
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
