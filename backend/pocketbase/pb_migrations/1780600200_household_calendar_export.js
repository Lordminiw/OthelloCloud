/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const households = app.findCollectionByNameOrId("pbc_2123300356")

  households.fields.add(new TextField({
    name: "calendarExportToken",
    hidden: true,
    max: 120,
  }))

  app.save(households)
}, (app) => {
  const households = app.findCollectionByNameOrId("pbc_2123300356")
  households.fields.removeByName("calendarExportToken")
  app.save(households)
})
