import type { StepRead } from '@/api/generated/models'

export type SourceLink = { href: string; host: string }

// `source_url` is text from the server, so only an http or https address becomes a link (AC-68). The href is the parsed
// address as it is, with nothing added (AC-66).
export function sourceLinkOf(sourceUrl: string | null): SourceLink | null {
  if (sourceUrl === null) return null
  let url: URL
  try {
    url = new URL(sourceUrl)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  return { href: url.href, host: displayHost(url.hostname) }
}

// The text of a link: the host without one leading `www.`, so the backend's `www.igdb.com` reads "igdb.com" (AC-64).
export function displayHost(host: string): string {
  return host.startsWith('www.') ? host.slice('www.'.length) : host
}

// Every row has a link and every link is on igdb.com (AC-65).
export function allFromIgdb(steps: readonly Pick<StepRead, 'source_url'>[]) {
  return (
    steps.length > 0 &&
    steps.every((step) => sourceLinkOf(step.source_url)?.host === 'igdb.com')
  )
}
