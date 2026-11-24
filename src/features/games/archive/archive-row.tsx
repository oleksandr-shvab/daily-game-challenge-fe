import { Link } from '@tanstack/react-router'
import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ArchiveItem } from '@/api/generated/models'
import { formatPuzzleDate } from '@/lib/utc-date'
import { cn } from '@/lib/utils'
import {
  boxesOf,
  stateText,
  type BoxMark,
  type RowState,
} from './archive-state'

const BOX_STYLES: Record<BoxMark, string> = {
  empty: 'border border-border',
  filled: 'bg-muted-foreground/40',
  correct: 'bg-green-700 text-white dark:bg-green-400 dark:text-black',
  failed: 'bg-red-700 text-white dark:bg-red-400 dark:text-black',
}

type ArchiveRowProps = {
  slug: string
  item: ArchiveItem
  rowState: RowState
  // Today's puzzle: labelled, and it links to the today route (which asks the server for the day), not a dated one.
  today?: boolean
}

// A link to the puzzle's day: the same screen, no full reload, and a new tab works (AC-83). The link has no aria-label:
// its name is its visible text, in the order it is drawn (WCAG 2.5.3, label in name). The boxes are decoration for it,
// so the state is read once, from the text (AC-85).
export function ArchiveRow({
  slug,
  item,
  rowState,
  today = false,
}: ArchiveRowProps) {
  const { t, i18n } = useTranslation()
  const number = t('games.archive.number', { number: item.number })
  const date = formatPuzzleDate(item.date, i18n.language)
  const state = stateText(rowState, t)
  const label = t('games.archive.today')
  const className =
    'flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-md border px-3 py-2 hover:bg-accent max-md:min-h-11'

  const body = (
    <>
      <span className="flex items-baseline gap-2">
        <span className="font-medium tabular-nums">{number}</span>
        {today && (
          <span className="rounded-full bg-primary px-2 text-xs font-medium text-primary-foreground">
            {label}
          </span>
        )}
        <span className="text-sm text-muted-foreground">{date}</span>
      </span>
      <span className="flex items-center gap-3">
        <span className="text-sm">{state}</span>
        {/* Hidden from assistive technology: the state text beside it says the same (AC-85), and a named image here would
            be read into the link's name a second time. */}
        <span aria-hidden className="flex gap-1">
          {boxesOf(rowState).map((mark, index) => (
            <span
              key={index}
              className={cn(
                'flex size-4 items-center justify-center rounded-sm',
                BOX_STYLES[mark],
              )}
            >
              {mark === 'correct' && <Check aria-hidden className="size-3" />}
              {mark === 'failed' && <X aria-hidden className="size-3" />}
            </span>
          ))}
        </span>
      </span>
    </>
  )

  return today ? (
    <Link
      to="/games/$slug"
      params={{ slug }}
      data-today=""
      className={className}
    >
      {body}
    </Link>
  ) : (
    <Link
      to="/games/$slug/$date"
      params={{ slug, date: item.date }}
      className={className}
    >
      {body}
    </Link>
  )
}
