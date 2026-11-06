/**
 * Fashion Week TLV 2026 · shuttle registration
 * Paste into Extensions → Apps Script of the registration Google Sheet,
 * then Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 */
const SHEET_NAME = 'הרשמות';
const HEADERS = ['תאריך הרשמה', 'שם פרטי', 'שם משפחה', 'תעודת זהות', 'טלפון', 'כיתה'];
const CLASSES = ['י1', 'י2', 'י3', 'י4', 'י5', 'י6'];

function getSheet_() {
  const ss = SpreadsheetApp.openById('1SRAFAGCxLjkL575M2STZ4oLxvGazxblMc-9upPQdiPg');
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange('D:E').setNumberFormat('@'); // keep leading zeros
    sh.setRightToLeft(true);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function validId_(id) {
  if (!/^\d{9}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(id[i]) * ((i % 2) + 1);
    sum += n > 9 ? n - 9 : n;
  }
  return sum % 10 === 0;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    const first = String(d.firstName || '').trim().slice(0, 40);
    const last = String(d.lastName || '').trim().slice(0, 40);
    const id = String(d.idNumber || '').trim().padStart(9, '0');
    const phone = String(d.phone || '').replace(/\D/g, '');
    const cls = String(d.classRoom || '');
    if (!first || !last || !validId_(id) || !/^05\d{8}$/.test(phone) || CLASSES.indexOf(cls) < 0) {
      return json_({ ok: false, error: 'invalid' });
    }
    const sh = getSheet_();
    const row = [new Date(), first, last, id, phone, cls];
    const last_ = sh.getLastRow();
    if (last_ > 1) {
      const ids = sh.getRange(2, 4, last_ - 1, 1).getDisplayValues().map(r => r[0]);
      const idx = ids.indexOf(id);
      if (idx >= 0) { // same student registered again: update her row
        sh.getRange(idx + 2, 1, 1, row.length).setValues([row]);
        return json_({ ok: true, duplicate: true });
      }
    }
    sh.appendRow(row);
    sh.getRange(sh.getLastRow(), 1, 1, row.length).setHorizontalAlignment('center');
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, service: 'fashion-week-shuttle' });
}
