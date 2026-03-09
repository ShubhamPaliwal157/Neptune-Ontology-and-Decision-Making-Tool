import json, random, os
from datetime import datetime, timedelta

random.seed(99)

FEED_ITEMS = [
    {"type": "THREAT", "domain": "defense", "node": "CHN", "text": "PLA naval vessels detected near Andaman Islands — 3 destroyers, AIS disabled", "confidence": 87},
    {"type": "ECONOMIC", "domain": "economics", "node": "OIL_SUPPLY", "text": "Brent crude +4.2% after OPEC+ emergency meeting. India import cost impact: ₹28,000 Cr/month", "confidence": 96},
    {"type": "SIGNAL", "domain": "technology", "node": "SEMICONDUCTORS", "text": "China files 847 new semiconductor patents this week. India: 12. Gap widening at accelerating rate.", "confidence": 94},
    {"type": "DIPLOMATIC", "domain": "geopolitics", "node": "QUAD", "text": "US Deputy SecState arrives New Delhi — agenda: QUAD expansion, AI governance framework", "confidence": 91},
    {"type": "CLIMATE", "domain": "climate", "node": "MONSOON", "text": "IMD: Monsoon deficit 23% in Kharif belt. Agricultural output risk: HIGH. 3 states in red zone.", "confidence": 88},
    {"type": "CYBER", "domain": "defense", "node": "CYBER_WARFARE", "text": "APT41 lateral movement detected in 2 Indian PSU networks. Pattern matches 2022 AIIMS attack.", "confidence": 79},
    {"type": "ECONOMIC", "domain": "economics", "node": "INFLATION", "text": "INR hits 84.6/USD. RBI intervention signals. FII outflows: $2.1B this week.", "confidence": 97},
    {"type": "GEOPOLITICAL", "domain": "geopolitics", "node": "PAK", "text": "Pakistan army chief meets ISI + Chinese ambassador — 4hr closed session, Islamabad", "confidence": 71},
    {"type": "SPACE", "domain": "technology", "node": "ISRO", "text": "ISRO Gaganyaan abort test successful. India 3rd nation with crewed abort capability.", "confidence": 99},
    {"type": "ECONOMIC", "domain": "economics", "node": "RUS", "text": "Russia redirects 40% of Arctic LNG to India after EU sanctions. Price: 14% below market.", "confidence": 83},
    {"type": "THREAT", "domain": "defense", "node": "LAC_BORDER", "text": "Satellite imagery shows new PLA forward logistics base 40km from LAC — Depsang sector.", "confidence": 81},
    {"type": "DIPLOMATIC", "domain": "geopolitics", "node": "BRICS", "text": "BRICS summit agenda leaked: INR trade settlement to be formally proposed by India in October.", "confidence": 76},
    {"type": "SIGNAL", "domain": "economics", "node": "RARE_EARTH", "text": "China restricts gallium and germanium exports — 4 materials India depends on for defense production.", "confidence": 93},
    {"type": "CLIMATE", "domain": "climate", "node": "CLIMATE_CRISIS", "text": "IPCC emergency bulletin: South Asia heat stress index at record high. 3 consecutive years above threshold.", "confidence": 92},
    {"type": "CYBER", "domain": "defense", "node": "DISINFORMATION", "text": "400 coordinated inauthentic accounts spreading false India-Pakistan ceasefire narrative identified on X.", "confidence": 84},
    {"type": "GEOPOLITICAL", "domain": "geopolitics", "node": "TWN", "text": "Taiwan Strait: PLAN conducts unannounced live-fire exercises. US 7th Fleet repositioning.", "confidence": 89},
    {"type": "ECONOMIC", "domain": "economics", "node": "DEDOLLARIZATION", "text": "14 nations formally express interest in INR settlement. Saudi Arabia in preliminary talks.", "confidence": 77},
    {"type": "DIPLOMATIC", "domain": "geopolitics", "node": "SCO", "text": "SCO foreign ministers meet: India blocks China's Belt & Road inclusion in joint communique.", "confidence": 85},
    {"type": "THREAT", "domain": "defense", "node": "NUCLEAR_WEAPONS", "text": "Pakistan test-fires Shaheen-III MRBM. Range covers all Indian cities. 3rd test this year.", "confidence": 98},
    {"type": "SIGNAL", "domain": "technology", "node": "AI_RACE", "text": "OpenAI signs exclusive DOD contract. AI superiority gap between US-China widening. India unrepresented.", "confidence": 90},
    {"type": "CLIMATE", "domain": "climate", "node": "FOOD_SECURITY", "text": "UN FAO: India wheat export ban enters 3rd year. Global food price index rises 8% MoM.", "confidence": 86},
    {"type": "ECONOMIC", "domain": "economics", "node": "FINANCIAL_CRISIS", "text": "Credit Suisse successor bank flags $4.2T derivatives exposure. Contagion risk: MEDIUM-HIGH.", "confidence": 72},
    {"type": "DIPLOMATIC", "domain": "geopolitics", "node": "USA", "text": "White House confirms India iCET semiconductor package — decision window: 30 days.", "confidence": 95},
    {"type": "GEOPOLITICAL", "domain": "geopolitics", "node": "UKR", "text": "Ukraine drone strike hits Russian oil depot — 3rd this week. Global oil supply impact: +$2.1/barrel.", "confidence": 93},
    {"type": "SIGNAL", "domain": "defense", "node": "DRONE_WARFARE", "text": "India approves domestic drone swarm program. Budget: ₹12,000 Cr. Delivery: 18 months.", "confidence": 91},
    {"type": "ECONOMIC", "domain": "economics", "node": "OPEC", "text": "OPEC+ cuts production by 1.5M bpd. India dependency ratio increases to 87% import-sourced.", "confidence": 94},
    {"type": "CYBER", "domain": "defense", "node": "NSA", "text": "NSA shares SIGINT on Chinese infiltration of Indian telecom backbone with RAW. 3 nodes compromised.", "confidence": 78},
    {"type": "CLIMATE", "domain": "climate", "node": "WATER_SCARCITY", "text": "Cauvery basin water level at 34% — lowest since 1974. Inter-state water dispute escalating.", "confidence": 88},
    {"type": "DIPLOMATIC", "domain": "geopolitics", "node": "EU", "text": "EU proposes India-EU free trade corridor bypassing China's Belt & Road. Negotiations begin Q2.", "confidence": 82},
    {"type": "THREAT", "domain": "defense", "node": "KASHMIR", "text": "Cross-LoC firing incidents: +47% YoY. Pakistani artillery shelling resumed in 3 sectors.", "confidence": 96},
]

now = datetime.now()
feed = []
for i, item in enumerate(FEED_ITEMS):
    offset = timedelta(minutes=random.randint(1, 180))
    ts = (now - offset).strftime("%H:%M:%S")
    feed.append({**item, "id": i + 1, "timestamp": ts})

random.shuffle(feed)

os.makedirs("data", exist_ok=True)
with open("data/feed.json", "w") as f:
    json.dump(feed, f, indent=2)

print(f"✅ Feed generated: {len(feed)} items → data/feed.json")