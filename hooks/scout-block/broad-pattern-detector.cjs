#!/usr/bin/env node
/**
 * broad-pattern-detector.cjs
 * Prevents overly broad glob patterns that flood context with ALL files.
 *
 * Example blocked: pattern="**\/*.swift" at project root → returns every Swift file
 * Example allowed: pattern="**\/*.swift" at path="base-swiftui/Features/Auth"
 */

// Patterns that recursively match everywhere when at root
const BROAD_PATTERN_REGEXES = [
  /^\*\*$/,           // **
  /^\*$/,             // *
  /^\*\*\/\*$/,       // **/*
  /^\*\*\/\.\*$/,     // **/.* (all dotfiles)
  /^\*\.\w+$/,        // *.swift, *.md at root
  /^\*\.\{[^}]+\}$/,  // *.{swift,md} at root
  /^\*\*\/\*\.\w+$/,  // **/*.swift everywhere
  /^\*\*\/\*\.\{[^}]+\}$/, // **/*.{swift,m} everywhere
];

// iOS/Swift-specific source directories — scoped searches here are OK
const SPECIFIC_DIRS = [
  // Generic
  'src', 'lib', 'app', 'apps', 'packages', 'components',
  'utils', 'helpers', 'services', 'tests', '__tests__', 'spec',
  // iOS Clean Architecture layers
  'Domain', 'Data', 'Presentation', 'Core', 'Features',
  'ViewModels', 'Views', 'Models', 'Repository', 'Interactors',
  'DataSource', 'Mappers', 'Coordinators', 'DI',
  // Common Xcode project dirs
  'base-swiftui', 'Sources', 'Resources', 'Supporting Files',
  'Preview Content', 'Tests', 'UITests',
];

// High-risk path indicators (project/worktree root)
const HIGH_RISK_INDICATORS = [
  /\/worktrees\/[^/]+\/?$/,
  /^\.?\/?$/,
  /^[^/]+\/?$/,
];

function isBroadPattern(pattern) {
  if (!pattern || typeof pattern !== 'string') return false;
  return BROAD_PATTERN_REGEXES.some(r => r.test(pattern.trim()));
}

function hasSpecificDirectory(pattern) {
  if (!pattern) return false;
  for (const dir of SPECIFIC_DIRS) {
    if (pattern.startsWith(`${dir}/`) || pattern.startsWith(`./${dir}/`)) return true;
  }
  // Any non-glob directory prefix is specific
  const firstSegment = pattern.split('/')[0];
  if (firstSegment && !firstSegment.includes('*') && firstSegment !== '.') return true;
  return false;
}

function isHighLevelPath(basePath) {
  if (!basePath) return true; // no path = CWD = project root

  const normalized = basePath.replace(/\\/g, '/');
  if (HIGH_RISK_INDICATORS.some(r => r.test(normalized))) return true;

  const segments = normalized.split('/').filter(s => s && s !== '.');
  if (segments.length <= 1) return true;

  // If the path doesn't pass through a known specific directory, it's high-level
  const hasSpecific = SPECIFIC_DIRS.some(dir =>
    normalized.includes(`/${dir}/`) || normalized.includes(`/${dir}`) ||
    normalized.startsWith(`${dir}/`) || normalized === dir
  );
  return !hasSpecific;
}

function suggestPatterns(pattern) {
  const suggestions = [];
  const extMatch = pattern.match(/\*\.(\{[^}]+\}|\w+)$/);
  const ext = extMatch ? extMatch[1] : '';

  // iOS-specific suggestions
  const iosDirs = ['base-swiftui/Features', 'base-swiftui/Domain', 'base-swiftui/Data', 'base-swiftui/Presentation'];
  for (const dir of iosDirs) {
    suggestions.push(ext ? `${dir}/**/*.${ext}` : `${dir}/**/*`);
  }

  if (pattern.includes('.swift')) {
    suggestions.unshift('base-swiftui/Features/**/*.swift', 'base-swiftui/Domain/**/*.swift');
  }

  return suggestions.slice(0, 4);
}

/**
 * @param {{ pattern: string, path?: string }} toolInput
 * @returns {{ blocked: boolean, reason?: string, suggestions?: string[] }}
 */
function detectBroadPatternIssue(toolInput) {
  if (!toolInput || !toolInput.pattern) return { blocked: false };

  const { pattern, path: basePath } = toolInput;

  if (hasSpecificDirectory(pattern)) return { blocked: false };
  if (!isBroadPattern(pattern)) return { blocked: false };
  if (!isHighLevelPath(basePath)) return { blocked: false };

  return {
    blocked: true,
    reason: `Pattern '${pattern}' is too broad for ${basePath || 'project root'}`,
    pattern,
    suggestions: suggestPatterns(pattern),
  };
}

function formatBlockMessage(result) {
  const lines = [
    '',
    '\x1b[36mNOTE:\x1b[0m Intentional block — optimizing context window.',
    '',
    `\x1b[31mBLOCKED\x1b[0m: Overly broad glob pattern`,
    '',
    `  \x1b[33mPattern:\x1b[0m  ${result.pattern}`,
    `  \x1b[33mReason:\x1b[0m   Would return ALL matching files, flooding context`,
    '',
    '  \x1b[34mUse more specific patterns:\x1b[0m',
  ];
  for (const s of result.suggestions || []) lines.push(`    • ${s}`);
  lines.push('');
  lines.push('  \x1b[2mTip: Target a specific feature or layer directory\x1b[0m');
  lines.push('');
  return lines.join('\n');
}

module.exports = {
  isBroadPattern,
  hasSpecificDirectory,
  isHighLevelPath,
  suggestPatterns,
  detectBroadPatternIssue,
  formatBlockMessage,
  BROAD_PATTERN_REGEXES,
  SPECIFIC_DIRS,
};
