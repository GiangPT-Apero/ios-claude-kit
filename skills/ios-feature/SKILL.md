---
name: ios-feature
description: Plan and implement a complete iOS feature end-to-end following Clean Architecture. Use when user wants to build a new feature, add functionality, or implement a screen. Handles Domain → Data → Presentation phases with built-in code review.
---

# iOS Feature

Full-cycle feature implementation: plan → implement → review. Follows Clean Architecture strictly.

**Scope:** New features in SwiftUI + Clean Architecture projects using the Factory DI + Coordinator navigation pattern.
**Does NOT handle:** Bug fixes (use `/ios-debug`), project bootstrap (use `/bootstrap-ios`), build issues (use `/ios-build`).

## Arguments

```
/ios-feature <feature-description>
```

Examples:
- `/ios-feature user authentication with email and password`
- `/ios-feature photo gallery with local storage`
- `/ios-feature settings screen with theme toggle`

## Phase 0 — Clarify & Plan

### 0.1 Ask clarifying questions (one at a time if unclear)

- What data needs to persist? → SwiftData `@Model` entities needed
- Does it call a remote API? → Remote data source needed
- What screens/navigation flows are needed?
- Any real-time updates? → AsyncStream needed
- Which coordinator owns this feature? (Main, Onboarding, etc.)

### 0.2 Research existing codebase

Read:
- `AppSchema.swift` — existing SwiftData models (under `DBModel` namespace)
- `MainRoute.swift` (or relevant Route enum) — existing navigation routes
- `Container+Interactors.swift` — DI registration pattern
- One existing Interactor + RepositoryImpl as reference
- The relevant Coordinator (e.g. `MainCoordinator.swift`) for navigation wiring

### 0.3 Create plan

Save to `plans/<YYMMDD-HHMM>-<feature-slug>/`:
- `plan.md` — summary, tech decisions, phase checklist (≤60 lines)
- `phase-01-domain.md`
- `phase-02-data.md`
- `phase-03-presentation.md`

**Present plan to user and wait for approval before implementing.**

## Phase 1 — Domain Layer

**Files to create:**

```
<AppName>/Domain/
├── Models/<Feature>.swift               ← pure Swift struct, no imports
├── Repository/<Feature>Repository.swift ← protocol only
└── Interactors/<Feature>Interactor.swift ← protocol + Real class
```

**Rules:**
- Domain layer: NO SwiftData, UIKit, or SwiftUI imports
- Repository = protocol only (no implementation here)
- Interactor holds the repository as protocol type, not concrete

```swift
// Domain/Models/Feature.swift
struct Feature: Identifiable, Equatable {
    let id: UUID
    // pure Swift types only
}

// Domain/Repository/FeatureRepository.swift
protocol FeatureRepository {
    func fetchAll() async throws -> [Feature]
    func save(_ item: Feature) async throws
}

// Domain/Interactors/FeatureInteractor.swift
protocol FeatureInteractor {
    func getAll() async throws -> [Feature]
}

final class RealFeatureInteractor: FeatureInteractor {
    private let repository: FeatureRepository
    init(repository: FeatureRepository) { self.repository = repository }
    func getAll() async throws -> [Feature] { try await repository.fetchAll() }
}
```

## Phase 2 — Data Layer

**Files to create:**

```
<AppName>/Data/
├── DataSource/Local/Entity/<Feature>Entity.swift      ← @Model inside DBModel namespace
├── DataSource/Local/<Feature>LocalDataSource.swift    ← protocol + MainDBRepository extension
├── Mappers/<Feature>Mapper.swift                      ← Entity ↔ Domain extensions
└── Repository/<Feature>RepositoryImpl.swift           ← coordinates local + remote
```

**Files to modify:**
- `AppSchema.swift` — add `DBModel.<Feature>.self` to `Schema.appSchema` array + bump version
- `Container+Infrastructure.swift` — update ModelContainer schema if needed
- `Container+DataSources.swift` — register data source
- `Container+Repositories.swift` — register repository
- `Container+Interactors.swift` — register interactor
- `Container+Services.swift` — register service if applicable

```swift
// Data/DataSource/Local/Entity/FeatureEntity.swift
// Wrap @Model inside DBModel namespace
extension DBModel {
    @Model
    final class Feature {
        @Attribute(.unique) var id: UUID
        // stored properties
        init(id: UUID = .init()) { self.id = id }
    }
}

// Data/Mappers/FeatureMapper.swift
extension DBModel.Feature {
    func toDomain() -> Feature { Feature(id: id) }
}
extension Feature {
    func toEntity() -> DBModel.Feature { DBModel.Feature(id: id) }
}

// AppSchema.swift — add to schema array
extension Schema {
    static var appSchema: Schema {
        Schema(
            [
                // existing models...
                DBModel.Feature.self
            ],
            version: Schema.Version(1, 2, 0) // bump version
        )
    }
}
```

**Container registration pattern (Factory):**

