# Learnings

Non-obvious lessons from working on this repo. One dated entry per lesson; newer entries supersede older ones.

## What Works

## What Doesn't Work

## Codebase Patterns

## Tool & Library Notes

- **2026-11-24 — axe `label-content-name-mismatch` counts `aria-hidden` text as visible text.** The rule (WCAG 2.5.3, label in name) collects an element's visible text with `screenReader=false`, so text inside an `aria-hidden` child still counts. The sidebar account button (`src/features/auth/components/account-area.tsx`) had `aria-label="Account: <email>"` and a visible avatar initial marked `aria-hidden` next to the email; axe read the visible text as "Eemail", which is not inside the name, and failed on desktop and tablet in `e2e/` (PR #40). What fixed it: draw the initial with CSS generated content (`data-initial` plus Tailwind `before:content-[attr(data-initial)]`), so it is not a text node. The archive rows (`src/features/games/archive/archive-row.tsx`) failed the same rule because their `aria-label` summary ("#4, Today, <date>, <state>") did not contain the visible text; dropping the `aria-label` and letting the visible text form the name, with the decorative state boxes `aria-hidden`, fixed it. Rule of thumb: build accessible names from the visible text rather than from an `aria-label` summary, and don't rely on `aria-hidden` to keep decorative text out of this check.

## Recurring Errors & Fixes

## Session Notes

## Open Questions
