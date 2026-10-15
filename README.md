# pinkproxy
The Pink Proxy static page

## Contact form (Web3Forms)

The "Book your Cyber Hygiene Audit" form on every page sends submissions through [Web3Forms](https://web3forms.com) (free, 250 submissions a month), which emails them to you.

To connect it:
1. Go to https://web3forms.com, enter the email address that should receive submissions, and copy the **access key** they email you.
2. The key lives in the hidden `access_key` field in `index.html`, `services.html` and `about.html`. It is already set; to change it, update it in all three files. The key is safe to publish; it can only send form submissions to your email.
The buttons on the Services page pre-select the matching package in the form. Submission logic lives in `js/main.js`.
