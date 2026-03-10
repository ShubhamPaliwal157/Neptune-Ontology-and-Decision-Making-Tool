import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — Neptune',
}

const LAST_UPDATED = 'March 10, 2026'

export default function TermsOfService() {
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
        <span style={{ fontSize: 13, color: '#6a9aba' }}>Terms of Service</span>
      </nav>

      <div style={s.body}>
        <div style={s.h1}>TERMS OF SERVICE</div>
        <div style={s.updated}>Last updated: {LAST_UPDATED}</div>

        <p style={s.p}>
          These Terms of Service govern your use of Neptune, a geopolitical intelligence workspace ("the Service"). By creating an account or using Neptune, you agree to these terms. If you do not agree, do not use the Service.
        </p>

        <div style={s.divider} />

        <div style={s.h2}>1. ACCEPTABLE USE</div>
        <p style={s.p}>You may use Neptune for lawful purposes only. You agree not to:</p>
        {[
          'Use the Service to process, store, or distribute illegal content',
          'Attempt to gain unauthorised access to other users\' workspaces or data',
          'Use automated scraping or bots to abuse the Service beyond normal usage',
          'Reverse engineer, decompile, or attempt to extract Neptune\'s source code',
          'Resell or sublicense access to the Service without written permission',
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: '#8ab0cc', lineHeight: 1.85, marginBottom: 6, paddingLeft: 16 }}>
            <span style={{ color: '#c94040', flexShrink: 0 }}>·</span>{item}
          </div>
        ))}

        <div style={s.h2}>2. YOUR DATA</div>
        <p style={s.p}>You retain full ownership of all data you input into Neptune — source URLs, keywords, files, and workspace content. By using the Service you grant Neptune a limited licence to process that data solely for the purpose of providing the Service to you.</p>
        <p style={s.p}>Processed output files (graph.json, context.json) belong to you. If stored on Neptune's servers, they are accessible only to you. If stored in Google Drive, they are in your Drive and under your control.</p>
        <p style={s.p}>Raw source inputs are deleted after processing. We do not retain, analyse, or use your content for any purpose other than generating your requested outputs.</p>

        <div style={s.h2}>3. GOOGLE DRIVE INTEGRATION</div>
        <p style={s.p}>If you choose to connect Google Drive, you authorise Neptune to create and manage files in a Neptune-specific folder using the <code style={{ color: '#7aaeee' }}>drive.file</code> scope. Neptune cannot access, read, or modify any other files in your Drive. You may revoke this access at any time through your Google Account settings, which will disable Drive-based storage for affected workspaces.</p>

        <div style={s.h2}>4. ACCOUNTS</div>
        <p style={s.p}>You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activity that occurs under your account. Notify us immediately if you suspect unauthorised access. We reserve the right to suspend or terminate accounts that violate these terms.</p>

        <div style={s.h2}>5. SERVICE AVAILABILITY</div>
        <p style={s.p}>Neptune is provided on an "as is" and "as available" basis. We make no guarantee of uptime or uninterrupted access. We may modify, suspend, or discontinue the Service at any time with reasonable notice where possible. We are not liable for any loss resulting from Service unavailability.</p>

        <div style={s.h2}>6. LIMITATION OF LIABILITY</div>
        <p style={s.p}>To the maximum extent permitted by law, Neptune and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including loss of data, loss of profits, or loss of intelligence outputs. Our total liability to you for any claim shall not exceed the amount you paid us in the 12 months preceding the claim, or $50, whichever is greater.</p>

        <div style={s.h2}>7. INTELLECTUAL PROPERTY</div>
        <p style={s.p}>The Neptune application, its design, and its underlying code are the intellectual property of the Neptune team. Nothing in these terms transfers any ownership of Neptune's technology to you. Your data remains yours; Neptune's software remains ours.</p>

        <div style={s.h2}>8. CHANGES TO TERMS</div>
        <p style={s.p}>We may update these terms as the Service evolves. We will update the "Last updated" date at the top. Significant changes will be communicated via email where possible. Continued use of Neptune after changes constitutes acceptance of the updated terms.</p>

        <div style={s.h2}>9. GOVERNING LAW</div>
        <p style={s.p}>These terms are governed by applicable law. Any disputes shall be resolved in good faith between the parties before pursuing formal legal proceedings.</p>

        <div style={s.h2}>10. CONTACT</div>
        <p style={s.p}>Questions about these terms? Reach us at <a href="mailto:legal@neptune-ontology.app" style={s.a}>legal@neptune-ontology.app</a></p>

        <div style={s.divider} />

        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#4a6b8a' }}>
          <Link href="/privacy" style={s.a}>Privacy Policy</Link>
          <Link href="/" style={{ ...s.a, color: '#4a6b8a' }}>← Back to Neptune</Link>
        </div>
      </div>
    </div>
  )
}