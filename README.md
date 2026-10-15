# pinkproxy
The Pink Proxy static page

## Contact form (audit requests)

The "Book your Cyber Hygiene Audit" form on every page posts to the same Google Apps Script as the checklist signup (`ENDPOINT` in `js/main.js`). The script saves the request to the **Audit Requests** tab, emails the client a personalized reply from consult@thepinkproxy.com with their package details and the booking link, and notifies consult@. See [`apps-script/SETUP.md`](apps-script/SETUP.md).
The buttons on the Services page pre-select the matching package in the form.
