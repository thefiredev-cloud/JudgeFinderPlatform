export default function TrustPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-3xl font-bold mb-4">Trust & Security</h1>
        <p className="text-muted-foreground mb-6">Our security posture and operational transparency.</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Uptime & Status</h2>
          <p className="text-sm text-muted-foreground">System health is available at <span className="font-mono">/api/health</span>. We target 99.9% uptime and operate on Netlify infrastructure.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Subprocessors</h2>
          <ul className="list-disc pl-6 text-sm text-muted-foreground">
            <li>Clerk (authentication)</li>
            <li>Supabase (database)</li>
            <li>Upstash (rate limiting/cache)</li>
            <li>Netlify (hosting)</li>
            <li>Sentry (monitoring)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Data Retention</h2>
          <p className="text-sm text-muted-foreground">We retain public court data for transparency and auditability. User data is minimized and retained per Privacy Policy; export/delete available upon request.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Access & Controls</h2>
          <p className="text-sm text-muted-foreground">SSO/SAML (via Clerk) and role-based access controls are supported. Admin actions are logged and reviewed.</p>
        </section>
      </div>
    </div>
  )
}



