#!/usr/bin/env node
/**
 * notify.cjs
 * Send notifications when Claude completes a task.
 * Supports: macOS native notification (default), Slack, Telegram
 *
 * Setup: copy .env.example to .env and fill in webhook URLs
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  }
}

async function notifyMac(message) {
  try {
    execSync(`osascript -e 'display notification "${message}" with title "Claude Code"'`);
  } catch {}
}

async function notifySlack(message) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  try {
    const { default: https } = await import('https');
    const body = JSON.stringify({ text: `Claude Code: ${message}` });
    const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    req.write(body);
    req.end();
  } catch {}
}

async function notifyTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    const { default: https } = await import('https');
    const body = JSON.stringify({ chat_id: chatId, text: `Claude Code: ${message}` });
    const req = https.request(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    req.write(body);
    req.end();
  } catch {}
}

async function main() {
  loadEnv();

  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  let event;
  try { event = JSON.parse(input); } catch { process.exit(0); }

  const message = event?.message || event?.tool_use?.name || 'Task completed';

  await Promise.all([
    notifyMac(message),
    notifySlack(message),
    notifyTelegram(message),
  ]);

  process.exit(0);
}

main().catch(() => process.exit(0));
