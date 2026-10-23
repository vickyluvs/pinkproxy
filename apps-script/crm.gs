/**
 * The Pink Proxy CRM
 *
 * Add this as a second file (named "crm") in the same Apps Script project as
 * checklist-signup.gs, inside the spreadsheet that holds the CRM tabs.
 *
 * What it does:
 *  - Adds a "Pink Proxy CRM" menu to the spreadsheet.
 *  - "Create project from selected deal" copies the right tasks for the deal's
 *    package from Package Playbook into Project Tasks, with due dates.
 *  - Website form submissions are added to Contacts, Pipeline and Activity Log
 *    (called from checklist-signup.gs).
 *  - A weekday-morning email lists what is due or overdue.
 *
 * It never stores client security findings. Those stay in each client's
 * Delivery Workbook.
 */

const CRM = {
  DIGEST_TO: '',          // leave '' to email the account running the script
  DIGEST_HOUR: 7,         // hour of the morning email (spreadsheet time zone)
  FOLLOW_UP_DAYS: 2,      // business days before a new discovery-form lead needs a follow-up
  SHEETS: {
    contacts: 'Contacts', pipeline: 'Pipeline', projects: 'Projects',
    tasks: 'Project Tasks', playbook: 'Package Playbook', activity: 'Activity Log'
  },
  // 1-based column numbers. They match the CRM spreadsheet; change both together.
  C: { id: 1, business: 2, owner: 3, email: 4, trade: 6, team: 7, source: 9, newsletter: 11, added: 12, notes: 15 },
  P: { id: 1, contact: 2, business: 3, pkg: 4, stage: 11, stageDate: 12, next: 13, nextDue: 14, kickoff: 15, outcome: 19, credit: 21 },
  J: { id: 1, completed: 18, recheck: 19, recheckDone: 20, creditUntil: 23 },
  T: { deal: 1, step: 3, phase: 4, task: 5, doc: 6, status: 7, due: 8 },
  B: { step: 1, phase: 2, task: 3, doc: 4, jump: 5, shield: 6, conc: 7, jDays: 8, sDays: 9 },
  A: { date: 1, contact: 2, type: 4, summary: 5, next: 6 },
  PACKAGES: ['Security Jumpstart', 'Digital Shield', 'Pink Proxy Concierge']
};

/* ------------------------------------------------------------------ menu */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Pink Proxy CRM')
    .addItem('Create project from selected deal', 'crmCreateProjectFromSelection')
    .addSeparator()
    .addItem('Email me today\'s follow-ups now', 'crmDailyDigest')
    .addItem('Turn on daily follow-up email', 'crmInstallDailyEmail')
    .addItem('Turn off daily follow-up email', 'crmRemoveDailyEmail')
    .addToUi();
}

/* ------------------------------------------------- create project + tasks */

