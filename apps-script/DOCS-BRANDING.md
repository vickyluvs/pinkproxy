# Google Docs branding toolkit: setup

`docs-branding.gs` adds a **Pink Proxy** menu to a Google Doc.

## One-time setup (about 5 minutes)
1. In Google Drive, make a folder called **Pink Proxy Templates** and put your client documents in it as Google Docs (SOW, MSA, Proposal, Intake Questionnaire, reports, policies).
2. Open one of the docs and go to **Extensions → Apps Script**.
3. Delete the sample code, paste everything from `docs-branding.gs`, and click **Save**.
4. Reload the doc. A **Pink Proxy** menu appears next to Help.
5. The first time you use it, Google asks for permission. Click **Review permissions → your account → Advanced → Go to project → Allow**. It needs your documents (to style them), Drive (to make client copies) and the internet (to fetch your logo from GitHub).

Repeat steps 2–4 for each template. When you make a copy of a doc, the menu comes with it.

## The menu
| Menu item | What it does |
|---|---|
| Brand this document | Adds a cover page, fonts, colors, header and footer in one step |
| Apply fonts and colors | Plus Jakarta Sans headings, Inter body text, navy and rose gold headings, navy table headers with blush rows, rose gold links |
| Add header and footer | Logo in the header; tagline, website and "Confidential · Prepared for [client]" in the footer |
| Insert cover page | Logo, title, "Prepared for / Prepared by / Date / Contact", then a page break |
| Insert tip box at cursor | A blush box with a rose gold border for notes and tips |
| Fill in client details… | Lists every `[placeholder]` in the doc in one form. Today's date and the provider name are filled in for you |
| Make a client copy… | Copies the doc into `Clients/<Client name>/` with the client's name filled in. The template stays clean |
| Brand every doc in this folder | Applies fonts, colors, header and footer to every Google Doc in the same folder |

## Notes
- Page numbers: use **Insert → Page numbers** in Google Docs. Scripts can't add them.
- If a font doesn't show, open **Font → More fonts** in Docs, add Plus Jakarta Sans and Inter, then run the styling again.
- The logo comes from `assets/brand/pink-proxy-logo-horizontal.png` in the website repo. If you replace that file, docs pick up the new logo the next time you add a header or cover.
