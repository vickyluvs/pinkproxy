/** @OnlyCurrentDoc */
// ^ Limits this script to the one Google Sheet it is attached to (not all your spreadsheets).

/**
 * The Pink Proxy: 5-Minute Checklist signup
 * ------------------------------------------------------------
 * Runs in Google Apps Script, attached to a Google Sheet.
 * When someone requests the checklist on thepinkproxy.com it:
 *   1. Adds them as a row in the "Leads" tab of this Sheet
 *   2. Emails them the checklist PDF from info@thepinkproxy.com
 *   3. Sends you a short "new lead" notification
 *
 * Setup steps are in apps-script/SETUP.md in the website repo.
 */

const CONFIG = {
  // Address the checklist is sent from. Must be the Google account running
  // this script, or a "Send mail as" alias on that account.
  FROM_EMAIL: 'info@thepinkproxy.com',
  FROM_NAME: 'The Pink Proxy',

  // Where new-lead notifications go. Leave '' to turn them off.
  NOTIFY_EMAIL: 'info@thepinkproxy.com',

  // Link to the PDF on your website. This is the link people click in the email.
  PDF_URL: 'https://thepinkproxy.com/assets/pink-proxy-5-minute-checklist.pdf',

  // Where the script downloads the PDF to attach it. Uses the copy in your
  // GitHub repo because Cloudflare's bot protection blocks Google's servers
  // from downloading files off your website.
  PDF_ATTACHMENT_URL: 'https://raw.githubusercontent.com/vickyluvs/pinkproxy/main/assets/pink-proxy-5-minute-checklist.pdf',

  // Your business mailing address. US anti-spam law (CAN-SPAM) requires a
  // physical postal address in marketing emails. A PO box is fine.
  MAILING_ADDRESS: 'The Pink Proxy LLC · [YOUR MAILING ADDRESS] · Maryland, USA',

  SHEET_NAME: 'Leads',
  BOOKING_URL: 'https://thepinkproxy.com/#book'
};

/** Receives the form submission from the website. */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const data = parseBody_(e);

    // Spam trap: real visitors never fill this in.
    if (data.company_website) return json_({ success: true });

    const email = String(data.email || '').trim().toLowerCase();
    const firstName = clean_(data.first_name).split(' ')[0];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json_({ success: false, message: 'Please enter a valid email address.' });
    }

    const sheet = getSheet_();
    const isRepeat = sheet.getLastRow() > 1 &&
      sheet.getRange(2, 3, sheet.getLastRow() - 1, 1).getValues().some(function (r) { return r[0] === email; });

    sheet.appendRow([
      new Date(),
      firstName,
      email,
      data.score === undefined || data.score === '' ? '' : Number(data.score),
      clean_(data.page),
      isRepeat ? 'Repeat request' : 'New',
      'Subscribed'
    ]);

    sendChecklist_(email, firstName, data.score);
    if (CONFIG.NOTIFY_EMAIL && !isRepeat) notifyOwner_(email, firstName, data.score);

    return json_({ success: true });
  } catch (err) {
    console.error(err);
    return json_({ success: false, message: 'Server error' });
  } finally {
    lock.releaseLock();
  }
}

/** Lets you open the web app URL in a browser to confirm it's live. */
function doGet() {
  return json_({ ok: true, service: 'Pink Proxy checklist signup' });
}

/** Run this once from the editor to authorize the script and send yourself a test. */
function testSend() {
  const me = Session.getActiveUser().getEmail();
  sendChecklist_(me, 'Victoria', 7);
  console.log('Test checklist sent to ' + me);
}

// ---------------------------------------------------------------------------

