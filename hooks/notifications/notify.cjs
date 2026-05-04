#!/usr/bin/env node
/**
 * notify.cjs — Notification router for iOS Claude Kit hooks
 * Reads stdin JSON, routes to enabled providers (Telegram, Slack, Discord)
 * Also fires macOS native notification.
 *
 * Setup: copy .env.example to .env and fill in webhook URLs
 * Usage: echo '{"hook_event_name":"Stop"}' | node notify.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loadEnv } = require('./lib/env-loader.cjs');

const PROVIDER_PREFIXES = ['TELEGRAM', 'SLACK', 'DISCORD'];

async function readStdin() {
  return new Promise(resolve => {
    if (process.stdin.isTTY) { resolve({}); return; }

    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => {
      if (!data.trim()) { resolve({}); return; }
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
    process.stdin.on('error', () => resolve({}));
    setTimeout(() => resolve({}), 5000);
  });
}

function hasProviderEnv(prefix, env) {
  return Object.keys(env).some(k => k.startsWith(prefix + '_'));
}

function loadProvider(name) {
  const p = path.join(__dirname, 'providers', `${name}.cjs`);
  try {
    if (fs.existsSync(p)) return require(p);
  } catch (err) {
    console.error(`[notify] Failed to load provider ${name}: ${err.message}`);
  }
  return null;
}

async function notifyMac(input) {
  const hookType = input.hook_event_name || 'Task completed';
  const project = path.basename(input.cwd || '') || 'iOS Project';
  const messages = {
    Stop: `${project}: Task completed`,
    SubagentStop: `${project}: Agent done`,
    AskUserPrompt: `${project}: Input needed`,
  };
  const message = messages[hookType] || `${project}: ${hookType}`;
  try {
    execSync(`osascript -e 'display notification "${message}" with title "Claude Code"'`);
  } catch {}
}

async function main() {
  try {
    const input = await readStdin();
    const cwd = input.cwd || process.cwd();
    const env = loadEnv(cwd);

    // macOS native notification always fires
    await notifyMac(input);

    // Route to remote providers
    for (const prefix of PROVIDER_PREFIXES) {
      if (!hasProviderEnv(prefix, env)) continue;

      const provider = loadProvider(prefix.toLowerCase());
      if (!provider) continue;
      if (typeof provider.isEnabled === 'function' && !provider.isEnabled(env)) continue;

      try {
        const result = await provider.send(input, env);
        if (result.success) {
          console.error(`[notify] ${prefix.toLowerCase()}: sent`);
        } else if (result.throttled) {
          console.error(`[notify] ${prefix.toLowerCase()}: throttled`);
        } else {
          console.error(`[notify] ${prefix.toLowerCase()}: failed — ${result.error}`);
        }
      } catch (err) {
        console.error(`[notify] ${prefix.toLowerCase()} error: ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`[notify] Fatal: ${err.message}`);
  }

  process.exit(0);
}

main();
