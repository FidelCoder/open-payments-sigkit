import type { ReactNode } from 'react'

type CollapsibleBlockProps = {
  children: ReactNode
  defaultOpen?: boolean
  description?: string
  title: string
}

export function CollapsibleBlock({
  children,
  defaultOpen = false,
  description,
  title
}: CollapsibleBlockProps) {
  return (
    <details className="collapsible-block" open={defaultOpen}>
      <summary className="collapsible-block__summary">
        <div className="collapsible-block__copy">
          <strong>{title}</strong>
          {description ? <span>{description}</span> : null}
        </div>
        <span className="collapsible-block__toggle">Toggle</span>
      </summary>
      <div className="collapsible-block__content">{children}</div>
    </details>
  )
}

