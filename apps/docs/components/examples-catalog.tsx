import Link from 'next/link'
import type { DemoExample } from '../lib/demo-defaults'
import { ResultCard } from './result-card'

type ExamplesCatalogProps = {
  examples: DemoExample[]
}

export function ExamplesCatalog({ examples }: ExamplesCatalogProps) {
  return (
    <div className="results-grid">
      {examples.map((example) => (
        <ResultCard
          key={example.name}
          title={example.label}
          body={
            <div className="stack">
              <p className="eyebrow">{example.preset}</p>
              <p>{example.description}</p>
              <div className="example-actions">
                <Link className="chip-link" href={`/sign?example=${example.name}`}>
                  Open in sign
                </Link>
                <Link className="chip-link" href={`/verify?example=${example.name}`}>
                  Open in verify
                </Link>
                <Link className="chip-link" href={`/inspect?example=${example.name}`}>
                  Open in inspect
                </Link>
              </div>
              <pre>{JSON.stringify(example.request, null, 2)}</pre>
            </div>
          }
        />
      ))}
    </div>
  )
}
