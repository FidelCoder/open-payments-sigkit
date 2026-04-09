import type { ReactNode } from 'react'

type StatusBannerProps = {
  actions?: ReactNode
  badges?: ReactNode
  description: string
  eyebrow?: string
  title: string
  tone?: 'default' | 'success' | 'danger'
}

export function StatusBanner({
  actions,
  badges,
  description,
  eyebrow,
  title,
  tone = 'default'
}: StatusBannerProps) {
  return (
    <section className={`status-banner status-banner--${tone}`}>
      <div className="status-banner__main">
        <div className="status-banner__copy">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {actions ? <div className="status-banner__actions">{actions}</div> : null}
      </div>
      {badges ? <div className="status-banner__badges">{badges}</div> : null}
    </section>
  )
}
