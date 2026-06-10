import { Card, Text } from "react-native-paper";
import { AppScreen, layout } from "@/components/app-screen";
import { useHousehold } from "@/context/household-context";
import { useLanguage } from "@/context/language-context";

type HomeScreenProps = {
  householdId: string;
};

export function HomeScreen({ householdId }: HomeScreenProps) {
  const { t } = useLanguage();
  const { activeHousehold } = useHousehold();

  return (
    <AppScreen
      title={t("home.title")}
      browserTitle={t("home.browserTitle")}
    >
      <Card style={layout.card}>
        <Card.Content style={layout.stack}>
          <Text variant="titleMedium">{t("home.welcome")}</Text>
          <Text variant="headlineSmall">
            {activeHousehold?.id === householdId ? activeHousehold.name : t("home.title")}
          </Text>
          <Text variant="bodyMedium">
            {t("home.quickActionsTitle")}
          </Text>
          <Text variant="bodyLarge">
            Dashboard coming next.
          </Text>
        </Card.Content>
      </Card>
    </AppScreen>
  );
}
