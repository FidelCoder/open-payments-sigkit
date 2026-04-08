import Link from 'next/link'
import { ResultCard } from '../components/result-card'

const workflows = [
  {
    href: '/sign',
    label: 'Build signed requests',
    summary: 'Generate Content-Digest, Signature-Input, and Signature headers.'
  },
  {
    href: '/verify',
    label: 'Debug verification',
    summary: 'Reconstruct the canonical base and explain failures clearly.'
  },
  {
    href: '/inspect',
    label: 'Inspect canonicalization',
    summary: 'See parsed signature headers and each canonical component line.'
  },
  {
    href: '/examples',
    label: 'Load fixtures',
    summary: 'Start from bundled Open Payments requests and presets.'
  }
] as const

export default function HomePage() {
  return (
    <div className="home-stack">
      <section className="hero-panel">
        <div className="hero-panel__copy">
          <p className="eyebrow">Reference toolkit</p>
          <h2>Open Payments request signing without guesswork.</h2>
          <p className="hero-panel__lead">
            Generate Content-Digest, build Signature-Input, sign Ed25519 requests, verify against
            JWK or JWKS material, inspect canonical signature bases, and explain failures with
            stable remediation guidance.
          </p>
        </div>
        <div className="hero-panel__metrics">
          <div className="hero-stat">
            <span>Coverage</span>
            <strong>Sign, verify, inspect</strong>
          </div>
          <div className="hero-stat">
            <span>Focus</span>
            <strong>Open Payments request classes</strong>
          </div>
          <div className="hero-stat">
            <span>Crypto</span>
            <strong>Ed25519 with JWK and JWKS support</strong>
          </div>
        </div>
      </section>

      <section className="overview-grid">
        <article className="overview-card">
          <p className="eyebrow">Designed for Open Payments</p>
          <h2>Presets map to actual request classes.</h2>
          <p>
            Grant requests, token-bound protected calls, and resource writes share a common signing
            core with policy defaults that stay visible and inspectable.
          </p>
        </article>
        <article className="overview-card">
          <p className="eyebrow">Debuggable by default</p>
          <h2>Verification failures come back with usable context.</h2>
          <p>
            The toolkit exposes signature bases, covered components, stable failure codes, and
            remediation hints so developers can fix request construction problems quickly.
          </p>
        </article>
        <article className="overview-card">
          <p className="eyebrow">Reference vectors included</p>
          <h2>Deterministic fixtures make behavior repeatable.</h2>
          <p>
            The repo includes fixed keys, request fixtures, and conformance vectors so the CLI,
            docs app, and core package all demonstrate the same canonical behavior.
          </p>
        </article>
      </section>

      <section className="routes-grid">
        <ResultCard
          title="Open a workflow"
          body={
            <div className="route-list">
              {workflows.map((workflow) => (
                <Link key={workflow.href} className="route-link" href={workflow.href}>
                  <span>{workflow.label}</span>
                  <small>{workflow.summary}</small>
                </Link>
              ))}
            </div>
          }
        />
        <ResultCard
          title="Included presets"
          body={
            <div className="preset-list">
              <div className="preset-item">
                <strong>grant-request</strong>
                <span>Method, target URI, and digest when a body exists.</span>
              </div>
              <div className="preset-item">
                <strong>protected-request</strong>
                <span>Adds authorization coverage for token-bound requests.</span>
              </div>
              <div className="preset-item">
                <strong>resource-write</strong>
                <span>Protected write preset with stricter digest handling and default timestamps.</span>
              </div>
            </div>
          }
        />
      </section>
    </div>
  )
}
