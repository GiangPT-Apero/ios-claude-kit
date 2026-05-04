---
name: bootstrap-ios
description: Bootstrap a new iOS project from the Base-Swift-UI template. Clone the template locally or push to a GitHub repo, then rename the bundle ID and app name. Use when creating a new iOS app project.
---

# Bootstrap iOS

Bootstrap a **new** iOS project from the Base-Swift-UI Clean Architecture template.
Two modes: **local** (clone to current directory) or **remote** (clone + push to GitHub repo).

**New projects only. Existing content will be overwritten.**

## Template

`/Users/zangizntreal/IOS/Base-Swift-UI` (local) or the team's GitHub template repo.

## Arguments

```
/bootstrap-ios [target-repo-url] [bundle-id] [app-name]
```

| Param | Required | Description |
|-------|----------|-------------|
| Target URL | No | GitHub repo URL — omit for local mode |
| Bundle ID | No | e.g. `com.example.myapp` — omit to skip rename |
| App name | No | e.g. `MyApp` — omit to keep template name |

Examples:
- `/bootstrap-ios` — local clone, no rename
- `/bootstrap-ios com.yourorg.myapp MyApp` — local + rename
- `/bootstrap-ios https://github.com/Org/MyApp com.yourorg.myapp MyApp` — remote + rename

## Flow

### 1. Parse Arguments
- URL pattern → remote mode; no URL → local mode
- Dotted identifier (`com.x.y`) → bundle ID
- PascalCase or quoted string → app name
- Ask for missing target URL only in remote mode

### 2. Safety Check
- **Local:** verify current directory is empty (ignore hidden files and `.git`)
- **Remote:** `gh api repos/{owner}/{repo} --jq '.size'` — warn if size > 0, ask confirmation

### 3. Clone Template

**Local mode:**
```bash
git clone <template-url> . --origin template
```

**Remote mode:**
```bash
git clone <template-url> /tmp/ios-bootstrap
cd /tmp/ios-bootstrap
git remote set-url origin <target-repo-url>
git push -u origin main --force
```

### 4. Rename Bundle ID & App Name (if provided)

Update in these files:
- `*.xcodeproj/project.pbxproj` — `PRODUCT_BUNDLE_IDENTIFIER`, `PRODUCT_NAME`
- `Info.plist` — `CFBundleIdentifier`, `CFBundleName`, `CFBundleDisplayName`
- `*.entitlements` — app group / associated domains if present

```bash
# Bundle ID rename (dry-run first)
grep -r "com.apero.base-swiftui" --include="*.pbxproj" --include="*.plist" -l
# Then sed replace
```

Commit: `chore: rename bundle ID to <bundle-id>`
Remote mode only: `git push origin main`

### 5. Install Dependencies

```bash
pod install
```

If pod install fails:
```bash
pod repo update && pod install
```

### 6. Create TODO_LIST.md

```markdown
# TODO List — Post-Bootstrap Setup

- [ ] **Open workspace** — Always open `*.xcworkspace`, never `*.xcodeproj`
- [ ] **Replace bundle ID** — Verify in Xcode → Target → Signing & Capabilities (skip if done via agent)
- [ ] **Configure signing** — Set team and provisioning profile
- [ ] **Update APIEndpoint.swift** — Set your base API URL
- [ ] **Update Constants.swift** — App-specific constants, feature flags
- [ ] **Add GoogleService-Info.plist** — If using Firebase
- [ ] **Customize design system** — AppColors.swift, AppFonts.swift for brand colors/fonts
- [ ] **Update Localizable.strings** — Replace placeholder copy with real content
- [ ] **Review AppState.swift** — Add any global state your app needs
```

Commit: `docs: add post-bootstrap TODO list`

### 7. Clean Up
- Remote: `rm -rf /tmp/ios-bootstrap`
- Local: no cleanup

### 8. Report

Output: mode, bundle ID rename status, pod install status, TODO_LIST.md path, workspace file to open.

## Rules

- New projects only — target must be empty
- Force push in remote mode (handles initial commit repos)
- ALWAYS run `pod install` after clone
- Remind user to open `.xcworkspace` NOT `.xcodeproj`
- Stop on error — don't continue if clone/push/pod install fails

## References

See `references/post-bootstrap-guide.md` for detailed post-setup steps.
