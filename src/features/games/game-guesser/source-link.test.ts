import { describe, expect, it } from 'vitest'
import { allFromIgdb, sourceLinkOf } from './source-link'

describe('sourceLinkOf (AC-64, AC-68)', () => {
  it('links only an http or https address, shows its host without one leading www, and keeps the address as it came', () => {
    expect(sourceLinkOf('https://www.igdb.com/games/doom')).toEqual({
      href: 'https://www.igdb.com/games/doom',
      host: 'igdb.com',
    })
    expect(sourceLinkOf('http://example.com/x')).toEqual({
      href: 'http://example.com/x',
      host: 'example.com',
    })
    // Only a leading "www." goes, and only once.
    expect(sourceLinkOf('https://www.www.example.com/')?.host).toBe(
      'www.example.com',
    )
    expect(sourceLinkOf('https://awww.example.com/')?.host).toBe(
      'awww.example.com',
    )

    for (const unsafe of [
      null,
      '',
      'not a url',
      'javascript:alert(1)',
      'data:text/html,x',
      'ftp://igdb.com/x',
    ]) {
      expect(sourceLinkOf(unsafe)).toBeNull()
    }
  })
})

describe('allFromIgdb (AC-65)', () => {
  const igdb = { source_url: 'https://www.igdb.com/games/doom' }

  it('is true only when every step has a link on igdb.com', () => {
    expect(allFromIgdb(Array(6).fill(igdb))).toBe(true)
    expect(
      allFromIgdb([
        ...Array(5).fill(igdb),
        { source_url: 'https://igdb.com/x' },
      ]),
    ).toBe(true)
    expect(
      allFromIgdb([
        ...Array(5).fill(igdb),
        { source_url: 'http://example.com/x' },
      ]),
    ).toBe(false)
    expect(allFromIgdb([...Array(5).fill(igdb), { source_url: null }])).toBe(
      false,
    )
    expect(allFromIgdb([])).toBe(false)
  })
})
