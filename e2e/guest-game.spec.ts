import { expect, test } from '@playwright/test'
import { checkA11y } from './support/axe'

test("a guest plays today's puzzle to the end", async ({ page }) => {
  await page.goto('/')

  // Step 1's picture comes through the proxy with a signed link.
  const clue = page.getByRole('img', { name: /^Clue 1 of/ })
  await expect(clue).toBeVisible()
  await expect
    .poll(() => clue.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0)
  await expect(page.getByText('6 guesses left', { exact: true })).toBeVisible()
  await checkA11y(page, 'game-start')

  // "Elden Ring" is the answer of the seed's undated draft, so it is wrong on every day.
  await page.getByRole('combobox', { name: 'Search for a game' }).fill('elden')
  await page.getByRole('option', { name: /Elden Ring/ }).click()
  await page.getByRole('button', { name: 'Guess' }).click()
  const guesses = page.getByRole('list', { name: 'Your guesses' })
  await expect(guesses.getByText('Elden Ring')).toBeVisible()
  await expect(page.getByText('5 guesses left', { exact: true })).toBeVisible()

  // A guest's game lives in the browser, so a reload keeps it.
  await page.reload()
  await expect(guesses.getByText('Elden Ring')).toBeVisible()
  await expect(page.getByText('5 guesses left', { exact: true })).toBeVisible()

  for (const left of [
    '4 guesses left',
    '3 guesses left',
    '2 guesses left',
    '1 guess left',
  ]) {
    await page.getByRole('button', { name: 'Skip' }).click()
    await expect(page.getByText(left, { exact: true })).toBeVisible()
  }
  await page.getByRole('button', { name: 'Skip' }).click()

  await expect(
    page.getByRole('heading', { name: 'Not this time' }),
  ).toBeVisible()
  await expect(page.getByText(/^The answer: /)).toBeVisible()
  await checkA11y(page, 'end-screen')
})
