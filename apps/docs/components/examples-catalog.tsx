import type { HttpRequestShape } from '@open-payments-devkit/core'
import { ResultCard } from './result-card'

type ExamplesCatalogProps = {
  examples: Array<{
    name: string
    preset: string
    request: HttpRequestShape
  }>
}

export function ExamplesCatalog({ examples }: ExamplesCatalogProps) {
  return (
    <div className="results-grid">
      {examples.map((example) => (
        <ResultCard
          key={example.name}
          title={example.name}
          body={
            <div className="stack">
              <p className="eyebrow">{example.preset}</p>
              <pre>{JSON.stringify(example.request, null, 2)}</pre>
            </div>
          }
        />
      ))}
    </div>
  )
}

