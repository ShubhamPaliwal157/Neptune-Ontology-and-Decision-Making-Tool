/**
 * Quick test for the NLP signal extraction layer
 * Run: node scraper/test-nlp.mjs
 */
import { extractSignalText } from '../lib/scraper/normalizer.js'

// Simulated noisy article text (mix of real content + boilerplate)
const noisyText = `
Cookie policy. Subscribe to our newsletter. Click here to read more. All rights reserved 2024.

Iran has significantly expanded its ballistic missile program, with new facilities identified near Tehran capable of producing medium-range missiles with a range of 2,000 km. The Islamic Revolutionary Guard Corps (IRGC) has been linked to at least 14 child labour violations in textile factories across Isfahan province, according to a UN report published in March 2024.

Sign up for our daily newsletter. Advertisement. Loading...

The United Nations Children's Fund (UNICEF) estimates that over 1.2 million children aged 10-14 are engaged in hazardous labour in Iran, primarily in carpet weaving, brick kilns, and agricultural sectors. Iran's government has denied these allegations, stating that child protection laws enacted in 2022 have reduced child labour by 34%.

Follow us on social media. Share this article. Terms of service apply.

Human Rights Watch documented 47 cases of children under 12 working in gold mines in the Yazd province during 2023. The International Labour Organization (ILO) has called on Iran to ratify Convention 182 on the worst forms of child labour, which Tehran has repeatedly refused to do.

Read more about this topic. Privacy policy. JavaScript must be enabled.

Afghanistan and Pakistan face similar challenges, with cross-border trafficking of children for labour purposes increasing by 28% in 2023 according to UNODC data. The Taliban government in Afghanistan has actively dismantled child protection agencies since 2021.

Subscribe now for full access.

NGOs operating in the region report that children as young as 7 are being employed in brick kilns in Balochistan, earning less than $1 per day. The Pakistani government allocated $45 million in 2024 for child labour elimination programs, though implementation remains weak.
`

console.log('=== INPUT ===')
console.log(`Length: ${noisyText.length} chars`)
console.log(`Sentences: ~${noisyText.split(/[.!?]/).length}`)

console.log('\n=== OUTPUT (NLP filtered) ===')
const result = extractSignalText(noisyText, 'society', 30)
console.log(`Length: ${result.length} chars (${Math.round(result.length / noisyText.length * 100)}% of original)`)
console.log('\n--- Filtered text ---')
console.log(result)

// Test with geopolitics domain
const geopoliticsText = `
Welcome to our site. Cookie notice. Subscribe.

Russia launched a major offensive in eastern Ukraine on Tuesday, deploying over 50,000 troops along the Kharkiv front. President Putin signed a new decree authorizing the mobilization of 150,000 additional reservists. NATO Secretary General Jens Stoltenberg condemned the attack and called an emergency meeting of the North Atlantic Council in Brussels.

Click here for more. Advertisement.

The United States announced a $2.3 billion military aid package for Ukraine, including 120 M1 Abrams tanks and advanced HIMARS rocket systems. Germany pledged an additional €1.8 billion in support. China urged restraint from all parties while continuing to supply dual-use technology to Russia worth an estimated $300 million per month.

Read more. All rights reserved.

The UN Security Council held an emergency session where Russia vetoed a resolution demanding immediate ceasefire. France and the United Kingdom proposed a new sanctions package targeting Russian energy exports, which currently generate $180 million per day for the Kremlin.
`

console.log('\n\n=== GEOPOLITICS TEST ===')
const geoResult = extractSignalText(geopoliticsText, 'geopolitics', 30)
console.log(`Input: ${geopoliticsText.length} chars → Output: ${geoResult.length} chars (${Math.round(geoResult.length / geopoliticsText.length * 100)}% of original)`)
console.log('\n--- Filtered text ---')
console.log(geoResult)
