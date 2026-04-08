export default function Loading() {
  return (
    <div className="page-stack">
      <section className="loading-page-card">
        <div className="loading-panel">
          <div className="loading-panel__line loading-panel__line--title" />
          <div className="loading-panel__line" />
          <div className="loading-panel__line" />
        </div>
      </section>

      <div className="tool-result-grid">
        <section className="loading-page-card">
          <div className="loading-panel">
            <div className="loading-panel__block" />
            <div className="loading-panel__block" />
          </div>
        </section>
        <section className="loading-page-card">
          <div className="loading-panel">
            <div className="loading-panel__block" />
            <div className="loading-panel__block" />
          </div>
        </section>
      </div>
    </div>
  )
}
