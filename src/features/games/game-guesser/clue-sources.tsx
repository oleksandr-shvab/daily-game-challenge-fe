import { useId, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import type { StepRead } from '@/api/generated/models'
import { Button } from '@/components/ui/button'
import { allFromIgdb, sourceLinkOf } from './source-link'

const IGDB_URL = 'https://www.igdb.com'

// Opens in a new tab and sends no referrer (AC-66).
const EXTERNAL = {
  target: '_blank',
  rel: 'noopener noreferrer',
  referrerPolicy: 'no-referrer',
} as const

// The picture of a step: the image, or a clip's still. It is the link the ladder already shows, so once it has expired
// the row shows text instead and asks for nothing.
function thumbnailOf(step: StepRead): string | null {
  const { media } = step
  const shown =
    media.type === 'video'
      ? media.poster && {
          url: media.poster.url,
          expiresAt: media.poster.expires_at,
        }
      : media.sources[0] && {
          url: media.sources[0].url,
          expiresAt: media.expires_at,
        }
  if (!shown || Date.parse(shown.expiresAt) <= Date.now()) return null
  return shown.url
}

function SourceRow({ step }: { step: StepRead }) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)
  const label = t('games.sources.clue', { n: step.step })
  const link = sourceLinkOf(step.source_url)
  const thumbnail = failed ? null : thumbnailOf(step)
  const ratio =
    step.media.width > 0 && step.media.height > 0
      ? step.media.width / step.media.height
      : 16 / 9

  return (
    <li className="flex items-center gap-3">
      {thumbnail === null ? (
        <span
          aria-hidden="true"
          style={{ aspectRatio: ratio }}
          className="flex w-24 shrink-0 items-center justify-center rounded-md border bg-muted p-1 text-center text-xs text-muted-foreground"
        >
          {label}
        </span>
      ) : (
        <img
          src={thumbnail}
          alt={label}
          style={{ aspectRatio: ratio }}
          className="w-24 shrink-0 rounded-md border object-cover"
          onError={() => setFailed(true)}
        />
      )}
      <span>{label}</span>
      {link === null ? (
        <span className="text-muted-foreground">
          {t('games.sources.not_recorded')}
        </span>
      ) : (
        <a
          href={link.href}
          {...EXTERNAL}
          aria-label={t('games.sources.link_label', {
            n: step.step,
            host: link.host,
          })}
          className="underline underline-offset-2"
        >
          {link.host}
        </a>
      )}
    </li>
  )
}

// What the six clues came from, opened by the player on the end screen (AC-63). No request: the links come with the view.
export function ClueSources({ steps }: { steps: readonly StepRead[] }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const regionId = useId()
  const headingId = useId()
  const ordered = [...steps].sort((a, b) => a.step - b.step)

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button
          type="button"
          variant="outline"
          className="max-md:h-11"
          aria-expanded={open}
          aria-controls={open ? regionId : undefined}
          onClick={() => setOpen((now) => !now)}
        >
          {t('games.sources.button')}
        </Button>
      </div>
      {open && (
        <div
          id={regionId}
          role="region"
          aria-labelledby={headingId}
          className="flex flex-col gap-3"
        >
          <h3 id={headingId} className="font-medium">
            {t('games.sources.heading')}
          </h3>
          <ol className="flex flex-col gap-3">
            {ordered.map((step) => (
              <SourceRow key={step.step} step={step} />
            ))}
          </ol>
          {allFromIgdb(ordered) && (
            <p className="text-sm text-muted-foreground">
              <Trans
                i18nKey="games.sources.via_igdb"
                components={{
                  igdb: (
                    <a
                      href={IGDB_URL}
                      {...EXTERNAL}
                      className="underline underline-offset-2"
                    />
                  ),
                }}
              />
            </p>
          )}
        </div>
      )}
    </div>
  )
}
