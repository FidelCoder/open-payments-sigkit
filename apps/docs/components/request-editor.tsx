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
      <div className="request-source-switch">
        <div className="field field--wide">
          <span>Request input</span>
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
          <label className="field">
            <span>Default scheme</span>
            <select value={requestScheme} onChange={(event) => onRequestSchemeChange(event.target.value)}>
              <option value="https">https</option>
              <option value="http">http</option>
            </select>
          </label>
        ) : null}
      </div>

      {inputFormat === 'raw' ? (
        <label className="field field--wide">
          <span>Captured request</span>
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
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
