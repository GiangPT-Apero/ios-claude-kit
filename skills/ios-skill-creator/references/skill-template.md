# Skill Template

Copy this template when creating a new skill.

## Minimal Skill (simple workflow)

```markdown
---
name: <skill-name>
description: <What it does. Use when user asks to X, wants to Y, or mentions Z.>
---

# <Skill Title>

<2-3 sentence summary of what this skill does.>

## Arguments

```
/<skill-name> [arg1] [arg2]
```

| Param | Required | Description |
|-------|----------|-------------|
| arg1  | Yes/No   | ... |

## Flow

### 1. <First Step>
<What to do>

### 2. <Second Step>
<What to do>

### 3. <Final Step>
<What to do, expected output>

## Rules

- <Constraint 1>
- <Constraint 2>
- Stop on error — don't continue if X fails
```

---

## Skill With References (complex workflow)

Use this when the skill needs detailed domain knowledge, cheatsheets, or API references
that would push SKILL.md over 200 lines.

```
skills/<skill-name>/
├── SKILL.md
└── references/
    ├── <domain-knowledge>.md   # loaded as-needed
    └── <api-reference>.md      # loaded as-needed
```

In SKILL.md, reference them explicitly:
```markdown
See `references/<domain-knowledge>.md` for detailed patterns.
```

---

## Frontmatter Reference

```yaml
---
name: my-skill                    # kebab-case, matches directory
description: Short description.   # ≤200 chars, include trigger phrases
---
```

Optional frontmatter fields (from agent_skills_spec):
```yaml
allowed-tools: [Bash, Read, Glob]  # pre-approved tools
metadata:
  author: yourname
  version: "1.0.0"
```

---

## Trigger Phrase Patterns

Make descriptions "pushy" so Claude activates the skill reliably:

| Pattern | Example |
|---------|---------|
| Task-based | "Use when user wants to X" |
| Keyword-based | "Use when user mentions X, Y, or Z" |
| Action-based | "Use for creating X, updating Y, running Z" |
| Negative scope | "Does NOT handle Y — use /other-skill for that" |
