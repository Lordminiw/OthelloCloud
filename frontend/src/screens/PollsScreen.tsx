import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, Share, StyleSheet, useWindowDimensions, View } from "react-native";
import * as ExpoLinking from "expo-linking";
import {
  Button,
  Card,
  Checkbox,
  Divider,
  List,
  ProgressBar,
  Switch,
  Text,
  TextInput,
} from "react-native-paper";
import { AppScreen, layout } from "@/components/app-screen";
import { HouseholdDropdown } from "@/components/household-dropdown";
import { pb } from "../lib/pocketbase";
import { HouseholdMember, loadHouseholdMembers } from "../lib/members";
import {
  closePoll,
  createPoll,
  isPollExpired,
  ParsedPoll,
  loadPolls,
  updatePollVote,
} from "../lib/polls";

type PollsScreenProps = {
  householdId: string;
};

function getPollStats(poll: ParsedPoll) {
  const counts = Object.fromEntries(
    poll.options.map((option) => [option.id, poll.voteCounts[option.id] ?? 0])
  );
  const totalVotes = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return { totalVotes, counts };
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function formatEndsAt(endsAt?: string) {
  if (!endsAt) {
    return "";
  }

  const date = new Date(endsAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()} ${pad2(
    date.getHours()
  )}:${pad2(date.getMinutes())}`;
}

function composeLocalDateTime(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);

  if (
    !year ||
    !month ||
    !day ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return "";
  }

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString();
}

function buildPollShareLink(pollId: string) {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/?tab=Umfragen&poll=${encodeURIComponent(pollId)}`;
  }

  return ExpoLinking.createURL("", {
    queryParams: { tab: "Umfragen", poll: pollId },
  });
}

