import { useRef, type MouseEvent } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLenis } from 'lenis/react'
import { drift, frameAt, rise } from '../lib/hero-frames.ts'

const publicBase = import.meta.env.BASE_URL
const FILM_SRC = `${publicBase}videos/01_HERO_OPENING.mp4`
const POSTER_SRC = `${publicBase}videos/01_HERO_OPENING-poster.jpg`

export function Hero() {
  const lenis = useLenis()
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const shadeRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const taglineRef = useRef<HTMLParagraphElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const chapterRef = useRef<HTMLParagraphElement>(null)
  const headlineRef = useRef<HTMLDivElement>(null)
  const statementRef = useRef<HTMLDivElement>(null)
  const finaleRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const hintLabelRef = useRef<HTMLSpanElement>(null)
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
      const intro = introRef.current
      const tagline = taglineRef.current
      const header = headerRef.current
      const chapter = chapterRef.current
      const headline = headlineRef.current
      const statement = statementRef.current
      const finale = finaleRef.current
      const hint = hintRef.current
      const hintLabel = hintLabelRef.current
      const fill = fillRef.current

      if (
        !section ||
        !video ||
        !veil ||
        !shade ||
        !intro ||
        !tagline ||
        !header ||
        !chapter ||
        !headline ||
        !statement ||
        !finale ||
        !hint ||
        !hintLabel ||
        !fill
      ) {
        return
      }

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      video.muted = true
      video.playsInline = true

      if (reduced) {
        section.classList.add('hero--reduced')
        finale.removeAttribute('inert')
        finale.setAttribute('aria-hidden', 'false')
        video.preload = 'auto'
        const play = () => {
          void video.play().catch(() => undefined)
        }
        if (video.readyState >= 2) play()
        else video.addEventListener('canplay', play, { once: true })
        return () => {
          video.removeEventListener('canplay', play)
          video.pause()
        }
      }

      video.preload = 'auto'
      video.muted = true
      video.defaultMuted = true
      video.setAttribute('playsinline', '')
      video.setAttribute('webkit-playsinline', '')
      video.pause()

      let duration = 0
      let targetTime = 0
      let seekFrame = 0
      let unlocked = false
      let introActive = true
      let lastChapter = chapter.textContent ?? ''
      let introTween: gsap.core.Tween | null = null
      let hintTween: gsap.core.Tween | null = null

      const setVeil = gsap.quickSetter(veil, 'opacity')
      const setShade = gsap.quickSetter(shade, 'opacity')
      const setIntro = gsap.quickSetter(intro, 'opacity')
      const setIntroY = gsap.quickSetter(intro, 'y', 'px')
      const setTag = gsap.quickSetter(tagline, 'opacity')
      const setHeader = gsap.quickSetter(header, 'opacity')
      const setHeaderY = gsap.quickSetter(header, 'y', 'px')
      const setHeadline = gsap.quickSetter(headline, 'opacity')
      const setHeadlineY = gsap.quickSetter(headline, 'y', 'px')
      const setStatement = gsap.quickSetter(statement, 'opacity')
      const setStatementY = gsap.quickSetter(statement, 'y', 'px')
      const setFinale = gsap.quickSetter(finale, 'opacity')
      const setFinaleY = gsap.quickSetter(finale, 'y', 'px')
      const setHint = gsap.quickSetter(hint, 'opacity')
      const setFill = gsap.quickSetter(fill, 'scaleY')

      let seekStarted = 0
      let stallTimer = 0

      const desiredTime = () => Math.min(Math.max(targetTime, 0), Math.max(duration - 0.04, 0))

      const flushSeek = () => {
        if (seekFrame) {
          window.cancelAnimationFrame(seekFrame)
          seekFrame = 0
        }
        if (!duration || video.readyState < 2) return
        const stalled =
          video.seeking && (seekStarted === 0 || performance.now() - seekStarted > 240)
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

      const apply = (progress: number) => {
        const frame = frameAt(progress)
        setVeil(frame.veil)
        setShade(frame.shade)
        setFill(progress)
        setTag(frame.tagline)
        setHeader(frame.header)
        setHeaderY((1 - frame.header) * -16)
        setHeadline(frame.headline)
        setHeadlineY(drift(frame.headline, progress, 0.4))
        setStatement(frame.statement)
        setStatementY(drift(frame.statement, progress, 0.68))
        setFinale(frame.finale)
        setFinaleY(rise(frame.finale, 34))

        const finaleLive = frame.finale > 0.45
        finale.toggleAttribute('inert', !finaleLive)
        finale.setAttribute('aria-hidden', finaleLive ? 'false' : 'true')

        if (frame.chapter !== lastChapter) {
          lastChapter = frame.chapter
          chapter.textContent = frame.chapter
        }

        if (progress > 0.002 && introActive) {
          introActive = false
          introTween?.kill()
          hintTween?.kill()
        }

        if (!introActive) {
          setIntro(frame.intro)
          setIntroY(progress > 0.07 ? (1 - frame.intro) * -24 : 0)
          setHint(frame.hint)
        }

        if (!duration) return
        const end = Math.max(duration - 0.04, 0)
        queueSeek(Math.min(Math.max(progress * duration, 0), end))
      }

      introTween = gsap.fromTo(
        intro,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 1.6,
          delay: 0.25,
          ease: 'power3.out',
          onComplete: () => {
            introActive = false
          },
        },
      )

      hintTween = gsap.fromTo(
        hint,
        { opacity: 0 },
        { opacity: 1, duration: 1.15, delay: 1.05, ease: 'power2.out' },
      )

      const rememberDuration = () => {
        if (!Number.isFinite(video.duration) || video.duration <= 0) return
        duration = video.duration
        video.pause()
      }

      const onReady = () => {
        hintLabel.textContent = 'Scroll'
        rememberDuration()
      }

      const onError = () => {
        section.classList.add('hero--missing')
      }

      const onMediaReady = () => {
        rememberDuration()
        ScrollTrigger.refresh()
      }

      const onBuffer = () => {
        catchUp()
      }

      hintLabel.textContent = video.readyState >= 3 ? 'Scroll' : 'Preparing'
      if (video.readyState >= 1) rememberDuration()

      const touchScreen = window.matchMedia('(pointer: coarse)').matches

      video.addEventListener('loadedmetadata', onMediaReady)
      video.addEventListener('durationchange', rememberDuration)
      video.addEventListener('canplay', onReady)
      video.addEventListener('loadeddata', catchUp)
      video.addEventListener('seeked', catchUp)
      if (touchScreen) video.addEventListener('canplay', unlock)
      video.addEventListener('progress', onBuffer)
      video.addEventListener('error', onError)
      window.addEventListener('pointerdown', unlock, { passive: true })
      window.addEventListener('load', onMediaReady)

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
        pin('+=460%')
      })
      motions.add('(max-width: 899px), (max-aspect-ratio: 4/5)', () => {
        pin('+=300%')
      })

      const refreshId = window.requestAnimationFrame(() => {
        ScrollTrigger.refresh()
      })

      return () => {
        window.clearTimeout(stallTimer)
        window.cancelAnimationFrame(refreshId)
        window.cancelAnimationFrame(seekFrame)
        video.removeEventListener('loadedmetadata', onMediaReady)
        video.removeEventListener('durationchange', rememberDuration)
        video.removeEventListener('canplay', onReady)
        video.removeEventListener('loadeddata', catchUp)
        video.removeEventListener('seeked', catchUp)
        if (touchScreen) video.removeEventListener('canplay', unlock)
        video.removeEventListener('progress', onBuffer)
        video.removeEventListener('error', onError)
        window.removeEventListener('pointerdown', unlock)
        window.removeEventListener('load', onMediaReady)
      }
    },
    { scope: sectionRef },
  )

  return (
    <section className="hero" ref={sectionRef} aria-label="Opening film">
      <div className="hero-stage">
        <video
          ref={videoRef}
          className="hero-video"
          src={FILM_SRC}
          poster={POSTER_SRC}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-label="Noiré Studio opening film"
        />
        <div className="hero-fallback" aria-hidden="true">
          <div className="hero-fallback-beam" />
        </div>
        <div className="hero-vignette" aria-hidden="true" />
        <div className="hero-veil" ref={veilRef} aria-hidden="true" />
        <div className="hero-grain" aria-hidden="true" />
        <div className="edge-shade" ref={shadeRef} aria-hidden="true" />
        <div className="film-gate" aria-hidden="true" />
      </div>

      <header className="site-header" ref={headerRef}>
        <p className="header-mark">Noiré Studio</p>
        <p className="header-chapter" ref={chapterRef}>
          01 — Opening
        </p>
      </header>

      <div className="center-lockup">
        <div className="center-lockup-inner" ref={introRef}>
          <p className="center-mark">Noiré Studio</p>
          <span className="center-rule" aria-hidden="true" />
          <p className="center-tag" ref={taglineRef}>
            Move beyond ordinary.
          </p>
        </div>
      </div>

      <div className="side-copy side-copy--left">
        <div className="side-copy-inner" ref={headlineRef}>
          <p className="eyebrow">Campaign 01</p>
          <h1>
            Not made
            <br />
            to follow.
          </h1>
        </div>
      </div>

      <div className="side-copy side-copy--right">
        <div className="side-copy-inner" ref={statementRef}>
          <p className="eyebrow">The house</p>
          <p className="statement">
            Style is
            <br />
            an attitude.
          </p>
        </div>
      </div>

      <div className="finale" ref={finaleRef} inert aria-hidden="true">
        <div className="finale-brand">
          <p className="finale-name">
            Noiré
            <br />
            Studio
          </p>
          <p className="finale-tag">Move beyond ordinary.</p>
        </div>
        <div className="finale-actions">
          <a className="cta" href="#collection" onClick={onAnchor}>
            <span className="cta-row">
              <span>Explore Collection</span>
              <span className="cta-index">01</span>
            </span>
            <span className="cta-line" />
          </a>
          <a className="cta" href="#world" onClick={onAnchor}>
            <span className="cta-row">
              <span>Discover Our World</span>
              <span className="cta-index">02</span>
            </span>
            <span className="cta-line" />
          </a>
        </div>
        <p className="reduced-lines">Not made to follow. Style is an attitude.</p>
      </div>

      <div className="scroll-hint" ref={hintRef}>
        <span className="scroll-hint-line" aria-hidden="true" />
        <span className="scroll-hint-label" ref={hintLabelRef}>
          Scroll
        </span>
      </div>

      <div className="progress-rail" aria-hidden="true">
        <span className="progress-rail-fill" ref={fillRef} />
      </div>
    </section>
  )
}
