function recurringExpenseError(code, message) {
  var error = new Error(message)
  error.code = code
  return error
}

function recurringExpenseToDate(value, label) {
  var date = value instanceof Date ? new Date(value.getTime()) : new Date(String(value || ""))

  if (isNaN(date.getTime())) {
    throw recurringExpenseError(
      "RECURRING_EXPENSE_INVALID_SCHEDULE",
      "Recurring expense has invalid " + label + "."
    )
  }

  return date
}

function recurringExpenseLastDayOfMonth(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

function recurringExpenseClampMonth(date, monthDelta) {
  var next = new Date(date.getTime())
  var day = next.getUTCDate()
  next.setUTCDate(1)
  next.setUTCMonth(next.getUTCMonth() + monthDelta)
  next.setUTCDate(Math.min(day, recurringExpenseLastDayOfMonth(next.getUTCFullYear(), next.getUTCMonth())))
  return next
}

function recurringExpenseClampYear(date, yearDelta) {
  var next = new Date(date.getTime())
  var month = next.getUTCMonth()
  var day = next.getUTCDate()
  next.setUTCDate(1)
  next.setUTCFullYear(next.getUTCFullYear() + yearDelta, month, 1)
  next.setUTCDate(Math.min(day, recurringExpenseLastDayOfMonth(next.getUTCFullYear(), month)))
  return next
}

function recurringExpenseToIso(value) {
  return recurringExpenseToDate(value, "date value").toISOString().replace("T", " ")
}

function addInterval(input, unit, count) {
  var date = recurringExpenseToDate(input, "scheduled time")
  var amount = Number(count || 0)

  if (unit === "day") {
    date.setUTCDate(date.getUTCDate() + amount)
    return recurringExpenseToIso(date)
  }

  if (unit === "week") {
    date.setUTCDate(date.getUTCDate() + amount * 7)
    return recurringExpenseToIso(date)
  }

  if (unit === "month") {
    return recurringExpenseToIso(recurringExpenseClampMonth(date, amount))
  }

  if (unit === "year") {
    return recurringExpenseToIso(recurringExpenseClampYear(date, amount))
  }

  throw new Error("Unsupported recurring interval unit: " + unit)
}

function calculateNextRunAt(input) {
  return addInterval(input.previousScheduledFor, input.intervalUnit, input.intervalCount)
}

function collectDueOccurrences(input) {
  var runs = []
  var current = String(input.nextRunAt || "")
  var nowTime = recurringExpenseToDate(input.now, "current time").getTime()
  var limit = Math.max(0, Number(input.limit || 0))

  recurringExpenseToDate(current, "nextRunAt")

  while (current && runs.length < limit) {
    if (recurringExpenseToDate(current, "nextRunAt").getTime() > nowTime) break
    runs.push(current)
    current = addInterval(current, input.intervalUnit, input.intervalCount)
  }

  return runs
}

function buildGeneratedExpenseData(rule) {
  return {
    household: rule.household,
    description: rule.description,
    amount: rule.amount,
    paidBy: rule.paidBy,
    splitBetween: Array.isArray(rule.splitBetween) ? rule.splitBetween.slice() : [],
    splitMode: rule.splitMode || "equal",
    splitShares: rule.splitShares || "",
    notes: rule.notes || "",
    recurringExpense: rule.recurringId,
    scheduledFor: rule.scheduledFor,
    createdBy: rule.createdBy || "",
  }
}

function hasGeneratedOccurrence(app, recurringId, scheduledFor) {
  var records = app.findRecordsByFilter(
    "expenses",
    "recurringExpense = {:recurringExpense} && scheduledFor = {:scheduledFor}",
    "",
    1,
    0,
    { recurringExpense: recurringId, scheduledFor: scheduledFor }
  )

  return records.length > 0
}

function processRecurringExpense(txApp, record, now, limit) {
  var dueRuns = collectDueOccurrences({
    nextRunAt: record.getString("nextRunAt"),
    now: now,
    intervalUnit: record.getString("intervalUnit"),
    intervalCount: record.getInt("intervalCount"),
    limit: limit || 12,
  })

  var generated = []
  var skippedDuplicates = 0
  var lastProcessed = ""
  var expenseCollection = null

  dueRuns.forEach(function (scheduledFor) {
    lastProcessed = scheduledFor

    if (hasGeneratedOccurrence(txApp, record.id, scheduledFor)) {
      skippedDuplicates += 1
      record.set("lastError", "")
      return
    }

    if (!expenseCollection) {
      expenseCollection = txApp.findCollectionByNameOrId("expenses")
    }

    var expense = new Record(expenseCollection)
    var data = buildGeneratedExpenseData({
      recurringId: record.id,
      scheduledFor: scheduledFor,
      household: record.getString("household"),
      description: record.getString("description"),
      amount: record.getFloat("amount"),
      paidBy: record.getString("paidBy"),
      splitBetween: record.getStringSlice("splitBetween"),
      splitMode: record.getString("splitMode"),
      splitShares: record.getString("splitShares"),
      notes: record.getString("notes"),
      createdBy: record.getString("createdBy"),
    })

    Object.keys(data).forEach(function (key) {
      expense.set(key, data[key])
    })

    txApp.save(expense)
    generated.push(scheduledFor)
    record.set("lastGeneratedExpense", expense.id)
    record.set("lastError", "")
  })

  if (lastProcessed) {
    record.set("lastRunAt", lastProcessed)
    record.set(
      "nextRunAt",
      calculateNextRunAt({
        previousScheduledFor: lastProcessed,
        intervalUnit: record.getString("intervalUnit"),
        intervalCount: record.getInt("intervalCount"),
      })
    )
    txApp.save(record)
  }

  return {
    generated: generated,
    skippedDuplicates: skippedDuplicates,
    dueRuns: dueRuns,
  }
}

module.exports = {
  addInterval: addInterval,
  calculateNextRunAt: calculateNextRunAt,
  collectDueOccurrences: collectDueOccurrences,
  buildGeneratedExpenseData: buildGeneratedExpenseData,
  hasGeneratedOccurrence: hasGeneratedOccurrence,
  processRecurringExpense: processRecurringExpense,
}
