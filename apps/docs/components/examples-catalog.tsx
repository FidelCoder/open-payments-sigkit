'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo, useState } from 'react'
import type { DemoExample } from '../lib/demo-defaults'
import { CopyButton } from './copy-button'
import { ResultCard } from './result-card'
import { StatusBadge } from './status-badge'

type ExamplesCatalogProps = {
  examples: DemoExample[]
}

type PresetFilter = 'all' | DemoExample['preset']

const presetFilters: PresetFilter[] = ['all', 'grant-request', 'protected-request', 'resource-write']

export function ExamplesCatalog({ examples }: ExamplesCatalogProps) {
  const [query, setQuery] = useState('')
  const [presetFilter, setPresetFilter] = useState<PresetFilter>('all')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  const filteredExamples = useMemo(() => {
    return examples.filter((example) => {
      const matchesFilter = presetFilter === 'all' || example.preset === presetFilter
      const haystack = [
        example.label,
        example.description,
        example.name,
        example.preset,
        example.requestType
      ]
        .join(' ')
        .toLowerCase()

      return matchesFilter && (!deferredQuery || haystack.includes(deferredQuery))
    })
  }, [deferredQuery, examples, presetFilter])

  return (
    <div className="page-stack">
      <section className="page-header">
        <div className="page-header__copy">
          <p className="eyebrow">Examples</p>
          <h1>Search deterministic request vectors and launch them into a workflow.</h1>
          <p>
            Each example mirrors a concrete Open Payments request class and can be loaded directly
            into sign, verify, or inspect.
          </p>
          <div className="page-header__badges">
            <StatusBadge>Deterministic fixtures</StatusBadge>
            <StatusBadge>Preset-aware</StatusBadge>
            <StatusBadge>One-click workflow loading</StatusBadge>
          </div>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            className="command-trigger command-trigger--wide"
            onClick={() => globalThis.dispatchEvent(new globalThis.Event('docs:open-command'))}
          >
            <span>Open command palette</span>
            <kbd>Ctrl K</kbd>
          </button>
        </div>
      </section>

      <section className="surface-card catalog-toolbar">
        <label className="field field--wide">
          <span>Search examples</span>
          <small className="field__hint">
            Search by request type, preset, or example label.
          </small>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find quote requests, resource writes, bootstrap flows…"
          />
        </label>

        <div className="filter-row" aria-label="Example preset filters">
          {presetFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={presetFilter === filter ? 'filter-chip is-active' : 'filter-chip'}
              onClick={() => setPresetFilter(filter)}
            >
              {filter === 'all' ? 'All presets' : filter}
            </button>
          ))}
        </div>
      </section>

      <div className="catalog-grid">
        {filteredExamples.map((example) => (
          <ResultCard
            key={example.name}
            title={example.label}
            description={example.description}
            actions={<StatusBadge>{example.preset}</StatusBadge>}
            body={
              <div className="catalog-card">
                <div className="catalog-card__meta">
                  <div>
                    <span className="catalog-card__label">Request type</span>
                    <strong>{example.requestType}</strong>
                  </div>
                  <div>
                    <span className="catalog-card__label">Vector name</span>
                    <strong>{example.name}</strong>
                  </div>
                </div>

                <div className="example-actions">
                  <Link className="action-link" href={`/sign?example=${example.name}`}>
                    Load in sign
                  </Link>
                  <Link className="action-link" href={`/verify?example=${example.name}`}>
                    Load in verify
                  </Link>
                  <Link className="action-link" href={`/inspect?example=${example.name}`}>
                    Load in inspect
                  </Link>
                </div>

                <div className="catalog-card__preview">
                  <pre>{JSON.stringify(example.request, null, 2)}</pre>
                  <CopyButton
                    label="Copy JSON"
                    value={JSON.stringify(example.request, null, 2)}
                  />
                </div>
              </div>
            }
          />
        ))}
      </div>

      {filteredExamples.length === 0 ? (
        <div className="empty-state">
          <p className="eyebrow">No matches</p>
          <h3>Nothing matched the current filters.</h3>
          <p>Clear the search or switch back to All presets to see the full reference set.</p>
        </div>
      ) : null}
    </div>
  )
}
