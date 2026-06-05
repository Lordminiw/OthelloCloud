/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const subscriptions = app.findCollectionByNameOrId("calendar_subscriptions")
  const collection = new Collection({
    type: "base",
    name: "calendar_subscription_unsubscribes",
    listRule: '@request.auth.id != "" && user = @request.auth.id',
    viewRule: '@request.auth.id != "" && user = @request.auth.id',
    createRule: '@request.auth.id != "" && user = @request.auth.id',
    updateRule: '@request.auth.id != "" && user = @request.auth.id',
    deleteRule: '@request.auth.id != "" && user = @request.auth.id',
    fields: [
      {
        name: "user",
        type: "relation",
        required: true,
        maxSelect: 1,
        collectionId: "_pb_users_auth_",
        cascadeDelete: true,
      },
      {
        name: "subscription",
        type: "relation",
        required: true,
        maxSelect: 1,
        collectionId: subscriptions.id,
        cascadeDelete: true,
      },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_calendar_subscription_unsubscribes_user_sub ON calendar_subscription_unsubscribes (user, subscription)",
    ],
  })

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("calendar_subscription_unsubscribes")
  app.delete(collection)
})
