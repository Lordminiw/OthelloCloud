function recurringExpenseError(code, message) {
  var error = new Error(message)
  error.code = code
  return error
}

var RECURRING_EXPENSE_SUPPORTED_INTERVAL_UNITS = {
  day: true,
  week: true,
  month: true,
  year: true,
}

var RECURRING_EXPENSE_SUPPORTED_SPLIT_MODES = {
  equal: true,
  amount: true,
  percent: true,
}

var RECURRING_EXPENSE_SHARE_TOLERANCE = 0.01

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

function recurringExpenseNormalizeId(value) {
  return String(value || "").trim()
}

function recurringExpenseIsSupportedIntervalUnit(value) {
  return !!RECURRING_EXPENSE_SUPPORTED_INTERVAL_UNITS[String(value || "").trim()]
}

function recurringExpenseValidateIntervalUnit(value) {
  var unit = String(value || "").trim()

  if (!recurringExpenseIsSupportedIntervalUnit(unit)) {
    throw recurringExpenseError(
      "RECURRING_EXPENSE_INVALID_SCHEDULE",
      "Recurring expense interval unit must be day, week, month, or year."
    )
  }

  return unit
}

function recurringExpenseValidateIntervalCount(value) {
  var count = Number(value || 0)

  if (!isFinite(count) || Math.floor(count) !== count || count < 1) {
    throw recurringExpenseError(
      "RECURRING_EXPENSE_INVALID_SCHEDULE",
      "Recurring expense interval count must be an integer greater than or equal to 1."
    )
  }

  return count
}

function recurringExpenseValidateDescription(value) {
  var description = String(value || "").trim()

  if (!description) {
    throw recurringExpenseError(
      "RECURRING_EXPENSE_INVALID_TEMPLATE",
      "Recurring expense description is required."
    )
  }

  return description
}

function recurringExpenseValidateAmount(value) {
  var amount = Number(value)

  if (!isFinite(amount) || amount <= 0) {
    throw recurringExpenseError(
      "RECURRING_EXPENSE_INVALID_TEMPLATE",
      "Recurring expense amount must be greater than 0."
    )
  }

  return amount
}

function recurringExpenseValidateSplitMode(value) {
  var splitMode = String(value || "").trim() || "equal"

  if (!RECURRING_EXPENSE_SUPPORTED_SPLIT_MODES[splitMode]) {
    throw recurringExpenseError(
      "RECURRING_EXPENSE_INVALID_TEMPLATE",
      "Recurring expense split mode must be equal, amount, or percent."
    )
  }

  return splitMode
}

function recurringExpenseParseSplitShares(value) {
  if (value === undefined || value === null || value === "") return {}
  if (typeof value === "object" && !Array.isArray(value)) return value

  try {
    var parsed = JSON.parse(String(value || ""))
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error("invalid")
    }
    return parsed
  } catch (_) {
    throw recurringExpenseError(
      "RECURRING_EXPENSE_INVALID_TEMPLATE",
      "Recurring expense split shares must be valid JSON."
    )
  }
}

function recurringExpenseNormalizeShareNumber(value, label) {
  var share = Number(value)

  if (!isFinite(share) || share < 0) {
    throw recurringExpenseError(
      "RECURRING_EXPENSE_INVALID_TEMPLATE",
      "Recurring expense " + label + " must contain only non-negative numbers."
    )
  }

  return share
}

