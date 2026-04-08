type StatusBadgeProps = {
  children: string
  tone?: 'default' | 'success' | 'danger' | 'warning'
}

export function StatusBadge({
  children,
  tone = 'default'
}: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>
}