function crmCreateProjectFromSelection() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  if (sheet.getName() !== CRM.SHEETS.pipeline) {
    ui.alert('Go to the Pipeline tab, click any cell in the deal\'s row, then try again.');
    return;
  }
  const row = sheet.getActiveRange().getRow();
  if (row < 2) { ui.alert('Click a deal row, not the header.'); return; }

  const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const dealId = String(values[CRM.P.id - 1] || '').trim();
  const pkg = String(values[CRM.P.pkg - 1] || '').trim();
  const kickoff = values[CRM.P.kickoff - 1];
  const business = values[CRM.P.business - 1];

  if (!dealId) { ui.alert('This row has no Deal ID.'); return; }
  if (CRM.PACKAGES.indexOf(pkg) < 0) { ui.alert('Choose the package for ' + dealId + ' first.'); return; }

  const projects = ss.getSheetByName(CRM.SHEETS.projects);
  if (columnValues_(projects, CRM.J.id).indexOf(dealId) >= 0) {
    ui.alert(dealId + ' already has a project. Its tasks are on Project Tasks.');
    return;
  }
  if (!(kickoff instanceof Date)) {
    const go = ui.alert('No kickoff date yet',
      'Tasks will be created without due dates. Add the Kickoff date on Pipeline first if you want them. Continue anyway?',
      ui.ButtonSet.YES_NO);
    if (go !== ui.Button.YES) return;
  }

  // Project row (other columns are formulas)
  projects.getRange(firstEmptyRow_(projects, CRM.J.id), CRM.J.id).setValue(dealId);

  // Tasks from the playbook
  const playbook = ss.getSheetByName(CRM.SHEETS.playbook);
  const pb = playbook.getRange(2, 1, Math.max(playbook.getLastRow() - 1, 1), 9).getValues();
  const flagCol = pkg === 'Security Jumpstart' ? CRM.B.jump : pkg === 'Digital Shield' ? CRM.B.shield : CRM.B.conc;
  const daysCol = pkg === 'Security Jumpstart' ? CRM.B.jDays : CRM.B.sDays;

  const tasks = ss.getSheetByName(CRM.SHEETS.tasks);
  let r = firstEmptyRow_(tasks, CRM.T.deal);
  let added = 0;
  pb.forEach(function (p) {
    const flag = String(p[flagCol - 1] || '').trim();
    if (!p[CRM.B.task - 1] || (flag !== 'Yes' && flag !== 'Add-on')) return;
    const step = Number(p[CRM.B.step - 1]);
    const days = p[daysCol - 1];
    const due = (kickoff instanceof Date && days !== '' && days !== null) ? addWorkdays_(kickoff, Number(days)) : '';
    const status = flag === 'Add-on' ? 'Not in scope' : (step <= 2 ? 'Done' : 'To do');
    tasks.getRange(r, CRM.T.deal).setValue(dealId);
    tasks.getRange(r, CRM.T.step, 1, 6).setValues([[step, p[CRM.B.phase - 1], p[CRM.B.task - 1], p[CRM.B.doc - 1], status, due]]);
    r++; added++;
  });

  ui.alert('Project created for ' + (business || dealId) + ' (' + pkg + ').\n\n' + added + ' tasks added to Project Tasks.' +
    (pkg === 'Pink Proxy Concierge' ? '\n\nAdd-on tasks start as "Not in scope". Switch the ones in the proposal to "To do".' : ''));
}

/* ------------------------------------------------ website leads (called) */

/**
 * Called from checklist-signup.gs after a form is saved.
 * kind: 'checklist' or 'audit'. Does nothing if the CRM tabs aren't there.
 */
