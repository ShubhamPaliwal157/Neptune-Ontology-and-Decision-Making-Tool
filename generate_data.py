import requests
import json
import zipfile
import io
import csv
import os
import re
from collections import defaultdict

print("Neptune Data Generator — starting...")

# ── DOMAIN COLOR MAP ───────────────────────────────────────────────────────────
DOMAIN_COLORS = {
    "geopolitics": "#E63946",
    "economics":   "#F4A261",
    "defense":     "#E76F51",
    "technology":  "#00B4D8",
    "climate":     "#2DC653",
    "society":     "#9B5DE5",
    "organization":"#FFD166",
    "person":      "#06D6A0",
}

# ── CAMEO EVENT CODE → READABLE LABEL ─────────────────────────────────────────
CAMEO_MAP = {
    "01": "STATEMENT", "02": "APPEAL", "03": "EXPRESSED INTENT",
    "04": "CONSULTATION", "05": "DIPLOMATIC COOPERATION",
    "06": "MATERIAL COOPERATION", "07": "DIPLOMATIC EXCHANGE",
    "08": "YIELD", "09": "INVESTIGATE", "10": "DEMAND",
    "11": "DISAPPROVE", "12": "REJECT", "13": "THREATEN",
    "14": "PROTEST", "15": "EXHIBIT FORCE", "16": "REDUCE RELATIONS",
    "17": "COERCE", "18": "ASSAULT", "19": "FIGHT",
    "20": "MASS VIOLENCE",
}

# ── KNOWN MAJOR ENTITIES ───────────────────────────────────────────────────────
MAJOR_COUNTRIES = {
    "IND": ("India", "geopolitics"),
    "CHN": ("China", "geopolitics"),
    "USA": ("United States", "geopolitics"),
    "RUS": ("Russia", "geopolitics"),
    "PAK": ("Pakistan", "geopolitics"),
    "GBR": ("United Kingdom", "geopolitics"),
    "FRA": ("France", "geopolitics"),
    "DEU": ("Germany", "geopolitics"),
    "JPN": ("Japan", "geopolitics"),
    "KOR": ("South Korea", "geopolitics"),
    "ISR": ("Israel", "geopolitics"),
    "IRN": ("Iran", "geopolitics"),
    "SAU": ("Saudi Arabia", "geopolitics"),
    "TUR": ("Turkey", "geopolitics"),
    "BRA": ("Brazil", "geopolitics"),
    "AUS": ("Australia", "geopolitics"),
    "CAN": ("Canada", "geopolitics"),
    "UAE": ("UAE", "geopolitics"),
    "TWN": ("Taiwan", "geopolitics"),
    "UKR": ("Ukraine", "geopolitics"),
    "NGA": ("Nigeria", "geopolitics"),
    "ZAF": ("South Africa", "geopolitics"),
    "IDN": ("Indonesia", "geopolitics"),
    "MEX": ("Mexico", "geopolitics"),
    "ARG": ("Argentina", "geopolitics"),
    "EGY": ("Egypt", "geopolitics"),
    "THA": ("Thailand", "geopolitics"),
    "MYS": ("Malaysia", "geopolitics"),
    "SGP": ("Singapore", "geopolitics"),
    "BGD": ("Bangladesh", "geopolitics"),
}

MAJOR_ORGS = [
    ("UN", "United Nations", "organization"),
    ("NATO", "NATO", "defense"),
    ("QUAD", "QUAD Alliance", "defense"),
    ("BRICS", "BRICS", "economics"),
    ("WTO", "World Trade Organization", "economics"),
    ("IMF", "IMF", "economics"),
    ("WORLDBANK", "World Bank", "economics"),
    ("OPEC", "OPEC", "economics"),
    ("SCO", "Shanghai Cooperation Org", "geopolitics"),
    ("G20", "G20", "economics"),
    ("G7", "G7", "economics"),
    ("ASEAN", "ASEAN", "geopolitics"),
    ("EU", "European Union", "geopolitics"),
    ("AU", "African Union", "geopolitics"),
    ("IAEA", "IAEA", "defense"),
    ("WHO", "World Health Organization", "society"),
    ("NSA", "US NSA", "defense"),
    ("RAW", "India RAW", "defense"),
    ("MOSSAD", "Mossad", "defense"),
    ("CIA", "CIA", "defense"),
    ("ISRO", "ISRO", "technology"),
    ("NASA", "NASA", "technology"),
    ("ESA", "ESA", "technology"),
    ("OPENAI", "OpenAI", "technology"),
    ("MICROSOFT", "Microsoft", "technology"),
    ("GOOGLE", "Google", "technology"),
    ("META", "Meta", "technology"),
    ("TSMC", "TSMC", "technology"),
    ("SAMSUNG", "Samsung", "technology"),
    ("NVIDIA", "NVIDIA", "technology"),
    ("IPCC", "IPCC", "climate"),
    ("UNFCCC", "UNFCCC", "climate"),
    ("GREENPEACE", "Greenpeace", "climate"),
]

