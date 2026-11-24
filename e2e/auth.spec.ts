import { expect, test, type Page } from '@playwright/test'
import {
  NEW_PASSWORD,
  PASSWORD,
  registerByApi,
  uniqueEmail,
} from './support/accounts'
import { checkA11y } from './support/axe'
import { readResetLink } from './support/reset-link'

async function signIn(page: Page, email: string, password: string) {
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
}

test('register, log out and log in', async ({ page }) => {
  const email = uniqueEmail()
  const account = page.getByRole('button', { name: `Account: ${email}` })

  // "Log in" is in the sidebar and in the phone header; "Sign up" is on the login page.
  await page.goto('/')
  await page.getByRole('link', { name: 'Log in' }).click()
  await page.getByRole('link', { name: 'Sign up' }).click()
  await expect(page.getByText('Create an account')).toBeVisible()
  await checkA11y(page, 'register')

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL('/')
  await expect(account).toBeVisible()
  await checkA11y(page, 'game-signed-in')

  await account.click()
  await page.getByRole('menuitem', { name: 'Log out' }).click()
  const logIn = page.getByRole('link', { name: 'Log in' })
  await expect(logIn).toBeVisible()

  await logIn.click()
  await expect(
    page.getByText('Enter your email and password to continue.'),
  ).toBeVisible()
  await checkA11y(page, 'login')
  await signIn(page, email, PASSWORD)
  await expect(page).toHaveURL('/')
  await expect(account).toBeVisible()
})

test('reset a forgotten password', async ({ page, request }) => {
  const email = uniqueEmail()
  await registerByApi(request, email, PASSWORD)

  await page.goto('/login')
  await page.getByRole('link', { name: 'Forgot password?' }).click()
  await expect(
    page.getByText('Enter your email and', { exact: false }),
  ).toBeVisible()
  await checkA11y(page, 'forgot-password')
  await page.getByLabel('Email').fill(email)
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await expect(page.getByText('Check your email')).toBeVisible()

  await page.goto(await readResetLink(email))
  await expect(
    page.getByText('Choose a new password for your account.'),
  ).toBeVisible()
  await checkA11y(page, 'reset-password')
  await page.getByLabel('New password', { exact: true }).fill(NEW_PASSWORD)
  await page.getByLabel('Confirm new password').fill(NEW_PASSWORD)
  await page.getByRole('button', { name: 'Reset password' }).click()
  await expect(page).toHaveURL(/\/login/)

  await signIn(page, email, NEW_PASSWORD)
  await expect(page).toHaveURL('/')
  await expect(
    page.getByRole('button', { name: `Account: ${email}` }),
  ).toBeVisible()
})
