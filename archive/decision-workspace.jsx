import { useState, useEffect, useRef } from "react";

// ─── DESIGN LANGUAGE ──────────────────────────────────────────────────────────
// Aesthetic: Classified document meets war-room terminal
// Font: IBM Plex Mono (monospace intelligence) + Bebas Neue (display headers)
// Color: Deep navy black, amber alerts, electric teal for data, red for threats
// Principle: Every pixel serves a decision. No decoration without information.

const FONT = "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600;700&family=Bebas+Neue&display=swap');";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const ACTIVE_DECISION = {
  id: "DEC-2024-0847",
  title: "Should India join the US-led Semiconductor Alliance (iCET-CHIPS)?",
  deadline: "Cabinet Meeting — 72 hours",
  classification: "TOP SECRET / STRATEGIC",
  owner: "NSA Office",
  status: "AWAITING DECISION",
};

const EVIDENCE_CHAIN = [
  {
    id: "E1",
    claim: "India imports 97% of advanced semiconductors from Taiwan & South Korea",
    type: "FACT",
    confidence: 96,
    sources: [
      { name: "MeitY Import Report Q3 2024", type: "GOV", verified: true },
      { name: "NASSCOM Supply Chain Analysis", type: "INDUSTRY", verified: true },
    ],
    timestamp: "Updated 6hr ago",
    impact: "HIGH",
    supports: "JOIN",
  },
  {
    id: "E2",
    claim: "China has increased chip export controls on 4 materials India depends on",
    type: "INTELLIGENCE",
    confidence: 88,
    sources: [
      { name: "PRC Ministry of Commerce Filing, Feb 28", type: "OFFICIAL", verified: true },
      { name: "Indian Embassy Beijing HUMINT", type: "HUMINT", verified: false },
    ],
    timestamp: "Updated 14hr ago",
    impact: "HIGH",
    supports: "JOIN",
  },
  {
    id: "E3",
    claim: "Joining iCET-CHIPS requires India to restrict chip exports to China (≈$2.1B trade)",
    type: "RISK",
    confidence: 91,
    sources: [
      { name: "iCET Framework Clause 7.4 (Leaked)", type: "LEAKED", verified: false },
      { name: "Commerce Ministry Assessment", type: "GOV", verified: true },
    ],
    timestamp: "Updated 2hr ago",
    impact: "HIGH",
    supports: "CAUTION",
  },
  {
    id: "E4",
    claim: "Taiwan Strait conflict probability: 31–38% within 18 months (3 independent models)",
    type: "FORECAST",
    confidence: 74,
    sources: [
      { name: "RAND Strategic Analysis", type: "THINK TANK", verified: true },
      { name: "Indian Naval Intelligence Model", type: "CLASSIFIED", verified: true },
      { name: "Oxford Economics Geopolitical Index", type: "ACADEMIC", verified: true },
    ],
    timestamp: "Model updated 3 days ago",
    impact: "CRITICAL",
    supports: "JOIN",
  },
  {
    id: "E5",
    claim: "Russia has offered alternative chip supply arrangement (capacity: 8nm max)",
    type: "INTELLIGENCE",
    confidence: 67,
    sources: [
      { name: "Moscow Embassy Cable, Mar 1", type: "DIPLOMATIC", verified: true },
    ],
    timestamp: "Updated 8hr ago",
    impact: "MEDIUM",
    supports: "NEUTRAL",
  },
  {
    id: "E6",
    claim: "India's Micron Sanand fab operational by Q4 2025 — partial domestic supply",
    type: "FACT",
    confidence: 94,
    sources: [
      { name: "Micron Press Release + MeitY confirmation", type: "OFFICIAL", verified: true },
    ],
    timestamp: "Live tracking",
    impact: "MEDIUM",
    supports: "WAIT",
  },
];

