export default function EvaluationPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-3xl font-bold mb-4">Evaluation & Methodology</h1>
        <p className="text-muted-foreground mb-6">How to interpret analytics safely and responsibly.</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Denominators Everywhere</h2>
          <p className="text-sm text-muted-foreground">
            All percentages are accompanied by sample size (<span className="font-mono">n</span>). Avoid drawing conclusions when <span className="font-mono">n</span> is small. For motions, we surface <span className="font-mono">n</span> per bucket.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Confidence & Calibration</h2>
          <p className="text-sm text-muted-foreground">
            Motion grant rates include 80% confidence intervals (Wilson). Time-to-ruling shows an empirical survival curve and median with an 80% interval. Calibration (ECE/Brier) is tracked internally and published when denominators are sufficient.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Holdout & Windows</h2>
          <p className="text-sm text-muted-foreground">
            We evaluate on holdout by time (most recent 12 months) and by jurisdiction where applicable. Analytics default to a multi-year window and clearly label the timeframe.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Sources & Provenance</h2>
          <p className="text-sm text-muted-foreground">
            Every object carries sources and a <span className="font-mono">last_updated</span> timestamp. Bulk exports include direct links to public source identifiers when available.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Responsible Use</h2>
          <p className="text-sm text-muted-foreground">
            Analytics reflect historical data and don’t claim causality or legal outcomes. Do not use results for FCRA-governed purposes. Consult counsel for legal decisions.
          </p>
        </section>
      </div>
    </div>
  )
}


