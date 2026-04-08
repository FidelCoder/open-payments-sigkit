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
      <div>
        <p className="eyebrow">Input mode</p>
        <h2>Start from your own request, or load a reference vector if you need one.</h2>
      </div>
      <div className="chip-list" aria-label={`${route} examples`}>
        <Link
          className={currentExample === 'custom' ? 'chip-link chip-link--active' : 'chip-link'}
          href={`/${route}?example=custom`}
        >
          <span>Custom input</span>
          <small>No preset required</small>
        </Link>
        {examples.map((example) => (
          <Link
            key={`${route}-${example.name}`}
            className={example.name === currentExample ? 'chip-link chip-link--active' : 'chip-link'}
            href={`/${route}?example=${example.name}`}
          >
            <span>{example.label}</span>
            <small>{example.preset}</small>
          </Link>
        ))}
      </div>
    </section>
  )
}
