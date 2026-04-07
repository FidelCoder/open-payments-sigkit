import Link from 'next/link'
import type { PropsWithChildren } from 'react'

const links = [
  ['Overview', '/'],
  ['Sign', '/sign'],
  ['Verify', '/verify'],
  ['Inspect', '/inspect'],
  ['Examples', '/examples']
] as const

export function SiteShell({ children }: PropsWithChildren) {
  return (
    <div className="page-shell">
      <header className="site-header">
        <div>
          <p className="eyebrow">Open Payments HTTP Signatures Devkit</p>
          <h1>Reference signing, inspection, and verification tooling for RFC 9421 workflows.</h1>
        </div>
        <nav className="site-nav" aria-label="Primary">
          {links.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="page-content">{children}</main>
    </div>
  )
}

