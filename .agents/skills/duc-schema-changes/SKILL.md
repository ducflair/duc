---
name: duc-schema-changes
description: >
  Use this skill whenever implementing type, field, or schema changes across the duc monorepo.
  Triggers when the user asks to add a new field, change a type, rename a property, or propagate
  any data model change across the duc codebase. Also triggers when the user mentions duc.sql,
  schema migrations, DataState, or any of the cross-language duc type files (ducrs, ducjs, ducpy).
  Always use this skill before touching duc type files — it tells you exactly which files to edit
  and in what order.
---

# duc Schema Changes

When any data model change is needed in the duc monorepo, changes must be propagated across **three language targets** in a consistent order, followed by builds and (if needed) SQL migrations.

---

## Step 0 — Check what changed

Before writing any code, review the schema to understand the change:

```
duc/schema/duc.sql
```

If changes may already be staged and not on the duc.sql, check git diff --staged first to understand the changes.

---

## Step 1 — Rust (ducrs)

Edit these three files in order:

| File | Purpose |
|------|---------|
| `duc/packages/ducrs/src/types.rs` | Struct/enum definitions |
| `duc/packages/ducrs/src/parse.rs` | Deserialization logic |
| `duc/packages/ducrs/src/serialize.rs` | Serialization logic |

**Pattern**: Add new fields to the struct in `types.rs`, then add matching parse/serialize arms in the other two. Keep field names consistent with the SQL schema.

---

## Step 2 — TypeScript (ducjs)

Edit these files:

| File | Purpose |
|------|---------|
| `duc/packages/ducjs/src/types/index.ts` | Top-level type exports |
| `duc/packages/ducjs/src/types/elements/index.ts` | Element-specific types |
| `duc/packages/ducjs/src/restore/restoreDataState.ts` | DataState restore logic |

Also check for **other restore files** in `duc/packages/ducjs/src/restore/` that may reference the changed type — grep for the field/type name and update any that appear.

---

## Step 3 — Python (ducpy)

Edit these files:

| File | Purpose |
|------|---------|
| `duc/packages/ducpy/src/ducpy/classes/DataStateClass.py` | DataState class definition |
| `duc/packages/ducpy/src/ducpy/classes/ElementsClass.py` | Elements class definition |

---

## Step 4 — Build & Test

Run from the monorepo root using the scripts defined in `duc/package.json`:

```bash
cd duc
# Check what build/test commands are available:
cat package.json | grep -A 30 '"scripts"'
```

Then run the relevant commands. Run for all three packages that were touched.

---

## Step 5 — SQL Migrations (if needed)

If the schema itself changed (new columns, tables, type modifications), create a migration file:

1. Find the latest migration in `duc/schema/migrations/` — migrations are numbered sequentially
2. Create a new file on top of the last one, e.g. `3000015_to_3000016.sql`

```bash
ls -1 duc/schema/migrations/ | sort | tail -5   # see last migrations
```

---

## Checklist

- [ ] Reviewed `duc/schema/duc.sql` (and git diff if staged)
- [ ] Updated `ducrs`: types.rs → parse.rs → serialize.rs
- [ ] Updated `ducjs`: types/index.ts, types/elements/index.ts, restore/restoreDataState.ts (+ any other restore files)
- [ ] Updated `ducpy`: DataStateClass.py, ElementsClass.py
- [ ] Built/tested all three packages
- [ ] Created SQL migration (if schema changed)