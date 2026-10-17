/**
 * The Pink Proxy: Google Docs branding toolkit
 *
 * Adds a "Pink Proxy" menu to a Google Doc that:
 *   - applies brand fonts and colors to headings, text, links and tables
 *   - adds a header with the logo and a footer with the tagline
 *   - inserts a branded cover page
 *   - inserts a blush "Pink Proxy tip" note box
 *   - finds every [placeholder] in the doc and lets you fill them in one form
 *   - makes a client copy in Clients/<Client name>/
 *   - brands every Google Doc in this doc's folder at once
 *
 * Setup: open a doc → Extensions → Apps Script → paste this file → Save →
 * reload the doc. The "Pink Proxy" menu appears next to Help.
 */

const BRAND = {
  navy: '#0A192F',
  pink: '#F2A7BB',
  rose: '#E0A96D',        // rose gold
  roseDeep: '#B9773A',    // rose gold that's readable on white
  blush: '#F8ECEE',
  blushLine: '#ECD7DB',
  rowTint: '#FCF6F7',
  slate: '#5A6378',
  ink: '#1F2A3D',         // body text
  white: '#FFFFFF',
  headingFont: 'Plus Jakarta Sans',
  bodyFont: 'Inter',
  logoUrl: 'https://raw.githubusercontent.com/vickyluvs/pinkproxy/main/assets/brand/pink-proxy-logo-horizontal.png',
  tagline: 'Cybersecurity guardrails for women-owned small businesses',
  website: 'thepinkproxy.com',
  email: 'consult@thepinkproxy.com',
  provider: 'Victoria Smith, doing business as The Pink Proxy',
};

// ---------------------------------------------------------------- menu

function onOpen() {
  DocumentApp.getUi()
    .createMenu('Pink Proxy')
    .addItem('Brand this document (all of the below)', 'menuBrandEverything')
    .addSeparator()
    .addItem('Apply fonts and colors', 'menuApplyStyling')
    .addItem('Add header and footer', 'menuHeaderFooter')
    .addItem('Insert cover page', 'menuCoverPage')
    .addItem('Insert tip box at cursor', 'menuNoteBox')
    .addSeparator()
    .addItem('Fill in client details…', 'showFillDialog')
    .addItem('Make a client copy…', 'makeClientCopy')
    .addSeparator()
    .addItem('Brand every doc in this folder', 'brandFolder')
    .addToUi();
}

function menuBrandEverything() {
  const doc = DocumentApp.getActiveDocument();
  insertCoverPage_(doc, true);
  applyStyling_(doc);
  addHeaderFooter_(doc);
  toast_('Branded: cover page, fonts, colors, header and footer.');
}
function menuApplyStyling() { applyStyling_(DocumentApp.getActiveDocument()); toast_('Fonts and colors applied.'); }
function menuHeaderFooter() { addHeaderFooter_(DocumentApp.getActiveDocument()); toast_('Header and footer added.'); }
function menuCoverPage() {
  const doc = DocumentApp.getActiveDocument();
  if (insertCoverPage_(doc, false)) { applyStyling_(doc); toast_('Cover page added.'); }
}
function menuNoteBox() { insertNoteBox_(); }

// ---------------------------------------------------------------- styling

function headingStyles_() {
  const A = DocumentApp.Attribute;
  const s = (font, size, color, bold, before, after, line) => {
    const o = {};
    o[A.FONT_FAMILY] = font; o[A.FONT_SIZE] = size; o[A.FOREGROUND_COLOR] = color;
    if (bold !== null) o[A.BOLD] = bold;
    o[A.SPACING_BEFORE] = before; o[A.SPACING_AFTER] = after; o[A.LINE_SPACING] = line;
    return o;
  };
  return {
    TITLE:    s(BRAND.headingFont, 28, BRAND.navy, true, 0, 4, 1.1),
    SUBTITLE: s(BRAND.bodyFont, 12, BRAND.roseDeep, false, 0, 18, 1.2),
    HEADING1: s(BRAND.headingFont, 20, BRAND.navy, true, 24, 8, 1.1),
    HEADING2: s(BRAND.headingFont, 15, BRAND.navy, true, 18, 6, 1.1),
    HEADING3: s(BRAND.headingFont, 12, BRAND.roseDeep, true, 14, 4, 1.1),
    HEADING4: s(BRAND.headingFont, 11, BRAND.slate, true, 12, 4, 1.1),
    HEADING5: s(BRAND.headingFont, 10.5, BRAND.slate, true, 10, 4, 1.1),
    HEADING6: s(BRAND.headingFont, 10.5, BRAND.slate, true, 10, 4, 1.1),
    NORMAL:   s(BRAND.bodyFont, 10.5, BRAND.ink, null, 0, 6, 1.25), // keeps your bold/italics
  };
}

