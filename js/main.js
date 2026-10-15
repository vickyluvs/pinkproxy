// Shared behavior on every page.
(function () {
  var form = document.getElementById("contact-form");
  if (!form) return;

  // Google Apps Script web app (same one as the checklist signup; see apps-script/SETUP.md)
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbzXfHRIPViE4qpt9o-_am67e3BR_mtrK8F60teHqNCizkEqM7u5bJv3kamOmOTR-odgLw/exec";
  var statusEl = document.getElementById("form-status");
  var submitBtn = form.querySelector(".submit");
  var packageSelect = document.getElementById("cf-package");

  // Package buttons on the Services page pre-select the matching option
  document.querySelectorAll("a[data-package]").forEach(function (a) {
    a.addEventListener("click", function () {
      if (packageSelect) packageSelect.value = a.getAttribute("data-package");
    });
  });

  function setError(input, msg) {
    var field = input.closest(".field");
    var err = field.querySelector(".err");
    if (msg) {
      field.classList.add("invalid");
      if (!err) { err = document.createElement("span"); err.className = "err"; field.appendChild(err); }
      err.textContent = msg;
      input.setAttribute("aria-invalid", "true");
    } else {
      field.classList.remove("invalid");
      if (err) err.remove();
      input.removeAttribute("aria-invalid");
    }
  }

  function validate() {
    var firstBad = null;
    form.querySelectorAll("[required]").forEach(function (input) {
      var msg = "";
      if (!input.value.trim()) msg = "Please fill this in.";
      else if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) msg = "Please enter a valid email address.";
      setError(input, msg);
      if (msg && !firstBad) firstBad = input;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  form.addEventListener("input", function (e) {
    if (e.target.closest(".field.invalid")) setError(e.target, "");
  });

  function showStatus(kind, html) {
    statusEl.className = "form-status " + kind;
    statusEl.innerHTML = html;
    statusEl.hidden = false;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    statusEl.hidden = true;
    if (!validate()) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    var data = Object.fromEntries(new FormData(form));
    data.form = "audit";
    data.botcheck = form.querySelector('[name="botcheck"]').checked;
    data.page = location.pathname;

    // Plain-text body keeps this a "simple" request that Apps Script accepts.
    fetch(ENDPOINT, { method: "POST", body: JSON.stringify(data) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.success) throw new Error(res && res.message);
        var name = (data.name || "").split(" ")[0];
        form.querySelectorAll(".form-grid, .submit, .form-note").forEach(function (el) { el.hidden = true; });
        showStatus("ok", "<b>Thank you" + (name ? ", " + name.replace(/[<>&]/g, "") : "") + "!</b>Your request is in. We just emailed you next steps from consult@thepinkproxy.com (check your spam folder if you don\'t see it).<br><br>Ready now? <a href=\"https://calendar.app.google/6q6vAAoAaH3e21nY7\" target=\"_blank\" rel=\"noopener\" style=\"color:var(--pink);font-weight:600\">Pick a time for your free discovery call →</a>");
      })
      .catch(function () {
        showStatus("fail", "Something went wrong and your message wasn't sent. Please try again, or email <b>consult@thepinkproxy.com</b> directly.");
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Request My Audit";
      });
  });
})();
