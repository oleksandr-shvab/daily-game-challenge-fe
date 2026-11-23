import { Maximize2, X } from 'lucide-react'
import { useRef, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { MediaRead, PosterRead } from '@/api/generated/models'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ClueVideo } from './clue-video'

// One frame for every step, image or video, in every state (loading, failed, loaded), so the page never jumps (decision
// 77). 16:9; the width is the room there is: the whole content width, at most 64rem, and not so wide that the frame's
// height pushes the guess box off a laptop screen (24rem is what the rest of the page needs, never narrower than 20rem).
export const CLUE_FRAME_CLASS =
  'relative mx-auto aspect-video w-[min(100%,64rem,max(20rem,calc((100dvh_-_24rem)_*_16/9)))] overflow-hidden rounded-lg bg-muted'

// The larger view: the same 16:9 frame at the largest size the viewport holds, without scrolling. The backdrop is the
// dialog's own overlay, so a click outside the frame closes it.
const ENLARGED_CLASS =
  'aspect-video w-[min(calc(100vw_-_2rem),calc((100dvh_-_2rem)_*_16/9))] max-w-none gap-0 overflow-hidden bg-muted p-0 ring-0 sm:max-w-none'

type Link = { url: string; expiresAt: string }

// `retried` is links that were asked for, loading (a failure now is final, AC-25); `refreshing` and `removed` wait for
// new links, with the media on the page or, after "Try again", off it.
type Status =
  'loading' | 'loaded' | 'retried' | 'refreshing' | 'removed' | 'failed'

type Shown = {
  // What the page shows, and the last media from the view that was looked at.
  media: MediaRead
  seen: MediaRead
  status: Status
  // The still that fills a clip's box before it plays has a request of its own: its failure never touches the clip.
  poster: PosterRead | null
  posterStatus: 'ok' | 'refreshing' | 'retried'
  posterLoaded: string | null
}

// The link that stands for the media: its first source.
function linkOf(media: MediaRead): Link | null {
  const [source] = media.sources
  return source ? { url: source.url, expiresAt: media.expires_at } : null
}

// A link's file is its address without the query, where the signature and the expiry are (CONTRACTS, "Clue media").
function fileOf(url: string): string {
  const { origin, pathname } = new URL(url, window.location.href)
  return origin + pathname
}

function hasExpired(expiresAt: string): boolean {
  return Date.parse(expiresAt) <= Date.now()
}

function sourcesOf(media: MediaRead): string {
  return media.sources.map((source) => source.url).join(' ')
}

function takeMedia(now: Shown, media: MediaRead, status: Status): Shown {
  return {
    ...now,
    media,
    status,
    poster: media.poster,
    posterStatus: 'ok',
  }
}

// The view brought media, from a guess or as the answer to a request for links (already taken by `settle`). A good
// link stays, so the browser keeps its file and a clip keeps playing; a failed or expired one takes the new link.
function adopt(now: Shown, offered: MediaRead): Shown {
  const seen = { ...now, seen: offered }
  const link = linkOf(offered)
  const current = linkOf(now.media)
  if (!link || link.url === current?.url) return seen

  if (
    !current ||
    now.status === 'failed' ||
    now.status === 'refreshing' ||
    now.status === 'removed' ||
    hasExpired(current.expiresAt) ||
    fileOf(link.url) !== fileOf(current.url)
  ) {
    // Links that were asked for stay on trial; a guess's start fresh.
    const asked = now.status === 'refreshing' || now.status === 'removed'
    return takeMedia(seen, offered, asked ? 'retried' : 'loading')
  }
  // The poster runs out sooner than the clip does, and changing it does not restart the clip.
  const { poster } = offered
  if (
    poster &&
    now.poster &&
    poster.url !== now.poster.url &&
    hasExpired(now.poster.expires_at)
  ) {
    return { ...seen, poster, posterStatus: 'ok' }
  }
  return seen
}

// The answer to a request for links: take them, or, with nothing new, there is nothing to wait for.
function settle(now: Shown, fresh: MediaRead | undefined): Shown {
  if (now.status !== 'refreshing' && now.status !== 'removed') return now
  if (fresh && sourcesOf(fresh) !== sourcesOf(now.media)) {
    return takeMedia(now, fresh, 'retried')
  }
  // Media taken off the page tries the same links again; a file that just failed has nothing left to try.
  return { ...now, status: now.status === 'removed' ? 'retried' : 'failed' }
}

// The answer for the poster: only the new poster is taken, and a second failure ends the poster, not the clip.
function settlePoster(now: Shown, fresh: MediaRead | undefined): Shown {
  if (now.posterStatus !== 'refreshing') return now
  const poster = fresh?.poster
  return poster && poster.url !== now.poster?.url
    ? { ...now, poster, posterStatus: 'retried' }
    : { ...now, poster: null, posterStatus: 'retried' }
}

type ClueMediaProps = {
  media: MediaRead
  alt: string
  // Whether the step is the one shown: a clip on another step pauses.
  active: boolean
  // Gets every link signed again and gives this step's new media, if there is any.
  onRefreshLinks: () => Promise<MediaRead | undefined>
}

type SurfaceProps = {
  shown: Shown
  alt: string
  active: boolean
  loading: boolean
  onLoaded: () => void
  onFailure: () => void
  onRetry: () => void
}

