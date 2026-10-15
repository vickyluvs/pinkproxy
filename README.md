# pinkproxy
The Pink Proxy static page

## Contact form (Web3Forms)

The "Book your Cyber Hygiene Audit" form on every page sends submissions through [Web3Forms](https://web3forms.com) (free, 250 submissions a month), which emails them to you.

To connect it:
1. Go to https://web3forms.com, enter the email address that should receive submissions, and copy the **access key** they email you.
2. In `index.html`, `services.html` and `about.html`, replace `YOUR_WEB3FORMS_ACCESS_KEY` with that key. The key is safe to publish; it can only send form submissions to your email.

Until the key is added, the form shows a message asking visitors to email hello@thepinkproxy.com instead.
The buttons on the Services page pre-select the matching package in the form. Submission logic lives in `js/main.js`.
