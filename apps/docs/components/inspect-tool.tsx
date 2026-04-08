'use client'

import { useState, useTransition } from 'react'
import type { InspectionResult } from '@open-payments-devkit/core'
import { ExampleSwitcher } from './example-switcher'
import { RequestEditor } from './request-editor'
import { ResultCard } from './result-card'
import type { DemoExample, DemoSelectionName } from '../lib/demo-defaults'

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

export function InspectTool({ defaults, examples, selectedExample }: InspectToolProps) {
  const [method, setMethod] = useState(defaults.method)
  const [url, setUrl] = useState(defaults.url)
  const [headersText, setHeadersText] = useState(defaults.headersText)
  const [body, setBody] = useState(defaults.body)
  const [result, setResult] = useState<InspectionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="tool-layout">
      <ExampleSwitcher currentExample={selectedExample} examples={examples} route="inspect" />

      <form
        className="tool-card"
        onSubmit={(event) => {
          event.preventDefault()
          startTransition(() => {
            void fetch('/api/inspect', {
              body: JSON.stringify({
                body,
                headersText,
                method,
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
                setError(
                  caughtError instanceof Error ? caughtError.message : 'Unable to inspect request.'
                )
                setResult(null)
              })
          })
        }}
      >
        <div className="tool-card__header">
          <div>
            <p className="eyebrow">Inspect</p>
            <h2>Expose parsed signature headers and the canonical base line-by-line.</h2>
          </div>
          <button type="submit" disabled={isPending}>
            {isPending ? 'Inspecting…' : 'Inspect request'}
          </button>
        </div>

        <RequestEditor
          body={body}
          headersText={headersText}
          idPrefix="inspect"
          method={method}
          onBodyChange={setBody}
          onHeadersTextChange={setHeadersText}
          onMethodChange={setMethod}
          onUrlChange={setUrl}
          url={url}
        />
      </form>

      {error ? <ResultCard title="Error" tone="danger" body={<pre>{error}</pre>} /> : null}

      {result ? (
        <div className="results-grid">
          <ResultCard title="Covered components" body={<pre>{result.coveredComponents.join('\n') || 'none'}</pre>} />
          <ResultCard title="Selected label" body={<pre>{result.selectedLabel ?? 'none'}</pre>} />
          <ResultCard title="Canonical components" body={<pre>{JSON.stringify(result.canonicalComponents, null, 2)}</pre>} />
          <ResultCard title="Parsed Signature-Input" body={<pre>{JSON.stringify(result.parsedSignatureInputs, null, 2)}</pre>} />
          <ResultCard title="Parsed Signature" body={<pre>{JSON.stringify(result.parsedSignatures, null, 2)}</pre>} />
          {result.signatureBase ? <ResultCard title="Signature base" body={<pre>{result.signatureBase}</pre>} /> : null}
        </div>
      ) : null}
    </div>
  )
}
