import * as React from 'react'

function countdownLimit(value: number, min: number, max: number) {
  if (value > max) return max
  if (value < min) return min
  return value
}

function getReturnValues(countDown: number) {
  const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((countDown % (1000 * 60)) / 1000)

  return [minutes, seconds]
}

export function useCountdown(targetDate: Date, interval: number) {
  const countDownDate = Math.abs(
    countdownLimit(new Date().getTime() - targetDate.getTime(), 0, interval) -
      interval,
  )

  const [countDown, setCountDown] = React.useState(countDownDate)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCountDown(countDownDate)
    }, 1000)

    return () => clearInterval(interval)
  }, [countDownDate])

  return getReturnValues(countDown)
}
