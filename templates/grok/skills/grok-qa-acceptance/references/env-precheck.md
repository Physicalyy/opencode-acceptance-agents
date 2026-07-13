# UI Environment Precheck

Run before any Midscene/UI case execution. Fail fast; do not burn Midscene time on a broken env.

Resolve URLs and login via `project-defaults.md` first.

## Check Order

1. **Frontend reachable**  
   Use resolved `frontend_url`.  
   Missing URL after resolution → `blocked`: frontend URL not configured.  
   Unreachable → `blocked`: frontend not accessible.

2. **Backend API reachable** (when cases need API or login proxy)  
   Use resolved `api_base` or task-specified base.  
   Missing when required → `blocked`: api base not configured.  
   Unreachable → `blocked`: backend API not accessible.

3. **Login works** (when authenticated UI is in scope)  
   Credentials from user message, env vars named in defaults, or explicit user provision only.  
   Fail with specific reason (empty org dropdown, captcha, 401, etc.).  
   Do not continue authenticated UI cases.  
   Do not invent passwords.

4. **Target page renders**  
   After login (if needed), open the task target route.  
   Fail on 404, blank page, or permission denial.

5. **Midscene runtime config**  
   Confirm Midscene dependency/scripts exist and model/API config is usable **if** cases require `runner=midscene`.  
   Missing config → `blocked` for Midscene cases only.  
   Do not claim Midscene passed via Playwright-only fallback.  
   Do not hard-require a specific vendor model name.

6. **Per-case preconditions**  
   Data/index/menu prerequisites.  
   Fail individual cases, not necessarily the whole stage.

## Service Ownership

Do **not** start backend/frontend/Redis/Docker unless the user explicitly asks. Report the missing service and stop or continue with non-UI stages.

## Pass Criteria

Only after required checks for the planned UI set pass should UI execution proceed.