// What fills a frame: the loading state, the failure with "Try again", or the file. The small frame and the larger view
// both show it, from the same state, so a refresh of expired links reaches both.
function ClueSurface({
  shown,
  alt,
  active,
  loading,
  onLoaded,
  onFailure,
  onRetry,
}: SurfaceProps) {
  const { t } = useTranslation()
  const url = linkOf(shown.media)?.url ?? ''

  return (
    <>
      {loading && <Skeleton className="absolute inset-0 rounded-none" />}
      {shown.status === 'failed' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {t('games.clue_failed')}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="max-md:h-11"
            onClick={onRetry}
          >
            {t('games.clue_retry')}
          </Button>
        </div>
      ) : (
        shown.status !== 'removed' &&
        url !== '' &&
        (shown.media.type === 'video' ? (
          <ClueVideo
            sources={shown.media.sources}
            poster={shown.poster?.url}
            active={active}
            onLoaded={onLoaded}
            onFailure={onFailure}
          />
        ) : (
          <img
            src={url}
            alt={alt}
            onLoad={onLoaded}
            onError={onFailure}
            className="size-full object-contain"
          />
        ))
      )}
    </>
  )
}

// The frame is the same for every file, so the page does not jump before the file loads (AC-19).
export function ClueMedia({
  media,
  alt,
  active,
  onRefreshLinks,
}: ClueMediaProps) {
  const { t } = useTranslation()
  const [shown, setShown] = useState<Shown>({
    media,
    seen: media,
    status: 'loading',
    poster: media.poster,
    posterStatus: 'ok',
    posterLoaded: null,
  })
  // The link a request is out for, so two failures of one file in a row ask once.
  const asking = useRef<string | null>(null)
  const askingPoster = useRef<string | null>(null)

  if (media !== shown.seen) setShown((now) => adopt(now, media))

  function ask(
    guard: { current: string | null },
    failedUrl: string,
    begin: (now: Shown) => Shown,
    answer: (now: Shown, fresh: MediaRead | undefined) => Shown,
  ) {
    if (guard.current === failedUrl) return
    guard.current = failedUrl
    setShown(begin)
    onRefreshLinks()
      .catch(() => undefined)
      .then((fresh) => {
        guard.current = null
        setShown((now) => answer(now, fresh))
      })
  }

  const [enlarged, setEnlarged] = useState(false)
  const clipUrl = linkOf(shown.media)?.url ?? ''

  // A file that failed, or a clip that stopped, asks for fresh links once (AC-24). A second failure shows the
  // message, and nothing asks again until the player presses "Try again" (AC-25).
  function handleFailure() {
    if (shown.status === 'retried') {
      setShown((now) =>
        now.status === 'retried' ? { ...now, status: 'failed' } : now,
      )
    } else if (shown.status === 'loading' || shown.status === 'loaded') {
      ask(asking, clipUrl, (now) => ({ ...now, status: 'refreshing' }), settle)
    }
  }

  function retry() {
    ask(asking, clipUrl, (now) => ({ ...now, status: 'removed' }), settle)
  }

  function handleLoaded() {
    setShown((now) => ({ ...now, status: 'loaded' }))
  }

  // A poster that fails asks for links once and takes only the new poster; a second failure drops the poster.
  function handlePosterFailure() {
    if (shown.posterStatus === 'retried') {
      setShown((now) => ({ ...now, poster: null }))
    } else if (shown.posterStatus === 'ok') {
      ask(
        askingPoster,
        shown.poster?.url ?? '',
        (now) => ({ ...now, posterStatus: 'refreshing' }),
        settlePoster,
      )
    }
  }

  const { poster } = shown
  const isVideo = shown.media.type === 'video'
  const posterShowing =
    isVideo && poster?.url === shown.posterLoaded && shown.status !== 'removed'
  const loading =
    shown.status !== 'loaded' && shown.status !== 'failed' && !posterShowing
  const hasFile =
    shown.status !== 'failed' && shown.status !== 'removed' && clipUrl !== ''

  // A click on the picture opens the larger view; the buttons inside the frame keep their own meaning. The keyboard
  // and screen readers have the expand button.
  function handleFrameClick(event: MouseEvent) {
    if (!hasFile) return
    if (event.target instanceof Element && event.target.closest('button')) {
      return
    }
    setEnlarged(true)
  }

  return (
    <Dialog open={enlarged} onOpenChange={setEnlarged}>
      <div
        data-slot="clue-frame"
        className={cn(CLUE_FRAME_CLASS, hasFile && 'cursor-zoom-in')}
        onClick={handleFrameClick}
      >
        <ClueSurface
          shown={shown}
          alt={alt}
          // The larger view plays the clip meanwhile.
          active={active && !enlarged}
          loading={loading}
          onLoaded={handleLoaded}
          onFailure={handleFailure}
          onRetry={retry}
        />
        {/* A `<video>` says nothing when its poster fails or loads, so the poster is also loaded as an image. */}
        {hasFile && isVideo && poster && (
          <img
            src={poster.url}
            alt=""
            hidden
            onLoad={() =>
              setShown((now) => ({
                ...now,
                posterStatus: 'ok',
                posterLoaded: poster.url,
              }))
            }
            onError={handlePosterFailure}
          />
        )}
        {hasFile && (
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              aria-label={t('games.clue_enlarge')}
              className="absolute top-2 right-2 max-md:size-11"
            >
              <Maximize2 aria-hidden />
            </Button>
          </DialogTrigger>
        )}
      </div>
      <DialogContent aria-describedby={undefined} className={ENLARGED_CLASS}>
        {/* The first control in the dialog, so it has the focus on open. */}
        <DialogClose asChild>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label={t('games.clue_close')}
            className="absolute top-2 right-2 z-10 max-md:size-11"
          >
            <X aria-hidden />
          </Button>
        </DialogClose>
        {/* The same name as the picture's: it never says what the answer is. */}
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="relative size-full">
          <ClueSurface
            shown={shown}
            alt={alt}
            active
            loading={loading}
            onLoaded={handleLoaded}
            onFailure={handleFailure}
            onRetry={retry}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