function crmAddLead_(kind, info) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const contacts = ss.getSheetByName(CRM.SHEETS.contacts);
  if (!contacts) return;
  const email = String(info.email || '').toLowerCase();
  const today = new Date();

  // Find or create the contact
  const emails = columnValues_(contacts, CRM.C.email).map(function (e) { return String(e).toLowerCase(); });
  let idx = emails.indexOf(email);
  let contactId;
  if (idx >= 0) {
    contactId = contacts.getRange(idx + 2, CRM.C.id).getValue();
    if (kind === 'audit') {
      // Fill in business details the checklist didn't collect
      const row = idx + 2;
      if (!contacts.getRange(row, CRM.C.business).getValue() && info.business) contacts.getRange(row, CRM.C.business).setValue(info.business);
      if (!contacts.getRange(row, CRM.C.team).getValue() && info.team_size) contacts.getRange(row, CRM.C.team).setValue(info.team_size);
    }
  } else {
    contactId = nextId_(contacts, CRM.C.id, 'C-');
    const row = firstEmptyRow_(contacts, CRM.C.id);
    contacts.getRange(row, CRM.C.id, 1, 4).setValues([[contactId, info.business || '', info.name || '', email]]);
    contacts.getRange(row, CRM.C.team).setValue(info.team_size || '');
    contacts.getRange(row, CRM.C.source).setValue(kind === 'audit' ? 'Website: discovery form' : 'Website: free checklist');
    contacts.getRange(row, CRM.C.newsletter).setValue(kind === 'checklist' ? 'Subscribed' : 'Not subscribed');
    contacts.getRange(row, CRM.C.added).setValue(today);
  }

  // Activity line
  const activity = ss.getSheetByName(CRM.SHEETS.activity);
  if (activity) {
    const summary = kind === 'audit'
      ? 'Discovery form sent from website; auto-reply with booking link sent. Package interest: ' + (info.package || 'Not sure yet')
      : 'Free checklist sent' + (info.score !== '' && info.score !== undefined ? ' (score ' + info.score + '/10)' : '');
    const ar = firstEmptyRow_(activity, CRM.A.date);
    activity.getRange(ar, CRM.A.date, 1, 2).setValues([[today, contactId]]);
    activity.getRange(ar, CRM.A.type, 1, 3).setValues([['Email', summary, kind === 'audit' ? 'Confirm discovery call is booked' : '']]);
  }

  // Discovery-form leads become a deal
  if (kind === 'audit') {
    const pipeline = ss.getSheetByName(CRM.SHEETS.pipeline);
    if (!pipeline) return;
    const dealId = nextId_(pipeline, CRM.P.id, 'D-');
    const pr = firstEmptyRow_(pipeline, CRM.P.id);
    const pkg = CRM.PACKAGES.indexOf(info.package) >= 0 ? info.package : 'Not sure yet';
    pipeline.getRange(pr, CRM.P.id, 1, 2).setValues([[dealId, contactId]]);
    pipeline.getRange(pr, CRM.P.pkg).setValue(pkg);
    pipeline.getRange(pr, CRM.P.stage, 1, 4).setValues([['1. New lead', today,
      'Check they booked the discovery call; follow up if not', addWorkdays_(today, CRM.FOLLOW_UP_DAYS)]]);
  }
}

/* ----------------------------------------------------- daily follow-ups */

function crmDailyDigest() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tz = ss.getSpreadsheetTimeZone();
  const today = startOfDay_(new Date());
  const fmt = function (d) { return Utilities.formatDate(d, tz, 'EEE MMM d'); };
  const sections = [];

  // Pipeline next steps due or overdue
  const pipe = ss.getSheetByName(CRM.SHEETS.pipeline);
  const pv = dataRows_(pipe, CRM.P.credit);
  const steps = pv.filter(function (r) {
    return r[CRM.P.id - 1] && r[CRM.P.outcome - 1] === 'Open' && r[CRM.P.nextDue - 1] instanceof Date && r[CRM.P.nextDue - 1] <= today;
  }).map(function (r) {
    return (r[CRM.P.business - 1] || r[CRM.P.id - 1]) + ': ' + (r[CRM.P.next - 1] || 'next step not set') +
      ' (due ' + fmt(r[CRM.P.nextDue - 1]) + ')';
  });
  if (steps.length) sections.push(['Deal follow-ups', steps]);

  // Project tasks due or overdue
  const tasks = ss.getSheetByName(CRM.SHEETS.tasks);
  const tv = dataRows_(tasks, CRM.T.due);
  const due = tv.filter(function (r) {
    const s = r[CRM.T.status - 1];
    return r[CRM.T.deal - 1] && s !== 'Done' && s !== 'Not in scope' && r[CRM.T.due - 1] instanceof Date && r[CRM.T.due - 1] <= today;
  }).map(function (r) {
    return r[1] + ' · ' + r[CRM.T.task - 1] + (r[CRM.T.status - 1] === 'Waiting on client' ? ' (waiting on client)' : '') +
      ' (due ' + fmt(r[CRM.T.due - 1]) + ')';
  });
  if (due.length) sections.push(['Project tasks', due]);

  // Re-checks and upgrade offers
  const proj = ss.getSheetByName(CRM.SHEETS.projects);
  const jv = dataRows_(proj, CRM.J.creditUntil);
  const soon = function (d, days) { return d instanceof Date && d >= today && (d - today) / 86400000 <= days; };
  const rechecks = jv.filter(function (r) { return r[0] && !r[CRM.J.recheckDone - 1] && soon(r[CRM.J.recheck - 1], 7); })
    .map(function (r) { return r[1] + ': 90-day re-check due ' + fmt(r[CRM.J.recheck - 1]) + '. Send the re-check email.'; });
  const offers = jv.filter(function (r) { return r[0] && soon(r[CRM.J.creditUntil - 1], 5); })
    .map(function (r) { return r[1] + ': Jumpstart upgrade credit (Shield or Concierge) ends ' + fmt(r[CRM.J.creditUntil - 1]) + '.'; });
  if (rechecks.length) sections.push(['Re-checks', rechecks]);
  if (offers.length) sections.push(['Upgrade offers ending soon', offers]);

  if (!sections.length) return;  // nothing due: no email

  const to = CRM.DIGEST_TO || Session.getEffectiveUser().getEmail();
  const html = '<div style="font-family:Arial,sans-serif;color:#0A192F;max-width:560px">' +
    '<h2 style="margin:0 0 4px">Today in your CRM</h2><p style="color:#5A6378;margin:0 0 16px">' + fmt(today) + '</p>' +
    sections.map(function (s) {
      return '<h3 style="margin:16px 0 6px;color:#94591F">' + s[0] + ' (' + s[1].length + ')</h3><ul style="margin:0;padding-left:18px">' +
        s[1].map(function (i) { return '<li style="margin:0 0 4px">' + escape_(i) + '</li>'; }).join('') + '</ul>';
    }).join('') +
    '<p style="margin:20px 0 0"><a href="' + ss.getUrl() + '" style="color:#94591F">Open the CRM</a></p></div>';
  const text = sections.map(function (s) { return s[0] + ':\n- ' + s[1].join('\n- '); }).join('\n\n');
  MailApp.sendEmail({ to: to, subject: 'CRM: ' + sections.reduce(function (n, s) { return n + s[1].length; }, 0) + ' things due today', body: text, htmlBody: html });
}

