'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import type { HttpRequestShape, VerificationExplanation, VerificationResult } from '@open-payments-devkit/core'
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

type VerificationMaterialMode = 'public-key' | 'jwks' | 'remote-jwks'

type VerifyResponse = {
  explanation: VerificationExplanation
  request: HttpRequestShape
  result: VerificationResult
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
    key: 'docs.verify.preset'
  })
  const [materialMode, setMaterialMode] = useDocsPreference<VerificationMaterialMode>({
    enabled: selectedExample === 'custom',
    initialValue: 'jwks',
    key: 'docs.verify.material-mode'
  })
  const [publicKeyText, setPublicKeyText] = useState(publicKeyJwkText)
  const [jwksValue, setJwksValue] = useState(jwksText)
  const [jwksUrl, setJwksUrl] = useState('')
  const [jwksTimeoutMs, setJwksTimeoutMs] = useState('4000')
  const [requiredComponentsText, setRequiredComponentsText] = useState('')
  const [requireDigestForBody, setRequireDigestForBody] = useDocsPreference<boolean>({
    enabled: selectedExample === 'custom',
    initialValue: true,
    key: 'docs.verify.require-digest',
    parse: (value) => value === 'true'
  })
  const [responsePayload, setResponsePayload] = useState<VerifyResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const copyAllResult = useMemo(() => {
    if (!responsePayload) {
      return ''
    }

    return formatJson(responsePayload)
  }, [responsePayload])

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Verify"
        title="Verify requests with a debugger-friendly workflow."
        description="Supply a signed request, choose the verification material, and see a clear success state or a typed failure explanation with the reconstructed signature base."
        badges={
          <>
            <StatusBadge>Typed failure codes</StatusBadge>
            <StatusBadge>Signature-base reconstruction</StatusBadge>
            <StatusBadge>Remote JWKS optional</StatusBadge>
          </>
        }
        actions={
          <div className="page-action-group">
            <Link className="action-link" href="/examples">
              Load a reference vector
            </Link>
          </div>
        }
      />

      <ExampleSwitcher currentExample={selectedExample} examples={examples} route="verify" />

      <form
        className="workspace-grid"
        onSubmit={(event) => {
          event.preventDefault()
          startTransition(() => {
            void fetch('/api/verify', {
              body: JSON.stringify({
                body,
                headersText,
                inputFormat,
                jwksText: materialMode === 'jwks' ? jwksValue : '',
                jwksTimeoutMs: materialMode === 'remote-jwks' ? jwksTimeoutMs : '',
                jwksUrl: materialMode === 'remote-jwks' ? jwksUrl : '',
                method,
                preset: preset === 'custom' ? '' : preset,
                publicKeyJwkText: materialMode === 'public-key' ? publicKeyText : '',
                rawRequestText,
                requireDigestForBody,
                requiredComponentsText,
                requestScheme,
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

                setResponsePayload(payload)
                setError(null)
              })
              .catch((caughtError: unknown) => {
                setError(
                  caughtError instanceof Error ? caughtError.message : 'Unable to verify request.'
                )
                setResponsePayload(null)
              })
          })
        }}
      >
        <div className="workspace-form">
          <StepCard
            step="1"
            title="Request input"
            description="Verify either structured request fields or a raw captured HTTP trace. The right workspace will show the reconstructed verification context."
          >
            <RequestEditor
              body={body}
              headersText={headersText}
              idPrefix="verify"
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
            title="Verification material"
            description="Choose whether verification should resolve against a single public JWK, a local JWKS document, or an opt-in remote JWKS endpoint."
          >
            <div className="field-grid">
              <div className="field field--wide">
                <span>Verification source</span>
                <small className="field__hint">Local key material stays deterministic. Remote JWKS is explicit and only used when you choose it.</small>
                <div className="segmented-control" role="tablist" aria-label="Verification material source">
                  <button
                    type="button"
                    className={materialMode === 'public-key' ? 'is-active' : undefined}
                    onClick={() => setMaterialMode('public-key')}
                  >
                    Public JWK
                  </button>
                  <button
                    type="button"
                    className={materialMode === 'jwks' ? 'is-active' : undefined}
                    onClick={() => setMaterialMode('jwks')}
                  >
                    Local JWKS
                  </button>
                  <button
                    type="button"
                    className={materialMode === 'remote-jwks' ? 'is-active' : undefined}
                    onClick={() => setMaterialMode('remote-jwks')}
                  >
                    Remote JWKS
                  </button>
                </div>
              </div>

              {materialMode === 'public-key' ? (
                <label className="field field--wide">
                  <span>Public JWK</span>
                  <small className="field__hint">Paste the Ed25519 public JWK bound to the client key.</small>
                  <textarea
                    rows={12}
                    value={publicKeyText}
                    onChange={(event) => setPublicKeyText(event.target.value)}
                  />
                </label>
              ) : null}

              {materialMode === 'jwks' ? (
                <label className="field field--wide">
                  <span>JWKS</span>
                  <small className="field__hint">Provide a local JWKS document when the verification key must be selected by <code>keyid</code>.</small>
                  <textarea
                    rows={12}
                    value={jwksValue}
                    onChange={(event) => setJwksValue(event.target.value)}
                  />
                </label>
              ) : null}

              {materialMode === 'remote-jwks' ? (
                <>
                  <label className="field">
                    <span>Remote JWKS URL</span>
                    <small className="field__hint">Fetched only when this mode is selected.</small>
                    <input
                      value={jwksUrl}
                      onChange={(event) => setJwksUrl(event.target.value)}
                      placeholder="https://auth.example/.well-known/jwks.json"
                    />
                  </label>
                  <label className="field">
                    <span>Timeout (ms)</span>
                    <small className="field__hint">Keep this short so verification failures stay obvious and fast.</small>
                    <input
                      value={jwksTimeoutMs}
                      onChange={(event) => setJwksTimeoutMs(event.target.value)}
                    />
                  </label>
                </>
              ) : null}
            </div>
          </StepCard>

          <StepCard
            step="3"
            title="Policy and verification options"
            description="Use a preset when you want the toolkit to enforce expected Open Payments request coverage such as authorization headers or digest requirements."
          >
            <div className="field-grid">
              <label className="field">
                <span>Preset policy</span>
                <small className="field__hint">Set this to custom if you want to verify against only the explicit options below.</small>
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
              <summary>Advanced verification options</summary>
              <div className="field-grid">
                <label className="field field--checkbox">
                  <span>Require Content-Digest for body</span>
                  <small className="field__hint">Disable this only when you intentionally want looser verification.</small>
                  <input
                    checked={requireDigestForBody}
                    type="checkbox"
                    onChange={(event) => setRequireDigestForBody(event.target.checked)}
                  />
                </label>
                <label className="field field--wide">
                  <span>Required components</span>
                  <small className="field__hint">Provide one per line when you want to assert exact coverage beyond the preset defaults.</small>
                  <textarea
                    rows={4}
                    value={requiredComponentsText}
                    onChange={(event) => setRequiredComponentsText(event.target.value)}
                    placeholder="authorization&#10;content-digest"
                  />
                </label>
              </div>
            </details>
          </StepCard>

          <div className="sticky-submit">
            <div>
              <strong>Run verification</strong>
              <p>The output workspace highlights the typed result first, then the exact data you need for debugging.</p>
            </div>
            <button type="submit" className="primary-button" disabled={isPending}>
              {isPending ? 'Verifying…' : 'Verify request'}
            </button>
          </div>
        </div>

        <div className="workspace-output">
          {isPending ? <LoadingPanel /> : null}

          {!isPending && error ? (
            <ResultCard
              title="Unable to verify this request"
              description="The request, key material, or verification options need attention before the check can complete."
              tone="danger"
              body={<CodeBlock label="Error" value={error} />}
            />
          ) : null}

          {!isPending && !error && responsePayload ? (
            <div className="result-stack">
              <section
                className={
                  responsePayload.result.ok
                    ? 'result-summary result-summary--success'
                    : 'result-summary result-summary--danger'
                }
              >
                <div>
                  <p className="eyebrow">Verification result</p>
                  <h2>
                    {responsePayload.result.ok
                      ? 'Signature verified successfully.'
                      : responsePayload.explanation.title}
                  </h2>
                  <p>{responsePayload.result.message}</p>
                  <div className="result-summary__badges">
                    <StatusBadge tone={responsePayload.result.ok ? 'success' : 'danger'}>
                      {responsePayload.result.code}
                    </StatusBadge>
                    <StatusBadge>{materialMode === 'remote-jwks' ? 'Remote JWKS' : materialMode === 'jwks' ? 'Local JWKS' : 'Public JWK'}</StatusBadge>
                    {responsePayload.result.coveredComponents?.length ? (
                      <StatusBadge>{`${responsePayload.result.coveredComponents.length} covered components`}</StatusBadge>
                    ) : null}
                  </div>
                </div>
                <CopyButton label="Copy all result" value={copyAllResult} />
              </section>

              <ResultCard
                title="Parsed request"
                description="This is the normalized request shape that was actually handed to the verification core."
                body={
                  <div className="stack">
                    <KeyValueList items={[...formatRequestSummary(responsePayload.request)]} />
                    <CodeBlock label="Request JSON" value={formatJson(responsePayload.request)} />
                  </div>
                }
              />

              <ResultCard
                title="Explanation and next steps"
                description="The verifier returns a stable code, a human-readable explanation, and concrete guidance for remediation."
                body={
                  <div className="stack">
                    <div className="callout callout--neutral">
                      <strong>{responsePayload.explanation.title}</strong>
                      <p>{responsePayload.explanation.summary}</p>
                    </div>
                    <CodeBlock
                      label="Recommended next steps"
                      value={joinLines(responsePayload.explanation.nextSteps, 'No next steps were returned.')}
                    />
                  </div>
                }
              />

              <div className="tool-result-grid">
                <ResultCard
                  title="Covered components"
                  description="These are the components the verifier determined were covered by the selected signature label."
                  body={
                    <CodeBlock
                      label="Covered components"
                      value={joinLines(
                        responsePayload.result.coveredComponents,
                        'No covered components were returned.'
                      )}
                    />
                  }
                />
                <ResultCard
                  title="Verification details"
                  description="Structured details help compare policy mismatches, request component mismatches, or lookup failures."
                  body={
                    <CodeBlock
                      label="Details JSON"
                      value={
                        responsePayload.result.details
                          ? formatJson(responsePayload.result.details)
                          : 'No additional detail payload was returned.'
                      }
                    />
                  }
                />
              </div>

              {responsePayload.result.signatureBase ? (
                <ResultCard
                  title="Reconstructed signature base"
                  description="Use this to compare the exact canonical lines the verifier used against another client or trace."
                  body={<CodeBlock label="Signature base" value={responsePayload.result.signatureBase} />}
                />
              ) : null}
            </div>
          ) : null}

          {!isPending && !error && !responsePayload ? (
            <EmptyState
              title="No verification result yet."
              description="Provide a signed request and matching verification material to see the result code, explanation, and reconstructed signature base."
              action={<Link className="action-link" href="/examples">Use a verified example</Link>}
            />
          ) : null}
        </div>
      </form>
    </div>
  )
}
