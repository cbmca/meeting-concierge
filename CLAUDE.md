# Always Early — Claude Project Context

## What This Is
A Manifest V3 Chrome extension that automatically opens browser tabs for upcoming Google Calendar meetings before they start. The user configures a "lead time" (minutes early), and the extension handles the rest silently in the background.

## Project Status
- Current version: **1.0.1**
- Chrome Web Store item ID: `akldicagkcpdaleldcnolfphcojhaong`
- Status: Submitted for review (v1.0.1 resubmit after tabs permission rejection)
- OAuth verification: In progress with Google (domain ownership verified ✓)

## Key Accounts & IDs
- GitHub repo: `https://github.com/cbmca/meeting-concierge`
- Homepage/docs: `https://cbmca.github.io/meeting-concierge/`
- OAuth client ID: `17127521381-em52cbujakjrsnd3l6g7ambffrpscrlj.apps.googleusercontent.com`
- Google Cloud project ID: `always-early` (project number: `17127521381`)
- OAuth scope: `https://www.googleapis.com/auth/calendar.readonly` (read-only)

## File Structure
```
meeting-concierge/
├── manifest.json       # MV3 manifest — permissions: identity, storage, alarms
├── background.js       # Service worker — calendar sync, alarm scheduling, tab opening
├── popup.html          # Extension popup UI (280px wide, system-ui font)
├── popup.js            # Popup logic — auth status, lead time save/load
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── logo120.png
├── docs/               # GitHub Pages site (privacy, terms, index, GSC verification)
└── store/              # Chrome Web Store listing copy
```

## Architecture
- **Sync cycle**: Every 5 minutes via `chrome.alarms` (`meeting-concierge-sync`)
- **Alarm keys**: `meeting::<google-calendar-event-id>` — one per upcoming event
- **URL storage**: `chrome.storage.session` keyed by alarm name, cleaned up after firing
- **Meeting URL priority**: `hangoutLink` → `conferenceData.entryPoints[video]` → location field URL scan
- **Supported platforms**: Google Meet, Zoom, Teams, Webex — any http(s) URL in the location field
- **Lead time range**: 0–30 minutes, default 2, stored in `chrome.storage.sync`

## Permissions (and why)
- `identity` — OAuth2 token for Google Calendar API
- `storage` — persist lead time setting (`sync`) and meeting URLs (`session`)
- `alarms` — schedule sync cycle and per-meeting tab-open triggers
- `tabs` permission is **NOT used** — `chrome.tabs.create()` does not require it

## Chrome Web Store History
- v1.0.0: Initial submission — **rejected** (violation ref: Purple Potassium)
  - Reason: `tabs` permission declared but not required
- v1.0.1: Removed `tabs` permission, resubmitted 2026-02-19

## GitHub Pages / Domain Notes
- `cbmca.github.io` repo = root controller for the entire `cbmca.github.io` subdomain
- `meeting-concierge` repo serves at `cbmca.github.io/meeting-concierge/`
- Any domain-level files (GSC verification, sitemap, robots.txt) must go in the `cbmca.github.io` repo

## Coding Conventions
- Vanilla JS only — no build tools, no npm, no bundler
- Async/await throughout; no callback nesting except where Chrome APIs require it
- Comments only where logic isn't self-evident
- Keep permissions minimal — never add a permission speculatively for future use
- Version bumps go in `manifest.json` only; rebuild zip with date in filename for submissions

## Building a Release Zip
```bash
cd /Users/christophermcandrew/meeting-concierge
zip -r ~/always-early-<version>-<date>.zip . \
  --exclude "*.git*" \
  --exclude "docs/*" \
  --exclude "store/*" \
  --exclude "*.md" \
  --exclude "__MACOSX"
```

---

## Secrets & Credential Safety

**Zero-tolerance: no API keys, tokens, passwords, or credentials may ever be committed to git.**

- OAuth `client_id` in `manifest.json` is public by design (Chrome extensions use implicit flow) — this is fine
- OAuth `client_secret` must NEVER be committed — Chrome extensions should not have one
- Never hardcode tokens; all auth tokens come from `chrome.identity.getAuthToken()` at runtime
- Before committing, scan `git diff --cached` for secret patterns: API keys, Bearer tokens, private keys
- If a secret is accidentally committed: rotate the key immediately, then scrub history with `git-filter-repo` or BFG Repo-Cleaner
