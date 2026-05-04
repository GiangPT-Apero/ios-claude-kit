#!/bin/bash
# install.sh — Setup a new iOS project with ios-claude-kit
#
# Usage:
#   ./install.sh <project-path> [bundle-id] [app-name]
#
# Examples:
#   ./install.sh ~/Projects/MyApp
#   ./install.sh ~/Projects/MyApp com.company.myapp MyApp

set -e

TEMPLATE_REPO="https://github.com/GiangPT-Apero/base-swift-ui.git"
KIT_REPO="https://github.com/GiangPT-Apero/ios-claude-kit.git"

OLD_BUNDLE="com.apero.base-swiftui"
OLD_APP_NAME="base-swiftui"

PROJECT_PATH="$1"
BUNDLE_ID="$2"
APP_NAME="$3"

# ── Validate ────────────────────────────────────────────────────────────────

if [ -z "$PROJECT_PATH" ]; then
  echo "Usage: ./install.sh <project-path> [bundle-id] [app-name]"
  echo "Example: ./install.sh ~/Projects/MyApp com.company.myapp MyApp"
  exit 1
fi

PROJECT_PATH="${PROJECT_PATH/#\~/$HOME}"  # expand ~

if [ -d "$PROJECT_PATH" ] && [ "$(ls -A "$PROJECT_PATH" 2>/dev/null | grep -v '^\.')" ]; then
  echo "ERROR: $PROJECT_PATH is not empty."
  echo "Please provide an empty or non-existent directory."
  exit 1
fi

mkdir -p "$PROJECT_PATH"
cd "$PROJECT_PATH"

# ── Clone template ───────────────────────────────────────────────────────────

echo "Cloning iOS template..."
git clone "$TEMPLATE_REPO" . --quiet
echo "Template cloned."

# ── Ignore .claude/ in project git ──────────────────────────────────────────

echo ".claude/" >> .gitignore
git add .gitignore
git commit -m "chore: ignore .claude kit directory" --quiet

# ── Clone kit into .claude/ ──────────────────────────────────────────────────

echo "Installing ios-claude-kit into .claude/..."
git clone "$KIT_REPO" .claude --quiet
echo "Kit installed."

# ── Rename bundle ID ─────────────────────────────────────────────────────────

if [ -n "$BUNDLE_ID" ]; then
  echo "Renaming bundle ID to $BUNDLE_ID..."

  find . -not -path './.git/*' -not -path './.claude/*' -not -path './Pods/*' \
    \( -name "*.pbxproj" -o -name "*.plist" -o -name "*.entitlements" \) \
    -exec sed -i '' "s/$OLD_BUNDLE/$BUNDLE_ID/g" {} +

  git add -A
  git diff --cached --quiet || git commit -m "chore: rename bundle ID to $BUNDLE_ID" --quiet
  echo "Bundle ID renamed."
fi

# ── Rename app name ───────────────────────────────────────────────────────────

if [ -n "$APP_NAME" ]; then
  echo "Renaming app name to $APP_NAME..."

  find . -not -path './.git/*' -not -path './.claude/*' -not -path './Pods/*' \
    \( -name "*.pbxproj" -o -name "*.plist" -o -name "*.xcscheme" -o -name "Podfile" \) \
    -exec sed -i '' "s/$OLD_APP_NAME/$APP_NAME/g" {} +

  # Rename source folder on disk to match Xcode's PBXFileSystemSynchronizedRootGroup path
  if [ -d "$OLD_APP_NAME" ]; then
    mv "$OLD_APP_NAME" "$APP_NAME"
  fi

  git add -A
  git diff --cached --quiet || git commit -m "chore: rename app to $APP_NAME" --quiet
  echo "App name renamed."
fi

# ── Install CocoaPods ─────────────────────────────────────────────────────────

echo "Running pod install..."
pod install --silent
echo "CocoaPods installed."

# ── Done ──────────────────────────────────────────────────────────────────────

WORKSPACE=$(ls *.xcworkspace 2>/dev/null | head -1)

echo ""
echo "Project ready at: $PROJECT_PATH"
echo ""
echo "Next steps:"
echo "  1. open \"$PROJECT_PATH/$WORKSPACE\""
echo "  2. Set signing team: Xcode → Target → Signing & Capabilities"
echo "  3. See TODO_LIST.md for remaining setup"
echo ""
echo "To update ios-claude-kit later:"
echo "  cd \"$PROJECT_PATH/.claude\" && git pull"