function sendChecklist_(to, firstName, score) {
  const hi = firstName ? 'Hi ' + escape_(firstName) + ',' : 'Hi there,';
  const scoreLine = (score !== undefined && score !== '' && !isNaN(Number(score)))
    ? '<p style="margin:0 0 16px">You scored <b>' + Number(score) + ' out of 10</b> on the website checklist. ' + scoreMessage_(Number(score)) + '</p>'
    : '';

  const html =
    '<div style="background:#F8ECEE;padding:24px 12px;font-family:Inter,Helvetica,Arial,sans-serif;color:#0A192F">' +
    '<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden">' +
      '<div style="background:#0A192F;padding:22px 28px;font-weight:800;font-size:18px;color:#ffffff">' +
        'The <span style="color:#F2A7BB">Pink</span> Proxy</div>' +
      '<div style="padding:28px;font-size:15px;line-height:1.6">' +
        '<p style="margin:0 0 16px">' + hi + '</p>' +
        '<p style="margin:0 0 16px">Here is your copy of <b>The 5-Minute Cyber Hygiene Checklist</b>. It\'s attached as a PDF, and you can also open it here:</p>' +
        '<p style="margin:0 0 20px"><a href="' + CONFIG.PDF_URL + '" style="display:inline-block;background:#E0A96D;color:#0A192F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:999px">Open the checklist</a></p>' +
        scoreLine +
        '<p style="margin:0 0 16px">Each item includes a quick fix you can do yourself. If you\'d like a second pair of eyes, you can <a href="' + CONFIG.BOOKING_URL + '" style="color:#B9773A">book a free 20-minute discovery call</a>, or just reply to this email.</p>' +
        '<p style="margin:0">Talk soon,<br><b>Victoria Smith</b><br>Founder, The Pink Proxy</p>' +
      '</div>' +
      '<div style="padding:16px 28px;border-top:1px solid #ECD7DB;font-size:11.5px;line-height:1.5;color:#5A6378">' +
        'You\'re receiving this because you requested the checklist at thepinkproxy.com. We\'ll occasionally send practical security tips. ' +
        'To unsubscribe, reply with "unsubscribe" and we\'ll remove you.<br>' + escape_(CONFIG.MAILING_ADDRESS) +
      '</div>' +
    '</div></div>';

  const options = {
    name: CONFIG.FROM_NAME,
    htmlBody: html,
    replyTo: CONFIG.FROM_EMAIL
  };
  const from = senderOption_();
  if (from) options.from = from;

  const pdf = fetchPdf_();
  if (pdf) options.attachments = [pdf];

  GmailApp.sendEmail(
    to,
    'Your 5-Minute Cyber Hygiene Checklist',
    'Here is your checklist: ' + CONFIG.PDF_URL + '\n\nTo unsubscribe, reply "unsubscribe".\n' + CONFIG.MAILING_ADDRESS,
    options
  );
}

/** Downloads the checklist and confirms it is really a PDF before attaching it. */
function fetchPdf_() {
  try {
    const res = UrlFetchApp.fetch(CONFIG.PDF_ATTACHMENT_URL, { muteHttpExceptions: true, followRedirects: true });
    const bytes = res.getContent();
    const isPdf = res.getResponseCode() === 200 && bytes.length > 4 &&
      bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // "%PDF"
    if (!isPdf) {
      console.warn('Attachment URL did not return a PDF (HTTP ' + res.getResponseCode() + '). Sending link only.');
      return null;
    }
    return Utilities.newBlob(bytes, 'application/pdf', 'The-Pink-Proxy-5-Minute-Checklist.pdf');
  } catch (err) {
    console.warn('Could not download PDF, sending link only: ' + err);
    return null;
  }
}

function notifyOwner_(email, firstName, score) {
  MailApp.sendEmail({
    to: CONFIG.NOTIFY_EMAIL,
    subject: 'New checklist lead: ' + (firstName || email),
    body: 'Name: ' + (firstName || '(not given)') + '\nEmail: ' + email +
      '\nScore: ' + (score === undefined || score === '' ? '(not taken)' : score + '/10') +
      '\n\nAll leads: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
  });
}

function scoreMessage_(n) {
  if (n <= 4) return 'Items 1–4 on the checklist are the best place to start.';
  if (n <= 7) return 'You\'ve got good habits started; access, offboarding and email authentication are your next steps.';
  if (n <= 9) return 'That\'s a strong foundation. The checklist will help you close the last gaps.';
  return 'Excellent. Keep it up by re-checking every quarter.';
}

function senderOption_() {
  const me = (Session.getEffectiveUser().getEmail() || '').toLowerCase();
  const want = CONFIG.FROM_EMAIL.toLowerCase();
  if (!want || me === want) return '';
  const aliases = GmailApp.getAliases().map(function (a) { return a.toLowerCase(); });
  return aliases.indexOf(want) >= 0 ? CONFIG.FROM_EMAIL : '';
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(['Date', 'First name', 'Email', 'Checklist score', 'Page', 'Request', 'Status']);
    sheet.setFrozenRows(1);
    sheet.getRange('A1:G1').setFontWeight('bold');
  }
  return sheet;
}

function parseBody_(e) {
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (err) { /* fall through */ }
  }
  return (e && e.parameter) || {};
}

function clean_(v) { return String(v || '').replace(/[\r\n\t]/g, ' ').trim().slice(0, 120); }
function escape_(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
