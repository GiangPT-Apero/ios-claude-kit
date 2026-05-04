/**
 * Telegram notification provider — iOS Claude Kit
 */
'use strict';

const path = require('path');
const { send } = require('../lib/sender.cjs');

function getTimestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ` +
         `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function formatMessage(input) {
  const hookType = input.hook_event_name || 'unknown';
  const cwd = input.cwd || '';
  const sessionId = input.session_id || '';
  const project = cwd ? path.basename(cwd) : 'unknown';
  const timestamp = getTimestamp();
  const session = sessionId ? `${sessionId.slice(0, 8)}...` : 'N/A';

  switch (hookType) {
    case 'Stop':
      return `🍎 *iOS Task Completed*\n\n📅 *Time:* ${timestamp}\n📁 *Project:* ${project}\n🆔 *Session:* ${session}\n\n📍 *Location:* \`${cwd}\``;

    case 'SubagentStop':
      return `🤖 *iOS Subagent Completed*\n\n📅 *Time:* ${timestamp}\n📁 *Project:* ${project}\n🔧 *Agent:* ${input.agent_type || 'unknown'}\n🆔 *Session:* ${session}\n\n📍 *Location:* \`${cwd}\``;

    case 'AskUserPrompt':
      return `💬 *iOS: Input Needed*\n\n📅 *Time:* ${timestamp}\n📁 *Project:* ${project}\n🆔 *Session:* ${session}\n\nClaude is waiting for your input.\n\n📍 *Location:* \`${cwd}\``;

    default:
      return `📝 *iOS Code Event*\n\n📅 *Time:* ${timestamp}\n📁 *Project:* ${project}\n📋 *Event:* ${hookType}\n🆔 *Session:* ${session}\n\n📍 *Location:* \`${cwd}\``;
  }
}

module.exports = {
  name: 'telegram',
  isEnabled: env => !!(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
  send: async (input, env) => {
    const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    return send('telegram', url, {
      chat_id: env.TELEGRAM_CHAT_ID,
      text: formatMessage(input),
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });
  },
};
