/** @OnlyCurrentDoc */
// ^ Limits this script to the one Google Sheet it is attached to (not all your spreadsheets).

/**
 * The Pink Proxy: website automations
 * ------------------------------------------------------------
 * Runs in Google Apps Script, attached to a Google Sheet.
 *
 * Checklist signup (home page):
 *   1. Adds them as a row in the "Leads" tab of this Sheet
 *   2. Emails them the checklist PDF from info@thepinkproxy.com
 *   3. Sends you a short "new lead" notification
 *
 * Audit request (contact form on every page):
 *   1. Adds the request to the "Audit Requests" tab
 *   2. Emails the client a personalized reply from consult@thepinkproxy.com
 *      with their package details and your booking link
 *   3. Sends you the full request
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
  // Attaching a PDF from a new domain is a common spam signal. Leave false and send the link only.
  ATTACH_PDF: false,
  PDF_ATTACHMENT_URL: 'https://raw.githubusercontent.com/vickyluvs/pinkproxy/main/assets/pink-proxy-5-minute-checklist.pdf',

  // Your business mailing address. US anti-spam law (CAN-SPAM) requires a
  // physical postal address in marketing emails. A PO box is fine.
  MAILING_ADDRESS: 'The Pink Proxy · [YOUR MAILING ADDRESS]',

  SHEET_NAME: 'Leads',

  // ---- Audit requests ----
  // Address audit replies come from (your account or a "Send mail as" alias).
  CONSULT_EMAIL: 'consult@thepinkproxy.com',
  // Where full audit requests are sent. Leave '' to turn off.
  AUDIT_NOTIFY_EMAIL: 'consult@thepinkproxy.com',
  AUDIT_SHEET_NAME: 'Audit Requests',

  // Your Google Calendar booking page for the free discovery call.
  BOOKING_URL: 'https://calendar.app.google/6q6vAAoAaH3e21nY7',

  SIGNATURE_NAME: 'Victoria Smith',
  SIGNATURE_TITLE: 'Founder & Principal Consultant'
};

/** Package details used in the automatic audit reply. Keep in sync with the Services page. */
const PACKAGES = {
  'Security Jumpstart': {
    price: '$1,450 total project fee', timeline: 'an estimated 3–5 business days',
    items: ['A review of your Google Workspace users, admin roles, 2-Step Verification, account recovery and sharing settings',
            'Three priority fixes chosen from an agreed list, such as 2-Step Verification for admins or suspending a former user',
            'Plain-English findings, a record of what was changed and checked, and a 60-minute walkthrough']
  },
  'Digital Shield': {
    price: '$2,850 total project fee', timeline: 'an estimated 10–14 business days',
    items: ['Everything in the Security Jumpstart',
            '2-Step Verification rolled out and checked for everyone, plus groups and sharing settings tidied',
            'Email spoofing protection where you can grant DNS access, and a documented onboarding and offboarding checklist']
  },
  'Pink Proxy Concierge': {
    price: 'a custom quote, from $2,950', timeline: 'a schedule set in your proposal',
    items: ['Everything in the Digital Shield',
            'Additions chosen for your team, such as an account ownership register or an access-request process',
            'A team briefing with a departure scenario walkthrough, and a follow-up recheck']
  },
  'Quarterly Maintenance': {
    price: 'quoted after we talk', timeline: 'scheduled around your team',
    items: ['Scheduled reviews of who has access to your Google Workspace',
            'Help keeping access tidy as people join and leave',
            'Scoped to your team; not 24/7 monitoring']
  }
};

