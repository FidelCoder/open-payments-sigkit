import { ResultCard } from '../components/result-card'

export default function HomePage() {
  return (
    <div className="page-content">
      <section className="overview-grid">
        <article className="overview-card">
          <p className="eyebrow">What it does</p>
          <h2>Focused tooling for Open Payments signing flows.</h2>
          <ul>
            <li>Generate Content-Digest for request bodies.</li>
            <li>Build and inspect Signature-Input members.</li>
            <li>Sign and verify Ed25519 HTTP requests.</li>
            <li>Explain canonicalization and failure modes.</li>
          </ul>
        </article>
        <article className="overview-card">
          <p className="eyebrow">Why it exists</p>
          <h2>Open Payments-specific, not a generic demo.</h2>
          <ul>
            <li>Presets align with grant and token-bound request patterns.</li>
            <li>Verification returns stable codes and actionable context.</li>
            <li>All wrapper surfaces call the same typed core package.</li>
          </ul>
        </article>
      </section>

      <ResultCard
        title="Included routes"
        body={
          <pre>{`/sign\n/verify\n/inspect\n/examples`}</pre>
        }
      />
    </div>
  )
}

