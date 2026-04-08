import type { ReactNode } from 'react'

type StepCardProps = {
  action?: ReactNode
  children: ReactNode
  description: string
  step: string
  title: string
}

export function StepCard({
  action,
  children,
  description,
  step,
  title
}: StepCardProps) {
  return (
    <section className="step-card">
      <div className="step-card__header">
        <div className="step-card__label">
          <span className="step-card__index">{step}</span>
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>
        {action ? <div className="step-card__action">{action}</div> : null}
      </div>
      <div className="step-card__body">{children}</div>
    </section>
  )
}

