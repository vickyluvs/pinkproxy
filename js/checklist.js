// Free 5-minute checklist (home page only).
// Answers are saved in the visitor's own browser via localStorage.
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

  var STORAGE_KEY = "pp-checklist";
  var saved = [];
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch (e) {}

  items.forEach(function (it, i) {
    var li = document.createElement("li");
    li.innerHTML =
      '<label for="cl-' + i + '"><input type="checkbox" id="cl-' + i + '"' +
      (saved.indexOf(i) >= 0 ? " checked" : "") + "><span>" + it[0] +
      "<small>" + it[1] + "</small></span></label>";
    list.appendChild(li);
  });

  function message(n) {
    if (n <= 4) return "Your foundation has some open doors. A Security Jumpstart would close the biggest ones within a week.";
    if (n <= 7) return "You've got good habits started. The Digital Shield would lock in access, exits and email.";
    if (n <= 9) return "Strong start. A quick audit would confirm the details and fill the last gaps.";
    return "Excellent. Quarterly maintenance will keep it that way as your team grows.";
  }

  function update() {
    var checked = [];
    list.querySelectorAll("input").forEach(function (c, i) { if (c.checked) checked.push(i); });
    var n = checked.length;
    document.getElementById("cl-score").textContent = n;
    document.getElementById("cl-meter").style.width = (n * 10) + "%";
    document.getElementById("cl-result").textContent = message(n);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(checked)); } catch (e) {}
  }

  list.addEventListener("change", update);
  update();
})();
