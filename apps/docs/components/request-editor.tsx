export type RequestInputFormat = 'structured' | 'raw'

type RequestEditorProps = {
  body: string
  headersText: string
  idPrefix: string
  inputFormat: RequestInputFormat
  method: string
  onBodyChange(value: string): void
  onHeadersTextChange(value: string): void
  onInputFormatChange(value: RequestInputFormat): void
  onMethodChange(value: string): void
  onRawRequestTextChange(value: string): void
  onRequestSchemeChange(value: string): void
  onUrlChange(value: string): void
  rawRequestText: string
  requestScheme: string
  url: string
}

export function RequestEditor({
  body,
  headersText,
  idPrefix,
  inputFormat,
  method,
  onBodyChange,
  onHeadersTextChange,
  onInputFormatChange,
  onMethodChange,
  onRawRequestTextChange,
  onRequestSchemeChange,
  onUrlChange,
  rawRequestText,
  requestScheme,
  url
}: RequestEditorProps) {
  return (
    <div className="request-editor">
      <div className="request-mode">
        <div>
          <p className="eyebrow">Request input</p>
          <h3>Choose the shape you want to work with.</h3>
          <p>
            Structured fields are fastest for building requests. Raw HTTP is best for working from
            captured traces and reproducible bug reports.
          </p>
        </div>
        <div className="segmented-control" role="tablist" aria-label="Request input format">
          <button
            type="button"
            className={inputFormat === 'structured' ? 'is-active' : undefined}
            onClick={() => onInputFormatChange('structured')}
          >
            Structured fields
          </button>
          <button
            type="button"
            className={inputFormat === 'raw' ? 'is-active' : undefined}
            onClick={() => onInputFormatChange('raw')}
          >
            Raw HTTP request
          </button>
        </div>
      </div>

      {inputFormat === 'raw' ? (
        <div className="field-grid">
          <label className="field">
            <span>Default scheme</span>
            <small className="field__hint">
              Used when the captured request has an origin-form target like <code>/quotes</code>.
            </small>
            <select value={requestScheme} onChange={(event) => onRequestSchemeChange(event.target.value)}>
              <option value="https">https</option>
              <option value="http">http</option>
            </select>
          </label>
          <label className="field field--wide">
            <span>Captured request</span>
            <small className="field__hint">
              Paste a request exactly as it was sent, including the request line, headers, and body.
            </small>
            <textarea
              id={`${idPrefix}-raw-request`}
              rows={18}
              value={rawRequestText}
              onChange={(event) => onRawRequestTextChange(event.target.value)}
              placeholder={`POST /quotes HTTP/1.1
Host: rs.example.com
Authorization: GNAP access_token="..."
Content-Type: application/json

{"amount":{"value":"1250","assetCode":"USD","assetScale":2}}`}
            />
          </label>
        </div>
      ) : (
        <div className="field-grid">
          <label className="field">
            <span>Method</span>
            <small className="field__hint">Use the exact request method that will be signed or verified.</small>
            <input
              id={`${idPrefix}-method`}
              value={method}
              onChange={(event) => onMethodChange(event.target.value)}
              placeholder="POST"
            />
          </label>
          <label className="field">
            <span>URL</span>
            <small className="field__hint">
              Include the full target URI so canonicalization matches the real request.
            </small>
            <input
              id={`${idPrefix}-url`}
              value={url}
              onChange={(event) => onUrlChange(event.target.value)}
              placeholder="https://your-open-payments-server.example/resource"
            />
          </label>
          <label className="field field--wide">
            <span>Headers</span>
            <small className="field__hint">One header per line using the format <code>Name: value</code>.</small>
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
            <small className="field__hint">Leave empty for bodyless requests. Body text is used for digest calculation.</small>
            <textarea
              id={`${idPrefix}-body`}
              rows={10}
              value={body}
              onChange={(event) => onBodyChange(event.target.value)}
              placeholder='{"amount":{"value":"1250","assetCode":"USD","assetScale":2}}'
            />
          </label>
        </div>
      )}
    </div>
  )
}
