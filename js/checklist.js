// Free 5-minute checklist (home page only).
// Answers (Yes / No / Not sure) are saved only in the visitor's own browser via localStorage.
(function () {
  var list = document.getElementById("cl-list");
  if (!list) return;

  var items = [
    ["Every team member has their own login", "No shared accounts for email, banking or payments."],
    ["Multi-factor sign-in is on for email", "Owner and staff accounts both."],
    ["Passwords live in a password manager", "Not in Slack, texts, notes or a spreadsheet."],
    ["You could remove a departing employee in under an hour", "And you know every app they can access."],
    ["Your domain has a DMARC record", "Ask whoever set up your email, or we'll check for you."],
    ["Laptops lock automatically and are encrypted", "FileVault on Mac, BitLocker on Windows."],
    ["Software updates install automatically", "On computers and phones used for work."],
    ["Important files are backed up and you've tested a restore", "A backup you've never restored is a guess."],
    ["Guests use a separate Wi-Fi network", "Your business devices stay on their own network."],
    ["You know who to call if something goes wrong", "Written down somewhere the whole team can find."]
  ];
  var CHOICES = [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]];
  var STORAGE_KEY = "pp-checklist-v2";

  var answers = {};
  try {
    answers = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
    var old = JSON.parse(localStorage.getItem("pp-checklist") || "null"); // earlier version stored ticked items only
    if (old && Array.isArray(old) && !Object.keys(answers).length) old.forEach(function (i) { answers[i] = "yes"; });
  } catch (e) { answers = {}; }

  items.forEach(function (it, i) {
    var li = document.createElement("li");
    var radios = CHOICES.map(function (c) {
      var id = "cl-" + i + "-" + c[0];
      return '<input type="radio" name="cl-' + i + '" id="' + id + '" value="' + c[0] + '"' + (answers[i] === c[0] ? " checked" : "") + '>' +
             '<label for="' + id + '">' + c[1] + "</label>";
    }).join("");
    li.innerHTML = '<fieldset><legend><span class="q">' + it[0] + "</span><small>" + it[1] + "</small></legend>" +
                   '<div class="seg">' + radios + "</div></fieldset>";
    list.appendChild(li);
  });

  var scoreEl = document.getElementById("cl-score");
  var countEl = document.getElementById("cl-count");
  var meter = document.getElementById("cl-meter");
  var result = document.getElementById("cl-result");

  function update() {
    answers = {};
    list.querySelectorAll("input:checked").forEach(function (r) { answers[r.name.slice(3)] = r.value; });
    var vals = Object.keys(answers).map(function (k) { return answers[k]; });
    var answered = vals.length;
    var yes = vals.filter(function (v) { return v === "yes"; }).length;
    var unsure = vals.filter(function (v) { return v === "unsure"; }).length;

    countEl.textContent = answered + " of " + items.length + " answered";
    meter.style.width = (answered / items.length * 100) + "%";

    if (answered < items.length) {
      scoreEl.textContent = "Not assessed yet";
      scoreEl.dataset.score = "";
      result.hidden = true;
    } else {
      scoreEl.textContent = yes + " of 10 in place";
      scoreEl.dataset.score = String(yes);
      var lead = yes === items.length
        ? "Your answers suggest strong security habits. A free discovery call can help confirm nothing has been missed, and scheduled access reviews can help keep it that way as your team grows."
        : "Your answers suggest areas worth reviewing. A free discovery call can help confirm the right package and next steps.";
      var unsureLine = unsure ? "<p>You marked " + unsure + (unsure === 1 ? " item" : " items") + " as Not sure. Those are worth checking too.</p>" : "";
      result.innerHTML = "<p><b>You answered Yes to " + yes + " of 10.</b> " + lead + "</p>" + unsureLine +
        '<p class="cl-disclaimer">This result is based only on your own answers. It is not a security assessment and doesn\'t guarantee protection.</p>' +
        '<a class="btn btn-primary" href="#book">Book a Free 20-Minute Call</a>';
      result.hidden = false;
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(answers)); } catch (e) {}
  }

  list.addEventListener("change", update);
  var reset = document.getElementById("cl-reset");
  if (reset) reset.addEventListener("click", function () {
    list.querySelectorAll("input:checked").forEach(function (r) { r.checked = false; });
    update();
  });
  update();
})();

// "Email me the checklist" signup.
// Sends the visitor's first name, email and score (never individual answers) to the Google Apps Script web app,
// which saves them to the Leads sheet and emails the PDF (see apps-script/SETUP.md).
(function () {
  // Apps Script web app URL (see apps-script/SETUP.md).
  var SIGNUP_ENDPOINT = "https://script.google.com/macros/s/AKfycbzXfHRIPViE4qpt9o-_am67e3BR_mtrK8F60teHqNCizkEqM7u5bJv3kamOmOTR-odgLw/exec";

  var form = document.getElementById("pdf-signup");
  if (!form) return;
  var statusEl = document.getElementById("pdf-status");
  var btn = form.querySelector(".submit");
  var emailInput = document.getElementById("ps-email");

  function show(kind, html) {
    statusEl.className = "form-status " + kind;
    statusEl.innerHTML = html;
    statusEl.hidden = false;
  }

  function fieldError(msg) {
    var field = emailInput.closest(".field");
    var err = field.querySelector(".err");
    field.classList.toggle("invalid", !!msg);
    if (msg) {
      if (!err) { err = document.createElement("span"); err.className = "err"; field.appendChild(err); }
      err.textContent = msg;
      emailInput.setAttribute("aria-invalid", "true");
    } else {
      if (err) err.remove();
      emailInput.removeAttribute("aria-invalid");
    }
  }
  emailInput.addEventListener("input", function () { fieldError(""); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (btn.disabled) return;
    statusEl.hidden = true;
    var email = emailInput.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldError("Please enter a valid email address.");
      emailInput.focus();
      return;
    }
    if (!SIGNUP_ENDPOINT) {
      show("fail", "The checklist email isn't connected yet. Please write to <b>info@thepinkproxy.com</b> and we'll send it to you.");
      return;
    }

    var scoreEl = document.getElementById("cl-score");
    var data = {
      first_name: form.first_name.value.trim(),
      email: email,
      score: scoreEl && scoreEl.dataset.score ? scoreEl.dataset.score : "", // only sent once the checklist is finished
      company_website: form.company_website.value,
      page: location.pathname
    };

    btn.disabled = true;
    btn.textContent = "Sending…";

    // Plain-text body keeps this a "simple" request that Apps Script accepts.
    fetch(SIGNUP_ENDPOINT, { method: "POST", body: JSON.stringify(data) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.success) throw new Error(res && res.message);
        form.querySelectorAll(".pdf-fields, .submit, .pdf-consent").forEach(function (el) { el.hidden = true; });
        show("ok", "<b>Check your inbox.</b> The checklist is on its way to " + email.replace(/[<>&]/g, "") + ". If you don't see it in a few minutes, look in your spam folder.");
      })
      .catch(function () {
        show("fail", "Something went wrong and the checklist wasn't sent. Please try again, or email <b>info@thepinkproxy.com</b>.");
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = "Email Me the Checklist";
      });
  });
})();
