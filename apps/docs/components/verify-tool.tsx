'use client'

import { useState, useTransition } from 'react'
import type { VerificationExplanation, VerificationResult } from '@open-payments-devkit/core'
import { ExampleSwitcher } from './example-switcher'
import { RequestEditor } from './request-editor'
import { ResultCard } from './result-card'
import type { DemoExample, DemoSelectionName, DocsPresetMode } from '../lib/demo-defaults'

type VerifyToolProps = {
  defaults: {
    body: string
    headersText: string
    method: string
    url: string
  }
  examples: DemoExample[]
  initialPreset: DocsPresetMode
  jwksText: string
  presetOptions: DemoExample['preset'][]
  publicKeyJwkText: string
  selectedExample: DemoSelectionName
}

export function VerifyTool({
  defaults,
  examples,
  initialPreset,
  jwksText,
  presetOptions,
  publicKeyJwkText,
  selectedExample
}: VerifyToolProps) {
  const [method, setMethod] = useState(defaults.method)
  const [url, setUrl] = useState(defaults.url)
  const [headersText, setHeadersText] = useState(defaults.headersText)
  const [body, setBody] = useState(defaults.body)
  const [preset, setPreset] = useState<DocsPresetMode>(initialPreset)
  const [publicKeyText, setPublicKeyText] = useState(publicKeyJwkText)
  const [jwksValue, setJwksValue] = useState(jwksText)
  const [requiredComponentsText, setRequiredComponentsText] = useState('')
  const [requireDigestForBody, setRequireDigestForBody] = useState(true)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [explanation, setExplanation] = useState<VerificationExplanation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="tool-layout">
      <ExampleSwitcher currentExample={selectedExample} examples={examples} route="verify" />

      <form
        className="tool-card"
        onSubmit={(event) => {
          event.preventDefault()
          startTransition(() => {
            void fetch('/api/verify', {
              body: JSON.stringify({
                body,
                headersText,
                jwksText: jwksValue,
                method,
                preset: preset === 'custom' ? '' : preset,
                publicKeyJwkText: publicKeyText,
                requireDigestForBody,
                requiredComponentsText,
                url
              }),
              headers: {
                'content-type': 'application/json'
              },
              method: 'POST'
            })
              .then(async (response) => {
                const payload = await response.json()

                if (!response.ok) {
                  throw new Error(payload.error)
                }

                setResult(payload.result)
                setExplanation(payload.explanation)
                setError(null)
              })
              .catch((caughtError: unknown) => {
                setError(
                  caughtError instanceof Error ? caughtError.message : 'Unable to verify request.'
                )
                setResult(null)
                setExplanation(null)
              })
          })
        }}
      >
        <div className="tool-card__header">
          <div>
            <p className="eyebrow">Verify</p>
            <h2>Rebuild the signature base and explain failures clearly.</h2>
          </div>
          <button type="submit" disabled={isPending}>
            {isPending ? 'Verifying…' : 'Verify request'}
          </button>
        </div>

        <RequestEditor
          body={body}
          headersText={headersText}
          idPrefix="verify"
          method={method}
          onBodyChange={setBody}
          onHeadersTextChange={setHeadersText}
          onMethodChange={setMethod}
          onUrlChange={setUrl}
          url={url}
        />

        <div className="request-editor">
          <label className="field">
            <span>Preset policy</span>
            <select value={preset} onChange={(event) => setPreset(event.target.value as DocsPresetMode)}>
              <option value="custom">custom (no preset)</option>
              {presetOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field field--checkbox">
            <span>Require Content-Digest for body</span>
            <input
              checked={requireDigestForBody}
              type="checkbox"
              onChange={(event) => setRequireDigestForBody(event.target.checked)}
            />
          </label>
          <label className="field field--wide">
            <span>Required components</span>
            <textarea
              rows={4}
              value={requiredComponentsText}
              onChange={(event) => setRequiredComponentsText(event.target.value)}
              placeholder="authorization&#10;content-digest"
            />
          </label>
          <label className="field field--wide">
            <span>Public JWK</span>
            <textarea
              rows={12}
              value={publicKeyText}
              onChange={(event) => setPublicKeyText(event.target.value)}
            />
          </label>
          <label className="field field--wide">
            <span>JWKS</span>
            <textarea rows={12} value={jwksValue} onChange={(event) => setJwksValue(event.target.value)} />
          </label>
        </div>
      </form>

      {error ? <ResultCard title="Error" tone="danger" body={<pre>{error}</pre>} /> : null}

      {result && explanation ? (
        <div className="results-grid">
          <ResultCard title="Verification result" tone={result.ok ? 'success' : 'danger'} body={<pre>{result.code}</pre>} />
          <ResultCard title="Message" body={<pre>{result.message}</pre>} />
          <ResultCard title="Explanation" body={<pre>{explanation.summary}</pre>} />
          <ResultCard title="Next steps" body={<pre>{explanation.nextSteps.join('\n')}</pre>} />
          {result.signatureBase ? <ResultCard title="Signature base" body={<pre>{result.signatureBase}</pre>} /> : null}
          {result.details ? <ResultCard title="Details" body={<pre>{JSON.stringify(result.details, null, 2)}</pre>} /> : null}
        </div>
      ) : null}
    </div>
  )
}
