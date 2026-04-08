type KeyValueListProps = {
  items: Array<{
    label: string
    tone?: 'default' | 'muted'
    value: string
  }>
}

export function KeyValueList({ items }: KeyValueListProps) {
  return (
    <dl className="key-value-list">
      {items.map((item) => (
        <div key={`${item.label}-${item.value}`} className="key-value-list__item">
          <dt>{item.label}</dt>
          <dd className={item.tone === 'muted' ? 'is-muted' : undefined}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

