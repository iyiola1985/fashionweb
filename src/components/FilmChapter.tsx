import { useRef, type MouseEvent } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLenis } from 'lenis/react'
import type { ReadyChapter } from '../lib/chapters.ts'
import { frameFor, rise } from '../lib/reveal-frames.ts'

type NetworkInformation = {
  saveData?: boolean
  effectiveType?: string
}

function poorNetwork() {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection
  if (!connection) return false
  return (
    connection.saveData === true ||
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g'
  )
}

export function FilmChapter({ chapter }: { chapter: ReadyChapter }) {
  const lenis = useLenis()
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const shadeRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLParagraphElement>(null)
  const closingRef = useRef<HTMLDivElement>(null)
  const chapterRef = useRef<HTMLParagraphElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)

  const onAnchor = (event: MouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute('href')
    if (!href?.startsWith('#')) return
    const target = document.querySelector(href)
    if (!(target instanceof HTMLElement)) return
    event.preventDefault()
    const top = target.getBoundingClientRect().top + window.scrollY
    if (lenis) lenis.scrollTo(top, { duration: 1.35 })
    else window.scrollTo({ top, behavior: 'smooth' })
  }

  useGSAP(
    () => {
      const section = sectionRef.current
      const video = videoRef.current
      const veil = veilRef.current
      const shade = shadeRef.current
      const headline = headlineRef.current
      const label = labelRef.current
      const closing = closingRef.current
      const chapterLabel = chapterRef.current
      const fill = fillRef.current

      if (
        !section ||
        !video ||
        !veil ||
        !shade ||
        !headline ||
        !label ||
        !closing ||
        !chapterLabel ||
        !fill
      ) {
        return
      }

      const playback =
        window.matchMedia('(prefers-reduced-motion: reduce)').matches || poorNetwork()

      video.muted = true
      video.defaultMuted = true
      video.playsInline = true
      video.setAttribute('playsinline', '')
      video.setAttribute('webkit-playsinline', '')
      video.preload = 'none'
      video.pause()

      let armed = false
      const arm = () => {
        if (armed) return
        armed = true
        video.preload = 'auto'
        video.src = chapter.src
      }

      const previous = section.previousElementSibling
      const preload = ScrollTrigger.create({
        trigger: previous instanceof HTMLElement ? previous : section,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => {
          if (self.progress >= 0.52) arm()
        },
      })
      ScrollTrigger.create({
        trigger: section,
        start: 'top 85%',
        onEnter: arm,
      })
      if (preload.progress >= 0.52) arm()

      if (playback) {
        section.classList.add('film-chapter--playback')
        closing.removeAttribute('inert')
        closing.setAttribute('aria-hidden', 'false')
        const play = () => {
          void video.play().catch(() => undefined)
        }
        const start = () => {
          arm()
          if (video.readyState >= 2) play()
          else video.addEventListener('canplay', play, { once: true })
        }
        const playbackEnter = ScrollTrigger.create({
          trigger: section,
          start: 'top 80%',
          onEnter: start,
        })
        if (playbackEnter.progress > 0) start()
        return () => {
          video.removeEventListener('canplay', play)
          video.pause()
        }
      }

      let duration = 0
      let targetTime = 0
      let seekFrame = 0
      let seekStarted = 0
      let stallTimer = 0
      let unlocked = false
      let progress = 0
      let lastChapter = chapterLabel.textContent ?? ''

      const setVeil = gsap.quickSetter(veil, 'opacity')
      const setShade = gsap.quickSetter(shade, 'opacity')
      const setHeadline = gsap.quickSetter(headline, 'opacity')
      const setHeadlineY = gsap.quickSetter(headline, 'y', 'px')
      const setLabel = gsap.quickSetter(label, 'opacity')
      const setLabelY = gsap.quickSetter(label, 'y', 'px')
      const setClosing = gsap.quickSetter(closing, 'opacity')
      const setClosingY = gsap.quickSetter(closing, 'y', 'px')
      const setFill = gsap.quickSetter(fill, 'scaleY')

      const desiredTime = () => Math.min(Math.max(targetTime, 0), Math.max(duration - 0.04, 0))

      const flushSeek = () => {
        if (seekFrame) {
          window.cancelAnimationFrame(seekFrame)
          seekFrame = 0
        }
        if (!duration || video.readyState < 2) return
        const stalled = video.seeking && (seekStarted === 0 || performance.now() - seekStarted > 240)
        if (video.seeking && !stalled) return
        const next = desiredTime()
        if (Math.abs(video.currentTime - next) < 1 / 48) return
        seekStarted = performance.now()
        video.currentTime = next
        window.clearTimeout(stallTimer)
        stallTimer = window.setTimeout(() => {
          if (!duration || !video.seeking) return
          seekStarted = 0
          flushSeek()
        }, 240)
      }

      const queueSeek = (time: number) => {
        targetTime = time
        if (!video.seeking && video.readyState >= 2) {
          flushSeek()
          return
        }
        if (!seekFrame) seekFrame = window.requestAnimationFrame(flushSeek)
      }

      const catchUp = () => {
        if (!duration || Math.abs(video.currentTime - desiredTime()) < 1 / 48) return
        queueSeek(targetTime)
      }

      const unlock = () => {
        if (unlocked) return
        const pending = video.play()
        pending
          .then(() => {
            video.pause()
            unlocked = true
            catchUp()
          })
          .catch(() => undefined)
      }

      const apply = (value: number) => {
        progress = value
        const frame = frameFor(chapter.id, value)
        setVeil(frame.veil)
        setShade(frame.shade)
        setFill(value)
        setHeadline(frame.headline)
        setHeadlineY(rise(frame.headline))
        setLabel(frame.label)
        setLabelY(rise(frame.label, 16))
        setClosing(frame.statement)
        setClosingY(rise(frame.statement, 28))

        const live = frame.statement > 0.45
        closing.toggleAttribute('inert', !live)
        closing.setAttribute('aria-hidden', live ? 'false' : 'true')

        if (frame.chapter !== lastChapter) {
          lastChapter = frame.chapter
          chapterLabel.textContent = frame.chapter
        }

        if (!duration) return
        queueSeek(progress * duration)
      }

      const rememberDuration = () => {
        if (!Number.isFinite(video.duration) || video.duration <= 0) return
        duration = video.duration
        video.pause()
        catchUp()
      }

      const onReady = () => {
        rememberDuration()
        ScrollTrigger.refresh()
      }

      video.addEventListener('loadedmetadata', rememberDuration)
      video.addEventListener('durationchange', rememberDuration)
      video.addEventListener('canplay', onReady)
      video.addEventListener('loadeddata', catchUp)
      video.addEventListener('seeked', catchUp)
      video.addEventListener('progress', catchUp)
      const touchScreen = window.matchMedia('(pointer: coarse)').matches
      if (touchScreen) video.addEventListener('canplay', unlock)
      window.addEventListener('pointerdown', unlock, { passive: true })

      apply(0)

      const pin = (end: string) => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end,
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => apply(self.progress),
        })
      }

      const motions = gsap.matchMedia()
      motions.add('(min-width: 900px) and (min-aspect-ratio: 4/5)', () => {
        pin('+=340%')
      })
      motions.add('(max-width: 899px), (max-aspect-ratio: 4/5)', () => {
        pin('+=240%')
      })

      const refreshId = window.requestAnimationFrame(() => {
        ScrollTrigger.refresh()
      })

      return () => {
        window.clearTimeout(stallTimer)
        window.cancelAnimationFrame(refreshId)
        window.cancelAnimationFrame(seekFrame)
        video.removeEventListener('loadedmetadata', rememberDuration)
        video.removeEventListener('durationchange', rememberDuration)
        video.removeEventListener('canplay', onReady)
        video.removeEventListener('loadeddata', catchUp)
        video.removeEventListener('seeked', catchUp)
        video.removeEventListener('progress', catchUp)
        if (touchScreen) video.removeEventListener('canplay', unlock)
        window.removeEventListener('pointerdown', unlock)
        video.pause()
      }
    },
    { scope: sectionRef, dependencies: [chapter.id, chapter.src] },
  )

  return (
    <section className="film-chapter" ref={sectionRef} aria-label="Model reveal" data-chapter={chapter.id}>
      <div
        className="film-stage"
        style={{ backgroundImage: `url("${chapter.poster}")` }}
      >
        <video
          ref={videoRef}
          className="film-video"
          poster={chapter.poster}
          muted
          playsInline
          preload="none"
          disablePictureInPicture
          aria-label="Noiré Studio model reveal"
        />
        <div className="film-vignette" aria-hidden="true" />
        <div className="film-veil" ref={veilRef} aria-hidden="true" />
        <div className="hero-grain" aria-hidden="true" />
        <div className="film-shade" ref={shadeRef} aria-hidden="true" />
        <div className="film-gate" aria-hidden="true" />
      </div>

      <header className="film-header">
        <p className="header-mark">Noiré Studio</p>
        <p className="header-chapter" ref={chapterRef}>
          02 — Opening
        </p>
      </header>

      <div className="film-copy">
        <div className="film-headline" ref={headlineRef}>
          <p className="eyebrow">Campaign 01</p>
          <h2>
            {chapter.headline[0]}
            <br />
            {chapter.headline[1]}
          </h2>
        </div>
        <p className="film-label" ref={labelRef}>
          {chapter.label}
        </p>
        <div className="film-closing" ref={closingRef} inert aria-hidden="true">
          <p className="film-statement">
            {chapter.statement[0]}
            <br />
            {chapter.statement[1]}
            <br />
            {chapter.statement[2]}
          </p>
          <a className="cta" href={chapter.href} onClick={onAnchor}>
            <span className="cta-row">
              <span>{chapter.cta}</span>
              <span className="cta-index">{chapter.index}</span>
            </span>
            <span className="cta-line" />
          </a>
        </div>
      </div>

      <div className="film-rail" aria-hidden="true">
        <span className="film-rail-fill" ref={fillRef} />
      </div>
    </section>
  )
}
