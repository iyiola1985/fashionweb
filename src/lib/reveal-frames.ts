import type { ReadyChapterId } from './chapters.ts'

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const smoothstep = (value: number) => {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

const fadeIn = (progress: number, start: number, end: number) =>
  smoothstep((progress - start) / (end - start))

const windowFade = (
  progress: number,
  enterStart: number,
  enterEnd: number,
  exitStart: number,
  exitEnd: number,
) => Math.min(fadeIn(progress, enterStart, enterEnd), 1 - fadeIn(progress, exitStart, exitEnd))

export type RevealFrame = {
  veil: number
  headline: number
  label: number
  statement: number
  shade: number
  chapter: string
}

export function rise(opacity: number, distance = 22) {
  return (1 - opacity) * distance
}

function revealFrameAt(progress: number): RevealFrame {
  const p = clamp01(progress)
  const headline = windowFade(p, 0.05, 0.14, 0.3, 0.4)
  const label = windowFade(p, 0.38, 0.48, 0.64, 0.74)
  const statement = fadeIn(p, 0.7, 0.84)

  let veil = 0.12
  if (p < 0.18) veil = 0.34 - 0.22 * fadeIn(p, 0, 0.18)
  else veil = 0.12 + 0.06 * fadeIn(p, 0.78, 1)

  let chapter = '02 — Opening'
  if (p >= 0.7) chapter = '02 — Runway'
  else if (p >= 0.36) chapter = '02 — Reveal'

  return {
    veil,
    headline,
    label,
    statement,
    shade: Math.max(headline, label, statement),
    chapter,
  }
}

export function frameFor(id: ReadyChapterId, progress: number): RevealFrame {
  switch (id) {
    case '02':
      return revealFrameAt(progress)
    default: {
      const exhaustive: never = id
      return exhaustive
    }
  }
}
