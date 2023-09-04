import { useState, useEffect, useCallback, type RefObject } from 'react'

const useTouch = (delay: number, targetRef: RefObject<HTMLElement>) => {
  const [isPressed, setIsPressed] = useState(false)

  const handlePressStart = (event: TouchEvent) => {
    if (targetRef.current && targetRef.current.contains(event.target as Node)) {
      const pressTimer = setTimeout(() => {
        setIsPressed(true)
      }, delay)

      const handlePressEnd = () => {
        clearTimeout(pressTimer)
        setIsPressed(false)
      }

      window.addEventListener('touchend', handlePressEnd)

      return () => {
        clearTimeout(pressTimer)
        window.removeEventListener('touchend', handlePressEnd)
      }
    }
  }

  const memoizedHandlePressStart = useCallback(handlePressStart, [
    delay,
    targetRef,
  ])

  useEffect(() => {
    window.addEventListener('touchstart', memoizedHandlePressStart)

    return () => {
      window.removeEventListener('touchstart', memoizedHandlePressStart)
    }
  }, [memoizedHandlePressStart])

  return isPressed
}

export default useTouch
