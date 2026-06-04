/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const subscriptions = app.findCollectionByNameOrId("calendar_subscriptions")
  subscriptions.removeIndex("idx_calendar_subscriptions_household")
  subscriptions.fields.add(new RelationField({
    name: "owner",
    required: true,
    maxSelect: 1,
    collectionId: "_pb_users_auth_",
    cascadeDelete: true,
  }))
  subscriptions.fields.add(new BoolField({
    name: "sharedWithHousehold",
  }))

  const householdField = subscriptions.fields.getByName("household")
  householdField.required = false

  subscriptions.listRule = '@request.auth.id != "" && (owner = @request.auth.id || (sharedWithHousehold = true && household.household_members_via_household.user ?= @request.auth.id))'
  subscriptions.viewRule = subscriptions.listRule
  app.save(subscriptions)

  app.db().newQuery(`
    UPDATE calendar_subscriptions
    SET owner = (
      SELECT createdBy FROM households
      WHERE households.id = calendar_subscriptions.household
    ),
    sharedWithHousehold = true
    WHERE owner = ''
  `).execute()

  const events = app.findCollectionByNameOrId("calendar_events")
  const eventHouseholdField = events.fields.getByName("household")
  eventHouseholdField.required = false
  events.listRule = '@request.auth.id != "" && ((source != "ical" && household.household_members_via_household.user ?= @request.auth.id) || (source = "ical" && subscription.enabled = true && (subscription.owner = @request.auth.id || (subscription.sharedWithHousehold = true && subscription.household.household_members_via_household.user ?= @request.auth.id))))'
  events.viewRule = events.listRule
  app.save(events)
}, (app) => {
  const events = app.findCollectionByNameOrId("calendar_events")
  events.fields.getByName("household").required = true
  events.listRule = '@request.auth.id != "" && household.household_members_via_household.user ?= @request.auth.id && (source != "ical" || subscription.enabled = true)'
  events.viewRule = events.listRule
  app.save(events)

  const subscriptions = app.findCollectionByNameOrId("calendar_subscriptions")
  subscriptions.fields.getByName("household").required = true
  subscriptions.fields.removeByName("sharedWithHousehold")
  subscriptions.fields.removeByName("owner")
  subscriptions.addIndex(
    "idx_calendar_subscriptions_household",
    true,
    "household",
    ""
  )
  subscriptions.listRule = '@request.auth.id != "" && household.household_members_via_household.user ?= @request.auth.id'
  subscriptions.viewRule = subscriptions.listRule
  app.save(subscriptions)
})