TOPICS = [
    ("OIL_SUPPLY", "Oil Supply", "economics"),
    ("SEMICONDUCTORS", "Semiconductors", "technology"),
    ("NUCLEAR_WEAPONS", "Nuclear Weapons", "defense"),
    ("CYBER_WARFARE", "Cyber Warfare", "defense"),
    ("BELT_ROAD", "Belt & Road Initiative", "economics"),
    ("ARCTIC", "Arctic Territory", "geopolitics"),
    ("SOUTH_CHINA_SEA", "South China Sea", "geopolitics"),
    ("LAC_BORDER", "LAC Border", "defense"),
    ("KASHMIR", "Kashmir", "geopolitics"),
    ("UKRAINE_WAR", "Ukraine War", "defense"),
    ("GAZA", "Gaza Conflict", "defense"),
    ("AI_RACE", "AI Arms Race", "technology"),
    ("SPACE_RACE", "Space Race", "technology"),
    ("CLIMATE_CRISIS", "Climate Crisis", "climate"),
    ("FOOD_SECURITY", "Food Security", "society"),
    ("WATER_SCARCITY", "Water Scarcity", "climate"),
    ("MONSOON", "Indian Monsoon", "climate"),
    ("INFLATION", "Global Inflation", "economics"),
    ("DEDOLLARIZATION", "De-dollarization", "economics"),
    ("RARE_EARTH", "Rare Earth Minerals", "economics"),
    ("LITHIUM", "Lithium Supply Chain", "economics"),
    ("DRONE_WARFARE", "Drone Warfare", "defense"),
    ("BIO_WEAPONS", "Bioweapons Risk", "defense"),
    ("DISINFORMATION", "Disinformation Ops", "society"),
    ("MIGRATION", "Migration Crisis", "society"),
    ("PANDEMIC_PREP", "Pandemic Preparedness", "society"),
    ("FINANCIAL_CRISIS", "Financial Contagion", "economics"),
    ("CPEC", "CPEC", "economics"),
    ("QUAD_EXPANSION", "QUAD Expansion", "defense"),
    ("ICET", "iCET Alliance", "technology"),
]

# ── BUILD NODES ────────────────────────────────────────────────────────────────
nodes = []
node_ids = set()

def add_node(id, label, type, domain, size=10, attributes=None):
    if id not in node_ids:
        node_ids.add(id)
        nodes.append({
            "id": id,
            "label": label,
            "type": type,
            "domain": domain,
            "size": size,
            "color": DOMAIN_COLORS.get(domain, "#888888"),
            "attributes": attributes or {}
        })

for code, (name, domain) in MAJOR_COUNTRIES.items():
    size = 22 if code in ["IND", "CHN", "USA", "RUS"] else 16
    add_node(code, name, "nation", domain, size)

for id, name, domain in MAJOR_ORGS:
    add_node(id, name, "organization", domain, 14)

for id, name, domain in TOPICS:
    add_node(id, name, "topic", domain, 12)

print(f"  Base nodes: {len(nodes)}")

# ── DOWNLOAD GDELT ─────────────────────────────────────────────────────────────
print("Downloading GDELT data...")

gdelt_edges = []

