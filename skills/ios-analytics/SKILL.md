---
name: ios-analytics
description: Add analytics event tracking to an iOS feature. Use when user wants to track user actions, screen views, purchases, ATT/notification permission events, or asks about AnalyticsEvent, EventTracking, Firebase Analytics, Adjust MMP.
---

# iOS Analytics

Add event tracking using `AnalyticsEvent` enum + `EventTracking.logEvent(_:)`.

**Scope:** Firebase Analytics event logging, MMP attribution events (Adjust), ATT/notification permission events, purchase events, screen/action events.
**Does NOT handle:** Remote Config (use `/ios-remote-config`), push notifications setup, RevenueCat integration.

## Arguments

```
/ios-analytics                        → show existing events + ask what to add
/ios-analytics add <event-name>       → add new event to AnalyticsEvent
/ios-analytics audit                  → find screens/actions missing tracking
```

## File Locations

```
<AppName>/Core/Analytics/
├── AnalyticsEvent.swift    ← event enum + name/parameters extension
└── EventTracking.swift     ← static logEvent() wrapper
```

> Search with `Glob "**/*Analytics*" "**/*Tracking*"` if paths differ.

## Architecture

### EventTracking — call site

```swift
// Usage anywhere (ViewModel, Service, etc.)
EventTracking.logEvent(.screenView(screenId: .explore))
EventTracking.logEvent(.buttonTap(action: "save", screenId: .result))
```

`EventTracking` is a simple enum (no instances) with a single static method:

```swift
// Core/Analytics/EventTracking.swift
import Firebase

enum EventTracking {
    static func logEvent(_ event: AnalyticsEvent) {
        Analytics.logEvent(event.name, parameters: event.parameters)
        #if DEBUG
        if event.parameters.isEmpty {
            print("📊 Event Tracking: [\(event.name)]")
        } else {
            print("📊 Event Tracking: [\(event.name)] \(event.parameters)")
        }
        #endif
    }
}
```

### AnalyticsEvent — enum structure

Each event is a case. Associated values carry the required parameters.
The enum has two computed properties: `name` (snake_case string) and `parameters` (`[String: Any]`).

```swift
// Core/Analytics/AnalyticsEvent.swift
enum AnalyticsEvent {

    // MARK: - Screen Events
    case screenView(screenId: ScreenId)
    case buttonTap(action: String, screenId: ScreenId)

    // MARK: - Feature Events
    case generateStart(styleName: String, userType: UserType, userStatus: UserStatus)
    case generateSuccess(styleName: String, processingTime: Double)
    case generateFail(errorMessage: String, styleName: String)
}

// MARK: - Event Name & Parameters
extension AnalyticsEvent {

    var name: String {
        switch self {
        case .screenView: return "screen_view"
        case .buttonTap: return "button_tap"
        case .generateStart: return "generate_start"
        case .generateSuccess: return "generate_success"
        case .generateFail: return "generate_fail"
        }
    }

    var parameters: [String: Any] {
        switch self {
        case .screenView(let screenId):
            return ["screen_id": screenId.rawValue]

        case .buttonTap(let action, let screenId):
            return [
                "action": action,
                "screen_id": screenId.rawValue
            ]

        case .generateStart(let styleName, let userType, let userStatus):
            return [
                "style_name": styleName,
                "user_type": userType.rawValue,
                "user_status": userStatus.rawValue
            ]

        case .generateSuccess(let styleName, let processingTime):
            return [
                "style_name": styleName,
                "processing_time": processingTime
            ]

        case .generateFail(let errorMessage, let styleName):
            return [
                "error_message": errorMessage,
                "style_name": styleName
            ]
        }
    }
}
```

## Adding a New Event

### Step 1 — Add the case

Add to `AnalyticsEvent` enum with associated values for all required parameters:

```swift
// Optional parameters → use default values or make them Optional
case featureAction(action: FeatureActionType, userId: String, source: String? = nil)
```