function recurringExpenseRequireExpenseTemplate(input) {
  var description = recurringExpenseValidateDescription(input.description)
  var amount = recurringExpenseValidateAmount(input.amount)
  var splitBetween = Array.isArray(input.splitBetween) ? input.splitBetween.slice() : []
  var splitMode = recurringExpenseValidateSplitMode(input.splitMode)
  var splitShares = ""
  var shares = {}
  var total = 0

  if (splitBetween.length === 0) {
    throw recurringExpenseError(
      "RECURRING_EXPENSE_INVALID_TEMPLATE",
      "Recurring expense must include at least one split member."
    )
  }

  if (splitMode === "equal") {
    return {
      description: description,
      amount: amount,
      splitBetween: splitBetween,
      splitMode: splitMode,
      splitShares: "",
    }
  }

  shares = recurringExpenseParseSplitShares(input.splitShares)

  splitBetween.forEach(function (memberId) {
    if (!Object.prototype.hasOwnProperty.call(shares, memberId)) {
      throw recurringExpenseError(
        "RECURRING_EXPENSE_INVALID_TEMPLATE",
        "Recurring expense split shares must include each split member."
      )
    }

    var share = recurringExpenseNormalizeShareNumber(
      shares[memberId],
      splitMode === "amount" ? "amount split" : "percentage split"
    )
    shares[memberId] = share
    total += share
  })

  if (splitMode === "amount" && Math.abs(total - amount) >= RECURRING_EXPENSE_SHARE_TOLERANCE) {
    throw recurringExpenseError(
      "RECURRING_EXPENSE_INVALID_TEMPLATE",
      "Recurring expense amount splits must add up to the expense amount."
    )
  }

  if (splitMode === "percent" && Math.abs(total - 100) >= RECURRING_EXPENSE_SHARE_TOLERANCE) {
    throw recurringExpenseError(
      "RECURRING_EXPENSE_INVALID_TEMPLATE",
      "Recurring expense percentage splits must add up to 100."
    )
  }

  var normalizedShares = {}
  splitBetween.forEach(function (memberId) {
    normalizedShares[memberId] = shares[memberId]
  })
  splitShares = JSON.stringify(normalizedShares)

  return {
    description: description,
    amount: amount,
    splitBetween: splitBetween,
    splitMode: splitMode,
    splitShares: splitShares,
  }
}

function recurringExpenseIsHouseholdMember(app, householdId, userId) {
  var normalizedHouseholdId = recurringExpenseNormalizeId(householdId)
  var normalizedUserId = recurringExpenseNormalizeId(userId)

  if (!normalizedHouseholdId || !normalizedUserId) return false

  try {
    app.findFirstRecordByFilter(
      "household_members",
      "household = {:household} && user = {:user}",
      { household: normalizedHouseholdId, user: normalizedUserId }
    )
    return true
  } catch (_) {
    return false
  }
}

function recurringExpenseRequireHouseholdMembers(app, householdId, memberIds, label) {
  var normalizedHouseholdId = recurringExpenseNormalizeId(householdId)
  var values = Array.isArray(memberIds) ? memberIds : [memberIds]
  var seen = {}
  var normalized = []

  if (!normalizedHouseholdId) {
    throw recurringExpenseError(
      "RECURRING_EXPENSE_INVALID_HOUSEHOLD",
      "Recurring expense household is required."
    )
  }

  values.forEach(function (value) {
    var memberId = recurringExpenseNormalizeId(value)
    if (!memberId || seen[memberId]) return
    seen[memberId] = true

    if (!recurringExpenseIsHouseholdMember(app, normalizedHouseholdId, memberId)) {
      throw recurringExpenseError(
        "RECURRING_EXPENSE_INVALID_HOUSEHOLD_MEMBER",
        String(label || "Recurring expense members") +
          " must belong to the selected household."
      )
    }

    normalized.push(memberId)
  })

  return normalized
}

function recurringExpenseRequireHouseholdMember(app, householdId, memberId, label) {
  var normalizedLabel = String(label || "Recurring expense member")
  var normalizedMemberId = recurringExpenseNormalizeId(memberId)

  if (!normalizedMemberId) {
    throw recurringExpenseError(
      "RECURRING_EXPENSE_INVALID_HOUSEHOLD_MEMBER",
      normalizedLabel + " is required."
    )
  }

  return recurringExpenseRequireHouseholdMembers(
    app,
    householdId,
    [normalizedMemberId],
    normalizedLabel
  )[0]
}

