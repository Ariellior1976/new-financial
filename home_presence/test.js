// הרצה: node home_presence/test.js
const assert = require('assert');
require.extensions['.gs'] = require.extensions['.js'];
const { handleEvent, statusText, LOCK_MESSAGE } = require('./Code.gs');

const MIN = 60000;
let t = 1_000_000_000;
const s = {};

// ארבעה נכנסים: אף אחד לא מקבל הודעה
for (const who of ['abba', 'ima', 'ariel', 'lior']) {
  assert.strictEqual(handleEvent(s, who, 'arrive', (t += MIN)), '', who);
}
// החמישי נכנס: מקבל הודעת נעילה
assert.strictEqual(handleEvent(s, 'ili', 'arrive', (t += MIN)), LOCK_MESSAGE);

// אילי כבר בבית ומתחבר שוב: אין הודעה חוזרת
assert.strictEqual(handleEvent(s, 'ili', 'arrive', (t += MIN)), '');

// ליאור מתנתק לשתי דקות בלילה (אייפון בשינה) ומתחבר שוב: אין הודעה
handleEvent(s, 'lior', 'leave', (t += 60 * MIN));
assert.strictEqual(handleEvent(s, 'lior', 'arrive', (t += 2 * MIN)), '');

// ליאור יוצא באמת ואריאל מתנתק לרגע בזמן הזה: אין הודעה כי ליאור בחוץ
handleEvent(s, 'lior', 'leave', (t += MIN));
handleEvent(s, 'ariel', 'leave', (t += 30 * MIN));
assert.strictEqual(handleEvent(s, 'ariel', 'arrive', (t += MIN)), '');

// ליאור חוזר אחרי שלוש שעות, האחרון: מקבל הודעה
assert.strictEqual(handleEvent(s, 'lior', 'arrive', (t += 180 * MIN)), LOCK_MESSAGE);

// חיבור מחדש קצר שמתחיל שתי דקות אחרי יציאה של 4 דקות לא נחשב לכניסה,
// אבל חזרה אחרי 6 דקות כן
handleEvent(s, 'abba', 'leave', (t += MIN));
assert.strictEqual(handleEvent(s, 'abba', 'arrive', (t += 6 * MIN)), LOCK_MESSAGE);

console.log(statusText(s));
console.log('כל הבדיקות עברו');