function applyStyling_(doc) {
  const body = doc.getBody();
  body.setMarginTop(64).setMarginBottom(64).setMarginLeft(72).setMarginRight(72);

  // Style definitions, so new headings you add later also come out on-brand.
  const styles = headingStyles_();
  const H = DocumentApp.ParagraphHeading;
  Object.keys(styles).forEach(k => {
    try { body.setHeadingAttributes(H[k], styles[k]); } catch (e) { /* not every heading accepts every attribute */ }
  });

  // Leave the cover page's own label styling alone (its title and subtitle still follow the styles above).
  const skip = new Set();
  doc.getNamedRanges('pp-cover').forEach(nr => nr.getRange().getRangeElements().forEach(re => {
    const e = re.getElement();
    if (e.getType() === DocumentApp.ElementType.PARAGRAPH && e.asParagraph().getHeading() === H.NORMAL) skip.add(body.getChildIndex(e));
  }));

  for (let i = 0; i < body.getNumChildren(); i++) {
    if (!skip.has(i)) styleElement_(body.getChild(i), styles);
  }
}

function styleElement_(el, styles) {
  const T = DocumentApp.ElementType;
  const type = el.getType();
  if (type === T.PARAGRAPH || type === T.LIST_ITEM) {
    const key = headingKey_(el.getHeading());
    const st = styles[key] || styles.NORMAL;
    const text = el.editAsText();
    if (!el.getText().length) return;
    if (key === 'NORMAL') {
      // Change font and color only, so inline bold, italics and links survive.
      const A = DocumentApp.Attribute, para = {};
      para[A.SPACING_BEFORE] = st[A.SPACING_BEFORE]; para[A.SPACING_AFTER] = st[A.SPACING_AFTER]; para[A.LINE_SPACING] = st[A.LINE_SPACING];
      el.setAttributes(para);
      text.setFontFamily(BRAND.bodyFont).setFontSize(st[DocumentApp.Attribute.FONT_SIZE]);
      recolor_(text, BRAND.ink);
    } else {
      el.setAttributes(st);
      recolor_(text, st[DocumentApp.Attribute.FOREGROUND_COLOR]);
    }
  } else if (type === T.TABLE) {
    styleTable_(el.asTable());
  }
}

function headingKey_(h) {
  const H = DocumentApp.ParagraphHeading;
  const map = [[H.TITLE, 'TITLE'], [H.SUBTITLE, 'SUBTITLE'], [H.HEADING1, 'HEADING1'], [H.HEADING2, 'HEADING2'],
               [H.HEADING3, 'HEADING3'], [H.HEADING4, 'HEADING4'], [H.HEADING5, 'HEADING5'], [H.HEADING6, 'HEADING6']];
  for (const [v, k] of map) if (h === v) return k;
  return 'NORMAL';
}

// Colors text, but keeps links in rose gold and underlined.
function recolor_(text, color) {
  const len = text.getText().length;
  if (!len) return;
  const idx = text.getTextAttributeIndices();
  for (let i = 0; i < idx.length; i++) {
    const start = idx[i];
    const end = (i + 1 < idx.length ? idx[i + 1] : len) - 1;
    if (end < start) continue;
    if (text.getLinkUrl(start)) text.setForegroundColor(start, end, BRAND.roseDeep).setUnderline(start, end, true);
    else text.setForegroundColor(start, end, color);
  }
}

function styleTable_(table) {
  if (table.getNumRows() === 1 && table.getRow(0).getNumCells() === 1) { styleNoteBox_(table); return; }
  table.setBorderColor(BRAND.blushLine).setBorderWidth(1);
  for (let r = 0; r < table.getNumRows(); r++) {
    const row = table.getRow(r);
    for (let c = 0; c < row.getNumCells(); c++) {
      const cell = row.getCell(c);
      cell.setPaddingTop(5).setPaddingBottom(5).setPaddingLeft(8).setPaddingRight(8);
      const text = cell.editAsText();
      if (!text.getText().length) { cell.setBackgroundColor(r === 0 ? BRAND.navy : (r % 2 ? BRAND.white : BRAND.rowTint)); continue; }
      text.setFontSize(9.5);
      if (r === 0) {
        cell.setBackgroundColor(BRAND.navy);
        text.setFontFamily(BRAND.headingFont).setForegroundColor(BRAND.white).setBold(true);
      } else {
        cell.setBackgroundColor(r % 2 ? BRAND.white : BRAND.rowTint);
        text.setFontFamily(BRAND.bodyFont);
        recolor_(text, BRAND.ink);
      }
    }
  }
}

