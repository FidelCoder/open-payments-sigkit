import Link from 'next/link'
import type { DemoExample, DemoSelectionName, DemoToolRoute } from '../lib/demo-defaults'
import { ToolbarRow } from './toolbar-row'

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
      <ToolbarRow compact>
        <div className="example-switcher__intro">
          <p className="eyebrow">Reference vectors</p>
          <p>Load a deterministic request only when you want a known-good starting point.</p>
        </div>
        <Link className="ghost-link" href="/examples">
          Open gallery
        </Link>
      </ToolbarRow>

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
