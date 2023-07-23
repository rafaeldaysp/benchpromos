export function removeNullValues<T>(object: T): T {
  const result: Partial<T> = {}

  for (const key in object) {
    if (object[key] !== null) {
      result[key] = object[key]
    }
  }

  return result as T
}

export function reorder<T>(
  list: T[],
  startIndex: number,
  endIndex: number,
): T[] {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)

  return result
}

export function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
  )
}