try:
    csv_urls = []
    for masterlist_url in [
        "http://data.gdeltproject.org/gdeltv2/masterfilelist.txt",
        "http://data.gdeltproject.org/gdeltv2/masterfilelist-translation.txt",
    ]:
        try:
            print(f"  Fetching master list: {masterlist_url.split('/')[-1]}")
            master = requests.get(masterlist_url, timeout=20)
            all_lines = master.text.strip().split("\n")
            recent_lines = all_lines[-96:]
            for line in recent_lines:
                parts = line.strip().split(" ")
                if len(parts) == 3 and parts[2].endswith(".export.CSV.zip"):
                    csv_urls.append(parts[2])
        except Exception as e:
            print(f"  Masterlist failed: {e}")
            continue

    print(f"  Found {len(csv_urls)} files to process...")

    count = 0
    for csv_url in csv_urls:
        if count >= 15000:
            break
        try:
            r2 = requests.get(csv_url, timeout=30)
            z = zipfile.ZipFile(io.BytesIO(r2.content))
            csv_name = z.namelist()[0]

            with z.open(csv_name) as f:
                reader = csv.reader(io.TextIOWrapper(f, encoding='utf-8', errors='replace'), delimiter='\t')

                for row in reader:
                    if len(row) < 58:
                        continue
                    try:
                        actor1_code = row[7].strip()
                        actor1_name = row[6].strip()
                        actor2_code = row[17].strip()
                        actor2_name = row[16].strip()
                        event_code  = row[26].strip()
                        goldstein   = row[30].strip()
                        mentions    = row[31].strip()
                        source_url  = row[57].strip()

                        if not actor1_code or not actor2_code:
                            continue
                        if actor1_code == actor2_code:
                            continue
                        if len(actor1_code) != 3 or len(actor2_code) != 3:
                            continue

                        if actor1_code not in node_ids and actor1_name:
                            clean = actor1_name.title()[:30]
                            add_node(actor1_code, clean, "nation", "geopolitics", 10)
                        if actor2_code not in node_ids and actor2_name:
                            clean = actor2_name.title()[:30]
                            add_node(actor2_code, clean, "nation", "geopolitics", 10)

                        event_prefix = event_code[:2] if len(event_code) >= 2 else "01"
                        rel_label = CAMEO_MAP.get(event_prefix, "INTERACTION")

                        try:
                            g_val = float(goldstein)
                            strength = (g_val + 10) / 20
                        except:
                            strength = 0.5

                        try:
                            m_val = min(int(mentions), 100)
                        except:
                            m_val = 1

                        gdelt_edges.append({
                            "source": actor1_code,
                            "target": actor2_code,
                            "label": rel_label,
                            "strength": round(strength, 2),
                            "mentions": m_val,
                            "source_url": source_url[:120] if source_url else "",
                            "domain": "geopolitics",
                            "color": "#E63946" if strength < 0.4 else "#F4A261" if strength < 0.6 else "#2DC653"
                        })
                        count += 1
                        if count >= 15000:
                            break
                    except:
                        continue
        except:
            continue

    print(f"  GDELT edges loaded: {len(gdelt_edges)}")

except Exception as e:
    print(f"  GDELT download failed ({e}), continuing with manual edges")

