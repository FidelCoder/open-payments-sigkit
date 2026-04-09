import type { ReactNode } from 'react'

type WorkflowPanelProps = {
  action?: ReactNode
  children: ReactNode
  description?: string
  step?: string
  title: string
  tone?: 'default' | 'success' | 'danger' | 'muted'
}

export function WorkflowPanel({
  action,
  children,
  description,
  step,
  title,
  tone = 'default'
}: WorkflowPanelProps) {
  return (
    <section className={`workflow-panel workflow-panel--${tone}`}>
      <div className="workflow-panel__header">
        <div className="workflow-panel__title-row">
          {step ? <span className="workflow-panel__step">{step}</span> : null}
          <div className="workflow-panel__copy">
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
        </div>
        {action ? <div className="workflow-panel__action">{action}</div> : null}
      </div>
      <div className="workflow-panel__body">{children}</div>
    </section>
  )
}

