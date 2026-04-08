'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import type { SignedRequestResult } from '@open-payments-devkit/core'
import { CodeBlock } from './code-block'
import { CopyButton } from './copy-button'
import { EmptyState } from './empty-state'
import { ExampleSwitcher } from './example-switcher'
import { KeyValueList } from './key-value-list'
import { LoadingPanel } from './loading-panel'
import { PageHeader } from './page-header'
import { RequestEditor, type RequestInputFormat } from './request-editor'
import { ResultCard } from './result-card'
import { StatusBadge } from './status-badge'
import { StepCard } from './step-card'
import type { DemoExample, DemoSelectionName, DocsPresetMode } from '../lib/demo-defaults'
import { formatJson, formatRequestSummary, joinLines } from '../lib/output-formatters'
import { buildRawRequestDraftFromFormInput } from '../lib/request-drafts'
import { useDocsPreference } from '../lib/use-docs-preference'

type SignToolProps = {
  defaults: {
    body: string
    headersText: string
    method: string
    url: string
  }
  examples: DemoExample[]
  initialPreset: DocsPresetMode
  keyId: string
  privateKeyJwkText: string
  presetOptions: DemoExample['preset'][]
  selectedExample: DemoSelectionName
}

export function SignTool({
  defaults,
  examples,
  initialPreset,
  keyId,
  presetOptions,
  privateKeyJwkText,
  selectedExample
}: SignToolProps) {
  const [method, setMethod] = useState(defaults.method)
  const [url, setUrl] = useState(defaults.url)
  const [headersText, setHeadersText] = useState(defaults.headersText)
  const [body, setBody] = useState(defaults.body)
  const [inputFormat, setInputFormat] = useDocsPreference<RequestInputFormat>({
    enabled: selectedExample === 'custom',
    initialValue: 'structured',
    key: 'docs.request-input-format'
  })
  const [rawRequestText, setRawRequestText] = useState(
    selectedExample === 'custom'
      ? ''
      : buildRawRequestDraftFromFormInput({
          body: defaults.body,
          headersText: defaults.headersText,
          method: defaults.method,
          url: defaults.url
        })
  )
  const [requestScheme, setRequestScheme] = useDocsPreference<string>({
    enabled: selectedExample === 'custom',
    initialValue: 'https',
    key: 'docs.request-default-scheme'
  })
  const [preset, setPreset] = useDocsPreference<DocsPresetMode>({
    enabled: selectedExample === 'custom',
    initialValue: initialPreset,
    key: 'docs.sign.preset'
  })
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

  const copyAllResult = useMemo(() => {
    if (!result) {
      return ''
    }

    return formatJson(result)
  }, [result])

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Sign"
        title="Build a signed request in a focused workspace."
        description="Prepare the request, attach the signing key, choose an Open Payments preset, and inspect the exact digest, signature headers, and canonical base produced by the core library."
        badges={
          <>
            <StatusBadge>Ed25519</StatusBadge>
            <StatusBadge>Open Payments presets</StatusBadge>
            <StatusBadge>Raw HTTP compatible</StatusBadge>
          </>
        }
        actions={
          <div className="page-action-group">
            <Link className="action-link" href="/examples">
              Browse example vectors
            </Link>
          </div>
        }
      />

      <ExampleSwitcher currentExample={selectedExample} examples={examples} route="sign" />

      <form
        className="workspace-grid"
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
                inputFormat,
                keyId: keyIdValue,
                method,
                nonce,
                preset: preset === 'custom' ? '' : preset,
                privateKeyJwkText: privateKeyText,
                rawRequestText,
                requestScheme,
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
        <div className="workspace-form">
          <StepCard
            step="1"
            title="Request input"
            description="Compose the request in structured fields or switch to a raw captured HTTP request when you want to reproduce an exact trace."
          >
            <RequestEditor
              body={body}
              headersText={headersText}
              idPrefix="sign"
              inputFormat={inputFormat}
              method={method}
              onBodyChange={setBody}
              onHeadersTextChange={setHeadersText}
              onInputFormatChange={(nextInputFormat) => {
                if (nextInputFormat === 'raw' && !rawRequestText.trim()) {
                  const serialized = buildRawRequestDraftFromFormInput({
                    body,
                    headersText,
                    method,
                    url
                  })

                  if (serialized) {
                    setRawRequestText(serialized)
                  }
                }

                setInputFormat(nextInputFormat)
              }}
              onMethodChange={setMethod}
              onRawRequestTextChange={setRawRequestText}
              onRequestSchemeChange={setRequestScheme}
              onUrlChange={setUrl}
              rawRequestText={rawRequestText}
              requestScheme={requestScheme}
              url={url}
            />
          </StepCard>

          <StepCard
            step="2"
            title="Signing material"
            description="Use the client key that should own the request signature. The docs app keeps this local to the form and sends it only to the local route handler."
          >
            <div className="field-grid">
              <label className="field">
                <span>Key ID</span>
                <small className="field__hint">This becomes the <code>keyid</code> parameter inside Signature-Input.</small>
                <input value={keyIdValue} onChange={(event) => setKeyIdValue(event.target.value)} />
              </label>
              <div className="inline-note">
                <strong>Signing behavior</strong>
                <p>
                  If the request body is present, the toolkit generates <code>Content-Digest</code>
                  automatically before building the signature base.
                </p>
              </div>
              <label className="field field--wide">
                <span>Private JWK</span>
                <small className="field__hint">Paste an Ed25519 private JWK. This is not persisted beyond the current session state.</small>
                <textarea
                  rows={14}
                  value={privateKeyText}
                  onChange={(event) => setPrivateKeyText(event.target.value)}
                />
              </label>
            </div>
          </StepCard>

          <StepCard
            step="3"
            title="Preset and advanced options"
            description="Choose an Open Payments preset when you want the toolkit to enforce the usual component coverage rules for the request type."
          >
            <div className="field-grid">
              <label className="field">
                <span>Preset policy</span>
                <small className="field__hint">Use custom when you want to provide your own component coverage list.</small>
                <select value={preset} onChange={(event) => setPreset(event.target.value as DocsPresetMode)}>
                  <option value="custom">custom (no preset)</option>
                  {presetOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <details className="details-panel">
              <summary>Advanced signing parameters</summary>
              <div className="field-grid">
                <label className="field">
                  <span>Created</span>
                  <small className="field__hint">Unix timestamp added to the signature parameters.</small>
                  <input value={created} onChange={(event) => setCreated(event.target.value)} />
                </label>
                <label className="field">
                  <span>Expires</span>
                  <small className="field__hint">Optional expiry timestamp for downstream verification policy.</small>
                  <input value={expires} onChange={(event) => setExpires(event.target.value)} />
                </label>
                <label className="field">
                  <span>Nonce</span>
                  <small className="field__hint">Optional nonce parameter.</small>
                  <input value={nonce} onChange={(event) => setNonce(event.target.value)} />
                </label>
                <label className="field">
                  <span>Tag</span>
                  <small className="field__hint">Optional signature tag for multi-purpose request flows.</small>
                  <input value={tag} onChange={(event) => setTag(event.target.value)} />
                </label>
                <label className="field field--wide">
                  <span>Additional covered components</span>
                  <small className="field__hint">One per line. These are appended to the preset defaults or custom component list.</small>
                  <textarea
                    rows={4}
                    value={componentsText}
                    onChange={(event) => setComponentsText(event.target.value)}
                    placeholder="@authority&#10;x-idempotency-key"
                  />
                </label>
              </div>
            </details>
          </StepCard>

          <div className="sticky-submit">
            <div>
              <strong>Generate a signed request</strong>
              <p>The output workspace updates with the digest, signature headers, and canonical base.</p>
            </div>
            <button type="submit" className="primary-button" disabled={isPending}>
              {isPending ? 'Signing…' : 'Sign request'}
            </button>
          </div>
        </div>

        <div className="workspace-output">
          {isPending ? <LoadingPanel /> : null}

          {!isPending && error ? (
            <ResultCard
              title="Unable to sign this request"
              description="The request or signing material needs attention before the signature can be produced."
              tone="danger"
              body={<CodeBlock label="Error" value={error} />}
            />
          ) : null}

          {!isPending && !error && result ? (
            <div className="result-stack">
              <section className="result-summary result-summary--success">
                <div>
                  <p className="eyebrow">Generated output</p>
                  <h2>Request signed successfully.</h2>
                  <p>
                    The request now includes the normalized signing headers and the canonical base
                    used to produce the signature.
                  </p>
                  <div className="result-summary__badges">
                    <StatusBadge tone="success">Signature ready</StatusBadge>
                    <StatusBadge>{result.contentDigest ? 'Digest added' : 'No body digest required'}</StatusBadge>
                    <StatusBadge>{`${result.coveredComponents.length} covered components`}</StatusBadge>
                  </div>
                </div>
                <CopyButton label="Copy all result" value={copyAllResult} />
              </section>

              <ResultCard
                title="Normalized request"
                description="This is the request shape returned from the core after generated signing headers were applied."
                body={
                  <div className="stack">
                    <KeyValueList items={[...formatRequestSummary(result.request)]} />
                    <CodeBlock label="Request JSON" value={formatJson(result.request)} />
                  </div>
                }
              />

              <ResultCard
                title="Generated headers"
                description="Digest and signature headers are split here so you can copy them independently into another client or trace."
                body={
                  <div className="stack">
                    <CodeBlock
                      label="Content-Digest"
                      value={result.contentDigest ?? 'No Content-Digest generated for this request.'}
                    />
                    <CodeBlock label="Signature-Input" value={result.signatureInput} />
                    <CodeBlock label="Signature" value={result.signature} />
                  </div>
                }
              />

              <div className="tool-result-grid">
                <ResultCard
                  title="Covered components"
                  description="These are the request components included in the canonical signature base."
                  body={
                    <CodeBlock
                      label="Covered components"
                      value={joinLines(result.coveredComponents, 'No covered components were returned.')}
                    />
                  }
                />
                <ResultCard
                  title="Canonical signature base"
                  description="Use this when you need to compare exact canonicalization between clients or debug mismatches."
                  body={<CodeBlock label="Signature base" value={result.signatureBase} />}
                />
              </div>
            </div>
          ) : null}

          {!isPending && !error && !result ? (
            <EmptyState
              title="No signed output yet."
              description="Fill in the request and signing material, then run the workflow to inspect the generated digest, signature headers, and canonical base."
              action={<Link className="action-link" href="/examples">Load a bundled request</Link>}
            />
          ) : null}
        </div>
      </form>
    </div>
  )
}
