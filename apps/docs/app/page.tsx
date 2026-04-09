import Link from 'next/link'
import { ResultCard } from '../components/result-card'
import { StatusBadge } from '../components/status-badge'
import { repoHref } from '../lib/navigation'

const workflows = [
  {
    href: '/sign',
    label: 'Sign requests',
    summary: 'Generate Content-Digest, Signature-Input, Signature, and inspect the exact canonical base.'
  },
  {
    href: '/verify',
    label: 'Verify signatures',
    summary: 'Resolve keys from JWK, JWKS, or optional remote JWKS and get typed remediation guidance.'
  },
  {
    href: '/inspect',
    label: 'Inspect canonicalization',
    summary: 'Break down covered components, parsed signature headers, and canonical component lines.'
  },
  {
    href: '/examples',
    label: 'Browse examples',
    summary: 'Launch deterministic Open Payments request vectors into sign, verify, or inspect.'
  }
] as const

const capabilities = [
  'Sign and verify Open Payments request classes with Ed25519 keys.',
  'Inspect canonical signature bases instead of debugging from opaque headers.',
  'Load raw captured HTTP requests when a real trace matters more than a synthetic payload.',
  'Verify locally against JWK or JWKS material, with optional remote JWKS resolution when you explicitly choose it.',
  'Use the TypeScript reference implementation today and a growing Python library for shared core workflows.'
]

const trustSignals = [
  'Deterministic fixtures and signed vectors included in-repo',
  'CLI and docs app use the same core implementation',
  'Typed verification failures with clear remediation text',
  'Python library preview aligned to the same preset and fixture intent'
]

export default function HomePage() {
  return (
    <div className="page-stack">
      <section className="hero-grid">
        <div className="hero-card">
          <div className="hero-card__copy">
            <p className="eyebrow">Open Payments HTTP Signatures Devkit</p>
            <h1>A developer workspace for signing, verifying, and debugging RFC 9421 request flows.</h1>
            <p>
              This docs app is a serious inspection surface for the toolkit: use it to build
              signed requests, explain verification failures, inspect canonical bases, and move
              between bundled examples and real captured traces without leaving the repo. The
              TypeScript toolchain is the most complete surface today, and the repository now also
              includes a Python library preview for the same core request-signing model.
            </p>
          </div>

          <div className="hero-card__actions">
            <Link className="primary-link" href="/sign">
              Open sign workflow
            </Link>
            <Link className="action-link" href="/verify">
              Debug verification
            </Link>
            <a className="action-link" href={repoHref} target="_blank" rel="noreferrer">
              Open repository
            </a>
          </div>

          <div className="hero-card__badges">
            <StatusBadge>TypeScript reference</StatusBadge>
            <StatusBadge>Python preview</StatusBadge>
            <StatusBadge>CLI support</StatusBadge>
            <StatusBadge>Raw HTTP traces</StatusBadge>
            <StatusBadge>Optional remote JWKS</StatusBadge>
          </div>
        </div>

        <div className="hero-side">
          <div className="hero-side__section">
            <p className="eyebrow">What you can trust today</p>
            <ul className="sidebar-list">
              {trustSignals.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="hero-side__section">
            <p className="eyebrow">Quick start</p>
            <ol className="ordered-list">
              <li>Choose a workflow.</li>
              <li>Paste a real request or load a deterministic example.</li>
              <li>Inspect the generated or reconstructed signature data.</li>
              <li>Use the root README for TypeScript and Python library commands.</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {workflows.map((workflow) => (
          <Link key={workflow.href} href={workflow.href} className="feature-card">
            <p className="eyebrow">Workflow</p>
            <h2>{workflow.label}</h2>
            <p>{workflow.summary}</p>
            <span>Open workspace</span>
          </Link>
        ))}
      </section>

      <section className="two-column-grid">
        <ResultCard
          title="Current capability summary"
          description="The toolkit is already usable as a signing and debugging environment, with TypeScript as the reference surface and Python beginning to mirror the core flows."
          body={
            <div className="stack">
              {capabilities.map((capability) => (
                <div key={capability} className="list-row">
                  <strong>{capability}</strong>
                </div>
              ))}
            </div>
          }
        />

        <ResultCard
          title="Fast paths"
          description="Jump directly into the most common developer tasks."
          body={
            <div className="stack">
              <Link className="action-link" href="/sign?example=custom">
                Start from your own request
              </Link>
              <Link className="action-link" href="/verify?example=quote-request">
                Verify a protected request example
              </Link>
              <Link className="action-link" href="/inspect?example=incoming-payment">
                Inspect a resource-write signature base
              </Link>
              <a className="action-link" href={`${repoHref}#python-api`} target="_blank" rel="noreferrer">
                Open Python package docs
              </a>
              <Link className="action-link" href="/examples">
                Search all bundled examples
              </Link>
            </div>
          }
        />
      </section>
    </div>
  )
}
