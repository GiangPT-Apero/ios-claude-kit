---
name: ios-feature
description: Plan and implement a complete iOS feature end-to-end following Clean Architecture. Use when user wants to build a new feature, add functionality, or implement a screen. Handles Domain → Data → Presentation phases with built-in code review.
---

# iOS Feature

Full-cycle feature implementation: plan → implement → review. Follows Clean Architecture strictly.

**Scope:** New features in SwiftUI + Clean Architecture projects using this kit's template.
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

- What data needs to persist? → SwiftData entities needed
- Does it call a remote API? → Remote data source needed
- What screens/navigation flows are needed?
- Any real-time updates? → AsyncStream needed
- Dependencies on other features?

### 0.2 Research existing codebase

```bash
# Understand existing patterns
ls <AppName>/Domain/
ls <AppName>/Data/
ls <AppName>/Presentation/
```

Read:
- `SchemaExtension.swift` — existing SwiftData models
- `AppRoute.swift` — existing navigation routes
- `Container+Interactors.swift` — DI registration pattern
- One existing Interactor + RepositoryImpl as reference

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
├── DataSource/Local/Entity/<Feature>Entity.swift   ← @Model
├── DataSource/Local/<Feature>LocalDataSource.swift ← protocol + MainDBRepository extension
├── Mappers/<Feature>Mapper.swift                   ← Entity ↔ Domain extensions
└── Repository/<Feature>RepositoryImpl.swift        ← coordinates local + remote
```

**Files to modify:**
- `SchemaExtension.swift` — add entity to schema array
- `Container+DataSources.swift` — register data source
- `Container+Repositories.swift` — register repository
- `Container+Interactors.swift` — register interactor

```swift
// Data/DataSource/Local/Entity/FeatureEntity.swift
@Model
final class FeatureEntity {
    @Attribute(.unique) var id: UUID
    // stored properties
    init(id: UUID = .init()) { self.id = id }
}

// Data/Mappers/FeatureMapper.swift
extension FeatureEntity {
    func toDomain() -> Feature { Feature(id: id) }
}
extension Feature {
    func toEntity() -> FeatureEntity { FeatureEntity(id: id) }
}
```

**After modifying SchemaExtension.swift:** Increment schema version if adding new `@Model`.

## Phase 3 — Presentation Layer

**Files to create:**

```
<AppName>/Presentation/<Feature>/
├── <Feature>ViewModel.swift   ← @MainActor, @Observable, @Injected
└── <Feature>View.swift        ← callbacks only, no direct navigation
```

**Files to modify:**
- `AppRoute.swift` — add route case
- `RootView.swift` — wire callback + navigationDestination

```swift
// Presentation/Feature/FeatureViewModel.swift
@MainActor
@Observable
final class FeatureViewModel {
    @Injected private var interactor: FeatureInteractor

    var items: [Feature] = []
    var isLoading = false
    var error: Error?

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
}

// Presentation/Feature/FeatureView.swift
struct FeatureView: View {
    @State private var viewModel = FeatureViewModel()
    var onDismiss: () -> Void  // callback, no coordinator reference

    var body: some View {
        // UI here
    }
    .onAppear { viewModel.load() }
}
```

## Phase 4 — Code Review

After implementation, automatically trigger review:

Check for:
- [ ] Domain layer has no SwiftData/UIKit/SwiftUI imports
- [ ] ViewModel is `@MainActor`
- [ ] Tasks cancelled in `deinit`
- [ ] `#Predicate` uses extracted variables
- [ ] Repository protocol used (not concrete type) in Interactor
- [ ] New `@Model` added to `SchemaExtension.swift`
- [ ] DI container updated for all new types
- [ ] AppRoute + RootView wired for new screen

Fix any Critical issues before reporting complete.

## Phase 5 — Update Plan

Mark completed phases in `plans/<slug>/plan.md`:
- `[ ]` → `[x]` for each completed phase
- Note any deviations from original plan

## Rules

- **Never start implementation without plan approval**
- **Always follow Domain → Data → Presentation order**
- If feature touches existing entities: check for SchemaExtension migration needs
- If feature is tiny (<3 files): skip plan files, inline in chat
- Commit each phase separately: `feat(<feature>): add domain layer`

## Commit Convention

```
feat(<feature-slug>): add domain layer
feat(<feature-slug>): add data layer
feat(<feature-slug>): add presentation layer
```
