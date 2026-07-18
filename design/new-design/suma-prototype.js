const app = document.querySelector("#app");
const platform = document.body.dataset.platform;
const state = {
  route: new URLSearchParams(location.search).get("screen") || "home",
  stack: [],
  split: "equal",
  command: false,
};

const icons = {
  logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 7.5C6 5.57 7.57 4 9.5 4h5C16.43 4 18 5.57 18 7.5S16.43 11 14.5 11h-5C7.57 11 6 12.57 6 14.5S7.57 18 9.5 18h5c1.93 0 3.5-1.57 3.5-3.5"/><path d="M12 2v20"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m15 18-6-6 6-6"/></svg>',
  search:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  users:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  group:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></svg>',
  clock:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  repeat:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m17 1 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>',
  settings:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.1.37.31.71.6 1 .3.29.68.43 1.1.4h.1v4h-.1a1.7 1.7 0 0 0-1.7.6Z"/></svg>',
  chevron:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m9 18 6-6-6-6"/></svg>',
  card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>',
  globe:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m5 12 4 4L19 6"/></svg>',
  receipt:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 2v20l3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2Z"/><path d="M9 9h6M9 13h6"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></svg>',
};
const I = (name) => icons[name] || icons.chevron;
const avatar = (name, label = name.slice(0, 2).toUpperCase()) =>
  `<span class="avatar" aria-label="${name}">${label}</span>`;
const topbar = (title = "", back = true, action = "") =>
  `<header class="topbar" data-od-id="${title.toLowerCase().replaceAll(" ", "-") || "screen"}-topbar">${back ? `<button class="back-btn" data-action="back" aria-label="Back">${I("back")}</button>` : `<button class="avatar-btn" data-route="settings" aria-label="Open profile">MN</button>`}<span class="topbar-title">${title}</span>${action || '<span style="width:48px"></span>'}</header>`;
const amount = (value, cls = "") => `<span class="amount ${cls}">${value}</span>`;
const row = (title, sub, value = "", route = "", initials = "MN") =>
  `<button class="person-row" ${route ? `data-route="${route}"` : ""} data-od-id="row-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}">${avatar(title, initials)}<span class="row-main"><span class="row-title">${title}</span><span class="row-sub">${sub}</span></span>${value}${route ? I("chevron") : ""}</button>`;

