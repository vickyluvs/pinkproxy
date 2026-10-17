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
