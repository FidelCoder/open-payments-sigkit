'use client'

import { useState, useTransition } from 'react'
import type { PresetName, SignedRequestResult } from '@open-payments-devkit/core'
import { RequestEditor } from './request-editor'
import { ResultCard } from './result-card'

type SignToolProps = {
  defaults: {
    body: string
    headersText: string
    method: string
    url: string
  }
  keyId: string
  privateKeyJwkText: string
  presetOptions: PresetName[]
}

export function SignTool({ defaults, keyId, presetOptions, privateKeyJwkText }: SignToolProps) {
  const [method, setMethod] = useState(defaults.method)
  const [url, setUrl] = useState(defaults.url)
  const [headersText, setHeadersText] = useState(defaults.headersText)
  const [body, setBody] = useState(defaults.body)
  const [preset, setPreset] = useState<PresetName>('grant-request')
  const [keyIdValue, setKeyIdValue] = useState(keyId)
  const [privateKeyText, setPrivateKeyText] = useState(privateKeyJwkText)
  const [componentsText, setComponentsText] = useState('')
  const [created, setCreated] = useState('1735689600')
  const [expires, setExpires] = useState('')
  const [nonce, setNonce] = useState('')
  const [tag, setTag] = useState('')
  const [result, setResult] = useState<SignedRequestResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="tool-layout">
      <form
        className="tool-card"
        onSubmit={(event) => {
          event.preventDefault()
          startTransition(() => {
            void fetch('/api/sign', {
              body: JSON.stringify({
                body,
                componentsText,
                created,
                expires,
                headersText,
                keyId: keyIdValue,
                method,
                nonce,
                preset,
                privateKeyJwkText: privateKeyText,
                tag,
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
                setError(null)
              })
              .catch((caughtError: unknown) => {
                setError(caughtError instanceof Error ? caughtError.message : 'Unable to sign request.')
                setResult(null)
              })
          })
        }}
      >
        <div className="tool-card__header">
          <div>
            <p className="eyebrow">Sign</p>
            <h2>Build Content-Digest, Signature-Input, and Signature headers.</h2>
          </div>
          <button type="submit" disabled={isPending}>
            {isPending ? 'Signing…' : 'Sign request'}
          </button>
        </div>

        <RequestEditor
          body={body}
          headersText={headersText}
          idPrefix="sign"
          method={method}
          onBodyChange={setBody}
          onHeadersTextChange={setHeadersText}
          onMethodChange={setMethod}
          onUrlChange={setUrl}
          url={url}
        />

        <div className="request-editor">
          <label className="field">
            <span>Preset</span>
            <select value={preset} onChange={(event) => setPreset(event.target.value as PresetName)}>
              {presetOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Key ID</span>
            <input value={keyIdValue} onChange={(event) => setKeyIdValue(event.target.value)} />
          </label>
          <label className="field">
            <span>Created</span>
            <input value={created} onChange={(event) => setCreated(event.target.value)} />
          </label>
          <label className="field">
            <span>Expires</span>
            <input value={expires} onChange={(event) => setExpires(event.target.value)} />
          </label>
          <label className="field">
            <span>Nonce</span>
            <input value={nonce} onChange={(event) => setNonce(event.target.value)} />
          </label>
          <label className="field">
            <span>Tag</span>
            <input value={tag} onChange={(event) => setTag(event.target.value)} />
          </label>
          <label className="field field--wide">
            <span>Additional components</span>
            <textarea
              rows={4}
              value={componentsText}
              onChange={(event) => setComponentsText(event.target.value)}
              placeholder="@authority&#10;x-idempotency-key"
            />
          </label>
          <label className="field field--wide">
            <span>Private JWK</span>
            <textarea
              rows={14}
              value={privateKeyText}
              onChange={(event) => setPrivateKeyText(event.target.value)}
            />
          </label>
        </div>
      </form>

      {error ? <ResultCard title="Error" tone="danger" body={<pre>{error}</pre>} /> : null}

      {result ? (
        <div className="results-grid">
          <ResultCard title="Digest" tone="success" body={<pre>{result.contentDigest ?? 'No body digest'}</pre>} />
          <ResultCard title="Signature-Input" body={<pre>{result.signatureInput}</pre>} />
          <ResultCard title="Signature" body={<pre>{result.signature}</pre>} />
          <ResultCard title="Covered components" body={<pre>{result.coveredComponents.join('\n')}</pre>} />
          <ResultCard title="Signature base" body={<pre>{result.signatureBase}</pre>} />
          <ResultCard title="Signed request JSON" body={<pre>{JSON.stringify(result.request, null, 2)}</pre>} />
        </div>
      ) : null}
    </div>
  )
}

