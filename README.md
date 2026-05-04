# ios-claude-kit

Claude Code toolkit for iOS development with SwiftUI + Clean Architecture.

## What's Inside

| Component | Trigger | Description |
|-----------|---------|-------------|
| `skills/bootstrap-ios` | `/bootstrap-ios` | Bootstrap a new iOS project from template |
| `skills/ios-build` | `/ios-build` | Typecheck, build, run tests via xcodebuild |
| `skills/ios-plan` | `/ios-plan <feature>` | Plan a feature before implementing |
| `agents/ios-git-manager` | auto | Commit/push — ignores xcuserdata, Pods |
| `agents/ios-code-reviewer` | auto | Review Swift for Clean Architecture violations |
| `output-styles/ios-level-2-mid` | mention in prompt | Mid-level iOS explanation style |
| `output-styles/ios-level-3-senior` | mention in prompt | Senior trade-offs focused style |
| `hooks/privacy-block.cjs` | auto | Blocks reading .env, *.pem, *.key |
| `hooks/notifications/notify.cjs` | auto | macOS/Slack/Telegram notify on task complete |

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
│   └── output-styles/
├── base-swiftui/           ← Xcode source
├── CLAUDE.md               ← project-specific rules (from template)
└── Podfile
```

The kit lives in `.claude/` as a nested git repo. The project's git does not track `.claude/` — they are fully independent.

## Contributing

1. Clone this repo, make changes, test in a real project
2. Open a PR → maintainer merges
3. Devs run `cd <project>/.claude && git pull` to get updates
