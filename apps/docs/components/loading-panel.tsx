export function LoadingPanel() {
  return (
    <div className="loading-panel" aria-live="polite" aria-busy="true">
      <div className="loading-panel__line loading-panel__line--title" />
      <div className="loading-panel__line" />
      <div className="loading-panel__line" />
      <div className="loading-panel__block" />
      <div className="loading-panel__block" />
    </div>
  )
}

