'use client'

import { useMemo, useState } from 'react'
import { CopyButton } from './copy-button'

type CodeBlockProps = {
  copyLabel?: string
  emptyLabel?: string
  label?: string
  value: string
}

const MAX_PREVIEW_LINES = 12
const MAX_PREVIEW_LENGTH = 1100

const truncateValue = (value: string): string => {
  const lines = value.split('\n')

  if (lines.length <= MAX_PREVIEW_LINES && value.length <= MAX_PREVIEW_LENGTH) {
    return value
  }

  return `${lines.slice(0, MAX_PREVIEW_LINES).join('\n')}\n\n…`
}

export function CodeBlock({
  copyLabel,
  emptyLabel = 'No output yet.',
  label,
  value
}: CodeBlockProps) {
  const [expanded, setExpanded] = useState(false)
  const normalizedValue = value.trim() ? value : emptyLabel
  const collapsible =
    normalizedValue !== emptyLabel &&
    (normalizedValue.split('\n').length > MAX_PREVIEW_LINES ||
      normalizedValue.length > MAX_PREVIEW_LENGTH)

  const displayValue = useMemo(() => {
    if (!collapsible || expanded) {
      return normalizedValue
    }

    return truncateValue(normalizedValue)
  }, [collapsible, expanded, normalizedValue])

  return (
    <div className="code-block">
      <div className="code-block__toolbar">
        <div className="code-block__meta">
          {label ? <span className="code-block__label">{label}</span> : null}
          {collapsible ? <span className="code-block__hint">{expanded ? 'Full output' : 'Preview'}</span> : null}
        </div>
        {normalizedValue !== emptyLabel ? (
          <div className="code-block__actions">
            {collapsible ? (
              <button
                type="button"
                className="ghost-button"
                onClick={() => setExpanded((current) => !current)}
              >
                {expanded ? 'Collapse' : 'Expand'}
              </button>
            ) : null}
            <CopyButton label={copyLabel ?? 'Copy'} value={normalizedValue} />
          </div>
        ) : null}
      </div>
      <pre className="code-block__content">
        <code>{displayValue}</code>
      </pre>
    </div>
  )
}

