export const SUPPORTED_LANGUAGES = ["en", "de"] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

type TranslationValue = string | number | boolean;
export type TranslationArgs = Record<string, TranslationValue>;

export type TranslationTree = {
  app: {
    brand: string;
  };
  language: {
    label: string;
    english: string;
    german: string;
  };
  theme: {
    light: string;
    dark: string;
  };
  common: {
    loading: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    none: string;
    inviteCode: string;
    inviteLink: string;
    chooseHousehold: string;
    membersLoaded: string;
    noMembersFound: string;
    noItems: string;
    noCompletedItems: string;
    noExpenses: string;
    noOpenPayments: string;
    noSettlements: string;
    noPolls: string;
    noPastPolls: string;
    noEvents: string;
    noEventsOnDay: string;
    noFurtherEvents: string;
    loadingHousehold: string;
    loadingMembers: string;
    loadingPolls: string;
    loadingExpenses: string;
    loadingCalendar: string;
    loadingProfile: string;
    noAccountYet: string;
    alreadyHaveAccount: string;
    yes: string;
    no: string;
  };
  tabs: {
    shopping: string;
    expenses: string;
    calendar: string;
    polls: string;
    profile: string;
  };
  auth: {
    loginTitle: string;
    registerTitle: string;
    loginDescription: string;
    registerDescription: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    passwordLabel: string;
    loginButton: string;
    registerButton: string;
    loginToggle: string;
    registerToggle: string;
    emailRequired: string;
    passwordRequired: string;
    nameRequired: string;
    passwordTooShort: string;
    loginFailed: string;
    registerFailed: string;
  };
  setup: {
    title: string;
    createHouseholdTitle: string;
    joinHouseholdTitle: string;
    createDescription: string;
    joinDescription: string;
    householdNameLabel: string;
    householdNamePlaceholder: string;
    inviteCodeLabel: string;
    inviteCodePlaceholder: string;
    createButton: string;
    joinButton: string;
    householdNameRequired: string;
    inviteCodeRequired: string;
    createFailed: string;
    joinFailed: string;
  };
  shopping: {
    title: string;
    browserTitle: string;
    newItemTitle: string;
    addButton: string;
    openItemsEmpty: string;
    doneItemsEmpty: string;
    noItemsYet: string;
    itemLabel: string;
    addItemPlaceholder: string;
    completedSection: string;
  };
  expenses: {
    title: string;
    browserTitle: string;
    newExpenseTitle: string;
    lastExpensesTitle: string;
    settlementsTitle: string;
    noOpenPayments: string;
    noExpensesYet: string;
    noSettlementsYet: string;
    editButton: string;
    deleteButton: string;
    cancelButton: string;
    saveButton: string;
    noneLabel: string;
  };
  calendar: {
    title: string;
    browserTitle: string;
    newEventTitle: string;
    eventsForDay: string;
    noEventsOnDay: string;
    noFurtherEvents: string;
    noMembersLoaded: string;
    newEventOn: string;
    externalCalendarSource: string;
    householdCalendars: string;
    importedCalendars: string;
    selectedCalendars: string;
  };
  polls: {
    title: string;
    browserTitle: string;
    newPollTitle: string;
    activePollsTitle: string;
    pastPollsTitle: string;
    noPollsYet: string;
    noPastPollsYet: string;
    shareButton: string;
    createButton: string;
    questionLabel: string;
    optionLabel: string;
    addOptionButton: string;
    multipleChoiceLabel: string;
    endDateLabel: string;
    endTimeLabel: string;
    useEndDateLabel: string;
    newPollPlaceholder: string;
    shareLinkLabel: string;
  };
  profile: {
    title: string;
    browserTitle: string;
    myHouseholdsTitle: string;
    manageHouseholdTitle: string;
    createHouseholdButton: string;
    joinHouseholdButton: string;
    leaveHouseholdButton: string;
    inviteButton: string;
    inviteCopied: string;
    manageMembersTitle: string;
    createHouseholdDialogTitle: string;
    joinHouseholdDialogTitle: string;
    renameDialogTitle: string;
    householdNameLabel: string;
    householdNamePlaceholder: string;
    inviteCodeLabel: string;
    inviteCodePlaceholder: string;
    displayNameLabel: string;
    displayNamePlaceholder: string;
    saveButton: string;
    cancelButton: string;
    logoutButton: string;
    membersLoading: string;
    noMembersFound: string;
    loadMembersFailed: string;
    createFailed: string;
    joinFailed: string;
    leaveConfirmTitle: string;
    leaveConfirmMessage: string;
    removeMemberConfirmTitle: string;
    removeMemberConfirmMessage: string;
    promoteMemberConfirmTitle: string;
    demoteMemberConfirmTitle: string;
    copyInviteLinkTitle: string;
    inviteCodeText: string;
    householdsCount: string;
    removeButton: string;
    promoteButton: string;
    demoteButton: string;
    adminRole: string;
    memberRole: string;
    errorLoadedText: string;
    householdManageTitle: string;
    profileSetupTitle: string;
    externalCalendarTitle: string;
    externalCalendarMethodLabel: string;
    externalCalendarMethodUrl: string;
    externalCalendarMethodFile: string;
    externalCalendarEnabled: string;
    externalCalendarDisabled: string;
    externalCalendarName: string;
    externalCalendarDefaultName: string;
    externalCalendarUrl: string;
    externalCalendarUploadName: string;
    externalCalendarUploadNameHint: string;
    externalCalendarUploadFile: string;
    externalCalendarUploadChoose: string;
    externalCalendarUploadReplaceHint: string;
    externalCalendarUploadSubmit: string;
    externalCalendarUploadSuccess: string;
    externalCalendarUploadFailed: string;
    externalCalendarUploadNoFile: string;
    externalCalendarUploadUnsupported: string;
    externalCalendarUploadedSource: string;
    externalCalendarSave: string;
    externalCalendarSync: string;
    externalCalendarNeverSynced: string;
    externalCalendarLastUpdated: string;
    externalCalendarSaveFailed: string;
    externalCalendarLoadFailed: string;
    externalCalendarSyncFailed: string;
    externalCalendarSyncComplete: string;
    externalCalendarUrlRequired: string;
    externalCalendarNew: string;
    externalCalendarShareWithHousehold: string;
    externalCalendarSubscribedForMe: string;
    externalCalendarSharedByOwner: string;
    calendarExportTitle: string;
    calendarExportSubtitle: string;
    calendarExportHelp: string;
    calendarExportUrlLabel: string;
    calendarExportHint: string;
    calendarExportCopy: string;
    calendarExportCopied: string;
    calendarExportCopyTitle: string;
    calendarExportRotate: string;
    calendarExportRotateSuccess: string;
    calendarExportRotateFailed: string;
    calendarExportLoadFailed: string;
  };
};