/** Receives the form submission from the website. */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const data = parseBody_(e);
    if (data.form === 'audit') return handleAudit_(data);

    // Spam trap: real visitors never fill this in.
    if (data.company_website) return json_({ success: true });

    const email = String(data.email || '').trim().toLowerCase();
    const rawFirst = clean_(data.first_name).split(' ')[0];
    const firstName = rawFirst ? rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1) : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json_({ success: false, message: 'Please enter a valid email address.' });
    }
    if (tooMany_('checklist', email, 3)) {
      return json_({ success: false, message: 'The checklist is already on its way. Please check your inbox.' });
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
    ? '<p style="margin:0 0 16px">You answered Yes to <b>' + Number(score) + ' of 10</b> checks on the website checklist. ' + scoreMessage_(Number(score)) + ' This is a self-check based on your answers, not a security assessment.</p>'
    : '';

  const html =
    '<div style="background:#F8ECEE;padding:24px 12px;font-family:Inter,Helvetica,Arial,sans-serif;color:#0A192F">' +
    '<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden">' +
      '<div style="background:#0A192F;padding:22px 28px;font-weight:800;font-size:18px;color:#ffffff">' +
        'The <span style="color:#F2A7BB">Pink</span> Proxy</div>' +
      '<div style="padding:28px;font-size:15px;line-height:1.6">' +
        '<p style="margin:0 0 16px">' + hi + '</p>' +
        '<p style="margin:0 0 16px">Here is your copy of <b>The 5-Minute Cyber Hygiene Checklist</b>. You can open or download it here:</p>' +
        '<p style="margin:0 0 20px"><a href="' + CONFIG.PDF_URL + '" style="display:inline-block;background:#E0A96D;color:#0A192F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:999px">Open the checklist</a></p>' +
        scoreLine +
        '<p style="margin:0 0 16px">Each item explains why it matters for your business. If you\'d like help putting things right, you can <a href="' + CONFIG.BOOKING_URL + '" style="color:#94591F">book a free 20-minute discovery call</a>, or just reply to this email.</p>' +
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
  const from = senderOption_(CONFIG.FROM_EMAIL);
  if (from) options.from = from;

  const pdf = CONFIG.ATTACH_PDF ? fetchPdf_() : null;
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

function senderOption_(address) {
  const me = (Session.getEffectiveUser().getEmail() || '').toLowerCase();
  const want = String(address || '').toLowerCase();
  if (!want || me === want) return '';
  const aliases = GmailApp.getAliases().map(function (a) { return a.toLowerCase(); });
  if (aliases.indexOf(want) >= 0) return address;
  console.warn(address + ' is not a "Send mail as" alias on this account; sending from ' + me);
  return '';
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

// ===========================================================================
// Audit requests
// ===========================================================================

/** Run from the editor to send yourself sample audit replies (one per version). */
function testAuditReply() {
  const me = Session.getActiveUser().getEmail();
  sendAuditReply_({ name: 'Victoria Smith', business: 'Test Boutique', email: me,
    package: 'Digital Shield', message: 'A contractor just left and we share one Google login.' });
  sendAuditReply_({ name: 'Victoria Smith', business: 'Test Boutique', email: me,
    package: 'Not sure yet', message: '' });
  console.log('Two sample audit replies sent to ' + me);
}


/** Simple rate limit: at most `max` submissions per email per 10 minutes. */
function tooMany_(kind, email, max) {
  const cache = CacheService.getScriptCache();
  const key = 'rl:' + kind + ':' + email;
  const n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), 600);
  return n > max;
}

function handleAudit_(data) {
  if (data.botcheck === true || data.botcheck === 'true' || data.botcheck === 'on') return json_({ success: true });

  const req = {
    name: clean_(data.name),
    business: clean_(data.business),
    email: String(data.email || '').trim().toLowerCase(),
    team_size: clean_(data.team_size),
    package: clean_(data.package) || 'Not sure yet',
    message: String(data.message || '').trim().slice(0, 2000),
    page: clean_(data.page)
  };
  if (!req.name || !req.business || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.email)) {
    return json_({ success: false, message: 'Please fill in your name, business and a valid email.' });
  }
  if (tooMany_('audit', req.email, 3)) {
    return json_({ success: false, message: 'We already have your request. Please wait a few minutes before sending another.' });
  }

  getAuditSheet_().appendRow([new Date(), req.name, req.business, req.email, req.team_size,
    req.package, req.message, req.page, 'Auto-reply sent', '']);

  sendAuditReply_(req);
  if (CONFIG.AUDIT_NOTIFY_EMAIL) notifyAudit_(req);
  return json_({ success: true });
}

