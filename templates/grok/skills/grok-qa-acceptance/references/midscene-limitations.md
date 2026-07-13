# Midscene Robust Assertion Strategy

Midscene uses multimodal models on screenshots. Prefer stable, observable assertions.

## Limitation 1: Transient Elements

Toasts, notifications, brief loading overlays disappear quickly.

**Do not** primary-assert “toast text is visible”.

**Prefer side effects:**

- search results unchanged / no loading / no new rows (request blocked)
- route did not change
- list count unchanged

If toast itself must be checked, mark timing-sensitive in `notes`.

## Limitation 2: Scroll Containers

`max-height + overflow: auto` shows partial content. AI may call this “truncated defect”.

**Do not** assert “all text fully visible without scrolling”.

**Prefer:**

- expanded area appears with substantially more text than the snippet
- content area is visible and scrollable

Note CSS scroll behavior in `notes` when relevant.

## Limitation 3: Animations

Transitions and spinners create ambiguous intermediate frames.

**Prefer:**

- wait/sleep after action
- assert final stable state (“after wait, list shows N records”)

## Limitation 4: Ambiguous Click Targets

AI may confuse row vs button vs link.

**Prefer user-intent steps:**

- “click the search result entry”
- accept row or button if prd is ambiguous
- note ambiguity in `notes`

## Case Author Checklist

Before finalizing each Midscene case:

1. Transient message primary assert? → rewrite to side effect
2. Full visibility in scroll container? → rewrite
3. Animation? → add wait before assert
4. Click target ambiguous? → user-intent wording
5. Requires reading source DOM structure? → do not; stay requirement-oriented

## Execution Rule

For `runner=midscene`:

- Midscene execution is required for `passed`
- Playwright-only DOM/network/screenshot without Midscene must not mark pass
- Playwright may assist as browser driver inside Midscene
