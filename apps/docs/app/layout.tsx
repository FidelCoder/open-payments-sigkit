import type { Metadata } from 'next'
import type { PropsWithChildren } from 'react'
import { SiteShell } from '../components/site-shell'
import './globals.css'

export const metadata: Metadata = {
  description:
    'Focused tooling for Open Payments HTTP Message Signatures, Ed25519 client keys, inspection, and verification.',
  title: 'Open Payments HTTP Signatures Devkit'
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}

