#!/usr/bin/env node
/**
 * privacy-checker.cjs - Privacy pattern matching logic for sensitive file detection
 *
 * Pure logic module — no stdin/stdout, no exit codes.
 * Used by privacy-block.cjs hook.
 */

const path = require('path');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const APPROVED_PREFIX = 'APPROVED:';

// Safe file patterns — exempt from privacy checks (docs/templates)
const SAFE_PATTERNS = [
  /\.example$/i,
  /\.sample$/i,
  /\.template$/i,
];

// Privacy-sensitive patterns
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

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function isSafeFile(testPath) {
  if (!testPath) return false;
  const basename = path.basename(testPath);
  return SAFE_PATTERNS.some(p => p.test(basename));
}

function hasApprovalPrefix(testPath) {
  return testPath && testPath.startsWith(APPROVED_PREFIX);
}

function stripApprovalPrefix(testPath) {
  return hasApprovalPrefix(testPath) ? testPath.slice(APPROVED_PREFIX.length) : testPath;
}

function isSuspiciousPath(strippedPath) {
  return strippedPath.includes('..') || path.isAbsolute(strippedPath);
}

function isPrivacySensitive(testPath) {
  if (!testPath) return false;

  const cleanPath = stripApprovalPrefix(testPath);
  let normalized = cleanPath.replace(/\\/g, '/');

  // Decode URI components to catch obfuscated paths (%2e = '.')
  try { normalized = decodeURIComponent(normalized); } catch {}

  if (isSafeFile(normalized)) return false;

  const basename = path.basename(normalized);
  return PRIVACY_PATTERNS.some(p => p.test(basename) || p.test(normalized));
}

/**
 * Extract paths from tool input, including Bash command scanning
 */
function extractPaths(toolInput) {
  const paths = [];
  if (!toolInput) return paths;

  if (toolInput.file_path) paths.push({ value: toolInput.file_path, field: 'file_path' });
  if (toolInput.path) paths.push({ value: toolInput.path, field: 'path' });
  if (toolInput.pattern) paths.push({ value: toolInput.pattern, field: 'pattern' });

  // Scan Bash commands for sensitive file references
  if (toolInput.command) {
    const approvedMatch = toolInput.command.match(/APPROVED:[^\s]+/g) || [];
    approvedMatch.forEach(p => paths.push({ value: p, field: 'command' }));

    if (approvedMatch.length === 0) {
      const envMatch = toolInput.command.match(/\.env[^\s]*/g) || [];
      envMatch.forEach(p => paths.push({ value: p, field: 'command' }));

      // Variable assignments: FILE=.env, ENV_FILE=.env.local
      const varAssignments = toolInput.command.match(/\w+=[^\s]*\.env[^\s]*/g) || [];
      varAssignments.forEach(a => {
        const value = a.split('=')[1];
        if (value) paths.push({ value, field: 'command' });
      });

      // Command substitution: $(cat .env)
      const cmdSubst = toolInput.command.match(/\$\([^)]*?(\.env[^\s)]*)[^)]*\)/g) || [];
      for (const subst of cmdSubst) {
        const inner = subst.match(/\.env[^\s)]*/);
        if (inner) paths.push({ value: inner[0], field: 'command' });
      }
    }
  }

  return paths.filter(p => p.value);
}

/**
 * Check if privacy block is disabled via .claude/.ck.json config
 */
function isPrivacyBlockDisabled(configDir) {
  try {
    const configPath = configDir
      ? path.join(configDir, '.ck.json')
      : path.join(process.cwd(), '.claude', '.ck.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.privacyBlock === false;
  } catch {
    return false;
  }
}

function buildBlockMessage(filePath) {
  const basename = path.basename(filePath);
  return `Blocked: "${basename}" may contain sensitive data (API keys, secrets). Approve access explicitly if needed.`;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CHECK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a tool call accesses privacy-sensitive files
 *
 * @param {Object} params
 * @param {string} params.toolName
 * @param {Object} params.toolInput
 * @param {Object} [params.options]
 * @param {boolean} [params.options.disabled]
 * @param {string}  [params.options.configDir]
 * @param {boolean} [params.options.allowBash] - Warn but don't block Bash (default: true)
 * @returns {{ blocked: boolean, filePath?: string, reason?: string, approved?: boolean, isBash?: boolean, suspicious?: boolean }}
 */
function checkPrivacy({ toolName, toolInput, options = {} }) {
  const { disabled, configDir, allowBash = true } = options;

  if (disabled || isPrivacyBlockDisabled(configDir)) return { blocked: false };

  const isBashTool = toolName === 'Bash';
  const paths = extractPaths(toolInput);

  for (const { value: testPath } of paths) {
    if (!isPrivacySensitive(testPath)) continue;

    if (hasApprovalPrefix(testPath)) {
      const strippedPath = stripApprovalPrefix(testPath);
      return { blocked: false, approved: true, filePath: strippedPath, suspicious: isSuspiciousPath(strippedPath) };
    }

    if (isBashTool && allowBash) {
      return { blocked: false, isBash: true, filePath: testPath, reason: `Bash command accesses sensitive file: ${testPath}` };
    }

    return { blocked: true, filePath: testPath, reason: buildBlockMessage(testPath) };
  }

  return { blocked: false };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  checkPrivacy,
  isSafeFile,
  isPrivacySensitive,
  hasApprovalPrefix,
  stripApprovalPrefix,
  isSuspiciousPath,
  extractPaths,
  isPrivacyBlockDisabled,
  APPROVED_PREFIX,
  SAFE_PATTERNS,
  PRIVACY_PATTERNS,
};