const SCENARIOS = [
  {
    id: "S1",
    title: "JOIN NOW",
    subtitle: "Full iCET-CHIPS membership within 30 days",
    probability: null,
    outcomes: [
      { label: "Semiconductor supply security", value: "+68%", dir: "up", color: "#22c55e" },
      { label: "China trade relationship", value: "−34%", dir: "down", color: "#ef4444" },
      { label: "US tech transfer access", value: "+$4.2B", dir: "up", color: "#22c55e" },
      { label: "Strategic autonomy index", value: "−12 pts", dir: "down", color: "#f97316" },
    ],
    risk: "China retaliates via Pakistan proxy + Himalayan pressure",
    riskLevel: "HIGH",
    color: "#22c55e",
  },
  {
    id: "S2",
    title: "NEGOTIATE TERMS",
    subtitle: "Join with carve-out for Russia & strategic autonomy clauses",
    probability: null,
    outcomes: [
      { label: "Semiconductor supply security", value: "+41%", dir: "up", color: "#22c55e" },
      { label: "China trade relationship", value: "−18%", dir: "down", color: "#f97316" },
      { label: "US tech transfer access", value: "+$2.8B", dir: "up", color: "#22c55e" },
      { label: "Strategic autonomy index", value: "+3 pts", dir: "up", color: "#22c55e" },
    ],
    risk: "US rejects carve-out; India excluded from 3nm node access",
    riskLevel: "MEDIUM",
    color: "#f59e0b",
  },
  {
    id: "S3",
    title: "DECLINE & BUILD",
    subtitle: "Accelerate domestic fab + bilateral deals with Japan/Israel",
    probability: null,
    outcomes: [
      { label: "Semiconductor supply security", value: "+12%", dir: "up", color: "#f97316" },
      { label: "China trade relationship", value: "Stable", dir: "neutral", color: "#94a3b8" },
      { label: "US tech transfer access", value: "Delayed", dir: "down", color: "#f97316" },
      { label: "Strategic autonomy index", value: "+18 pts", dir: "up", color: "#22c55e" },
    ],
    risk: "If Taiwan Strait conflict occurs before 2027 — critical chip gap of 4–6 years",
    riskLevel: "CRITICAL",
    color: "#ef4444",
  },
];

const ALERTS = [
  { time: "08:41", severity: "CRITICAL", text: "TSMC halts new India contracts pending iCET decision — window closes in 11 days", new: true },
  { time: "07:22", severity: "HIGH", text: "US Trade Rep meeting rescheduled to Thursday — signals impatience with India's delay", new: true },
  { time: "03:14", severity: "HIGH", text: "Chinese FM calls India's consideration of iCET 'hostile act' — state media amplification", new: false },
  { time: "YESTERDAY", severity: "MEDIUM", text: "South Korea joins iCET — India now only Quad member outside alliance", new: false },
  { time: "MAR 5", severity: "LOW", text: "Micron Sanand construction milestone: Phase 1 cleanroom complete", new: false },
];

const PAST_DECISIONS = [
  { date: "Jan 14 2024", title: "Increased Russian oil imports above 40% cap", outcome: "EFFECTIVE", delta: "Saved ₹18,400 Cr vs Brent spot. No Western sanctions triggered.", color: "#22c55e" },
  { date: "Oct 3 2023", title: "Declined joining US semiconductor export controls", outcome: "MIXED", delta: "Preserved China trade. Lost access to ASML EUV machines for 14 months.", color: "#f59e0b" },
  { date: "Jun 2 2023", title: "Joined QUAD naval exercises (expanded format)", outcome: "EFFECTIVE", delta: "Chinese PLAN vessel incursions in Andaman: −41% over 90 days.", color: "#22c55e" },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Tag({ children, color = "#334155", textColor = "#94a3b8", border }) {
  return (
    <span style={{ fontSize: 9, letterSpacing: 1.5, fontWeight: 700, padding: "2px 7px", background: color, color: textColor, border: border || `1px solid ${textColor}33`, borderRadius: 2, whiteSpace: "nowrap", fontFamily: "IBM Plex Mono" }}>
      {children}
    </span>
  );
}

function ConfidenceBar({ value, height = 3 }) {
  const color = value >= 85 ? "#22c55e" : value >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height, background: "rgba(255,255,255,0.07)", borderRadius: 1 }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 1, transition: "width 0.8s ease" }} />
      </div>
      <span style={{ fontSize: 9, color, fontWeight: 700, minWidth: 28 }}>{value}%</span>
    </div>
  );
}

