import type { ReactNode } from 'react'

type PageHeaderProps = {
  actions?: ReactNode
  badges?: ReactNode
  description: string
  eyebrow?: string
  title: string
}

export function PageHeader({
  actions,
  badges,
  description,
  eyebrow,
  title
}: PageHeaderProps) {
  return (
    <section className="page-header">
      <div className="page-header__copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        <p>{description}</p>
        {badges ? <div className="page-header__badges">{badges}</div> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </section>
  )
}

