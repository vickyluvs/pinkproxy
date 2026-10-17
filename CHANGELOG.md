# Website changelog

Changes from the Developer Implementation Brief (October 17, 2026), one version per category.
Each version is a git tag; roll back one category with `git revert <tag>`.

## review-01: Free discovery-call language and booking flow (P0: G01, G02, F01, F02)
- One name for the first step everywhere: "Book a Free 20-Minute Call" (calendar) and "Request My Free Discovery Call" (form). Nav button is now "Book a Free Call".
- Shared booking section rewritten: free-call eyebrow and headline, booking button first, "No payment is required to book", 50/50 payment terms.
- New 5-step "How it works": call → confirm package/scope/terms + written authorization → first 50% → deliverables and walkthrough → final 50%.
- Package buttons on Services now say "Book a Free 20-Minute Call" with "Discuss [package]. No payment required to book." Package still pre-fills the form.
- Form: "Prefer us to get in touch?" intro, required fields marked, warning not to include passwords or sensitive data, privacy notice link.
- Success message says the team will reply within one business day and that this is a request, not a booked appointment. Button can't be pressed twice.
- New privacy.html describing the actual data flow (Google Workspace, Cloudflare, checklist score only, no analytics). Linked in every footer.
- Apps Script auto-reply: new subject, "total project fee" wording, 50/50 terms. Needs a new deployment version to go live.

## review-02: Scope, footer and toned-down promises (P0: G03, P01; H03 promise wording)
- Footer disclaimer no longer says "advisory only". It now describes authorized, non-intrusive reviews and implementation of agreed safeguards, limited to the client agreement. Exclusions and NIST/CISA disclaimers kept. **Owner approval and a qualified review recommended.**
- Services scope box rewritten to match; NIST/CISA mapping marked as informational, not a certification or insurer acceptance.
- Cyber Hygiene Audit tied to the Security Jumpstart in the FAQ.
- Absolute promises softened: "Reduce the risk of email impersonation", "Strengthen security settings on business laptops and phones", email-authentication fix described as helping receiving systems identify unauthorized use.
- "15-minute offboarding playbook" changed to "a documented offboarding playbook for your apps".
- "NIST CSF 2.0 report for insurers and clients" changed to "A report mapping completed work and recommendations to NIST CSF 2.0".
- Home meta description no longer says "audits".

## review-03: Services & Pricing page (P1: P01, P02, P04, FAQ; P03 partial)
- New "Which package fits?" chooser above the cards: one line, price and timeline per package, stacked on phones.
- Card subtitles: Audit & Quick Fixes / Core Security Setup / Security Setup & Team Readiness, with the brief's summaries.
- Prices show "total project fee" with the 50/50 split underneath (e.g. $725 upfront · $725 upon completion) and "Estimated delivery: X business days from kickoff".
- Checklist-number summaries replaced with plain-English outcomes.
- Payment terms added to the note under the cards.
- Maintenance renamed "Optional Ongoing Cyber Care": billed monthly, 3-month minimum, 30 days' notice to cancel, quarterly work separated from monthly work, hours limit referenced (not stated), "not 24/7 monitoring". 50/50 terms explicitly don't apply. Form option renamed to match.
- FAQ: what happens after the call, when you pay and what "complete" means, choosing any package plus upgrade credit, what access is needed, when the estimate starts and what delays it, support after delivery.
- **Not done (owner decisions):** user/device/domain/location limits, supported platforms and client time commitment (P03). Nothing invented.

## review-04: Homepage (P1: H01, H02, H03)
- New hero: "Know who has access. Know what to fix first." The Security Jumpstart offer, "$1,450 total project fee", 50/50 terms, estimated 3–5 business days from kickoff, one main call button plus "Compare Security Packages". Checklist moved to a small text link.
- Access-review card labelled "Illustrative example · not client data", with a caption explaining what it shows.
- New order: hero → problems and fixes → package overview (price, scope, timeline) → what we cover → who you'll work with → is this for you → call to action → free checklist → booking and how it works.
- Package overview cards link to each package on the pricing page.
- "What we cover" keeps the five areas but drops the NIST CSF code chips; one sentence explains the mapping and that it isn't a certification.
- Short founder block (initials until a photo is supplied) linking to About.
- The long values section replaced with a short "Built for small teams that want clarity and control". The "cheapest option" line removed.
