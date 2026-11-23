import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import App from './App.tsx'
import './index.css'

gsap.registerPlugin(ScrollTrigger)

// The mobile browser toolbar resizes the viewport while the user scrolls.
// Refreshing the pin on that resize snaps the film back to the start.
ScrollTrigger.config({ ignoreMobileResize: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
