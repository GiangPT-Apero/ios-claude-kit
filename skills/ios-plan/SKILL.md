---
name: ios-plan
description: Plan a new iOS feature following Clean Architecture. Creates a structured plan with Domain→Data→Presentation phases. Use when user asks to plan or design a new feature before implementing.
---

# iOS Feature Planner

Create a structured implementation plan for a new feature following this project's Clean Architecture.

## Arguments

```
/ios-plan <feature-description>
```

Example: `/ios-plan user authentication with email/password`

## Workflow

### 1. Clarify Requirements

Ask the user (one at a time until clear):
- What data does this feature need to persist? (SwiftData entities)
- Does it need remote API calls? (Remote data source)
- What screens/views are needed? (Presentation)
- Does it need real-time updates? (AsyncStream observation)
- Any navigation flows? (new AppRoutes needed)

### 2. Research Existing Code

Scan the codebase to understand:
- Existing entities in `SchemaExtension.swift`
- Current routes in `AppRoute.swift`
- Existing interactors for patterns to follow
- Design system tokens already defined

### 3. Generate Plan

Save to `plans/<YYMMDD-HHMM>-<feature-slug>/`:

```
plans/
└── 260504-1430-user-authentication/
    ├── plan.md              # Overview + checklist
    ├── phase-01-domain.md   # Models, protocols
    ├── phase-02-data.md     # Entities, mappers, data sources, repos
    └── phase-03-presentation.md  # ViewModels, Views, routes
```

#### plan.md structure (keep under 60 lines)
- Feature summary
- Tech decisions (SwiftData vs in-memory, remote vs local only)
- Phase list with status checkboxes
- Dependencies / risks

#### phase-XX.md structure

Each phase file must include:
- **Files to create** (full paths)
- **Files to modify** (with what changes)
- **Implementation steps** (numbered, specific)
- **Success criteria** (how to verify it works)

### 4. Present Plan

Show the user:
1. Phase summary table
2. New files that will be created
3. Existing files that will be modified
4. Any risks or decisions needed

Ask for approval before starting implementation.

## Clean Architecture Phase Template

### Phase 01 — Domain
- `Domain/Models/<Feature>.swift` — pure Swift struct
- `Domain/Repository/<Feature>Repository.swift` — protocol
- `Domain/Interactors/<Feature>Interactor.swift` — protocol + Real implementation

### Phase 02 — Data
- `Data/DataSource/Local/Entity/<Feature>Entity.swift` — `@Model`
- `Data/DataSource/Local/<Feature>LocalDataSource.swift` — protocol + `MainDBRepository` extension
- `Data/Mappers/<Feature>Mapper.swift` — Entity↔Domain extensions
- `Data/Repository/<Feature>RepositoryImpl.swift` — coordinates local + remote
- Update `SchemaExtension.swift` — add entity to schema
- Update `Container+DataSources.swift`, `+Repositories.swift`, `+Interactors.swift`

### Phase 03 — Presentation
- `Presentation/<Feature>/<Feature>ViewModel.swift` — `@MainActor`, `@Injected`
- `Presentation/<Feature>/<Feature>View.swift` — callbacks only, no coordinator
- Update `AppRoute.swift` — add new route case
- Update `RootView.swift` — wire callback + destination

## Rules

- Never start implementation without user plan approval
- Always follow Domain → Data → Presentation order
- If feature is small (<3 files), inline into single plan.md
- Flag if feature requires SwiftData schema migration
