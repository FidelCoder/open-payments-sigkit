import type { ReactNode } from 'react'

type WorkflowShellProps = {
  form: ReactNode
  output: ReactNode
}

export function WorkflowShell({ form, output }: WorkflowShellProps) {
  return (
    <section className="workflow-shell">
      <div className="workflow-shell__column workflow-shell__column--form">
        <div className="workflow-shell__content workflow-shell__content--form">{form}</div>
      </div>
      <aside className="workflow-shell__column workflow-shell__column--output">
        <div className="workflow-shell__content workflow-shell__content--output">{output}</div>
      </aside>
    </section>
  )
}

