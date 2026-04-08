'use client'

import { useDeferredValue, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { commandItems } from '../lib/navigation'

type CommandMenuProps = {
  onClose(): void
  onQueryChange(value: string): void
  open: boolean
  query: string
}

type CommandItem = (typeof commandItems)[number]

export function CommandMenu({
  onClose,
  onQueryChange,
  open,
  query
}: CommandMenuProps) {
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const router = useRouter()

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const timeout = globalThis.setTimeout(() => {
      const input = globalThis.document.getElementById('command-menu-query')

      if (input instanceof globalThis.HTMLInputElement) {
        input.focus()
      }
    }, 16)

    return () => {
      globalThis.clearTimeout(timeout)
    }
  }, [open])

  const filteredItems = useMemo(() => {
    if (!deferredQuery) {
      return commandItems
    }

    return commandItems.filter((item) => {
      const haystack = [item.label, item.summary, ...item.keywords].join(' ').toLowerCase()
      return haystack.includes(deferredQuery)
    })
  }, [deferredQuery])

  const groups = useMemo(() => {
    const groupedItems: Record<string, CommandItem[]> = {}

    for (const item of filteredItems) {
      const next = groupedItems[item.group] ?? []
      next.push(item)
      groupedItems[item.group] = next
    }

    return groupedItems
  }, [filteredItems])

  if (!open) {
    return null
  }

  return (
    <div className="dialog-root" role="presentation">
      <button
        type="button"
        className="dialog-backdrop"
        aria-label="Close command menu"
        onClick={onClose}
      />
      <div className="command-menu" role="dialog" aria-modal="true" aria-labelledby="command-menu-title">
        <div className="command-menu__header">
          <div>
            <p className="eyebrow">Quick jump</p>
            <h2 id="command-menu-title">Command palette</h2>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        </div>

        <label className="field">
          <span>Search pages, examples, and shortcuts</span>
          <input
            id="command-menu-query"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Jump to verify, inspect quote request, browse examples…"
          />
        </label>

        <div className="command-menu__groups">
          {Object.entries(groups).map(([group, items]: [string, CommandItem[]]) => (
            <section key={group} className="command-menu__group">
              <h3>{group}</h3>
              <div className="command-menu__items">
                {items.map((item) => (
                  <button
                    key={`${group}-${item.href}-${item.label}`}
                    type="button"
                    className="command-menu__item"
                    onClick={() => {
                      router.push(item.href)
                      onClose()
                    }}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.summary}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}

          {filteredItems.length === 0 ? (
            <div className="command-menu__empty">
              <p>No matches yet.</p>
              <span>Try searching for sign, verify, grant, or quote.</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
