// lib/taskLogic.js
// Core business logic — pure functions, no DB calls

/**
 * Returns true if the given date is a Sunday (day off).
 */
export function isSunday(date = new Date()) {
  return date.getDay() === 0;
}

/**
 * Returns the washer name (aman, anjali, bhuwan) for a given date.
 * Rotation: Monday→aman, Tuesday→anjali, Wednesday→bhuwan, Thursday→aman, Friday→anjali, Saturday→bhuwan
 * Sunday is a day off — always call isSunday() before this.
 */
export function getTodayWasherName(date = new Date()) {
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const dayMap = {
    1: 0, // Monday    → aman
    2: 1, // Tuesday   → anjali
    3: 2, // Wednesday → bhuwan
    4: 0, // Thursday  → aman
    5: 1, // Friday    → anjali
    6: 2, // Saturday  → bhuwan
  };
  const names = ['aman', 'anjali', 'bhuwan'];
  return names[dayMap[dayOfWeek]];
}

/**
 * Given the washer name and a fill count already done today,
 * returns the name of who should fill next.
 * Rotation starts from washer and cycles: washer → next → next → ...
 */
export function getNextFillUserName(washerName, fillCount) {
  const names = ['aman', 'anjali', 'bhuwan'];
  const washerIndex = names.indexOf(washerName);
  if (washerIndex === -1) throw new Error(`Unknown washer: ${washerName}`);
  const nextIndex = (washerIndex + fillCount) % 3;
  return names[nextIndex];
}

/**
 * Validate if a given user is allowed to fill right now.
 */
export function validateFillTurn(userName, washerName, fillCount) {
  const expected = getNextFillUserName(washerName, fillCount);
  return expected === userName;
}

/**
 * Format date as YYYY-MM-DD in local time (not UTC).
 */
export function formatDateLocal(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the day name for display.
 */
export function getDayName(date = new Date()) {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}
