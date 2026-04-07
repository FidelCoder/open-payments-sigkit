import type { VerificationExplanation, VerificationResult } from '../types/public.js'

const EXPLANATIONS: Record<VerificationResult['code'], VerificationExplanation> = {
  INVALID_CONTENT_DIGEST: {
    nextSteps: [
      'Recalculate Content-Digest from the exact request body bytes.',
      'Confirm the body was not reformatted or re-encoded after signing.'
    ],
    summary:
      'The Content-Digest header does not match the supplied body, so the body was modified or the digest was computed incorrectly.',
    title: 'Content-Digest mismatch'
  },
  INVALID_SIGNATURE_INPUT: {
    nextSteps: [
      'Check the Signature-Input structured field syntax.',
      'Ensure component identifiers and parameters are serialized exactly once and with valid types.'
    ],
    summary:
      'The Signature-Input header could not be parsed or contained invalid parameter semantics.',
    title: 'Invalid Signature-Input'
  },
  KEY_NOT_FOUND: {
    nextSteps: [
      'Confirm the key ID in Signature-Input matches a key in the provided JWK or JWKS.',
      'Verify the correct key registry was supplied to the verifier.'
    ],
    summary:
      'The verifier could not locate a public key for the signature key ID, so cryptographic verification could not proceed.',
    title: 'Verification key not found'
  },
  MISSING_CONTENT_DIGEST: {
    nextSteps: [
      'Add a Content-Digest header for requests with bodies.',
      'Make sure the covered components include content-digest when using Open Payments presets.'
    ],
    summary:
      'The request has a body, but it does not include a Content-Digest header that the verifier can validate.',
    title: 'Missing Content-Digest'
  },
  MISSING_REQUIRED_COMPONENT: {
    nextSteps: [
      'Add the missing covered component to Signature-Input.',
      'Use an Open Payments preset if you want the required component set applied automatically.'
    ],
    summary:
      'The signature did not cover one or more components required by the selected preset or verification policy.',
    title: 'Missing covered component'
  },
  MISSING_SIGNATURE: {
    nextSteps: [
      'Add the Signature header to the request.',
      'Ensure the Signature header label matches the Signature-Input label.'
    ],
    summary: 'The request did not include a usable Signature header.',
    title: 'Missing Signature header'
  },
  MISSING_SIGNATURE_INPUT: {
    nextSteps: [
      'Add the Signature-Input header alongside the Signature header.',
      'Ensure the request preserves both signature headers end-to-end.'
    ],
    summary: 'The request did not include a Signature-Input header for the verifier to reconstruct.',
    title: 'Missing Signature-Input header'
  },
  OK: {
    nextSteps: [
      'Inspect the signature base if you need to compare canonicalization across implementations.'
    ],
    summary:
      'The request digest, covered components, and Ed25519 signature all verified successfully.',
    title: 'Verification succeeded'
  },
  REQUEST_COMPONENT_MISMATCH: {
    nextSteps: [
      'Check the request method, target URI, and covered headers against the signed values.',
      'Ensure intermediaries did not remove or rewrite covered headers.'
    ],
    summary:
      'The verifier could not reconstruct one of the covered request components from the supplied HTTP request.',
    title: 'Covered request component mismatch'
  },
  SIGNATURE_MISMATCH: {
    nextSteps: [
      'Compare the reconstructed signature base against the signer’s canonical view.',
      'Confirm the matching Ed25519 key was used and the request was not modified after signing.'
    ],
    summary:
      'The Ed25519 signature did not validate against the reconstructed signature base.',
    title: 'Signature mismatch'
  },
  UNSUPPORTED_ALGORITHM: {
    nextSteps: [
      'Use an Ed25519 OKP JWK with alg=EdDSA when declaring an algorithm.',
      'Remove unsupported alg parameters from Signature-Input.'
    ],
    summary:
      'The request references an algorithm that this toolkit does not support for Open Payments signatures.',
    title: 'Unsupported signing algorithm'
  }
}

/**
 * Converts a verification result into stable remediation guidance.
 */
export const explainVerificationResult = (
  result: VerificationResult
): VerificationExplanation => EXPLANATIONS[result.code]

