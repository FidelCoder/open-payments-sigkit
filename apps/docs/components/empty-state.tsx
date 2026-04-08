import type { ReactNode } from 'react'

type EmptyStateProps = {
  action?: ReactNode
  description: string
  title: string
}

export function EmptyState({
  action,
  description,
  title
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="eyebrow">Ready</p>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  )
}