function sendAuditReply_(req) {
  const first = escape_(req.name.split(' ')[0]);
  const business = escape_(req.business);
  const pkg = PACKAGES[req.package];
  const p = function (html) { return '<p style="margin:0 0 16px">' + html + '</p>'; };
  const list = function (items) {
    return '<ul style="margin:0 0 16px;padding-left:20px">' +
      items.map(function (i) { return '<li style="margin:0 0 6px">' + i + '</li>'; }).join('') + '</ul>';
  };
  const note = req.message
    ? p('You mentioned:') +
      '<div style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #E0A96D;background:#FDF7F1;color:#2B3A55;font-style:italic">' +
      escape_(req.message).replace(/\n/g, '<br>') + '</div>' +
      p('We\'ll make sure to dig into that on our call.')
    : '';

  let intro, details;
  if (pkg) {
    intro = p('Thank you for reaching out about the <b>' + escape_(req.package) + '</b> for ' + business + '.') + note +
      p('The next step is a free 20-minute discovery call. I\'ll learn how your team works and which tools hold your most important data, you can ask me anything, and together we\'ll confirm whether this package is the right fit. No prep or tech knowledge needed.');
    details = p('<b>A quick look at what\'s included</b><br>' + escape_(req.package) + ': ' + pkg.price + ', ' + pkg.timeline) + list(pkg.items) +
      p('<span style="font-size:13px;color:#5A6378">Software costs, such as a Google Workspace plan upgrade, are billed by the provider directly to you. I\'ll flag anything needed on our call.</span>');
  } else {
    intro = p('Thank you for reaching out! You\'re in the right place. Not knowing where to start is completely normal, and figuring that out together is the point of our first conversation.') + note +
      p('The next step is a free 20-minute discovery call. I\'ll learn how your team works and which tools hold your most important data, and by the end you\'ll know which package fits (if any). No pressure and no tech knowledge needed.');
    details = p('<b>For a quick overview, most teams your size start with one of these:</b>') + list([
      '<b>Security Jumpstart:</b> $1,450 total, an estimated 3–5 business days. A Google Workspace review, three agreed priority fixes and a plain-English action plan.',
      '<b>Digital Shield:</b> $2,850 total, an estimated 10–14 business days. 2-Step Verification for everyone, access and sharing tidied, email spoofing protection and an onboarding and offboarding checklist.',
      '<b>Pink Proxy Concierge:</b> custom quote, from $2,950. Everything in the Digital Shield plus additions scoped to your team.'
    ]);
  }

  const html =
    '<div style="background:#F8ECEE;padding:24px 12px;font-family:Inter,Helvetica,Arial,sans-serif;color:#0A192F">' +
    '<div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden">' +
      '<div style="background:#0A192F;padding:22px 28px;font-weight:800;font-size:18px;color:#ffffff">The <span style="color:#F2A7BB">Pink</span> Proxy</div>' +
      '<div style="padding:28px;font-size:15px;line-height:1.6">' +
        p('Hi ' + first + ',') + intro +
        '<div style="margin:4px 0 22px;padding:18px 20px;border-radius:12px;background:#0A192F;color:#ffffff">' +
          '<div style="font-weight:700;font-size:16px;margin-bottom:10px">Pick a time for your free call</div>' +
          '<a href="' + CONFIG.BOOKING_URL + '" style="display:inline-block;background:#E0A96D;color:#0A192F;font-weight:700;text-decoration:none;padding:11px 20px;border-radius:999px">Book my 20-minute call</a>' +
          '<div style="font-size:12.5px;color:#A8B4C8;margin-top:10px">Times show in your local time zone. If none work, just reply and suggest a time.</div>' +
        '</div>' +
        details +
        p('<span style="font-size:13px;color:#5A6378"><b>No payment is needed for the call.</b> If you decide to go ahead, we\'ll confirm the package, scope and payment terms in writing first. One-time projects are paid 50% upfront before work begins and 50% when the agreed work is complete. </span>') +
        p('<b>To make the call as useful as possible, it helps to have a rough list of:</b>') +
        '<ol style="margin:0 0 16px;padding-left:20px">' +
          '<li style="margin:0 0 6px">The apps your team uses day to day (email, payments, file storage, etc.)</li>' +
          '<li style="margin:0 0 6px">How many people and devices you have, including contractors</li>' +
          '<li style="margin:0 0 6px">Who manages your website domain and email setup, if you know</li>' +
        '</ol>' +
        '<div style="margin:0 0 20px;padding:12px 16px;border-radius:10px;background:#F8ECEE;font-size:14px">' +
          '<b>One important note:</b> please don\'t send me any passwords or login details by email. We\'ll handle anything sensitive together, securely, during our sessions.</div>' +
        p('Looking forward to talking,') +
        '<p style="margin:0"><b>' + escape_(CONFIG.SIGNATURE_NAME) + '</b><br>' + escape_(CONFIG.SIGNATURE_TITLE) + '<br>The Pink Proxy<br>' +
          '<a href="mailto:' + CONFIG.CONSULT_EMAIL + '" style="color:#94591F">' + CONFIG.CONSULT_EMAIL + '</a> · <a href="https://thepinkproxy.com" style="color:#94591F">thepinkproxy.com</a></p>' +
      '</div>' +
    '</div></div>';

  const text = 'Hi ' + req.name.split(' ')[0] + ',\n\nThank you for reaching out' +
    (pkg ? ' about the ' + req.package + ' for ' + req.business : '') + '. The next step is a free 20-minute discovery call.\n\n' +
    'Pick a time here: ' + CONFIG.BOOKING_URL + '\n\nNo payment is needed for the call. If you go ahead, one-time projects are paid 50% upfront before work begins and 50% when the agreed work is complete.\n\nPlease don\'t send any passwords or login details by email.\n\n' +
    CONFIG.SIGNATURE_NAME + '\n' + CONFIG.SIGNATURE_TITLE + '\nThe Pink Proxy\n' + CONFIG.CONSULT_EMAIL;

  const options = { name: CONFIG.FROM_NAME, htmlBody: html, replyTo: CONFIG.CONSULT_EMAIL };
  const from = senderOption_(CONFIG.CONSULT_EMAIL);
  if (from) options.from = from;

  GmailApp.sendEmail(req.email, 'Your free discovery call with The Pink Proxy: next steps for ' + req.business, text, options);
}

function notifyAudit_(req) {
  MailApp.sendEmail({
    to: CONFIG.AUDIT_NOTIFY_EMAIL,
    replyTo: req.email,
    subject: 'New discovery call request: ' + req.business + ' (' + req.package + ')',
    body: 'Name: ' + req.name + '\nBusiness: ' + req.business + '\nEmail: ' + req.email +
      '\nTeam size: ' + (req.team_size || '-') + '\nInterested in: ' + req.package +
      '\n\nWhat\'s on their mind:\n' + (req.message || '(nothing added)') +
      '\n\nThey were automatically sent your reply with the booking link.' +
      '\nAll requests: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
  });
}

function getAuditSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.AUDIT_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.AUDIT_SHEET_NAME);
    sheet.appendRow(['Date', 'Name', 'Business', 'Email', 'Team size', 'Package', "What's on their mind", 'Page', 'Status', 'Notes']);
    sheet.setFrozenRows(1);
    sheet.getRange('A1:J1').setFontWeight('bold');
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
