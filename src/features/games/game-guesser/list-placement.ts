import { useLayoutEffect, useState, type RefObject } from 'react'

// The most the list may be tall (about six rows), and the gap kept between it and the box and the screen's edge.
export const MAX_LIST_HEIGHT = 240
const GAP = 8
// The phone header can sit over the top of the page.
const TOP_RESERVE = 64
// The dropdown's own border, top and bottom.
const BORDER = 2

export type ListPlacement = { side: 'below' | 'above'; maxHeight: number }

// Below the box when what the list needs fits there, or when there is no more room above; else above, with the larger
// room. The list scrolls inside its max height, so it is never cut off by the screen.
export function placeList(
  spaceBelow: number,
  spaceAbove: number,
  wanted: number,
): ListPlacement {
  const needed = Math.min(wanted, MAX_LIST_HEIGHT)
  const side =
    spaceBelow >= needed || spaceBelow >= spaceAbove ? 'below' : 'above'
  const room = side === 'below' ? spaceBelow : spaceAbove
  return { side, maxHeight: Math.max(0, Math.min(MAX_LIST_HEIGHT, room)) }
}

const DEFAULT_PLACEMENT: ListPlacement = {
  side: 'below',
  maxHeight: MAX_LIST_HEIGHT,
}

// Measures the room around the box while the list is open, and again when the page scrolls or the screen (or a
// keyboard on a phone) changes. `anchor` is the box, `list` the dropdown, whose first child holds the content.
export function useListPlacement(
  open: boolean,
  anchor: RefObject<HTMLElement | null>,
  list: RefObject<HTMLElement | null>,
  // Whatever changes what the list shows.
  content: unknown,
): ListPlacement {
  const [placement, setPlacement] = useState(DEFAULT_PLACEMENT)

  useLayoutEffect(() => {
    if (!open) return
    function measure() {
      const box = anchor.current?.getBoundingClientRect()
      if (!box) return
      const view = window.visualViewport
      const height = view?.height ?? window.innerHeight
      const offset = view?.offsetTop ?? 0
      const wanted =
        (list.current?.firstElementChild?.scrollHeight ?? 0) + BORDER
      const next = placeList(
        height - (box.bottom - offset) - GAP,
        box.top - offset - GAP - TOP_RESERVE,
        wanted,
      )
      setPlacement((now) =>
        now.side === next.side && now.maxHeight === next.maxHeight ? now : next,
      )
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    window.visualViewport?.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('scroll', measure)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      window.visualViewport?.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('scroll', measure)
    }
  }, [open, anchor, list, content])

  return placement
}
