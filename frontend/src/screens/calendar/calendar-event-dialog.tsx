import { ScrollView, StyleSheet, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { Button, Dialog, Portal, Switch, Text, TextInput } from "react-native-paper";
import type { CalendarScreenViewModel } from "./use-calendar-screen";

export function CalendarEventDialog({ vm }: { vm: CalendarScreenViewModel }) {
  return (
    <Portal>
      <Dialog visible={vm.createDialogVisible} onDismiss={() => vm.setCreateDialogVisible(false)}>
        <Dialog.Title>
          {vm.isGerman ? "Neuer Termin am" : "New event on"} {vm.formatDateKey(vm.newStartDate, vm.locale)}
        </Dialog.Title>

        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={styles.dialogContent}>
            <TextInput
              label={vm.isGerman ? "Titel" : "Title"}
              value={vm.newTitle}
              onChangeText={vm.setNewTitle}
              mode="outlined"
              style={styles.field}
            />

            <Button
              mode="outlined"
              onPress={() => vm.setStartDatePickerVisible(true)}
              style={styles.field}
            >
              {vm.isGerman ? "Startdatum:" : "Start date:"} {vm.formatDateKey(vm.newStartDate, vm.locale)}
            </Button>

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextBlock}>
                <Text variant="titleSmall">{vm.isGerman ? "Ganztagig" : "All-day event"}</Text>
                <Text variant="bodySmall" style={styles.helperText}>
                  {vm.isGerman
                    ? "Ohne Start- oder Endzeit speichern."
                    : "Save without a start or end time."}
                </Text>
              </View>
              <Switch value={vm.newAllDay} onValueChange={vm.setNewAllDay} />
            </View>

            {!vm.newAllDay && (
              <>
                <Button mode="outlined" onPress={() => vm.openTimePicker("start")} style={styles.field}>
                  {vm.isGerman ? "Startzeit:" : "Start time:"} {vm.newTime}
                </Button>
                <Button mode="outlined" onPress={() => vm.openTimePicker("end")} style={styles.field}>
                  {vm.isGerman ? "Endzeit:" : "End time:"} {vm.newEndTime}
                </Button>
              </>
            )}

            <Button mode="outlined" onPress={() => vm.setEndDatePickerVisible(true)} style={styles.field}>
              {vm.isGerman ? "Enddatum:" : "End date:"}{" "}
              {vm.newEndDate
                ? vm.formatDateKey(vm.newEndDate, vm.locale)
                : `${vm.isGerman ? "gleicher Tag" : "same day"} (${vm.formatDateKey(vm.newStartDate, vm.locale)})`}
            </Button>

            {vm.newEndDate !== "" && (
              <Button mode="text" onPress={() => vm.setNewEndDate("")} style={styles.field}>
                {vm.isGerman ? "Enddatum zuruecksetzen" : "Reset end date"}
              </Button>
            )}

            <TextInput
              label={vm.isGerman ? "Ort optional" : "Location optional"}
              value={vm.newLocation}
              onChangeText={vm.setNewLocation}
              mode="outlined"
            />

            <TextInput
              label={vm.isGerman ? "Notiz optional" : "Note optional"}
              value={vm.newNotes}
              onChangeText={vm.setNewNotes}
              mode="outlined"
              multiline
              style={styles.notesField}
            />

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextBlock}>
                <Text variant="titleSmall">
                  {vm.isGerman ? "Andere Mitglieder anfragen" : "Request other members"}
                </Text>
                <Text variant="bodySmall" style={styles.helperText}>
                  {vm.isGerman
                    ? "Die ausgewaehlten Personen sehen den Termin als Anfrage."
                    : "The selected people see the event as a request."}
                </Text>
              </View>
              <Switch
                value={vm.newRequestParticipation}
                onValueChange={vm.setNewRequestParticipation}
              />
            </View>

            {vm.newRequestParticipation && (
              <View style={styles.requestList}>
                {vm.creatorOptions.map((member) => (
                  <Button
                    key={member.userId}
                    mode={vm.newRequestedMemberIds.includes(member.userId) ? "contained" : "outlined"}
                    onPress={() => vm.toggleRequestedMember(member.userId)}
                    style={styles.requestChip}
                  >
                    {member.name || member.email}
                  </Button>
                ))}
              </View>
            )}
          </ScrollView>
        </Dialog.ScrollArea>

        <Dialog.Actions>
          <Button onPress={() => vm.setCreateDialogVisible(false)}>
            {vm.isGerman ? "Abbrechen" : "Cancel"}
          </Button>
          <Button onPress={() => void vm.addEvent()}>{vm.isGerman ? "Speichern" : "Save"}</Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog visible={vm.editingEvent !== null} onDismiss={vm.closeEditDialog}>
        <Dialog.Title>{vm.isGerman ? "Termin bearbeiten" : "Edit event"}</Dialog.Title>

        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={styles.dialogContent}>
            <TextInput
              label={vm.isGerman ? "Titel" : "Title"}
              value={vm.newTitle}
              onChangeText={vm.setNewTitle}
              mode="outlined"
              style={styles.field}
            />

            <Button
              mode="outlined"
              onPress={() => vm.setEditStartDatePickerVisible(true)}
              style={styles.field}
            >
              {vm.isGerman ? "Startdatum:" : "Start date:"} {vm.formatDateKey(vm.newStartDate, vm.locale)}
            </Button>

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextBlock}>
                <Text variant="titleSmall">{vm.isGerman ? "Ganztagig" : "All-day event"}</Text>
                <Text variant="bodySmall" style={styles.helperText}>
                  {vm.isGerman
                    ? "Ohne Start- oder Endzeit speichern."
                    : "Save without a start or end time."}
                </Text>
              </View>
              <Switch value={vm.newAllDay} onValueChange={vm.setNewAllDay} />
            </View>

            {!vm.newAllDay && (
              <>
                <Button mode="outlined" onPress={() => vm.openTimePicker("start")} style={styles.field}>
                  {vm.isGerman ? "Startzeit:" : "Start time:"} {vm.newTime}
                </Button>
                <Button mode="outlined" onPress={() => vm.openTimePicker("end")} style={styles.field}>
                  {vm.isGerman ? "Endzeit:" : "End time:"} {vm.newEndTime}
                </Button>
              </>
            )}

            <Button
              mode="outlined"
              onPress={() => vm.setEditEndDatePickerVisible(true)}
              style={styles.field}
            >
              {vm.isGerman ? "Enddatum:" : "End date:"}{" "}
              {vm.newEndDate
                ? vm.formatDateKey(vm.newEndDate, vm.locale)
                : `${vm.isGerman ? "gleicher Tag" : "same day"} (${vm.formatDateKey(vm.newStartDate, vm.locale)})`}
            </Button>

            {vm.newEndDate !== "" && (
              <Button mode="text" onPress={() => vm.setNewEndDate("")} style={styles.field}>
                {vm.isGerman ? "Enddatum zuruecksetzen" : "Reset end date"}
              </Button>
            )}

            <TextInput
              label={vm.isGerman ? "Ort optional" : "Location optional"}
              value={vm.newLocation}
              onChangeText={vm.setNewLocation}
              mode="outlined"
            />

            <TextInput
              label={vm.isGerman ? "Notiz optional" : "Note optional"}
              value={vm.newNotes}
              onChangeText={vm.setNewNotes}
              mode="outlined"
              multiline
              style={styles.notesField}
            />

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextBlock}>
                <Text variant="titleSmall">
                  {vm.isGerman ? "Andere Mitglieder anfragen" : "Request other members"}
                </Text>
                <Text variant="bodySmall" style={styles.helperText}>
                  {vm.isGerman
                    ? "Die ausgewaehlten Personen sehen den Termin als Anfrage."
                    : "The selected people see the event as a request."}
                </Text>
              </View>
              <Switch
                value={vm.newRequestParticipation}
                onValueChange={vm.setNewRequestParticipation}
              />
            </View>

            {vm.newRequestParticipation && (
              <View style={styles.requestList}>
                {vm.creatorOptions.map((member) => (
                  <Button
                    key={member.userId}
                    mode={vm.newRequestedMemberIds.includes(member.userId) ? "contained" : "outlined"}
                    onPress={() => vm.toggleRequestedMember(member.userId)}
                    style={styles.requestChip}
                  >
                    {member.name || member.email}
                  </Button>
                ))}
              </View>
            )}
          </ScrollView>
        </Dialog.ScrollArea>

        <Dialog.Actions>
          <Button onPress={vm.closeEditDialog}>{vm.isGerman ? "Abbrechen" : "Cancel"}</Button>
          <Button onPress={() => void vm.saveEditedEvent()}>{vm.isGerman ? "Speichern" : "Save"}</Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog
        visible={vm.startDatePickerVisible}
        onDismiss={() => vm.setStartDatePickerVisible(false)}
      >
        <Dialog.Title>{vm.isGerman ? "Startdatum auswaehlen" : "Choose start date"}</Dialog.Title>
        <Dialog.Content>
          <Calendar
            key={vm.theme.dark ? "dark" : "light"}
            firstDay={1}
            current={vm.newStartDate}
            markedDates={{
              [vm.newStartDate]: {
                selected: true,
                selectedColor: vm.theme.colors.primary,
              },
            }}
            onDayPress={(day) => {
              vm.changeNewStartDate(day.dateString);
              vm.setStartDatePickerVisible(false);
            }}
            theme={vm.calendarTheme}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => vm.setStartDatePickerVisible(false)}>
            {vm.isGerman ? "Abbrechen" : "Cancel"}
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog visible={vm.timePickerTarget !== null} onDismiss={() => vm.setTimePickerTarget(null)}>
        <Dialog.Title>
          {vm.timePickerTarget === "end"
            ? vm.isGerman
              ? "Endzeit waehlen"
              : "Choose end time"
            : vm.isGerman
              ? "Startzeit waehlen"
              : "Choose start time"}
        </Dialog.Title>
        <Dialog.Content>
          <View style={styles.timePickerPanel}>
            <Text variant="displaySmall" style={styles.timePickerValue}>
              {vm.draftTime}
            </Text>
            <View style={styles.timePickerControls}>
              <View style={styles.timePickerColumn}>
                <Text variant="labelLarge">{vm.isGerman ? "Stunde" : "Hour"}</Text>
                <Button
                  mode="outlined"
                  accessibilityLabel={`${vm.timePickerTarget === "end" ? "Endzeit" : "Startzeit"} Stunde erhoehen`}
                  onPress={() => vm.adjustDraftTime(60)}
                >
                  +
                </Button>
                <Button
                  mode="outlined"
                  accessibilityLabel={`${vm.timePickerTarget === "end" ? "Endzeit" : "Startzeit"} Stunde verringern`}
                  onPress={() => vm.adjustDraftTime(-60)}
                >
                  -
                </Button>
              </View>
              <View style={styles.timePickerColumn}>
                <Text variant="labelLarge">{vm.isGerman ? "Minute" : "Minute"}</Text>
                <Button
                  mode="outlined"
                  accessibilityLabel={`${vm.timePickerTarget === "end" ? "Endzeit" : "Startzeit"} Minute erhoehen`}
                  onPress={() => vm.adjustDraftTime(5)}
                >
                  +5
                </Button>
                <Button
                  mode="outlined"
                  accessibilityLabel={`${vm.timePickerTarget === "end" ? "Endzeit" : "Startzeit"} Minute verringern`}
                  onPress={() => vm.adjustDraftTime(-5)}
                >
                  -5
                </Button>
              </View>
            </View>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => vm.setTimePickerTarget(null)}>
            {vm.isGerman ? "Abbrechen" : "Cancel"}
          </Button>
          <Button onPress={vm.confirmTimePicker}>OK</Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog visible={vm.endDatePickerVisible} onDismiss={() => vm.setEndDatePickerVisible(false)}>
        <Dialog.Title>{vm.isGerman ? "Enddatum auswaehlen" : "Choose end date"}</Dialog.Title>
        <Dialog.Content>
          <Calendar
            key={vm.theme.dark ? "dark" : "light"}
            firstDay={1}
            current={vm.newEndDate || vm.newStartDate}
            minDate={vm.newStartDate}
            markedDates={{
              [vm.newStartDate]: {
                marked: true,
                dotColor: vm.theme.colors.primary,
              },
              [vm.newEndDate || vm.newStartDate]: {
                selected: true,
                selectedColor: vm.theme.colors.primary,
              },
            }}
            onDayPress={(day) => {
              vm.setNewEndDate(day.dateString === vm.newStartDate ? "" : day.dateString);
              vm.setEndDatePickerVisible(false);
            }}
            theme={vm.calendarTheme}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onPress={() => {
              vm.setNewEndDate("");
              vm.setEndDatePickerVisible(false);
            }}
          >
            {vm.isGerman ? "Gleicher Tag" : "Same day"}
          </Button>
          <Button onPress={() => vm.setEndDatePickerVisible(false)}>
            {vm.isGerman ? "Abbrechen" : "Cancel"}
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog
        visible={vm.editStartDatePickerVisible}
        onDismiss={() => vm.setEditStartDatePickerVisible(false)}
      >
        <Dialog.Title>{vm.isGerman ? "Startdatum auswaehlen" : "Choose start date"}</Dialog.Title>
        <Dialog.Content>
          <Calendar
            key={vm.theme.dark ? "dark" : "light"}
            firstDay={1}
            current={vm.newStartDate}
            markedDates={{
              [vm.newStartDate]: {
                selected: true,
                selectedColor: vm.theme.colors.primary,
              },
            }}
            onDayPress={(day) => {
              vm.changeNewStartDate(day.dateString);
              vm.setEditStartDatePickerVisible(false);
            }}
            theme={vm.calendarTheme}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => vm.setEditStartDatePickerVisible(false)}>
            {vm.isGerman ? "Abbrechen" : "Cancel"}
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog visible={vm.editEndDatePickerVisible} onDismiss={() => vm.setEditEndDatePickerVisible(false)}>
        <Dialog.Title>{vm.isGerman ? "Enddatum auswaehlen" : "Choose end date"}</Dialog.Title>
        <Dialog.Content>
          <Calendar
            key={vm.theme.dark ? "dark" : "light"}
            firstDay={1}
            current={vm.newEndDate || vm.newStartDate}
            minDate={vm.newStartDate}
            markedDates={{
              [vm.newStartDate]: {
                marked: true,
                dotColor: vm.theme.colors.primary,
              },
              [vm.newEndDate || vm.newStartDate]: {
                selected: true,
                selectedColor: vm.theme.colors.primary,
              },
            }}
            onDayPress={(day) => {
              vm.setNewEndDate(day.dateString === vm.newStartDate ? "" : day.dateString);
              vm.setEditEndDatePickerVisible(false);
            }}
            theme={vm.calendarTheme}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onPress={() => {
              vm.setNewEndDate("");
              vm.setEditEndDatePickerVisible(false);
            }}
          >
            {vm.isGerman ? "Gleicher Tag" : "Same day"}
          </Button>
          <Button onPress={() => vm.setEditEndDatePickerVisible(false)}>
            {vm.isGerman ? "Abbrechen" : "Cancel"}
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog visible={vm.colorConfigVisible} onDismiss={() => vm.setColorConfigVisible(false)}>
        <Dialog.Title>{vm.isGerman ? "Farben pro Person" : "Colors per person"}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={styles.dialogContent}>
            {vm.members.length === 0 && (
              <Text variant="bodyMedium">
                {vm.isGerman ? "Keine Mitglieder geladen." : "No members loaded."}
              </Text>
            )}
            {vm.members.map((member) => (
              <View key={member.userId} style={styles.colorRow}>
                <View style={styles.colorBody}>
                  <Text variant="titleSmall">{member.name || member.email}</Text>
                  <Text variant="bodySmall" style={styles.helperText}>
                    {vm.isGerman
                      ? "Veranstaltungen von dieser Person nutzen diese Farbe."
                      : "Events from this person use this color."}
                  </Text>
                </View>
                <View style={styles.paletteRow}>
                  {[
                    "#2563eb",
                    "#7c3aed",
                    "#db2777",
                    "#ea580c",
                    "#16a34a",
                    "#0891b2",
                    "#4f46e5",
                    "#ca8a04",
                  ].map((color) => (
                    <Button
                      key={color}
                      mode={vm.getMemberColor(member.userId) === color ? "contained" : "outlined"}
                      onPress={() => vm.setMemberColor(member.userId, color)}
                      compact
                      style={[styles.colorSwatchButton, { borderColor: color }]}
                      buttonColor={vm.getMemberColor(member.userId) === color ? color : undefined}
                      textColor={vm.getMemberColor(member.userId) === color ? vm.theme.colors.onPrimary : color}
                    >
                      <Text style={[styles.colorSwatchText, { color }]}>■</Text>
                    </Button>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={() => vm.setColorConfigVisible(false)}>
            {vm.isGerman ? "Schliessen" : "Close"}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialogContent: {
    paddingVertical: 12,
  },
  field: {
    marginBottom: 12,
  },
  notesField: {
    marginTop: 12,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  toggleTextBlock: {
    flex: 1,
    gap: 2,
  },
  helperText: {
    opacity: 0.75,
  },
  requestList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  requestChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  timePickerPanel: {
    alignItems: "center",
    gap: 18,
    paddingVertical: 8,
  },
  timePickerValue: {
    fontVariant: ["tabular-nums"],
  },
  timePickerControls: {
    flexDirection: "row",
    gap: 18,
    justifyContent: "center",
  },
  timePickerColumn: {
    alignItems: "center",
    gap: 8,
    minWidth: 96,
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  colorBody: {
    flex: 1,
  },
  paletteRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end",
    maxWidth: 170,
  },
  colorSwatchButton: {
    minWidth: 34,
    paddingHorizontal: 0,
  },
  colorSwatchText: {
    fontSize: 18,
    lineHeight: 18,
  },
});
