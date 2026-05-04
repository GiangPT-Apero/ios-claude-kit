/**
 * env-loader.cjs
 * Load .env with cascade: process.env > ~/.claude/.env > .claude/.env
 * Zero dependencies — manual .env parsing.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

function parseEnvContent(content) {
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      // Strip inline comment (only for unquoted values)
      const commentIndex = value.indexOf('#');
      if (commentIndex !== -1) value = value.slice(0, commentIndex).trim();
    }

    if (key) result[key] = value;
  }
  return result;
}

function loadEnvFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return parseEnvContent(fs.readFileSync(filePath, 'utf8'));
    }
  } catch {}
  return {};
}

/**
 * Load environment with cascade priority.
 * Priority: process.env > ~/.claude/.env > .claude/.env
 */
function loadEnv(cwd = process.cwd()) {
  const files = [
    path.join(cwd, '.claude', '.env'),
    path.join(cwd, '.claude', 'hooks', 'notifications', '.env'),
    path.join(os.homedir(), '.claude', '.env'),
  ];

  let merged = {};
  for (const f of files) merged = { ...merged, ...loadEnvFile(f) };
  return { ...merged, ...process.env };
}

module.exports = { loadEnv, parseEnvContent };
