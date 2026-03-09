import { useState, useEffect, useRef, useCallback } from "react";

const NODES = [
  { id: "india", label: "India", type: "nation", x: 0, y: 0, z: 0, size: 22, color: "#FF9933" },
  { id: "china", label: "China", type: "nation", x: 180, y: -60, z: 40, size: 20, color: "#DE2910" },
  { id: "usa", label: "USA", type: "nation", x: -200, y: -80, z: -30, size: 20, color: "#3C8DBC" },
  { id: "russia", label: "Russia", type: "nation", x: 60, y: -180, z: 60, size: 18, color: "#8B0000" },
  { id: "opec", label: "OPEC", type: "org", x: 100, y: 140, z: -20, size: 16, color: "#F4C430" },
  { id: "oil", label: "Oil Supply", type: "resource", x: 60, y: 200, z: 10, size: 14, color: "#8B6914" },
  { id: "semiconductor", label: "Semiconductors", type: "resource", x: 240, y: 60, z: -50, size: 15, color: "#00FFCC" },
  { id: "taiwan", label: "Taiwan", type: "nation", x: 220, y: 20, z: 20, size: 14, color: "#FE0000" },
  { id: "pakistan", label: "Pakistan", type: "nation", x: -80, y: 100, z: 80, size: 14, color: "#01411C" },
  { id: "climate", label: "Climate Crisis", type: "event", x: -160, y: 160, z: -40, size: 16, color: "#39FF14" },
  { id: "drought", label: "India Drought", type: "event", x: -100, y: 220, z: 20, size: 12, color: "#7CFC00" },
  { id: "brics", label: "BRICS", type: "org", x: -20, y: -220, z: -60, size: 15, color: "#FFD700" },
  { id: "quad", label: "QUAD", type: "org", x: -180, y: -160, z: 20, size: 14, color: "#4169E1" },
  { id: "nato", label: "NATO", type: "org", x: -240, y: -60, z: -60, size: 16, color: "#003087" },
  { id: "rupee", label: "INR / Trade", type: "economic", x: 40, y: 80, z: -80, size: 13, color: "#FFB347" },
  { id: "cyberattack", label: "Cyber Ops", type: "threat", x: 160, y: -140, z: 80, size: 13, color: "#FF4500" },
  { id: "isro", label: "ISRO / Space", type: "tech", x: -120, y: -20, z: -100, size: 13, color: "#00BFFF" },
  { id: "ai_race", label: "AI Race", type: "tech", x: 120, y: -80, z: -120, size: 14, color: "#9D00FF" },
];

const EDGES = [
  { from: "india", to: "china", label: "BORDER DISPUTE", strength: 0.9, color: "#FF4040" },
  { from: "india", to: "usa", label: "STRATEGIC PARTNER", strength: 0.7, color: "#4488FF" },
  { from: "india", to: "russia", label: "ARMS SUPPLIER", strength: 0.8, color: "#FF8800" },
  { from: "india", to: "opec", label: "OIL DEPENDENT", strength: 0.7, color: "#F4C430" },
  { from: "india", to: "brics", label: "MEMBER", strength: 0.6, color: "#FFD700" },
  { from: "india", to: "quad", label: "MEMBER", strength: 0.7, color: "#4169E1" },
  { from: "india", to: "semiconductor", label: "SUPPLY CHAIN RISK", strength: 0.8, color: "#00FFCC" },
  { from: "india", to: "climate", label: "VULNERABLE", strength: 0.85, color: "#39FF14" },
  { from: "india", to: "pakistan", label: "CONFLICT ZONE", strength: 0.95, color: "#FF0000" },
  { from: "india", to: "isro", label: "OWNS", strength: 0.5, color: "#00BFFF" },
  { from: "china", to: "taiwan", label: "CLAIMS", strength: 0.95, color: "#DE2910" },
  { from: "china", to: "russia", label: "ALLIED", strength: 0.7, color: "#AA2222" },
  { from: "china", to: "semiconductor", label: "DOMINATES", strength: 0.8, color: "#00FFCC" },
  { from: "usa", to: "nato", label: "LEADS", strength: 0.9, color: "#003087" },
  { from: "usa", to: "quad", label: "LEADS", strength: 0.8, color: "#4169E1" },
  { from: "usa", to: "ai_race", label: "COMPETING", strength: 0.85, color: "#9D00FF" },
  { from: "china", to: "ai_race", label: "COMPETING", strength: 0.85, color: "#9D00FF" },
  { from: "opec", to: "oil", label: "CONTROLS", strength: 0.9, color: "#F4C430" },
  { from: "oil", to: "india", label: "IMPORTS", strength: 0.8, color: "#8B6914" },
  { from: "climate", to: "drought", label: "CAUSES", strength: 0.75, color: "#39FF14" },
  { from: "drought", to: "india", label: "THREATENS", strength: 0.7, color: "#7CFC00" },
  { from: "cyberattack", to: "india", label: "TARGETS", strength: 0.6, color: "#FF4500" },
  { from: "china", to: "cyberattack", label: "ATTRIBUTED", strength: 0.55, color: "#FF4500" },
  { from: "india", to: "rupee", label: "CURRENCY", strength: 0.5, color: "#FFB347" },
  { from: "brics", to: "rupee", label: "TRADE BASKET", strength: 0.6, color: "#FFB347" },
  { from: "pakistan", to: "china", label: "CPEC ALLY", strength: 0.8, color: "#55AA55" },
];

