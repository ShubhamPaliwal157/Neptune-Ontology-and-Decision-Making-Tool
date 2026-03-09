import json, os

decisions = [
    {
        "id": "DEC-2024-0847",
        "title": "Should India join the US-led Semiconductor Alliance (iCET-CHIPS)?",
        "deadline": "Cabinet Meeting — 72 hours",
        "domain": "technology",
        "status": "AWAITING DECISION",
        "priority": "CRITICAL",
        "owner": "NSA Office",
        "summary": "The US has formally invited India to join the iCET-CHIPS semiconductor alliance. Membership grants access to 3nm chip technology, TSMC supply guarantees, and $4.2B in technology transfer — but requires India to restrict chip-related exports to China and align export controls with US policy.",
        "evidence": [
            {
                "id": "E1",
                "claim": "India imports 97% of advanced semiconductors from Taiwan and South Korea",
                "type": "FACT",
                "confidence": 96,
                "impact": "HIGH",
                "supports": "JOIN",
                "sources": [
                    {"name": "MeitY Import Report Q3 2024", "type": "GOV", "verified": True},
                    {"name": "NASSCOM Supply Chain Analysis 2024", "type": "INDUSTRY", "verified": True}
                ],
                "timestamp": "Updated 6hr ago"
            },
            {
                "id": "E2",
                "claim": "China has restricted exports of 4 materials India needs for semiconductor and defense production",
                "type": "INTELLIGENCE",
                "confidence": 88,
                "impact": "HIGH",
                "supports": "JOIN",
                "sources": [
                    {"name": "PRC Ministry of Commerce Filing, Feb 28", "type": "OFFICIAL", "verified": True},
                    {"name": "Indian Embassy Beijing HUMINT Report", "type": "HUMINT", "verified": False}
                ],
                "timestamp": "Updated 14hr ago"
            },
            {
                "id": "E3",
                "claim": "Joining iCET-CHIPS requires India to restrict chip exports to China — estimated ₹17,400 Cr annual trade impact",
                "type": "RISK",
                "confidence": 91,
                "impact": "HIGH",
                "supports": "CAUTION",
                "sources": [
                    {"name": "iCET Framework Clause 7.4 (Leaked Draft)", "type": "LEAKED", "verified": False},
                    {"name": "Commerce Ministry Economic Assessment", "type": "GOV", "verified": True}
                ],
                "timestamp": "Updated 2hr ago"
            },
            {
                "id": "E4",
                "claim": "Taiwan Strait conflict probability: 31–38% within 18 months across 3 independent models",
                "type": "FORECAST",
                "confidence": 74,
                "impact": "CRITICAL",
                "supports": "JOIN",
                "sources": [
                    {"name": "RAND Strategic Analysis Q1 2024", "type": "THINK TANK", "verified": True},
                    {"name": "Indian Naval Intelligence Forecast Model", "type": "CLASSIFIED", "verified": True},
                    {"name": "Oxford Economics Geopolitical Risk Index", "type": "ACADEMIC", "verified": True}
                ],
                "timestamp": "Model updated 3 days ago"
            },
            {
                "id": "E5",
                "claim": "Russia has offered alternative chip supply arrangement — maximum 8nm process node capability",
                "type": "INTELLIGENCE",
                "confidence": 67,
                "impact": "MEDIUM",
                "supports": "NEUTRAL",
                "sources": [
                    {"name": "Moscow Embassy Diplomatic Cable, Mar 1", "type": "DIPLOMATIC", "verified": True}
                ],
                "timestamp": "Updated 8hr ago"
            },
            {
                "id": "E6",
                "claim": "Micron Sanand fab operational by Q4 2025 — will supply 28nm chips domestically",
                "type": "FACT",
                "confidence": 94,
                "impact": "MEDIUM",
                "supports": "WAIT",
                "sources": [
                    {"name": "Micron Press Release + MeitY Confirmation", "type": "OFFICIAL", "verified": True}
                ],
                "timestamp": "Live tracking"
            }
        ],
        "scenarios": [
            {
                "id": "S1",
                "title": "JOIN NOW",
                "subtitle": "Full iCET-CHIPS membership within 30 days",
                "color": "#22c55e",
                "outcomes": [
                    {"label": "Semiconductor supply security", "value": "+68%", "direction": "up", "color": "#22c55e"},
                    {"label": "China trade relationship", "value": "−34%", "direction": "down", "color": "#ef4444"},
                    {"label": "US tech transfer access", "value": "+$4.2B", "direction": "up", "color": "#22c55e"},
                    {"label": "Strategic autonomy index", "value": "−12 pts", "direction": "down", "color": "#f97316"}
                ],
                "risk": "China retaliates via Pakistan proxy pressure + Himalayan border escalation",
                "riskLevel": "HIGH"
            },
            {
                "id": "S2",
                "title": "NEGOTIATE TERMS",
                "subtitle": "Join with carve-out for Russia and strategic autonomy clauses",
                "color": "#f59e0b",
                "outcomes": [
                    {"label": "Semiconductor supply security", "value": "+41%", "direction": "up", "color": "#22c55e"},
                    {"label": "China trade relationship", "value": "−18%", "direction": "down", "color": "#f97316"},
                    {"label": "US tech transfer access", "value": "+$2.8B", "direction": "up", "color": "#22c55e"},
                    {"label": "Strategic autonomy index", "value": "+3 pts", "direction": "up", "color": "#22c55e"}
                ],
                "risk": "US rejects carve-out — India excluded from 3nm node access for 2+ years",
                "riskLevel": "MEDIUM"
            },
            {
                "id": "S3",
                "title": "DECLINE & BUILD",
                "subtitle": "Accelerate domestic fab + bilateral deals with Japan and Israel",
                "color": "#ef4444",
                "outcomes": [
                    {"label": "Semiconductor supply security", "value": "+12%", "direction": "up", "color": "#f97316"},
                    {"label": "China trade relationship", "value": "Stable", "direction": "neutral", "color": "#94a3b8"},
                    {"label": "US tech transfer access", "value": "Delayed 3yr", "direction": "down", "color": "#ef4444"},
                    {"label": "Strategic autonomy index", "value": "+18 pts", "direction": "up", "color": "#22c55e"}
                ],
                "risk": "If Taiwan Strait conflict before 2027 — critical chip gap of 4–6 years with no fallback",
                "riskLevel": "CRITICAL"
            }
        ],
        "alerts": [
            {"severity": "CRITICAL", "text": "TSMC halts new India contracts pending iCET decision — window closes in 11 days", "time": "08:41"},
            {"severity": "HIGH", "text": "US Trade Rep meeting rescheduled to Thursday — signals impatience with India delay", "time": "07:22"},
            {"severity": "HIGH", "text": "Chinese FM calls India's iCET consideration a 'hostile act' — state media amplification underway", "time": "03:14"}
        ],
        "watchlist": [
            {"label": "TSMC contract window", "current": "11 days remaining", "threshold": "< 7 days → CRITICAL ALERT"},
            {"label": "China retaliatory signals", "current": "2 active signals", "threshold": "> 3 in 48hr → ESCALATE"},
            {"label": "US negotiation deadline", "current": "72 hours", "threshold": "< 48hr → ESCALATE"},
            {"label": "Taiwan Strait vessel activity", "current": "Elevated — 14 PLAN vessels", "threshold": "Exercise declared → CRITICAL"}
        ],
        "past_decisions": [
            {"date": "Jan 14 2024", "title": "Increased Russian oil imports above 40% threshold", "outcome": "EFFECTIVE", "detail": "Saved ₹18,400 Cr vs Brent spot price. No Western sanctions triggered.", "color": "#22c55e"},
            {"date": "Oct 3 2023", "title": "Declined joining US semiconductor export controls (round 1)", "outcome": "MIXED", "detail": "Preserved China trade relationship. Lost ASML EUV machine access for 14 months.", "color": "#f59e0b"},
            {"date": "Jun 2 2023", "title": "Joined QUAD naval exercises (expanded format)", "outcome": "EFFECTIVE", "detail": "Chinese PLAN vessel incursions in Andaman zone dropped 41% over 90 days.", "color": "#22c55e"}
        ]
    },
    {
        "id": "DEC-2024-0831",
        "title": "How should India respond to the Pakistan-China CPEC-II expansion into PoK?",
        "deadline": "NSC Meeting — 48 hours",
        "domain": "defense",
        "status": "UNDER REVIEW",
        "priority": "HIGH",
        "owner": "Ministry of External Affairs",
        "summary": "Pakistan and China have announced CPEC Phase II expansion through Pakistan-occupied Kashmir, including a new road corridor 8km from the LAC. India must decide whether to formally protest at the UN, escalate diplomatically with both nations, conduct a military signalling response, or maintain strategic silence.",
        "evidence": [
            {
                "id": "E1",
                "claim": "CPEC-II route passes 8km from LAC — satellite imagery confirmed March 3",
                "type": "INTELLIGENCE",
                "confidence": 94,
                "impact": "CRITICAL",
                "supports": "RESPOND",
                "sources": [
                    {"name": "ISRO Cartosat-3 Imagery, Mar 3 2024", "type": "SATELLITE", "verified": True},
                    {"name": "RAW Ground Assessment Report", "type": "CLASSIFIED", "verified": True}
                ],
                "timestamp": "Updated 18hr ago"
            },
            {
                "id": "E2",
                "claim": "China has deployed 3 PLA engineering battalions along the new corridor — force protection posture",
                "type": "INTELLIGENCE",
                "confidence": 81,
                "impact": "HIGH",
                "supports": "RESPOND",
                "sources": [
                    {"name": "US NGA Satellite Assessment (Shared via QUAD)", "type": "ALLIED INTEL", "verified": True},
                    {"name": "HUMINT — Gilgit-Baltistan Source", "type": "HUMINT", "verified": False}
                ],
                "timestamp": "Updated 36hr ago"
            },
            {
                "id": "E3",
                "claim": "UN Security Council protest would be vetoed by China — historical precedent: 100% veto rate on India-Pakistan matters",
                "type": "FACT",
                "confidence": 97,
                "impact": "MEDIUM",
                "supports": "CAUTION",
                "sources": [
                    {"name": "UN Security Council Voting Records 1947–2024", "type": "OFFICIAL", "verified": True}
                ],
                "timestamp": "Historical record"
            },
            {
                "id": "E4",
                "claim": "India-China trade at $118B — economic leverage is mutual and significant",
                "type": "FACT",
                "confidence": 98,
                "impact": "HIGH",
                "supports": "CAUTION",
                "sources": [
                    {"name": "DGFT Trade Statistics Q3 2024", "type": "GOV", "verified": True},
                    {"name": "RBI Balance of Payments Report", "type": "GOV", "verified": True}
                ],
                "timestamp": "Updated quarterly"
            }
        ],
        "scenarios": [
            {
                "id": "S1",
                "title": "DIPLOMATIC PROTEST",
                "subtitle": "Formal UN protest + bilateral demarche to Beijing and Islamabad",
                "color": "#3b82f6",
                "outcomes": [
                    {"label": "International visibility", "value": "+High", "direction": "up", "color": "#22c55e"},
                    {"label": "Practical impact on CPEC", "value": "Minimal", "direction": "down", "color": "#ef4444"},
                    {"label": "China relationship", "value": "−8%", "direction": "down", "color": "#f97316"},
                    {"label": "Domestic political capital", "value": "+Medium", "direction": "up", "color": "#22c55e"}
                ],
                "risk": "China uses UNSC veto — India looks weak without follow-through",
                "riskLevel": "MEDIUM"
            },
            {
                "id": "S2",
                "title": "MILITARY SIGNAL",
                "subtitle": "Forward troop repositioning + LAC infrastructure acceleration",
                "color": "#f59e0b",
                "outcomes": [
                    {"label": "Deterrence signal strength", "value": "HIGH", "direction": "up", "color": "#22c55e"},
                    {"label": "Escalation risk", "value": "+34%", "direction": "down", "color": "#ef4444"},
                    {"label": "QUAD support likelihood", "value": "+High", "direction": "up", "color": "#22c55e"},
                    {"label": "Economic disruption risk", "value": "MEDIUM", "direction": "neutral", "color": "#f97316"}
                ],
                "risk": "Miscalculation risk elevated — 2020 Galwan precedent shows rapid escalation possible",
                "riskLevel": "HIGH"
            },
            {
                "id": "S3",
                "title": "STRATEGIC SILENCE",
                "subtitle": "No formal response — accelerate Arunachal infrastructure quietly",
                "color": "#6b7280",
                "outcomes": [
                    {"label": "Immediate escalation risk", "value": "LOW", "direction": "up", "color": "#22c55e"},
                    {"label": "Long-term strategic position", "value": "−15 pts", "direction": "down", "color": "#ef4444"},
                    {"label": "Domestic political cost", "value": "HIGH", "direction": "down", "color": "#ef4444"},
                    {"label": "China perception of India", "value": "Weakened", "direction": "down", "color": "#ef4444"}
                ],
                "risk": "Sets precedent for further encroachment — 2017 Doklam shows silence invites escalation",
                "riskLevel": "HIGH"
            }
        ],
        "alerts": [
            {"severity": "CRITICAL", "text": "PLA engineering battalion detected moving heavy equipment toward new CPEC-II corridor — 6hr window", "time": "06:12"},
            {"severity": "HIGH", "text": "Pakistan Foreign Minister scheduled press conference in 4 hours — likely CPEC-II announcement", "time": "05:44"}
        ],
        "watchlist": [
            {"label": "PLA troop movements near LAC", "current": "Elevated activity", "threshold": "Battalion-level movement → CRITICAL"},
            {"label": "Pakistan diplomatic statements", "current": "Monitoring", "threshold": "Formal CPEC-II announcement → ALERT"},
            {"label": "QUAD partner responses", "current": "Awaiting", "threshold": "US/Japan statement → UPDATE BRIEF"}
        ],
        "past_decisions": [
            {"date": "Jun 15 2020", "title": "Galwan Valley military response", "outcome": "EFFECTIVE", "detail": "Forward positioning halted Chinese advance. LAC status restored within 18 months.", "color": "#22c55e"},
            {"date": "Aug 5 2019", "title": "Article 370 revocation — Kashmir", "outcome": "MIXED", "detail": "Domestic objective achieved. Pakistan-China diplomatic pressure increased significantly.", "color": "#f59e0b"}
        ]
    },
    {
        "id": "DEC-2024-0819",
        "title": "Should India accelerate domestic renewable energy to reduce Gulf oil dependency?",
        "deadline": "Budget Session — 5 days",
        "domain": "economics",
        "status": "IN ANALYSIS",
        "priority": "MEDIUM",
        "owner": "Ministry of Petroleum and Natural Gas",
        "summary": "India spends $180B annually on oil and gas imports — 87% from OPEC nations and Russia. A new modelling exercise suggests accelerating the 2030 renewable target to 2027 could reduce import dependency by 34% and save ₹4.2 lakh crore over 10 years, but requires ₹8.8 lakh crore upfront investment and carries grid stability risks.",
        "evidence": [
            {
                "id": "E1",
                "claim": "India's oil import bill: $180B in FY2024 — highest in history, 4.2% of GDP",
                "type": "FACT",
                "confidence": 99,
                "impact": "CRITICAL",
                "supports": "ACCELERATE",
                "sources": [
                    {"name": "Ministry of Petroleum Annual Report FY2024", "type": "GOV", "verified": True},
                    {"name": "RBI Annual Report 2024 — Balance of Payments", "type": "GOV", "verified": True}
                ],
                "timestamp": "Annual data — verified"
            },
            {
                "id": "E2",
                "claim": "Solar + wind LCOE now 40% cheaper than imported thermal power in 14 Indian states",
                "type": "FACT",
                "confidence": 92,
                "impact": "HIGH",
                "supports": "ACCELERATE",
                "sources": [
                    {"name": "CERC Tariff Order 2024", "type": "REGULATORY", "verified": True},
                    {"name": "IRENA India Country Report 2024", "type": "INTERNATIONAL", "verified": True}
                ],
                "timestamp": "Updated 30 days ago"
            },
            {
                "id": "E3",
                "claim": "Grid storage technology gap: India lacks sufficient battery storage for >45% renewable penetration without blackout risk",
                "type": "RISK",
                "confidence": 84,
                "impact": "HIGH",
                "supports": "CAUTION",
                "sources": [
                    {"name": "POSOCO Grid Stability Assessment 2024", "type": "GOV", "verified": True},
                    {"name": "IEA India Energy Outlook 2024", "type": "INTERNATIONAL", "verified": True}
                ],
                "timestamp": "Updated 60 days ago"
            },
            {
                "id": "E4",
                "claim": "OPEC+ has demonstrated willingness to cut supply unilaterally — 3 surprise cuts since 2022",
                "type": "FACT",
                "confidence": 98,
                "impact": "HIGH",
                "supports": "ACCELERATE",
                "sources": [
                    {"name": "OPEC+ Meeting Records 2022–2024", "type": "OFFICIAL", "verified": True}
                ],
                "timestamp": "Historical record"
            }
        ],
        "scenarios": [
            {
                "id": "S1",
                "title": "ACCELERATE TO 2027",
                "subtitle": "Move renewable target from 2030 to 2027 — emergency investment mode",
                "color": "#22c55e",
                "outcomes": [
                    {"label": "Oil import reduction by 2027", "value": "−34%", "direction": "up", "color": "#22c55e"},
                    {"label": "Upfront investment required", "value": "₹8.8L Cr", "direction": "down", "color": "#f97316"},
                    {"label": "10-year savings", "value": "₹4.2L Cr", "direction": "up", "color": "#22c55e"},
                    {"label": "Grid blackout risk", "value": "MEDIUM-HIGH", "direction": "down", "color": "#ef4444"}
                ],
                "risk": "Battery storage gap creates grid instability risk in 2026–2027 transition window",
                "riskLevel": "MEDIUM"
            },
            {
                "id": "S2",
                "title": "MAINTAIN 2030 TARGET",
                "subtitle": "Stay on current trajectory with incremental acceleration",
                "color": "#f59e0b",
                "outcomes": [
                    {"label": "Oil import reduction by 2030", "value": "−22%", "direction": "up", "color": "#22c55e"},
                    {"label": "Investment required", "value": "₹5.2L Cr", "direction": "neutral", "color": "#f97316"},
                    {"label": "OPEC shock exposure", "value": "HIGH till 2030", "direction": "down", "color": "#ef4444"},
                    {"label": "Grid stability", "value": "MAINTAINED", "direction": "up", "color": "#22c55e"}
                ],
                "risk": "4 more years of maximum OPEC exposure — any supply shock costs ₹2.1L Cr+",
                "riskLevel": "MEDIUM"
            },
            {
                "id": "S3",
                "title": "HYBRID APPROACH",
                "subtitle": "Accelerate solar/wind + parallel strategic oil reserve expansion",
                "color": "#3b82f6",
                "outcomes": [
                    {"label": "Oil import reduction by 2028", "value": "−28%", "direction": "up", "color": "#22c55e"},
                    {"label": "Investment required", "value": "₹6.4L Cr", "direction": "neutral", "color": "#f97316"},
                    {"label": "Strategic reserve cover", "value": "120 days", "direction": "up", "color": "#22c55e"},
                    {"label": "Grid stability risk", "value": "LOW", "direction": "up", "color": "#22c55e"}
                ],
                "risk": "Requires coordination across 4 ministries — execution risk is high",
                "riskLevel": "LOW"
            }
        ],
        "alerts": [
            {"severity": "HIGH", "text": "OPEC+ emergency meeting called for next week — surprise cut likely. India import cost impact: +₹22,000 Cr/month", "time": "09:15"},
            {"severity": "MEDIUM", "text": "Rajasthan solar auction undersubscribed by 34% — private sector confidence signal", "time": "YESTERDAY"}
        ],
        "watchlist": [
            {"label": "OPEC+ production decision", "current": "Meeting in 6 days", "threshold": "Cut announced → CRITICAL IMPACT"},
            {"label": "Brent crude price", "current": "$87.4/barrel", "threshold": "> $95 → Budget revision needed"},
            {"label": "INR/USD rate", "current": "84.6", "threshold": "> 86 → Import cost alarm"}
        ],
        "past_decisions": [
            {"date": "Feb 1 2024", "title": "Budget allocation: ₹2.4L Cr for green energy transition", "outcome": "IN PROGRESS", "detail": "Disbursement at 34%. Solar capacity addition on track. Wind delayed by 8 months.", "color": "#f59e0b"},
            {"date": "Mar 2023", "title": "Strategic petroleum reserve expansion — Phase 2", "outcome": "EFFECTIVE", "detail": "Reserve now covers 68 days of consumption. Buffer created for supply shocks.", "color": "#22c55e"}
        ]
    }
]

os.makedirs("data", exist_ok=True)
with open("data/decisions.json", "w", encoding="utf-8") as f:
    json.dump(decisions, f, indent=2, ensure_ascii=False)

print(f"✅ Decisions generated: {len(decisions)} decisions → data/decisions.json")