const screens = {
  welcome: () =>
    `<main class="screen" data-od-id="welcome-screen"><div class="auth-logo">${I("logo")}</div><h1 class="large-title">Money feels lighter together.</h1><p class="lede">Track shared costs around the people and groups that matter, then settle without the awkward math.</p><div class="auth-actions"><button class="primary" data-route="signup">Create an account</button><button class="secondary" data-route="login">Sign in</button><div class="or">or continue with</div><button class="social" data-route="profile-setup">Apple</button><button class="social" data-route="profile-setup">Google</button></div><p class="row-sub" style="text-align:center;margin-top:20px">By continuing, you agree to Suma’s Terms and Privacy Policy.</p></main>`,
  login: () =>
    `<main class="screen" data-od-id="login-screen">${topbar("Sign in")}<h1 class="large-title">Welcome back.</h1><p class="lede">Your groups and balances are waiting.</p><form class="form" data-submit="login"><div class="field"><label for="login-email">Email</label><input id="login-email" type="email" autocomplete="email" value="mia@example.com" required></div><div class="field"><label for="login-password">Password</label><input id="login-password" type="password" autocomplete="current-password" value="password" required></div><button class="primary" type="submit">Sign in</button><button class="text-btn" type="button" data-route="forgot">Forgot password?</button></form></main>`,
  signup: () =>
    `<main class="screen" data-od-id="signup-screen">${topbar("Create account")}<h1 class="large-title">Start your circle.</h1><p class="lede">We’ll use your details to help friends find you.</p><form class="form" data-submit="signup"><div class="field"><label for="signup-name">Full name</label><input id="signup-name" autocomplete="name" value="Mia Noor" required></div><div class="field"><label for="signup-email">Email</label><input id="signup-email" type="email" autocomplete="email" value="mia@example.com" required></div><div class="field"><label for="signup-password">Password</label><input id="signup-password" type="password" autocomplete="new-password" minlength="8" value="password" required><span class="row-sub">Use at least 8 characters.</span></div><button class="primary" type="submit">Continue</button></form></main>`,
  forgot: () =>
    `<main class="screen" data-od-id="forgot-screen">${topbar("Reset password")}<div class="auth-logo">${I("card")}</div><h1 class="large-title">Find your account.</h1><p class="lede">Enter the email you use with Suma. We’ll send a secure reset link.</p><form class="form" data-submit="forgot"><div class="field"><label for="reset-email">Email</label><input id="reset-email" type="email" value="mia@example.com" required></div><button class="primary" type="submit">Send reset link</button></form></main>`,
  verify: () =>
    `<main class="screen" data-od-id="verify-screen">${topbar("Verify email")}<h1 class="large-title">Check your inbox.</h1><p class="lede">Enter the six-digit code sent to mia@example.com.</p><form class="form" data-submit="verify"><div class="code-inputs" aria-label="Verification code"><input inputmode="numeric" value="4" aria-label="Digit 1"><input inputmode="numeric" value="8" aria-label="Digit 2"><input inputmode="numeric" value="2" aria-label="Digit 3"><input inputmode="numeric" value="9" aria-label="Digit 4"><input inputmode="numeric" value="1" aria-label="Digit 5"><input inputmode="numeric" value="6" aria-label="Digit 6"></div><button class="primary" type="submit">Verify and continue</button><button class="text-btn" type="button" data-toast="A new code was sent">Send a new code</button></form></main>`,
  "profile-setup": () =>
    `<main class="screen" data-od-id="profile-setup-screen">${topbar("Your profile")}<h1 class="large-title">Make it easy to find you.</h1><p class="lede">A photo and default currency help friends add you correctly.</p><div style="display:grid;place-items:center;margin:28px 0">${avatar("Mia Noor", "MN")}</div><form class="form" data-submit="profile"><div class="field"><label for="display-name">Display name</label><input id="display-name" value="Mia Noor"></div><div class="field"><label for="currency">Default currency</label><select id="currency"><option>USD — US Dollar</option><option>EUR — Euro</option><option>GBP — British Pound</option></select></div><button class="primary" type="submit">Enter Suma</button></form></main>`,
  home: () =>
    `<main class="screen" data-od-id="money-map-screen">${topbar("", false, `<button class="icon-btn" data-route="notifications" aria-label="Notifications">${I("bell")}</button>`)}<h1 class="large-title">Good evening, Mia.</h1><p class="lede">Two circles need your attention.</p><section class="balance-hero" data-od-id="balance-summary"><div class="balance-label">Across all your circles</div><div class="balance-value">+$184.20</div><div class="balance-note">You’re owed $236.70 · You owe $52.50</div></section><h2 class="eyebrow">Needs attention</h2>${row("Noor", "Bali villa · asked yesterday", amount("$48.00", "negative"), "friend", "NO")}${row("Leo", "Flat 4B · electricity is due", amount("$31.40", "negative"), "group-flat", "LE")}<h2 class="eyebrow">Your circles</h2><div class="group-grid"><button class="group-card" data-route="group-bali" data-od-id="group-card-bali"><span class="group-mark">${I("globe")}</span><span class="group-name">Bali weekend</span><span class="group-meta">5 people · You’re owed $216</span></button><button class="group-card" data-route="group-flat" data-od-id="group-card-flat"><span class="group-mark">${I("home")}</span><span class="group-name">Flat 4B</span><span class="group-meta">4 people · You owe $31.40</span></button></div><h2 class="eyebrow">Recent movement</h2>${activityRows()}</main><button class="fab" data-action="command" aria-label="Open Suma command menu">${I("plus")}</button>`,
  friends: () =>
    `<main class="screen" data-od-id="friends-screen">${topbar("Friends")}<h1 class="large-title">People</h1><div class="search"><span>${I("search")}</span><input aria-label="Search friends" placeholder="Search by name or email"></div><h2 class="eyebrow">Balances</h2>${row("Noor Rahman", "3 shared groups", amount("You owe $48", "negative"), "friend", "NR")}${row("Sam Lee", "2 shared groups", amount("Owes you $128", "positive"), "friend", "SL")}${row("Leo Martin", "Flat 4B", amount("You owe $31.40", "negative"), "friend", "LM")}${row("Ava Kim", "All settled", amount("$0"), "friend", "AK")}<button class="secondary" style="margin-top:18px" data-toast="Invite link copied">Invite a friend</button></main>`,
  friend: () =>
    `<main class="screen" data-od-id="friend-detail-screen">${topbar("Noor Rahman")}<div style="display:grid;place-items:center;margin:24px 0 10px">${avatar("Noor Rahman", "NR")}</div><div class="settle-amount negative">$48.00</div><p class="lede" style="text-align:center;margin-inline:auto">You owe Noor across Bali weekend.</p><div class="stat-pair"><button class="secondary" data-route="settle">Settle up</button><button class="secondary" data-route="add-expense">Add expense</button></div><h2 class="eyebrow">Together</h2>${row("Bali weekend", "Villa, dinner and scooter", amount("$48.00", "negative"), "group-bali", "BW")}<h2 class="eyebrow">History</h2>${activityRows(true)}</main>`,
  "group-bali": () =>
    groupScreen("Bali weekend", "5 people · IDR and USD", "You’re owed", "$216.00", "BW"),
  "group-flat": () =>
    groupScreen("Flat 4B", "4 people · recurring monthly", "You owe", "$31.40", "4B", true),
  activity: () =>
    `<main class="screen" data-od-id="activity-screen">${topbar("Activity")}<h1 class="large-title">Everything that moved.</h1><div class="chips"><button class="chip active">All</button><button class="chip">Expenses</button><button class="chip">Payments</button><button class="chip">Changes</button></div><h2 class="eyebrow">Today</h2>${activityRows()}<h2 class="eyebrow">This week</h2>${row("Groceries", "Leo added to Flat 4B", amount("$86.20"), "expense", "GR")}${row("Airport transfer", "Sam added to Bali weekend", amount("IDR 640k"), "expense", "AT")}</main>`,
  "add-expense": () =>
    `<main class="screen" data-od-id="add-expense-screen">${topbar("Add expense", true, `<button class="text-btn" data-toast="Draft saved">Save</button>`)}<form class="form" data-submit="expense"><div class="field"><label for="expense-title">What was it?</label><input id="expense-title" value="Villa groceries" required></div><div class="field"><label for="expense-amount">Amount</label><div style="display:flex;gap:8px"><select aria-label="Currency" style="width:110px"><option>USD</option><option>IDR</option><option>EUR</option></select><input id="expense-amount" inputmode="decimal" value="124.80" required></div></div><div class="field"><label>Split method</label><div class="segment" data-segment><button type="button" class="active" data-split="equal">Equal</button><button type="button" data-split="amount">Amount</button><button type="button" data-split="shares">Shares</button></div></div><div class="member-split">${splitRows()}</div><button type="button" class="receipt" data-toast="Receipt scanner opened">${I("receipt")}<span>Add a receipt</span></button><div class="field"><label for="expense-group">Add to</label><select id="expense-group"><option>Bali weekend</option><option>Flat 4B</option></select></div><button class="primary" type="submit">Add expense</button></form></main>`,
  expense: () =>
    `<main class="screen" data-od-id="expense-detail-screen">${topbar("Villa groceries", true, `<button class="icon-btn" data-toast="More options" aria-label="More options">•••</button>`)}<div class="settle-amount">$124.80</div><p class="lede" style="text-align:center;margin-inline:auto">Paid by Mia · split equally · today</p><section class="stat-pair"><div class="stat"><div class="stat-value">$24.96</div><div class="stat-label">Per person</div></div><div class="stat"><div class="stat-value">5</div><div class="stat-label">People included</div></div></section><h2 class="eyebrow">The split</h2>${row("Mia Noor", "Paid the full amount", amount("+$99.84", "positive"), "", "MN")}${row("Noor Rahman", "Owes Mia", amount("$24.96", "negative"), "", "NR")}${row("Sam Lee", "Owes Mia", amount("$24.96", "negative"), "", "SL")}${row("Ava Kim", "Owes Mia", amount("$24.96", "negative"), "", "AK")}${row("Leo Martin", "Owes Mia", amount("$24.96", "negative"), "", "LM")}<button class="secondary" style="margin-top:18px" data-route="add-expense">Edit expense</button></main>`,
  settle: () =>
    `<main class="screen" data-od-id="settle-screen">${topbar("Settle up")}<div class="settle-party">${avatar("Mia Noor", "MN")}<span class="arrow-line"></span>${avatar("Noor Rahman", "NR")}</div><p class="lede" style="text-align:center;margin-inline:auto">You are paying Noor</p><div class="settle-amount">$48.00</div><form class="form" data-submit="settle"><div class="field"><label for="payment-method">Payment method</label><select id="payment-method"><option>Record as cash payment</option><option>Bank transfer</option><option>Payment link</option></select></div><div class="field"><label for="settle-note">Note</label><input id="settle-note" value="Bali villa balance"></div><button class="primary" type="submit">Confirm payment</button><p class="row-sub" style="text-align:center">Suma won’t move money for cash payments. Both people will see the record.</p></form></main>`,
  recurring: () =>
    `<main class="screen" data-od-id="recurring-screen">${topbar("Recurring")}<h1 class="large-title">The things that repeat.</h1><p class="lede">Suma prepares the expense and reminds the payer before it posts.</p>${row("Rent", "1st monthly · Flat 4B", amount("$2,400"), "recurring-detail", "RT")}${row("Electricity", "18th monthly · Flat 4B", amount("Variable"), "recurring-detail", "EL")}${row("Internet", "24th monthly · Flat 4B", amount("$79"), "recurring-detail", "IN")}<button class="secondary" style="margin-top:18px" data-toast="Recurring expense creator opened">Add recurring expense</button></main>`,
  "recurring-detail": () =>
    `<main class="screen" data-od-id="recurring-detail-screen">${topbar("Rent")}<div class="group-icon-lg" style="margin:24px 0">${I("repeat")}</div><h1 class="large-title">$2,400 monthly</h1><p class="lede">Posts to Flat 4B on the first day of each month. Mia pays; everyone shares equally.</p><h2 class="eyebrow">Schedule</h2><button class="setting-row"><span class="row-main"><span class="row-title">Next expense</span><span class="row-sub">August 1, 2026</span></span>${I("chevron")}</button><button class="setting-row"><span class="row-main"><span class="row-title">Reminder</span><span class="row-sub">Two days before</span></span>${I("chevron")}</button><button class="setting-row" data-action="toggle" aria-pressed="false"><span class="row-main"><span class="row-title">Post automatically</span><span class="row-sub">Create without review</span></span><span class="toggle"></span></button><button class="danger-btn" style="margin-top:26px" data-toast="Recurring expense paused">Pause recurring expense</button></main>`,
  currencies: () =>
    `<main class="screen" data-od-id="currencies-screen">${topbar("Currencies")}<h1 class="large-title">Travel without conversion math.</h1><p class="lede">Original amounts stay intact. Group balances use the selected home currency.</p><h2 class="eyebrow">Bali weekend</h2><button class="currency-row"><span class="group-mark">$</span><span class="row-main"><span class="row-title">USD · US Dollar</span><span class="row-sub">Home currency</span></span>${I("check")}</button><button class="currency-row"><span class="group-mark">Rp</span><span class="row-main"><span class="row-title">IDR · Indonesian Rupiah</span><span class="row-sub">1 USD = 16,180 IDR · updated today</span></span>${I("chevron")}</button><h2 class="eyebrow">Conversion preference</h2><button class="setting-row" data-action="toggle" aria-pressed="true"><span class="row-main"><span class="row-title">Use expense-date rate</span><span class="row-sub">Best for trips with changing rates</span></span><span class="toggle on"></span></button><p class="row-sub" style="margin-top:18px">Rates are shown before settlement and can be corrected by group members.</p></main>`,
  notifications: () =>
    `<main class="screen" data-od-id="notifications-screen">${topbar("Notifications")}<h1 class="large-title">Worth knowing.</h1>${row("Noor requested a settlement", "Bali weekend · yesterday", amount("$48", "negative"), "settle", "NR")}${row("Electricity is ready to review", "Recurring · due tomorrow", "", "recurring-detail", "EL")}${row("Sam added airport transfer", "Bali weekend · Monday", amount("IDR 640k"), "expense", "SL")}<button class="text-btn" data-toast="All notifications marked read">Mark all as read</button></main>`,
  settings: () =>
    `<main class="screen" data-od-id="settings-screen">${topbar("Settings")}<div style="display:flex;align-items:center;gap:14px;margin:24px 0">${avatar("Mia Noor", "MN")}<div><div class="row-title">Mia Noor</div><div class="row-sub">mia@example.com</div></div></div><h2 class="eyebrow">Preferences</h2>${settingRow("Default currency", "USD", "currencies")}${settingRow("Notifications", "Push and email")}${settingRow("Payment methods", "Cash and bank transfer")}${settingRow("Appearance", "System")}${settingRow("Privacy and security", "Face ID enabled")}<h2 class="eyebrow">Account</h2>${settingRow("Export your data", "")}${settingRow("Help and support", "")}<button class="danger-btn" style="margin-top:22px" data-route="welcome">Sign out</button></main>`,
};

