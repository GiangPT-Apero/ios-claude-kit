#!/usr/bin/env node
/**
 * privacy-block.cjs
 * Blocks Claude from reading sensitive files without user approval.
 * Applies to: .env, *.pem, *.key, credentials, secrets, SSH keys
 */

const path = require('path');

const SAFE_PATTERNS = [/\.example$/i, /\.sample$/i, /\.template$/i];
const PRIVACY_PATTERNS = [
  /^\.env$/,
  /^\.env\./,
  /\.env$/,
  /\/\.env\./,
  /credentials/i,
  /secrets?\.ya?ml$/i,
  /\.pem$/,
  /\.key$/,
  /id_rsa/,
  /id_ed25519/,
];

function isSafeFile(filePath) {
  const basename = path.basename(filePath || '');
  return SAFE_PATTERNS.some(p => p.test(basename));
}

function isPrivacySensitive(filePath) {
  if (!filePath) return false;
  if (isSafeFile(filePath)) return false;
  const basename = path.basename(filePath);
  return PRIVACY_PATTERNS.some(p => p.test(basename) || p.test(filePath));
}

function extractPaths(toolInput) {
  const paths = [];
  if (!toolInput) return paths;
  if (toolInput.file_path) paths.push(toolInput.file_path);
  if (toolInput.path) paths.push(toolInput.path);
  return paths.filter(Boolean);
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  let event;
  try {
    event = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  const { tool_name, tool_input } = event;
  if (!tool_name || !tool_input) process.exit(0);

  const paths = extractPaths(tool_input);
  for (const filePath of paths) {
    if (isPrivacySensitive(filePath)) {
      const basename = path.basename(filePath);
      const response = {
        type: 'block',
        message: `Blocked: "${basename}" may contain sensitive data (API keys, secrets). Approve access explicitly if needed.`
      };
      process.stdout.write(JSON.stringify(response));
      process.exit(0);
    }
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
