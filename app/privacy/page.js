import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — Neptune',
}

const LAST_UPDATED = 'March 10, 2026'

export default function PrivacyPolicy() {
  const s = {
    page: {
      width: '100vw', minHeight: '100vh', background: '#03050c',
      fontFamily: 'var(--font-mono)', color: '#c8e4ff',
    },
    nav: {
      padding: '16px 48px', borderBottom: '1px solid rgba(58,110,200,0.12)',
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'rgba(3,5,12,0.8)', backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 10,
    },
    orb: {
      width: 28, height: 28, borderRadius: '50%', background: '#2558b8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: 16, color: '#c8e4ff',
      boxShadow: '0 0 10px rgba(61,123,212,0.35)', textDecoration: 'none',
    },
    body: {
      maxWidth: 720, margin: '0 auto', padding: '64px 32px 96px',
    },
    h1: {
      fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: 5,
      color: '#ddeeff', marginBottom: 8, lineHeight: 1,
    },
    updated: {
      fontSize: 12, color: '#4a6b8a', letterSpacing: 1, marginBottom: 48,
    },
    h2: {
      fontSize: 13, letterSpacing: 3, color: '#5a8ec4',
      marginTop: 40, marginBottom: 14,
    },
    p: {
      fontSize: 14, color: '#8ab0cc', lineHeight: 1.85, marginBottom: 14,
    },
    li: {
      fontSize: 14, color: '#8ab0cc', lineHeight: 1.85, marginBottom: 6,
      paddingLeft: 16,
    },
    divider: {
      height: 1, background: 'rgba(58,110,200,0.1)', margin: '40px 0',
    },
    a: { color: '#7aaeee', textDecoration: 'none' },
  }

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <Link href="/" style={s.orb}>N</Link>
        <span style={{ fontSize: 13, letterSpacing: 3, color: '#7aaeee', fontWeight: 600 }}>NEPTUNE</span>
        <span style={{ color: '#3a5878', fontSize: 14 }}>/</span>
        <span style={{ fontSize: 13, color: '#6a9aba' }}>Privacy Policy</span>
      </nav>

      <div style={s.body}>
        <div style={s.h1}>PRIVACY POLICY</div>
        <div style={s.updated}>Last updated: {LAST_UPDATED}</div>

        <p style={s.p}>
          Neptune ("we", "our", or "us") is a geopolitical intelligence workspace. This policy explains what data we collect, how we use it, and the choices you have. We keep things simple — we collect only what is necessary to provide the service.
        </p>

        <div style={s.divider} />

        <div style={s.h2}>1. INFORMATION WE COLLECT</div>
        <p style={s.p}><strong style={{ color: '#c8e4ff' }}>Account data:</strong> When you create an account we collect your email address and, optionally, your name. This is managed through Supabase Auth.</p>
        <p style={s.p}><strong style={{ color: '#c8e4ff' }}>Workspace data:</strong> Names, descriptions, domain selections, and data sources you provide when creating workspaces.</p>
        <p style={s.p}><strong style={{ color: '#c8e4ff' }}>Source inputs:</strong> URLs, keywords, and files you add as data sources for processing. Raw input files are deleted immediately after processing is complete.</p>
        <p style={s.p}><strong style={{ color: '#c8e4ff' }}>Processed outputs:</strong> The knowledge graph and context files generated from your sources. Stored either on Neptune's servers or in your own Google Drive, depending on your choice at workspace creation.</p>
        <p style={s.p}><strong style={{ color: '#c8e4ff' }}>Google Drive tokens:</strong> If you connect Google Drive, we store OAuth tokens to write files to a Neptune-specific folder in your Drive. We request only the <code style={{ color: '#7aaeee' }}>drive.file</code> scope — the most limited available. We cannot access any other files in your Drive.</p>

        <div style={s.h2}>2. HOW WE USE YOUR DATA</div>
        <p style={s.p}>We use the data we collect exclusively to provide and improve Neptune. Specifically:</p>
        {[
          'To authenticate you and maintain your session',
          'To process your sources and generate knowledge graphs',
          'To save processed outputs to your chosen storage backend',
          'To display your workspaces and intelligence data within the app',
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, ...s.li }}>
            <span style={{ color: '#3d7bd4', flexShrink: 0 }}>·</span>{item}
          </div>
        ))}
        <p style={{ ...s.p, marginTop: 14 }}>We do not sell your data. We do not use your data to train AI models. We do not share your data with third parties except as described below.</p>

        <div style={s.h2}>3. THIRD-PARTY SERVICES</div>
        <p style={s.p}>Neptune uses the following third-party services to operate:</p>
        {[
          { name: 'Supabase', use: 'Authentication and database storage', link: 'https://supabase.com/privacy' },
          { name: 'Google Drive API', use: 'Optional file storage in your Drive (only if you connect it)', link: 'https://policies.google.com/privacy' },
          { name: 'Vercel', use: 'Hosting and deployment', link: 'https://vercel.com/legal/privacy-policy' },
          { name: 'Groq', use: 'AI-powered node analysis within workspaces', link: 'https://groq.com/privacy-policy/' },
        ].map((s3, i) => (
          <div key={i} style={{ padding: '12px 16px', border: '1px solid rgba(58,110,200,0.1)', marginBottom: 8, fontSize: 14, color: '#8ab0cc', lineHeight: 1.7 }}>
            <strong style={{ color: '#c8e4ff' }}>{s3.name}</strong> — {s3.use}.{' '}
            <a href={s3.link} target="_blank" rel="noopener noreferrer" style={s.a}>Privacy policy ↗</a>
          </div>
        ))}

        <div style={s.h2}>4. DATA RETENTION</div>
        <p style={s.p}>Raw source files (PDFs, scraped content) are deleted immediately after processing. Processed output files (graph.json, context.json) are retained until you delete the workspace. Account data is retained until you delete your account. You can request deletion at any time by contacting us.</p>

        <div style={s.h2}>5. YOUR RIGHTS</div>
        <p style={s.p}>You have the right to access, correct, export, or delete your data at any time. To exercise these rights, contact us at the email below. If you connected Google Drive, you can revoke Neptune's access at any time via your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" style={s.a}>Google Account permissions ↗</a>.</p>

        <div style={s.h2}>6. SECURITY</div>
        <p style={s.p}>All data is transmitted over HTTPS. Access tokens are stored in Supabase with row-level security — only you can access your workspace data. We follow industry-standard practices but no system is completely immune to breach. Please use a strong, unique password.</p>

        <div style={s.h2}>7. CHANGES TO THIS POLICY</div>
        <p style={s.p}>We may update this policy as the product evolves. We will update the "Last updated" date at the top. Continued use of Neptune after changes constitutes acceptance of the updated policy.</p>

        <div style={s.h2}>8. CONTACT</div>
        <p style={s.p}>Questions about this policy? Reach us at <a href="mailto:privacy@neptune-ontology.app" style={s.a}>privacy@neptune-ontology.app</a></p>

        <div style={s.divider} />

        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#4a6b8a' }}>
          <Link href="/terms" style={s.a}>Terms of Service</Link>
          <Link href="/" style={{ ...s.a, color: '#4a6b8a' }}>← Back to Neptune</Link>
        </div>
      </div>
    </div>
  )
}