// ---------------------------------------------------------------- header and footer

function addHeaderFooter_(doc, clientName) {
  const client = clientName || PropertiesService.getDocumentProperties().getProperty('clientName') || '';

  const header = doc.getHeader() || doc.addHeader();
  header.clear();
  let hp = header.getParagraphs()[0] || header.appendParagraph('');
  const logo = fetchImage_(BRAND.logoUrl);
  if (logo) {
    scaleImage_(hp.appendInlineImage(logo), 140);
  } else {
    hp.appendText('The Pink Proxy').setFontFamily(BRAND.headingFont).setBold(true).setForegroundColor(BRAND.navy);
  }
  hp.setSpacingAfter(6);

  const footer = doc.getFooter() || doc.addFooter();
  footer.clear();
  const f1 = footer.getParagraphs()[0] || footer.appendParagraph('');
  f1.setText(`The Pink Proxy  ·  ${BRAND.tagline}  ·  ${BRAND.website}`);
  const f2 = footer.appendParagraph(client ? `Confidential  ·  Prepared for ${client}` : 'Confidential');
  [f1, f2].forEach(p => {
    p.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setSpacingBefore(0).setSpacingAfter(0);
    p.editAsText().setFontFamily(BRAND.bodyFont).setFontSize(8).setForegroundColor(BRAND.slate).setBold(false);
  });
  f2.editAsText().setForegroundColor(BRAND.roseDeep);
}

// ---------------------------------------------------------------- cover page

function insertCoverPage_(doc, quiet) {
  if (doc.getNamedRanges('pp-cover').length) {
    if (!quiet) DocumentApp.getUi().alert('This document already has a Pink Proxy cover page.');
    return false;
  }
  const body = doc.getBody();
  const H = DocumentApp.ParagraphHeading;
  const els = [];
  let i = 0;

  const top = body.insertParagraph(i++, '');
  top.setSpacingBefore(110);
  const logo = fetchImage_(BRAND.logoUrl);
  if (logo) scaleImage_(top.appendInlineImage(logo), 230);
  els.push(top);

  const title = body.insertParagraph(i++, doc.getName().replace(/\s*\b(template|draft)\b\s*/ig, ' ').trim());
  title.setHeading(H.TITLE).setSpacingBefore(48); els.push(title);
  els.push(body.insertParagraph(i++, BRAND.tagline).setHeading(H.SUBTITLE));

  const details = [
    ['Prepared for', '[Client business name]'],
    ['Prepared by', BRAND.provider],
    ['Date', '[Date]'],
    ['Contact', BRAND.email],
  ];
  details.forEach(([label, value], n) => {
    const p = body.insertParagraph(i++, `${label}:  ${value}`);
    p.setSpacingBefore(n === 0 ? 36 : 0).setSpacingAfter(4);
    p.editAsText().setFontFamily(BRAND.bodyFont).setFontSize(11).setForegroundColor(BRAND.ink)
      .setBold(0, label.length, true).setForegroundColor(0, label.length, BRAND.roseDeep);
    els.push(p);
  });

  const note = body.insertParagraph(i++, 'Confidential. Prepared for the named client only.');
  note.setSpacingBefore(60);
  note.editAsText().setFontFamily(BRAND.bodyFont).setFontSize(8.5).setForegroundColor(BRAND.slate).setItalic(true);
  els.push(note);

  const pb = body.insertParagraph(i++, '');
  pb.appendPageBreak();
  els.push(pb);

  const rb = doc.newRange();
  els.forEach(e => rb.addElement(e));
  doc.addNamedRange('pp-cover', rb.build());
  return true;
}

// ---------------------------------------------------------------- tip box

function insertNoteBox_() {
  const doc = DocumentApp.getActiveDocument();
  const cursor = doc.getCursor();
  if (!cursor) { DocumentApp.getUi().alert('Click in the document where you want the tip box, then try again.'); return; }
  const body = doc.getBody();
  let el = cursor.getElement();
  while (el.getParent() && el.getParent().getType() !== DocumentApp.ElementType.BODY_SECTION) el = el.getParent();
  if (el.getParent() === null || el.getParent().getType() !== DocumentApp.ElementType.BODY_SECTION) {
    DocumentApp.getUi().alert('Put your cursor in a normal paragraph (not in a table, header or footer), then try again.');
    return;
  }
  const t = body.insertTable(body.getChildIndex(el) + 1, [['Pink Proxy tip:  Write your note here.']]);
  styleNoteBox_(t);
}

