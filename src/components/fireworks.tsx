'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface FireworksProps {
  duration?: number
  onComplete?: () => void
}

export function Fireworks({ duration = 4000, onComplete }: FireworksProps) {
  useEffect(() => {
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      } else if (onComplete) {
        onComplete()
      }
    }

    frame()
  }, [duration, onComplete])

  return null
}
