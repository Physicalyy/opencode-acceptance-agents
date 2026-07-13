# Project Defaults Resolution

Runtime defaults for URLs, login mode, and edit boundaries must **not** be hard-coded as HEMS-only values in the global skill.

## Optional project files

Under the Trellis repo root:

| File | Purpose |
|------|---------|
| `.trellis/acceptance.defaults.md` | Shared project defaults (safe to commit if no secrets) |
| `.trellis/acceptance.defaults.local.md` | Machine-local overrides (prefer not committing secrets) |

## Suggested fields

```markdown
# Acceptance Defaults

- frontend_url: http://localhost:<port>
- api_base: http://localhost:<port>/<api-prefix>
- login: user-provided | env:QA_USER + env:QA_PASS
- target_routes: ["/feature/path"]
- no_edit_globs: ["src/**", "backend/**"]
- midscene: use local Midscene config
- notes: any project-specific caveats
```

### Rules for credentials

- Prefer `user-provided` in the current conversation, or **env var names** only
- Never put real passwords into global skill files or committed defaults
- Reports may record the **username** used, never the password or raw token

## Resolution order (highest first)

1. User message in the current conversation  
2. Current task `prd.md` / `design.md` / `implement.md` and case `preconditions`  
3. `.trellis/acceptance.defaults.local.md` if present  
4. `.trellis/acceptance.defaults.md` if present  
5. Clearly documented project `.trellis/spec/**` acceptance notes if found  
6. Still missing required values → **blocked**; list missing keys; **do not invent** ports/passwords  

## Required for UI stage

At minimum before UI execution:

- `frontend_url` (or equivalent reachable base)
- Login strategy if authenticated pages are in scope
- Target route or page entry from task docs/cases

## Required for API stage

- `api_base` or absolute URLs in cases
- Auth strategy if endpoints require token

## Edit boundary defaults

Global default write scope:

- **Allowed:** `.trellis/tasks/<task>/**` acceptance artifacts  
- **Denied by default:** product source, infra, unrelated config  

Append project `no_edit_globs` when present (e.g. monorepo app folders).
