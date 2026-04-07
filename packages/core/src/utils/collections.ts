export const uniqueStrings = (values: string[]): string[] => {
  const seen = new Set<string>()
  const unique: string[] = []

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value)
      unique.push(value)
    }
  }

  return unique
}

