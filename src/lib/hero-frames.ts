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

export type HeroFrame = {
  veil: number
  intro: number
  tagline: number
  header: number
  headline: number
  statement: number
  finale: number
  hint: number
  shade: number
  chapter: string
}

export function frameAt(progress: number): HeroFrame {
  const p = clamp01(progress)
  const intro = 1 - fadeIn(p, 0.07, 0.14)
  const headline = windowFade(p, 0.16, 0.25, 0.4, 0.46)
  const statement = windowFade(p, 0.46, 0.55, 0.68, 0.75)
  const finale = fadeIn(p, 0.75, 0.88)
  const header = fadeIn(p, 0.07, 0.14)
  const tagline = fadeIn(p, 0.03, 0.08) * intro
  const hint = 1 - fadeIn(p, 0.02, 0.09)

  let veil = 0.12
  if (p < 0.14) {
    veil = 1 - 0.42 * fadeIn(p, 0.02, 0.14)
  } else if (p < 0.42) {
    veil = 0.58 - 0.46 * fadeIn(p, 0.14, 0.42)
  } else {
    veil = 0.12 + 0.05 * fadeIn(p, 0.78, 1)
  }

  let chapter = "01 — Opening"
  if (p >= 0.75) chapter = "04 — Enter"
  else if (p >= 0.45) chapter = "03 — Attitude"
  else if (p >= 0.15) chapter = "02 — Reveal"

  return {
    veil,
    intro,
    tagline,
    header,
    headline,
    statement,
    finale,
    hint,
    shade: Math.max(headline, statement, finale),
    chapter,
  }
}

export function rise(opacity: number, distance = 26) {
  return (1 - opacity) * distance
}

export function drift(opacity: number, progress: number, exitAt: number, distance = 24) {
  const direction = progress > exitAt ? -1 : 1
  return (1 - opacity) * distance * direction
}