# ── MANUAL HARDCODED EDGES (always added) ─────────────────────────────────────
manual_edges = [
    ("IND", "CHN", "BORDER DISPUTE", 0.15, "defense"),
    ("IND", "USA", "STRATEGIC PARTNER", 0.82, "geopolitics"),
    ("IND", "RUS", "ARMS SUPPLIER", 0.75, "defense"),
    ("IND", "PAK", "CONFLICT ZONE", 0.08, "defense"),
    ("IND", "OPEC", "OIL DEPENDENT", 0.6, "economics"),
    ("IND", "BRICS", "MEMBER", 0.7, "economics"),
    ("IND", "QUAD", "MEMBER", 0.78, "defense"),
    ("IND", "SCO", "MEMBER", 0.55, "geopolitics"),
    ("IND", "G20", "MEMBER", 0.8, "economics"),
    ("IND", "SEMICONDUCTORS", "SUPPLY CHAIN RISK", 0.3, "technology"),
    ("IND", "CLIMATE_CRISIS", "VULNERABLE", 0.4, "climate"),
    ("IND", "MONSOON", "DEPENDENT", 0.6, "climate"),
    ("IND", "ISRO", "OPERATES", 0.9, "technology"),
    ("IND", "ICET", "CONSIDERING", 0.5, "technology"),
    ("IND", "LAC_BORDER", "DISPUTED", 0.2, "defense"),
    ("IND", "KASHMIR", "CLAIMS", 0.3, "geopolitics"),
    ("IND", "OIL_SUPPLY", "IMPORTS", 0.6, "economics"),
    ("IND", "DEDOLLARIZATION", "PURSUING", 0.65, "economics"),
    ("IND", "CPEC", "OPPOSES", 0.15, "economics"),
    ("IND", "AI_RACE", "ENTERING", 0.6, "technology"),
    ("IND", "SPACE_RACE", "COMPETING", 0.75, "technology"),
    ("IND", "RARE_EARTH", "SEEKING", 0.55, "economics"),
    ("IND", "FOOD_SECURITY", "AT RISK", 0.45, "society"),
    ("IND", "WATER_SCARCITY", "THREATENED", 0.4, "climate"),
    ("IND", "DISINFORMATION", "TARGETED", 0.35, "society"),
    ("IND", "QUAD_EXPANSION", "SUPPORTS", 0.7, "defense"),
    ("CHN", "USA", "STRATEGIC RIVALRY", 0.1, "geopolitics"),
    ("CHN", "RUS", "ALLIED", 0.72, "geopolitics"),
    ("CHN", "PAK", "CPEC ALLY", 0.85, "economics"),
    ("CHN", "TWN", "CLAIMS TERRITORY", 0.05, "defense"),
    ("CHN", "NATO", "ADVERSARIAL", 0.15, "defense"),
    ("CHN", "SEMICONDUCTORS", "DOMINATES", 0.85, "technology"),
    ("CHN", "BELT_ROAD", "LEADS", 0.92, "economics"),
    ("CHN", "SCO", "LEADS", 0.88, "geopolitics"),
    ("CHN", "SOUTH_CHINA_SEA", "CLAIMS", 0.1, "defense"),
    ("CHN", "AI_RACE", "LEADING", 0.85, "technology"),
    ("CHN", "RARE_EARTH", "CONTROLS", 0.9, "economics"),
    ("CHN", "CYBER_WARFARE", "CONDUCTS", 0.3, "defense"),
    ("CHN", "CPEC", "LEADS", 0.95, "economics"),
    ("CHN", "BRICS", "LEADS", 0.8, "economics"),
    ("CHN", "SPACE_RACE", "LEADING", 0.82, "technology"),
    ("CHN", "LITHIUM", "DOMINATES", 0.88, "economics"),
    ("USA", "NATO", "LEADS", 0.92, "defense"),
    ("USA", "QUAD", "LEADS", 0.85, "defense"),
    ("USA", "G7", "MEMBER", 0.9, "economics"),
    ("USA", "IMF", "CONTROLS", 0.85, "economics"),
    ("USA", "WORLDBANK", "CONTROLS", 0.82, "economics"),
    ("USA", "SEMICONDUCTORS", "RESTRICTING", 0.7, "technology"),
    ("USA", "AI_RACE", "LEADING", 0.9, "technology"),
    ("USA", "ICET", "LEADS", 0.9, "technology"),
    ("USA", "NUCLEAR_WEAPONS", "POSSESSES", 0.8, "defense"),
    ("USA", "CYBER_WARFARE", "CONDUCTS", 0.7, "defense"),
    ("USA", "NSA", "OPERATES", 0.9, "defense"),
    ("USA", "NASA", "OPERATES", 0.95, "technology"),
    ("USA", "SPACE_RACE", "LEADING", 0.88, "technology"),
    ("USA", "UKRAINE_WAR", "SUPPORTS UKRAINE", 0.8, "defense"),
    ("USA", "DEDOLLARIZATION", "THREATENED BY", 0.3, "economics"),
    ("RUS", "UKR", "WAR", 0.02, "defense"),
    ("RUS", "NATO", "ADVERSARIAL", 0.05, "defense"),
    ("RUS", "NUCLEAR_WEAPONS", "POSSESSES", 0.8, "defense"),
    ("RUS", "OIL_SUPPLY", "MAJOR SUPPLIER", 0.85, "economics"),
    ("RUS", "ARCTIC", "CLAIMS", 0.8, "geopolitics"),
    ("RUS", "UKRAINE_WAR", "CONDUCTING", 0.05, "defense"),
    ("RUS", "BRICS", "MEMBER", 0.7, "economics"),
    ("RUS", "SCO", "MEMBER", 0.75, "geopolitics"),
    ("RUS", "CYBER_WARFARE", "CONDUCTS", 0.2, "defense"),
    ("PAK", "KASHMIR", "CLAIMS", 0.2, "geopolitics"),
    ("PAK", "NUCLEAR_WEAPONS", "POSSESSES", 0.7, "defense"),
    ("ISR", "GAZA", "WAR", 0.05, "defense"),
    ("IRN", "NUCLEAR_WEAPONS", "DEVELOPING", 0.35, "defense"),
    ("IRN", "OIL_SUPPLY", "SUPPLIER", 0.65, "economics"),
    ("SAU", "OPEC", "LEADS", 0.9, "economics"),
    ("SAU", "OIL_SUPPLY", "CONTROLS", 0.88, "economics"),
    ("TWN", "SEMICONDUCTORS", "PRODUCES", 0.92, "technology"),
    ("TWN", "TSMC", "HOSTS", 0.95, "technology"),
    ("KOR", "SEMICONDUCTORS", "PRODUCES", 0.82, "technology"),
    ("KOR", "SAMSUNG", "HOSTS", 0.9, "technology"),
    ("DEU", "EU", "LEADS", 0.85, "geopolitics"),
    ("DEU", "NATO", "MEMBER", 0.8, "defense"),
    ("JPN", "QUAD", "MEMBER", 0.82, "defense"),
    ("AUS", "QUAD", "MEMBER", 0.8, "defense"),
    ("AUS", "RARE_EARTH", "PRODUCES", 0.75, "economics"),
    ("BRA", "BRICS", "MEMBER", 0.72, "economics"),
    ("ZAF", "BRICS", "MEMBER", 0.68, "economics"),
    ("UAE", "OIL_SUPPLY", "SUPPLIER", 0.8, "economics"),
    ("OPEC", "OIL_SUPPLY", "CONTROLS", 0.92, "economics"),
    ("OPEC", "INFLATION", "INFLUENCES", 0.75, "economics"),
    ("CLIMATE_CRISIS", "FOOD_SECURITY", "THREATENS", 0.6, "climate"),
    ("CLIMATE_CRISIS", "WATER_SCARCITY", "CAUSES", 0.72, "climate"),
    ("CLIMATE_CRISIS", "MONSOON", "DISRUPTS", 0.65, "climate"),
    ("AI_RACE", "SEMICONDUCTORS", "DRIVES DEMAND", 0.88, "technology"),
    ("AI_RACE", "CYBER_WARFARE", "ENABLES", 0.7, "defense"),
    ("SPACE_RACE", "ISRO", "INCLUDES", 0.85, "technology"),
    ("SPACE_RACE", "NASA", "INCLUDES", 0.9, "technology"),
    ("INFLATION", "FOOD_SECURITY", "WORSENS", 0.7, "economics"),
    ("DEDOLLARIZATION", "BRICS", "LED BY", 0.75, "economics"),
    ("BELT_ROAD", "CPEC", "INCLUDES", 0.9, "economics"),
    ("DRONE_WARFARE", "UKRAINE_WAR", "USED IN", 0.85, "defense"),
    ("DISINFORMATION", "UKRAINE_WAR", "USED IN", 0.78, "society"),
    ("MIGRATION", "CLIMATE_CRISIS", "CAUSED BY", 0.65, "society"),
    ("PANDEMIC_PREP", "WHO", "COORDINATED BY", 0.8, "society"),
    ("FINANCIAL_CRISIS", "IMF", "MANAGED BY", 0.75, "economics"),
    ("IAEA", "NUCLEAR_WEAPONS", "MONITORS", 0.85, "defense"),
    ("IAEA", "IRN", "INSPECTS", 0.7, "defense"),
    ("QUAD_EXPANSION", "QUAD", "EXPANDS", 0.8, "defense"),
    ("ICET", "SEMICONDUCTORS", "GOVERNS", 0.82, "technology"),
    ("ICET", "AI_RACE", "GOVERNS", 0.75, "technology"),
    ("OPENAI", "AI_RACE", "LEADS", 0.88, "technology"),
    ("GOOGLE", "AI_RACE", "COMPETING", 0.82, "technology"),
    ("META", "AI_RACE", "COMPETING", 0.75, "technology"),
    ("MICROSOFT", "AI_RACE", "COMPETING", 0.85, "technology"),
    ("NVIDIA", "SEMICONDUCTORS", "PRODUCES", 0.9, "technology"),
    ("NVIDIA", "AI_RACE", "ENABLES", 0.92, "technology"),
    ("TSMC", "SEMICONDUCTORS", "PRODUCES", 0.95, "technology"),
    ("SAMSUNG", "SEMICONDUCTORS", "PRODUCES", 0.85, "technology"),
    ("GREENPEACE", "CLIMATE_CRISIS", "FIGHTS", 0.8, "climate"),
    ("IPCC", "CLIMATE_CRISIS", "MONITORS", 0.9, "climate"),
    ("UNFCCC", "CLIMATE_CRISIS", "GOVERNS", 0.85, "climate"),
    ("RAW", "PAK", "MONITORS", 0.5, "defense"),
    ("RAW", "CHN", "MONITORS", 0.5, "defense"),
    ("MOSSAD", "IRN", "MONITORS", 0.5, "defense"),
    ("CIA", "RUS", "MONITORS", 0.5, "defense"),
]

