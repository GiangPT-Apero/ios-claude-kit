/**
 * Slack notification provider — iOS Claude Kit (Block Kit format)
 */
'use strict';

const path = require('path');
const { send } = require('../lib/sender.cjs');

function getTitle(hookType) {
  switch (hookType) {
    case 'Stop': return '🍎 iOS Task Completed';
    case 'SubagentStop': return '🤖 iOS Subagent Completed';
    case 'AskUserPrompt': return '💬 iOS: Input Needed';
    default: return '📝 iOS Code Event';
  }
}

function buildBlocks(input, hookType, project, session) {
  const timestamp = new Date().toLocaleString();
  const cwd = input.cwd || 'Unknown';

  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: getTitle(hookType) } },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Project:*\n${project}` },
        { type: 'mrkdwn', text: `*Time:*\n${timestamp}` },
        { type: 'mrkdwn', text: `*Session:*\n\`${session}...\`` },
        { type: 'mrkdwn', text: `*Event:*\n${hookType}` },
      ],
    },
    { type: 'divider' },
    { type: 'context', elements: [{ type: 'mrkdwn', text: `📍 \`${cwd}\`` }] },
  ];

  if (hookType === 'SubagentStop' && input.agent_type) {
    blocks.splice(2, 0, {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Agent:* ${input.agent_type}` },
    });
  }

  return blocks;
}

module.exports = {
  name: 'slack',
  isEnabled: env => !!env.SLACK_WEBHOOK_URL,
  send: async (input, env) => {
    const hookType = input.hook_event_name || 'unknown';
    const project = path.basename(input.cwd || '') || 'Unknown';
    const session = (input.session_id || '').slice(0, 8);

    return send('slack', env.SLACK_WEBHOOK_URL, {
      text: `iOS Claude Kit: ${hookType} in ${project}`,
      blocks: buildBlocks(input, hookType, project, session),
    });
  },
};
