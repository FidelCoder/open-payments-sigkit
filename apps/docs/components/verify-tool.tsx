'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import type { HttpRequestShape, VerificationExplanation, VerificationResult } from '@open-payments-devkit/core'
import { CollapsibleBlock } from './collapsible-block'
import { CodeBlock } from './code-block'
import { CopyButton } from './copy-button'
import { EmptyState } from './empty-state'
import { ExampleSwitcher } from './example-switcher'
import { KeyValueList } from './key-value-list'
import { LoadingPanel } from './loading-panel'
import { PageHeader } from './page-header'
import { RequestEditor, type RequestInputFormat } from './request-editor'
import { StatusBadge } from './status-badge'
import { StatusBanner } from './status-banner'
import { WorkflowPanel } from './workflow-panel'
import { WorkflowShell } from './workflow-shell'
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
        description="Supply a signed request, choose the verification material, and inspect a clear pass or fail state with the reconstructed signature base."
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
        className="workflow-form"
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
        <WorkflowShell
          form={
            <div className="workspace-form">
              <WorkflowPanel
                step="1"
                title="Request input"
                description="Verify either structured request fields or a raw captured HTTP trace."
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
              </WorkflowPanel>

              <WorkflowPanel
                step="2"
                title="Verification material"
                description="Choose whether verification should resolve against a single public JWK, a local JWKS document, or an opt-in remote JWKS endpoint."
              >
                <div className="field-grid">
                  <div className="field field--wide">
                    <span>Verification source</span>
                    <small className="field__hint">Local key material stays deterministic. Remote JWKS is only used when you choose it.</small>
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
                        <input
                          value={jwksUrl}
                          onChange={(event) => setJwksUrl(event.target.value)}
                          placeholder="https://auth.example/.well-known/jwks.json"
                        />
                      </label>
                      <label className="field">
                        <span>Timeout (ms)</span>
                        <input
                          value={jwksTimeoutMs}
                          onChange={(event) => setJwksTimeoutMs(event.target.value)}
                        />
                      </label>
                    </>
                  ) : null}
                </div>
              </WorkflowPanel>

              <WorkflowPanel
                step="3"
                title="Policy and verification options"
                description="Use a preset when you want the toolkit to enforce expected Open Payments coverage rules."
              >
                <div className="field-grid">
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
                </div>

                <CollapsibleBlock
                  title="Advanced verification options"
                  description="Digest requirements and explicit required components."
                >
                  <div className="field-grid">
                    <label className="field field--checkbox">
                      <span>Require Content-Digest for body</span>
                      <small className="field__hint">Disable only when you intentionally want looser verification.</small>
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
                  </div>
                </CollapsibleBlock>
              </WorkflowPanel>

              <div className="sticky-submit">
                <div>
                  <strong>Run verification</strong>
                  <p>The output workspace highlights the result first, then the exact data you need for debugging.</p>
                </div>
                <button type="submit" className="primary-button" disabled={isPending}>
                  {isPending ? 'Verifying…' : 'Verify request'}
                </button>
              </div>
            </div>
          }
          output={
            <div className="workspace-output">
              {isPending ? <LoadingPanel /> : null}

              {!isPending && error ? (
                <div className="output-stack">
                  <StatusBanner
                    eyebrow="Verification error"
                    title="Unable to verify this request."
                    description="The request, key material, or verification options need attention before the check can complete."
                    tone="danger"
                  />
                  <WorkflowPanel title="Error details" tone="danger">
                    <CodeBlock label="Error" value={error} />
                  </WorkflowPanel>
                </div>
              ) : null}

              {!isPending && !error && responsePayload ? (
                <div className="output-stack">
                  <StatusBanner
                    eyebrow="Verification result"
                    title={
                      responsePayload.result.ok
                        ? 'Signature verified successfully.'
                        : responsePayload.explanation.title
                    }
                    description={responsePayload.result.message}
                    tone={responsePayload.result.ok ? 'success' : 'danger'}
                    actions={<CopyButton label="Copy all result" value={copyAllResult} />}
                    badges={
                      <>
                        <StatusBadge tone={responsePayload.result.ok ? 'success' : 'danger'}>
                          {responsePayload.result.code}
                        </StatusBadge>
                        <StatusBadge>
                          {materialMode === 'remote-jwks'
                            ? 'Remote JWKS'
                            : materialMode === 'jwks'
                              ? 'Local JWKS'
                              : 'Public JWK'}
                        </StatusBadge>
                        {responsePayload.result.coveredComponents?.length ? (
                          <StatusBadge>{`${responsePayload.result.coveredComponents.length} covered components`}</StatusBadge>
                        ) : null}
                      </>
                    }
                  />

                  <WorkflowPanel
                    title="Parsed request"
                    description="This is the normalized request shape that was actually handed to the verification core."
                  >
                    <KeyValueList items={[...formatRequestSummary(responsePayload.request)]} />
                    <CollapsibleBlock defaultOpen title="Request JSON">
                      <CodeBlock label="Request JSON" value={formatJson(responsePayload.request)} />
                    </CollapsibleBlock>
                  </WorkflowPanel>

                  <WorkflowPanel
                    title="Explanation"
                    description="The verifier returns a stable code, a readable explanation, and concrete remediation guidance."
                  >
                    <div className="callout callout--neutral">
                      <strong>{responsePayload.explanation.title}</strong>
                      <p>{responsePayload.explanation.summary}</p>
                    </div>
                    <CollapsibleBlock defaultOpen title="Recommended next steps">
                      <CodeBlock
                        label="Recommended next steps"
                        value={joinLines(responsePayload.explanation.nextSteps, 'No next steps were returned.')}
                      />
                    </CollapsibleBlock>
                  </WorkflowPanel>

                  <WorkflowPanel
                    title="Verification traces"
                    description="Open the sections you need when comparing policy mismatches, lookup failures, or signature-base differences."
                  >
                    {responsePayload.result.signatureBase ? (
                      <CollapsibleBlock
                        defaultOpen={!responsePayload.result.ok}
                        title="Reconstructed signature base"
                      >
                        <CodeBlock label="Signature base" value={responsePayload.result.signatureBase} />
                      </CollapsibleBlock>
                    ) : null}
                    <CollapsibleBlock title="Covered components">
                      <CodeBlock
                        label="Covered components"
                        value={joinLines(
                          responsePayload.result.coveredComponents,
                          'No covered components were returned.'
                        )}
                      />
                    </CollapsibleBlock>
                    <CollapsibleBlock title="Verification details">
                      <CodeBlock
                        label="Details JSON"
                        value={
                          responsePayload.result.details
                            ? formatJson(responsePayload.result.details)
                            : 'No additional detail payload was returned.'
                        }
                      />
                    </CollapsibleBlock>
                  </WorkflowPanel>
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
          }
        />
      </form>
    </div>
  )
}
