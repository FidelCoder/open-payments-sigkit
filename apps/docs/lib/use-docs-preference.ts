'use client'

import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

type UseDocsPreferenceOptions<T> = {
  enabled?: boolean
  initialValue: T
  key: string
  parse?(value: string): T
  serialize?(value: T): string
}

export function useDocsPreference<T extends boolean | string>({
  enabled = true,
  initialValue,
  key,
  parse,
  serialize
}: UseDocsPreferenceOptions<T>): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    const storedValue = globalThis.localStorage.getItem(key)

    if (storedValue === null) {
      return undefined
    }

    setValue(parse ? parse(storedValue) : (storedValue as T))

    return undefined
  }, [enabled, key, parse])

  useEffect(() => {
    if (!enabled) {
      return
    }

    globalThis.localStorage.setItem(key, serialize ? serialize(value) : String(value))
  }, [enabled, key, serialize, value])

  return [value, setValue]
}