function styleNoteBox_(table) {
  table.setBorderColor(BRAND.rose).setBorderWidth(1.5);
  const cell = table.getRow(0).getCell(0);
  cell.setBackgroundColor(BRAND.blush).setPaddingTop(10).setPaddingBottom(10).setPaddingLeft(14).setPaddingRight(14);
  const text = cell.editAsText();
  text.setFontFamily(BRAND.bodyFont).setFontSize(10).setForegroundColor(BRAND.navy).setBold(false);
  const m = text.getText().match(/^[^:]{1,40}:/);
  if (m) text.setBold(0, m[0].length - 1, true).setForegroundColor(0, m[0].length - 1, BRAND.roseDeep);
}

// ---------------------------------------------------------------- fill in client details

function findPlaceholders_(doc) {
  const parts = [doc.getBody(), doc.getHeader(), doc.getFooter()].filter(Boolean);
  const found = new Set();
  const re = /\[[^\[\]\n]{2,60}\]|\{\{[^{}\n]{2,40}\}\}/g;
  parts.forEach(p => { (p.getText().match(re) || []).forEach(m => found.add(m)); });
  return Array.from(found);
}

function guessValue_(ph) {
  const p = ph.toLowerCase();
  const props = PropertiesService.getDocumentProperties();
  const tz = Session.getScriptTimeZone();
  if (/date/.test(p) && !/due|end|start|renew|next/.test(p)) return Utilities.formatDate(new Date(), tz, 'MMMM d, yyyy');
  if (/(client|business|company).*(name)|business name|client\]|\{\{client\}\}/.test(p)) return props.getProperty('clientName') || '';
  if (/provider|consultant name|your name/.test(p)) return BRAND.provider;
  return '';
}

function showFillDialog() {
  const doc = DocumentApp.getActiveDocument();
  const items = findPlaceholders_(doc);
  if (!items.length) { DocumentApp.getUi().alert('No [placeholders] found in this document.'); return; }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const rows = items.map((ph, n) => `
    <label for="f${n}">${esc(ph)}</label>
    <input id="f${n}" data-key="${esc(ph)}" value="${esc(guessValue_(ph))}" placeholder="Leave blank to keep">`).join('');
  const html = `
  <style>
    body{font-family:Inter,Arial,sans-serif;color:${BRAND.navy};margin:0;padding:16px}
    h2{font-size:15px;margin:0 0 4px} p{font-size:12px;color:${BRAND.slate};margin:0 0 14px}
    label{display:block;font-size:11px;font-weight:600;color:${BRAND.roseDeep};margin:10px 0 3px}
    input{width:100%;box-sizing:border-box;padding:7px 9px;border:1px solid ${BRAND.blushLine};border-radius:6px;font-size:13px}
    input:focus{outline:2px solid ${BRAND.rose};border-color:${BRAND.rose}}
    .bar{position:sticky;bottom:0;background:#fff;padding-top:14px;display:flex;gap:8px}
    button{flex:1;padding:9px;border-radius:999px;border:0;font-weight:700;cursor:pointer}
    .go{background:${BRAND.rose};color:${BRAND.navy}} .no{background:${BRAND.blush};color:${BRAND.navy}}
    #msg{font-size:12px;color:${BRAND.roseDeep};margin-top:8px}
  </style>
  <h2>Fill in client details</h2>
  <p>Every [placeholder] in this document is listed below. Fill in what you know; blanks stay as they are.</p>
  ${rows}
  <div class="bar"><button class="no" onclick="google.script.host.close()">Cancel</button>
  <button class="go" id="go" onclick="save()">Fill in document</button></div>
  <div id="msg"></div>
  <script>
    function save(){
      const map={}; document.querySelectorAll('input').forEach(i=>{ if(i.value.trim()) map[i.dataset.key]=i.value.trim(); });
      document.getElementById('go').disabled=true; document.getElementById('msg').textContent='Filling in…';
      google.script.run.withSuccessHandler(n=>{ document.getElementById('msg').textContent='Done: '+n+' placeholder(s) filled.'; setTimeout(()=>google.script.host.close(),900); })
        .withFailureHandler(e=>{ document.getElementById('go').disabled=false; document.getElementById('msg').textContent='Something went wrong: '+e.message; })
        .fillPlaceholders(map);
    }
  </script>`;
  DocumentApp.getUi().showSidebar(HtmlService.createHtmlOutput(html).setTitle('Pink Proxy: client details'));
}