function activityRows(compact = false) {
  return `${row("Villa groceries", compact ? "Today · Bali weekend" : "You paid · split with 5 people", amount(compact ? "$124.80" : "+$99.84", "positive"), "expense", "VG")}${row("Noor paid you", compact ? "Yesterday · Bank transfer" : "Bali weekend · settlement", amount("$72.00", "positive"), "expense", "NR")}`;
}
function splitRows() {
  return [
    ["Mia Noor", "MN"],
    ["Noor Rahman", "NR"],
    ["Sam Lee", "SL"],
    ["Ava Kim", "AK"],
    ["Leo Martin", "LM"],
  ]
    .map(
      ([name, initials]) =>
        `<div class="split-row">${avatar(name, initials)}<span class="row-main"><span class="row-title">${name}</span></span><input class="split-value" value="$24.96" aria-label="${name} share"></div>`
    )
    .join("");
}
function settingRow(title, sub, route = "") {
  return `<button class="setting-row" ${route ? `data-route="${route}"` : ""}><span class="row-main"><span class="row-title">${title}</span>${sub ? `<span class="row-sub">${sub}</span>` : ""}</span>${I("chevron")}</button>`;
}
function groupScreen(name, meta, balanceLabel, balance, initials, recurringGroup = false) {
  return `<main class="screen" data-od-id="${name.toLowerCase().replaceAll(" ", "-")}-screen">${topbar(name, true, `<button class="icon-btn" data-toast="Group options opened" aria-label="Group options">•••</button>`)}<section class="group-header"><div><div class="group-icon-lg">${recurringGroup ? I("home") : I("globe")}</div><h1 class="large-title" style="margin-bottom:0">${name}</h1><div class="row-sub">${meta}</div></div><div class="avatar-stack">${avatar("Mia", "MN")}${avatar("Noor", "NR")}${avatar("Sam", "SL")}</div></section><div class="stat-pair"><div class="stat"><div class="stat-value ${balanceLabel.includes("owed") ? "positive" : "negative"}">${balance}</div><div class="stat-label">${balanceLabel}</div></div><div class="stat"><div class="stat-value">${recurringGroup ? "3" : "2"}</div><div class="stat-label">Open balances</div></div></div><div class="chips"><button class="chip active">Overview</button><button class="chip" data-route="activity">Activity</button><button class="chip" data-route="currencies">Currencies</button>${recurringGroup ? '<button class="chip" data-route="recurring">Recurring</button>' : ""}</div><h2 class="eyebrow">Balances</h2>${recurringGroup ? row("Leo Martin", "Electricity and rent", amount("You owe $31.40", "negative"), "friend", "LM") : row("Sam Lee", "Villa and airport transfer", amount("Owes you $128", "positive"), "friend", "SL") + row("Noor Rahman", "Villa deposit", amount("You owe $48", "negative"), "friend", "NR")}<h2 class="eyebrow">Latest</h2>${activityRows()}<button class="primary" style="margin-top:20px" data-route="add-expense">Add an expense</button></main>`;
}