for src, tgt, label, strength, domain in manual_edges:
    if src in node_ids and tgt in node_ids:
        gdelt_edges.append({
            "source": src,
            "target": tgt,
            "label": label,
            "strength": strength,
            "mentions": 50,
            "source_url": "",
            "domain": domain,
            "color": "#E63946" if strength < 0.35 else "#F4A261" if strength < 0.6 else "#2DC653"
        })

# ── DEDUPLICATE EDGES (keep different relationship types between same pair) ────
seen_pairs = set()
final_edges = []
for e in gdelt_edges:
    key = (tuple(sorted([e["source"], e["target"]])), e["label"])
    if key not in seen_pairs and e["source"] in node_ids and e["target"] in node_ids:
        seen_pairs.add(key)
        final_edges.append(e)

# ── WORLD BANK COUNTRY ATTRIBUTES ─────────────────────────────────────────────
print("Fetching World Bank data...")

WB_INDICATORS = {
    "NY.GDP.MKTP.CD": "gdp_usd",
    "SP.POP.TOTL":    "population",
    "MS.MIL.XPND.CD": "military_spend_usd",
}

wb_data = defaultdict(dict)

country_codes_wb = {
    "IND": "IN", "CHN": "CN", "USA": "US", "RUS": "RU",
    "PAK": "PK", "GBR": "GB", "FRA": "FR", "DEU": "DE",
    "JPN": "JP", "KOR": "KR", "ISR": "IL", "IRN": "IR",
    "SAU": "SA", "TUR": "TR", "BRA": "BR", "AUS": "AU",
    "CAN": "CA", "UAE": "AE", "TWN": "TW", "UKR": "UA",
}

