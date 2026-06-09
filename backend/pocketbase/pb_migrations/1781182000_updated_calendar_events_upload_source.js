/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const events = app.findCollectionByNameOrId("calendar_events")
  const sourceField = events.fields.getByName("source")

  sourceField.values = ["manual", "ical", "upload"]
  events.listRule = '@request.auth.id != "" && (((source = "manual" || source = "upload") && household.household_members_via_household.user ?= @request.auth.id) || (source = "ical" && subscription.enabled = true && (subscription.owner = @request.auth.id || (subscription.sharedWithHousehold = true && subscription.household.household_members_via_household.user ?= @request.auth.id))))'
  events.viewRule = events.listRule
  app.save(events)
}, (app) => {
  const events = app.findCollectionByNameOrId("calendar_events")
  const sourceField = events.fields.getByName("source")

  sourceField.values = ["manual", "ical"]
  events.listRule = '@request.auth.id != "" && ((source != "ical" && household.household_members_via_household.user ?= @request.auth.id) || (source = "ical" && subscription.enabled = true && (subscription.owner = @request.auth.id || (subscription.sharedWithHousehold = true && subscription.household.household_members_via_household.user ?= @request.auth.id))))'
  events.viewRule = events.listRule
  app.save(events)
})
