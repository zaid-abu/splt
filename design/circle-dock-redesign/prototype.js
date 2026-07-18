(function () {
  "use strict";

  const SCREEN_REGISTRY = {
    welcome: {
      category: "Entry and account",
      type: "welcome",
      title: "Shared money, made lighter.",
      intro:
        "Split nights out, trips, rent, and recurring bills without turning friendship into accounting.",
      actions: [
        { label: "Create an account", href: "register.html", kind: "primary" },
        { label: "Sign in", href: "login.html", kind: "secondary" },
      ],
      note: "Social sign-in follows the same verification and profile setup lifecycle.",
    },
    login: {
      category: "Entry and account",
      type: "auth",
      title: "Welcome back.",
      intro: "Sign in to see balances, shared activity, and bills waiting for review.",
      topTitle: "Sign in",
      back: "welcome.html",
      fields: [
        { label: "Email", value: "abu@example.com" },
        { label: "Password", value: "************", meta: "Show" },
      ],
      actions: [
        { label: "Sign in", href: "home.html", kind: "primary" },
        { label: "Forgot password?", href: "forgot-password.html", kind: "secondary" },
      ],
      note: "Google and Apple sign-in continue through the same account setup states.",
    },
    register: {
      category: "Entry and account",
      type: "auth",
      title: "Start with you.",
      intro: "Your name helps friends recognize you. You can change it later.",
      topTitle: "Create account",
      back: "welcome.html",
      fields: [
        { label: "Name", value: "Abu Zaid" },
        { label: "Email", value: "abu@example.com" },
        { label: "Password", value: "************", meta: "Strong" },
      ],
      actions: [
        { label: "Continue", href: "verify-email.html", kind: "primary" },
        { label: "Already have an account? Sign in", href: "login.html", kind: "secondary" },
      ],
      note: "Use at least 8 characters with a number or symbol.",
    },
    "forgot-password": {
      category: "Entry and account",
      type: "auth",
      title: "Reset your password.",
      intro: "We will email a secure link that returns you to Splt to choose a new password.",
      topTitle: "Password recovery",
      back: "login.html",
      fields: [{ label: "Account email", value: "abu@example.com" }],
      actions: [
        { label: "Send recovery link", href: "reset-password.html", kind: "primary" },
        { label: "Back to sign in", href: "login.html", kind: "secondary" },
      ],
      note: "The recovery link expires after 60 minutes and can be requested again.",
    },
    "reset-password": {
      category: "Entry and account",
      type: "auth",
      title: "Choose a new password.",
      intro: "This recovery link was verified for abu@example.com.",
      topTitle: "New password",
      back: "forgot-password.html",
      fields: [
        { label: "New password", value: "************", meta: "Strong" },
        { label: "Confirm password", value: "************", meta: "Matches" },
      ],
      actions: [{ label: "Update password and sign in", href: "login.html", kind: "primary" }],
      note: "All other active sessions will be signed out after this change.",
    },
    "verify-email": {
      category: "Entry and account",
      type: "auth",
      title: "Check your inbox.",
      intro: "Enter the six-digit code sent to abu@example.com.",
      topTitle: "Verify email",
      back: "register.html",
      fields: [{ label: "Verification code", value: "284 716", meta: "Code accepted" }],
      actions: [{ label: "Verify email", href: "profile-setup.html", kind: "primary" }],
      note: "Your setup progress belongs to this account and is safe if you leave this screen.",
    },
    "profile-setup": {
      category: "Entry and account",
      type: "form",
      title: "Set up your profile.",
      intro: "Choose how friends see you and how Splt presents shared money.",
      topTitle: "Profile setup",
      back: "verify-email.html",
      identity: { initials: "AZ", name: "Abu Zaid", detail: "Add a profile photo" },
      fields: [
        { label: "Display name", value: "Abu Zaid" },
        { label: "Home currency", value: "US Dollar", meta: "USD" },
        { label: "Appearance", value: "Use device setting", meta: "Automatic" },
      ],
      actions: [{ label: "Continue", href: "first-action.html", kind: "primary" }],
    },
    "first-action": {
      category: "Entry and account",
      type: "list",
      title: "What would help first?",
      intro: "Choose one useful starting point. Everything else stays available from Home.",
      topTitle: "Make Splt yours",
      sections: [
        {
          title: "Start with an action",
          meta: "Optional",
          rows: [
            {
              icon: "groups",
              title: "Create a group",
              detail: "Start a trip, night out, or household",
              href: "group-create.html",
            },
            {
              icon: "person",
              title: "Add people",
              detail: "Find friends already using Splt",
              href: "person-add.html",
              tone: "green",
            },
            {
              icon: "plus",
              title: "Add your first expense",
              detail: "Choose a person or group in the flow",
              href: "expense-context.html",
              tone: "coral",
            },
            {
              icon: "calendar",
              title: "Schedule a recurring bill",
              detail: "Create it inside a household group",
              href: "schedule-create.html",
              tone: "amber",
            },
          ],
        },
      ],
      actions: [{ label: "Skip for now", href: "home.html", kind: "secondary" }],
    },
    home: {
      category: "Core shell",
      type: "shell",
      dock: "home",
      title: "Good evening, Abu.",
      kicker: "Saturday, July 18",
      intro: "Two balances and one bill need attention.",
      hero: {
        label: "Across your circles",
        value: "+$1,390.26",
        note: "Overall, you are owed money",
      },
      sections: [
        {
          title: "Where you stand",
          meta: "All circles",
          rows: [
            {
              icon: "CL",
              title: "Clingy",
              detail: "Ritwika owes you $1,206.00",
              value: "+$1,206",
              href: "group-overview.html",
            },
            {
              icon: "EP",
              title: "EIPP eipp",
              detail: "You owe Keran $17.87",
              value: "-$17.87",
              tone: "debt",
              href: "person-detail.html",
            },
          ],
        },
        {
          title: "Next up",
          meta: "Upcoming",
          rows: [
            {
              icon: "calendar",
              title: "Internet bill",
              detail: "Apartment - review tomorrow",
              value: "$84 review",
              tone: "warning",
              href: "schedule-review.html",
            },
          ],
        },
      ],
    },
    "circles-groups": {
      category: "Core shell",
      type: "shell",
      dock: "circles",
      title: "Circles",
      kicker: "Your network",
      segments: [
        { label: "Groups", target: "circles-groups.html", active: true },
        { label: "People", target: "circles-people.html" },
      ],
      search: "Search groups",
      sections: [
        {
          title: "Needs attention",
          meta: "2",
          rows: [
            {
              icon: "EP",
              title: "EIPP eipp",
              detail: "You owe Keran - active today",
              value: "-$17.87",
              tone: "debt",
              href: "group-overview.html",
            },
          ],
        },
        {
          title: "All groups",
          meta: "4 groups",
          rows: [
            {
              icon: "CL",
              title: "Clingy",
              detail: "4 people - active today",
              value: "+$1,206",
              href: "group-overview.html",
            },
            {
              icon: "AP",
              title: "Apartment",
              detail: "4 people - 2 upcoming bills",
              value: "-$284",
              tone: "debt",
              href: "group-overview.html",
              badgeTone: "coral",
            },
            {
              icon: "HD",
              title: "HighDense",
              detail: "5 people - no open balances",
              value: "Settled",
              tone: "neutral",
              href: "group-overview.html",
            },
          ],
        },
      ],
      actions: [{ label: "Create group", href: "group-create.html", kind: "secondary" }],
    },
    "circles-people": {
      category: "Core shell",
      type: "shell",
      dock: "circles",
      title: "Circles",
      kicker: "Your network",
      segments: [
        { label: "Groups", target: "circles-groups.html" },
        { label: "People", target: "circles-people.html", active: true },
      ],
      search: "Search people",
      sections: [
        {
          title: "Needs attention",
          meta: "2",
          rows: [
            {
              icon: "KG",
              title: "Keran",
              detail: "You owe from EIPP eipp",
              value: "-$17.87",
              tone: "debt",
              href: "person-detail.html",
              badgeTone: "coral",
            },
            {
              icon: "RS",
              title: "Ritwika",
              detail: "Owes you across 2 groups",
              value: "+$1,206",
              href: "person-detail.html",
              badgeTone: "green",
            },
          ],
        },
        {
          title: "All people",
          meta: "8 people",
          rows: [
            {
              icon: "MY",
              title: "Maya",
              detail: "Apartment - active today",
              value: "-$184",
              tone: "debt",
              href: "person-detail.html",
            },
            {
              icon: "OM",
              title: "Omar",
              detail: "2 shared groups - settled",
              value: "Settled",
              tone: "neutral",
              href: "person-detail.html",
            },
            {
              icon: "AB",
              title: "Abhishek",
              detail: "HighDense - active Jul 12",
              value: "+$110",
              href: "person-detail.html",
              badgeTone: "green",
            },
          ],
        },
      ],
      actions: [{ label: "Add person", href: "person-add.html", kind: "secondary" }],
    },
    "global-add": {
      category: "Core shell",
      type: "sheet",
      dock: "add",
      title: "What would you like to do?",
      intro: "Start with the action. Choose people and groups inside the focused flow.",
      tasks: [
        { label: "Add expense", icon: "plus", href: "expense-context.html", primary: true },
        { label: "Settle up", icon: "settle", href: "settlement-compose.html" },
        { label: "Create group", icon: "groups", href: "group-create.html" },
        { label: "Add person", icon: "person", href: "person-add.html" },
        { label: "Schedule expense", icon: "calendar", href: "schedule-create.html" },
      ],
    },
    "activity-timeline": {
      category: "Core shell",
      type: "shell",
      dock: "activity",
      title: "Activity",
      kicker: "What changed",
      segments: [
        { label: "Timeline", target: "activity-timeline.html", active: true },
        { label: "Upcoming", target: "activity-upcoming.html" },
      ],
      search: "Search activity",
      sections: [
        {
          title: "Today",
          meta: "3 events",
          rows: [
            {
              icon: "receipt",
              title: "Dinner at Farzi",
              detail: "8:42 PM - You paid $120 - Clingy",
              value: "+$80 lent",
              href: "expense-detail.html",
              badgeTone: "coral",
            },
            {
              icon: "settle",
              title: "Omar paid you $40",
              detail: "4:10 PM - Apartment - cash",
              value: "Recorded",
              tone: "neutral",
              href: "settlement-success.html",
              badgeTone: "green",
            },
            {
              icon: "person",
              title: "Ritwika joined Clingy",
              detail: "9:00 AM - invited by you",
              value: "Group event",
              tone: "neutral",
              href: "group-overview.html",
            },
          ],
        },
      ],
    },
    "activity-upcoming": {
      category: "Core shell",
      type: "shell",
      dock: "activity",
      title: "Activity",
      kicker: "What happens next",
      segments: [
        { label: "Timeline", target: "activity-timeline.html" },
        { label: "Upcoming", target: "activity-upcoming.html", active: true },
      ],
      sections: [
        {
          title: "Needs review",
          meta: "1",
          rows: [
            {
              icon: "calendar",
              title: "Power bill",
              detail: "Apartment - due Monday - variable amount",
              value: "Review ~$96",
              tone: "warning",
              href: "schedule-review.html",
              badgeTone: "amber",
            },
          ],
        },
        {
          title: "August",
          meta: "3 expected",
          rows: [
            {
              icon: "home",
              title: "Rent",
              detail: "Aug 1 - Apartment - posts automatically",
              value: "$640",
              tone: "neutral",
              href: "schedule-detail.html",
            },
            {
              icon: "calendar",
              title: "Internet bill",
              detail: "Aug 1 - review two days before",
              value: "$84",
              tone: "neutral",
              href: "schedule-detail.html",
              badgeTone: "green",
            },
            {
              icon: "bell",
              title: "Remind Keran",
              detail: "Aug 3 - EIPP eipp balance",
              value: "$17.87 due",
              tone: "debt",
              href: "person-detail.html",
              badgeTone: "coral",
            },
          ],
        },
      ],
    },
    more: {
      category: "Core shell",
      type: "shell",
      dock: "more",
      title: "More",
      kicker: "Splt",
      sections: [
        {
          title: "Your account",
          rows: [
            { icon: "AZ", title: "Abu Zaid", detail: "Profile and security", href: "profile.html" },
            {
              icon: "bell",
              title: "Notifications",
              detail: "2 requests need a response",
              value: "2 new",
              tone: "debt",
              href: "notifications.html",
              badgeTone: "coral",
            },
          ],
        },
        {
          title: "Money tools",
          rows: [
            {
              icon: "chart",
              title: "Insights",
              detail: "Spending trends and categories",
              href: "insights.html",
            },
            {
              icon: "currency",
              title: "Currencies",
              detail: "USD - rates updated today",
              href: "currencies.html",
              badgeTone: "green",
            },
            {
              icon: "download",
              title: "Export data",
              detail: "Generate a copy of your Splt history",
              href: "export.html",
            },
          ],
        },
        {
          title: "Preferences and support",
          rows: [
            { icon: "sun", title: "Appearance", detail: "System setting", href: "appearance.html" },
            {
              icon: "help",
              title: "Help and support",
              detail: "Guides, contact, terms, and privacy",
              href: "help.html",
            },
          ],
        },
      ],
    },
    "group-create": {
      category: "Groups and people",
      type: "form",
      title: "Create a circle.",
      intro: "Set up the group first. Invitations are sent only after you create it.",
      topTitle: "New group",
      back: "circles-groups.html",
      fields: [
        { label: "Group name", value: "Apartment" },
        { label: "Group kind", value: "Household", meta: "Optional label" },
        { label: "Currency", value: "US Dollar", meta: "USD" },
        { label: "Members", value: "Maya, Omar, Leila", meta: "3 selected" },
      ],
      actions: [
        { label: "Create group and invite 3 people", href: "group-overview.html", kind: "primary" },
      ],
      note: "No invitations are sent until this final action is confirmed.",
    },
    "group-overview": {
      category: "Groups and people",
      type: "detail",
      title: "Apartment",
      topTitle: "Apartment",
      back: "circles-groups.html",
      segments: [
        { label: "Overview", target: "group-overview.html", active: true },
        { label: "Expenses", target: "group-expenses.html" },
        { label: "Schedule", target: "group-schedule.html" },
      ],
      identity: { initials: "AP", name: "Apartment", detail: "4 people - Household" },
      hero: {
        label: "Your position in Apartment",
        value: "-$284.00",
        note: "You owe Maya $184 and Omar $100",
      },
      quickActions: [
        { label: "Add expense", icon: "plus", href: "expense-compose.html" },
        { label: "Settle", icon: "settle", href: "settlement-compose.html" },
        { label: "Schedule", icon: "calendar", href: "schedule-create.html" },
      ],
      sections: [
        {
          title: "People",
          meta: "Pairwise balances",
          rows: [
            {
              icon: "MY",
              title: "Maya",
              detail: "Paid rent and shared supplies",
              value: "You owe $184",
              tone: "debt",
              href: "person-detail.html",
              badgeTone: "coral",
            },
            {
              icon: "OM",
              title: "Omar",
              detail: "Paid the internet bill",
              value: "You owe $100",
              tone: "debt",
              href: "person-detail.html",
            },
          ],
        },
        {
          title: "Upcoming",
          meta: "2 schedules",
          rows: [
            {
              icon: "calendar",
              title: "Power bill",
              detail: "Needs amount - due Monday",
              value: "Review",
              tone: "warning",
              href: "schedule-review.html",
              badgeTone: "amber",
            },
          ],
        },
      ],
    },
    "group-expenses": {
      category: "Groups and people",
      type: "detail",
      title: "Apartment expenses",
      topTitle: "Apartment",
      back: "group-overview.html",
      segments: [
        { label: "Overview", target: "group-overview.html" },
        { label: "Expenses", target: "group-expenses.html", active: true },
        { label: "Schedule", target: "group-schedule.html" },
      ],
      search: "Search Apartment expenses",
      sections: [
        {
          title: "July 2026",
          meta: "Your consequences",
          rows: [
            {
              icon: "receipt",
              title: "Shared supplies",
              detail: "Today - Maya paid",
              value: "-$24 your share",
              tone: "debt",
              href: "expense-detail.html",
              badgeTone: "coral",
            },
            {
              icon: "home",
              title: "Rent",
              detail: "Jul 1 - Maya paid",
              value: "-$160 your share",
              tone: "debt",
              href: "expense-detail.html",
            },
            {
              icon: "currency",
              title: "Internet",
              detail: "Jul 1 - Omar paid",
              value: "-$21 your share",
              tone: "debt",
              href: "expense-detail.html",
              badgeTone: "green",
            },
          ],
        },
        {
          title: "June 2026",
          rows: [
            {
              icon: "bolt",
              title: "Power bill",
              detail: "Jun 26 - You paid",
              value: "+$96 you lent",
              href: "expense-detail.html",
            },
          ],
        },
      ],
      actions: [{ label: "Add expense", href: "expense-compose.html", kind: "primary" }],
    },
    "group-schedule": {
      category: "Groups and people",
      type: "detail",
      title: "Apartment schedule",
      topTitle: "Apartment",
      back: "group-overview.html",
      segments: [
        { label: "Overview", target: "group-overview.html" },
        { label: "Expenses", target: "group-expenses.html" },
        { label: "Schedule", target: "group-schedule.html", active: true },
      ],
      sections: [
        {
          title: "Needs review",
          meta: "1",
          rows: [
            {
              icon: "bolt",
              title: "Power bill",
              detail: "Due Monday - variable amount - Maya pays",
              value: "Review ~$96",
              tone: "warning",
              href: "schedule-review.html",
              badgeTone: "amber",
            },
          ],
        },
        {
          title: "Active schedules",
          meta: "3",
          rows: [
            {
              icon: "home",
              title: "Rent",
              detail: "Monthly on day 1 - posts automatically",
              value: "$640 - Aug 1",
              tone: "neutral",
              href: "schedule-detail.html",
            },
            {
              icon: "currency",
              title: "Internet",
              detail: "Monthly on day 1 - review first",
              value: "$84 - Aug 1",
              tone: "neutral",
              href: "schedule-detail.html",
              badgeTone: "green",
            },
          ],
        },
        {
          title: "Paused",
          meta: "1",
          rows: [
            {
              icon: "calendar",
              title: "Cleaning",
              detail: "Paused Jun 30 - every two weeks",
              value: "$60 paused",
              tone: "neutral",
              href: "schedule-detail.html",
            },
          ],
        },
      ],
      actions: [{ label: "Schedule expense", href: "schedule-create.html", kind: "primary" }],
    },
    "group-settings": {
      category: "Groups and people",
      type: "form",
      title: "Group settings",
      intro: "Changes apply to Apartment after the current group data has loaded.",
      topTitle: "Apartment",
      back: "group-overview.html",
      fields: [
        { label: "Group name", value: "Apartment" },
        { label: "Group kind", value: "Household" },
        { label: "Default currency", value: "US Dollar", meta: "USD" },
        { label: "Members", value: "You, Maya, Omar, Leila", meta: "4 people" },
        { label: "New expense alerts", value: "On", meta: "Group preference" },
      ],
      actions: [
        { label: "Save changes", href: "group-overview.html", kind: "primary" },
        { label: "Leave Apartment", href: "circles-groups.html", kind: "danger" },
      ],
      note: "Deleting the group is available only to its creator after a separate confirmation.",
    },
    "person-add": {
      category: "Groups and people",
      type: "form",
      title: "Add someone you trust.",
      intro: "Search by email or share a private invite link.",
      topTitle: "Add person",
      back: "circles-people.html",
      fields: [{ label: "Email address", value: "maya@example.com", meta: "Splt member found" }],
      sections: [
        {
          title: "Match",
          rows: [
            {
              icon: "MY",
              title: "Maya Hassan",
              detail: "maya@example.com - 1 mutual group",
              value: "Ready",
              tone: "neutral",
              href: "person-detail.html",
              badgeTone: "green",
            },
          ],
        },
      ],
      actions: [
        { label: "Send friend request", href: "person-detail.html", kind: "primary" },
        { label: "Share invite link", demo: "Invite link ready to share", kind: "secondary" },
      ],
    },
    "person-detail": {
      category: "Groups and people",
      type: "detail",
      title: "Ritwika",
      topTitle: "Person",
      back: "circles-people.html",
      identity: { initials: "RS", name: "Ritwika", detail: "3 shared groups - active today" },
      hero: {
        label: "Across everything with Ritwika",
        value: "+$1,206.00",
        note: "Ritwika owes you",
      },
      quickActions: [
        { label: "Remind", icon: "bell", demo: "Reminder preview opened" },
        { label: "Add expense", icon: "plus", href: "expense-compose.html" },
        { label: "Settle", icon: "settle", href: "settlement-compose.html" },
      ],
      sections: [
        {
          title: "By group",
          meta: "3 groups",
          rows: [
            {
              icon: "CL",
              title: "Clingy",
              detail: "Ritwika owes you in this group",
              value: "+$1,206",
              href: "group-overview.html",
            },
            {
              icon: "HD",
              title: "HighDense",
              detail: "No open balance in this group",
              value: "Settled",
              tone: "neutral",
              href: "group-overview.html",
              badgeTone: "coral",
            },
          ],
        },
        {
          title: "Recent movement",
          meta: "View all",
          rows: [
            {
              icon: "receipt",
              title: "Dinner at Farzi",
              detail: "You paid - today",
              value: "+$40 lent",
              href: "expense-detail.html",
              badgeTone: "coral",
            },
          ],
        },
      ],
    },
    "expense-context": {
      category: "Expenses and settlements",
      type: "list",
      title: "Choose a circle",
      intro: "Who does this expense belong to? Contextual Add buttons skip this step.",
      topTitle: "Add expense",
      back: "global-add.html",
      search: "Search groups and people",
      sections: [
        {
          title: "Recent",
          rows: [
            {
              icon: "CL",
              title: "Clingy",
              detail: "Group - 4 people - active today",
              href: "expense-compose.html",
            },
            {
              icon: "AP",
              title: "Apartment",
              detail: "Group - 4 people - household",
              href: "expense-compose.html",
              badgeTone: "coral",
            },
          ],
        },
        {
          title: "People",
          rows: [
            {
              icon: "MY",
              title: "Maya",
              detail: "Person - owes you $42.00",
              href: "expense-compose.html",
              badgeTone: "green",
            },
          ],
        },
      ],
    },
    "expense-compose": {
      category: "Expenses and settlements",
      type: "form",
      title: "Dinner at Farzi",
      topTitle: "Add expense",
      back: "expense-context.html",
      amount: { value: "$120.00", detail: "Clingy - Food - Today" },
      fields: [
        { label: "Description", value: "Dinner at Farzi" },
        { label: "Paid by", value: "You", meta: "Covered $120.00" },
        { label: "Split", value: "Equally", meta: "3 included", href: "expense-split.html" },
        { label: "Date", value: "Today", meta: "July 18, 2026" },
        { label: "Category", value: "Food", meta: "Used for insights" },
        { label: "Receipt", value: "Add a receipt", meta: "Camera or library" },
      ],
      actions: [{ label: "Add expense - $120.00", href: "expense-success.html", kind: "primary" }],
      note: "Ritwika and Keran will each owe you $40.00.",
    },
    "expense-split": {
      category: "Expenses and settlements",
      type: "form",
      title: "Split $120.00",
      intro: "Choose who is included, then how each share is calculated.",
      topTitle: "Split expense",
      back: "expense-compose.html",
      segments: [
        { label: "Equal", active: true },
        { label: "Amounts" },
        { label: "Percent" },
        { label: "Shares" },
      ],
      sections: [
        {
          title: "3 included",
          meta: "$120.00 assigned",
          rows: [
            {
              icon: "AZ",
              title: "You",
              detail: "Included - 1 share",
              value: "$40.00",
              tone: "neutral",
              badgeTone: "green",
              demo: "You remain included",
            },
            {
              icon: "RS",
              title: "Ritwika",
              detail: "Included - 1 share",
              value: "$40.00",
              tone: "neutral",
              badgeTone: "coral",
              demo: "Ritwika inclusion toggled",
            },
            {
              icon: "KG",
              title: "Keran",
              detail: "Included - 1 share",
              value: "$40.00",
              tone: "neutral",
              demo: "Keran inclusion toggled",
            },
          ],
        },
      ],
      actions: [{ label: "Apply split - $120.00", href: "expense-compose.html", kind: "primary" }],
      note: "Equal, exact amounts, percentages, and weighted shares use distinct calculations.",
    },
    "expense-success": {
      category: "Expenses and settlements",
      type: "success",
      title: "Expense added",
      intro: "Dinner at Farzi was added to Clingy. Ritwika and Keran each owe you $40.00.",
      receipt: [
        { label: "Total", value: "$120.00" },
        { label: "Paid by", value: "You" },
        { label: "Your share", value: "$40.00" },
        { label: "You lent", value: "$80.00", tone: "credit" },
      ],
      actions: [
        { label: "View expense", href: "expense-detail.html", kind: "secondary" },
        { label: "Back to Clingy", href: "group-overview.html", kind: "primary" },
      ],
      note: "Undo removes this newly created expense while permissions allow.",
    },
    "expense-detail": {
      category: "Expenses and settlements",
      type: "detail",
      title: "Dinner at Farzi",
      topTitle: "Expense",
      back: "group-expenses.html",
      amount: { value: "$120.00", detail: "Clingy - Today at 8:42 PM - Food" },
      receipt: [
        { label: "Paid by", value: "You" },
        { label: "Your actual share", value: "$40.00" },
        { label: "You lent", value: "$80.00", tone: "credit" },
        { label: "Split method", value: "Equal - 3 included" },
      ],
      sections: [
        {
          title: "Split breakdown",
          rows: [
            {
              icon: "AZ",
              title: "You",
              detail: "Paid $120.00 - share $40.00",
              value: "+$80 lent",
              badgeTone: "green",
            },
            {
              icon: "RS",
              title: "Ritwika",
              detail: "Owes you for her actual share",
              value: "$40 owed",
              tone: "debt",
              badgeTone: "coral",
            },
            {
              icon: "KG",
              title: "Keran",
              detail: "Owes you for his actual share",
              value: "$40 owed",
              tone: "debt",
            },
          ],
        },
        {
          title: "Receipt and comments",
          meta: "1 attachment",
          rows: [
            {
              icon: "receipt",
              title: "Receipt attached",
              detail: "Open the full image - 1 comment",
              value: "View",
              tone: "neutral",
              demo: "Receipt viewer opened",
            },
          ],
        },
      ],
      actions: [
        { label: "Edit expense", href: "expense-edit.html", kind: "secondary" },
        { label: "Settle balance", href: "settlement-compose.html", kind: "primary" },
      ],
    },
    "expense-edit": {
      category: "Expenses and settlements",
      type: "form",
      title: "Edit Dinner at Farzi",
      intro: "Changes update the existing expense and recalculate each open balance.",
      topTitle: "Edit expense",
      back: "expense-detail.html",
      amount: { value: "$120.00", detail: "Current total" },
      fields: [
        { label: "Description", value: "Dinner at Farzi" },
        { label: "Paid by", value: "You" },
        { label: "Split", value: "Equal", meta: "3 included", href: "expense-split.html" },
        { label: "Date", value: "July 18, 2026" },
        { label: "Category", value: "Food" },
        { label: "Receipt", value: "1 image attached", meta: "Replace or remove" },
      ],
      actions: [
        { label: "Save changes", href: "expense-detail.html", kind: "primary" },
        { label: "Delete expense", demo: "Delete confirmation opened", kind: "danger" },
      ],
      note: "Ritwika and Keran will be notified if their shares change.",
    },
    "expense-list": {
      category: "Expenses and settlements",
      type: "list",
      title: "Food expenses",
      intro: "Your share of Food spending in July across all circles.",
      topTitle: "Filtered expenses",
      back: "insights.html",
      search: "Search 7 food expenses",
      segments: [{ label: "Your share", active: true }, { label: "Total value" }],
      hero: {
        label: "Your share of Food spending",
        value: "$219.40",
        note: "7 expenses - July 2026",
      },
      sections: [
        {
          title: "July",
          meta: "7 expenses",
          rows: [
            {
              icon: "receipt",
              title: "Dinner at Farzi",
              detail: "Clingy - you paid $120.00",
              value: "$40 your share",
              tone: "neutral",
              href: "expense-detail.html",
              badgeTone: "coral",
            },
            {
              icon: "receipt",
              title: "Groceries",
              detail: "Apartment - Maya paid $186.40",
              value: "$46.60 your share",
              tone: "debt",
              href: "expense-detail.html",
              badgeTone: "green",
            },
            {
              icon: "receipt",
              title: "Coffee run",
              detail: "Ritwika - you paid $28.00",
              value: "$14 your share",
              tone: "neutral",
              href: "expense-detail.html",
            },
          ],
        },
      ],
    },
    "settlement-compose": {
      category: "Expenses and settlements",
      type: "form",
      title: "You pay Keran",
      intro: "Record how money changed hands outside Splt.",
      topTitle: "Settle up",
      back: "person-detail.html",
      amount: { value: "$17.87", detail: "Full open balance across EIPP eipp" },
      segments: [{ label: "Full", active: true }, { label: "Half" }, { label: "Custom" }],
      fields: [
        { label: "Direction", value: "You pay Keran", meta: "Cannot reverse an open debt" },
        { label: "Method", value: "Cash", meta: "External settlement" },
        { label: "Applies to", value: "EIPP eipp", meta: "Settles this group balance" },
        { label: "Note", value: "Paid after dinner", meta: "Optional" },
      ],
      actions: [{ label: "Review settlement", href: "settlement-review.html", kind: "primary" }],
      note: "The amount cannot exceed the $17.87 open balance.",
    },
    "settlement-review": {
      category: "Expenses and settlements",
      type: "detail",
      title: "Review settlement",
      intro: "Splt records this cash payment. It does not move money.",
      topTitle: "Confirm",
      back: "settlement-compose.html",
      hero: { label: "You record paying Keran", value: "$17.87", note: "Cash - EIPP eipp" },
      receipt: [
        { label: "From", value: "You" },
        { label: "To", value: "Keran" },
        { label: "Group", value: "EIPP eipp" },
        { label: "Balance after", value: "$0.00 - settled", tone: "credit" },
      ],
      actions: [
        { label: "Record settlement", href: "settlement-success.html", kind: "primary" },
        { label: "Change details", href: "settlement-compose.html", kind: "secondary" },
      ],
    },
    "settlement-success": {
      category: "Expenses and settlements",
      type: "success",
      title: "Settlement recorded",
      intro: "You paid Keran $17.87 in cash. Your EIPP eipp balance is now settled.",
      receipt: [
        { label: "Recorded amount", value: "$17.87" },
        { label: "Direction", value: "You paid Keran" },
        { label: "Method", value: "Cash - external" },
        { label: "Result", value: "$0.00 open balance", tone: "credit" },
      ],
      actions: [
        { label: "View relationship", href: "person-detail.html", kind: "primary" },
        { label: "Back to EIPP eipp", href: "group-overview.html", kind: "secondary" },
      ],
    },
    "schedule-create": {
      category: "Recurring",
      type: "form",
      title: "Schedule an expense",
      intro: "Recurring work stays inside Apartment and appears globally in Upcoming.",
      topTitle: "New schedule",
      back: "group-schedule.html",
      amount: { value: "$84.00", detail: "Fixed monthly estimate" },
      fields: [
        { label: "Description", value: "Internet bill" },
        { label: "Amount type", value: "Fixed amount", meta: "$84.00" },
        { label: "Repeats", value: "Monthly", meta: "Every 1 month" },
        { label: "Next date", value: "August 1, 2026" },
        { label: "Paid and split", value: "Maya pays", meta: "4 equal shares" },
        { label: "Reminder", value: "2 days before" },
        { label: "Posting mode", value: "Review before posting", meta: "Recommended" },
      ],
      actions: [{ label: "Create schedule", href: "schedule-detail.html", kind: "primary" }],
      note: "Variable schedules default to review before any expense is posted.",
    },
    "schedule-detail": {
      category: "Recurring",
      type: "detail",
      title: "Internet bill",
      topTitle: "Schedule",
      back: "group-schedule.html",
      hero: {
        label: "Active - review before posting",
        value: "$84.00",
        note: "Monthly on day 1 - Apartment",
      },
      receipt: [
        { label: "Paid by", value: "Maya" },
        { label: "Split", value: "4 equal shares" },
        { label: "Reminder", value: "2 days before" },
        { label: "Next review", value: "July 30, 2026", tone: "warning" },
      ],
      sections: [
        {
          title: "Future occurrences",
          meta: "Next 3",
          rows: [
            {
              icon: "calendar",
              title: "August 1",
              detail: "Review opens July 30",
              value: "$84 expected",
              tone: "neutral",
              href: "schedule-review.html",
            },
            {
              icon: "calendar",
              title: "September 1",
              detail: "Review opens August 30",
              value: "$84 expected",
              tone: "neutral",
            },
          ],
        },
        {
          title: "Generated expenses",
          meta: "6 posted",
          rows: [
            {
              icon: "receipt",
              title: "Internet - July",
              detail: "Posted Jul 1 - Omar paid",
              value: "$84 total",
              tone: "neutral",
              href: "expense-detail.html",
              badgeTone: "green",
            },
          ],
        },
      ],
      actions: [
        { label: "Edit schedule", href: "schedule-edit.html", kind: "secondary" },
        { label: "Pause schedule", demo: "Pause confirmation opened", kind: "danger" },
      ],
    },
    "schedule-edit": {
      category: "Recurring",
      type: "form",
      title: "Edit Internet bill",
      intro: "Future occurrences use these changes. Posted expenses stay unchanged.",
      topTitle: "Edit schedule",
      back: "schedule-detail.html",
      amount: { value: "$84.00", detail: "Current fixed amount" },
      fields: [
        { label: "Description", value: "Internet bill" },
        { label: "Amount type", value: "Fixed amount" },
        { label: "Frequency", value: "Every month on day 1" },
        { label: "Paid by", value: "Maya" },
        { label: "Split", value: "Equal", meta: "You, Maya, Omar, Leila" },
        { label: "Posting mode", value: "Review before posting" },
      ],
      actions: [
        { label: "Save future schedule", href: "schedule-detail.html", kind: "primary" },
        { label: "Delete schedule", demo: "Delete schedule confirmation opened", kind: "danger" },
      ],
    },
    "schedule-review": {
      category: "Recurring",
      type: "form",
      title: "Review Power bill",
      intro: "Confirm the variable amount and details before creating this expense.",
      topTitle: "Scheduled review",
      back: "activity-upcoming.html",
      hero: {
        label: "Needs review - due Monday",
        value: "$96.40",
        note: "Apartment - expected about $96",
        tone: "warning",
      },
      fields: [
        { label: "Final amount", value: "$96.40", meta: "Updated from estimate" },
        { label: "Paid by", value: "Maya" },
        { label: "Split", value: "Equal", meta: "4 people - $24.10 each" },
        { label: "Category and date", value: "Utilities", meta: "July 20, 2026" },
        { label: "Next occurrence", value: "August 20", meta: "Schedule continues" },
      ],
      actions: [{ label: "Post expense - $96.40", href: "expense-success.html", kind: "primary" }],
      note: "Posting this occurrence does not change the next scheduled date.",
    },
    notifications: {
      category: "Secondary tools",
      type: "list",
      title: "Notifications",
      intro: "Requests, scheduled reviews, and important account events that need action.",
      topTitle: "Notifications",
      back: "more.html",
      sections: [
        {
          title: "Needs a response",
          meta: "2 new",
          rows: [
            {
              icon: "MY",
              title: "Maya invited you",
              detail: "Apartment - Join or decline the household group",
              value: "Respond",
              tone: "warning",
              demo: "Invitation actions opened",
              badgeTone: "green",
            },
            {
              icon: "RS",
              title: "Ritwika sent a request",
              detail: "Accept or decline this friend connection",
              value: "Respond",
              tone: "warning",
              demo: "Friend request actions opened",
              badgeTone: "coral",
            },
          ],
        },
        {
          title: "Earlier",
          rows: [
            {
              icon: "settle",
              title: "Settlement recorded",
              detail: "Keran - $17.87 - yesterday",
              value: "View",
              tone: "neutral",
              href: "settlement-success.html",
            },
            {
              icon: "calendar",
              title: "Internet bill is ready",
              detail: "Apartment - review by tomorrow",
              value: "Review",
              tone: "warning",
              href: "schedule-review.html",
              badgeTone: "amber",
            },
          ],
        },
      ],
      actions: [
        { label: "Notification settings", href: "notification-settings.html", kind: "secondary" },
      ],
    },
    insights: {
      category: "Secondary tools",
      type: "insight",
      title: "Insights",
      intro: "Every aggregate below represents your share unless explicitly stated otherwise.",
      topTitle: "Insights",
      back: "more.html",
      segments: [
        { label: "Week" },
        { label: "Month", active: true },
        { label: "3 months" },
        { label: "Year" },
      ],
      hero: {
        label: "Your share of spending - July",
        value: "$842.60",
        note: "18 expenses - down 12% from June",
      },
      chart: [38, 61, 48, 82, 67, 49],
      sections: [
        {
          title: "Top categories",
          meta: "Your share",
          rows: [
            {
              icon: "home",
              title: "Housing",
              detail: "6 expenses - 51% of your share",
              value: "$430",
              tone: "neutral",
              href: "expense-list.html",
              badgeTone: "coral",
            },
            {
              icon: "receipt",
              title: "Food",
              detail: "7 expenses - 26% of your share",
              value: "$219",
              tone: "neutral",
              href: "expense-list.html",
              badgeTone: "green",
            },
            {
              icon: "arrow",
              title: "Transport",
              detail: "3 expenses - 14% of your share",
              value: "$118",
              tone: "neutral",
              href: "expense-list.html",
            },
          ],
        },
      ],
    },
    currencies: {
      category: "Secondary tools",
      type: "list",
      title: "Currencies",
      intro: "Choose your home currency and understand when conversion rates were last refreshed.",
      topTitle: "Currencies",
      back: "more.html",
      sections: [
        {
          title: "Home currency",
          meta: "Current",
          rows: [
            {
              icon: "currency",
              title: "US Dollar",
              detail: "USD - used for overall balances",
              value: "Selected",
              tone: "neutral",
              demo: "USD is already your home currency",
              badgeTone: "green",
            },
          ],
        },
        {
          title: "Available currencies",
          meta: "Rates live - 9:05 AM",
          rows: [
            {
              icon: "EUR",
              title: "Euro",
              detail: "1 USD = 0.8612 EUR - live rate",
              value: "Choose",
              tone: "neutral",
              demo: "Home currency confirmation opened",
            },
            {
              icon: "INR",
              title: "Indian Rupee",
              detail: "1 USD = 83.41 INR - live rate",
              value: "Choose",
              tone: "neutral",
              demo: "Home currency confirmation opened",
              badgeTone: "coral",
            },
            {
              icon: "GBP",
              title: "British Pound",
              detail: "1 USD = 0.7441 GBP - fallback cached rate",
              value: "Cached",
              tone: "warning",
              demo: "Rate freshness details opened",
              badgeTone: "amber",
            },
          ],
        },
      ],
    },
    profile: {
      category: "Secondary tools",
      type: "detail",
      title: "Abu Zaid",
      topTitle: "Profile",
      back: "more.html",
      identity: {
        initials: "AZ",
        name: "Abu Zaid",
        detail: "abu@example.com - member since March 2025",
      },
      sections: [
        {
          title: "Account",
          rows: [
            {
              icon: "person",
              title: "Personal details",
              detail: "Photo, display name, and email",
              href: "profile-edit.html",
            },
            {
              icon: "lock",
              title: "Security",
              detail: "Password, biometrics, and active sessions",
              href: "security.html",
              badgeTone: "green",
            },
            {
              icon: "bell",
              title: "Notifications",
              detail: "Requests, expenses, and schedules",
              href: "notification-settings.html",
              badgeTone: "coral",
            },
          ],
        },
        {
          title: "Data",
          rows: [
            {
              icon: "download",
              title: "Export your data",
              detail: "Expenses, groups, and account history",
              href: "export.html",
            },
          ],
        },
      ],
      actions: [{ label: "Edit profile", href: "profile-edit.html", kind: "primary" }],
    },
    "profile-edit": {
      category: "Secondary tools",
      type: "form",
      title: "Edit profile",
      intro: "Update the identity friends see across shared circles.",
      topTitle: "Personal details",
      back: "profile.html",
      identity: { initials: "AZ", name: "Abu Zaid", detail: "Change profile photo" },
      fields: [
        { label: "Display name", value: "Abu Zaid" },
        { label: "Email", value: "abu@example.com", meta: "Verified" },
        { label: "Home currency", value: "US Dollar", meta: "Change in Currencies" },
      ],
      actions: [{ label: "Save profile", href: "profile.html", kind: "primary" }],
      note: "Changing your email starts a new verification step before it takes effect.",
    },
    security: {
      category: "Secondary tools",
      type: "form",
      title: "Security",
      intro: "Protect this account and review where it is currently signed in.",
      topTitle: "Profile and security",
      back: "profile.html",
      fields: [
        { label: "Password", value: "Updated 34 days ago", meta: "Change" },
        { label: "Face ID", value: "Use Face ID to unlock", meta: "On" },
        { label: "This iPhone", value: "New York - active now", meta: "Current session" },
        { label: "Pixel 9", value: "New York - active yesterday", meta: "Sign out" },
      ],
      actions: [
        { label: "Change password", demo: "Password update form opened", kind: "secondary" },
        { label: "Delete account", demo: "Account deletion confirmation opened", kind: "danger" },
      ],
      note: "Account deletion explains retained shared history before final confirmation.",
    },
    "notification-settings": {
      category: "Secondary tools",
      type: "form",
      title: "Notification settings",
      intro: "Choose which real events may interrupt you. Required security events stay on.",
      topTitle: "Notifications",
      back: "profile.html",
      fields: [
        { label: "Friend and group requests", value: "Push and inbox", meta: "On" },
        { label: "New expenses", value: "Push and inbox", meta: "On" },
        { label: "Scheduled reviews", value: "2 days before", meta: "On" },
        { label: "Settlement updates", value: "Inbox only", meta: "On" },
        { label: "Account security", value: "Push and email", meta: "Required" },
      ],
      actions: [{ label: "Save notification settings", href: "profile.html", kind: "primary" }],
    },
    appearance: {
      category: "Secondary tools",
      type: "form",
      title: "Appearance",
      intro: "Preview Splt in light or dark while respecting your device by default.",
      topTitle: "Appearance",
      back: "more.html",
      segments: [{ label: "System", active: true }, { label: "Light" }, { label: "Dark" }],
      fields: [
        { label: "Theme", value: "Use device setting", meta: "Automatic" },
        { label: "Platform preview", value: "Native to this device", meta: "iOS treatment" },
        {
          label: "Motion",
          value: "Follow accessibility setting",
          meta: "Reduced motion supported",
        },
      ],
      actions: [{ label: "Save appearance", href: "more.html", kind: "primary" }],
      note: "Use the package controls in the launcher to inspect both full visual themes.",
    },
    export: {
      category: "Secondary tools",
      type: "form",
      title: "Export your Splt data",
      intro: "Generate a private copy of expenses, settlements, groups, and account history.",
      topTitle: "Export data",
      back: "more.html",
      fields: [
        { label: "Format", value: "CSV archive", meta: "Separate files by record type" },
        { label: "Date range", value: "All time", meta: "Mar 2025 to Jul 2026" },
        {
          label: "Includes",
          value: "Expenses, splits, settlements",
          meta: "Plus groups and people",
        },
        {
          label: "Delivery",
          value: "Download on this device",
          meta: "Private link expires in 24h",
        },
      ],
      actions: [
        { label: "Generate export", demo: "Export generation started - 42%", kind: "primary" },
      ],
      note: "Generation progress, completion, expiration, and recoverable errors are explicit states.",
    },
    help: {
      category: "Secondary tools",
      type: "list",
      title: "How can we help?",
      intro: "Search practical guides or contact a person when the answer is not here.",
      topTitle: "Help and support",
      back: "more.html",
      search: "Search guides and questions",
      sections: [
        {
          title: "Popular guides",
          rows: [
            {
              icon: "receipt",
              title: "How expense splits work",
              detail: "Equal, exact, percentage, and shares",
              demo: "Expense split guide opened",
            },
            {
              icon: "settle",
              title: "Recording a settlement",
              detail: "Splt records external payments",
              demo: "Settlement guide opened",
              badgeTone: "green",
            },
            {
              icon: "calendar",
              title: "Recurring bills and reviews",
              detail: "Schedules inside groups",
              demo: "Recurring guide opened",
              badgeTone: "coral",
            },
          ],
        },
        {
          title: "Contact and policies",
          rows: [
            {
              icon: "help",
              title: "Contact support",
              detail: "Email support@splt.app",
              demo: "Support email composer opened",
            },
            {
              icon: "lock",
              title: "Terms and privacy",
              detail: "Current policies and effective dates",
              href: "legal.html",
            },
          ],
        },
      ],
    },
    legal: {
      category: "Secondary tools",
      type: "detail",
      title: "Terms and privacy",
      intro: "Plain-language summaries link to the complete policies that govern Splt.",
      topTitle: "Legal",
      back: "help.html",
      sections: [
        {
          title: "Policies",
          meta: "Effective July 1, 2026",
          rows: [
            {
              icon: "document",
              title: "Terms of Service",
              detail: "Your agreement for using Splt",
              value: "Read",
              tone: "neutral",
              demo: "Terms document opened",
            },
            {
              icon: "lock",
              title: "Privacy Policy",
              detail: "What data Splt uses and why",
              value: "Read",
              tone: "neutral",
              demo: "Privacy document opened",
              badgeTone: "green",
            },
            {
              icon: "document",
              title: "Open-source notices",
              detail: "Licenses included with the app",
              value: "Read",
              tone: "neutral",
              demo: "License notices opened",
            },
          ],
        },
      ],
      note: "Splt records shared expenses; it is not a bank or payment processor.",
    },
    "screen-states": {
      category: "State reference",
      type: "states",
      title: "Screen state contract",
      intro: "Every route preserves context and explains what the user can do next.",
      topTitle: "State reference",
      back: "../index.html",
      states: [
        {
          icon: "loading",
          title: "Initial loading",
          detail: "Skeletons preserve the final layout; no misleading zero balances.",
        },
        {
          icon: "refresh",
          title: "Refreshing",
          detail: "Cached content remains readable while fresh data is requested.",
        },
        {
          icon: "plus",
          title: "Empty first use",
          detail: "Teach Create Group, Add Person, and Add Expense with working actions.",
        },
        {
          icon: "search",
          title: "No filtered results",
          detail: "Show the active query and a clear-filters action.",
        },
        {
          icon: "warning",
          title: "Recoverable error",
          detail: "Explain the failure, preserve form data, and offer Retry.",
        },
        {
          icon: "offline",
          title: "Offline with cache",
          detail: "Label saved content and show when it was last updated.",
        },
        {
          icon: "lock",
          title: "Permission restricted",
          detail: "Explain why edit or delete is unavailable and who can act.",
        },
        {
          icon: "check",
          title: "Success",
          detail: "State the financial consequence and provide the next useful destination.",
        },
        {
          icon: "warning",
          title: "Not found after hydration",
          detail: "Only show after data loading confirms the route no longer exists.",
        },
        {
          icon: "trash",
          title: "Destructive confirmation",
          detail: "Name the record, irreversible effects, and retained shared history.",
        },
      ],
      actions: [{ label: "Return to launcher", href: "../index.html", kind: "secondary" }],
    },
  };

  const FLOW_REGISTRY = {
    "auth-flow": {
      title: "Account creation",
      summary: "One state machine from product promise to a useful authenticated destination.",
      steps: [
        [
          "welcome.html",
          "Welcome",
          "Offer registration, sign-in, and social auth without a tutorial carousel.",
        ],
        ["register.html", "Register", "Collect one consistent identity and password contract."],
        [
          "verify-email.html",
          "Verify email",
          "Keep pending verification as a durable account state.",
        ],
        [
          "profile-setup.html",
          "Profile setup",
          "Set photo, display name, home currency, and appearance once.",
        ],
        [
          "first-action.html",
          "First useful action",
          "Offer activation without forcing sample data or slides.",
        ],
        ["home.html", "Home", "Land in the Money Map with a stable authenticated stack."],
      ],
    },
    "recovery-flow": {
      title: "Password recovery",
      summary: "A secure inbox loop that returns to sign-in with clear completion.",
      steps: [
        ["login.html", "Sign in", "Recovery begins from the account entry context."],
        [
          "forgot-password.html",
          "Request link",
          "Confirm where the secure, expiring link is sent.",
        ],
        [
          "reset-password.html",
          "Choose password",
          "Deep-link into matching password rules and session consequences.",
        ],
        ["login.html", "Sign in again", "Return with the account email and a clear success state."],
      ],
    },
    "first-use-flow": {
      title: "First-use activation",
      summary: "Move from profile setup to one real action, while keeping Skip honest.",
      steps: [
        ["profile-setup.html", "Finish profile", "Capture durable account preferences."],
        [
          "first-action.html",
          "Choose a start",
          "Present four useful actions and an explicit skip.",
        ],
        [
          "group-create.html",
          "Create Apartment",
          "Collect group identity and members before invitations are sent.",
        ],
        [
          "group-overview.html",
          "See the circle",
          "Return to the new relationship with contextual next actions.",
        ],
        ["home.html", "Use Home", "The shell remains useful even before financial history exists."],
      ],
    },
    "expense-flow": {
      title: "Add an expense",
      summary:
        "Select context only when needed, compose in one screen, then explain the balance change.",
      steps: [
        [
          "global-add.html",
          "Choose Add",
          "The central dock action opens creation choices rather than a destination.",
        ],
        [
          "expense-context.html",
          "Choose a circle",
          "Global entry asks where the expense belongs; contextual entry skips this.",
        ],
        [
          "expense-compose.html",
          "Compose",
          "Keep total, context, payer, split, date, category, and receipt visible.",
        ],
        [
          "expense-split.html",
          "Inspect split",
          "Use distinct calculations and allow participant inclusion changes.",
        ],
        [
          "expense-success.html",
          "Understand consequence",
          "State total, your share, and the $80.00 lent.",
        ],
        [
          "expense-detail.html",
          "View source",
          "Show actual shares, receipt, comments, and permission-aware actions.",
        ],
      ],
    },
    "settlement-flow": {
      title: "Record a settlement",
      summary:
        "Use truthful external-payment language and review the resulting balance before saving.",
      steps: [
        [
          "person-detail.html",
          "Start in relationship",
          "The bilateral balance establishes payer and recipient.",
        ],
        [
          "settlement-compose.html",
          "Choose amount and method",
          "Default to the open balance and describe cash as external.",
        ],
        [
          "settlement-review.html",
          "Review consequence",
          "State payer, recipient, group, method, and resulting $0.00 balance.",
        ],
        [
          "settlement-success.html",
          "Keep a receipt",
          "Confirm what was recorded and return to the affected circle.",
        ],
      ],
    },
    "group-flow": {
      title: "Group lifecycle",
      summary: "Create and manage a circle through real Overview, Expenses, and Schedule subviews.",
      steps: [
        [
          "circles-groups.html",
          "Browse groups",
          "Rows open detail and never trigger surprise money actions.",
        ],
        ["group-create.html", "Create group", "Delay invitations until final submission."],
        [
          "group-overview.html",
          "Understand position",
          "Explain the group net and each pairwise debt.",
        ],
        [
          "group-expenses.html",
          "Inspect expenses",
          "Label each amount as your share, lent, or borrowed.",
        ],
        [
          "group-schedule.html",
          "Manage recurring work",
          "Separate review, active, and paused schedules.",
        ],
        [
          "group-settings.html",
          "Change settings",
          "Hydrate identity, preferences, and members before editing.",
        ],
      ],
    },
    "people-flow": {
      title: "People and relationships",
      summary:
        "Find a person, understand the bilateral balance, then take an explicit contextual action.",
      steps: [
        ["circles-people.html", "Browse people", "Relationship rows consistently open detail."],
        ["person-add.html", "Add a person", "Search by email or share a private invitation."],
        [
          "person-detail.html",
          "Understand the relationship",
          "Separate the bilateral total from each shared-group balance.",
        ],
        [
          "expense-compose.html",
          "Add together",
          "Contextual Add preselects the person and skips circle selection.",
        ],
        [
          "settlement-compose.html",
          "Settle or remind",
          "Keep consequence actions explicit inside detail.",
        ],
      ],
    },
    "recurring-flow": {
      title: "Recurring expense",
      summary:
        "Create schedules inside a group, surface review work globally, and preserve future occurrences.",
      steps: [
        [
          "group-schedule.html",
          "Open group schedule",
          "Recurring work belongs to the group relationship.",
        ],
        [
          "schedule-create.html",
          "Create schedule",
          "Choose fixed or variable amount, split, cadence, reminder, and posting mode.",
        ],
        [
          "schedule-detail.html",
          "Manage schedule",
          "Separate status, future dates, posted expenses, pause, edit, and delete.",
        ],
        ["schedule-edit.html", "Edit future behavior", "Do not rewrite already-posted expenses."],
        [
          "activity-upcoming.html",
          "See global agenda",
          "Aggregate review work and expected postings across groups.",
        ],
        [
          "schedule-review.html",
          "Review occurrence",
          "Correct amount and metadata while preserving the next date.",
        ],
        [
          "expense-success.html",
          "Post expense",
          "Explain the created expense and its balance consequence.",
        ],
      ],
    },
    "activity-flow": {
      title: "Activity and Upcoming",
      summary:
        "Keep history and future work in one temporal destination without mixing their states.",
      steps: [
        [
          "activity-timeline.html",
          "Read history",
          "Posted expenses, settlements, and relationship events open their sources.",
        ],
        [
          "expense-detail.html",
          "Open expense source",
          "History remains inspectable with real split math.",
        ],
        [
          "activity-upcoming.html",
          "Review agenda",
          "Future schedules and reminders state what action is expected.",
        ],
        [
          "schedule-review.html",
          "Resolve review",
          "Post a corrected variable occurrence without losing the schedule.",
        ],
      ],
    },
    "notification-flow": {
      title: "Actionable notifications",
      summary: "Respond to requests and scheduled work from an inbox with implemented actions.",
      steps: [
        [
          "notifications.html",
          "Open inbox",
          "Requests preserve Accept and Decline; important events open their source.",
        ],
        [
          "person-detail.html",
          "Review person",
          "A friend request resolves into a real relationship context.",
        ],
        ["group-overview.html", "Review group", "An invitation resolves into the invited circle."],
        [
          "schedule-review.html",
          "Handle schedule",
          "A due review opens the exact occurrence rather than a generic list.",
        ],
        [
          "notification-settings.html",
          "Set preferences",
          "Only implemented channels and event types are shown.",
        ],
      ],
    },
    "account-flow": {
      title: "Account and tools",
      summary:
        "Reach every implemented secondary destination while preserving the More stack context.",
      steps: [
        [
          "more.html",
          "Open More",
          "List only real account, money, preference, and support destinations.",
        ],
        ["profile.html", "Review account", "Connect identity, security, notifications, and data."],
        ["profile-edit.html", "Edit identity", "Update the actual photo and display name."],
        [
          "security.html",
          "Protect account",
          "Connect password, biometrics, sessions, and deletion.",
        ],
        [
          "currencies.html",
          "Set currency",
          "Show current selection and live versus fallback freshness.",
        ],
        [
          "insights.html",
          "Understand spending",
          "Label aggregates as your share and link categories to expenses.",
        ],
        ["export.html", "Export data", "Choose format and range, then expose generation state."],
        [
          "appearance.html",
          "Choose appearance",
          "Support system, light, dark, and reduced motion.",
        ],
        ["help.html", "Get help", "Search guides, contact support, and reach policies."],
        [
          "legal.html",
          "Read policies",
          "Expose effective dates and the payment-processing disclaimer.",
        ],
      ],
    },
  };

  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5M9 21v-7h6v7"/>',
    groups:
      '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20c.5-4 2.5-6 5.5-6s5 2 5.5 6M14 15c3.7-.5 6 1.2 6.8 4.5"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.8-5 3.3-7 7.5-7s6.7 2 7.5 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrow: '<path d="m9 18 6-6-6-6"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    activity: '<path d="M4 18V9m6 9V5m6 13v-7m4 7V7"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4m8-4v4M3 10h18"/>',
    receipt: '<path d="M6 3h12v19l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    settle: '<path d="M4 8h14m0 0-4-4m4 4-4 4M20 16H6m0 0 4-4m-4 4 4 4"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    chart: '<path d="M4 20V10m6 10V4m6 16v-7m4 7V7"/>',
    currency:
      '<circle cx="12" cy="12" r="9"/><path d="M16 8.5c-.8-1-2-1.5-3.5-1.5-2 0-3.5 1-3.5 2.5 0 4 7 1.5 7 5.3 0 1.4-1.4 2.4-3.6 2.4-1.8 0-3.2-.6-4.1-1.8M12 5v14"/>',
    download: '<path d="M12 3v12m0 0 5-5m-5 5-5-5M4 21h16"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 1 1 3.4 2.3c-.8.4-1.1 1-1.1 2.2M12 17.5h.01"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    document: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6m-6 4h6"/>',
    bolt: '<path d="m13 2-8 12h7l-1 8 8-12h-7z"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6"/>',
    warning: '<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5m0 3h.01"/>',
    offline:
      '<path d="m3 3 18 18M5 12a11 11 0 0 1 3-2m3-1a11 11 0 0 1 8 3M8.5 15.5a5 5 0 0 1 7 0M12 19h.01"/>',
    refresh:
      '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M18.5 9A7 7 0 0 0 6 6.5L4 9m2 6.5A7 7 0 0 0 18 18l2-3"/>',
    loading:
      '<path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/>',
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function icon(name, label) {
    const paths = ICONS[name] || ICONS.document;
    return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>${label ? `<span class="sr-only">${escapeHtml(label)}</span>` : ""}`;
  }

  function readPreference(name, fallback) {
    try {
      return localStorage.getItem(`splt-prototype-${name}`) || fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function savePreference(name, value) {
    try {
      localStorage.setItem(`splt-prototype-${name}`, value);
    } catch (_error) {
      // Direct file previews may block storage; the current document still updates.
    }
  }

  function applyPreferences() {
    const theme = readPreference("theme", "light");
    const platform = readPreference("platform", "ios");
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.platform = platform;
    document.body.dataset.theme = theme;
    document.body.dataset.platform = platform;
  }

  function statusBar() {
    return `<div class="status-bar" aria-label="Device status"><span>9:41</span><span class="status-icons"><span class="status-dot"></span><span class="status-dot"></span><span>86%</span></span></div>`;
  }

  function topBar(screen) {
    const back = screen.back;
    const title = screen.topTitle || screen.title;
    if (!back && !screen.topTitle) {
      return "";
    }
    return `<header class="top-bar">
      ${back ? `<a class="icon-button" href="${escapeHtml(back)}" aria-label="Go back">${icon("back")}</a>` : "<span></span>"}
      <div class="top-bar-title">${escapeHtml(title)}</div>
      <a class="icon-button quiet" href="../index.html" aria-label="Open prototype launcher">${icon("menu")}</a>
    </header>`;
  }

  function segmented(items) {
    if (!items?.length) return "";
    return `<div class="segmented" role="tablist" aria-label="Screen sections">${items
      .map(
        (item, index) =>
          `<button class="segment" type="button" role="tab" aria-selected="${item.active ? "true" : "false"}" data-segment${item.target ? ` data-target="${escapeHtml(item.target)}"` : ""}>${escapeHtml(item.label)}</button>`
      )
      .join("")}</div>`;
  }

  function hero(data) {
    if (!data) return "";
    return `<section class="money-hero ${data.tone === "warning" ? "warning" : ""}" aria-label="${escapeHtml(data.label)}">
      <p class="money-hero-label">${escapeHtml(data.label)}</p>
      <strong class="money-hero-value">${escapeHtml(data.value)}</strong>
      <p class="money-hero-note">${escapeHtml(data.note)}</p>
    </section>`;
  }

  function identity(data) {
    if (!data) return "";
    return `<section class="identity"><div class="avatar">${escapeHtml(data.initials)}</div><h1>${escapeHtml(data.name)}</h1><p>${escapeHtml(data.detail)}</p></section>`;
  }

  function badge(row) {
    const raw = row.icon || row.title.slice(0, 2).toUpperCase();
    const namedIcon = ICONS[raw];
    return `<span class="badge ${escapeHtml(row.badgeTone || "")}" aria-hidden="true">${namedIcon ? icon(raw) : escapeHtml(raw)}</span>`;
  }

  function rowMarkup(row) {
    const tag = row.href ? "a" : "button";
    const action = row.href
      ? `href="${escapeHtml(row.href)}"`
      : `type="button" data-demo="${escapeHtml(row.demo || `${row.title} details opened`)}"`;
    const value = row.value
      ? `<span class="balance-pill ${escapeHtml(row.tone || "")}">${escapeHtml(row.value)}</span>`
      : icon("arrow", "Open");
    return `<${tag} class="content-row" ${action}>${badge(row)}<span class="row-copy"><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(row.detail)}</span></span>${value}</${tag}>`;
  }

  function sections(items) {
    if (!items?.length) return "";
    return items
      .map(
        (section) =>
          `<section><div class="section-heading"><h2>${escapeHtml(section.title)}</h2>${section.meta ? `<span>${escapeHtml(section.meta)}</span>` : ""}</div><div class="content-list">${section.rows.map(rowMarkup).join("")}</div></section>`
      )
      .join("");
  }

  function fields(items) {
    if (!items?.length) return "";
    return `<div class="form-stack">${items
      .map(
        (field) =>
          `<div class="form-group"><label>${escapeHtml(field.label)}</label>${
            field.href
              ? `<a class="form-control" href="${escapeHtml(field.href)}"><span class="value">${escapeHtml(field.value)}</span><span class="meta">${escapeHtml(field.meta || "Open")}</span></a>`
              : `<button class="form-control" type="button" data-demo="${escapeHtml(`${field.label} control opened`)}"><span class="value">${escapeHtml(field.value)}</span>${field.meta ? `<span class="meta">${escapeHtml(field.meta)}</span>` : icon("arrow", "Edit")}</button>`
          }</div>`
      )
      .join("")}</div>`;
  }

  function buttons(items) {
    if (!items?.length) return "";
    return `<div class="button-stack">${items
      .map((action) => {
        const className = `${action.kind || "secondary"}-button`;
        return action.href
          ? `<a class="${className}" href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>`
          : `<button class="${className}" type="button" data-demo="${escapeHtml(action.demo || `${action.label} selected`)}">${escapeHtml(action.label)}</button>`;
      })
      .join("")}</div>`;
  }

  function receipt(items) {
    if (!items?.length) return "";
    return `<div class="receipt-card">${items
      .map(
        (line) =>
          `<div class="receipt-line"><span>${escapeHtml(line.label)}</span><strong class="${escapeHtml(line.tone || "")}">${escapeHtml(line.value)}</strong></div>`
      )
      .join("")}</div>`;
  }

  function quickActions(items) {
    if (!items?.length) return "";
    return `<div class="quick-actions">${items
      .map((action) => {
        const content = `${icon(action.icon)}<span>${escapeHtml(action.label)}</span>`;
        return action.href
          ? `<a class="quick-action" href="${escapeHtml(action.href)}">${content}</a>`
          : `<button class="quick-action" type="button" data-demo="${escapeHtml(action.demo)}">${content}</button>`;
      })
      .join("")}</div>`;
  }

  function amountEditor(data) {
    if (!data) return "";
    return `<section class="amount-editor"><div class="amount">${escapeHtml(data.value)}</div><p>${escapeHtml(data.detail)}</p></section>`;
  }

  function searchField(label) {
    if (!label) return "";
    return `<button type="button" class="search-field" data-demo="Search field focused">${icon("search")}<span>${escapeHtml(label)}</span></button>`;
  }

  function dock(active) {
    const items = [
      ["home", "Home", "home.html"],
      ["groups", "Circles", "circles-groups.html"],
      ["activity", "Activity", "activity-timeline.html"],
      ["menu", "More", "more.html"],
    ];
    return `<nav class="dock" aria-label="Primary navigation">
      ${dockLink(items[0], active)}
      ${dockLink(items[1], active)}
      <button class="dock-add" type="button" data-open-sheet aria-label="Open Add actions">${icon("plus")}</button>
      ${dockLink(items[2], active)}
      ${dockLink(items[3], active)}
    </nav>`;
  }

  function dockLink(item, active) {
    const [iconName, label, href] = item;
    const key = label.toLowerCase();
    return `<a class="dock-link ${active === key ? "active" : ""}" href="${href}"${active === key ? ' aria-current="page"' : ""}>${icon(iconName)}<span>${label}</span></a>`;
  }

  function taskSheet(tasks, open) {
    const defaultTasks = SCREEN_REGISTRY["global-add"].tasks;
    return `<div class="sheet-backdrop ${open ? "open" : ""}" data-sheet aria-hidden="${open ? "false" : "true"}"><section class="task-sheet" role="dialog" aria-modal="true" aria-labelledby="task-sheet-title"><div class="sheet-handle"></div><h2 id="task-sheet-title">What would you like to do?</h2><p>Choose an action. Context is selected inside the flow.</p><div class="task-grid">${(
      tasks || defaultTasks
    )
      .map(
        (task) =>
          `<a class="task-option ${task.primary ? "primary" : ""}" href="${escapeHtml(task.href)}">${icon(task.icon)}<span>${escapeHtml(task.label)}</span></a>`
      )
      .join(
        ""
      )}</div><div class="button-stack"><button class="secondary-button" type="button" data-close-sheet>Close</button></div></section></div>`;
  }

  function toast() {
    return `<div class="toast" role="status" aria-live="polite" data-toast><span data-toast-copy>State updated</span><button type="button" data-close-toast>Dismiss</button></div>`;
  }

  function standardContent(screen) {
    return `${topBar(screen)}${identity(screen.identity)}${screen.kicker ? `<p class="screen-kicker">${escapeHtml(screen.kicker)}</p>` : ""}${
      screen.type !== "detail" || !screen.identity
        ? `<h1 class="screen-title">${escapeHtml(screen.title)}</h1>`
        : ""
    }${screen.intro ? `<p class="screen-intro">${escapeHtml(screen.intro)}</p>` : ""}${segmented(screen.segments)}${searchField(screen.search)}${hero(screen.hero)}${amountEditor(screen.amount)}${quickActions(screen.quickActions)}${fields(screen.fields)}${receipt(screen.receipt)}${sections(screen.sections)}${screen.note ? `<p class="notice">${escapeHtml(screen.note)}</p>` : ""}${buttons(screen.actions)}`;
  }

  function welcomeContent(screen) {
    return `<div class="brand"><span class="brand-mark">S</span><span>Splt</span></div><div class="welcome-art" aria-hidden="true"><span class="welcome-orbit one"></span><span class="welcome-orbit two"></span><span class="welcome-orbit three"></span><div class="mini-ledger"><strong>$84.00</strong><div class="mini-line"></div><div class="mini-line short"></div><div class="mini-line"></div></div></div><h1 class="screen-title">${escapeHtml(screen.title)}</h1><p class="screen-intro">${escapeHtml(screen.intro)}</p>${buttons(screen.actions)}<p class="notice">${escapeHtml(screen.note)}</p>`;
  }

  function successContent(screen) {
    return `<section class="success-lockup"><div class="success-icon">${icon("check")}</div><h1>${escapeHtml(screen.title)}</h1><p>${escapeHtml(screen.intro)}</p></section>${receipt(screen.receipt)}${screen.note ? `<p class="notice">${escapeHtml(screen.note)}</p>` : ""}${buttons(screen.actions)}`;
  }

  function insightContent(screen) {
    const bars = screen.chart
      .map(
        (height, index) =>
          `<span class="chart-bar ${index === 3 ? "active" : ""}" style="height:${height}%" aria-label="Period ${index + 1}: ${height}%"></span>`
      )
      .join("");
    return `${topBar(screen)}<h1 class="screen-title">${escapeHtml(screen.title)}</h1><p class="screen-intro">${escapeHtml(screen.intro)}</p>${segmented(screen.segments)}${hero(screen.hero)}<div class="section-heading"><h2>Spending trend</h2><span>Your share only</span></div><div class="chart" role="img" aria-label="Your share spending trend over six periods">${bars}</div>${sections(screen.sections)}`;
  }

  function statesContent(screen) {
    return `${topBar(screen)}<h1 class="screen-title">${escapeHtml(screen.title)}</h1><p class="screen-intro">${escapeHtml(screen.intro)}</p><div class="state-grid">${screen.states
      .map(
        (state) =>
          `<article class="state-card"><span class="badge">${icon(state.icon)}</span><div><h2>${escapeHtml(state.title)}</h2><p>${escapeHtml(state.detail)}</p></div></article>`
      )
      .join("")}</div>${buttons(screen.actions)}`;
  }

  function renderScreen(key) {
    const root = document.querySelector(".prototype-root");
    const screen = SCREEN_REGISTRY[key];
    if (!root || !screen) return;
    document.title = `${screen.title} - Splt Circle Dock`;
    const focused = !screen.dock;
    let content;
    if (screen.type === "welcome") content = welcomeContent(screen);
    else if (screen.type === "success") content = successContent(screen);
    else if (screen.type === "insight") content = insightContent(screen);
    else if (screen.type === "states") content = statesContent(screen);
    else if (screen.type === "sheet")
      content = `<h1 class="sr-only">${escapeHtml(screen.title)}</h1><div inert aria-hidden="true">${standardContent(SCREEN_REGISTRY.home)}</div>`;
    else content = standardContent(screen);

    root.innerHTML = `<main class="screen-stage"><article class="phone-frame ${focused ? "focused" : ""} ${screen.type === "auth" || screen.type === "welcome" ? "auth-screen" : ""} ${screen.type === "sheet" ? "sheet-screen" : ""}" aria-label="${escapeHtml(screen.title)} prototype">${statusBar()}<div class="screen-scroll">${content}</div>${screen.dock && screen.type !== "sheet" ? dock(screen.dock) : ""}${taskSheet(screen.tasks, screen.type === "sheet")}${toast()}</article></main>`;
    bindInteractions(root);
  }

  function renderFlow(key) {
    const root = document.querySelector(".prototype-root");
    const flow = FLOW_REGISTRY[key];
    if (!root || !flow) return;
    document.title = `${flow.title} - Splt Circle Dock`;
    root.innerHTML = `<main class="flow-page"><header class="flow-header"><div><span class="screen-kicker">Linked walkthrough</span><h1>${escapeHtml(flow.title)}</h1><p>${escapeHtml(flow.summary)}</p></div><a class="step-link" href="../index.html">Prototype launcher</a></header><ol class="flow-steps">${flow.steps
      .map(
        ([file, title, note], index) =>
          `<li class="flow-step"><span class="step-number">${String(index + 1).padStart(2, "0")}</span><div class="step-copy"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(note)}</p></div><a class="step-link" href="../screens/${escapeHtml(file)}">Open screen</a></li>`
      )
      .join("")}</ol></main>`;
  }

  function launcherControls() {
    return `<div class="launcher-controls"><div class="control-group" aria-label="Platform preview"><button type="button" data-set-platform="ios">iOS</button><button type="button" data-set-platform="android">Android</button></div><div class="control-group" aria-label="Theme preview"><button type="button" data-set-theme="light">Light</button><button type="button" data-set-theme="dark">Dark</button></div></div>`;
  }

  function renderLauncher() {
    const root = document.querySelector(".prototype-root");
    if (!root) return;
    const categories = [
      ...new Set(Object.values(SCREEN_REGISTRY).map((screen) => screen.category)),
    ];
    const cards = Object.entries(SCREEN_REGISTRY)
      .map(
        ([key, screen]) =>
          `<a class="inventory-card" href="screens/${key}.html" data-inventory-card data-category="${escapeHtml(screen.category)}"><div><h3>${escapeHtml(screen.title)}</h3><p>${escapeHtml(screen.intro || screen.note || `${screen.category} prototype screen`)}</p></div><span class="inventory-meta"><span>${escapeHtml(screen.category)}</span><span>Open</span></span></a>`
      )
      .join("");
    const flowCards = Object.entries(FLOW_REGISTRY)
      .map(
        ([key, flow]) =>
          `<a class="inventory-card" href="flows/${key}.html"><div><h3>${escapeHtml(flow.title)}</h3><p>${escapeHtml(flow.summary)}</p></div><span class="inventory-meta"><span>${flow.steps.length} steps</span><span>Walk through</span></span></a>`
      )
      .join("");
    root.innerHTML = `<main class="launcher"><header class="launcher-header"><div class="launcher-brand"><div class="brand"><span class="brand-mark">S</span><span>Splt</span></div><span class="mono">Visual contract - 2026</span></div><h1 class="launcher-title">Circle Dock prototype package</h1><p class="launcher-lede">A directly inspectable map of every Splt screen, financial consequence, and end-to-end flow before React Native implementation.</p>${launcherControls()}</header><div class="launcher-main"><div class="inventory-toolbar"><div class="filter-chips" aria-label="Filter screen inventory"><button class="filter-chip" type="button" data-filter="all" aria-pressed="true">All screens</button>${categories.map((category) => `<button class="filter-chip" type="button" data-filter="${escapeHtml(category)}" aria-pressed="false">${escapeHtml(category)}</button>`).join("")}</div><span class="inventory-count" data-inventory-count>${Object.keys(SCREEN_REGISTRY).length} screens</span></div><section class="inventory-section"><h2>Screen inventory</h2><div class="inventory-grid">${cards}</div></section><section class="inventory-section"><h2>End-to-end flows</h2><div class="inventory-grid">${flowCards}</div></section></div></main>`;
    bindInteractions(root);
    updateControlStates();
  }

  function showToast(root, message) {
    const toastElement = root.querySelector("[data-toast]");
    const copy = root.querySelector("[data-toast-copy]");
    if (!toastElement || !copy) return;
    copy.textContent = message;
    toastElement.classList.add("show");
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => toastElement.classList.remove("show"), 3600);
  }

  function updateControlStates() {
    const theme = document.documentElement.dataset.theme;
    const platform = document.documentElement.dataset.platform;
    document
      .querySelectorAll("[data-set-theme]")
      .forEach((button) =>
        button.setAttribute("aria-pressed", String(button.dataset.setTheme === theme))
      );
    document
      .querySelectorAll("[data-set-platform]")
      .forEach((button) =>
        button.setAttribute("aria-pressed", String(button.dataset.setPlatform === platform))
      );
  }

  function bindInteractions(root) {
    root.querySelectorAll("[data-segment]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.target;
        if (target) {
          window.location.href = target;
          return;
        }
        button.parentElement
          .querySelectorAll("[data-segment]")
          .forEach((item) => item.setAttribute("aria-selected", String(item === button)));
        showToast(root, `${button.textContent.trim()} state selected`);
      });
    });
    root
      .querySelectorAll("[data-demo]")
      .forEach((button) =>
        button.addEventListener("click", () => showToast(root, button.dataset.demo))
      );
    root.querySelectorAll("[data-open-sheet]").forEach((button) =>
      button.addEventListener("click", () => {
        const sheet = root.querySelector("[data-sheet]");
        sheet?.classList.add("open");
        sheet?.setAttribute("aria-hidden", "false");
        sheet?.querySelector("a, button")?.focus();
      })
    );
    root.querySelectorAll("[data-close-sheet]").forEach((button) =>
      button.addEventListener("click", () => {
        const sheet = root.querySelector("[data-sheet]");
        sheet?.classList.remove("open");
        sheet?.setAttribute("aria-hidden", "true");
        root.querySelector("[data-open-sheet]")?.focus();
      })
    );
    root
      .querySelectorAll("[data-close-toast]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          button.closest("[data-toast]")?.classList.remove("show")
        )
      );
    root.querySelectorAll("[data-set-theme]").forEach((button) =>
      button.addEventListener("click", () => {
        document.documentElement.dataset.theme = button.dataset.setTheme;
        document.body.dataset.theme = button.dataset.setTheme;
        savePreference("theme", button.dataset.setTheme);
        updateControlStates();
      })
    );
    root.querySelectorAll("[data-set-platform]").forEach((button) =>
      button.addEventListener("click", () => {
        document.documentElement.dataset.platform = button.dataset.setPlatform;
        document.body.dataset.platform = button.dataset.setPlatform;
        savePreference("platform", button.dataset.setPlatform);
        updateControlStates();
      })
    );
    root.querySelectorAll("[data-filter]").forEach((button) =>
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        root
          .querySelectorAll("[data-filter]")
          .forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        let visible = 0;
        root.querySelectorAll("[data-inventory-card]").forEach((card) => {
          const show = filter === "all" || card.dataset.category === filter;
          card.hidden = !show;
          if (show) visible += 1;
        });
        const count = root.querySelector("[data-inventory-count]");
        if (count) count.textContent = `${visible} ${visible === 1 ? "screen" : "screens"}`;
      })
    );
  }

  function initialize() {
    applyPreferences();
    const screenKey = document.body.dataset.screen;
    const flowKey = document.body.dataset.flow;
    if (screenKey) renderScreen(screenKey);
    else if (flowKey) renderFlow(flowKey);
    else renderLauncher();
  }

  window.SpltPrototype = {
    screens: SCREEN_REGISTRY,
    flows: FLOW_REGISTRY,
    renderScreen,
    renderFlow,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
