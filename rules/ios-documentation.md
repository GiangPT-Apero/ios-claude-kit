# iOS Documentation Management

Rules for maintaining project documentation after bootstrap and feature implementation.

## Required Documents

- **TODO_LIST.md** — Post-bootstrap setup checklist (created by `/bootstrap-ios`)
- **CLAUDE.md** — Project-specific rules for Claude (from template, updated as project evolves)
- **plans/** — Feature plans created by `/ios-plan` (timestamped directories)

## Automatic Updates Required

### After `/bootstrap-ios`
- `TODO_LIST.md` created with setup checklist
- `CLAUDE.md` inherits rules from template — review and add project-specific rules

### After Feature Implementation
- Mark corresponding `/ios-plan` checklist items as done in `plans/<slug>/plan.md`
- Update phase file status: `[ ]` → `[x]`
- If feature adds a new SwiftData model: note schema version in CLAUDE.md

### After `/ios-build` Fails
- Note recurring build errors in CLAUDE.md under `## Known Issues`
- Document workaround if `pod deintegrate && pod install` is needed

## Plan Location

Save plans to `plans/` with timestamp + slug:

```
plans/
└── 260504-1430-user-authentication/
    ├── plan.md              # Overview + phase checklist (≤60 lines)
    ├── phase-01-domain.md
    ├── phase-02-data.md
    └── phase-03-presentation.md
```

**Naming format:** `YYMMDD-HHMM-<feature-slug>/`

## Plan File Structure

### plan.md (keep under 60 lines)
- Feature summary
- Tech decisions (SwiftData vs in-memory, remote vs local)
- Phase checklist with status
- Dependencies / risks

### phase-XX.md
- Files to create / modify / delete
- Implementation steps (numbered)
- Success criteria
- Risk notes (schema migration, App Store impact)

## Update Protocol

1. **Before creating a plan**: check `plans/` for existing related plans
2. **During implementation**: update phase checkboxes as tasks complete
3. **After completion**: mark `plan.md` overall status as `✅ Complete`
4. **If plan changes scope**: update plan.md, note reason and date

## CLAUDE.md Triggers

Update CLAUDE.md when:
- New architecture pattern established (document the decision)
- New dependency added to Podfile (note why)
- Build workaround discovered
- Minimum iOS version changed
- SwiftData schema migrated (note new version)