function recurringExpenseRequireRuleMembers(app, input) {
  if (!app || typeof app.findFirstRecordByFilter !== "function") {
    return {
      paidBy: recurringExpenseNormalizeId(input.paidBy),
      splitBetween: Array.isArray(input.splitBetween) ? input.splitBetween.slice() : [],
    }
  }

  var householdId = recurringExpenseNormalizeId(input.householdId)
  var paidBy = recurringExpenseRequireHouseholdMember(
    app,
    householdId,
    input.paidBy,
    "Paid-by member"
  )
  var splitBetween = recurringExpenseRequireHouseholdMembers(
    app,
    householdId,
    input.splitBetween,
    "Split members"
  )

  return {
    paidBy: paidBy,
    splitBetween: splitBetween,
  }
}

function recurringExpenseRequireRecurringSchedule(input) {
  var schedule = {
    intervalUnit: recurringExpenseValidateIntervalUnit(input.intervalUnit),
    intervalCount: recurringExpenseValidateIntervalCount(input.intervalCount),
  }

  if (input && input.startDate !== undefined && input.startDate !== null && input.startDate !== "") {
    schedule.startDate = recurringExpenseToIso(input.startDate)
  }

  return schedule
}

function recurringExpenseInitialNextRunAt(input) {
  var schedule = recurringExpenseRequireRecurringSchedule(input)

  if (!schedule.startDate) {
    throw recurringExpenseError(
      "RECURRING_EXPENSE_INVALID_SCHEDULE",
      "Recurring expense has invalid startDate."
    )
  }

  return schedule.startDate
}

function recurringExpenseResumeNextRunAt(input) {
  var schedule = recurringExpenseRequireRecurringSchedule(input)
  var now = recurringExpenseToDate(input.now, "current time")
  var next = recurringExpenseInitialNextRunAt(input)

  while (recurringExpenseToDate(next, "nextRunAt").getTime() < now.getTime()) {
    next = addInterval(next, schedule.intervalUnit, schedule.intervalCount)
  }

  return next
}

function addInterval(input, unit, count) {
  var date = recurringExpenseToDate(input, "scheduled time")
  var amount = recurringExpenseValidateIntervalCount(count)
  unit = recurringExpenseValidateIntervalUnit(unit)

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
  var schedule = recurringExpenseRequireRecurringSchedule(input)
  return addInterval(
    input.previousScheduledFor,
    schedule.intervalUnit,
    schedule.intervalCount
  )
}

function collectDueOccurrences(input) {
  var runs = []
  var current = String(input.nextRunAt || "")
  var nowTime = recurringExpenseToDate(input.now, "current time").getTime()
  var limit = Math.max(0, Number(input.limit || 0))
  var schedule = recurringExpenseRequireRecurringSchedule(input)

  recurringExpenseToDate(current, "nextRunAt")

  while (current && runs.length < limit) {
    if (recurringExpenseToDate(current, "nextRunAt").getTime() > nowTime) break
    runs.push(current)
    current = addInterval(current, schedule.intervalUnit, schedule.intervalCount)
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
  recurringExpenseRequireRuleMembers(txApp, {
    householdId: record.getString("household"),
    paidBy: record.getString("paidBy"),
    splitBetween: record.getStringSlice("splitBetween"),
  })

  recurringExpenseRequireExpenseTemplate({
    description: record.getString("description"),
    amount: record.getFloat("amount"),
    splitBetween: record.getStringSlice("splitBetween"),
    splitMode: record.getString("splitMode"),
    splitShares: record.getString("splitShares"),
  })

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
  initialNextRunAt: recurringExpenseInitialNextRunAt,
  processRecurringExpense: processRecurringExpense,
  requireExpenseTemplate: recurringExpenseRequireExpenseTemplate,
  requireHouseholdMember: recurringExpenseRequireHouseholdMember,
  requireHouseholdMembers: recurringExpenseRequireHouseholdMembers,
  requireRecurringSchedule: recurringExpenseRequireRecurringSchedule,
  requireRuleMembers: recurringExpenseRequireRuleMembers,
  resumeNextRunAt: recurringExpenseResumeNextRunAt,
}
