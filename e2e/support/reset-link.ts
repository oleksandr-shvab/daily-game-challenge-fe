import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { expect } from '@playwright/test'

const BACKEND_LOG = path.join(
  import.meta.dirname,
  '..',
  '..',
  '.e2e',
  'backend.log',
)
const LINK = /https?:\/\/\S+\/reset-password\?token=\S+/

// The backend's email stub logs the reset link in `local` and `test` (pinned by a backend test).
// Emails are unique per test, so a line with this email is this test's.
export async function readResetLink(email: string): Promise<string> {
  let link = ''
  await expect
    .poll(
      async () => {
        const log = await readFile(BACKEND_LOG, 'utf8').catch(() => '')
        const line = log
          .split('\n')
          .filter((l) => l.includes(email) && LINK.test(l))
          .at(-1)
        link = line?.match(LINK)?.[0] ?? ''
        return link
      },
      {
        message: `no reset link for ${email} in the backend log`,
        timeout: 10_000,
      },
    )
    .not.toBe('')
  return link
}
