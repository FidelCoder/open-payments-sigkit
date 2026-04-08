import type { ReactNode } from 'react'

type ResultCardProps = {
  actions?: ReactNode
  body: ReactNode
  description?: string
  title: string
  tone?: 'default' | 'danger' | 'success'
}

export function ResultCard({
  actions,
  body,
  description,
  title,
  tone = 'default'
}: ResultCardProps) {
  return (
    <section className={`result-card result-card--${tone}`}>
      <div className="result-card__header">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="result-card__actions">{actions}</div> : null}
      </div>
      <div className="result-card__body">{body}</div>
    </section>
  )
}
