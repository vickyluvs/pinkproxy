// Shared behavior on every page.
(function () {
  // "Copy email" button in the booking section
  var btn = document.getElementById("copy-email");
  var emailEl = document.getElementById("email");
  if (btn && emailEl) {
    btn.addEventListener("click", function () {
      var text = emailEl.textContent.trim();
      function done() {
        btn.textContent = "Copied";
        btn.classList.add("done");
        setTimeout(function () { btn.textContent = "Copy email"; btn.classList.remove("done"); }, 1800);
      }
      function fallback() {
        var r = document.createRange();
        r.selectNodeContents(emailEl);
        var s = window.getSelection();
        s.removeAllRanges();
        s.addRange(r);
        btn.textContent = "Selected — press Ctrl/Cmd+C";
      }
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    });
  }
})();
