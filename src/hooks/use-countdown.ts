import * as React from 'react'

function calculateTimeLeft(startTime: number, duration: number) {
  const now = new Date().getTime()
  const elapsedTime = now - startTime
  const timeLeft = duration - elapsedTime

  const minutes = Math.floor((timeLeft / 1000 / 60) % 60)
  const seconds = Math.floor((timeLeft / 1000) % 60)

  return {
    minutes: Math.max(0, minutes),
    seconds: Math.max(0, seconds),
  }
}

export function useCountdown(startTime: Date, duration: number) {
  const startTimeMs = startTime.getTime()
  const [timeLeft, setTimeLeft] = React.useState(() =>
    calculateTimeLeft(startTimeMs, duration),
  )

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeLeft(calculateTimeLeft(startTimeMs, duration))
    }, 1000)

    return () => clearInterval(intervalId)
  }, [startTimeMs, duration])

  return timeLeft
}
