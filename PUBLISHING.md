# Publishing Guide — Always Early

## 1. Google OAuth — Move to Production

Your OAuth consent screen is currently in "Testing" mode, which limits usage to manually added test users. Before publishing to the Chrome Web Store, you need to move it to production.

### Steps

1. Go to [Google Cloud Console — OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Select the project used for Always Early
3. Click **"Publish App"** to move from Testing to Production
4. Add the **Privacy Policy URL** to the consent screen:
   - `https://cbmca.github.io/meeting-concierge/privacy.html`
5. Add the **Homepage URL**:
   - `https://cbmca.github.io/meeting-concierge/`

### Google Verification (Required)

Since Always Early uses `calendar.readonly` (a **restricted scope**), Google requires verification before your app can be used by anyone:

- After clicking "Publish App," Google will prompt you to submit for verification
- You will need to provide:
  - A privacy policy URL (see above)
  - A description of why you need the restricted scope
  - A YouTube video or written description demonstrating how the scope is used
- Google's review typically takes **1–3 weeks** (sometimes longer)
- During review, only test users can use the extension
- You may receive follow-up questions from Google's trust & safety team
- Once approved, any Google account holder can authorize the extension

### Tips for Passing Verification

- Keep the scope justification clear: "We use `calendar.readonly` to read upcoming meeting events and extract video conferencing links so we can open them as browser tabs before the meeting starts."
- The demo video should show: installing the extension, connecting Google Calendar, and a meeting tab being auto-opened
- Ensure the privacy policy is live and accessible at the URL you provide

---

## 2. Deploy GitHub Pages (Terms & Privacy)

The `docs/` directory contains the landing page, Terms of Service, and Privacy Policy.

1. Push the `docs/` directory to your GitHub repository
2. Go to **Settings → Pages** in your GitHub repo
3. Under "Source," select **Deploy from a branch**
4. Select the branch (e.g., `main`) and folder (`/docs`)
5. Click **Save**
6. Your site will be live at `https://cbmca.github.io/meeting-concierge/`

---

## 3. Chrome Web Store — Developer Account

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay the one-time **$5 registration fee**
3. Complete the developer profile (display name, email, etc.)

---

## 4. Prepare the Extension ZIP

```bash
cd meeting-concierge
zip -r ../meeting-concierge.zip . \
  -x ".*" \
  -x "docs/*" \
  -x "store/*" \
  -x "PUBLISHING.md" \
  -x "SETUP.md" \
  -x "node_modules/*"
```

This creates a ZIP containing only the extension files (manifest.json, background.js, popup.html, popup.js, icons/).

---

## 5. Upload to Chrome Web Store

1. In the Developer Dashboard, click **"New Item"**
2. Upload the ZIP file
3. Fill in the store listing:

| Field | Value |
|---|---|
| **Name** | Always Early |
| **Short description** | Auto-opens browser tabs for your upcoming Google Calendar meetings before they start. |
| **Detailed description** | See `store/description.txt` |
| **Category** | Productivity |
| **Language** | English |
| **Icon** | Upload `icons/icon128.png` |
| **Screenshots** | At least 1 screenshot (1280x800 or 640x400) — capture the popup in action |
| **Privacy policy URL** | `https://cbmca.github.io/meeting-concierge/privacy.html` |

### Screenshots Tips

- Take a screenshot of the popup showing "Connected" state with the lead time setting
- Optionally show a before/after of a meeting tab being opened
- Use Chrome DevTools device toolbar or a screenshot tool to get clean 1280x800 captures

---

## 6. Link OAuth Consent Screen

In the Chrome Web Store listing, under **Privacy practices**:

- Declare which permissions are used and why (matches the privacy policy)
- Confirm the extension uses `identity` for Google Sign-In
- Link to the same privacy policy URL

---

## 7. Submit for Review

1. Review all listing fields are complete
2. Click **"Submit for Review"**
3. Chrome Web Store review typically takes **1–3 business days**
4. You'll receive an email when the extension is approved or if changes are needed

---

## Checklist

- [ ] GitHub Pages deployed with Terms & Privacy live
- [ ] OAuth consent screen published and verification submitted
- [ ] Privacy policy URL added to OAuth consent screen
- [ ] Developer account created ($5 fee paid)
- [ ] Extension ZIP built (excluding docs/store/non-extension files)
- [ ] Store listing filled in (description, icon, screenshots, privacy URL)
- [ ] Extension submitted for Chrome Web Store review
- [ ] Google OAuth verification approved