function Pulse({ color = "#22c55e" }) {
  return (
    <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 0 0 ${color}`, animation: "livepulse 1.8s infinite", flexShrink: 0 }} />
  );
}

function SectionHeader({ label, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <span style={{ fontSize: 10, letterSpacing: 3, color: "#475569", fontWeight: 700 }}>{label}</span>
      {right && <span style={{ fontSize: 9, color: "#334155" }}>{right}</span>}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function DecisionWorkspace() {
  const [activeEvidence, setActiveEvidence] = useState("E1");
  const [activeScenario, setActiveScenario] = useState("S2");
  const [vote, setVote] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [tick, setTick] = useState(0);
  const [annotating, setAnnotating] = useState(false);
  const [annotation, setAnnotation] = useState("");
  const [annotations, setAnnotations] = useState([]);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const selectedEvidence = EVIDENCE_CHAIN.find(e => e.id === activeEvidence);
  const selectedScenario = SCENARIOS.find(s => s.id === activeScenario);

  const joinCount = EVIDENCE_CHAIN.filter(e => e.supports === "JOIN").length;
  const cautionCount = EVIDENCE_CHAIN.filter(e => e.supports === "CAUTION" || e.supports === "WAIT").length;

  return (
    <div style={{ background: "#080d17", minHeight: "100vh", color: "#cbd5e1", fontFamily: "'IBM Plex Mono', monospace", overflow: "hidden", fontSize: 12 }}>
      <style>{`
        ${FONT}
        @keyframes livepulse { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.7); } 70% { box-shadow: 0 0 0 6px rgba(34,197,94,0); } 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); } }
        @keyframes alertpulse { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); } 70% { box-shadow: 0 0 0 8px rgba(239,68,68,0); } 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); } }
        ::-webkit-scrollbar { width: 2px; } ::-webkit-scrollbar-thumb { background: #1e293b; }
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{ borderBottom: "1px solid #0f172a", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#060b13", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 4, color: "#e2e8f0", lineHeight: 1 }}>ARYABHATA</div>
          <div style={{ width: 1, height: 28, background: "#1e293b" }} />
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#475569" }}>DECISION INTELLIGENCE WORKSPACE</div>
            <div style={{ fontSize: 9, color: "#1e293b", letterSpacing: 1 }}>MINISTRY OF EXTERNAL AFFAIRS · CLASSIFIED</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Pulse color="#22c55e" />
            <span style={{ fontSize: 9, letterSpacing: 1, color: "#475569" }}>LIVE · {new Date().toUTCString().slice(0, 25)} UTC</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "4px 10px", border: "1px solid #7f1d1d", background: "#1a0808", borderRadius: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "alertpulse 1.5s infinite", display: "inline-block" }} />
            <span style={{ fontSize: 9, color: "#ef4444", letterSpacing: 1 }}>2 CRITICAL ALERTS</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 280px", height: "calc(100vh - 49px)", overflow: "hidden" }}>

        {/* ══ LEFT: Alert + Past Decisions ══ */}
        <div style={{ borderRight: "1px solid #0f172a", display: "flex", flexDirection: "column", overflowY: "auto", background: "#060b13" }}>
          {/* Active Decision Card */}
          <div style={{ padding: 16, borderBottom: "1px solid #0f172a" }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#475569", marginBottom: 10 }}>ACTIVE DECISION</div>
            <div style={{ fontSize: 9, color: "#64748b", marginBottom: 6, letterSpacing: 1 }}>{ACTIVE_DECISION.id}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.5, marginBottom: 10 }}>{ACTIVE_DECISION.title}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              <Tag textColor="#f59e0b" color="#1c1200">AWAITING DECISION</Tag>
              <Tag textColor="#ef4444" color="#1a0808">72 HR WINDOW</Tag>
            </div>
            <div style={{ padding: "8px 10px", background: "#0d1424", border: "1px solid #1e293b", borderLeft: "2px solid #f59e0b", borderRadius: 2 }}>
              <div style={{ fontSize: 9, color: "#f59e0b", letterSpacing: 1, marginBottom: 3 }}>DEADLINE</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>Cabinet Meeting — Thursday 10:00 IST</div>
            </div>
          </div>

          {/* Evidence balance */}
          <div style={{ padding: 16, borderBottom: "1px solid #0f172a" }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#475569", marginBottom: 10 }}>EVIDENCE BALANCE</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: "#22c55e" }}>SUPPORTS JOINING</span>
                <span style={{ fontSize: 9, color: "#22c55e" }}>{joinCount} signals</span>
              </div>
              <div style={{ height: 4, background: "#0f172a", borderRadius: 2 }}>
                <div style={{ width: `${(joinCount / EVIDENCE_CHAIN.length) * 100}%`, height: "100%", background: "#22c55e", borderRadius: 2 }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: "#f59e0b" }}>CAUTION / WAIT</span>
                <span style={{ fontSize: 9, color: "#f59e0b" }}>{cautionCount} signals</span>
              </div>
              <div style={{ height: 4, background: "#0f172a", borderRadius: 2 }}>
                <div style={{ width: `${(cautionCount / EVIDENCE_CHAIN.length) * 100}%`, height: "100%", background: "#f59e0b", borderRadius: 2 }} />
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div style={{ padding: 16, borderBottom: "1px solid #0f172a" }}>
            <SectionHeader label="SYSTEM ALERTS" right={`${ALERTS.filter(a => a.new).length} NEW`} />
            {ALERTS.map((alert, i) => (
              <div key={i} style={{ marginBottom: 10, padding: "8px 10px", background: "#0a0f1c", border: `1px solid ${alert.severity === "CRITICAL" ? "#7f1d1d" : alert.severity === "HIGH" ? "#431407" : "#1e293b"}`, borderLeft: `2px solid ${alert.severity === "CRITICAL" ? "#ef4444" : alert.severity === "HIGH" ? "#f97316" : "#334155"}`, borderRadius: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {alert.new && <Pulse color={alert.severity === "CRITICAL" ? "#ef4444" : "#f97316"} />}
                    <Tag textColor={alert.severity === "CRITICAL" ? "#ef4444" : alert.severity === "HIGH" ? "#f97316" : "#64748b"} color="transparent">{alert.severity}</Tag>
                  </div>
                  <span style={{ fontSize: 9, color: "#334155" }}>{alert.time}</span>
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.5 }}>{alert.text}</div>
              </div>
            ))}
          </div>

          {/* Past decisions */}
          <div style={{ padding: 16 }}>
            <SectionHeader label="DECISION MEMORY" right="Last 90 days" />
            <div style={{ fontSize: 9, color: "#334155", marginBottom: 12, lineHeight: 1.6 }}>Unlike a chatbot, this system remembers every decision made and whether it worked.</div>
            {PAST_DECISIONS.map((d, i) => (
              <div key={i} style={{ marginBottom: 10, padding: "8px 10px", background: "#0a0f1c", border: "1px solid #0f172a", borderLeft: `2px solid ${d.color}`, borderRadius: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Tag textColor={d.color} color="transparent">{d.outcome}</Tag>
                  <span style={{ fontSize: 9, color: "#334155" }}>{d.date}</span>
                </div>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>{d.title}</div>
                <div style={{ fontSize: 9, color: "#475569", lineHeight: 1.5 }}>{d.delta}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ CENTER: Evidence + Scenario ══ */}
        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column" }}>

          {/* Evidence Chain */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #0f172a" }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: "#475569", marginBottom: 6 }}>EVIDENCE CHAIN — EVERY CLAIM IS SOURCED</div>
              <div style={{ fontSize: 10, color: "#334155", lineHeight: 1.6 }}>
                This is what separates this from a chatbot: every fact below is traceable to a specific document, filing, or intelligence report. Click any claim to inspect its sources.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {EVIDENCE_CHAIN.map((e) => {
                const isActive = activeEvidence === e.id;
                const supportColor = e.supports === "JOIN" ? "#22c55e" : e.supports === "CAUTION" ? "#f59e0b" : e.supports === "WAIT" ? "#f97316" : "#64748b";
                return (
                  <div key={e.id} onClick={() => setActiveEvidence(e.id)}
                    style={{ padding: "12px 14px", background: isActive ? "#0d1a2e" : "#0a0f1c", border: `1px solid ${isActive ? "#1d4ed8" : "#0f172a"}`, borderLeft: `3px solid ${supportColor}`, borderRadius: 3, cursor: "pointer", transition: "all 0.15s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 12 }}>
                      <div style={{ fontSize: 11, color: isActive ? "#e2e8f0" : "#94a3b8", lineHeight: 1.5, flex: 1 }}>{e.claim}</div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                        <Tag textColor={supportColor} color="transparent">{e.supports}</Tag>
                        <Tag textColor={e.impact === "CRITICAL" ? "#ef4444" : e.impact === "HIGH" ? "#f97316" : "#64748b"} color="transparent">{e.impact}</Tag>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <ConfidenceBar value={e.confidence} />
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <Tag textColor="#475569" color="transparent">{e.type}</Tag>
                        <Tag textColor="#334155" color="transparent">{e.sources.length} SOURCES</Tag>
                      </div>
                    </div>

                    {/* Expanded source view */}
                    {isActive && (
                      <div style={{ marginTop: 12, padding: "10px 12px", background: "#060b13", borderRadius: 2, border: "1px solid #0f172a" }}>
                        <div style={{ fontSize: 9, letterSpacing: 2, color: "#334155", marginBottom: 8 }}>SOURCE DOCUMENTS</div>
                        {e.sources.map((src, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < e.sources.length - 1 ? "1px solid #0f172a" : "none" }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <span style={{ fontSize: 11, color: src.verified ? "#22c55e" : "#f59e0b" }}>{src.verified ? "✓" : "!"}</span>
                              <span style={{ fontSize: 10, color: "#64748b" }}>{src.name}</span>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <Tag textColor="#334155" color="transparent">{src.type}</Tag>
                              <Tag textColor={src.verified ? "#22c55e" : "#f59e0b"} color="transparent">{src.verified ? "VERIFIED" : "UNVERIFIED"}</Tag>
                            </div>
                          </div>
                        ))}
                        <div style={{ marginTop: 8, fontSize: 9, color: "#334155" }}>{e.timestamp}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scenario Comparison */}
          <div style={{ padding: "20px 24px" }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: "#475569", marginBottom: 6 }}>SCENARIO MODELING — WHAT HAPPENS IF...</div>
              <div style={{ fontSize: 10, color: "#334155", lineHeight: 1.6 }}>Not descriptions. Quantified outcome projections across 14 economic and strategic indicators.</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {SCENARIOS.map((s) => {
                const isActive = activeScenario === s.id;
                return (
                  <div key={s.id} onClick={() => setActiveScenario(s.id)}
                    style={{ padding: 14, background: isActive ? "#0d1a2e" : "#0a0f1c", border: `1px solid ${isActive ? s.color + "66" : "#0f172a"}`, borderTop: `3px solid ${isActive ? s.color : "#1e293b"}`, borderRadius: 3, cursor: "pointer", transition: "all 0.15s" }}>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 2, color: s.color, marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 9, color: "#475569", marginBottom: 12, lineHeight: 1.5 }}>{s.subtitle}</div>
                    {s.outcomes.map((o, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #0f172a", gap: 8 }}>
                        <span style={{ fontSize: 9, color: "#475569", lineHeight: 1.4 }}>{o.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: o.color, whiteSpace: "nowrap" }}>{o.value}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 12, padding: "8px 10px", background: "#060b13", border: `1px solid ${s.riskLevel === "CRITICAL" ? "#7f1d1d" : s.riskLevel === "HIGH" ? "#431407" : "#1e293b"}`, borderRadius: 2 }}>
                      <div style={{ fontSize: 9, color: s.riskLevel === "CRITICAL" ? "#ef4444" : s.riskLevel === "HIGH" ? "#f97316" : "#64748b", marginBottom: 3, letterSpacing: 1 }}>RISK · {s.riskLevel}</div>
                      <div style={{ fontSize: 9, color: "#475569", lineHeight: 1.5 }}>{s.risk}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══ RIGHT: Action Panel ══ */}
        <div style={{ borderLeft: "1px solid #0f172a", display: "flex", flexDirection: "column", background: "#060b13", overflowY: "auto" }}>

          {/* The key differentiator callout */}
          <div style={{ padding: 14, borderBottom: "1px solid #0f172a", background: "#0a0f1c" }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#334155", marginBottom: 8 }}>WHY NOT JUST ASK CHATGPT?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                ["✗ ChatGPT", "Trained data, no sources, can't monitor, forgets everything, can't take action"],
                ["✓ This System", "Live data · Every claim sourced · Watches for you · Decision memory · Triggers workflows"],
              ].map(([label, desc]) => (
                <div key={label} style={{ padding: "8px 10px", background: label.startsWith("✓") ? "#0d1f0d" : "#1a0808", border: `1px solid ${label.startsWith("✓") ? "#14532d" : "#7f1d1d"}`, borderRadius: 2 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: label.startsWith("✓") ? "#22c55e" : "#ef4444", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 9, color: "#475569", lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Decision Action */}
          <div style={{ padding: 16, borderBottom: "1px solid #0f172a" }}>
            <SectionHeader label="RECORD YOUR DECISION" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {["JOIN NOW", "NEGOTIATE TERMS", "DECLINE & BUILD", "DEFER — NEED MORE INFO"].map(opt => (
                <button key={opt} onClick={() => setVote(opt)}
                  style={{ padding: "9px 12px", background: vote === opt ? "#0d1a2e" : "transparent", border: `1px solid ${vote === opt ? "#1d4ed8" : "#1e293b"}`, color: vote === opt ? "#60a5fa" : "#475569", fontSize: 10, letterSpacing: 1, borderRadius: 2, textAlign: "left", transition: "all 0.15s" }}>
                  {vote === opt ? "● " : "○ "}{opt}
                </button>
              ))}
            </div>
            {vote && (
              <div>
                {!annotating ? (
                  <button onClick={() => setAnnotating(true)} style={{ width: "100%", padding: "8px", background: "transparent", border: "1px dashed #1e293b", color: "#334155", fontSize: 9, letterSpacing: 1, borderRadius: 2, marginBottom: 8 }}>
                    + ADD RATIONALE / ANNOTATION
                  </button>
                ) : (
                  <div style={{ marginBottom: 8 }}>
                    <textarea value={annotation} onChange={e => setAnnotation(e.target.value)}
                      placeholder="Rationale for this decision..."
                      style={{ width: "100%", padding: 8, background: "#0a0f1c", border: "1px solid #1e293b", color: "#94a3b8", fontSize: 10, fontFamily: "IBM Plex Mono", borderRadius: 2, resize: "none", height: 80, outline: "none" }} />
                    <button onClick={() => { setAnnotations(a => [...a, { text: annotation, decision: vote, time: new Date().toTimeString().slice(0, 5) }]); setAnnotation(""); setAnnotating(false); }}
                      style={{ marginTop: 4, padding: "5px 12px", background: "#0d1a2e", border: "1px solid #1e293b", color: "#60a5fa", fontSize: 9, letterSpacing: 1, borderRadius: 2 }}>
                      SAVE →
                    </button>
                  </div>
                )}
                <button style={{ width: "100%", padding: "10px", background: "#1d4ed8", border: "none", color: "#fff", fontSize: 10, letterSpacing: 2, borderRadius: 2, fontWeight: 700 }}>
                  SUBMIT TO CABINET BRIEF →
                </button>
              </div>
            )}
            {annotations.map((a, i) => (
              <div key={i} style={{ marginTop: 8, padding: "8px 10px", background: "#0a0f1c", border: "1px solid #0f172a", borderLeft: "2px solid #334155", borderRadius: 2 }}>
                <div style={{ fontSize: 9, color: "#334155", marginBottom: 4 }}>{a.time} — {a.decision}</div>
                <div style={{ fontSize: 9, color: "#475569" }}>{a.text}</div>
              </div>
            ))}
          </div>

          {/* Watchlist */}
          <div style={{ padding: 16, borderBottom: "1px solid #0f172a" }}>
            <SectionHeader label="MONITORING WATCHLIST" />
            <div style={{ fontSize: 9, color: "#334155", marginBottom: 10, lineHeight: 1.6 }}>These triggers are actively monitored. You'll be alerted the moment any threshold is crossed — no need to check.</div>
            {[
              { label: "TSMC contract window", current: "11 days", threshold: "< 7 days → ALERT", status: "WATCHING" },
              { label: "China retaliatory moves", current: "2 signals", threshold: "> 3 in 48hr → CRITICAL", status: "WATCHING" },
              { label: "US negotiation deadline", current: "72 hrs", threshold: "< 48hr → ESCALATE", status: "WATCHING" },
              { label: "Taiwan Strait vessel activity", current: "Normal", threshold: "PLAN exercises → ALERT", status: "WATCHING" },
            ].map((w, i) => (
              <div key={i} style={{ marginBottom: 8, padding: "8px 10px", background: "#0a0f1c", border: "1px solid #0f172a", borderRadius: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: "#64748b" }}>{w.label}</span>
                  <Pulse color="#22c55e" />
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3, fontWeight: 700 }}>{w.current}</div>
                <div style={{ fontSize: 9, color: "#334155" }}>{w.threshold}</div>
              </div>
            ))}
            <button style={{ width: "100%", marginTop: 6, padding: "7px", background: "transparent", border: "1px dashed #1e293b", color: "#334155", fontSize: 9, letterSpacing: 1, borderRadius: 2 }}>
              + ADD TRIGGER
            </button>
          </div>

          {/* Generate brief */}
          <div style={{ padding: 16 }}>
            <SectionHeader label="GENERATE OUTPUTS" />
            {[
              ["Cabinet Brief (PDF)", "2-page classified brief with evidence + recommendation"],
              ["Scenario Comparison Table", "Side-by-side outcomes for all 3 paths"],
              ["NSA Talking Points", "Bullet points for Thursday's presentation"],
              ["Send to MEA Analyst Team", "Route evidence gaps for further research"],
            ].map(([action, desc]) => (
              <button key={action} style={{ display: "block", width: "100%", marginBottom: 8, padding: "9px 12px", background: "transparent", border: "1px solid #1e293b", color: "#475569", fontSize: 9, letterSpacing: 1, borderRadius: 2, textAlign: "left", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#64748b"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e293b"; e.currentTarget.style.color = "#475569"; }}>
                <div style={{ marginBottom: 3 }}>{action} →</div>
                <div style={{ fontSize: 8, color: "#334155", fontWeight: 400 }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
