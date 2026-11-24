// Accessibility problems that exist today and are not fixed yet. Each entry matches an axe rule id
// on one checkA11y name (optionally only on some projects). Never switch a rule off for every page
// and never exclude a region. A fix deletes its entry.
export type AllowedViolation = {
  rule: string
  page: string
  projects?: string[]
  reason: string
}

export const AXE_ALLOWLIST: AllowedViolation[] = []