export function PollsScreen({ householdId }: PollsScreenProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const currentUserId = pb.authStore.model?.id ?? "";

  const [polls, setPolls] = useState<ParsedPoll[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [question, setQuestion] = useState("");
  const [optionTexts, setOptionTexts] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [useEndAt, setUseEndAt] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("23:59");
  const [busy, setBusy] = useState(false);
  const [, setClockTick] = useState(0);

  const reloadPolls = useCallback(async (options?: { silent?: boolean }) => {
    try {
      const [pollRecords, memberRecords] = await Promise.all([
        loadPolls(householdId),
        loadHouseholdMembers(householdId),
      ]);

      setPolls(pollRecords);
      setMembers(memberRecords);
    } catch (error: any) {
      console.log("POLLS LOAD ERROR:", error);
      if (!options?.silent) {
        alert(
          "Polls konnten nicht geladen werden. Prüfe, ob die PocketBase-Collection `polls` existiert."
        );
      }
    }
  }, [householdId]);

  useEffect(() => {
    void reloadPolls();
  }, [reloadPolls]);

  useEffect(() => {
    const interval = setInterval(() => {
      setClockTick((tick) => tick + 1);
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;

    void pb.collection("polls").subscribe("*", async () => {
      if (!active) {
        return;
      }

      await reloadPolls({ silent: true });
    });

    return () => {
      active = false;
      void pb.collection("polls").unsubscribe("*");
    };
  }, [reloadPolls]);

  const memberLabelById = useMemo(() => {
    return Object.fromEntries(
      members.map((member) => [
        member.userId,
        member.name || member.email || "Unbekannt",
      ])
    ) as Record<string, string>;
  }, [members]);

  function getMemberLabel(userId: string) {
    return memberLabelById[userId] || "Unbekannt";
  }

  function getPollAuthorLabel(poll: ParsedPoll) {
    return poll.createdBy ? getMemberLabel(poll.createdBy) : "Unbekannt";
  }

  function updateOptionText(index: number, value: string) {
    setOptionTexts((current) =>
      current.map((text, currentIndex) => (currentIndex === index ? value : text))
    );
  }

  function addOptionField() {
    setOptionTexts((current) => [...current, ""]);
  }

  function removeOptionField(index: number) {
    setOptionTexts((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function handleCreatePoll() {
    const trimmedQuestion = question.trim();
    const trimmedOptions = optionTexts.map((text) => text.trim()).filter(Boolean);

    if (!trimmedQuestion) {
      alert("Bitte eine Frage eingeben.");
      return;
    }

    if (trimmedOptions.length < 2) {
      alert("Bitte mindestens zwei Antwortoptionen eingeben.");
      return;
    }

    let endsAt: string | undefined;
    if (useEndAt) {
      if (!endDate || !endTime) {
        alert("Bitte Enddatum und Endzeit angeben.");
        return;
      }

      endsAt = composeLocalDateTime(endDate, endTime);

      if (!endsAt) {
        alert("Das Enddatum konnte nicht gelesen werden.");
        return;
      }
    }

    setBusy(true);
    try {
      await createPoll({
        householdId,
        question: trimmedQuestion,
        optionTexts: trimmedOptions,
        allowMultiple,
        endsAt,
      });

      setQuestion("");
      setOptionTexts(["", ""]);
      setAllowMultiple(false);
      setUseEndAt(false);
      setEndDate("");
      setEndTime("23:59");
      await reloadPolls({ silent: true });
    } catch (error: any) {
      console.log("CREATE POLL ERROR:", error);
      alert(JSON.stringify(error?.response ?? error?.message ?? error, null, 2));
    } finally {
      setBusy(false);
    }
  }

  function getCurrentUserSelection(poll: ParsedPoll) {
    return poll.votes[currentUserId] ?? [];
  }

  async function handleVote(poll: ParsedPoll, optionId: string) {
    if (poll.isClosed || isPollExpired(poll)) {
      alert("Diese Umfrage ist bereits geschlossen.");
      return;
    }

    const currentSelection = getCurrentUserSelection(poll);
    const nextSelection = poll.allowMultiple
      ? currentSelection.includes(optionId)
        ? currentSelection.filter((id) => id !== optionId)
        : [...currentSelection, optionId]
      : [optionId];

    setBusy(true);
    try {
      await updatePollVote(poll, currentUserId, nextSelection);
      await reloadPolls({ silent: true });
    } catch (error: any) {
      console.log("VOTE ERROR:", error);
      alert(JSON.stringify(error?.response ?? error?.message ?? error, null, 2));
    } finally {
      setBusy(false);
    }
  }

  async function handleClosePoll(poll: ParsedPoll) {
    setBusy(true);
    try {
      await closePoll(poll.id);
      await reloadPolls({ silent: true });
    } catch (error: any) {
      console.log("CLOSE POLL ERROR:", error);
      alert(JSON.stringify(error?.response ?? error?.message ?? error, null, 2));
    } finally {
      setBusy(false);
    }
  }

  async function handleSharePoll(poll: ParsedPoll) {
    const link = buildPollShareLink(poll.id);

    try {
      if (Platform.OS === "web") {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(link);
          alert("Link kopiert. Du kannst ihn jetzt in WhatsApp einfügen.");
          return;
        }

        window.prompt("Link kopieren", link);
        return;
      }

      await Share.share({
        message: `${poll.question}\n${link}`,
        url: link,
        title: poll.question,
      });
    } catch (error) {
      console.log("SHARE POLL ERROR:", error);
      alert("Der Link konnte nicht geteilt werden.");
    }
  }

  const activePolls = polls.filter((poll) => !isPollExpired(poll));
  const pastPolls = polls.filter((poll) => isPollExpired(poll));

  const activePollCards = activePolls.map((poll) => {
    const { totalVotes, counts } = getPollStats(poll);
    const mySelection = getCurrentUserSelection(poll);
    const votesByOption = Object.fromEntries(
      poll.options.map((option) => [
        option.id,
        Object.entries(poll.votes)
          .filter(([, optionIds]) => optionIds.includes(option.id))
          .map(([userId]) => getMemberLabel(userId)),
      ])
    ) as Record<string, string[]>;
    const statusLabel = poll.isClosed
      ? "Geschlossen"
      : poll.endsAt
        ? `Läuft bis ${formatEndsAt(poll.endsAt)}`
        : "Offen";

    return (
      <Card key={poll.id} style={layout.card}>
        <Card.Title
          title={poll.question}
          subtitle={`${getPollAuthorLabel(poll)} · ${
            poll.allowMultiple ? "Mehrfachauswahl" : "Einzelauswahl"
          } · ${statusLabel}`}
          right={() =>
            !poll.isClosed ? (
              <View style={styles.titleActions}>
                <Button
                  mode="text"
                  compact
                  icon="share-variant"
                  onPress={() => void handleSharePoll(poll)}
                >
                  Teilen
                </Button>
                <Button mode="text" compact onPress={() => void handleClosePoll(poll)}>
                  Schließen
                </Button>
              </View>
            ) : null
          }
        />
        <Card.Content style={layout.listCardContent}>
          {poll.options.map((option, index) => {
            const count = counts[option.id] ?? 0;
            const percentage =
              totalVotes > 0 ? Math.max(count / Math.max(totalVotes, 1), 0.06) : 0;
            const selected = mySelection.includes(option.id);

            return (
              <View key={option.id}>
                <List.Item
                  title={option.text}
                  description={`${count} Stimme${count === 1 ? "" : "n"}${
                    votesByOption[option.id]?.length
                      ? ` · ${votesByOption[option.id].join(", ")}`
                      : ""
                  }`}
                  left={(props) =>
                    poll.allowMultiple ? (
                      <Checkbox status={selected ? "checked" : "unchecked"} />
                    ) : (
                      <List.Icon
                        {...props}
                        icon={selected ? "radiobox-marked" : "radiobox-blank"}
                      />
                    )
                  }
                  onPress={() => void handleVote(poll, option.id)}
                />
                <ProgressBar
                  progress={percentage}
                  color={selected ? undefined : "#2563eb"}
                  style={{ marginHorizontal: 16, marginBottom: 8 }}
                />
                {index < poll.options.length - 1 && <Divider />}
              </View>
            );
          })}

          <Text variant="bodySmall" style={styles.footerText}>
            {poll.isClosed ? "Diese Umfrage ist geschlossen." : "Du kannst deine Stimme jederzeit ändern."}
          </Text>
        </Card.Content>
      </Card>
    );
  });

  const pastPollCards = pastPolls.map((poll) => {
    const { totalVotes, counts } = getPollStats(poll);
    const votesByOption = Object.fromEntries(
      poll.options.map((option) => [
        option.id,
        Object.entries(poll.votes)
          .filter(([, optionIds]) => optionIds.includes(option.id))
          .map(([userId]) => getMemberLabel(userId)),
      ])
    ) as Record<string, string[]>;

    return (
      <Card key={poll.id} style={layout.card}>
        <Card.Title
          title={poll.question}
          subtitle={`${getPollAuthorLabel(poll)} · ${
            poll.endsAt ? `Beendet ${formatEndsAt(poll.endsAt)}` : "Geschlossen"
          }`}
        />
        <Card.Content style={layout.listCardContent}>
          {poll.options.map((option, index) => {
            const count = counts[option.id] ?? 0;
            const percentage =
              totalVotes > 0 ? Math.max(count / Math.max(totalVotes, 1), 0.06) : 0;

            return (
              <View key={option.id}>
                <List.Item
                  title={option.text}
                  description={`${count} Stimme${count === 1 ? "" : "n"}${
                    votesByOption[option.id]?.length
                      ? ` · ${votesByOption[option.id].join(", ")}`
                      : ""
                  }`}
                  left={(props) => <List.Icon {...props} icon="check-circle-outline" />}
                />
                <ProgressBar
                  progress={percentage}
                  color="#6b7280"
                  style={{ marginHorizontal: 16, marginBottom: 8, opacity: 0.8 }}
                />
                {index < poll.options.length - 1 && <Divider />}
              </View>
            );
          })}
        </Card.Content>
      </Card>
    );
  });

  return (
    <AppScreen title="Umfragen" right={<HouseholdDropdown />}>
      <View style={[layout.sectionGrid, isWide && layout.wideRow]}>
        <Card style={[layout.card, isWide && layout.wideForm]}>
          <Card.Title title="Neue Umfrage" />
          <Card.Content style={layout.formContent}>
            <TextInput
              label="Frage"
              value={question}
              onChangeText={setQuestion}
              mode="outlined"
              placeholder="z.B. Wann gehen wir essen?"
            />

            <View style={styles.multipleRow}>
              <View style={styles.multipleTextBlock}>
                <Text variant="titleSmall">Mehrfachauswahl</Text>
                <Text variant="bodySmall" style={{ opacity: 0.75 }}>
                  Teilnehmer können mehrere Antworten wählen.
                </Text>
              </View>
              <Switch value={allowMultiple} onValueChange={setAllowMultiple} />
            </View>

            <View style={styles.multipleRow}>
              <View style={styles.multipleTextBlock}>
                <Text variant="titleSmall">Ablaufdatum setzen</Text>
                <Text variant="bodySmall" style={{ opacity: 0.75 }}>
                  Die Umfrage schließt automatisch zum gewählten Zeitpunkt.
                </Text>
              </View>
              <Switch value={useEndAt} onValueChange={setUseEndAt} />
            </View>

            {useEndAt && (
              <View style={styles.endAtGrid}>
                <TextInput
                  label="Enddatum"
                  value={endDate}
                  onChangeText={setEndDate}
                  mode="outlined"
                  placeholder="YYYY-MM-DD"
                  style={styles.endAtField}
                />
                <TextInput
                  label="Endzeit"
                  value={endTime}
                  onChangeText={setEndTime}
                  mode="outlined"
                  placeholder="HH:MM"
                  style={styles.endAtField}
                />
              </View>
            )}

            {optionTexts.map((optionText, index) => (
              <View key={`option-${index}`} style={styles.optionRow}>
                <TextInput
                  label={`Option ${index + 1}`}
                  value={optionText}
                  onChangeText={(value) => updateOptionText(index, value)}
                  mode="outlined"
                  style={{ flex: 1 }}
                />
                {optionTexts.length > 2 && (
                  <Button mode="text" onPress={() => removeOptionField(index)}>
                    Entfernen
                  </Button>
                )}
              </View>
            ))}

            <Button mode="outlined" onPress={addOptionField}>
              Option hinzufügen
            </Button>

            <Button mode="contained" onPress={handleCreatePoll} loading={busy}>
              Umfrage erstellen
            </Button>
          </Card.Content>
        </Card>

        <View style={[layout.stack, isWide && layout.widePanel]}>
          <Card style={layout.card}>
            <Card.Title
              title="Aktive Umfragen"
              subtitle={`${activePolls.length} laufende Umfrage${activePolls.length === 1 ? "" : "n"}`}
            />
            <Card.Content style={layout.listCardContent}>
              {activePollCards.length === 0 && (
                <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                  Noch keine Umfragen vorhanden.
                </Text>
              )}

              {activePollCards.length > 0 && (
                <ScrollView nestedScrollEnabled style={!isWide && styles.mobileList}>
                  {activePollCards}
                </ScrollView>
              )}
            </Card.Content>
          </Card>

          <Card style={layout.card}>
            <Card.Title
              title="Vergangene Umfragen"
              subtitle={`${pastPolls.length} abgeschlossene Umfrage${pastPolls.length === 1 ? "" : "n"}`}
            />
            <Card.Content style={layout.listCardContent}>
              {pastPollCards.length === 0 && (
                <Text variant="bodyMedium" style={{ paddingHorizontal: 16 }}>
                  Noch keine vergangenen Umfragen.
                </Text>
              )}

              {pastPollCards.length > 0 && (
                <ScrollView nestedScrollEnabled style={!isWide && styles.mobileList}>
                  {pastPollCards}
                </ScrollView>
              )}
            </Card.Content>
          </Card>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  mobileList: {
    maxHeight: 520,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  multipleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
  },
  multipleTextBlock: {
    flex: 1,
    gap: 2,
  },
  titleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 8,
  },
  endAtGrid: {
    flexDirection: "row",
    gap: 8,
  },
  endAtField: {
    flex: 1,
  },
  footerText: {
    paddingHorizontal: 16,
    paddingTop: 8,
    opacity: 0.7,
  },
});
