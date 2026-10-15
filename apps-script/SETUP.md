# Checklist email signup: setup

When a visitor requests the checklist PDF on the home page, this script:
1. Adds them to a **Leads** tab in a Google Sheet (date, first name, email, score)
2. Emails them the PDF from **info@thepinkproxy.com**
3. Sends you a short "new lead" notification

It runs free on your Google Workspace account. Setup takes about 5 minutes.

## 1. Create the Sheet and paste the script
1. Sign in to Google as **info@thepinkproxy.com**, or as the account that has info@ as a "Send mail as" alias.
2. Create a new Google Sheet named **Pink Proxy Leads**.
3. In the Sheet: **Extensions → Apps Script**.
4. Delete the sample code, paste everything from `checklist-signup.gs`, and click **Save**.

## 2. Fill in two settings (top of the script)
- `MAILING_ADDRESS`: your business mailing address. A PO box is fine. US anti-spam law requires it in marketing emails.
- `PDF_URL`: if thepinkproxy.com isn't connected to Cloudflare yet, use your `.pages.dev` / `.workers.dev` address instead, e.g. `https://pinkproxy.pages.dev/assets/pink-proxy-5-minute-checklist.pdf`.

## 3. Authorize and test
1. In the function dropdown at the top, choose **testSend**, then click **Run**.
2. Google will ask for permission. Click **Review permissions**, choose your account, then **Advanced → Go to project (unsafe) → Allow**. ("Unsafe" only means Google hasn't reviewed your own script.)
3. Check your inbox for the test checklist email.

## 4. Publish it as a web app
1. Click **Deploy → New deployment**.
2. Click the gear icon and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**.
4. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
5. Paste that URL into `js/checklist.js` as `SIGNUP_ENDPOINT`, then commit and push.

## Changing the script later
After editing the code, use **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. This keeps the same URL, so the website doesn't need to change.

## Unsubscribes
The email says to reply "unsubscribe." When someone does, change their **Status** in the Sheet to `Unsubscribed` and leave them out of future mailings.