function crmScheduledDigest() {
  const day = new Date().getDay();
  if (day === 0 || day === 6) return;  // weekdays only
  crmDailyDigest();
}

function crmInstallDailyEmail() {
  crmRemoveDailyEmail(true);
  ScriptApp.newTrigger('crmScheduledDigest').timeBased().everyDays(1).atHour(CRM.DIGEST_HOUR).create();
  SpreadsheetApp.getUi().alert('Daily follow-up email is on. It arrives around ' + CRM.DIGEST_HOUR + ' a.m. on weekdays when something is due.');
}

function crmRemoveDailyEmail(quiet) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'crmScheduledDigest') ScriptApp.deleteTrigger(t);
  });
  if (quiet !== true) SpreadsheetApp.getUi().alert('Daily follow-up email is off.');
}

/* --------------------------------------------------------------- helpers */

function columnValues_(sheet, col) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, col, last - 1, 1).getValues().map(function (r) { return r[0]; });
}

function dataRows_(sheet, lastCol) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, lastCol).getValues();
}

/** First row (from 2) whose input column is empty. Formula columns make getLastRow() unreliable. */
function firstEmptyRow_(sheet, col) {
  const vals = columnValues_(sheet, col);
  for (let i = 0; i < vals.length; i++) if (vals[i] === '' || vals[i] === null) return i + 2;
  return vals.length + 2;
}

function nextId_(sheet, col, prefix) {
  let max = 0;
  columnValues_(sheet, col).forEach(function (v) {
    const m = String(v).match(/(\d+)\s*$/);
    if (String(v).indexOf(prefix) === 0 && m) max = Math.max(max, Number(m[1]));
  });
  return prefix + ('00' + (max + 1)).slice(-3);
}

function addWorkdays_(date, n) {
  const d = startOfDay_(date);
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) left--;
  }
  return d;
}

function startOfDay_(date) {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  return d;
}
