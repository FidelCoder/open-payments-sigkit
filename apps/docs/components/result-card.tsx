import type { ReactNode } from 'react'

type ResultCardProps = {
  body: ReactNode
  title: string
  tone?: 'default' | 'danger' | 'success'
}

export function ResultCard({ body, title, tone = 'default' }: ResultCardProps) {
  return (
    <section className={`result-card result-card--${tone}`}>
      <h3>{title}</h3>
      <div>{body}</div>
    </section>
  )
}

