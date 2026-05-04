#!/bin/bash
# install.sh — Install ios-claude-kit into ~/.claude
# Usage: ./install.sh

set -e

KIT_DIR="$(cd "$(dirname "$0")" && pwd)/.claude"
TARGET_DIR="$HOME/.claude"

echo "ios-claude-kit installer"
echo "========================"
echo "Source:  $KIT_DIR"
echo "Target:  $TARGET_DIR"
echo ""

# Check if ~/.claude already exists
if [ -d "$TARGET_DIR" ]; then
  echo "WARNING: $TARGET_DIR already exists."
  echo "This will merge kit files into your existing ~/.claude."
  echo "Existing files with the same name will be overwritten."
  echo ""
  read -p "Continue? (y/N) " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# Create target directories
mkdir -p "$TARGET_DIR/agents"
mkdir -p "$TARGET_DIR/skills/bootstrap-ios/references"
mkdir -p "$TARGET_DIR/skills/ios-build"
mkdir -p "$TARGET_DIR/skills/ios-plan"
mkdir -p "$TARGET_DIR/output-styles"
mkdir -p "$TARGET_DIR/hooks/notifications"

# Copy files
cp -r "$KIT_DIR/agents/"* "$TARGET_DIR/agents/"
cp -r "$KIT_DIR/skills/"* "$TARGET_DIR/skills/"
cp -r "$KIT_DIR/output-styles/"* "$TARGET_DIR/output-styles/"
cp -r "$KIT_DIR/hooks/"* "$TARGET_DIR/hooks/"

echo ""
echo "Installed successfully."
echo ""
echo "Next steps:"
echo "  1. Review ~/.claude/hooks/notifications/.env.example"
echo "     Copy to .env and fill in webhook URLs if you want Slack/Telegram notifications"
echo "  2. Open any iOS project in Claude Code — skills are now available"
echo "  3. To update later: cd $(pwd) && git pull && ./install.sh"
