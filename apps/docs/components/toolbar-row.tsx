import type { ReactNode } from 'react'

type ToolbarRowProps = {
  children: ReactNode
  compact?: boolean
}

export function ToolbarRow({ children, compact = false }: ToolbarRowProps) {
  return (
    <div className={compact ? 'toolbar-row toolbar-row--compact' : 'toolbar-row'}>{children}</div>
  )
}

