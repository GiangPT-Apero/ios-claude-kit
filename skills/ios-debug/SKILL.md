---
name: ios-debug
description: Debug iOS build errors, runtime crashes, SwiftData issues, and CocoaPods problems systematically. Use when build fails, app crashes, tests fail, Xcode shows errors, or unexpected behavior occurs in Swift/SwiftUI code.
---

# iOS Debug

Systematic debugging for iOS projects — find root cause before applying fixes.

**Scope:** Xcode build errors, Swift compiler errors, runtime crashes, SwiftData issues, CocoaPods errors, memory leaks, SwiftUI layout bugs.
**Does NOT handle:** Backend API debugging, Android issues, CI/CD pipeline failures.

## Core Principle

**NO FIXES WITHOUT ROOT CAUSE FIRST.** Random fixes waste time and create new bugs.

## Mode Detection

```
/ios-debug                → ask: what is the error/symptom?
/ios-debug build          → build error investigation
/ios-debug crash          → runtime crash analysis
/ios-debug swiftdata      → SwiftData / CoreData issues
/ios-debug pods           → CocoaPods dependency problems
/ios-debug memory         → memory leaks / retain cycles
/ios-debug layout         → SwiftUI layout / rendering issues
```

## Phase 1 — Collect Evidence

Before diagnosing, gather:

1. **Full error message** — exact text, file, line number
2. **When it occurs** — build time / launch / specific action
3. **Recent changes** — last git commit, new pods, Xcode update
4. **Environment** — iOS version, Xcode version, device vs simulator

```bash
# Get recent changes
git log --oneline -10
git diff HEAD~1 --stat
```

## Phase 2 — Diagnose by Category

### Build Errors

**Compiler errors (`error:`):**
- Read the FIRST error — fix top-to-bottom, cascading errors disappear
- `cannot find type X in scope` → missing import, wrong target membership
- `value of type X has no member Y` → API mismatch, wrong Swift version
- `actor-isolated` / `@MainActor` → concurrency violation, add `await` or `@MainActor`

**Factory / CocoaPods import errors:**
```bash
pod deintegrate && pod install
# Then open *.xcworkspace (NOT *.xcodeproj)
```

**Module not found:**
```bash
# Clean build folder
xcodebuild clean -workspace *.xcworkspace -scheme $(ls *.xcworkspace | sed 's/.xcworkspace//')
pod install
```

**Signing errors:**
- Xcode → Target → Signing & Capabilities → set Team
- Or: `DEVELOPMENT_TEAM` missing in `.pbxproj`

### Runtime Crashes

**Symbolicate crash log:**
```bash
# Find .dSYM
find ~/Library/Developer/Xcode/Archives -name "*.dSYM" | head -5
# Symbolicate
xcrun atos -arch arm64 -o <app>.dSYM/Contents/Resources/DWARF/<app> -l <load_address> <crash_address>
```

**Common crash patterns:**

| Crash | Root Cause | Fix |
|-------|-----------|-----|
| `EXC_BAD_ACCESS` | Nil force-unwrap or dangling pointer | Remove `!`, use `guard let` |
| `Thread 1: signal SIGABRT` | Assertion failure or uncaught exception | Read full stack trace |
| `Fatal error: Index out of range` | Array bounds violation | Validate index before access |
| `NSInvalidArgumentException` | Nil passed to non-null ObjC API | Wrap in nil check |
| `SwiftUI: Publishing changes from background threads` | `@Published` updated off main thread | Add `@MainActor` to ViewModel |

**Read crash stack trace:**
1. Find first frame with YOUR code (not system frameworks)
2. That's the origin — trace backward to find what triggered it

### SwiftData Issues

**Schema migration crash on launch:**
- Bump schema version in `SchemaExtension.swift`
- Add `MigrationStage` if needed
- Clean app data on simulator: Device → Content & Privacy → Reset

**`#Predicate` crash:**
```swift
// ❌ Crashes — non-extracted variable
#Predicate<Item> { $0.name == someObject.name }

// ✅ Extract first
let name = someObject.name
#Predicate<Item> { $0.name == name }
```

**`@Model` not persisting:**
- Verify entity added to schema in `SchemaExtension.swift`
- Verify `ModelContainer` configured in App entry point
- Check `@Environment(\.modelContext)` injected correctly

**AsyncStream not updating UI:**
```swift
// Requires nonisolated on @ModelActor methods
@ModelActor actor MyActor {
    nonisolated func observe() -> AsyncStream<[Item]> { ... }
}
```

### CocoaPods Problems

```bash
# Full reset (nuclear option)
pod deintegrate
rm -rf ~/Library/Caches/CocoaPods
rm -rf Pods/ Podfile.lock
pod install

# If spec repo outdated
pod repo update && pod install
```

### Memory Leaks / Retain Cycles

**Detect with Instruments:**
1. Product → Profile → Leaks instrument
2. Allocations instrument for growth over time

**Common retain cycle patterns:**
```swift
// ❌ Strong capture in closure stored by self
self.onComplete = { self.handleComplete() }

// ✅ Weak capture
self.onComplete = { [weak self] in self?.handleComplete() }
```

**ViewModel Task leak:**
```swift
// ✅ Cancel on deinit
private var tasks: [Task<Void, Never>] = []
deinit { tasks.forEach { $0.cancel() } }
```

### SwiftUI Layout Issues

**Debug layout:**
```swift
// Add border to see frame
.border(.red)
// Print frame in layout
.overlay(GeometryReader { geo in
    Color.clear.onAppear { print(geo.frame(in: .global)) }
})
```

**Common issues:**
- `List` inside `ScrollView` → use `LazyVStack` instead
- Missing `.frame(maxWidth: .infinity)` → content not expanding
- Safe area overlap → add `.ignoresSafeArea()` or `.safeAreaInset()`

## Phase 3 — Apply Fix

1. Fix **one thing at a time**
2. Build immediately after each fix — don't batch unrelated fixes
3. If fix introduces new error → revert, re-diagnose

## Phase 4 — Verify

```bash
# Typecheck only (fast)
xcodebuild \
  -workspace *.xcworkspace \
  -scheme $(ls *.xcworkspace | sed 's/.xcworkspace//') \
  -destination "generic/platform=iOS Simulator" \
  OTHER_SWIFT_FLAGS="-typecheck" \
  build 2>&1 | grep -E "error:|warning:|Build succeeded|Build FAILED"
```

Run the original reproduction steps to confirm the bug is gone.

## Document Recurring Issues

After fixing, if issue was non-obvious:
```bash
# Add to CLAUDE.md under ## Known Issues
echo "## Known Issues\n- <issue>: <fix>" >> CLAUDE.md
```

## Rules

- Never apply multiple unrelated fixes at once
- Always read the FIRST error, not the last
- Clean build folder before declaring "it's an Xcode bug"
- Open `.xcworkspace`, never `.xcodeproj`
- Stop and ask user if root cause is unclear after Phase 2
