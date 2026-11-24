import { expect, type Page } from '@playwright/test'

// Below 768 px the sidebar is a panel behind the header's button; from 768 px it is always open.
export async function openNav(page: Page): Promise<void> {
  const toggle = page
    .getByRole('banner')
    .getByRole('button', { name: 'Show or hide the sidebar' })
  // The shell decides phone or wide after it mounts, so wait for either before choosing.
  await expect(
    toggle.or(page.getByRole('navigation', { name: 'Games' })),
  ).toBeVisible()
  if (await toggle.isVisible()) {
    await toggle.click()
    await expect(page.getByRole('dialog')).toBeVisible()
  }
}
