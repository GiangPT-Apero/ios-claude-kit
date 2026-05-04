/**
 * Discord notification provider — iOS Claude Kit (rich embed format)
 */
'use strict';

const path = require('path');
const { send } = require('../lib/sender.cjs');

const COLORS = {
  Stop: 5763719,         // Green
  SubagentStop: 3447003, // Blue
  AskUserPrompt: 15844367, // Yellow
  default: 10070709,     // Gray
};

function formatTimestamp() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function truncateSession(sessionId) {
  if (!sessionId) return 'N/A';
  return sessionId.length > 8 ? `${sessionId.slice(0, 8)}...` : sessionId;
}

function buildEmbed(input) {
  const hookType = input.hook_event_name || 'unknown';
  const cwd = input.cwd || '';
  const project = path.basename(cwd) || 'Unknown';
  const session = truncateSession(input.session_id);
  const color = COLORS[hookType] || COLORS.default;

  const titles = {
    Stop: '🍎 iOS Task Completed',
    SubagentStop: '🤖 iOS Subagent Completed',
    AskUserPrompt: '💬 iOS: Input Needed',
  };

  const fields = [
    { name: '⏰ Time', value: formatTimestamp(), inline: true },
    { name: '🆔 Session', value: `\`${session}\``, inline: true },
    { name: '📍 Location', value: `\`${cwd || 'Unknown'}\``, inline: false },
  ];

  if (hookType === 'SubagentStop' && input.agent_type) {
    fields.splice(1, 0, { name: '🔧 Agent', value: input.agent_type, inline: true });
  }

  return {
    title: titles[hookType] || '📝 iOS Code Event',
    color,
    timestamp: new Date().toISOString(),
    footer: { text: `Project • ${project}` },
    fields,
  };
}

module.exports = {
  name: 'discord',
  isEnabled: env => !!env.DISCORD_WEBHOOK_URL,
  send: async (input, env) => {
    return send('discord', env.DISCORD_WEBHOOK_URL, { embeds: [buildEmbed(input)] });
  },
};
