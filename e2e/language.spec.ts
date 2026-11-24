import { expect, test } from '@playwright/test'
import { checkA11y } from './support/axe'
import { openNav } from './support/nav'

test('switch to Russian and keep it', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  await openNav(page)
  await page
    .getByRole('group', { name: 'Language' })
    .getByRole('button', { name: 'RU' })
    .click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
  await expect(page.getByRole('navigation', { name: 'Игры' })).toBeVisible()

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
  await expect(page.getByRole('button', { name: 'Пропустить' })).toBeVisible()
  await checkA11y(page, 'game-ru')
})
