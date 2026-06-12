/// <reference path="../pb_data/types.d.ts" />

var RECURRING_EXPENSE_CRON_ID = "recurring_expenses.process_due"
var RECURRING_EXPENSE_CRON_EXPR = "* * * * *"
var RECURRING_EXPENSE_CATCH_UP_LIMIT = 12
var RECURRING_EXPENSE_DUE_BATCH_SIZE = 200

function recurringExpenseHookHelpers() {
  return require(__hooks + "/recurring_expense.js")
}

function recurringExpenseHookNowIso() {
  return new Date().toISOString().replace("T", " ")
}

function recurringExpenseHookScheduleChanged(record, original) {
  return (
    record.getString("startDate") !== original.getString("startDate") ||
    record.getString("intervalUnit") !== original.getString("intervalUnit") ||
    record.getInt("intervalCount") !== original.getInt("intervalCount")
  )
}

function recurringExpenseHookSafeMessage(error) {
  return String(error && error.message ? error.message : error).slice(0, 500)
}

function recurringExpenseHookThrowValidation(error) {
  var code = error && error.code ? String(error.code) : ""
  var message = error && error.message ? error.message : String(error)

  if (code === "RECURRING_EXPENSE_INVALID_HOUSEHOLD") {
    throw new BadRequestError(message)
  }

  if (code === "RECURRING_EXPENSE_INVALID_SCHEDULE") {
    throw new BadRequestError(message)
  }

  if (code === "RECURRING_EXPENSE_INVALID_HOUSEHOLD_MEMBER") {
    throw new BadRequestError(message)
  }

  if (code === "RECURRING_EXPENSE_INVALID_TEMPLATE") {
    throw new BadRequestError(message)
  }

  throw error
}

function recurringExpenseHookNormalizeTemplate(record) {
  var helpers = recurringExpenseHookHelpers()
  var template = helpers.requireExpenseTemplate({
    description: record.getString("description"),
    amount: record.getFloat("amount"),
    splitBetween: record.getStringSlice("splitBetween"),
    splitMode: record.getString("splitMode"),
    splitShares: record.getString("splitShares"),
  })

  record.set("description", template.description)
  record.set("amount", template.amount)
  record.set("splitMode", template.splitMode)
  record.set("splitShares", template.splitShares)
}

function recurringExpenseHookValidateMembers(app, record) {
  var helpers = recurringExpenseHookHelpers()
  var householdId = record.getString("household")
  var paidBy = helpers.requireHouseholdMember(
    app,
    householdId,
    record.getString("paidBy"),
    "Paid-by member"
  )
  var splitBetween = helpers.requireHouseholdMembers(
    app,
    householdId,
    record.getStringSlice("splitBetween"),
    "Split members"
  )

  record.set("paidBy", paidBy)
  record.set("splitBetween", splitBetween)
}

function recurringExpenseHookApplyCreateState(e) {
  var helpers = recurringExpenseHookHelpers()

  helpers.requireRecurringSchedule({
    startDate: e.record.getString("startDate"),
    intervalUnit: e.record.getString("intervalUnit"),
    intervalCount: e.record.getInt("intervalCount"),
  })
  recurringExpenseHookValidateMembers(e.app, e.record)
  recurringExpenseHookNormalizeTemplate(e.record)

  e.record.set("createdBy", e.auth.id)
  e.record.set("lastRunAt", "")
  e.record.set("lastError", "")
  e.record.set("lastGeneratedExpense", "")
  e.record.set("nextRunAt", helpers.initialNextRunAt({
    startDate: e.record.getString("startDate"),
    intervalUnit: e.record.getString("intervalUnit"),
    intervalCount: e.record.getInt("intervalCount"),
  }))
}

function recurringExpenseHookApplyUpdateState(e) {
  var helpers = recurringExpenseHookHelpers()
  var original = e.record.original()
  var active = e.record.getBool("active")
  var wasActive = original.getBool("active")
  var now = recurringExpenseHookNowIso()

  helpers.requireRecurringSchedule({
    startDate: e.record.getString("startDate"),
    intervalUnit: e.record.getString("intervalUnit"),
    intervalCount: e.record.getInt("intervalCount"),
  })
  recurringExpenseHookValidateMembers(e.app, e.record)
  recurringExpenseHookNormalizeTemplate(e.record)

  e.record.set("createdBy", original.getString("createdBy") || e.auth.id)
  e.record.set("lastRunAt", original.getString("lastRunAt"))
  e.record.set("lastError", original.getString("lastError"))
  e.record.set("lastGeneratedExpense", original.getString("lastGeneratedExpense"))
  e.record.set("nextRunAt", original.getString("nextRunAt"))

  if (!active) return

  if (!wasActive || recurringExpenseHookScheduleChanged(e.record, original) ||
      !e.record.getString("nextRunAt")) {
    e.record.set("nextRunAt", helpers.resumeNextRunAt({
      startDate: e.record.getString("startDate"),
      intervalUnit: e.record.getString("intervalUnit"),
      intervalCount: e.record.getInt("intervalCount"),
      now: now,
    }))
  }
}

function recurringExpenseHookCollectDueRules(now) {
  var offset = 0
  var allDueRules = []

  while (true) {
    var batch = $app.findRecordsByFilter(
      "recurring_expenses",
      "active = true && nextRunAt != '' && nextRunAt <= {:now}",
      "nextRunAt",
      RECURRING_EXPENSE_DUE_BATCH_SIZE,
      offset,
      { now: now }
    )

    if (!batch.length) break

    allDueRules = allDueRules.concat(batch)

    if (batch.length < RECURRING_EXPENSE_DUE_BATCH_SIZE) break
    offset += batch.length
  }

  return allDueRules
}

function recurringExpenseHookPersistCronFailure(recordId, message) {
  try {
    var rule = $app.findRecordById("recurring_expenses", recordId)
    rule.set("lastError", message)
    $app.save(rule)
  } catch (_) {}
}

cronAdd(RECURRING_EXPENSE_CRON_ID, RECURRING_EXPENSE_CRON_EXPR, () => {
  var helpers = recurringExpenseHookHelpers()
  var now = recurringExpenseHookNowIso()
  var dueRules = []

  try {
    dueRules = recurringExpenseHookCollectDueRules(now)
  } catch (error) {
    console.log("recurring expenses cron query failed:", error)
    return
  }

  dueRules.forEach(function (rule) {
    try {
      $app.runInTransaction(function (txApp) {
        var txRule = txApp.findRecordById("recurring_expenses", rule.id)

        if (!txRule.getBool("active")) return
        if (!txRule.getString("nextRunAt")) return
        if (new Date(txRule.getString("nextRunAt")).getTime() > new Date(now).getTime()) return

        helpers.processRecurringExpense(
          txApp,
          txRule,
          now,
          RECURRING_EXPENSE_CATCH_UP_LIMIT
        )
      })
    } catch (error) {
      var message = recurringExpenseHookSafeMessage(error)
      console.log("recurring expense cron failed for " + rule.id + ":", error)
      recurringExpenseHookPersistCronFailure(rule.id, message)
    }
  })
})

onRecordCreateRequest((e) => {
  try {
    recurringExpenseHookApplyCreateState(e)
  } catch (error) {
    recurringExpenseHookThrowValidation(error)
  }

  return e.next()
}, "recurring_expenses")

onRecordUpdateRequest((e) => {
  try {
    recurringExpenseHookApplyUpdateState(e)
  } catch (error) {
    recurringExpenseHookThrowValidation(error)
  }

  return e.next()
}, "recurring_expenses")