function commandSheet() {
  return `<div class="sheet-backdrop ${state.command ? "open" : ""}" data-action="close-command"></div><section class="sheet ${state.command ? "open" : ""}" role="dialog" aria-modal="true" aria-label="Suma commands" data-od-id="command-sheet"><div class="grabber"></div><div class="search"><span>${I("search")}</span><input aria-label="Search Suma" placeholder="Find a person, group or expense"></div><div class="command-grid"><button class="command" data-route="friends"><span class="command-icon">${I("users")}</span>People</button><button class="command" data-route="activity"><span class="command-icon">${I("clock")}</span>Activity</button><button class="command" data-route="recurring"><span class="command-icon">${I("repeat")}</span>Recurring</button><button class="command" data-route="currencies"><span class="command-icon">${I("globe")}</span>Currencies</button></div><button class="primary" data-route="add-expense">${platform === "android" ? "Add expense" : "Add a new expense"}</button></section>`;
}
function render() {
  const template = screens[state.route] || screens.home;
  app.innerHTML =
    template() +
    commandSheet() +
    '<div class="snackbar" role="status" aria-live="polite"><span></span><button data-action="dismiss-toast">Dismiss</button></div>';
  document.title = `Suma · ${state.route.replaceAll("-", " ")}`;
}
function navigate(route) {
  if (route === state.route) return;
  state.stack.push(state.route);
  state.route = route;
  state.command = false;
  render();
}
function toast(message) {
  const bar = document.querySelector(".snackbar");
  if (!bar) return;
  bar.querySelector("span").textContent = message;
  bar.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => bar.classList.remove("show"), 3200);
}
document.addEventListener("click", (event) => {
  const route = event.target.closest("[data-route]")?.dataset.route;
  const action = event.target.closest("[data-action]")?.dataset.action;
  const message = event.target.closest("[data-toast]")?.dataset.toast;
  const split = event.target.closest("[data-split]")?.dataset.split;
  if (route) navigate(route);
  if (message) toast(message);
  if (split) {
    state.split = split;
    document
      .querySelectorAll("[data-split]")
      .forEach((button) => button.classList.toggle("active", button.dataset.split === split));
  }
  if (action === "back") {
    state.route = state.stack.pop() || "home";
    state.command = false;
    render();
  }
  if (action === "command") {
    state.command = true;
    document.querySelector(".sheet")?.classList.add("open");
    document.querySelector(".sheet-backdrop")?.classList.add("open");
  }
  if (action === "close-command") {
    state.command = false;
    document.querySelector(".sheet")?.classList.remove("open");
    document.querySelector(".sheet-backdrop")?.classList.remove("open");
  }
  if (action === "toggle") {
    const control = event.target.closest('[data-action="toggle"]');
    const enabled = control.getAttribute("aria-pressed") !== "true";
    control.setAttribute("aria-pressed", String(enabled));
    control.querySelector(".toggle")?.classList.toggle("on", enabled);
  }
  if (action === "dismiss-toast") document.querySelector(".snackbar")?.classList.remove("show");
});
document.addEventListener("submit", (event) => {
  const kind = event.target.dataset.submit;
  if (!kind) return;
  event.preventDefault();
  if (kind === "signup" || kind === "forgot") navigate("verify");
  else if (kind === "verify") navigate("profile-setup");
  else if (kind === "settle") {
    navigate("home");
    setTimeout(() => toast("Payment recorded · Undo"), 40);
  } else if (kind === "expense") {
    navigate("group-bali");
    setTimeout(() => toast("Villa groceries added"), 40);
  } else navigate("home");
});
render();
