---
name: ios-remote-config
description: Add or update Firebase Remote Config keys in an iOS project. Use when user wants to add feature flags, configure remote values, update default values, or asks about RemoteConfigKey, JsonRemoteConfigKey, RemoteConfigKeys, RemoteConfigInteractor.
---

# iOS Remote Config

Add and use Firebase Remote Config keys using the type-safe `RemoteConfigKey<T>` / `JsonRemoteConfigKey<T>` pattern.

**Scope:** Adding new config keys, reading values in ViewModels/Interactors, fetching on app launch, adding Codable JSON config objects.
**Does NOT handle:** Firebase project setup (use `/ios-setup firebase`), A/B testing UI, analytics (use `/ios-analytics`).

## Arguments

```
/ios-remote-config                    → show existing keys + ask what to add
/ios-remote-config add <key-name>     → add a new remote config key
/ios-remote-config audit              → find hardcoded values that should be remote config
```

## File Locations

```
<AppName>/Domain/Models/
└── RemoteConfigKey.swift             ← key structs + RemoteConfigKeys enum

<AppName>/Domain/Repository/
└── RemoteConfigRepository.swift      ← protocol

<AppName>/Domain/Interactors/
└── RemoteConfigInteractor.swift      ← class (not protocol) — used directly

<AppName>/Data/Repository/
└── RemoteConfigRepositoryImpl.swift  ← Firebase fetch + UserDefaults cache
```

> Search with `Glob "**/RemoteConfig*"` if paths differ.

## Architecture Overview

```
ViewModel
  └─ @Injected RemoteConfigInteractor
       └─ RemoteConfigRepository (protocol)
            └─ RemoteConfigRepositoryImpl
                 ├─ FirebaseRemoteConfig  ← fetch & activate
                 └─ UserDefaults         ← local cache (survives offline)
```

**Key design:** Values are fetched from Firebase once at launch, saved to `UserDefaults`, then read from local cache on every call. This ensures the app always has values even offline.

## Key Types

### `RemoteConfigKey<T>` — for basic types (Int, String, Bool)

```swift
struct RemoteConfigKey<T> {
    let key: String        // Firebase console key name
    let defaultValue: T    // fallback if key not fetched yet
}
```

### `JsonRemoteConfigKey<T: Codable>` — for JSON objects

```swift
struct JsonRemoteConfigKey<T: Codable> {
    let key: String
    let defaultValue: T
}
```

## Adding a New Config Key

### Step 1 — Define the key in `RemoteConfigKeys`

```swift
// Domain/Models/RemoteConfigKey.swift

enum RemoteConfigKeys {
    // Basic types
    static let MyFeatureEnabled = RemoteConfigKey<Bool>(
        key: "my_feature_enabled",
        defaultValue: false
    )
    static let MaxRetryCount = RemoteConfigKey<Int>(
        key: "max_retry_count",
        defaultValue: 3
    )
    static let ApiVersion = RemoteConfigKey<String>(
        key: "api_version",
        defaultValue: "v1"
    )

    // JSON type — requires Codable model
    static let MyFeatureConfig = JsonRemoteConfigKey<MyFeatureConfig>(
        key: "my_feature_config",
        defaultValue: .default
    )
}
```

### Step 2 — For JSON keys: define the Codable model

Place the model near the feature that uses it, or in `Domain/Models/`:

```swift
struct MyFeatureConfig: Codable {
    let title: String
    let maxItems: Int
    let showBadge: Bool

    // Required: provide a default instance
    static let `default` = MyFeatureConfig(
        title: "Default Title",
        maxItems: 10,
        showBadge: false
    )
}
```

### Step 3 — Register the key in `RemoteConfigRepositoryImpl.saveToLocal()`

Add to both the basic or JSON save section:

