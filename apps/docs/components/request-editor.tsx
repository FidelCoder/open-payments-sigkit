type RequestEditorProps = {
  body: string
  headersText: string
  idPrefix: string
  method: string
  onBodyChange(value: string): void
  onHeadersTextChange(value: string): void
  onMethodChange(value: string): void
  onUrlChange(value: string): void
  url: string
}

export function RequestEditor({
  body,
  headersText,
  idPrefix,
  method,
  onBodyChange,
  onHeadersTextChange,
  onMethodChange,
  onUrlChange,
  url
}: RequestEditorProps) {
  return (
    <div className="request-editor">
      <label className="field">
        <span>Method</span>
        <input
          id={`${idPrefix}-method`}
          value={method}
          onChange={(event) => onMethodChange(event.target.value)}
          placeholder="POST"
        />
      </label>
      <label className="field">
        <span>URL</span>
        <input
          id={`${idPrefix}-url`}
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="https://your-open-payments-server.example/resource"
        />
      </label>
      <label className="field field--wide">
        <span>Headers</span>
        <textarea
          id={`${idPrefix}-headers`}
          rows={7}
          value={headersText}
          onChange={(event) => onHeadersTextChange(event.target.value)}
          placeholder={'authorization: GNAP access_token="..."\\ncontent-type: application/json'}
        />
      </label>
      <label className="field field--wide">
        <span>Body</span>
        <textarea
          id={`${idPrefix}-body`}
          rows={10}
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          placeholder='{"amount":{"value":"1250","assetCode":"USD","assetScale":2}}'
        />
      </label>
    </div>
  )
}
