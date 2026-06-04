/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const subscriptions = new Collection({
    type: "base",
    name: "calendar_subscriptions",
    listRule: '@request.auth.id != "" && household.household_members_via_household.user ?= @request.auth.id',
    viewRule: '@request.auth.id != "" && household.household_members_via_household.user ?= @request.auth.id',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""',
    fields: [
      {
        name: "household",
        type: "relation",
        required: true,
        maxSelect: 1,
        collectionId: "pbc_2123300356",
        cascadeDelete: true,
      },
      {
        name: "name",
        type: "text",
        required: true,
        max: 200,
      },
      {
        name: "url",
        type: "url",
        required: true,
        hidden: false,
        exceptDomains: [],
        onlyDomains: [],
      },
      {
        name: "enabled",
        type: "bool",
      },
      {
        name: "lastSyncedAt",
        type: "date",
      },
      {
        name: "lastSyncStatus",
        type: "select",
        maxSelect: 1,
        values: ["success", "error"],
      },
      {
        name: "lastSyncMessage",
        type: "text",
        max: 500,
      },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_calendar_subscriptions_household ON calendar_subscriptions (household)",
    ],
  })

  app.save(subscriptions)

  const events = app.findCollectionByNameOrId("calendar_events")
  events.fields.add(new SelectField({
    name: "source",
    maxSelect: 1,
    values: ["manual", "ical"],
  }))
  events.fields.add(new TextField({
    name: "externalUid",
    max: 500,
  }))
  events.fields.add(new RelationField({
    name: "subscription",
    maxSelect: 1,
    collectionId: subscriptions.id,
    cascadeDelete: true,
  }))
  events.fields.add(new BoolField({
    name: "allDay",
  }))
  events.addIndex(
    "idx_calendar_events_subscription_uid",
    true,
    "subscription, externalUid",
    "subscription != '' AND externalUid != ''"
  )
  events.listRule = '@request.auth.id != "" && household.household_members_via_household.user ?= @request.auth.id && (source != "ical" || subscription.enabled = true)'
  events.viewRule = '@request.auth.id != "" && household.household_members_via_household.user ?= @request.auth.id && (source != "ical" || subscription.enabled = true)'

  app.save(events)

  app.db().newQuery("UPDATE calendar_events SET source = 'manual' WHERE source = ''").execute()
}, (app) => {
  const events = app.findCollectionByNameOrId("calendar_events")
  events.removeIndex("idx_calendar_events_subscription_uid")
  events.fields.removeByName("allDay")
  events.fields.removeByName("subscription")
  events.fields.removeByName("externalUid")
  events.fields.removeByName("source")
  events.listRule = '@request.auth.id != ""'
  events.viewRule = '@request.auth.id != ""'
  app.save(events)

  const subscriptions = app.findCollectionByNameOrId("calendar_subscriptions")
  app.delete(subscriptions)
})
