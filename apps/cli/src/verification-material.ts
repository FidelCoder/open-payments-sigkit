import type { JsonWebKey } from 'node:crypto'
import { fetchRemoteJwks } from '@open-payments-devkit/core'
import { readJsonFile } from './io.js'

type VerificationMaterialOptions = {
  jwksFile?: string
  jwksTimeoutMs?: number
  jwksUrl?: string
  publicKeyFile?: string
}

const assertExclusiveVerificationMaterial = (options: VerificationMaterialOptions): void => {
  const configuredSources = [
    options.publicKeyFile ? '--public-key-file' : undefined,
    options.jwksFile ? '--jwks-file' : undefined,
    options.jwksUrl ? '--jwks-url' : undefined
  ].filter((source): source is string => Boolean(source))

  if (configuredSources.length > 1) {
    throw new Error(
      `Choose one verification key source: ${configuredSources.join(', ')}. These options are mutually exclusive.`
    )
  }
}

export const resolveVerificationMaterial = async (
  options: VerificationMaterialOptions
): Promise<{
  jwks?: { keys: JsonWebKey[] }
  publicKeyJwk?: JsonWebKey
}> => {
  assertExclusiveVerificationMaterial(options)

  if (options.publicKeyFile) {
    return {
      publicKeyJwk: await readJsonFile<JsonWebKey>(options.publicKeyFile)
    }
  }

  if (options.jwksFile) {
    return {
      jwks: await readJsonFile<{ keys: JsonWebKey[] }>(options.jwksFile)
    }
  }

  if (options.jwksUrl) {
    return {
      jwks: await fetchRemoteJwks(options.jwksUrl, {
        timeoutMs: options.jwksTimeoutMs
      })
    }
  }

  return {}
}
