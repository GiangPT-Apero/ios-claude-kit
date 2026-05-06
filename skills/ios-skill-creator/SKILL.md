---
name: ios-skill-creator
description: Create a new skill for ios-claude-kit. Use when the user wants to add a new skill, create a custom slash command, extend kit capabilities, or asks "how do I add a skill" / "create a skill for X" / "make a new command".
---

# iOS Skill Creator

Create new skills for ios-claude-kit following the project's conventions.

## Skill Structure

Skills live in `skills/<skill-name>/SKILL.md` (relative to kit root).
Optional: `skills/<skill-name>/references/<topic>.md` for detailed docs.

```
skills/
└── <skill-name>/
    ├── SKILL.md              (required, <300 lines)
    └── references/           (optional — for complex skills)
        └── <topic>.md
```

## Creation Workflow

### 1. Capture Intent

Ask (one question at a time if unclear):
- What task should this skill perform?
- What slash command triggers it? (e.g. `/ios-feature`)
- What are the inputs/arguments?
- What is the expected output?

### 2. Check for Duplicates

Scan existing skills before creating:
```bash
ls skills/
```
If similar skill exists, extend it rather than create a new one.

### 3. Decide Complexity

| Skill type | Structure |
|-----------|-----------|
| Simple workflow (<100 lines) | SKILL.md only |
| Complex with domain knowledge | SKILL.md + references/ |

### 4. Write SKILL.md

Use the template in `references/skill-template.md`.

**Frontmatter rules:**
- `name`: kebab-case, matches directory name
- `description`: ≤200 chars, include specific trigger phrases ("Use when...", "Use for...")

**Body rules:**
- Imperative form: "Run X to do Y" — not "You should run X"
- <300 lines total
- Cover: purpose, arguments, step-by-step flow, rules/constraints
- Move detailed docs to `references/` if body exceeds 200 lines

**Description must be "pushy":**
```yaml
# Bad — undertriggers
description: Skill for doing X

# Good — triggers reliably
description: Do X for iOS projects. Use when user asks to X, wants to create X,
  or mentions X. Handles Y and Z cases.
```

### 5. Validate

Before finishing, verify:
- [ ] `name` in frontmatter matches directory name
- [ ] Description ≤200 chars and includes trigger contexts
- [ ] SKILL.md body <300 lines
- [ ] Flow is step-by-step with clear numbered steps
- [ ] Rules/constraints section present
- [ ] No duplication with existing skills

## iOS-Specific Conventions

- Skills that touch Xcode/Swift: reference `ios-build` patterns for xcodebuild
- Skills that touch git: follow `rules/ios-git-rules.md` conventions
- Skills that create files: always commit after creation with `chore:` prefix
- Skills that involve Clean Architecture: follow Domain → Data → Presentation order

## Output

After creating the skill:
1. Show the created files
2. Tell the user the trigger command (e.g. `Use /skill-name to activate`)
3. Suggest adding it to the README.md skills table

## Rules

- Never overwrite an existing skill without user confirmation
- Skills go in `skills/` relative to kit root — NOT in project root
- Keep SKILL.md focused on *how*, not *what*
- One skill per concern — don't bundle unrelated workflows