function applyArgs(template: string, args?: TranslationArgs) {
  if (!args) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = args[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

export const translations: Record<LanguageCode, TranslationTree> = {
  en: {
    app: {
      brand: "OthelloCloud",
    },
    language: {
      label: "Language",
      english: "English",
      german: "German",
    },
    theme: {
      light: "Light",
      dark: "Dark",
    },
    common: {
      loading: "Loading...",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      none: "None",
      inviteCode: "Invite code",
      inviteLink: "Invite link",
      chooseHousehold: "Choose household",
      membersLoaded: "Members loaded",
      noMembersFound: "No members found.",
      noItems: "No open items.",
      noCompletedItems: "Nothing completed yet.",
      noExpenses: "No expenses yet.",
      noOpenPayments: "No open payments.",
      noSettlements: "No settlements yet.",
      noPolls: "No polls yet.",
      noPastPolls: "No past polls yet.",
      noEvents: "No events yet.",
      noEventsOnDay: "No events on this day.",
      noFurtherEvents: "No further events",
      loadingHousehold: "Loading household...",
      loadingMembers: "Loading members...",
      loadingPolls: "Loading polls...",
      loadingExpenses: "Loading expenses...",
      loadingCalendar: "Loading calendar...",
      loadingProfile: "Loading profile...",
      noAccountYet: "No account yet? Sign up",
      alreadyHaveAccount: "Already have an account? Log in",
      yes: "Yes",
      no: "No",
    },
    tabs: {
      shopping: "Shopping",
      expenses: "Expenses",
      calendar: "Calendar",
      polls: "Polls",
      profile: "Profile",
    },
    auth: {
      loginTitle: "Log in",
      registerTitle: "Sign up",
      loginDescription: "Sign in with your household account.",
      registerDescription: "Create a new account. Then you can create a household or join one with an invite code.",
      nameLabel: "Name",
      namePlaceholder: "e.g. Hannes",
      emailLabel: "Email",
      passwordLabel: "Password",
      loginButton: "Log in",
      registerButton: "Create account",
      loginToggle: "No account yet? Sign up",
      registerToggle: "Already have an account? Log in",
      emailRequired: "Please enter your email.",
      passwordRequired: "Please enter your password.",
      nameRequired: "Please enter your name.",
      passwordTooShort: "Please enter a password with at least 8 characters.",
      loginFailed: "Login failed.",
      registerFailed: "Registration failed.",
    },
    setup: {
      title: "Set up household",
      createHouseholdTitle: "Create household",
      joinHouseholdTitle: "Join household",
      createDescription: "Create a new household. You will automatically become an admin.",
      joinDescription: "Enter the invite code you received from a household member.",
      householdNameLabel: "Household name",
      householdNamePlaceholder: "e.g. Othello House",
      inviteCodeLabel: "Invite code",
      inviteCodePlaceholder: "e.g. ABC123",
      createButton: "Create household",
      joinButton: "Join household",
      householdNameRequired: "Please enter a household name.",
      inviteCodeRequired: "Please enter an invite code.",
      createFailed: "Household could not be created.",
      joinFailed: "Household could not be found or joined.",
    },
    shopping: {
      title: "Shopping list",
      browserTitle: "OthelloCloud - Shopping",
      newItemTitle: "New item",
      addButton: "Add",
      openItemsEmpty: "No open items.",
      doneItemsEmpty: "Nothing completed yet.",
      noItemsYet: "No items yet.",
      itemLabel: "Item",
      addItemPlaceholder: "e.g. Milk",
      completedSection: "Completed",
    },
    expenses: {
      title: "Expenses",
      browserTitle: "OthelloCloud - Expenses",
      newExpenseTitle: "New expense",
      lastExpensesTitle: "Recent expenses",
      settlementsTitle: "Settlements",
      noOpenPayments: "No open payments.",
      noExpensesYet: "No expenses yet.",
      noSettlementsYet: "No settlements yet.",
      editButton: "Edit",
      deleteButton: "Delete",
      cancelButton: "Cancel",
      saveButton: "Save",
      noneLabel: "None",
    },
    calendar: {
      title: "Calendar",
      browserTitle: "OthelloCloud - Calendar",
      newEventTitle: "New event",
      eventsForDay: "Events for this day",
      noEventsOnDay: "No events on this day.",
      noFurtherEvents: "No further events",
      noMembersLoaded: "No members loaded.",
      newEventOn: "New event on {{date}}",
      externalCalendarSource: "External calendar",
      householdCalendars: "Households",
      importedCalendars: "Imported calendars",
      selectedCalendars: "{{count}} calendars",
    },
    polls: {
      title: "Polls",
      browserTitle: "OthelloCloud - Polls",
      newPollTitle: "New poll",
      activePollsTitle: "Active polls",
      pastPollsTitle: "Past polls",
      noPollsYet: "No polls yet.",
      noPastPollsYet: "No past polls yet.",
      shareButton: "Share",
      createButton: "Create",
      questionLabel: "Question",
      optionLabel: "Option",
      addOptionButton: "Add option",
      multipleChoiceLabel: "Multiple choice",
      endDateLabel: "End date",
      endTimeLabel: "End time",
      useEndDateLabel: "Use end date",
      newPollPlaceholder: "What do you want to vote on?",
      shareLinkLabel: "Share link",
    },
    profile: {
      title: "Profile",
      browserTitle: "OthelloCloud - Profile",
      myHouseholdsTitle: "My households",
      manageHouseholdTitle: "Manage household",
      createHouseholdButton: "Create household",
      joinHouseholdButton: "Join household",
      leaveHouseholdButton: "Leave household",
      inviteButton: "Invite",
      inviteCopied: "Invite link copied",
      manageMembersTitle: "Manage members",
      createHouseholdDialogTitle: "Create household",
      joinHouseholdDialogTitle: "Join household",
      renameDialogTitle: "Rename household",
      householdNameLabel: "Household name",
      householdNamePlaceholder: "e.g. Summer House",
      inviteCodeLabel: "Invite code",
      inviteCodePlaceholder: "e.g. ABC123",
      displayNameLabel: "Display name",
      displayNamePlaceholder: "Your name",
      saveButton: "Save",
      cancelButton: "Cancel",
      logoutButton: "Log out",
      membersLoading: "Loading members...",
      noMembersFound: "No members found.",
      loadMembersFailed: "Members could not be loaded",
      createFailed: "Household could not be created",
      joinFailed: "Household could not be joined",
      leaveConfirmTitle: "Leave household",
      leaveConfirmMessage: "Do you really want to leave this household?",
      removeMemberConfirmTitle: "Remove member",
      removeMemberConfirmMessage: "Do you really want to remove {{name}} from the household?",
      promoteMemberConfirmTitle: "Promote member",
      demoteMemberConfirmTitle: "Demote member",
      copyInviteLinkTitle: "Copy invite link",
      inviteCodeText: "Invite code: {{code}}",
      householdsCount: "{{count}} households",
      removeButton: "Remove",
      promoteButton: "Promote",
      demoteButton: "Demote",
      adminRole: "Admin",
      memberRole: "Member",
      errorLoadedText: "Could not load members:",
      householdManageTitle: "Manage household",
      profileSetupTitle: "Profile",
      externalCalendarTitle: "External calendar",
      externalCalendarMethodLabel: "Import method",
      externalCalendarMethodUrl: "Subscription URL",
      externalCalendarMethodFile: ".ics file",
      externalCalendarEnabled: "Enabled",
      externalCalendarDisabled: "Disabled",
      externalCalendarName: "Calendar name",
      externalCalendarDefaultName: "External calendar",
      externalCalendarUrl: "iCal subscription URL",
      externalCalendarUploadName: "Import name",
      externalCalendarUploadNameHint: "Used to identify and replace earlier uploads.",
      externalCalendarUploadFile: "Calendar file",
      externalCalendarUploadChoose: "Choose .ics file",
      externalCalendarUploadReplaceHint: "Use the same import name again to update or replace a previous upload.",
      externalCalendarUploadSubmit: "Import .ics file",
      externalCalendarUploadSuccess: "Import complete: {{created}} created, {{updated}} updated, {{removed}} removed.",
      externalCalendarUploadFailed: "The .ics calendar file could not be imported",
      externalCalendarUploadNoFile: "Please choose a .ics file.",
      externalCalendarUploadUnsupported: "File upload is not available in this app environment yet.",
      externalCalendarUploadedSource: "Uploaded .ics import",
      externalCalendarSave: "Save settings",
      externalCalendarSync: "Check for updates",
      externalCalendarNeverSynced: "Not synchronized yet",
      externalCalendarLastUpdated: "Last successful update: {{date}}",
      externalCalendarSaveFailed: "External calendar settings could not be saved",
      externalCalendarLoadFailed: "External calendar settings could not be loaded",
      externalCalendarSyncFailed: "External calendar synchronization failed",
      externalCalendarSyncComplete: "Synchronization complete: {{created}} created, {{updated}} updated, {{removed}} removed.",
      externalCalendarUrlRequired: "Please enter an iCal subscription URL.",
      externalCalendarNew: "New imported calendar",
      externalCalendarShareWithHousehold: 'Show for all members of a household',
      externalCalendarSubscribedForMe: 'Active for me (subscribed)',
      externalCalendarSharedByOwner: 'Shared calendar (read-only)',
      calendarExportTitle: "WG calendar export",
      calendarExportSubtitle: "Subscription link for Google, Apple, or Outlook calendar",
      calendarExportHelp: "Use this private iCal link in external calendar apps to subscribe to your WG calendar.",
      calendarExportUrlLabel: "Subscription URL",
      calendarExportHint: "Anyone with this link can subscribe. Rotate it if it was shared too widely.",
      calendarExportCopy: "Copy link",
      calendarExportCopied: "Subscription link copied",
      calendarExportCopyTitle: "Copy subscription link",
      calendarExportRotate: "Generate new link",
      calendarExportRotateSuccess: "A new calendar subscription link was generated.",
      calendarExportRotateFailed: "The calendar subscription link could not be regenerated",
      calendarExportLoadFailed: "The calendar export link could not be loaded",
    },
  },
  de: {
    app: {
      brand: "OthelloCloud",
    },
    language: {
      label: "Sprache",
      english: "Englisch",
      german: "Deutsch",
    },
    theme: {
      light: "Hell",
      dark: "Dunkel",
    },
    common: {
      loading: "Lade...",
      cancel: "Abbrechen",
      save: "Speichern",
      delete: "Löschen",
      edit: "Bearbeiten",
      none: "Keine",
      inviteCode: "Invite-Code",
      inviteLink: "Invite-Link",
      chooseHousehold: "WG wählen",
      membersLoaded: "Mitglieder geladen",
      noMembersFound: "Keine Mitglieder gefunden.",
      noItems: "Keine offenen Einträge.",
      noCompletedItems: "Noch nichts erledigt.",
      noExpenses: "Noch keine Ausgaben.",
      noOpenPayments: "Keine offenen Zahlungen.",
      noSettlements: "Noch keine Ausgleichszahlungen.",
      noPolls: "Noch keine Umfragen vorhanden.",
      noPastPolls: "Noch keine vergangenen Umfragen.",
      noEvents: "Noch keine Termine.",
      noEventsOnDay: "Keine Termine an diesem Tag.",
      noFurtherEvents: "Keine weiteren Termine",
      loadingHousehold: "Lade WG...",
      loadingMembers: "Lade Mitglieder...",
      loadingPolls: "Lade Umfragen...",
      loadingExpenses: "Lade Ausgaben...",
      loadingCalendar: "Lade Kalender...",
      loadingProfile: "Lade Profil...",
      noAccountYet: "Noch keinen Account? Registrieren",
      alreadyHaveAccount: "Schon einen Account? Einloggen",
      yes: "Ja",
      no: "Nein",
    },
    tabs: {
      shopping: "Einkauf",
      expenses: "Ausgaben",
      calendar: "Kalender",
      polls: "Umfragen",
      profile: "Profil",
    },
    auth: {
      loginTitle: "Einloggen",
      registerTitle: "Registrieren",
      loginDescription: "Melde dich mit deinem WG-Account an.",
      registerDescription: "Erstelle einen neuen Account. Danach kannst du eine WG erstellen oder per Invite-Code beitreten.",
      nameLabel: "Name",
      namePlaceholder: "z.B. Hannes",
      emailLabel: "E-Mail",
      passwordLabel: "Passwort",
      loginButton: "Einloggen",
      registerButton: "Account erstellen",
      loginToggle: "Noch keinen Account? Registrieren",
      registerToggle: "Schon einen Account? Einloggen",
      emailRequired: "Bitte E-Mail eingeben.",
      passwordRequired: "Bitte Passwort eingeben.",
      nameRequired: "Bitte Namen eingeben.",
      passwordTooShort: "Bitte ein Passwort mit mindestens 8 Zeichen eingeben.",
      loginFailed: "Login fehlgeschlagen.",
      registerFailed: "Registrierung fehlgeschlagen.",
    },
    setup: {
      title: "WG einrichten",
      createHouseholdTitle: "Neue WG erstellen",
      joinHouseholdTitle: "Bestehender WG beitreten",
      createDescription: "Erstelle eine neue WG. Du wirst automatisch Admin.",
      joinDescription: "Gib den Invite-Code ein, den du von einem WG-Mitglied bekommen hast.",
      householdNameLabel: "WG-Name",
      householdNamePlaceholder: "z.B. Othello WG",
      inviteCodeLabel: "Invite-Code",
      inviteCodePlaceholder: "z.B. ABC123",
      createButton: "WG erstellen",
      joinButton: "WG beitreten",
      householdNameRequired: "Bitte WG-Namen eingeben.",
      inviteCodeRequired: "Bitte Invite-Code eingeben.",
      createFailed: "WG konnte nicht erstellt werden.",
      joinFailed: "WG konnte nicht gefunden oder nicht beigetreten werden.",
    },
    shopping: {
      title: "Einkaufsliste",
      browserTitle: "OthelloCloud - Einkauf",
      newItemTitle: "Neuer Artikel",
      addButton: "Hinzufügen",
      openItemsEmpty: "Keine offenen Einträge.",
      doneItemsEmpty: "Noch nichts erledigt.",
      noItemsYet: "Noch keine Artikel vorhanden.",
      itemLabel: "Artikel",
      addItemPlaceholder: "z.B. Milch",
      completedSection: "Erledigt",
    },
    expenses: {
      title: "Ausgaben",
      browserTitle: "OthelloCloud - Ausgaben",
      newExpenseTitle: "Neue Ausgabe",
      lastExpensesTitle: "Letzte Ausgaben",
      settlementsTitle: "Ausgleichszahlungen",
      noOpenPayments: "Keine offenen Zahlungen.",
      noExpensesYet: "Noch keine Ausgaben.",
      noSettlementsYet: "Noch keine Ausgleichszahlungen.",
      editButton: "Bearbeiten",
      deleteButton: "Löschen",
      cancelButton: "Abbrechen",
      saveButton: "Speichern",
      noneLabel: "Keine",
    },
    calendar: {
      title: "Kalender",
      browserTitle: "OthelloCloud - Kalender",
      newEventTitle: "Neuer Termin",
      eventsForDay: "Termine an diesem Tag",
      noEventsOnDay: "Keine Termine an diesem Tag.",
      noFurtherEvents: "Keine weiteren Termine",
      noMembersLoaded: "Keine Mitglieder geladen.",
      newEventOn: "Neuer Termin am {{date}}",
      externalCalendarSource: "Externer Kalender",
      householdCalendars: "WGs",
      importedCalendars: "Importierte Kalender",
      selectedCalendars: "{{count}} Kalender",
    },
    polls: {
      title: "Umfragen",
      browserTitle: "OthelloCloud - Umfragen",
      newPollTitle: "Neue Umfrage",
      activePollsTitle: "Aktive Umfragen",
      pastPollsTitle: "Vergangene Umfragen",
      noPollsYet: "Noch keine Umfragen vorhanden.",
      noPastPollsYet: "Noch keine vergangenen Umfragen.",
      shareButton: "Teilen",
      createButton: "Erstellen",
      questionLabel: "Frage",
      optionLabel: "Option",
      addOptionButton: "Option hinzufügen",
      multipleChoiceLabel: "Mehrfachauswahl",
      endDateLabel: "Enddatum",
      endTimeLabel: "Endzeit",
      useEndDateLabel: "Enddatum nutzen",
      newPollPlaceholder: "Worüber möchtest du abstimmen?",
      shareLinkLabel: "Teilen-Link",
    },
    profile: {
      title: "Profil",
      browserTitle: "OthelloCloud - Profil",
      myHouseholdsTitle: "Meine WGs",
      manageHouseholdTitle: "WG verwalten",
      createHouseholdButton: "Neue WG erstellen",
      joinHouseholdButton: "WG per Invite-Code beitreten",
      leaveHouseholdButton: "WG verlassen",
      inviteButton: "Invite",
      inviteCopied: "Invite-Link kopiert",
      manageMembersTitle: "Mitglieder verwalten",
      createHouseholdDialogTitle: "Neue WG erstellen",
      joinHouseholdDialogTitle: "WG beitreten",
      renameDialogTitle: "WG umbenennen",
      householdNameLabel: "WG-Name",
      householdNamePlaceholder: "z.B. Sommer WG",
      inviteCodeLabel: "Invite-Code",
      inviteCodePlaceholder: "z.B. ABC123",
      displayNameLabel: "Anzeigename",
      displayNamePlaceholder: "Dein Name",
      saveButton: "Speichern",
      cancelButton: "Abbrechen",
      logoutButton: "Abmelden",
      membersLoading: "Mitglieder werden geladen...",
      noMembersFound: "Noch keine Mitglieder gefunden.",
      loadMembersFailed: "Mitglieder konnten nicht geladen werden",
      createFailed: "WG konnte nicht erstellt werden",
      joinFailed: "WG konnte nicht gefunden werden",
      leaveConfirmTitle: "WG verlassen",
      leaveConfirmMessage: "Willst du diese WG wirklich verlassen?",
      removeMemberConfirmTitle: "Mitglied entfernen",
      removeMemberConfirmMessage: "Willst du {{name}} wirklich aus der WG entfernen?",
      promoteMemberConfirmTitle: "Mitglied befördern",
      demoteMemberConfirmTitle: "Mitglied herabstufen",
      copyInviteLinkTitle: "Invite-Link kopieren",
      inviteCodeText: "Invite-Code: {{code}}",
      householdsCount: "{{count}} WGs",
      removeButton: "Entfernen",
      promoteButton: "Befördern",
      demoteButton: "Herabstufen",
      adminRole: "Admin",
      memberRole: "Mitglied",
      errorLoadedText: "Mitglieder konnten nicht geladen werden:",
      householdManageTitle: "WG verwalten",
      profileSetupTitle: "Profil",
      externalCalendarTitle: "Externer Kalender",
      externalCalendarMethodLabel: "Import-Methode",
      externalCalendarMethodUrl: "Abo-URL",
      externalCalendarMethodFile: ".ics-Datei",
      externalCalendarEnabled: "Aktiviert",
      externalCalendarDisabled: "Deaktiviert",
      externalCalendarName: "Kalendername",
      externalCalendarDefaultName: "Externer Kalender",
      externalCalendarUrl: "iCal-Abonnement-URL",
      externalCalendarUploadName: "Importname",
      externalCalendarUploadNameHint: "Wird verwendet, um fruehere Uploads zu erkennen und zu ersetzen.",
      externalCalendarUploadFile: "Kalenderdatei",
      externalCalendarUploadChoose: ".ics-Datei auswaehlen",
      externalCalendarUploadReplaceHint: "Nutze denselben Importnamen erneut, um einen frueheren Upload zu aktualisieren oder zu ersetzen.",
      externalCalendarUploadSubmit: ".ics-Datei importieren",
      externalCalendarUploadSuccess: "Import abgeschlossen: {{created}} erstellt, {{updated}} aktualisiert, {{removed}} entfernt.",
      externalCalendarUploadFailed: "Die .ics-Kalenderdatei konnte nicht importiert werden",
      externalCalendarUploadNoFile: "Bitte waehle eine .ics-Datei aus.",
      externalCalendarUploadUnsupported: "Datei-Upload ist in dieser App-Umgebung noch nicht verfuegbar.",
      externalCalendarUploadedSource: "Hochgeladener .ics-Import",
      externalCalendarSave: "Einstellungen speichern",
      externalCalendarSync: "Nach Updates suchen",
      externalCalendarNeverSynced: "Noch nicht synchronisiert",
      externalCalendarLastUpdated: "Letzte erfolgreiche Aktualisierung: {{date}}",
      externalCalendarSaveFailed: "Die Einstellungen des externen Kalenders konnten nicht gespeichert werden",
      externalCalendarLoadFailed: "Die Einstellungen des externen Kalenders konnten nicht geladen werden",
      externalCalendarSyncFailed: "Die Synchronisierung des externen Kalenders ist fehlgeschlagen",
      externalCalendarSyncComplete: "Synchronisierung abgeschlossen: {{created}} erstellt, {{updated}} aktualisiert, {{removed}} entfernt.",
      externalCalendarUrlRequired: "Bitte eine iCal-Abonnement-URL eingeben.",
      externalCalendarNew: "Neuer importierter Kalender",
      externalCalendarShareWithHousehold: 'Für alle Mitglieder einer WG anzeigen',
      externalCalendarSubscribedForMe: 'Aktiv für mich (abonniert)',
      externalCalendarSharedByOwner: 'Freigegebener Kalender (schreibgeschützt)',
      calendarExportTitle: "WG-Kalender exportieren",
      calendarExportSubtitle: "Abo-Link für Google-, Apple- oder Outlook-Kalender",
      calendarExportHelp: "Nutze diesen privaten iCal-Link in externen Kalender-Apps, um den WG-Kalender zu abonnieren.",
      calendarExportUrlLabel: "Abonnement-URL",
      calendarExportHint: "Jede Person mit diesem Link kann den Kalender abonnieren. Erzeuge einen neuen Link, falls er zu weit geteilt wurde.",
      calendarExportCopy: "Link kopieren",
      calendarExportCopied: "Abonnement-Link kopiert",
      calendarExportCopyTitle: "Abonnement-Link kopieren",
      calendarExportRotate: "Neuen Link erzeugen",
      calendarExportRotateSuccess: "Ein neuer Kalender-Abonnement-Link wurde erzeugt.",
      calendarExportRotateFailed: "Der Kalender-Abonnement-Link konnte nicht neu erzeugt werden",
      calendarExportLoadFailed: "Der Kalender-Export-Link konnte nicht geladen werden",
    },
  },
};

export function translate(
  language: LanguageCode,
  key: string,
  args?: TranslationArgs
) {
  const segments = key.split(".");
  let current: any = translations[language];

  for (const segment of segments) {
    current = current?.[segment];
    if (current === undefined || current === null) {
      break;
    }
  }

  const fallback = segments.reduce<any>((value, segment) => value?.[segment], translations.en);
  const value = typeof current === "string" ? current : typeof fallback === "string" ? fallback : key;
  return applyArgs(value, args);
}
