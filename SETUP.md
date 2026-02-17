# Always Early — Setup & Testing

## 1. Create a Google Cloud OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).
3. Navigate to **APIs & Services > Enabled APIs** and enable the **Google Calendar API**.
4. Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
5. Choose **Chrome Extension** as the application type.
6. You'll need your extension's ID. To get it:
   - Load the extension first (see step 2 below) — Chrome assigns an ID on first load.
   - Come back here and enter `chrome-extension://<YOUR_EXTENSION_ID>` as the authorized origin.
7. Copy the generated **Client ID** (looks like `123456789.apps.googleusercontent.com`).
8. Open `manifest.json` and replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your actual client ID.

## 2. Load the Extension in Chrome

1. Open `chrome://extensions/` in Chrome.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked** and select this `meeting-concierge` folder.
4. Note the extension ID that Chrome assigns — you'll need it for the OAuth setup above.
5. After updating `manifest.json` with the real client ID, click the **reload** button on the extension card.

## 3. Authorize

1. Click the Always Early icon in the toolbar.
2. The first calendar sync will trigger an OAuth consent screen — allow calendar read access.
3. Set your preferred lead time and click **Save**.

## 4. How It Works

- Every **5 minutes**, the service worker fetches your next ~10 upcoming events from Google Calendar.
- For each event with a meeting URL (Google Meet, Zoom, Teams, etc.), it sets a `chrome.alarms` alarm at `start_time - lead_time`.
- When the alarm fires, it opens the meeting URL in a new foreground tab and focuses the window.

## 5. Testing the "Forefront" Tab Behavior

`chrome.windows.update({ focused: true })` brings the window to the front on most OSes. To test:

1. Create a Google Calendar event starting a few minutes from now with a Google Meet link.
2. Set lead time to 1 or 2 minutes.
3. Minimize Chrome or switch to another app.
4. When the alarm fires, Chrome should pop to the foreground with the meeting tab active.

**macOS note:** Chrome may not always steal focus from other apps due to OS-level focus protections. In practice, the tab will be created and the Chrome window will attempt to focus — this works reliably when Chrome is already visible or in the dock.

## 6. OAuth Scopes

The extension requests `calendar.readonly` — it can only read events, never modify them.

## 7. Troubleshooting

- **"OAuth2 not granted or revoked"**: Re-check that the client ID in `manifest.json` matches the one in Google Cloud Console, and that the extension ID is registered as an authorized origin.
- **No alarms firing**: Open `chrome://extensions/`, click "service worker" under Always Early to open DevTools, and check the console for errors.
- **Token expiration**: The service worker automatically handles 401 responses by clearing the cached token and re-authenticating silently.
