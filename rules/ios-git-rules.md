# iOS Git Rules

Conventions for git operations in iOS projects using this kit.

## Commit Message Format

```
<type>: <short description>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`, `test`

## Never Stage

- `*.xcuserdata`, `*.xcuserdatad` — personal Xcode settings
- `DerivedData/` — build artifacts
- `.DS_Store`
- `Pods/` — unless user explicitly requests

## Preferred Staging

Prefer staging by directory over `git add -A`:

```bash
# ✅ Preferred
git add base-swiftui/Features/Auth/

# ⚠️ Use only when all changes are intentional
git add -A
```

## iOS-Specific Commit Examples

```
feat: add user authentication with biometric fallback
fix: resolve SwiftData fetch crash on iOS 17.0
refactor: extract NetworkLayer to separate SPM package
chore: update Podfile.lock after pod update
docs: add post-bootstrap TODO_LIST
```

## Branch Naming

```
feat/user-authentication
fix/swiftdata-crash-ios17
refactor/network-layer
```

## Pre-Push Checklist

- [ ] No `xcuserdata` staged
- [ ] No `Pods/` staged (unless intentional)
- [ ] No force-push to `main`/`develop`
- [ ] `.xcworkspace` opens cleanly
- [ ] `pod install` has been run if Podfile changed
