import Link from 'next/link'
import type { DemoExample, DemoSelectionName, DemoToolRoute } from '../lib/demo-defaults'

type ExampleSwitcherProps = {
  currentExample: DemoSelectionName
  examples: DemoExample[]
  route: DemoToolRoute
}

export function ExampleSwitcher({
  currentExample,
  examples,
  route
}: ExampleSwitcherProps) {
  return (
    <section className="example-switcher">
      <div className="example-switcher__header">
        <div>
          <p className="eyebrow">Examples</p>
          <h2>Load a bundled request when you want a clean starting point.</h2>
          <p>
            The workflows default to your own request, but you can jump into deterministic Open
            Payments vectors at any point.
          </p>
        </div>
        <Link className="ghost-link" href="/examples">
          Open example gallery
        </Link>
      </div>

      <div className="example-switcher__grid" aria-label={`${route} examples`}>
        <Link
          className={currentExample === 'custom' ? 'example-chip is-active' : 'example-chip'}
          href={`/${route}?example=custom`}
        >
          <strong>Custom input</strong>
          <span>Start with your own request and keys.</span>
        </Link>
        {examples.map((example) => (
          <Link
            key={`${route}-${example.name}`}
            className={example.name === currentExample ? 'example-chip is-active' : 'example-chip'}
            href={`/${route}?example=${example.name}`}
          >
            <strong>{example.label}</strong>
            <span>{example.requestType}</span>
            <small>{example.preset}</small>
          </Link>
        ))}
      </div>
    </section>
  )
}
