#!/usr/bin/env node
/**
 * scout-block.cjs
 * PreToolUse hook — blocks overly broad Glob patterns at project root.
 * Prevents context overflow from scanning ALL Swift/project files.
 *
 * Register in settings.json:
 * {
 *   "hooks": {
 *     "PreToolUse": [{ "matcher": "Glob", "hooks": [{ "type": "command", "command": "node .claude/hooks/scout-block/scout-block.cjs" }] }]
 *   }
 * }
 */

const { detectBroadPatternIssue, formatBlockMessage } = require('./broad-pattern-detector.cjs');

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  let event;
  try { event = JSON.parse(input); } catch { process.exit(0); }

  const { tool_name, tool_input } = event;
  if (tool_name !== 'Glob' || !tool_input) process.exit(0);

  const result = detectBroadPatternIssue(tool_input);

  if (result.blocked) {
    const message = formatBlockMessage(result);
    process.stdout.write(JSON.stringify({ type: 'block', message }));
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
