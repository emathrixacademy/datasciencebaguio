/**
 * DICT Seminar — Attendance receiver (Google Apps Script)
 *
 * SETUP
 * 1. Create a Google Sheet (this will hold attendance). Copy its Sheet ID from the URL.
 * 2. Go to script.google.com -> New Project. Paste this code.
 * 3. Replace YOUR_SHEET_ID_HERE below with your Sheet ID. Save.
 * 4. Deploy -> New deployment -> Web app:
 *      Execute as: Me
 *      Who has access: Anyone
 *    Deploy, authorize, and COPY the Web App URL (ends with /exec).
 * 5. Paste that URL into index.html as ATTENDANCE_ENDPOINT.
 *
 * The site posts JSON; this appends one row per sign-in.
 */

const SHEET_ID = 'YOUR_SHEET_ID_HERE';
const SHEET_NAME = 'Sheet1';

function doPost(e) {
  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); }
      catch (err) { data = e.parameter || {}; }
    } else {
      data = (e && e.parameter) || {};
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    // Create header row on first write
    if (sheet.getLastRow() === 0) {
      const headers = ['ServerTime', 'FullName', 'Email', 'Contact',
                       'ClientTimestamp', 'Date', 'Time',
                       'IP', 'City', 'Region', 'Country', 'UserAgent'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
           .setFontWeight('bold').setBackground('#0b69a3').setFontColor('#ffffff');
    }

    sheet.appendRow([
      new Date(),
      data.fullName || '',
      data.email || '',
      data.contact || '',
      data.timestamp || '',
      data.date || '',
      data.time || '',
      data.ip || '',
      data.city || '',
      data.region || '',
      data.country || '',
      data.userAgent || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput('DICT attendance endpoint is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}
