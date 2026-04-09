export const repoHref = 'https://github.com/FidelCoder/open-payments-sigkit'

export const docsNavLinks = [
  {
    description: 'Workspace overview and quick start',
    href: '/',
    label: 'Overview'
  },
  {
    description: 'Build signed Open Payments requests',
    href: '/sign',
    label: 'Sign'
  },
  {
    description: 'Debug verification and explain failures',
    href: '/verify',
    label: 'Verify'
  },
  {
    description: 'Inspect canonicalized signature inputs',
    href: '/inspect',
    label: 'Inspect'
  },
  {
    description: 'Browse bundled request fixtures and flows',
    href: '/examples',
    label: 'Examples'
  }
] as const

export const commandItems = [
  ...docsNavLinks.map((entry) => ({
    group: 'Pages',
    href: entry.href,
    keywords: [entry.label.toLowerCase(), ...entry.description.toLowerCase().split(' ')],
    label: entry.label,
    summary: entry.description
  })),
  {
    group: 'Examples',
    href: '/sign?example=grant-request',
    keywords: ['grant', 'sign', 'grant-request', 'create'],
    label: 'Load bootstrap request in sign',
    summary: 'Open the bootstrap access vector directly in the signing workflow.'
  },
  {
    group: 'Examples',
    href: '/verify?example=quote-request',
    keywords: ['quote', 'verify', 'protected-request', 'token'],
    label: 'Load quote request in verify',
    summary: 'Open the protected quote request in the verification workflow.'
  },
  {
    group: 'Examples',
    href: '/inspect?example=incoming-payment',
    keywords: ['incoming-payment', 'inspect', 'resource-write'],
    label: 'Inspect incoming payment canonicalization',
    summary: 'Jump to the resource-write inspection flow for incoming payments.'
  },
  {
    group: 'Examples',
    href: '/examples',
    keywords: ['fixtures', 'examples', 'gallery', 'vectors'],
    label: 'Browse all bundled examples',
    summary: 'Search the full example gallery and load any request into a workflow.'
  }
] as const
