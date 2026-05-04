---
name: ios-build
description: Build, typecheck, and run tests for the iOS project using xcodebuild and swift. Use when user asks to build, check errors, run tests, or verify the project compiles.
---

# iOS Build

Run build, typecheck, and test commands for the Base-Swift-UI Xcode project.

## Auto-detect Project

Always use the workspace file:
```bash
WORKSPACE=$(ls *.xcworkspace | head -1)
SCHEME=$(xcodebuild -list -workspace "$WORKSPACE" 2>/dev/null | grep -A5 "Schemes:" | tail -n +2 | head -1 | xargs)
```

## Commands

### Typecheck Only (fastest — for syntax/type errors)
```bash
xcodebuild \
  -workspace base-swiftui.xcworkspace \
  -scheme base-swiftui \
  -destination "generic/platform=iOS Simulator" \
  -skipPackagePluginValidation \
  OTHER_SWIFT_FLAGS="-typecheck" \
  build 2>&1 | grep -E "error:|warning:|Build succeeded|Build FAILED"
```

### Full Build
```bash
xcodebuild \
  -workspace base-swiftui.xcworkspace \
  -scheme base-swiftui \
  -destination "platform=iOS Simulator,name=iPhone 16" \
  -configuration Debug \
  build 2>&1 | tail -50
```

### Run Tests
```bash
xcodebuild \
  -workspace base-swiftui.xcworkspace \
  -scheme base-swiftui \
  -destination "platform=iOS Simulator,name=iPhone 16" \
  test 2>&1 | grep -E "Test Case|error:|FAILED|passed|Executed"
```

### Single File Typecheck
```bash
swift -typecheck \
  -sdk $(xcrun --show-sdk-path --sdk iphonesimulator) \
  -target arm64-apple-ios17.6-simulator \
  path/to/File.swift
```

## Output Filtering

Always pipe through filters to reduce noise:
```bash
| grep -E "error:|warning:|Build succeeded|Build FAILED|Test Case|Executed [0-9]+ test"
```

## Rules

- Always use `.xcworkspace`, never `.xcodeproj`
- Default simulator: `iPhone 16` (iOS 17.6+)
- For CI/quick checks: use typecheck mode first, full build only if needed
- If build fails with Factory errors: run `pod deintegrate && pod install` first
- Report: error count, warning count, success/failure status
