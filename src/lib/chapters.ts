const publicBase = import.meta.env.BASE_URL

export type ReadyChapterId = '02'

export type ForthcomingChapterId = '03' | '04' | '05' | '06'

export type ReadyChapter = {
  id: ReadyChapterId
  status: 'ready'
  index: string
  src: string
  poster: string
  headline: readonly [string, string]
  label: string
  statement: readonly [string, string, string]
  cta: string
  href: string
}

export type ForthcomingChapter = {
  id: ForthcomingChapterId
  status: 'forthcoming'
  title: string
}

export type Chapter = ReadyChapter | ForthcomingChapter

export const chapters = [
  {
    id: '02',
    status: 'ready',
    index: '02',
    src: `${publicBase}videos/02_MODEL_REVEAL.mp4`,
    poster: `${publicBase}videos/02_MODEL_REVEAL-poster.jpg`,
    headline: ['The art of', 'standing apart.'],
    label: 'Noiré / Collection 01',
    statement: ['Not everyone', 'is meant to', 'blend in.'],
    cta: 'Discover the Collection',
    href: '#collection',
  },
  { id: '03', status: 'forthcoming', title: 'Fabric details' },
  { id: '04', status: 'forthcoming', title: 'Runway walk' },
  { id: '05', status: 'forthcoming', title: 'Collection reveal' },
  { id: '06', status: 'forthcoming', title: 'Enter the store' },
] as const satisfies readonly Chapter[]

export function readyChapters(list: readonly Chapter[]): ReadyChapter[] {
  return list.filter((chapter): chapter is ReadyChapter => chapter.status === 'ready')
}
