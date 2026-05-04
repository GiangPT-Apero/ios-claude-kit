#!/usr/bin/env node
/**
 * privacy-block.cjs
 * Blocks Claude from reading sensitive files without user approval.
 * Applies to: .env, *.pem, *.key, credentials, secrets, SSH keys
 *
 * Features:
 * - Detects sensitive paths in Read, Write, Glob, and Bash commands
 * - APPROVED: prefix bypass for explicit user consent
 * - URI decode to catch obfuscated paths
 * - Path traversal detection
 * - Disable via .claude/.ck.json { "privacyBlock": false }
 */

const { checkPrivacy } = require('./lib/privacy-checker.cjs');

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

  const result = checkPrivacy({ toolName: tool_name, toolInput: tool_input });

  if (result.blocked) {
    process.stdout.write(JSON.stringify({ type: 'block', message: result.reason }));
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
