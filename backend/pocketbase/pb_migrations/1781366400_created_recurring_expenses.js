/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const recurringExpenses = new Collection({
    type: "base",
    name: "recurring_expenses",
    listRule: '@request.auth.id != "" && household.household_members_via_household.user ?= @request.auth.id',
    viewRule: '@request.auth.id != "" && household.household_members_via_household.user ?= @request.auth.id',
    createRule: '@request.auth.id != "" && @collection.household_members:membership.user ?= @request.auth.id && @collection.household_members:membership.household ?= @request.body.household',
    updateRule: '@request.auth.id != "" && household.household_members_via_household.user ?= @request.auth.id && (@request.body.household:isset = false || @collection.household_members:membership.user ?= @request.auth.id && @collection.household_members:membership.household ?= @request.body.household)',
    deleteRule: '@request.auth.id != "" && household.household_members_via_household.user ?= @request.auth.id',
    fields: [
      {
        name: "household",
        type: "relation",
        required: true,
        maxSelect: 1,
        collectionId: "pbc_2123300356",
        cascadeDelete: false,
      },
      {
        name: "description",
        type: "text",
        required: true,
      },
      {
        name: "amount",
        type: "number",
        required: true,
      },
      {
        name: "paidBy",
        type: "relation",
        required: true,
        maxSelect: 1,
        collectionId: "_pb_users_auth_",
        cascadeDelete: false,
      },
      {
        name: "splitBetween",
        type: "relation",
        required: true,
        maxSelect: 10,
        collectionId: "_pb_users_auth_",
        cascadeDelete: false,
      },
      {
        name: "splitMode",
        type: "text",
      },
      {
        name: "splitShares",
        type: "text",
      },
      {
        name: "notes",
        type: "text",
      },
      {
        name: "startDate",
        type: "date",
        required: true,
      },
      {
        name: "intervalUnit",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["day", "week", "month", "year"],
      },
      {
        name: "intervalCount",
        type: "number",
        required: true,
        onlyInt: true,
        min: 1,
      },
      {
        name: "nextRunAt",
        type: "date",
      },
      {
        name: "lastRunAt",
        type: "date",
      },
      {
        name: "active",
        type: "bool",
        required: true,
      },
      {
        name: "createdBy",
        type: "relation",
        maxSelect: 1,
        collectionId: "_pb_users_auth_",
        cascadeDelete: false,
      },
      {
        name: "lastError",
        type: "text",
      },
      {
        name: "lastGeneratedExpense",
        type: "relation",
        maxSelect: 1,
        collectionId: "pbc_1691921218",
        cascadeDelete: false,
      },
    ],
  })

  app.save(recurringExpenses)

  const expenses = app.findCollectionByNameOrId("pbc_1691921218")
  expenses.fields.add(new RelationField({
    name: "recurringExpense",
    required: false,
    maxSelect: 1,
    minSelect: 0,
    collectionId: recurringExpenses.id,
    cascadeDelete: false,
  }))
  expenses.fields.add(new DateField({
    name: "scheduledFor",
    required: false,
  }))
  expenses.addIndex(
    "idx_expenses_recurring_occurrence",
    true,
    "recurringExpense, scheduledFor",
    "recurringExpense != '' && scheduledFor != ''"
  )

  return app.save(expenses)
}, (app) => {
  const expenses = app.findCollectionByNameOrId("pbc_1691921218")
  expenses.removeIndex("idx_expenses_recurring_occurrence")
  expenses.fields.removeByName("recurringExpense")
  expenses.fields.removeByName("scheduledFor")
  app.save(expenses)

  const recurringExpenses = app.findCollectionByNameOrId("recurring_expenses")
  return app.delete(recurringExpenses)
})
