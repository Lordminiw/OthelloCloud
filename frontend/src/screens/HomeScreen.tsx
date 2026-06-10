import { Card, Text } from "react-native-paper";
import { AppScreen, layout } from "@/components/app-screen";
import { useHousehold } from "@/context/household-context";
import { useLanguage } from "@/context/language-context";

type HomeScreenProps = {
  householdId: string;
};

export function HomeScreen({ householdId }: HomeScreenProps) {
  const { t } = useLanguage();
  const { households } = useHousehold();
  const householdName =
    households.find((household) => household.id === householdId)?.name ?? t("home.title");

  return (
    <AppScreen
      title={t("home.title")}
      browserTitle={t("home.browserTitle")}
    >
      <Card style={layout.card}>
        <Card.Content style={layout.stack}>
          <Text variant="titleMedium">{t("home.welcome")}</Text>
          <Text variant="headlineSmall">{householdName}</Text>
          <Text variant="bodyMedium">
            {t("home.quickActionsTitle")}
          </Text>
          <Text variant="bodyLarge">{t("home.placeholderBody")}</Text>
        </Card.Content>
      </Card>
    </AppScreen>
  );
}
