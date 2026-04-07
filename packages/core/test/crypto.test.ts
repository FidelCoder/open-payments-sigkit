import { describe, expect, it } from 'vitest'
import { signEd25519, verifyEd25519 } from '../src/crypto/ed25519.js'
import {
  primaryPrivateKeyFixture,
  primaryPublicKeyFixture,
  secondaryPublicKeyFixture
} from './fixtures.js'

describe('Ed25519 signing', () => {
  it('signs and verifies a canonical base string', () => {
    const signatureBase = '"@method": POST\n"@target-uri": https://rs.example.com/quotes'
    const signature = signEd25519(signatureBase, primaryPrivateKeyFixture)

    expect(verifyEd25519(signatureBase, signature, primaryPublicKeyFixture)).toBe(true)
    expect(verifyEd25519(signatureBase, signature, secondaryPublicKeyFixture)).toBe(false)
  })
})

