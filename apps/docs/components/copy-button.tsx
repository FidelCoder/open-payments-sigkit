'use client'

import { useEffect, useState } from 'react'

type CopyButtonProps = {
  className?: string
  label?: string
  value: string
}

export function CopyButton({
  className,
  label = 'Copy',
  value
}: CopyButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  useEffect(() => {
    if (status === 'idle') {
      return undefined
    }

    const timeout = globalThis.setTimeout(() => {
      setStatus('idle')
    }, 1800)

    return () => {
      globalThis.clearTimeout(timeout)
    }
  }, [status])

  return (
    <button
      type="button"
      className={className ?? 'copy-button'}
      onClick={async () => {
        try {
          await globalThis.navigator.clipboard.writeText(value)
          setStatus('copied')
        } catch {
          setStatus('error')
        }
      }}
    >
      {status === 'idle' ? label : status === 'copied' ? 'Copied' : 'Copy failed'}
    </button>
  )
}
