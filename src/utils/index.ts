export function removeNullValues<T>(object: T): T {
  const result: Partial<T> = {}

  for (const key in object) {
    if (object[key] !== null) {
      result[key] = object[key]
    }
  }

  return result as T
}
