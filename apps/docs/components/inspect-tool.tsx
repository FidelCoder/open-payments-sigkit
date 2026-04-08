'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import type { HttpRequestShape, InspectionResult } from '@open-payments-devkit/core'
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
import type { DemoExample, DemoSelectionName } from '../lib/demo-defaults'
import { formatJson, formatRequestSummary, joinLines } from '../lib/output-formatters'
import { buildRawRequestDraftFromFormInput } from '../lib/request-drafts'
import { useDocsPreference } from '../lib/use-docs-preference'

type InspectToolProps = {
  defaults: {
    body: string
    headersText: string
    method: string
    url: string
  }
  examples: DemoExample[]
  selectedExample: DemoSelectionName
}

type InspectResponse = {
  request: HttpRequestShape
  result: InspectionResult
}

export function InspectTool({ defaults, examples, selectedExample }: InspectToolProps) {
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
  const [payload, setPayload] = useState<InspectResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const copyAllResult = useMemo(() => {
    if (!payload) {
      return ''
    }

    return formatJson(payload)
  }, [payload])

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Inspect"
        title="Inspect canonicalization like a request debugger."
        description="Expose the selected signature label, covered components, parsed headers, and the canonical lines that make up the signature base."
        badges={
          <>
            <StatusBadge>Canonical components</StatusBadge>
            <StatusBadge>Parsed signature headers</StatusBadge>
            <StatusBadge>Raw HTTP compatible</StatusBadge>
          </>
        }
        actions={
          <div className="page-action-group">
            <Link className="action-link" href="/verify">
              Open verify workflow
            </Link>
          </div>
        }
      />

      <ExampleSwitcher currentExample={selectedExample} examples={examples} route="inspect" />

      <form
        className="workspace-grid"
        onSubmit={(event) => {
          event.preventDefault()
          startTransition(() => {
            void fetch('/api/inspect', {
              body: JSON.stringify({
                body,
                headersText,
                inputFormat,
                method,
                rawRequestText,
                requestScheme,
                url
              }),
              headers: {
                'content-type': 'application/json'
              },
              method: 'POST'
            })
              .then(async (response) => {
                const nextPayload = await response.json()

                if (!response.ok) {
                  throw new Error(nextPayload.error)
                }

                setPayload(nextPayload)
                setError(null)
              })
              .catch((caughtError: unknown) => {
                setError(
                  caughtError instanceof Error ? caughtError.message : 'Unable to inspect request.'
                )
                setPayload(null)
              })
          })
        }}
      >
        <div className="workspace-form">
          <StepCard
            step="1"
            title="Request input"
            description="Use the same request shape you would sign or verify. Inspection is most useful when you need to compare exact canonicalization across clients."
          >
            <RequestEditor
              body={body}
              headersText={headersText}
              idPrefix="inspect"
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
            title="Inspection workspace"
            description="Run the inspector to see the selected label, canonical component values, and the signature-base string the toolkit reconstructs from the headers."
          >
            <div className="callout callout--neutral">
              <strong>What inspection exposes</strong>
              <p>
                This view is meant for debugging: it surfaces parsed Signature-Input and Signature
                dictionaries, component-by-component canonicalization, and the final signature base.
              </p>
            </div>
          </StepCard>

          <div className="sticky-submit">
            <div>
              <strong>Inspect request</strong>
              <p>The output workspace will update with parsed headers and canonicalized lines.</p>
            </div>
            <button type="submit" className="primary-button" disabled={isPending}>
              {isPending ? 'Inspecting…' : 'Inspect request'}
            </button>
          </div>
        </div>

        <div className="workspace-output">
          {isPending ? <LoadingPanel /> : null}

          {!isPending && error ? (
            <ResultCard
              title="Unable to inspect this request"
              description="The request needs to be valid enough for the inspector to parse the signature headers."
              tone="danger"
              body={<CodeBlock label="Error" value={error} />}
            />
          ) : null}

          {!isPending && !error && payload ? (
            <div className="result-stack">
              <section className="result-summary result-summary--default">
                <div>
                  <p className="eyebrow">Inspection result</p>
                  <h2>Canonicalization breakdown ready.</h2>
                  <p>
                    Review the parsed signature headers, covered components, and the exact
                    signature base that the toolkit derived from the request.
                  </p>
                  <div className="result-summary__badges">
                    <StatusBadge>{payload.result.selectedLabel ?? 'No selected label'}</StatusBadge>
                    <StatusBadge>{`${payload.result.coveredComponents.length} covered components`}</StatusBadge>
                    <StatusBadge>{payload.result.signatureBase ? 'Signature base available' : 'No signature base'}</StatusBadge>
                  </div>
                </div>
                <CopyButton label="Copy inspection payload" value={copyAllResult} />
              </section>

              <ResultCard
                title="Parsed request"
                description="This is the normalized request shape that the inspector used to reconstruct the signature base."
                body={
                  <div className="stack">
                    <KeyValueList items={[...formatRequestSummary(payload.request)]} />
                    <CodeBlock label="Request JSON" value={formatJson(payload.request)} />
                  </div>
                }
              />

              <div className="tool-result-grid">
                <ResultCard
                  title="Covered components"
                  description="These are the components listed under the selected Signature-Input label."
                  body={
                    <CodeBlock
                      label="Covered components"
                      value={joinLines(payload.result.coveredComponents, 'No covered components were returned.')}
                    />
                  }
                />
                <ResultCard
                  title="Signature headers"
                  description="Both raw headers are shown exactly as they were read from the request."
                  body={
                    <div className="stack">
                      <CodeBlock
                        label="Signature-Input header"
                        value={payload.result.signatureInputHeader ?? 'No Signature-Input header found.'}
                      />
                      <CodeBlock
                        label="Signature header"
                        value={payload.result.signatureHeader ?? 'No Signature header found.'}
                      />
                    </div>
                  }
                />
              </div>

              <ResultCard
                title="Canonicalized values"
                description="Each covered component is expanded into the exact value and canonical line used to build the signature base."
                body={
                  payload.result.canonicalComponents.length > 0 ? (
                    <div className="canonical-components">
                      {payload.result.canonicalComponents.map((component) => (
                        <section key={component.id} className="canonical-component">
                          <div className="canonical-component__header">
                            <strong>{component.id}</strong>
                            <CopyButton label="Copy line" value={component.line} />
                          </div>
                          <CodeBlock label="Canonical value" value={component.value} />
                          <CodeBlock label="Canonical line" value={component.line} />
                        </section>
                      ))}
                    </div>
                  ) : (
                    <CodeBlock label="Canonical components" value="No canonical components were returned." />
                  )
                }
              />

              <ResultCard
                title="Parsed dictionaries"
                description="Use these structured views when comparing label selection and parsed header parameters across different implementations."
                body={
                  <div className="stack">
                    <details className="details-panel" open>
                      <summary>Parsed Signature-Input</summary>
                      <CodeBlock label="Signature-Input JSON" value={formatJson(payload.result.parsedSignatureInputs)} />
                    </details>
                    <details className="details-panel">
                      <summary>Parsed Signature</summary>
                      <CodeBlock label="Signature JSON" value={formatJson(payload.result.parsedSignatures)} />
                    </details>
                  </div>
                }
              />

              {payload.result.signatureBase ? (
                <ResultCard
                  title="Signature base"
                  description="This is the final canonical string reconstructed from the selected label."
                  body={<CodeBlock label="Signature base" value={payload.result.signatureBase} />}
                />
              ) : null}
            </div>
          ) : null}

          {!isPending && !error && !payload ? (
            <EmptyState
              title="No inspection output yet."
              description="Run the inspector to view parsed signature headers, canonical components, and the derived signature base."
              action={<Link className="action-link" href="/examples">Inspect a bundled request</Link>}
            />
          ) : null}
        </div>
      </form>
    </div>
  )
}
