import { expect, test } from '@playwright/test'
import { checkA11y } from './support/axe'
import { openNav } from './support/nav'

test('open a past puzzle from the archive', async ({ page }) => {
  await page.goto('/')
  await openNav(page)
  await page.getByRole('link', { name: 'Archive' }).click()

  // Today's row comes first, then past days (3 or more on any day, see the seed).
  const rows = page
    .getByRole('list', { name: 'Past puzzles' })
    .getByRole('listitem')
    .filter({ has: page.getByRole('link') })
  const today = rows.first().getByRole('link')
  await expect(today).toHaveAttribute('data-today', '')
  await expect(today).toContainText('Today')
  // No aria-label: the name is the visible text in its order, number first (label in name).
  await expect(today).toHaveAccessibleName(
    /^#\d+ Today \S.* (Not played|In progress|Solved in \d|Not solved)$/,
  )
  await expect(today).toHaveAttribute('href', '/games/game-guesser')
  await expect.poll(() => rows.count()).toBeGreaterThanOrEqual(4)
  await checkA11y(page, 'archive')

  await rows.nth(1).getByRole('link').click()
  await expect(page).toHaveURL(/\/games\/game-guesser\/\d{4}-\d{2}-\d{2}$/)
  await expect(page.getByRole('img', { name: /^Clue 1 of/ })).toBeVisible()
})