const FEED = [
  { id: 1, time: "02:41:07", type: "THREAT", domain: "defense", text: "PLA naval vessels detected near Andaman Islands — 3 destroyers, AIS disabled", confidence: 87, node: "china" },
  { id: 2, time: "02:38:52", type: "ECONOMIC", domain: "economics", text: "Brent crude +4.2% after OPEC+ emergency meeting; India import cost impact: ₹28,000 Cr/month", confidence: 96, node: "oil" },
  { id: 3, time: "02:31:18", type: "SIGNAL", domain: "tech", text: "China files 847 new semiconductor patents this week. India: 12. Gap widening.", confidence: 94, node: "semiconductor" },
  { id: 4, time: "02:28:03", type: "DIPLOMATIC", domain: "geopolitics", text: "US Deputy SecState arrives New Delhi — agenda: QUAD expansion, AI governance framework", confidence: 91, node: "quad" },
  { id: 5, time: "02:19:44", type: "CLIMATE", domain: "climate", text: "IMD: Monsoon deficit 23% in Kharif belt. Agricultural output risk: HIGH. 3 states in red.", confidence: 88, node: "drought" },
  { id: 6, time: "02:14:22", type: "CYBER", domain: "tech", text: "APT41 lateral movement detected in 2 Indian PSU networks. Pattern matches 2022 AIIMS attack.", confidence: 79, node: "cyberattack" },
  { id: 7, time: "02:09:11", type: "ECONOMIC", domain: "economics", text: "INR hits 84.6/USD. RBI intervention signals. FII outflows: $2.1B this week.", confidence: 97, node: "rupee" },
  { id: 8, time: "01:58:37", type: "GEOPOLITICAL", domain: "geopolitics", text: "Pakistan army chief meets ISI + Chinese ambassador — 4hr closed session, Islamabad", confidence: 71, node: "pakistan" },
  { id: 9, time: "01:47:20", type: "SPACE", domain: "tech", text: "ISRO Gaganyaan abort test successful. India 3rd nation with crewed abort capability.", confidence: 99, node: "isro" },
  { id: 10, time: "01:31:05", type: "SIGNAL", domain: "geopolitics", text: "Russia redirects 40% of Arctic LNG to India after EU sanctions. Price: 14% below market.", confidence: 83, node: "russia" },
];

const INSIGHTS = [
  { icon: "⚡", priority: "CRITICAL", title: "Energy Chokepoint Risk", text: "India's oil dependency on OPEC + Russia creates dual exposure. If Hormuz disrupted while Russia sanctions tighten, 68-day strategic reserve activates.", action: "View Scenario" },
  { icon: "🔴", priority: "HIGH", title: "Two-Front Pressure Building", text: "China naval + Pakistan diplomatic activity spiked simultaneously in 72h window. Historical pattern match: 2020 Galwan buildup (84% similarity).", action: "Analyze Pattern" },
  { icon: "🟡", priority: "MEDIUM", title: "Semiconductor Dependency", text: "India imports 97% of advanced chips. Taiwan Strait tension probability: 34% in 18 months. CHIPS Act alignment with US needed within 6 months.", action: "Policy Options" },
  { icon: "🌍", priority: "OPPORTUNITY", title: "BRICS De-dollarization Window", text: "INR trade basket gaining traction. 14 nations expressed interest in INR settlement. First-mover window: 8-14 months before China captures.", action: "Strategy Brief" },
];

