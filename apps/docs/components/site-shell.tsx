'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'
import { CommandMenu } from './command-menu'
import { docsNavLinks, repoHref } from '../lib/navigation'

const trustSignals = [
  'TypeScript reference implementation with CLI and docs UI',
  'Deterministic fixtures and conformance vectors',
  'Raw HTTP trace ingestion for real request captures',
  'Python library preview for shared signing and verification workflows'
]

const capabilitySummary = [
  'Generate Content-Digest',
  'Build Signature-Input',
  'Sign Ed25519 requests',
  'Verify against JWK or JWKS',
  'Inspect canonical signature bases',
  'Grow toward multi-language library support'
]

const isRouteActive = (pathname: string, href: string): boolean => {
  if (href === '/') {
    return pathname === '/'
  }

  return pathname.startsWith(href)
}

export function SiteShell({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')

  useEffect(() => {
    const onKeyDown = (event: { ctrlKey: boolean; key: string; metaKey: boolean; preventDefault(): void }) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsCommandOpen(true)
      }

      if (event.key === 'Escape') {
        setIsNavOpen(false)
        setIsCommandOpen(false)
      }
    }

    const onOpenCommand = () => {
      setIsCommandOpen(true)
    }

    globalThis.addEventListener('keydown', onKeyDown)
    globalThis.addEventListener('docs:open-command', onOpenCommand)

    return () => {
      globalThis.removeEventListener('keydown', onKeyDown)
      globalThis.removeEventListener('docs:open-command', onOpenCommand)
    }
  }, [])

  useEffect(() => {
    setIsNavOpen(false)
    setCommandQuery('')
  }, [pathname])

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__brand">
            <button
              type="button"
              className="header-icon-button mobile-only"
              aria-label="Open navigation"
              onClick={() => setIsNavOpen(true)}
            >
              Menu
            </button>

            <Link href="/" className="brand-lockup">
              <span className="brand-lockup__mark">OP</span>
              <span className="brand-lockup__copy">
                <strong>HTTP Signatures Devkit</strong>
                <small>TypeScript reference, Python preview</small>
              </span>
            </Link>
          </div>

          <nav className="header-nav desktop-only" aria-label="Primary">
            {docsNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={isRouteActive(pathname, link.href) ? 'header-nav__link is-active' : 'header-nav__link'}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="app-header__actions">
            <button
              type="button"
              className="command-trigger"
              onClick={() => setIsCommandOpen(true)}
            >
              <span>Quick jump</span>
              <kbd>Ctrl K</kbd>
            </button>
            <a className="header-link" href={repoHref} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside className="app-sidebar desktop-only">
          <div className="sidebar-panel">
            <p className="eyebrow">Workspace</p>
            <div className="sidebar-nav" aria-label="Workspace navigation">
              {docsNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={isRouteActive(pathname, link.href) ? 'sidebar-link is-active' : 'sidebar-link'}
                >
                  <strong>{link.label}</strong>
                  <span>{link.description}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="sidebar-panel">
            <p className="eyebrow">Capabilities</p>
            <ul className="sidebar-list">
              {capabilitySummary.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="sidebar-panel sidebar-panel--accent">
            <p className="eyebrow">Trust signals</p>
            <ul className="sidebar-list">
              {trustSignals.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <a className="sidebar-link sidebar-link--external" href={repoHref} target="_blank" rel="noreferrer">
              <strong>Repository</strong>
              <span>Read the implementation, CLI, fixtures, and docs.</span>
            </a>
          </div>
        </aside>

        <main className="app-main">{children}</main>
      </div>

      {isNavOpen ? (
        <div className="dialog-root mobile-only" role="presentation">
          <button
            type="button"
            className="dialog-backdrop"
            aria-label="Close navigation"
            onClick={() => setIsNavOpen(false)}
          />
          <div className="mobile-sheet" role="dialog" aria-modal="true" aria-labelledby="mobile-nav-title">
            <div className="mobile-sheet__header">
              <div>
                <p className="eyebrow">Navigation</p>
                <h2 id="mobile-nav-title">Open Payments workspace</h2>
              </div>
              <button type="button" className="ghost-button" onClick={() => setIsNavOpen(false)}>
                Close
              </button>
            </div>

            <div className="mobile-sheet__body">
              {docsNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={isRouteActive(pathname, link.href) ? 'sidebar-link is-active' : 'sidebar-link'}
                >
                  <strong>{link.label}</strong>
                  <span>{link.description}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <CommandMenu
        open={isCommandOpen}
        query={commandQuery}
        onClose={() => setIsCommandOpen(false)}
        onQueryChange={setCommandQuery}
      />
    </div>
  )
}
