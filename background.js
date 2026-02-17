// Always Early — Background Service Worker
// Syncs Google Calendar events and opens meeting tabs at the right time.

const SYNC_ALARM = "meeting-concierge-sync";
const SYNC_INTERVAL_MINUTES = 5;
const DEFAULT_LEAD_TIME_MINUTES = 2;
const ALARM_PREFIX = "meeting::";

// --- Lifecycle ---

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(SYNC_ALARM, {
    delayInMinutes: 0.1,
    periodInMinutes: SYNC_INTERVAL_MINUTES,
  });
});

// Also re-register the sync alarm when the service worker wakes up,
// in case Chrome cleared it during suspension.
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(SYNC_ALARM, {
    delayInMinutes: 0.1,
    periodInMinutes: SYNC_INTERVAL_MINUTES,
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SYNC_ALARM) {
    syncCalendar();
  } else if (alarm.name.startsWith(ALARM_PREFIX)) {
    handleMeetingAlarm(alarm.name);
  }
});

// Allow the popup to trigger an immediate sync (e.g. after connecting or saving).
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "syncNow") {
    syncCalendar();
  }
});

// --- Calendar Sync ---

async function syncCalendar() {
  let token;
  try {
    token = await getAuthToken(false);
  } catch (err) {
    console.warn("Always Early: auth failed, skipping sync.", err);
    return;
  }

  const { leadTime = DEFAULT_LEAD_TIME_MINUTES } =
    await chrome.storage.sync.get("leadTime");

  const now = new Date();
  // Look ahead far enough to cover the sync interval + lead time + buffer.
  const lookAheadMs = (SYNC_INTERVAL_MINUTES + leadTime + 5) * 60 * 1000;
  const timeMin = now.toISOString();
  const timeMax = new Date(now.getTime() + lookAheadMs).toISOString();

  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events"
  );
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "10");
  url.searchParams.set(
    "fields",
    "items(id,summary,start,hangoutLink,location,conferenceData)"
  );

  let data;
  try {
    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (resp.status === 401) {
      // Token expired — clear it and retry once.
      await removeCachedToken(token);
      token = await getAuthToken(true);
      const retry = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      data = await retry.json();
    } else {
      data = await resp.json();
    }
  } catch (err) {
    console.error("Always Early: fetch failed.", err);
    return;
  }

  if (!data.items || data.items.length === 0) return;

  // Collect the IDs of events we're scheduling alarms for in this cycle,
  // so we can clean up stale alarms afterward.
  const scheduledAlarmNames = new Set();

  for (const event of data.items) {
    const meetingUrl = extractMeetingUrl(event);
    if (!meetingUrl) continue;

    const startTime = new Date(
      event.start.dateTime || event.start.date
    ).getTime();
    const alarmTime = startTime - leadTime * 60 * 1000;

    // Don't schedule alarms in the past.
    if (alarmTime <= Date.now()) continue;

    const alarmName = ALARM_PREFIX + event.id;
    scheduledAlarmNames.add(alarmName);

    chrome.alarms.create(alarmName, { when: alarmTime });

    // Persist the meeting URL so the alarm handler can retrieve it.
    await chrome.storage.session.set({ [alarmName]: meetingUrl });
  }

  // Clean up alarms for events that no longer exist or are past.
  const allAlarms = await chrome.alarms.getAll();
  for (const a of allAlarms) {
    if (
      a.name.startsWith(ALARM_PREFIX) &&
      !scheduledAlarmNames.has(a.name)
    ) {
      chrome.alarms.clear(a.name);
      chrome.storage.session.remove(a.name);
    }
  }
}

// --- Meeting Alarm Handler ---

async function handleMeetingAlarm(alarmName) {
  const result = await chrome.storage.session.get(alarmName);
  const meetingUrl = result[alarmName];
  chrome.storage.session.remove(alarmName);

  if (!meetingUrl) {
    console.warn("Always Early: no URL stored for alarm", alarmName);
    return;
  }

  // Open the meeting in a new tab and force it to the foreground.
  const tab = await chrome.tabs.create({ url: meetingUrl, active: true });

  // Ensure the window containing the new tab is focused and visible.
  if (tab.windowId) {
    chrome.windows.update(tab.windowId, { focused: true });
  }
}

// --- URL Extraction ---

function extractMeetingUrl(event) {
  // 1. Prefer the explicit hangoutLink (Google Meet).
  if (event.hangoutLink) return event.hangoutLink;

  // 2. Check conferenceData entry points (covers Meet, Zoom-via-GCal, etc.).
  if (event.conferenceData?.entryPoints) {
    for (const ep of event.conferenceData.entryPoints) {
      if (ep.entryPointType === "video" && ep.uri) return ep.uri;
    }
  }

  // 3. Fall back to scanning the location field for a URL.
  if (event.location) {
    const url = findUrl(event.location);
    if (url) return url;
  }

  return null;
}

// Simple URL finder — matches http(s) URLs, which covers Meet, Zoom, Teams, etc.
function findUrl(text) {
  const match = text.match(/https?:\/\/[^\s,;>"')]+/i);
  return match ? match[0] : null;
}

// --- Auth Helpers ---

function getAuthToken(interactive) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(chrome.runtime.lastError?.message || "No token");
      } else {
        resolve(token);
      }
    });
  });
}

function removeCachedToken(token) {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, resolve);
  });
}
