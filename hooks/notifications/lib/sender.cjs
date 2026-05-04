/**
 * sender.cjs — HTTP POST with smart throttling (5 min cooldown on error)
 * Uses native fetch (Node 18+) — zero dependencies
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const THROTTLE_FILE = path.join(os.tmpdir(), 'ios-ck-noti-throttle.json');
const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

function loadThrottle() {
  try {
    if (fs.existsSync(THROTTLE_FILE)) return JSON.parse(fs.readFileSync(THROTTLE_FILE, 'utf8'));
  } catch {}
  return {};
}

function saveThrottle(state) {
  try { fs.writeFileSync(THROTTLE_FILE, JSON.stringify(state), 'utf8'); } catch {}
}

function isThrottled(provider) {
  const state = loadThrottle();
  return state[provider] && (Date.now() - state[provider]) < THROTTLE_MS;
}

function recordError(provider) {
  const state = loadThrottle();
  state[provider] = Date.now();
  saveThrottle(state);
}

function clearThrottle(provider) {
  const state = loadThrottle();
  if (state[provider]) { delete state[provider]; saveThrottle(state); }
}

/**
 * Send HTTP POST with throttling.
 * @returns {Promise<{success: boolean, error?: string, throttled?: boolean}>}
 */
async function send(provider, url, body) {
  if (isThrottled(provider)) return { success: false, throttled: true };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      recordError(provider);
      return { success: false, error: `HTTP ${res.status}: ${text.slice(0, 100)}` };
    }

    clearThrottle(provider);
    return { success: true };
  } catch (err) {
    recordError(provider);
    return { success: false, error: err.message };
  }
}

module.exports = { send, isThrottled };
