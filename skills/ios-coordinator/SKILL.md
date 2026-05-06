---
name: ios-coordinator
description: Add or extend navigation coordinators in an iOS project. Use when user wants to add a new screen, add a navigation flow, create a new coordinator, wire up routes, handle cross-flow navigation, or asks about BaseCoordinator, AppCoordinator, MainCoordinator, NavigationPath, AppFlow.
---

# iOS Coordinator

Add screens, routes, and navigation flows using the `BaseCoordinator<Route>` pattern.

**Scope:** Adding routes to existing coordinators, creating new coordinators, cross-flow navigation, AppCoordinator flow switching.
**Does NOT handle:** Feature implementation (use `/ios-feature`), deep link handling, push notification navigation.

## Arguments

```
/ios-coordinator                         → show current navigation structure
/ios-coordinator add-route <flow>        → add a new route to an existing coordinator
/ios-coordinator new-flow <name>         → create a new coordinator + flow
/ios-coordinator cross-flow              → wire cross-flow navigation via delegate
```

## File Locations

```
<AppName>/Navigation/
├── AppRoute.swift                   ← Route enums (MainRoute, OnboardingRoute, PaywallRoute)
├── AppCoordinator.swift             ← root coordinator, owns AppFlow state
└── Coordinators/
    ├── BaseCoordinator.swift        ← generic base class
    ├── MainCoordinator.swift        ← main flow coordinator
    └── OnboardingCoordinator.swift  ← onboarding flow + delegate
```

> Search with `Glob "**/Coordinators/*.swift" "**/*Coordinator*"` if paths differ.

## Architecture Overview

```
AppCoordinator (@Published currentFlow: AppFlow)
├── .splash  → SplashView
├── .onboarding → OnboardingCoordinator (BaseCoordinator<OnboardingRoute>)
│                  └─ delegate: AppCoordinator
└── .main    → MainCoordinator (BaseCoordinator<MainRoute>)
```

`AppFlow` controls which root view is shown. Each coordinator manages its own `NavigationPath`.

## BaseCoordinator

```swift
@MainActor
class BaseCoordinator<Route: Hashable>: ObservableObject {
    @Published var path = NavigationPath()
    private var routeStack: [Route] = []

    func navigate(to route: Route)          // push
    func pop()                              // pop one
    func popToRoot()                        // pop all (animated)
    func popTo(route: Route)                // pop to specific route
    func popThenNavigate(to route: Route)   // replace top of stack
    func popTo(where:, replacingWith:)      // pop until match, then replace
    func currentStack() -> [Route]          // debug helper
}
```

## Adding a Route to an Existing Flow

### Step 1 — Add case to the Route enum

```swift
// Navigation/AppRoute.swift
enum MainRoute: Hashable {
    // existing cases...
    case featureDetail(itemId: String, title: String)
}
```

**Rules for associated values:**
- Use only `Hashable` types (String, Int, UUID, enums, etc.)
- No `Data` unless small — prefer `String` IDs and look up in ViewModel
- No `@Model` objects — pass IDs only

### Step 2 — Add `navigationDestination` in the root view

Find the `NavigationStack` for this coordinator's flow and add a destination:

```swift
// MainRootView.swift (or wherever NavigationStack uses mainCoordinator.path)
.navigationDestination(for: MainRoute.self) { route in
    switch route {
    // existing cases...
    case .featureDetail(let itemId, let title):
        FeatureDetailView(itemId: itemId, title: title)
            .environmentObject(coordinator)
    }
}
```

### Step 3 — Navigate from a ViewModel

ViewModels emit `NavigationEvent`, Views forward to coordinator:

```swift
// FeatureViewModel.swift
enum NavigationEvent {
    case detail(itemId: String, title: String)
}
@Published var navigationEvent: NavigationEvent?

func selectItem(_ item: Feature) {
    navigationEvent = .detail(itemId: item.id.uuidString, title: item.title)
}
```

```swift
// FeatureView.swift
.onChange(of: viewModel.navigationEvent) { _, event in
    guard let event else { return }
    switch event {
    case .detail(let id, let title):
        coordinator.navigate(to: .featureDetail(itemId: id, title: title))
    }
    viewModel.navigationEvent = nil
}
```

## Creating a New Coordinator

For a new self-contained flow (e.g. checkout, settings wizard):

### Step 1 — Define the Route enum

