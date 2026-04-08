import Link from 'next/link'
import type { PropsWithChildren } from 'react'

const links = [
  ['Overview', '/'],
  ['Sign', '/sign'],
  ['Verify', '/verify'],
  ['Inspect', '/inspect'],
  ['Examples', '/examples']
] as const

const focusAreas = [
  'Grant request signing',
  'Token-bound protected requests',
  'Canonical base inspection',
  'Typed verification failures'
]

export function SiteShell({ children }: PropsWithChildren) {
  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="site-header__grid">
          <div className="site-header__intro">
            <p className="eyebrow">Open Payments HTTP Signatures Devkit</p>
            <h1>Reference signing, inspection, and verification tooling for RFC 9421 workflows.</h1>
            <p className="site-lead">
              Focused developer tooling for Content-Digest generation, Ed25519 request signing,
              verification debugging, and Open Payments request presets.
            </p>
            <nav className="site-nav" aria-label="Primary">
              {links.map(([label, href]) => (
                <Link key={href} href={href}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <aside className="site-header__panel">
            <p className="eyebrow">Focus</p>
            <ul className="site-focus-list">
              {focusAreas.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="site-panel-note">
              <strong>Built to inspect real request flows.</strong>
              <p>
                Grant creation, protected resource access, and write operations all run through one
                typed core with deterministic fixtures.
              </p>
            </div>
          </aside>
        </div>
      </header>
      <main className="page-content">{children}</main>
    </div>
  )
}
