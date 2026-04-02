# Introspector Nodes() Parameter Constraint

## Rule
Never call `Introspector().Nodes(true, true)`. The two boolean parameters are `onlyLeafs` and `onlyRoots` — no node can be both a leaf and a root, so `(true, true)` always returns an empty list.

## Valid Calls
| Call | Meaning |
|------|---------|
| `Nodes(false, false)` | All nodes |
| `Nodes(true, false)` | Only leaf nodes (no children) |
| `Nodes(false, true)` | Only root nodes (no parent) — **use this for top-level registered types** |

## Why This Matters
A runtime panic guard was added to `Nodes()` in l8reflect to prevent this, but catching it at code review time is better than catching it at runtime.

## Historical Context
`AllowedActions` in l8secure called `Nodes(true, true)`, which returned 0 types. This caused the `/permissions` endpoint to return `{}` (empty map), which the UI interpreted as permissive mode — showing all Add/Edit/Delete buttons regardless of the user's role.