for indicator, field in WB_INDICATORS.items():
    try:
        codes = ";".join(country_codes_wb.values())
        url = f"https://api.worldbank.org/v2/country/{codes}/indicator/{indicator}?format=json&mrv=1&per_page=50"
        r = requests.get(url, timeout=10)
        data = r.json()
        if len(data) > 1 and data[1]:
            for item in data[1]:
                if item.get("value") and item.get("countryiso3code"):
                    iso3 = item["countryiso3code"]
                    for our_code, wb_code in country_codes_wb.items():
                        if item.get("countryiso3code") == iso3 or item.get("country", {}).get("id") == wb_code:
                            wb_data[our_code][field] = item["value"]
    except Exception as e:
        print(f"  WB indicator {indicator} failed: {e}")

for node in nodes:
    if node["id"] in wb_data:
        node["attributes"].update(wb_data[node["id"]])

print(f"  World Bank data attached to {len(wb_data)} countries")

# ── ASSIGN CLUSTER POSITIONS ───────────────────────────────────────────────────
DOMAIN_CLUSTER = {
    "geopolitics": {"cx": 0,    "cy": 0},
    "economics":   {"cx": 300,  "cy": 200},
    "defense":     {"cx": -300, "cy": -200},
    "technology":  {"cx": 300,  "cy": -200},
    "climate":     {"cx": -300, "cy": 200},
    "society":     {"cx": 0,    "cy": 300},
    "organization":{"cx": 0,    "cy": -300},
    "person":      {"cx": 200,  "cy": 0},
}

import math, random
random.seed(42)

for node in nodes:
    cluster = DOMAIN_CLUSTER.get(node["domain"], {"cx": 0, "cy": 0})
    angle = random.uniform(0, 2 * math.pi)
    radius = random.uniform(20, 120)
    node["x"] = cluster["cx"] + math.cos(angle) * radius
    node["y"] = cluster["cy"] + math.sin(angle) * radius
    node["z"] = random.uniform(-80, 80)

# ── SAVE ───────────────────────────────────────────────────────────────────────
output_dir = "data"
os.makedirs(output_dir, exist_ok=True)

with open(os.path.join(output_dir, "nodes.json"), "w", encoding="utf-8") as f:
    json.dump(nodes, f, indent=2, ensure_ascii=False)

with open(os.path.join(output_dir, "edges.json"), "w", encoding="utf-8") as f:
    json.dump(final_edges, f, indent=2, ensure_ascii=False)

print(f"\n✅ Done!")
print(f"   Nodes: {len(nodes)}")
print(f"   Edges: {len(final_edges)}")
print(f"   Saved to data/nodes.json and data/edges.json")