### Step 2 — Add `name`

Add `snake_case` string to the `name` switch:

```swift
case .featureAction: return "feature_action"
```

### Step 3 — Add `parameters`

Build `[String: Any]` dict. Omit nil optional values:

```swift
case .featureAction(let action, let userId, let source):
    var params: [String: Any] = [
        "action": action.rawValue,
        "user_id": userId
    ]
    if let source { params["source"] = source }
    return params
```

### Step 4 — Add supporting enums (if needed)

Add `RawRepresentable` enums at the bottom of `AnalyticsEvent.swift`:

```swift
enum FeatureActionType: String {
    case tap = "tap"
    case longPress = "long_press"
    case swipe = "swipe"
}
```

### Step 5 — Call from ViewModel

Fire events from `@MainActor` ViewModel methods, never from View directly:

```swift
// FeatureViewModel.swift
func userDidTapSave() {
    EventTracking.logEvent(.featureAction(action: .tap, userId: userId, source: "result_screen"))
    // ...business logic
}
```

## Standard Event Categories

These categories should exist in every project. Add cases as features grow:

| Category | Event naming pattern | When to fire |
|----------|---------------------|--------------|
| Screen views | `xxx_view` | `.onAppear` in ViewModel `load()` |
| CTA clicks | `xxx_click` | Button tap handler in ViewModel |
| Success | `xxx_success` | After async operation completes |
| Failure | `xxx_fail` | In `catch` block |
| Permission | `att_*`, `popup_noti_*` | Permission request/result callbacks |
| Purchase | `iap_view`, `iap_btn_click`, `iap_successful` | Paywall + RevenueCat callbacks |
| Attribution | `user_attributions`, `user_id_mapping` | MMP SDK callbacks (Adjust/AppsFlyer) |

## ATT & Notification Events

These are standard events — add once during project setup:

```swift
// ATT events
case attStatusCheck(status: ATTStatus)    // before requesting ATT
case attView                              // ATT popup shown
case attAllow                             // user allowed
case attDeny                              // user denied

// Notification events
case popupNotiShown
case popupNotiAllow
case popupNotiDeny
```

Supporting enums:
```swift
enum ATTStatus: String {
    case authorized, denied, undetermined, restricted
}
```

## Purchase Events

Fire from the purchase service/interactor, not from UI:

```swift
case iapView(convertNumber: Int, pwSource: String, source: String, offeringId: String?)
case iapBtnClick(convertNumber: Int, packageId: String, source: String)
case iapSuccessful(convertNumber: Int, purchasePackageId: String, source: String, price: String, currency: String)
```

## MMP Attribution Events (Adjust/AppsFlyer)

Fire once per lifecycle from the ATT/attribution callback:

```swift
case userAttributions(
    id: String,
    network: String?,
    campaign: String?,
    adgroup: String?,
    mmp: MMPProvider
)
case userIdMapping(mmpId: String, mmp: MMPProvider)

enum MMPProvider: String {
    case adjust = "Adjust"
    case appsflyer = "AppsFlyer"
}
```

## Audit — Find Missing Tracking

Search for ViewModels that load data or handle user actions without calling `EventTracking`:

```
Grep: "func load()" or "func didTap" in Presentation/ — check if EventTracking.logEvent is present
Grep: ".onAppear" in View files — verify ViewModel.load() fires a screen_view event
```

## Rules

- **Never call `EventTracking.logEvent` from a View** — always from ViewModel
- **Never use string literals for event names** — always use the enum case
- **Optional parameters** — use Swift default values or `Optional` to avoid force-unwrap in parameters
- Event names must be `snake_case` strings
- Parameter values must be `String`, `Int`, `Double`, or `Bool` — no nested objects
- Keep `AnalyticsEvent.swift` as a single file — do not split by feature
- In DEBUG: logs auto-print to console (already built into `EventTracking`)