```swift
// In saveToLocal():

// For basic key:
saveBasicKey(RemoteConfigKeys.MyFeatureEnabled)
saveBasicKey(RemoteConfigKeys.MaxRetryCount)

// For JSON key:
saveJsonKey(RemoteConfigKeys.MyFeatureConfig)
```

**This step is mandatory.** If you skip it, the value will never be saved after fetch.

### Step 4 — Read the value

Via `RemoteConfigInteractor` (injected with Factory):

```swift
// In any Interactor or ViewModel
@Injected(\.remoteConfigInteractor) private var remoteConfig

// Read basic value
let isEnabled: Bool = remoteConfig.getValue(for: RemoteConfigKeys.MyFeatureEnabled)
let maxRetry: Int = remoteConfig.getValue(for: RemoteConfigKeys.MaxRetryCount)

// Read JSON value
let config: MyFeatureConfig = remoteConfig.getJsonValue(for: RemoteConfigKeys.MyFeatureConfig)
```

## Fetch on App Launch

Remote configs must be fetched early — typically in the splash or app init flow:

```swift
// In RootViewModel or SplashViewModel
@Injected(\.remoteConfigInteractor) private var remoteConfig

func initialize() {
    let task = Task {
        await remoteConfig.fetchConfig()   // fetch + activate + save to UserDefaults
        // continue app init...
    }
    tasks.append(task)
}
```

`fetchConfig()` never throws — it silently falls back to cached/default values on error.

## RemoteConfigInteractor

`RemoteConfigInteractor` is a **class** (not a protocol) — used directly:

```swift
class RemoteConfigInteractor {
    private let remoteConfigRepository: RemoteConfigRepository

    init(remoteConfigRepository: RemoteConfigRepository) {
        self.remoteConfigRepository = remoteConfigRepository
    }

    func fetchConfig() async {
        await remoteConfigRepository.fetchAndSaveRemoteConfigs()
    }

    func getValue<T>(for key: RemoteConfigKey<T>) -> T {
        remoteConfigRepository.getValue(for: key)
    }

    func getJsonValue<T: Codable>(for key: JsonRemoteConfigKey<T>) -> T {
        remoteConfigRepository.getJsonValue(for: key)
    }
}
```

Register in `Container+Interactors.swift`:

```swift
extension Container {
    var remoteConfigInteractor: Factory<RemoteConfigInteractor> {
        self { RemoteConfigInteractor(remoteConfigRepository: self.remoteConfigRepository()) }
            .singleton
    }
}
```

## Fetch Interval

The implementation uses `minimumFetchInterval`:

```swift
#if DEBUG
settings.minimumFetchInterval = 0      // always fetch in debug
#else
settings.minimumFetchInterval = 3600   // 1 hour in production
#endif
```

In DEBUG, configs are always re-fetched. In production, Firebase caches for 1 hour.

## Common Patterns

### Feature flag gate

```swift
func loadIfEnabled() {
    guard remoteConfig.getValue(for: RemoteConfigKeys.MyFeatureEnabled) else { return }
    // proceed
}
```

### Timeout from remote config

```swift
let timeout = remoteConfig.getValue(for: RemoteConfigKeys.TimeOutGenImage)
try await withTimeout(seconds: TimeInterval(timeout)) {
    // async work
}
```

### JSON config driving UI

```swift
let config = remoteConfig.getJsonValue(for: RemoteConfigKeys.MyFeatureConfig)
title = config.title
maxItems = config.maxItems
```

## Rules

- **Always provide a `defaultValue`** — the app must work even before first fetch
- **Always add to `saveToLocal()`** — new keys are silently ignored if not registered
- **JSON keys require a Codable model** with a `static let default` instance
- **Never read directly from `FirebaseRemoteConfig`** — always go through `RemoteConfigInteractor`
- **Never throw from `fetchAndSaveRemoteConfigs()`** — catch internally and log
- Key names in Firebase console must exactly match the `key` string in the struct
- Fetch once at launch (splash/init) — do not fetch on every screen appear
