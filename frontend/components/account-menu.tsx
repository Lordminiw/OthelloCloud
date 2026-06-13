import { useContext, useState } from "react";
import { StyleSheet, View } from "react-native";
import { NavigationContext } from "@react-navigation/native";
import { Button, Divider, Menu, Text } from "react-native-paper";
import { headerControlStyles } from "@/components/header-control-styles";
import { useHousehold } from "@/context/household-context";
import { useLanguage } from "@/context/language-context";
import { useSessionActions } from "@/context/session-context";
import { pb } from "@/src/lib/pocketbase";

export function AccountMenu() {
  const navigation = useContext(NavigationContext);
  const { t } = useLanguage();
  const sessionActions = useSessionActions();
  const { households, activeHousehold, setActiveHousehold } = useHousehold();
  const { language, languages, setLanguage } = useLanguage();
  const [visible, setVisible] = useState(false);

  if (!sessionActions || !navigation) {
    return null;
  }

  const user = pb.authStore.model;
  const displayName =
    String(user?.name ?? "").trim() ||
    String(user?.email ?? "").trim() ||
    t("account.unknownUser");
  const email = String(user?.email ?? "").trim();
  const householdLabel = activeHousehold
    ? `${t("account.currentHousehold")}: ${activeHousehold.name}`
    : "";

  function openSettings() {
    setVisible(false);
    navigation.navigate("settings");
  }

  function logout() {
    setVisible(false);
    sessionActions?.onLogout();
  }

  function toggleMenu() {
    setVisible((current) => !current);
  }

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchorPosition="bottom"
      contentStyle={styles.menuContent}
      anchor={
        <Button
          mode="outlined"
          icon="account-circle-outline"
          compact
          testID="account-menu-button"
          accessibilityLabel={`${displayName} account menu`}
          style={[headerControlStyles.button, headerControlStyles.compactButton]}
          contentStyle={headerControlStyles.content}
          labelStyle={headerControlStyles.label}
          onPress={toggleMenu}
        >
          {displayName}
        </Button>
      }
    >
      <View style={styles.profileBlock}>
        <Text variant="titleSmall" numberOfLines={1}>
          {displayName}
        </Text>
        {email ? (
          <Text variant="bodySmall" numberOfLines={1} style={styles.muted}>
            {email}
          </Text>
        ) : null}
        {activeHousehold ? (
          <Text variant="bodySmall" numberOfLines={1} style={styles.muted}>
            {householdLabel}
          </Text>
        ) : null}
      </View>
      <Divider />
      {households.length > 0 ? (
        <>
          <View style={styles.menuSectionLabel}>
            <Text variant="labelSmall" style={styles.muted}>
              {t("common.chooseHousehold")}
            </Text>
          </View>
          {households.map((household) => (
            <Menu.Item
              key={household.id}
              leadingIcon={
                household.id === activeHousehold?.id ? "check" : "home-group"
              }
              title={household.name}
              onPress={() => {
                setActiveHousehold(household);
                setVisible(false);
              }}
            />
          ))}
          <Divider />
        </>
      ) : null}
      <View style={styles.menuSectionLabel}>
        <Text variant="labelSmall" style={styles.muted}>
          {t("language.label")}
        </Text>
      </View>
      {languages.map((candidate) => (
        <Menu.Item
          key={candidate}
          leadingIcon={candidate === language ? "check" : "translate"}
          title={candidate === "de" ? t("language.german") : t("language.english")}
          onPress={() => {
            setLanguage(candidate);
            setVisible(false);
          }}
        />
      ))}
      <Divider />
      <Menu.Item
        leadingIcon="cog-outline"
        title={t("account.settings")}
        onPress={openSettings}
      />
      <Menu.Item
        leadingIcon="logout"
        title={t("account.logout")}
        onPress={logout}
      />
    </Menu>
  );
}

const styles = StyleSheet.create({
  menuContent: {
    minWidth: 240,
  },
  profileBlock: {
    gap: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuSectionLabel: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
  },
  muted: {
    opacity: 0.72,
  },
});
