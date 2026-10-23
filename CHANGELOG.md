# Website changelog

Changes from the Developer Implementation Brief (October 17, 2026), one version per category.
Each version is a git tag; roll back one category with `git revert <tag>`.

## review-15 — Founder photo
- Replaced the "VS" initials with Victoria's photo: round headshot on the homepage, portrait in the About founder card (round on mobile).
- Founder photo added to the homepage structured data.

## review-14 — Upgrade credit terms
- Jumpstart card: note that the $1,450 is credited toward the Digital Shield or Concierge if the client upgrades within 30 days.
- FAQ: upgrade credit changed from "any higher package within 60 days" to 30 days from the final Jumpstart payment, with an example.

## review-13 — Bluer navy
- Hero and navy bands now blend brand Navy (#0A192F) into Light Navy (#13294A); removed the rose-gold corner glow that read as gray/black.

## review-12 — Workspace prominence & SEO
- Hero: "Google Workspace Security" is now a large pink badge inside the H1; the eyebrow names the audience.
- Services H1 now names Google Workspace.
- New page titles and meta descriptions that say what we offer and do (Workspace security, 2-Step Verification, admin access, sharing, onboarding/offboarding, prices).
- Canonical URLs, Open Graph/Twitter tags and a 1200×630 share image (assets/og-image.png).
- Structured data: ProfessionalService + OfferCatalog (home), Service (services).
- robots.txt and sitemap.xml.
- Footer: Google Workspace trademark / not-affiliated note.

## review-11 — Photos
- Homepage "Is this for you?": added a "Built for owners like these" row of five stock photos (studios, cafés, designers, real estate, artists), labeled as illustrative stock images, not clients.
- About "How we work": added a small-team photo beside the cards.
- Images cropped to 4:5, compressed to WebP (~170 KB total), lazy-loaded, with alt text.

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

## review-05: About page (P1: A01, A02, A03, A04)
- New intro: "Practical cybersecurity. A partner who explains it."
- The large "VS" panel replaced with a compact founder card (initials marked decorative for screen readers) until a photo is supplied.
- Founder story updated with the brief's version; Victoria's original quote kept. **Victoria to verify every personal claim and the degree badge.**
- Repeated "who we work best with" section removed from About (the homepage keeps a short version), including "The cheapest option, whatever the result".
- "The Old Way vs. The Pink Proxy Way" table replaced with "What working with The Pink Proxy looks like": 7 factual cards that stack on phones. No claims about other providers.

## review-06: Free checklist (P1: C01, C02, C03)
- Each question now has Yes / No / Not sure buttons, so unanswered and "no" are different.
- Starts at "Not assessed yet · 0 of 10 answered". The result only appears once all 10 are answered.
- Result wording is qualified: "Your answers suggest areas worth reviewing. A free discovery call can help confirm the right package and next steps." It mentions Not sure answers, includes a "not a security assessment" note and a call button. The "a Jumpstart would close the biggest gaps within a week" claim is removed.
- Order is now: answer → result → next step → optional PDF by email.
- Privacy wording is accurate: answers stay in the browser; the PDF request sends first name, email and score only (score only once the checklist is finished), never individual answers. Privacy notice link added.
- "Clear my answers" link. Earlier saved answers carry over.
- Apps Script checklist email: "You answered Yes to X of 10 checks… a self-check, not a security assessment." Needs a new deployment version.

## review-07: Mobile and accessibility QA (P1: Q01)
- Tested Home, Services, About and Privacy at 320, 375, 390, 430 px and desktop: no sideways scrolling or clipped content.
- Automated accessibility scan (axe-core, WCAG 2 A/AA plus best practices): all pages now pass with 0 issues.
  - Darker rose gold for small text on light backgrounds (#94591F instead of #B9773A) to meet 4.5:1 contrast.
  - Heading order fixed (example card title, footer headings).
- Phone header: no longer sticky below 620px and more compact (155px → 95px at 320px), so it can't cover content. Anchor links leave room for the sticky header on desktop.
- Forms: double-submit guard; Apps Script now limits each email to 3 submissions per 10 minutes for both forms (needs a new deployment version).
- **Not tested here:** real iPhone Safari, enlarged system text, live form delivery and the Google Calendar booking page. Check these on your phone after publishing.

## review-08: Google Workspace focus, undeliverable promises removed (Launch Playbook, Oct 18)
- Site now says we specialize in Google Workspace account security and employee-access management; other systems are confirmed on the call.
- Removed promises we can't deliver yet: router/Wi-Fi, remote wipe and device management, backups and test restores, laptop hardening, Microsoft 365, password manager rollout. Added these to "Not included".
- Jumpstart: "Workspace Review & Priority Fixes", 3 fixes from an agreed list, email authentication observation only, record of changes and checks. Limits shown: up to 10 people, 1 Workspace domain.
- Digital Shield: "Workspace Security & Access Setup", 2-Step Verification rolled out and checked, groups/sharing tidied, up to 5 connected apps reviewed, onboarding/offboarding checklist.
- Concierge: "Workspace Governance & Team Readiness", custom quote from $2,950, additions chosen and priced in the proposal.
- $450/month maintenance paused and replaced with "Ask about scheduled Workspace access reviews".
- New FAQ: "Can't I do this myself with AI?" Homepage "What we cover" now lists five Google Workspace areas.
- Footer disclaimer updated to the playbook's wording, plus "not affiliated with or endorsed by Google, NIST or CISA".
- Apps Script auto-reply text updated to match (needs a new deployment version).
- Jumpstart and Shield website prices unchanged; pilot clients are quoted the test prices ($995 / $1,950) privately.

## review-09: Fewer repeated buttons, sourced facts on Services
- Services page had 5 "Book a Free 20-Minute Call" buttons. Now 1 (the booking section) plus the nav button. Each package card has a quiet "Ask about this package →" link that still jumps to the form and pre-fills the package.
- New "Two things we often hear" section above the pricing:
  - "Isn't Google Workspace already secure?" Google's small-business security checklist (admins set up redundant admins, phishing/spoofing protections, sharing permissions) and CISA's "minimum viable security configurations" for Google Workspace.
  - "We're too small to be hacked." NIST quotes ("The size of a business is never going to be a form of protection"; "a particularly ripe target"; "easy targets to get into bigger businesses through the supply chain") and two IBM 2025 figures (phishing 16%, the most common starting point; 241 days to identify and contain).
  - Every fact links to its source. Checked October 18, 2026.

## review-10: No price in the hero, softer checklist wording
- Homepage hero: the "$1,450 total project fee" box replaced with three reassurances: nothing changes without your approval; every change checked and explained; you keep ownership of your systems. Prices stay on the package cards and pricing page.
- Free checklist PDF description no longer promises "a quick fix for every gap"; now "All 10 checks and why each one matters for your business."
- Eyebrow labels on dark backgrounds back to the lighter rose gold for readability.
