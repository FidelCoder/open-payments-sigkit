import type { Metadata } from 'next'
import type { PropsWithChildren } from 'react'
import { SiteShell } from '../components/site-shell'
import './globals.css'

export const metadata: Metadata = {
  description:
    'Open Payments signature toolkit for signing, verification, inspection, debugging, and multi-language developer workflows.',
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
