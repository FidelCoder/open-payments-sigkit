export class StructuredFieldParseError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = 'StructuredFieldParseError'
  }
}

export const splitDictionaryMembers = (input: string): string[] => {
  const members: string[] = []
  let current = ''
  let depth = 0
  let inString = false

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]
    const previous = input[index - 1]

    if (char === '"' && previous !== '\\') {
      inString = !inString
    }

    if (!inString) {
      if (char === '(') {
        depth += 1
      } else if (char === ')') {
        depth -= 1
      } else if (char === ',' && depth === 0) {
        const member = current.trim()

        if (member) {
          members.push(member)
        }

        current = ''
        continue
      }
    }

    current += char
  }

  const finalMember = current.trim()

  if (finalMember) {
    members.push(finalMember)
  }

  return members
}

export const unquoteStructuredString = (value: string): string => {
  if (!value.startsWith('"') || !value.endsWith('"')) {
    throw new StructuredFieldParseError(`Expected a quoted string, received "${value}".`)
  }

  return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\')
}

export const parseParameterBag = (input: string): Record<string, number | string | true> => {
  const params: Record<string, number | string | true> = {}
  const segments = input
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean)

  for (const segment of segments) {
    const equalsIndex = segment.indexOf('=')

    if (equalsIndex === -1) {
      params[segment] = true
      continue
    }

    const key = segment.slice(0, equalsIndex).trim()
    const rawValue = segment.slice(equalsIndex + 1).trim()

    if (!key) {
      throw new StructuredFieldParseError('Encountered an empty parameter name.')
    }

    if (rawValue.startsWith('"')) {
      params[key] = unquoteStructuredString(rawValue)
    } else if (/^-?\d+$/.test(rawValue)) {
      params[key] = Number(rawValue)
    } else {
      params[key] = rawValue
    }
  }

  return params
}

