# Browser Usage Analyzer

A privacy-first Chrome extension (Manifest V3) that tracks active browsing time per site, enforces time limits with customizable warnings, blocks distracting sites, and shows a dashboard of your browsing habits. test

## Purpose

This extension helps you understand and control your browsing behavior. It runs entirely locally — no data leaves your browser, no accounts, no telemetry, no servers.

## Features

- **Automatic time tracking** — per-domain, per-day, with ~2 second granularity
- **Daily time limits** — set a daily budget per site with configurable warning thresholds
- **Bonus time** — grant yourself extra time on a site for today without changing your hard limits
- **Site blocking** — `declarativeNetRequest`-based blocking when a limit is exceeded
- **Dashboard** — visual overview of your tracked time with Chart.js
- **Warning notifications** — in-page banners when you're approaching a limit
- **Full privacy** — all data stored locally via `chrome.storage.local`, no external calls

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Browser API | Chrome MV3 | Current standard, learning MV3 patterns |
| Build | Vite | Fast bundling with multi-page support |
| Framework | None (vanilla JS) | No framework complexity; intentional learning constraint |
| Storage | `chrome.storage.local` | Extension-native, persists across SW restarts |
| Charts | Chart.js *(planned)* | Lightweight, widely used, vanilla JS friendly |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Service Worker                           │
│  (background.js)                                            │
│  ┌────────────┐  alarm tick  ┌──────────┐  read/write      │
│  │  Tracker   │ ──────────►  │ storage  │ ───────►         │
│  │  (memory)  │              │  .js     │     chrome.storage│
│  └────────────┘              └──────────┘ ◄───────         │
│       │                            ▲                       │
│  onActivated / onUpdated           │ flush()               │
│  onFocusChanged                    │                       │
│       │                            │                       │
│       ▼                            │                       │
│  extractDomain(url) ───────────────┘                       │
└─────────────────────────────────────────────────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────┐   ┌──────────────────────┐
│   Popup (popup/) │   │ Dashboard (dashboard/)│
│ Current site     │   │ Chart.js overview    │
│ + today's time   │   │ (extension page)     │
│ + open dashboard │   │                      │
└─────────────────┘   └──────────────────────┘
                           ┌──────────────────────┐
                           │  Content Script      │
                           │  (content.js)        │
                           │  Visibility events   │
                           │  Warning banners     │
                           └──────────────────────┘
```

## Project Structure

```
src/
├── background.js       # Service worker — tab tracking, alarms, blocking
├── content.js          # Injected script — visibility events, warnings
├── lib/
│   ├── storage.js      # chrome.storage CRUD wrapper
│   ├── tracker.js      # Session state machine (start/stop/tick)
│   └── utils.js        # Domain parsing, duration formatting
├── popup/              # Toolbar popup (current site + time)
├── dashboard/          # Extension dashboard with charts
└── options/            # Settings page (limits + blocklist)
public/
├── manifest.json       # Chrome extension manifest
└── icons/              # Extension icons
```

## Data Schema

All data lives in `chrome.storage.local` under these keys:

| Key | Shape | Purpose |
|-----|-------|---------|
| `dailyData` | `{ "YYYY-MM-DD": { "domain.com": ms, ... } }` | Tracked time per domain per day |
| `siteLimits` | `{ "domain.com": { dailyLimitMs, warningThresholdsMs, enabled } }` | Configured limits per site |
| `bonusTime` | `{ "YYYY-MM-DD": { "domain.com": ms, ... } }` | Bonus time granted for today |
| `blockedSites` | `string[]` | List of currently blocked domains |
| `settings` | `{ defaultWarningThresholdsMs, storageVersion }` | Global settings |

## Development

```bash
# Install dependencies
npm install

# Start dev server (with HMR for pages)
npm run dev

# Build for production
npm run build
```

The built extension lives in `dist/`. Load it in Chrome via `chrome://extensions` → "Load unpacked" → select the `dist/` folder.

## Roadmap

| Step | Status | Description |
|------|--------|-------------|
| 1 | ✅ | Project scaffold (Vite + folder structure + manifest) |
| 1.5 | ✅ | Remove new tab override, add dashboard button to popup |
| 2 | ✅ | Storage layer (CRUD for all data types) |
| 3a | ✅ | Background service worker — alarm-based tab tracking |
| 3b | ✅ | Limit checking and block overlay |
| 4 | ⬜ | Content script (visibility events + warning banners) |
| 7 | ⬜ | Site blocking via `declarativeNetRequest` |
| 8 | ⬜ | Options page (blocklist + limits UI) |
| 9 | ⬜ | Dashboard with Chart.js |
| 10 | ⬜ | Bonus time feature |
| 11 | ⬜ | Polish, edge cases, icons |

## Design Principles

- **Local-first.** Zero external dependencies at runtime. No analytics, no servers, no accounts.
- **Crash-safe.** All persistent state is in `chrome.storage.local`. The service worker can be killed and restarted without data loss.
- **Granularity-aware.** ~2 second tick intervals balance accuracy against storage I/O. Sleep gaps >5 seconds are discarded.
- **Progressive.** Each feature is built and verified incrementally. The extension works correctly at every step of the roadmap.

## About This Project

This is a personal learning project. It was built collaboratively with an AI agent to explore:

- Chrome Extension Manifest V3 patterns
- Service worker lifecycle management
- Incremental feature development using agent-assisted workflows
- Prompt engineering for complex, multi-step software tasks

The architecture prioritizes simplicity and readability over cleverness. Every decision is documented in [`AGENTS.md`](./AGENTS.md) along with the full development log.
