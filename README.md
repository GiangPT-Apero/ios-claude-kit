# ios-claude-kit

Claude Code toolkit for iOS development with SwiftUI + Clean Architecture.

## What's Inside

### Skills
| Component | Trigger | Description |
|-----------|---------|-------------|
| `skills/bootstrap-ios` | `/bootstrap-ios` | Bootstrap a new iOS project from template |
| `skills/ios-setup` | `/ios-setup [firebase\|signing\|api]` | Post-bootstrap setup — Firebase, signing, API config |
| `skills/ios-feature` | `/ios-feature <feature>` | Plan + implement a full feature end-to-end |
| `skills/ios-build` | `/ios-build` | Typecheck, build, run tests via xcodebuild |
| `skills/ios-debug` | `/ios-debug [build\|crash\|swiftdata\|pods\|memory\|layout]` | Debug build errors, crashes, and runtime issues |
| `skills/ios-plan` | `/ios-plan <feature>` | Plan a feature before implementing |
| `skills/ios-design-system` | `/ios-design-system [colors\|fonts\|spacing\|figma]` | Setup brand colors, fonts, and spacing tokens |
| `skills/ios-analytics` | `/ios-analytics [add\|audit]` | Add event tracking with AnalyticsEvent + EventTracking |
| `skills/ios-remote-config` | `/ios-remote-config [add\|audit]` | Add Firebase Remote Config keys (basic + JSON types) |
| `skills/ios-coordinator` | `/ios-coordinator [add-route\|new-flow\|cross-flow]` | Add routes, flows, and cross-flow navigation |
| `skills/ios-skill-creator` | `/ios-skill-creator` | Create a new skill for this kit |

### Agents
| Component | Trigger | Description |
|-----------|---------|-------------|
| `agents/ios-git-manager` | auto | Commit/push — ignores xcuserdata, Pods |
| `agents/ios-code-reviewer` | auto | Review Swift for Clean Architecture violations |

### Output Styles (mention in prompt to activate)
| Component | Level | For |
|-----------|-------|-----|
| `output-styles/ios-level-0-eli5` | 0 | Complete beginners — no coding experience |
| `output-styles/ios-level-1-junior` | 1 | Junior devs (0-2 years) — learning patterns |
| `output-styles/ios-level-2-mid` | 2 | Mid-level (2-4 years) — knows Swift basics |
| `output-styles/ios-level-3-senior` | 3 | Senior (5-8 years) — trade-offs focused |
| `output-styles/ios-level-4-lead` | 4 | Tech Lead (8-15 years) — risk/business alignment |
| `output-styles/ios-level-5-god` | 5 | Expert (15+ years) — maximum velocity |

### Hooks
| Component | Event | Description |
|-----------|-------|-------------|
| `hooks/privacy-block.cjs` | PreToolUse | Blocks .env, *.pem, *.key — with Bash scanning + APPROVED: bypass |
| `hooks/scout-block/scout-block.cjs` | PreToolUse | Blocks overly broad glob patterns (context overflow prevention) |
| `hooks/notifications/notify.cjs` | PostTask | macOS + Slack + Telegram + Discord notify on task complete |

### Rules
| Component | Description |
|-----------|-------------|
| `rules/ios-documentation.md` | Auto-update rules for plans, TODO_LIST, CLAUDE.md |
| `rules/ios-git-rules.md` | Commit conventions, never-stage list, branch naming |

## Requirements

- Claude Code CLI
- Xcode 15+
- CocoaPods (`sudo gem install cocoapods`)
- GitHub CLI (`brew install gh`) — only for remote operations

## Setup a New Project

### Option A — One-line installer (recommended)

```bash
# Clone kit anywhere
git clone https://github.com/GiangPT-Apero/ios-claude-kit.git ~/ios-claude-kit
chmod +x ~/ios-claude-kit/install.sh

# Bootstrap new project
~/ios-claude-kit/install.sh ~/Projects/MyApp com.company.myapp MyApp
```

This will:
1. Clone the Base-Swift-UI template into `~/Projects/MyApp`
2. Clone this kit into `~/Projects/MyApp/.claude/`
3. Rename bundle ID and app name
4. Run `pod install`

Then open in Claude Code:
```bash
cd ~/Projects/MyApp
claude .
```

### Option B — Manual steps

```bash
mkdir MyApp && cd MyApp

# Clone template
git clone https://github.com/GiangPT-Apero/base-swift-ui.git .

# Clone kit into .claude/ (nested repo — does not conflict with project git)
git clone https://github.com/GiangPT-Apero/ios-claude-kit.git .claude

# Install dependencies
pod install
open *.xcworkspace
```

## Update Kit

Each project has its own copy of the kit in `.claude/`. To update:

```bash
cd MyApp/.claude && git pull
```

To update all projects at once, run in each project:
```bash
cd <project>/.claude && git pull
```

## How It Works

```
MyApp/                      ← project git repo
├── .claude/                ← ios-claude-kit (separate nested git repo)
│   ├── .git/               ← kit's own git history
│   ├── skills/
│   ├── agents/
│   ├── hooks/
│   │   ├── privacy-block.cjs        ← blocks .env, .pem, .key
│   │   ├── lib/privacy-checker.cjs  ← shared logic (Bash scanning, APPROVED: bypass)
│   │   ├── scout-block/             ← blocks overly broad glob patterns
│   │   └── notifications/           ← macOS/Slack/Telegram/Discord
│   ├── output-styles/               ← levels 0-5
│   └── rules/                       ← documentation & git conventions
├── base-swiftui/           ← Xcode source
├── CLAUDE.md               ← project-specific rules (from template)
└── Podfile
```

The kit lives in `.claude/` as a nested git repo. The project's git does not track `.claude/` — they are fully independent.

## Contributing

1. Clone this repo, make changes, test in a real project
2. Open a PR → maintainer merges
3. Devs run `cd <project>/.claude && git pull` to get updates
