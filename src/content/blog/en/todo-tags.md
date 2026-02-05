---
title: "TODO Tags in IDEs: Manage TODO/FIXME/HACK in IntelliJ IDEA"
date: 2026-02-05
tags: [IntelliJ IDEA, Eclipse, TODO, Coding Standards, Productivity]
summary: "Don’t stop at TODO. Add patterns for common task tags (FIXME/XXX/HACK/OPTIMIZE/REVIEW) so IDEs can surface them in one place and you can distinguish bugs, hacks, and real follow-ups."
lang: "en"
draft: false
priority: 2
---

Many Java projects end up with TODO comments everywhere, typically in a single format:

```java
// TODO: refactor this later
```

Over time, TODOs pile up and everything gets mixed together: real bugs, temporary hacks, “needs review” warnings, and regular follow-ups. You lose the ability to **prioritize**.

The good news: IDEs can recognize more than just `TODO`. With a bit of configuration, you can:

- Use different tags to distinguish **follow-ups / known bugs / temporary hacks / review hotspots**
- Let **IntelliJ IDEA** (and other IDEs) collect them into a single TODO view

---

## 1. Common task comment tags

In Java projects (and most languages), these task-style tags are widely used:

- **TODO**: future work, refactors, missing tests/docs, follow-ups
- **FIXME**: known issue that should be fixed (more “bug-like” than TODO)
- **XXX**: suspicious code / potential risk that deserves attention
- **HACK**: temporary workaround that should be replaced with a proper solution
- **NOTE / INFO**: important notes (not necessarily actionable)
- **BUG**: explicitly marking a bug (often combined with a ticket ID)
- **OPTIMIZE**: potential performance/structure/readability improvements
- **REVIEW**: areas you want reviewers to pay extra attention to

These tags are just **plain words in comments**. Whether the IDE indexes them depends on your configuration.

---

## 2. Why does the IDE only show TODO/FIXME by default?

A common surprise:

> “I wrote `HACK`, `XXX`, `OPTIMIZE` — but nothing shows up in the TODO tool window.”

That’s because the IDE only scans comments using the patterns you configured.

- **IntelliJ IDEA**: `Settings/Preferences → Editor → TODO`
  - By default, you’ll usually only have `TODO` (sometimes `FIXME`)
- **Eclipse**: `Preferences → Java → Compiler → Task Tags`
  - By default, it often includes `TODO`, `FIXME`, `XXX`

In short:

- **Configured patterns** → indexed and shown in the TODO/TASK panel
- **Unconfigured tags** → treated as normal comments

---

## 3. Enable more tags in IntelliJ IDEA

### 3.1 Open TODO settings

Path: **Settings/Preferences → Editor → TODO**

You’ll see a **Patterns** list of regex rules. Many setups only include something like:

- `\bTODO\b.*`
- maybe `\bFIXME\b.*`

### 3.2 Add patterns for your tags

Click the `+` button and add patterns such as:

- `\bHACK\b.*`
- `\bXXX\b.*`
- `\bOPTIMIZE\b.*`
- `\bREVIEW\b.*`

Two small tips:

- **Patterns are regex** (not simple text matching)
- Prefer the form `\bTAG\b.*`
  - `\b` ensures word boundaries (avoid matching within other words)
  - `.*` captures the rest of the line so the TODO panel shows context

After saving, IDEA will re-scan and your new tags should appear in the TODO tool window.

---

## 4. Configure Task Tags in Eclipse

If you use Eclipse, the idea is the same, just a different menu:

Path: **Preferences → Java → Compiler → Task Tags**

You can:

- Add tags (e.g. `OPTIMIZE`, `HACK`)
- Remove rarely used tags
- Set priorities, for example:
  - `FIXME` / `BUG`: High
  - `TODO`: Normal
  - `OPTIMIZE`: Low

---

## 5. Team practice: a recommended tag set

If you define too many tags, you may run into:

- Harder filtering/searching
- Inconsistent meaning across teammates

A practical set is **2–4 core tags**, with a shared meaning:

- **TODO**: features/refactors/docs/tests to do
- **FIXME**: known defects to fix
- **OPTIMIZE** (optional): improvements (performance/structure/maintainability)
- **REVIEW** (optional): needs extra attention or confirmation

You can also combine tags with ticket IDs for traceability:

- `FIXME(#1234): race condition under high concurrency`
- `TODO(#5678): replace with unified auth component`

Recommended format:

- `TAG: description`
- `TAG(#IssueId): description`

---

## 6. Common pitfalls

- **Relying on syntax highlight instead of the TODO panel**  
  Editor highlight may depend on themes/inspections. The TODO panel is the source of truth.

- **Patterns too broad → false matches**  
  Use `\bTAG\b.*` to avoid matching inside other words.

- **No team agreement**  
  Document which tags are allowed, what they mean, and whether issue IDs are required.

---

## Summary

- Common tags include **TODO / FIXME / XXX / HACK / NOTE / BUG / OPTIMIZE / REVIEW**.
- IDEs only index what you configured in **TODO/Task patterns** (IDEA) or **Task Tags** (Eclipse).
- Keep a small set of shared tags (2–4), optionally combine them with issue IDs, and make them visible in the TODO panel.

