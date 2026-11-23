import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ReactLenis, useLenis, type LenisRef } from 'lenis/react'
import 'lenis/dist/lenis.css'
import { Epilogue } from './components/Epilogue.tsx'
import { Hero } from './components/Hero.tsx'

const lenisOptions = {
  autoRaf: false,
  duration: 1.08,
  smoothWheel: true,
  wheelMultiplier: 0.82,
  touchMultiplier: 1.15,
  anchors: false,
  stopInertiaOnNavigate: true,
}

function ScrollTriggerSync() {
  useLenis(() => {
    ScrollTrigger.update()
  })

  return null
}

export default function App() {
  const lenisRef = useRef<LenisRef>(null)

  useEffect(() => {
    const update = (time: number) => {
      lenisRef.current?.lenis?.raf(time * 1000)
      ScrollTrigger.update()
    }

    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)

    const refreshId = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh()
    })

    return () => {
      window.cancelAnimationFrame(refreshId)
      gsap.ticker.remove(update)
    }
  }, [])

  return (
    <ReactLenis root options={lenisOptions} autoRaf={false} ref={lenisRef}>
      <ScrollTriggerSync />
      <main>
        <Hero />
        <Epilogue />
      </main>
    </ReactLenis>
  )
}
