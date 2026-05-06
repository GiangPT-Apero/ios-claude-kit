---
name: ios-setup
description: Post-bootstrap iOS project setup — Firebase, signing, API config, and environment configuration. Use after bootstrapping a new iOS project, or when setting up Firebase, configuring API endpoints, signing certificates, or asking about GoogleService-Info.plist.
---

# iOS Setup

Interactive setup for post-bootstrap iOS project configuration.

**Scope:** Firebase, signing, API endpoints, environment config, CocoaPods integration.
**Does NOT handle:** Design system (use `/ios-design-system`), feature implementation (use `/ios-feature`), build errors (use `/ios-debug`).

## Arguments

```
/ios-setup                  → show TODO_LIST.md + interactive menu
/ios-setup firebase         → Firebase integration (Analytics, Crashlytics, etc.)
/ios-setup signing          → code signing configuration
/ios-setup api              → API endpoint + environment config
/ios-setup all              → full guided setup walkthrough
```

## Default — Show Status

When called with no arguments:

1. Read `TODO_LIST.md` if it exists
2. Show checklist of remaining setup items
3. Ask which to configure first

## Firebase Setup

### 1. Add Firebase SDK

Ask which Firebase services are needed:
- Analytics (always recommended)
- Crashlytics
- Remote Config
- Push Notifications (FCM)
- Auth

Add to `Podfile`:
```ruby
# Required for all Firebase
pod 'Firebase/Analytics'

# Add as needed:
pod 'Firebase/Crashlytics'
pod 'Firebase/RemoteConfig'
pod 'Firebase/Messaging'
pod 'Firebase/Auth'
```

Run:
```bash
pod install
```

### 2. Add GoogleService-Info.plist

Instruct user:
1. Go to Firebase Console → Project Settings → Download `GoogleService-Info.plist`
2. Drag into Xcode → `<AppName>/Resources/` (ensure "Add to target" is checked)
3. **Never commit** this file — add to `.gitignore`:

```bash
echo "GoogleService-Info.plist" >> .gitignore
git add .gitignore
git commit -m "chore: ignore GoogleService-Info.plist"
```

### 3. Initialize Firebase in App

Find the `@main` App struct and add:

```swift
import Firebase

@main
struct MyApp: App {
    init() {
        FirebaseApp.configure()
    }
    // ...
}
```

### 4. Crashlytics dSYM upload (if using Crashlytics)

Add Run Script phase in Xcode:
- Target → Build Phases → `+` → New Run Script Phase
- Script:
```bash
"${PODS_ROOT}/FirebaseCrashlytics/run"
```
- Input Files:
```
${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}
${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}/Contents/Resources/DWARF/${TARGET_NAME}
${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}/Contents/Info.plist
$(TARGET_BUILD_DIR)/$(UNLOCALIZED_RESOURCES_FOLDER_PATH)/GoogleService-Info.plist
$(TARGET_BUILD_DIR)/$(EXECUTABLE_PATH)
```

### 5. Verify Firebase setup

```bash
# Build to confirm no errors
xcodebuild \
  -workspace *.xcworkspace \
  -scheme $(ls *.xcworkspace | sed 's/.xcworkspace//') \
  -destination "generic/platform=iOS Simulator" \
  OTHER_SWIFT_FLAGS="-typecheck" \
  build 2>&1 | grep -E "error:|Build succeeded|Build FAILED"
```

## Signing Configuration

### Automatic signing (recommended for development)

1. Xcode → Target → Signing & Capabilities
2. Check "Automatically manage signing"
3. Select your Team from dropdown
4. Xcode will auto-create/update provisioning profiles

### Manual signing (for CI/CD or distribution)

Provide guidance for:
- Export certificate from Keychain as `.p12`
- Download provisioning profile from developer.apple.com
- Import into Xcode

### App Groups (if using SharedContainer)

1. Xcode → Target → Signing & Capabilities → `+` → App Groups
2. Add `group.<bundle-id>`
3. Also add to Extension targets if any

### Push Notifications capability

1. Xcode → Target → Signing & Capabilities → `+` → Push Notifications
2. Also add Background Modes → Remote notifications

## API Configuration

### Read existing APIEndpoint.swift

```bash
# Find the file
find . -name "APIEndpoint.swift" -not -path "*/Pods/*"
```

### Update base URL

```swift
// Data/DataSource/Remote/Network/APIEndpoint.swift
private var baseURL: String {
    #if DEBUG
    return "https://api-staging.yourapp.com/v1"
    #else
    return "https://api.yourapp.com/v1"
    #endif
}
```

### Environment-based configuration

If project needs multiple environments (dev/staging/prod):

1. Add Build Configuration: Xcode → Project → Info → Configurations → `+`
2. Add to `Info.plist`:
```xml
<key>API_BASE_URL</key>
<string>$(API_BASE_URL)</string>
```
3. Add to `.xcconfig` per environment:
```
// Config-Debug.xcconfig
API_BASE_URL = https://api-staging.yourapp.com/v1
```
4. Read in Swift:
```swift
let baseURL = Bundle.main.infoDictionary?["API_BASE_URL"] as? String ?? ""
```

## Update TODO_LIST.md

After each setup step is completed, mark it done in `TODO_LIST.md`:
```
- [x] **Add GoogleService-Info.plist** — Firebase configured
```

Commit after each major setup:
```bash
git add -A
git commit -m "chore: configure <module> setup"
```

## Common Setup Issues

| Issue | Fix |
|-------|-----|
| `FirebaseApp.configure()` crash | `GoogleService-Info.plist` missing or wrong target |
| Pod not found after adding | Run `pod install`, open `.xcworkspace` |
| Signing error "no account" | Add Apple ID in Xcode → Preferences → Accounts |
| "Provisioning profile doesn't include capability" | Enable capability in Xcode matches Developer Portal |
| API returns 401 after setup | Check if base URL has trailing slash mismatch |

## Rules

- Never commit `GoogleService-Info.plist` — always gitignore it
- Always use `*.xcworkspace` after pod changes
- Commit signing changes separately from feature code
- Use `#if DEBUG` for staging/dev API URLs — never hardcode in source
- After Podfile changes: `pod install` + clean build folder (`Cmd+Shift+K`)