function fillPlaceholders(map, docArg) {
  const doc = docArg || DocumentApp.getActiveDocument();
  const parts = [doc.getBody(), doc.getHeader(), doc.getFooter()].filter(Boolean);
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const repEsc = s => s.replace(/\\/g, '\\\\').replace(/\$/g, '\\$');
  let count = 0;
  Object.keys(map).forEach(key => {
    parts.forEach(p => p.replaceText(reEsc(key), repEsc(map[key])));
    count++;
    if (!docArg && /(client|business|company).*name|business name/i.test(key)) {
      PropertiesService.getDocumentProperties().setProperty('clientName', map[key]);
    }
  });
  if (!docArg) {
    const client = PropertiesService.getDocumentProperties().getProperty('clientName');
    if (client && doc.getFooter()) addHeaderFooter_(doc, client); // refresh the "Prepared for" line
  }
  return count;
}

// ---------------------------------------------------------------- client copy

function makeClientCopy() {
  const ui = DocumentApp.getUi();
  const res = ui.prompt('Make a client copy', 'Client business name:', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const client = res.getResponseText().trim();
  if (!client) return;

  const doc = DocumentApp.getActiveDocument();
  const file = DriveApp.getFileById(doc.getId());
  const parents = file.getParents();
  const home = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  const clients = getOrCreateFolder_(home, 'Clients');
  const folder = getOrCreateFolder_(clients, client);

  const baseName = doc.getName().replace(/\s*\b(template|draft)\b\s*/ig, ' ').replace(/\s+/g, ' ').trim();
  const copy = file.makeCopy(`${client} - ${baseName}`, folder);

  const cdoc = DocumentApp.openById(copy.getId());
  const map = {};
  findPlaceholders_(cdoc).forEach(ph => {
    if (/(client|business|company).*name|business name|^\[client\]$|\{\{client\}\}/i.test(ph)) map[ph] = client;
  });
  fillPlaceholders(map, cdoc);
  addHeaderFooter_(cdoc, client);
  cdoc.saveAndClose();

  const url = copy.getUrl();
  ui.showModalDialog(HtmlService.createHtmlOutput(
    `<div style="font-family:Inter,Arial,sans-serif;color:${BRAND.navy}">
       <p>Saved to <b>Clients / ${client.replace(/</g, '&lt;')}</b> with the client name filled in.</p>
       <p><a href="${url}" target="_blank" style="color:${BRAND.roseDeep};font-weight:700">Open the client copy</a></p>
       <p style="font-size:12px;color:${BRAND.slate}">In the copy, use Pink Proxy → Fill in client details… for the rest.</p>
     </div>`).setWidth(380).setHeight(170), 'Client copy ready');
}

function getOrCreateFolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

// ---------------------------------------------------------------- whole folder

function brandFolder() {
  const ui = DocumentApp.getUi();
  const me = DriveApp.getFileById(DocumentApp.getActiveDocument().getId());
  const parents = me.getParents();
  if (!parents.hasNext()) { ui.alert('Move this doc into your templates folder first.'); return; }
  const folder = parents.next();
  const ok = ui.alert('Brand every doc in "' + folder.getName() + '"?',
    'This applies fonts, colors, header and footer to every Google Doc in this folder (not subfolders). Cover pages are not added.',
    ui.ButtonSet.OK_CANCEL);
  if (ok !== ui.Button.OK) return;
  const files = folder.getFilesByType(MimeType.GOOGLE_DOCS);
  const done = [];
  while (files.hasNext()) {
    const f = files.next();
    const d = DocumentApp.openById(f.getId());
    applyStyling_(d);
    addHeaderFooter_(d);
    d.saveAndClose();
    done.push(f.getName());
  }
  ui.alert('Branded ' + done.length + ' document(s):\n\n' + done.join('\n'));
}

// ---------------------------------------------------------------- helpers

function fetchImage_(url) {
  try {
    const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    return r.getResponseCode() === 200 ? r.getBlob() : null;
  } catch (e) { return null; }
}

function scaleImage_(img, width) {
  const w = img.getWidth(), h = img.getHeight();
  img.setWidth(width).setHeight(Math.round(h * width / w));
  return img;
}

function toast_(msg) {
  try { DocumentApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
}
