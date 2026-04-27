// lib/taskLogic.js
// Core business logic — pure functions, no DB calls

/**
 * Returns true if the given date is a Sunday (day off).
 */
export function isSunday(date = new Date()) {
  return date.getDay() === 0;
}

/**
 * Returns true if current time is outside working hours (9am–7pm).
 */
export function isOffHours(date = new Date()) {
  const hour = date.getHours();
  console.log('Current hour:', hour);
  return hour < 9 || hour >= 19;
}

/**
 * Returns a block reason object if the app is locked right now.
 * Returns null if the app is open and usable.
 * Checked in EVERY API route and in the UI.
 */
export function getBlockReason(date = new Date()) {
  if (isSunday(date)) {
    return { code: 'SUNDAY', message: 'Today is Sunday — enjoy your day off! 🌴' };
  }
  if (isOffHours(date)) {
    const hour = date.getHours();
    if (hour < 9) {
      return { code: 'BEFORE_HOURS', message: 'App opens at 9:00 AM. Come back soon! ☀️' };
    }
    return { code: 'AFTER_HOURS', message: 'App is closed for the day. See you tomorrow at 9 AM! 🌙' };
  }
  return null;
}

/**
 * Returns the washer name (aman, anjali, bhuwan) for a given date.
 * Rotation: Monday→aman, Tuesday→anjali, Wednesday→bhuwan, Thursday→aman, Friday→anjali, Saturday→bhuwan
 */
export function getTodayWasherName(date = new Date()) {
  const dayOfWeek = date.getDay();
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
 * Returns who should fill next based on washer + fills done so far.
 */
export function getNextFillUserName(washerName, fillCount) {
  const names = ['aman', 'anjali', 'bhuwan'];
  const washerIndex = names.indexOf(washerName);
  if (washerIndex === -1) throw new Error('Unknown washer: ' + washerName);
  const nextIndex = (washerIndex + fillCount) % 3;
  return names[nextIndex];
}

/**
 * Returns true only if it is this user's turn to fill.
 */
export function validateFillTurn(userName, washerName, fillCount) {
  return getNextFillUserName(washerName, fillCount) === userName;
}

/**
 * Format date as YYYY-MM-DD in LOCAL time (not UTC).
 */
export function formatDateLocal(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

/**
 * Returns the full day name e.g. "Monday".
 */
export function getDayName(date = new Date()) {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}