function useAnimationFrame(callback) {
  const reqRef = useRef();
  const prevRef = useRef();
  const animate = useCallback(time => {
    if (prevRef.current !== undefined) callback(time - prevRef.current);
    prevRef.current = time;
    reqRef.current = requestAnimationFrame(animate);
  }, [callback]);
  useEffect(() => {
    reqRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(reqRef.current);
  }, [animate]);
}

function project3D(x, y, z, rotX, rotY, width, height) {
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const y1 = y * cosX - z * sinX;
  const z1 = y * sinX + z * cosX;
  const x2 = x * cosY + z1 * sinY;
  const z2 = -x * sinY + z1 * cosY;
  const fov = 600;
  const scale = fov / (fov + z2 + 200);
  return { sx: width / 2 + x2 * scale, sy: height / 2 + y1 * scale, scale, z: z2 };
}

export default function OntologyEngine() {
  const canvasRef = useRef(null);
  const [rotX, setRotX] = useState(0.3);
  const [rotY, setRotY] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState("india");
  const [activeTab, setActiveTab] = useState("insights");
  const [feedItems, setFeedItems] = useState(FEED.slice(0, 5));
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [glowPulse, setGlowPulse] = useState(0);
  const rotRef = useRef(rotY);
  const mouseRef = useRef({ down: false, lastX: 0, lastY: 0 });

  useAnimationFrame((delta) => {
    if (autoRotate) {
      rotRef.current += delta * 0.0002;
      setRotY(rotRef.current);
    }
    setGlowPulse(p => p + delta * 0.003);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setFeedItems(prev => {
        const next = FEED[Math.floor(Math.random() * FEED.length)];
        return [{ ...next, time: new Date().toTimeString().slice(0, 8), id: Date.now() }, ...prev.slice(0, 7)];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const pulse = Math.sin(glowPulse) * 0.3 + 0.7;
    const projected = NODES.map(n => ({ ...n, ...project3D(n.x, n.y, n.z, rotX, rotY, W, H) }));
    projected.sort((a, b) => a.z - b.z);

    // Draw edges
    EDGES.forEach(edge => {
      const from = projected.find(n => n.id === edge.from);
      const to = projected.find(n => n.id === edge.to);
      if (!from || !to) return;
      const isActive = selectedNode === edge.from || selectedNode === edge.to;
      const alpha = isActive ? 0.8 : 0.18;
      ctx.beginPath();
      ctx.moveTo(from.sx, from.sy);
      ctx.lineTo(to.sx, to.sy);
      ctx.strokeStyle = edge.color + Math.floor(alpha * 255).toString(16).padStart(2, "0");
      ctx.lineWidth = isActive ? 1.5 : 0.7;
      if (isActive) {
        ctx.shadowColor = edge.color;
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (isActive) {
        const mx = (from.sx + to.sx) / 2, my = (from.sy + to.sy) / 2;
        ctx.font = "bold 8px 'Courier New'";
        ctx.fillStyle = edge.color + "CC";
        ctx.textAlign = "center";
        ctx.fillText(edge.label, mx, my - 4);
      }
    });

    // Draw nodes
    projected.forEach(node => {
      const isSelected = selectedNode === node.id;
      const isHovered = hoveredNode === node.id;
      const size = node.size * node.scale * (isSelected ? 1.4 : isHovered ? 1.2 : 1);
      const alpha = isSelected || isHovered ? 1 : 0.75 + node.scale * 0.15;

      // Outer glow
      const grd = ctx.createRadialGradient(node.sx, node.sy, 0, node.sx, node.sy, size * 2.5);
      grd.addColorStop(0, node.color + "66");
      grd.addColorStop(1, node.color + "00");
      ctx.beginPath();
      ctx.arc(node.sx, node.sy, size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(node.sx, node.sy, size, 0, Math.PI * 2);
      ctx.shadowColor = node.color;
      ctx.shadowBlur = isSelected ? 30 * pulse : isHovered ? 20 : 10;
      ctx.fillStyle = node.color + Math.floor(alpha * 200).toString(16).padStart(2, "0");
      ctx.fill();
      ctx.strokeStyle = node.color;
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Pulse ring for selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.sx, node.sy, size + 8 + Math.sin(glowPulse * 2) * 4, 0, Math.PI * 2);
        ctx.strokeStyle = node.color + "66";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Label
      ctx.font = `bold ${Math.max(9, 11 * node.scale)}px 'Courier New'`;
      ctx.fillStyle = "#FFFFFF" + Math.floor(alpha * 255).toString(16).padStart(2, "0");
      ctx.textAlign = "center";
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 6;
      ctx.fillText(node.label, node.sx, node.sy + size + 14);
      ctx.shadowBlur = 0;
    });

    // Draw orbiting particles around selected
    const sel = projected.find(n => n.id === selectedNode);
    if (sel) {
      for (let i = 0; i < 3; i++) {
        const angle = glowPulse * 1.5 + (i * Math.PI * 2) / 3;
        const r = sel.size * sel.scale * 3 + 10;
        const px = sel.sx + Math.cos(angle) * r;
        const py = sel.sy + Math.sin(angle) * r * 0.5;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = sel.color;
        ctx.shadowColor = sel.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }, [rotX, rotY, hoveredNode, selectedNode, glowPulse]);

  const handleCanvasMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    if (mouseRef.current.down) {
      const dx = e.clientX - mouseRef.current.lastX;
      const dy = e.clientY - mouseRef.current.lastY;
      rotRef.current += dx * 0.005;
      setRotY(rotRef.current);
      setRotX(rx => Math.max(-0.8, Math.min(0.8, rx + dy * 0.005)));
      setAutoRotate(false);
    }
    mouseRef.current.lastX = e.clientX;
    mouseRef.current.lastY = e.clientY;
    const W = canvas.width, H = canvas.height;
    let found = null;
    NODES.forEach(n => {
      const p = project3D(n.x, n.y, n.z, rotX, rotY, W, H);
      const dist = Math.hypot(mx - p.sx, my - p.sy);
      if (dist < n.size * p.scale * 1.5) found = n.id;
    });
    setHoveredNode(found);
  }, [rotX, rotY]);

  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const W = canvas.width, H = canvas.height;
    NODES.forEach(n => {
      const p = project3D(n.x, n.y, n.z, rotX, rotY, W, H);
      const dist = Math.hypot(mx - p.sx, my - p.sy);
      if (dist < n.size * p.scale * 1.5) setSelectedNode(n.id);
    });
  }, [rotX, rotY]);

  const selectedNodeData = NODES.find(n => n.id === selectedNode);
  const connectedEdges = EDGES.filter(e => e.from === selectedNode || e.to === selectedNode);
  const connectedNodes = connectedEdges.map(e => e.from === selectedNode ? e.to : e.from);

  const handleQuery = () => {
    if (!query.trim()) return;
    setIsQuerying(true);
    setQueryResult(null);
    setTimeout(() => {
      setQueryResult({
        query,
        answer: query.toLowerCase().includes("chip") || query.toLowerCase().includes("semi")
          ? "India imports 97% of advanced semiconductors, primarily from TSMC (Taiwan) and Samsung (Korea). Taiwan Strait conflict probability at 34% within 18 months creates CRITICAL supply chain exposure. India's CHIPS equivalent policy (ISM 2023) allocated ₹76,000 Cr but disbursement is 12% complete. Recommended: Fast-track Micron Sanand fab + bilateral chip deal with Japan within 90 days."
          : query.toLowerCase().includes("pakistan") || query.toLowerCase().includes("border")
          ? "Pakistan-India LAC tension elevated (DEFCON analog: 3/5). Cross-border firing incidents: +47% YoY. Pakistan army-ISI-China trilateral meeting (48hr ago) flagged as potential coordination signal. Historical pattern similarity to pre-Balakot (2019): 71%. Recommend activating QUAD intelligence sharing protocol."
          : "Graph analysis across 1,247 connected entities reveals: Primary risk vector is energy (exposure: HIGH), secondary is cyber (exposure: MEDIUM-HIGH). India's strategic autonomy index has improved 12 points since 2021 due to diversified oil sourcing. Three asymmetric opportunities identified: INR trade settlement, space economy leadership, and Green Hydrogen export to EU.",
        nodes: [selectedNode, ...connectedNodes.slice(0, 4)],
        confidence: Math.floor(Math.random() * 15) + 82
      });
      setIsQuerying(false);
    }, 1800);
  };

  const typeColors = { THREAT: "#FF4040", ECONOMIC: "#F4C430", SIGNAL: "#00FFCC", DIPLOMATIC: "#4488FF", CLIMATE: "#39FF14", CYBER: "#FF4500", GEOPOLITICAL: "#CC44FF", SPACE: "#00BFFF" };

  return (
    <div style={{ background: "#020510", minHeight: "100vh", color: "#E0E8FF", fontFamily: "'Courier New', monospace", overflow: "hidden", position: "relative" }}>
      {/* Background grid */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(0,40,80,0.4) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Header */}
      <div style={{ position: "relative", zIndex: 10, borderBottom: "1px solid rgba(0,200,255,0.15)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(10px)", background: "rgba(2,5,16,0.8)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 36, height: 36, border: "2px solid #00C8FF", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ width: 16, height: 16, background: "#00C8FF", borderRadius: "50%", boxShadow: "0 0 20px #00C8FF" }} />
            <div style={{ position: "absolute", inset: -4, border: "1px solid rgba(0,200,255,0.3)", borderRadius: "50%", animation: "spin 8s linear infinite" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: "bold", letterSpacing: 3, color: "#00C8FF", textShadow: "0 0 20px #00C8FF" }}>ARYABHATA — GLOBAL INTELLIGENCE ENGINE</div>
            <div style={{ fontSize: 10, color: "rgba(0,200,255,0.5)", letterSpacing: 2 }}>ONTOLOGY v2.4 · 1,247 ENTITIES · 4,891 RELATIONSHIPS · INDIA STRATEGIC COMMAND</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {[["LIVE", "#39FF14"], ["FEEDS: 847/s", "#00C8FF"], ["THREAT: ELEVATED", "#FF4040"]].map(([label, color]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color, letterSpacing: 1 }}>
              <div style={{ width: 6, height: 6, background: color, borderRadius: "50%", boxShadow: `0 0 8px ${color}`, animation: "pulse 1.5s infinite" }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 60px)", position: "relative", zIndex: 5 }}>

        {/* Left Panel - Intelligence Feed */}
        <div style={{ width: 280, borderRight: "1px solid rgba(0,200,255,0.1)", display: "flex", flexDirection: "column", background: "rgba(2,5,16,0.7)", backdropFilter: "blur(10px)" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(0,200,255,0.1)", fontSize: 10, letterSpacing: 2, color: "#00C8FF" }}>◈ LIVE INTELLIGENCE FEED</div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {feedItems.map((item, i) => (
              <div key={item.id + i} onClick={() => setSelectedNode(item.node)} style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer", transition: "background 0.2s", background: i === 0 ? "rgba(0,200,255,0.05)" : "transparent" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(0,200,255,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = i === 0 ? "rgba(0,200,255,0.05)" : "transparent"}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: "bold", color: typeColors[item.type] || "#888", letterSpacing: 1, padding: "1px 5px", border: `1px solid ${typeColors[item.type] || "#888"}33`, borderRadius: 2 }}>{item.type}</span>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{item.time}</span>
                </div>
                <div style={{ fontSize: 11, lineHeight: 1.5, color: "rgba(224,232,255,0.8)" }}>{item.text}</div>
                <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 1 }}>
                    <div style={{ width: `${item.confidence}%`, height: "100%", background: item.confidence > 85 ? "#39FF14" : item.confidence > 70 ? "#F4C430" : "#FF4040", borderRadius: 1 }} />
                  </div>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{item.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center - 3D Graph */}
        <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
          {/* Query bar */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(0,200,255,0.1)", display: "flex", gap: 8, background: "rgba(2,5,16,0.5)" }}>
            <span style={{ color: "#00C8FF", fontSize: 12, paddingTop: 2 }}>⬡</span>
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleQuery()}
              placeholder="Ask the graph anything... e.g. 'What is India's semiconductor risk?'"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#E0E8FF", fontSize: 12, fontFamily: "inherit", letterSpacing: 0.5 }} />
            <button onClick={handleQuery} style={{ background: "rgba(0,200,255,0.1)", border: "1px solid rgba(0,200,255,0.3)", color: "#00C8FF", padding: "4px 14px", cursor: "pointer", fontSize: 11, fontFamily: "inherit", letterSpacing: 1, borderRadius: 2 }}>
              {isQuerying ? "ANALYZING..." : "QUERY →"}
            </button>
          </div>

          <div style={{ flex: 1, position: "relative" }}>
            <canvas ref={canvasRef} width={860} height={560}
              style={{ width: "100%", height: "100%", cursor: hoveredNode ? "pointer" : "grab" }}
              onMouseDown={e => { mouseRef.current.down = true; setAutoRotate(false); }}
              onMouseUp={() => mouseRef.current.down = false}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={() => { mouseRef.current.down = false; setHoveredNode(null); }}
              onClick={handleCanvasClick} />

            {/* Controls */}
            <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", gap: 8 }}>
              <button onClick={() => setAutoRotate(a => !a)} style={{ background: autoRotate ? "rgba(0,200,255,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${autoRotate ? "rgba(0,200,255,0.4)" : "rgba(255,255,255,0.1)"}`, color: autoRotate ? "#00C8FF" : "rgba(255,255,255,0.4)", padding: "4px 10px", cursor: "pointer", fontSize: 10, fontFamily: "inherit", letterSpacing: 1, borderRadius: 2 }}>
                {autoRotate ? "⏸ AUTO" : "▶ AUTO"}
              </button>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", padding: "5px 0", letterSpacing: 1 }}>DRAG TO ROTATE</div>
            </div>

            {/* Hover tooltip */}
            {hoveredNode && hoveredNode !== selectedNode && (
              <div style={{ position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)", background: "rgba(2,5,20,0.9)", border: "1px solid rgba(0,200,255,0.3)", padding: "6px 14px", fontSize: 11, color: "#00C8FF", letterSpacing: 1, borderRadius: 2, pointerEvents: "none" }}>
                CLICK TO FOCUS → {NODES.find(n => n.id === hoveredNode)?.label.toUpperCase()}
              </div>
            )}

            {/* Query result overlay */}
            {queryResult && (
              <div style={{ position: "absolute", top: 16, right: 16, width: 300, background: "rgba(2,5,20,0.95)", border: "1px solid rgba(0,200,255,0.25)", borderRadius: 4, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 9, color: "#00C8FF", letterSpacing: 2 }}>GRAPH ANALYSIS RESULT</div>
                  <button onClick={() => setQueryResult(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 12 }}>✕</button>
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 8, fontStyle: "italic" }}>"{queryResult.query}"</div>
                <div style={{ fontSize: 11, lineHeight: 1.6, color: "rgba(224,232,255,0.85)", marginBottom: 10 }}>{queryResult.answer}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>CONFIDENCE</div>
                  <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 1 }}>
                    <div style={{ width: `${queryResult.confidence}%`, height: "100%", background: "#39FF14", borderRadius: 1 }} />
                  </div>
                  <div style={{ fontSize: 9, color: "#39FF14" }}>{queryResult.confidence}%</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ width: 300, borderLeft: "1px solid rgba(0,200,255,0.1)", display: "flex", flexDirection: "column", background: "rgba(2,5,16,0.7)", backdropFilter: "blur(10px)" }}>
          {/* Node detail */}
          {selectedNodeData && (
            <div style={{ padding: 14, borderBottom: "1px solid rgba(0,200,255,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: selectedNodeData.color + "33", border: `2px solid ${selectedNodeData.color}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 15px ${selectedNodeData.color}66` }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: "bold", color: selectedNodeData.color, letterSpacing: 1 }}>{selectedNodeData.label.toUpperCase()}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 2 }}>{selectedNodeData.type.toUpperCase()} · {connectedEdges.length} CONNECTIONS</div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {connectedEdges.slice(0, 6).map((e, i) => {
                  const other = e.from === selectedNode ? e.to : e.from;
                  const otherNode = NODES.find(n => n.id === other);
                  return (
                    <button key={i} onClick={() => setSelectedNode(other)} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${e.color}44`, color: "rgba(255,255,255,0.6)", padding: "3px 8px", cursor: "pointer", fontSize: 9, fontFamily: "inherit", borderRadius: 2, letterSpacing: 0.5 }}>
                      <span style={{ color: e.color }}>→</span> {otherNode?.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(0,200,255,0.1)" }}>
            {["insights", "scenarios", "sources"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "8px 0", background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid #00C8FF" : "2px solid transparent", color: activeTab === tab ? "#00C8FF" : "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 9, fontFamily: "inherit", letterSpacing: 2, textTransform: "uppercase" }}>
                {tab}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            {activeTab === "insights" && INSIGHTS.map((insight, i) => (
              <div key={i} style={{ marginBottom: 12, padding: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, borderLeft: `3px solid ${insight.priority === "CRITICAL" ? "#FF4040" : insight.priority === "HIGH" ? "#FF8C00" : insight.priority === "OPPORTUNITY" ? "#39FF14" : "#F4C430"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>{insight.icon}</span>
                  <div style={{ fontSize: 10, fontWeight: "bold", color: "rgba(224,232,255,0.9)", letterSpacing: 0.5 }}>{insight.title}</div>
                </div>
                <div style={{ fontSize: 10, lineHeight: 1.6, color: "rgba(224,232,255,0.55)", marginBottom: 8 }}>{insight.text}</div>
                <button style={{ background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.2)", color: "#00C8FF", padding: "3px 10px", cursor: "pointer", fontSize: 9, fontFamily: "inherit", letterSpacing: 1, borderRadius: 2 }}>
                  {insight.action} →
                </button>
              </div>
            ))}
            {activeTab === "scenarios" && (
              <div>
                {[["Hormuz Closure — 30 days", "ENERGY", 68], ["Taiwan Strait Conflict", "DEFENSE", 34], ["INR De-dollarization", "ECONOMIC", 45], ["Monsoon Failure 2025", "CLIMATE", 58]].map(([name, type, prob]) => (
                  <div key={name} style={{ marginBottom: 10, padding: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ fontSize: 10, color: "rgba(224,232,255,0.8)" }}>{name}</div>
                      <div style={{ fontSize: 9, color: prob > 50 ? "#FF8C00" : "#F4C430", letterSpacing: 1 }}>{prob}%</div>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                      <div style={{ width: `${prob}%`, height: "100%", background: prob > 60 ? "#FF4040" : prob > 40 ? "#FF8C00" : "#F4C430", borderRadius: 2, transition: "width 1s" }} />
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 4, letterSpacing: 1 }}>{type} SCENARIO</div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "sources" && (
              <div>
                {[["Reuters Global Feed", "NEWS", "1.2k/hr", true], ["ISRO Satellite AIS", "GEOSPATIAL", "Live", true], ["IMF/World Bank API", "ECONOMIC", "Daily", true], ["UN Security Council", "DIPLOMATIC", "Event", true], ["Twitter/X Firehose", "SOCIAL", "14k/hr", true], ["Dark Web Monitor", "HUMINT", "Hourly", false]].map(([name, type, rate, active]) => (
                  <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div>
                      <div style={{ fontSize: 10, color: active ? "rgba(224,232,255,0.8)" : "rgba(255,255,255,0.3)" }}>{name}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: 1 }}>{type} · {rate}</div>
                    </div>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#39FF14" : "#444", boxShadow: active ? "0 0 6px #39FF14" : "none" }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom stat strip */}
          <div style={{ borderTop: "1px solid rgba(0,200,255,0.1)", padding: "8px 12px", display: "flex", justifyContent: "space-between" }}>
            {[["ENTITIES", "1,247"], ["EDGES", "4,891"], ["SOURCES", "847"]].map(([k, v]) => (
              <div key={k} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: "bold", color: "#00C8FF", textShadow: "0 0 10px #00C8FF44" }}>{v}</div>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", letterSpacing: 2 }}>{k}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,200,255,0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
}
