'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import type { SignedRequestResult } from '@open-payments-devkit/core'
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
        description="Prepare the request, attach the signing key, choose a preset, and inspect the exact digest, signature headers, and canonical base produced by the core library."
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
      <form
        className="workflow-form"
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
        <WorkflowShell
          form={
            <div className="workspace-form">
              <ExampleSwitcher currentExample={selectedExample} examples={examples} route="sign" />

              <WorkflowPanel
                step="1"
                title="Request input"
                description="Compose the request or switch to a raw captured HTTP request when you need to reproduce an exact trace."
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
              </WorkflowPanel>

              <WorkflowPanel
                step="2"
                title="Signing material"
                description="Use the client key that should own the request signature."
              >
                <div className="field-grid">
                  <label className="field">
                    <span>Key ID</span>
                    <small className="field__hint">Used for the <code>keyid</code> parameter in Signature-Input.</small>
                    <input value={keyIdValue} onChange={(event) => setKeyIdValue(event.target.value)} />
                  </label>
                  <div className="inline-note">
                    <strong>Signing behavior</strong>
                    <p>
                      Body-bearing requests get a generated <code>Content-Digest</code> before the
                      signature base is built.
                    </p>
                  </div>
                  <label className="field field--wide">
                    <span>Private JWK</span>
                    <small className="field__hint">Paste an Ed25519 private JWK for local signing.</small>
                    <textarea
                      rows={14}
                      value={privateKeyText}
                      onChange={(event) => setPrivateKeyText(event.target.value)}
                    />
                  </label>
                </div>
              </WorkflowPanel>

              <WorkflowPanel
                step="3"
                title="Preset and advanced options"
                description="Choose a preset when you want the toolkit to apply standard Open Payments coverage rules."
              >
                <div className="field-grid">
                  <label className="field">
                    <span>Preset policy</span>
                    <small className="field__hint">Use custom when you want to define coverage manually.</small>
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
                  title="Advanced signing parameters"
                  description="Created, expires, nonce, tag, and additional covered components."
                >
                  <div className="field-grid">
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
                      <span>Additional covered components</span>
                      <textarea
                        rows={4}
                        value={componentsText}
                        onChange={(event) => setComponentsText(event.target.value)}
                        placeholder="@authority&#10;x-idempotency-key"
                      />
                    </label>
                  </div>
                </CollapsibleBlock>
              </WorkflowPanel>

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
          }
          output={
            <div className="workspace-output">
              {isPending ? <LoadingPanel /> : null}

              {!isPending && error ? (
                <div className="output-stack">
                  <StatusBanner
                    eyebrow="Signing error"
                    title="Unable to sign this request."
                    description="Check the request shape or signing material and try again."
                    tone="danger"
                  />
                  <WorkflowPanel title="Error details" tone="danger">
                    <CodeBlock label="Error" value={error} />
                  </WorkflowPanel>
                </div>
              ) : null}

              {!isPending && !error && result ? (
                <div className="output-stack">
                  <StatusBanner
                    eyebrow="Generated output"
                    title="Request signed successfully."
                    description="The request now includes the normalized signing headers and the canonical base used to produce the signature."
                    tone="success"
                    actions={<CopyButton label="Copy all result" value={copyAllResult} />}
                    badges={
                      <>
                        <StatusBadge tone="success">Signature ready</StatusBadge>
                        <StatusBadge>{result.contentDigest ? 'Digest added' : 'No body digest required'}</StatusBadge>
                        <StatusBadge>{`${result.coveredComponents.length} covered components`}</StatusBadge>
                      </>
                    }
                  />

                  <WorkflowPanel
                    title="Normalized request"
                    description="This is the request shape returned from the core after generated signing headers were applied."
                  >
                    <KeyValueList items={[...formatRequestSummary(result.request)]} />
                    <CollapsibleBlock defaultOpen title="Request JSON">
                      <CodeBlock label="Signed request JSON" value={formatJson(result.request)} />
                    </CollapsibleBlock>
                  </WorkflowPanel>

                  <WorkflowPanel
                    title="Generated signature material"
                    description="Digest and signature headers are grouped here so you can copy only what you need."
                  >
                    <CollapsibleBlock defaultOpen title="Content-Digest">
                      <CodeBlock
                        label="Content-Digest"
                        value={result.contentDigest ?? 'No Content-Digest generated for this request.'}
                      />
                    </CollapsibleBlock>
                    <CollapsibleBlock defaultOpen title="Signature-Input">
                      <CodeBlock label="Signature-Input" value={result.signatureInput} />
                    </CollapsibleBlock>
                    <CollapsibleBlock title="Signature">
                      <CodeBlock label="Signature" value={result.signature} />
                    </CollapsibleBlock>
                  </WorkflowPanel>

                  <WorkflowPanel
                    title="Debug details"
                    description="Use these sections when you need to compare canonicalization between clients or investigate mismatches."
                  >
                    <CollapsibleBlock defaultOpen title="Canonical signature base">
                      <CodeBlock label="Signature base" value={result.signatureBase} />
                    </CollapsibleBlock>
                    <CollapsibleBlock title="Covered components">
                      <CodeBlock
                        label="Covered components"
                        value={joinLines(result.coveredComponents, 'No covered components were returned.')}
                      />
                    </CollapsibleBlock>
                  </WorkflowPanel>
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
          }
        />
      </form>
    </div>
  )
}
