import type { PresetDefinition, PresetName } from '../types/public.js'

export const PRESET_DEFINITIONS: Record<PresetName, PresetDefinition> = {
  'grant-request': {
    baseComponents: ['@method', '@target-uri'],
    description:
      'Unsigned grant bootstrapping requests. Covers the method and target URI, and adds Content-Digest whenever a body is present.',
    includeDigestWhenBody: true,
    name: 'grant-request',
    requireAuthorization: false,
    requireDigestForBody: true
  },
  'protected-request': {
    baseComponents: ['@method', '@target-uri', 'authorization'],
    description:
      'Token-bound Open Payments requests. Covers method, target URI, authorization, and the body digest when present.',
    includeDigestWhenBody: true,
    name: 'protected-request',
    requireAuthorization: true,
    requireDigestForBody: true
  },
  'resource-write': {
    baseComponents: ['@method', '@target-uri', 'authorization'],
    defaultTimestamps: {
      addCreated: true,
      ttlSeconds: 300
    },
    description:
      'Protected write operations with stricter body digest expectations and default created/expires metadata.',
    includeDigestWhenBody: true,
    name: 'resource-write',
    requireAuthorization: true,
    requireDigestForBody: true
  }
}

