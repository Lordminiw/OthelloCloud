/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  app.db().newQuery(`
    UPDATE households
    SET calendarExportToken = lower(hex(randomblob(24)))
    WHERE calendarExportToken = ''
  `).execute()
}, (app) => {
  app.db().newQuery(`
    UPDATE households
    SET calendarExportToken = ''
  `).execute()
})
