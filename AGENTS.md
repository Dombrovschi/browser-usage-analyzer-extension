# Browser Usage Analyzer — Project Log

## Overview
A Chrome extension (MV3) that tracks active browsing time per site, enforces time limits with customizable warnings, blocks distracting sites, and shows a dashboard on the new tab page.

## Tech Stack
- **Browser**: Chrome (Manifest V3)
- **Build**: Vite + vanilla JS (no framework)
- **Storage**: `chrome.storage.local`
- **Charts**: Chart.js (planned for dashboard)

## Project Structure
```
src/
├── background.js       # Service worker — tab tracking, alarms, blocking
├── content.js          # Injected script — visibility events, warnings
├── lib/
│   ├── storage.js      # chrome.storage wrapper
│   ├── tracker.js      # Session tracking state machine
│   └── utils.js        # Domain parsing, formatting
├── popup/              # Toolbar popup
├── dashboard/          # New tab page
└── options/            # Settings page
```

## Data Schema (`chrome.storage.local`)

```js
{
  dailyData: {
    "2026-04-26": {
      "reddit.com": 180000,       // ms spent
      "github.com": 4500000
    }
  },
  siteLimits: {
    "reddit.com": {
      dailyLimitMs: 300000,        // 5 min per day
      warningThresholdsMs: [240000],
      enabled: true
    }
  },
  bonusTime: {
    "2026-04-26": {
      "reddit.com": 300000         // extra ms granted for today
    }
  },
  blockedSites: ["reddit.com"],
  settings: {
    defaultWarningThresholdsMs: [300000],
    storageVersion: 1
  }
}
```

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Browser | Chrome MV3 | Current standard, learning MV3 |
| Build tool | Vite | Fast, simple, good for vanilla JS |
| Framework | None (vanilla JS) | Learning project, no extra complexity |
| Dashboard location | Extension page (button in popup) | User didn't want new tab override |
| Time limit reset | Daily at midnight | Clear daily budget |
| Bonus time | Temporary (today only) | Doesn't permanently change limits |
| Tracking granularity | ~2 second intervals | Balances accuracy vs storage writes |
| Chart library (planned) | Chart.js | Lightweight, popular, vanilla JS-friendly |

## Progress Log

### [2026-04-26] Step 1: Project Scaffold
- Created Vite project with multi-page build config
- Created folder structure (popup, dashboard, options, lib)
- Created stub files for all components
- Set up manifest.json with MV3 permissions
- Wrote AGENTS.md and PROMPTING-GUIDE.md
- Installed dependencies (`npm install`)

### [2026-04-26] Step 1.5: Remove new tab override
- Removed `chrome_url_overrides` from manifest (no more new tab takeover)
- Added "Open Dashboard" button to popup that opens the dashboard in a new tab
- Updated AGENTS.md to reflect decision change

### [2026-04-26] Step 2: Implement storage.js with full read/write API
- Wrote complete CRUD wrapper for dailyData, siteLimits, bonusTime, blockedSites, settings
- Removed duplicated `todayString()` (imported from `utils.js` instead)
- Added `getDomainTime(domain)` helper that sums daily tracked time + bonus time

### [2026-04-26] Step 3a: Background service worker — alarm-based tab tracking
- Added `tick()` to Tracker class (returns elapsed + resets session timer)
- Created `tracker-tick` alarm (~2s interval) on install
- Listeners: `tabs.onActivated`, `tabs.onUpdated` (URL), `windows.onFocusChanged`
- `flush()` persists elapsed time to storage and resets the timer
- Sleep gap protection: discards intervals >5s to avoid counting away time
- On SW wake, queries current active tab to re-initialize tracking

### [2026-04-26] Step 3b: Limit checking + block overlay
- Added `checkLimits()` to background: checks effective limit (daily + bonus) on every tick
- Track `blockedDomains` in memory to avoid re-sending block messages
- Track warning thresholds per domain to avoid duplicate warnings
- Content script creates a full-screen overlay with "+5 more minutes" button
- Bonus time adds 5 min via `addBonusTime()`, re-checks on next tick
- Content script is self-contained (no imports) to work around MV3 content script module restrictions
- [x] Step 1.5: Remove new tab override, add dashboard open button to popup
- [x] Step 2: Implement storage.js with full read/write API
- [x] Step 3a: Background service worker — alarm-based tab tracking
- [x] Step 3b: Add limit checking + notifications
- [ ] Step 4: Implement content.js visibility events
- [ ] Step 7: Website blocking via declarativeNetRequest
- [ ] Step 8: Options page (blocklist + limits)
- [ ] Step 9: Full dashboard with Chart.js
- [ ] Step 10: "Add time" bonus feature
- [ ] Step 11: Polish, icons, edge cases

## Known Issues / Edge Cases
- (none yet)

## Future Ideas
- (to be added as we think of them)