```swift
// Container+DataSources.swift
extension Container {
    var featureLocalDataSource: Factory<FeatureLocalDataSource> {
        self { MainDBRepository.shared }
            .singleton
    }
}

// Container+Repositories.swift
extension Container {
    var featureRepository: Factory<FeatureRepository> {
        self { FeatureRepositoryImpl(localDataSource: self.featureLocalDataSource()) }
            .singleton
    }
}

// Container+Interactors.swift
extension Container {
    var featureInteractor: Factory<FeatureInteractor> {
        self { RealFeatureInteractor(repository: self.featureRepository()) }
            .shared
    }
}
```

**After modifying AppSchema.swift:** Always bump the schema version to avoid migration crashes.

## Phase 3 — Presentation Layer

**Files to create:**

```
<AppName>/Presentation/<Feature>/
├── <Feature>ViewModel.swift   ← ObservableObject, @Injected, NavigationEvent
└── <Feature>View.swift        ← @StateObject, observes navigationEvent via .onChange
```

**Files to modify:**
- `MainRoute.swift` (or relevant Route enum) — add route case
- `MainCoordinator.swift` (or relevant Coordinator) — add `navigationDestination` case
- `MainRootView.swift` — wire `.navigationDestination` if not in coordinator

**ViewModel pattern — `ObservableObject` + `@Published` + Factory `@Injected`:**

```swift
// Presentation/Feature/FeatureViewModel.swift
@MainActor
final class FeatureViewModel: ObservableObject {
    @Injected(\.featureInteractor) private var interactor

    @Published var items: [Feature] = []
    @Published var isLoading = false
    @Published var error: Error?
    @Published var navigationEvent: NavigationEvent?

    enum NavigationEvent {
        case detail(Feature)
        case dismiss
    }

    private var cancellables = Set<AnyCancellable>()
    private var tasks: [Task<Void, Never>] = []
    deinit { tasks.forEach { $0.cancel() } }

    func load() {
        let task = Task {
            isLoading = true
            defer { isLoading = false }
            do {
                items = try await interactor.getAll()
            } catch {
                self.error = error
            }
        }
        tasks.append(task)
    }

    func selectItem(_ item: Feature) {
        navigationEvent = .detail(item)
    }
}
```

**View pattern — `@StateObject` + `.onChange` for navigation:**

```swift
// Presentation/Feature/FeatureView.swift
struct FeatureView: View {
    @StateObject private var viewModel = FeatureViewModel()

    // Coordinator callback — receive navigate action, not a coordinator reference
    var onNavigate: ((FeatureViewModel.NavigationEvent) -> Void)?

    var body: some View {
        // UI here
        .onAppear { viewModel.load() }
        .onChange(of: viewModel.navigationEvent) { _, event in
            guard let event else { return }
            onNavigate?(event)
            viewModel.navigationEvent = nil
        }
    }
}
```

**Coordinator wiring:**

```swift
// Add to MainRoute.swift
enum MainRoute: Hashable {
    // existing cases...
    case featureDetail(Feature)
}

// Add to MainCoordinator.swift navigationDestination
switch route {
case .featureDetail(let item):
    FeatureDetailView(item: item)
// ...
}

// In parent view/coordinator — wire callback
FeatureView { event in
    switch event {
    case .detail(let item): coordinator.navigate(to: .featureDetail(item))
    case .dismiss: coordinator.pop()
    }
}
```

## Phase 4 — Code Review

After implementation, automatically trigger review:

- [ ] Domain layer has no SwiftData/UIKit/SwiftUI imports
- [ ] ViewModel is `ObservableObject` with `@Published` (NOT `@Observable`)
- [ ] ViewModel is `@MainActor`
- [ ] `@Injected(\.xxx)` used for DI (NOT `@Environment` or manual init injection)
- [ ] Tasks cancelled in `deinit`
- [ ] `#Predicate` uses extracted variables (not inline property access)
- [ ] Repository protocol used (not concrete type) in Interactor
- [ ] New `@Model` wrapped in `DBModel` namespace extension
- [ ] New entity added to `AppSchema.swift` schema array + version bumped
- [ ] All Container files updated (DataSources, Repositories, Interactors)
- [ ] Route enum + Coordinator `navigationDestination` wired for new screen
- [ ] NavigationEvent enum defined in ViewModel, consumed via `.onChange` in View

Fix any Critical issues before reporting complete.

## Phase 5 — Update Plan

Mark completed phases in `plans/<slug>/plan.md`:
- `[ ]` → `[x]` for each completed phase
- Note any deviations from original plan

## Rules

- **Never start implementation without plan approval**
- **Always follow Domain → Data → Presentation order**
- **Never use `@Observable` macro** — use `ObservableObject + @Published`
- **Never inject via `@State private var viewModel = FeatureViewModel()`** — use `@StateObject`
- **Never navigate from View directly** — use NavigationEvent enum + coordinator callback
- If feature touches existing entities: check AppSchema.swift migration needs
- If feature is tiny (<3 files): skip plan files, inline in chat
- Commit each phase separately: `feat(<feature>): add domain layer`

## Commit Convention

```
feat(<feature-slug>): add domain layer
feat(<feature-slug>): add data layer
feat(<feature-slug>): add presentation layer
```