```swift
// Navigation/AppRoute.swift
enum CheckoutRoute: Hashable {
    case cart
    case payment(orderId: String)
    case confirmation(orderId: String)
}
```

### Step 2 — Create the Coordinator

```swift
// Navigation/Coordinators/CheckoutCoordinator.swift
import Foundation

protocol CheckoutCoordinatorDelegate: AnyObject {
    func checkoutDidFinish()
    func checkoutNavigateToMain(route: MainRoute)
}

final class CheckoutCoordinator: BaseCoordinator<CheckoutRoute> {
    weak var delegate: CheckoutCoordinatorDelegate?

    func finish() {
        delegate?.checkoutDidFinish()
    }
}
```

### Step 3 — Add to AppCoordinator

```swift
// AppCoordinator.swift
enum AppFlow {
    case splash
    case onboarding
    case main
    case checkout   // new
}

@Published var checkoutCoordinator = CheckoutCoordinator()

func startCheckout() {
    checkoutCoordinator = CheckoutCoordinator()
    checkoutCoordinator.delegate = self
    currentFlow = .checkout
}
```

### Step 4 — Add flow case to root view switch

```swift
// RootView.swift
switch appCoordinator.currentFlow {
case .splash: SplashView()
case .onboarding: OnboardingRootView(coordinator: appCoordinator.onboardingCoordinator)
case .main: MainRootView(coordinator: appCoordinator.mainCoordinator)
case .checkout: CheckoutRootView(coordinator: appCoordinator.checkoutCoordinator)
}
```

### Step 5 — Create the flow's root view

```swift
// Presentation/Checkout/CheckoutRootView.swift
struct CheckoutRootView: View {
    @ObservedObject var coordinator: CheckoutCoordinator

    var body: some View {
        NavigationStack(path: $coordinator.path) {
            CartView()
                .navigationDestination(for: CheckoutRoute.self) { route in
                    switch route {
                    case .cart: CartView()
                    case .payment(let orderId): PaymentView(orderId: orderId)
                    case .confirmation(let orderId): ConfirmationView(orderId: orderId)
                    }
                }
        }
        .environmentObject(coordinator)
    }
}
```

## Cross-Flow Navigation

When a child coordinator needs to trigger navigation in a parent flow, use a delegate protocol:

```swift
// Pattern: OnboardingCoordinator → AppCoordinator
protocol OnboardingCoordinatorDelegate: AnyObject {
    func onboardingDidFinish()
    func onboardingNavigateToMain(route: MainRoute)
}

// Child calls:
func finishOnboarding() {
    delegate?.onboardingDidFinish()
}

// Parent implements:
extension AppCoordinator: OnboardingCoordinatorDelegate {
    func onboardingDidFinish() {
        currentFlow = .main
    }
    func onboardingNavigateToMain(route: MainRoute) {
        currentFlow = .main
        mainCoordinator.navigate(to: route)
    }
}
```

**Always use `weak var delegate`** to avoid retain cycles.

## AppCoordinator API Reference

```swift
appCoordinator.splashDidFinish(onboardingCompleted: Bool)  // splash → onboarding or main
appCoordinator.startOnboarding()                           // reset + show onboarding
appCoordinator.goToHome()                                  // switch to main, pop to root
appCoordinator.navigate(to: MainRoute)                     // switch to main + push route
```

## Common Navigation Operations

```swift
// Push screen
coordinator.navigate(to: .settings)

// Go back one
coordinator.pop()

// Go back to root of current flow
coordinator.popToRoot()

// Replace top screen
coordinator.popThenNavigate(to: .newScreen)

// Go back to a specific screen
coordinator.popTo(route: .home)

// Pop back to a matching screen, replace it
coordinator.popTo(where: { $0 == .result("someId") }, replacingWith: .result("newId"))
```

## Rules

- **`Route` enum cases must be `Hashable`** — no non-hashable associated values
- **Never navigate from a View directly** — always via ViewModel `NavigationEvent` + coordinator
- **Never store coordinator reference in ViewModel** — pass it only through View `.environmentObject`
- **Always use `weak var delegate`** for cross-coordinator communication
- **Resetting a coordinator** (e.g. restart onboarding): create a new instance, re-assign delegate
- **`popToRoot()` uses animation** — wrapped in `withTransaction(.init(animation: .easeInOut))`
- One `NavigationStack` per coordinator flow — do not nest `NavigationStack`
