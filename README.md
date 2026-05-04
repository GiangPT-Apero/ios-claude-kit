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
- CocoaPods (`gem install cocoapods`)
- GitHub CLI (`brew install gh`) — only for `/bootstrap-ios` remote mode

## Installation

**Option A — Clone directly into `~/.claude` (recommended):**
```bash
git clone git@github.com:org/ios-claude-kit.git ~/.claude
```

Skills and agents are available immediately in all projects.

**Option B — Clone elsewhere and run installer:**
```bash
git clone git@github.com:org/ios-claude-kit.git ~/ios-claude-kit
cd ~/ios-claude-kit
chmod +x install.sh
./install.sh
```

Use Option B if you already have things in `~/.claude` you want to keep.

## Update

```bash
cd ~/.claude && git pull
```

If you used Option B:
```bash
cd ~/ios-claude-kit && git pull && ./install.sh
```

## Template Setup (per project)

This kit works best with the [Base-Swift-UI](https://github.com/org/base-swift-ui) template.

After cloning a new project:
```bash
git clone git@github.com:org/base-swift-ui.git MyApp
cd MyApp
pod install
open *.xcworkspace
```

The project's `.claude/` folder (rules + settings) is already included in the template — no extra setup needed.

## Usage

### Bootstrap a new project
Open an empty folder in Claude Code, then:
```
/bootstrap-ios com.company.myapp MyApp
```

### Plan a new feature
```
/ios-plan user authentication with biometrics
```

### Build / typecheck
```
/ios-build
```

### Notifications (optional)
```bash
cp ~/.claude/hooks/notifications/.env.example ~/.claude/hooks/notifications/.env
# Edit .env — add SLACK_WEBHOOK_URL or TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
```

## Contributing

1. Make changes in your local clone
2. Test in a real iOS project
3. Open a PR — maintainer reviews + merges
4. Team members run `cd ~/.claude && git pull` to get updates
