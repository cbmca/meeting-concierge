// Always Early — Popup

const leadTimeInput = document.getElementById("leadTime");
const saveButton = document.getElementById("save");
const statusEl = document.getElementById("status");
const connectBtn = document.getElementById("connectBtn");
const authDot = document.getElementById("authDot");
const authLabel = document.getElementById("authLabel");

// --- Auth Status ---

// Check if we already have a token (non-interactive = no prompt).
checkAuthStatus();

function checkAuthStatus() {
  chrome.identity.getAuthToken({ interactive: false }, (token) => {
    if (token) {
      showConnected();
    } else {
      showDisconnected();
    }
  });
}

function showConnected() {
  authDot.className = "dot connected";
  authLabel.textContent = "Calendar connected";
  connectBtn.classList.add("hidden");
}

function showDisconnected() {
  authDot.className = "dot disconnected";
  authLabel.textContent = "Not connected";
  connectBtn.classList.remove("hidden");
}

// Interactive auth — triggered by user click (required by Chrome for the consent popup).
connectBtn.addEventListener("click", () => {
  connectBtn.textContent = "Connecting...";
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError || !token) {
      connectBtn.textContent = "Connect Google Calendar";
      statusEl.textContent = "Authorization failed. Try again.";
      statusEl.className = "status error";
      setTimeout(() => {
        statusEl.textContent = "";
        statusEl.className = "status";
      }, 3000);
      return;
    }
    showConnected();
    // Trigger an immediate calendar sync now that we have a token.
    chrome.runtime.sendMessage({ action: "syncNow" });
  });
});

// --- Lead Time ---

chrome.storage.sync.get("leadTime", ({ leadTime }) => {
  if (leadTime !== undefined) {
    leadTimeInput.value = leadTime;
  }
});

saveButton.addEventListener("click", () => {
  const value = Math.max(0, Math.min(30, parseInt(leadTimeInput.value, 10) || 2));
  leadTimeInput.value = value;

  chrome.storage.sync.set({ leadTime: value }, () => {
    statusEl.textContent = "Saved!";
    statusEl.className = "status";
    // Trigger an immediate sync so the new lead time takes effect right away.
    chrome.runtime.sendMessage({ action: "syncNow" });
    setTimeout(() => {
      statusEl.textContent = "";
    }, 2000);
  });
});

leadTimeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveButton.click();
});
