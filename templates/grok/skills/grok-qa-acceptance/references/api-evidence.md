# API Evidence Contract

## Scope (frontend-supporting only)

API stage supports **frontend verification**, not a full backend suite.

Prefer:

- login / token acquisition used by the UI
- critical read APIs that prove data the page must show
- permission/error responses that the UI must surface

Avoid expanding into unrelated backend matrices unless the user explicitly asks.

## Case Selection

Execute cases where:

- `type = "api"` OR
- `runner` in `api`, `curl`

Skip UI/Midscene cases in the API stage.

## Base URL and auth

Resolve from (see `project-defaults.md`):

1. Case steps / `test_data` absolute URLs
2. User message
3. `.trellis/acceptance.defaults*.md` (`api_base`, login mode)
4. Task docs

If `api_base` or auth cannot be resolved when required → mark cases `blocked` with reason.  
Do not hard-code project-specific hosts, path prefixes, or passwords in this global contract.

When login is needed:

- Use the method/path documented by the project or case
- Cache token for the stage only in memory
- Redact tokens in all written evidence

Prefer curl or an equivalent HTTP client in shell.

## Per-Case Procedure

1. Parse `test_data` + `steps` for method, path, headers, body.
2. Resolve absolute URL from base + path.
3. Login if endpoint needs auth; cache token for the stage.
4. Execute request.
5. Capture status code, key fields, short body summary.
6. Evaluate each `expected` assertion.
7. Set `status` to `passed` / `failed` / `blocked` / `partial`.
8. Write redacted evidence.

## Minimum Evidence For `passed`

Must include:

- HTTP method and full URL
- HTTP status code
- At least one response field assertion result
- Redacted note that secrets were not stored
