/**
 * מי בבית? שרת קטן ב-Google Apps Script.
 *
 * כל טלפון שולח לכאן הודעה כשהוא מתחבר לרשת הביתית (arrive) וכשהוא מתנתק ממנה (leave).
 * השרת שומר מי בבית. כשנכנס בן הבית החמישי, והוא האחרון שחסר, התשובה אליו היא
 * הודעת הנעילה, והטלפון שלו מציג אותה על המסך. לכל השאר התשובה ריקה.
 *
 * דוגמאות לכתובות (URL היא כתובת ה-Web App אחרי Deploy):
 *   URL?key=SECRET&who=ariel&action=arrive
 *   URL?key=SECRET&who=ariel&action=leave
 *   URL?key=SECRET&action=status
 */

const FAMILY = {
  abba: 'אבא',
  ima: 'אמא',
  ariel: 'אריאל',
  lior: 'ליאור',
  ili: 'אילי',
};

const LOCK_MESSAGE = 'כולם בבית. נעל/י גם את הבריח';

// אייפון מתנתק לפעמים מה-WiFi לכמה דקות כשהוא במצב שינה ואז מתחבר שוב.
// חזרה שמגיעה פחות מ-X דקות אחרי ההתנתקות נחשבת לחיבור מחדש ולא לכניסה הביתה,
// כדי שלא תקפוץ הודעת נעילה באמצע הלילה למי שבכלל לא יצא.
const RECONNECT_GRACE_MINUTES = 5;

function doGet(e) {
  const p = (e && e.parameter) || {};
  const secret = PropertiesService.getScriptProperties().getProperty('SECRET');
  if (!secret || p.key !== secret) return reply_('unauthorized');

  if (p.action === 'status') return reply_(statusText(loadState_()));
  if (!FAMILY[p.who]) return reply_('unknown person');
  if (p.action !== 'arrive' && p.action !== 'leave') return reply_('unknown action');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const state = loadState_();
    const answer = handleEvent(state, p.who, p.action, Date.now());
    saveState_(state);
    return reply_(answer);
  } finally {
    lock.releaseLock();
  }
}

/**
 * הלוגיקה עצמה. משנה את state ומחזירה את הטקסט שיוצג בטלפון (או מחרוזת ריקה).
 * state: { [who]: { home: boolean, since: number(ms) } }
 */
function handleEvent(state, who, action, now) {
  const prev = state[who] || { home: false, since: 0 };

  if (action === 'leave') {
    state[who] = { home: false, since: now };
    return '';
  }

  // arrive
  const wasAway = !prev.home;
  const awayMinutes = (now - prev.since) / 60000;
  const realArrival = wasAway && (prev.since === 0 || awayMinutes >= RECONNECT_GRACE_MINUTES);

  // since נשאר כמו שהיה אם האדם כבר היה בבית, או אם זה רק חיבור מחדש קצר
  state[who] = { home: true, since: realArrival ? now : prev.since };

  if (!realArrival) return '';

  const everyoneHome = Object.keys(FAMILY).every(function (id) {
    return state[id] && state[id].home;
  });
  return everyoneHome ? LOCK_MESSAGE : '';
}

function statusText(state) {
  return Object.keys(FAMILY).map(function (id) {
    const s = state[id];
    const home = s && s.home;
    return FAMILY[id] + ': ' + (home ? 'בבית' : 'בחוץ');
  }).join('\n');
}

function loadState_() {
  const raw = PropertiesService.getScriptProperties().getProperty('STATE');
  return raw ? JSON.parse(raw) : {};
}

function saveState_(state) {
  PropertiesService.getScriptProperties().setProperty('STATE', JSON.stringify(state));
}

function reply_(text) {
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.TEXT);
}

// מאפשר להריץ בדיקות ב-Node. ב-Apps Script המשתנה module לא קיים והשורה מדולגת.
if (typeof module !== 'undefined') {
  module.exports = { handleEvent, statusText, FAMILY, LOCK_MESSAGE, RECONNECT_GRACE_MINUTES };
}
