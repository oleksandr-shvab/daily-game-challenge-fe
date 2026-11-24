// Accessibility problems that exist today and are not fixed yet. Each entry matches an axe rule id
// on one checkA11y name (optionally only on some projects). Never switch a rule off for every page
// and never exclude a region. A fix deletes its entry.
export type AllowedViolation = {
  rule: string
  page: string
  projects?: string[]
  reason: string
}

export const AXE_ALLOWLIST: AllowedViolation[] = [
  {
    rule: 'label-content-name-mismatch',
    page: 'archive',
    reason:
      'Each row link has an aria-label ("#4, Today, <date>, <state>") that does not contain all of its visible text (WCAG 2.5.3, label in name). Seen on the Today row and the past rows.',
  },
  {
    rule: 'label-content-name-mismatch',
    page: 'game-signed-in',
    projects: ['desktop', 'tablet'],
    reason:
      'The sidebar account button is named "Account: <email>" but its visible text is the avatar initial and the email (WCAG 2.5.3). The phone header button has no visible text, so it passes.',
  },
]
