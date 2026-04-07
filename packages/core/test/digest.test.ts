import { describe, expect, it } from 'vitest'
import { createContentDigest } from '../src/index.js'
import { verifyContentDigest } from '../src/signatures/content-digest.js'

describe('createContentDigest', () => {
  it('creates a deterministic sha-256 content digest', () => {
    expect(createContentDigest('Open Payments')).toMatchInlineSnapshot(
      '"sha-256=:hppVLz9tLoRBXV9BeTsdUVgkMyID4E+2mkTN4rqTxfo=:"'
    )
  })

  it('verifies the digest against the original body', () => {
    const body = '{"amount":"1000","assetCode":"USD"}'
    const digest = createContentDigest(body)

    expect(verifyContentDigest(body, digest)).toBe(true)
    expect(verifyContentDigest(`${body}!`, digest)).toBe(false)
  })
})
