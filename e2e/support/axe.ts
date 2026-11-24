import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { AXE_ALLOWLIST } from './axe-allowlist'

const WCAG_22_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

// Runs axe on the whole page. Call it after a web-first assertion has seen the state to check.
export async function checkA11y(page: Page, name: string): Promise<void> {
  const project = test.info().project.name
  const results = await new AxeBuilder({ page }).withTags(WCAG_22_AA).analyze()
  await test.info().attach(`axe-${name}`, {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  })

  const allowed = (rule: string) =>
    AXE_ALLOWLIST.some(
      (entry) =>
        entry.rule === rule &&
        entry.page === name &&
        (!entry.projects || entry.projects.includes(project)),
    )
  const problems = results.violations
    .filter((violation) => !allowed(violation.id))
    .map(
      (violation) =>
        `${violation.id}: ${violation.help} (${violation.nodes
          .map((node) => node.target.join(' '))
          .join(', ')})`,
    )
  expect(problems, `axe violations on "${name}" (${project})`).toEqual([])
}
