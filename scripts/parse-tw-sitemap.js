// Parse TW sitemap and match with HK slugs

const twSitemap = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<script id="eppiocemhmnlbhjplcgkofciiegomcon"/>
<script/>
<script/>
<url>
<loc>https://www.dealy.tw/shop/adidas.com.tw</loc>
<lastmod>2025-11-20T22:13:18.718Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/agoda.com</loc>
<lastmod>2025-11-13T20:56:33.390Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/amazon.co.jp</loc>
<lastmod>2025-11-18T19:16:57.357Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/asos.com</loc>
<lastmod>2025-11-13T20:56:49.400Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/bobbibrown.com.tw</loc>
<lastmod>2025-11-18T19:32:14.561Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/booking.com</loc>
<lastmod>2025-11-13T20:57:13.165Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/buyee.jp</loc>
<lastmod>2025-11-13T20:57:21.398Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/calvinklein.com.tw</loc>
<lastmod>2025-11-19T21:39:35.662Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/carrefour.com.tw</loc>
<lastmod>2025-11-13T20:57:40.002Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/casetify.com</loc>
<lastmod>2025-11-17T22:44:03.180Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/champion.com</loc>
<lastmod>2025-11-13T20:57:58.320Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/chow-sang-sang-tw</loc>
<lastmod>2025-11-19T23:28:36.616Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/clinique.com.tw</loc>
<lastmod>2025-11-19T23:34:53.600Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/cos.com</loc>
<lastmod>2025-11-20T23:40:09.223Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/cosmebear.tw</loc>
<lastmod>2025-11-13T20:58:40.860Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/tw.coupang.com</loc>
<lastmod>2025-11-20T23:43:52.224Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/dyson.tw</loc>
<lastmod>2025-11-13T20:59:16.970Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/eatigo.com</loc>
<lastmod>2025-11-19T21:15:13.636Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/elemis.com.tw</loc>
<lastmod>2025-11-19T21:15:33.415Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/emirates.com</loc>
<lastmod>2025-11-13T21:01:24.468Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/endclothing.com</loc>
<lastmod>2025-11-13T21:02:12.851Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/esteelauder.com.tw</loc>
<lastmod>2025-11-13T21:02:28.749Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/expedia.com.tw</loc>
<lastmod>2025-11-13T21:02:46.566Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/expressvpn.com</loc>
<lastmod>2025-11-13T21:03:28.679Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/farfetch.com</loc>
<lastmod>2025-11-13T21:09:14.880Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/fila.com.tw</loc>
<lastmod>2025-11-13T21:09:30.367Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/harveynichols.com</loc>
<lastmod>2025-11-13T21:09:44.548Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/tw.hotels.com</loc>
<lastmod>2025-11-13T21:10:03.780Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/tw.iherb.com</loc>
<lastmod>2025-11-13T21:10:20.454Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/hk.iteshop.com</loc>
<lastmod>2025-11-13T21:10:32.873Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/jomalone.com.tw</loc>
<lastmod>2025-11-13T21:10:48.157Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/kkday.com</loc>
<lastmod>2025-11-18T20:19:31.592Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/klook.com</loc>
<lastmod>2025-11-18T20:25:37.605Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/lamer.com.tw</loc>
<lastmod>2025-11-18T22:24:47.054Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/lenovo.com</loc>
<lastmod>2025-11-19T21:40:54.780Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/lg.com</loc>
<lastmod>2025-11-13T21:34:29.261Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/lookfantastic.com</loc>
<lastmod>2025-11-13T21:36:24.825Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/lovebonito.com</loc>
<lastmod>2025-11-13T21:37:31.712Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/loveiizakka.com</loc>
<lastmod>2025-11-13T21:38:28.444Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/maccosmetics.com.tw</loc>
<lastmod>2025-11-13T21:39:17.090Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/mr-porter-tw</loc>
<lastmod>2025-11-13T21:40:19.400Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/tw.msi.com</loc>
<lastmod>2025-11-13T21:18:30.604Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/net-a-porter.com</loc>
<lastmod>2025-11-13T21:41:30.436Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/nike.com</loc>
<lastmod>2025-11-13T21:42:33.989Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/nordvpn.com</loc>
<lastmod>2025-11-13T21:43:44.214Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/global.oliveyoung.com</loc>
<lastmod>2025-11-13T21:19:30.868Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/pinkoi.com</loc>
<lastmod>2025-11-13T21:44:29.065Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/pizzahut.com.tw</loc>
<lastmod>2025-11-13T21:47:20.975Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/ralphlauren.com.tw</loc>
<lastmod>2025-11-13T22:59:06.690Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/tw.puma.com</loc>
<lastmod>2025-11-13T23:01:14.755Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/qatarairways.com</loc>
<lastmod>2025-11-13T23:04:33.886Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/qmomo.com.tw</loc>
<lastmod>2025-11-13T23:05:40.804Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/rakuten.com.tw</loc>
<lastmod>2025-11-19T21:15:54.933Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/travel.rakuten.com</loc>
<lastmod>2025-11-19T21:18:39.228Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/rentalcars.com</loc>
<lastmod>2025-11-13T23:13:04.866Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/samsung.com</loc>
<lastmod>2025-11-13T23:15:10.432Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/sephora.com</loc>
<lastmod>2025-11-13T23:17:07.581Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/shopee.tw</loc>
<lastmod>2025-11-19T21:42:22.252Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/strawberrynet.com</loc>
<lastmod>2025-11-13T23:23:09.078Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/surfshark.com</loc>
<lastmod>2025-11-13T23:26:19.568Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/swarovski.com</loc>
<lastmod>2025-11-13T23:29:11.914Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/taobao.com</loc>
<lastmod>2025-11-13T23:51:04.286Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/thebodyshop.com.tw</loc>
<lastmod>2025-11-19T21:19:04.250Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/tw.tommy.com</loc>
<lastmod>2025-11-13T23:38:13.810Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/trip.com</loc>
<lastmod>2025-11-13T23:39:28.082Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/ubereats.com</loc>
<lastmod>2025-11-13T23:47:02.305Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/jpmed.com.tw</loc>
<lastmod>2025-11-13T23:48:29.296Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/global-satudora.com</loc>
<lastmod>2025-11-19T20:37:11.582Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/kfcclub.com.tw</loc>
<lastmod>2025-11-13T23:52:35.051Z</lastmod>
</url>
<url>
<loc>https://www.dealy.tw/shop/lancome.com.tw</loc>
<lastmod>2025-11-13T21:30:56.453Z</lastmod>
</url>
</urlset>`;

// HK slugs (from previous extraction)
const hkSlugs = [
  '7-eleven', 'adidas-hk', 'aeon', 'agoda', 'alipay-hk', 'amazon-japan',
  'american-eagle', 'apple', 'arena', 'armani', 'asos', 'birdie',
  'bobbi-brown', 'booking-com', 'bowtie-insurance', 'broadway',
  'buyandship', 'calvin-klein', 'catalog', 'cathay-pacific',
  'charles-keith', 'chow-sang-sang', 'circle-k', 'cityline',
  'clarins', 'clinique', 'code-academy', 'crocs', 'dyson', 'ebay',
  'elecboy', 'emma', 'end-clothing', 'eslite', 'estee-lauder',
  'expedia', 'fancl', 'farfetch', 'fila', 'foodpanda', 'fortress',
  'gethemall', 'gmarket', 'gu', 'hapa-kristin', 'harrods',
  'harvey-nichols', 'hk-express', 'hk-ticketing', 'hktvmall',
  'hopegoo', 'hotels-com', 'hyundai', 'iherb', 'ikea', 'innisfree',
  'jo-malone', 'joint-publishing', 'juice', 'keeta', 'kerastase',
  'kiehls', 'kkday', 'klook', 'lancome', 'lane-crawford', 'laneige',
  'lenovo', 'levis', 'lg', 'loccitane', 'logitech', 'lookfantastic',
  'love-bonito', 'mabelle', 'mac', 'macy', 'mannings', 'marathon',
  'mcafee', 'mcdonalds', 'medicube', 'melvita', 'mentholatum',
  'microsoft', 'msi', 'muji', 'myprotein', 'myvitamins', 'nars',
  'netvigator', 'new-balance', 'nike-hk', 'octopus', 'olay', 'olens',
  'olive-young-global', 'openrice', 'origins', 'parknshop', 'payme',
  'phd', 'pinkoi', 'pizza-hut', 'polo-ralph-lauren', 'price-com',
  'puma', 'qatar-airways', 'qpets', 'rakuten-travel', 'razer',
  'samsung', 'sasa', 'sephora-hk', 'shiseido', 'shopback',
  'shu-uemura', 'sinomax', 'starr-insurance', 'steam',
  'strawberrynet-hk', 'stylevana', 'taobao', 'teva', 'the-body-shop',
  'the-club', 'the-hut', 'the-north-face', 'the-outnet', 'tory-burch',
  'trip-com', 'tsl', 'ugg', 'ulike', 'uniqlo', 'vans', 'watsons',
  'wilson', 'wingon', 'wingon-travel', 'yesstyle', 'yoho', 'ysl-beauty',
  'zalora-hk', 'zinomall'
];

// Extract TW slugs from sitemap
const twSlugs = [];
const urlPattern = /<loc>https?:\/\/[^\/]+\/shop\/([^<]+)<\/loc>/gi;
let match;
while ((match = urlPattern.exec(twSitemap)) !== null) {
  twSlugs.push(match[1].trim());
}

console.log(`Found ${twSlugs.length} TW merchants`);
console.log(`Found ${hkSlugs.length} HK merchants\n`);

// Normalize slug for matching
function normalizeSlug(slug) {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/\.(com|tw|jp|hk)$/, '') // Remove domain extensions
    .replace(/^(tw|hk|global|travel)\./, '') // Remove prefixes
    .replace(/-(tw|hk|com|jp)$/, ''); // Remove suffixes
}

// Extract base name from slug
function getBaseName(slug) {
  return slug
    .replace(/\.(com|tw|jp|hk)$/, '')
    .replace(/^(tw|hk|global|travel)\./, '')
    .replace(/-(tw|hk|com|jp)$/, '')
    .replace(/-/g, '');
}

// Build mapping
const mapping = {};
const unmatchedHK = [];
const unmatchedTW = [...twSlugs];

// Known manual mappings (based on merchant names)
const knownMappings = {
  'farfetch': 'farfetch.com',
  'agoda': 'agoda.com',
  'asos': 'asos.com',
  'booking-com': 'booking.com',
  'expedia': 'expedia.com.tw',
  'hotels-com': 'tw.hotels.com',
  'klook': 'klook.com',
  'kkday': 'kkday.com',
  'trip-com': 'trip.com',
  'rakuten-travel': 'travel.rakuten.com',
  'qatar-airways': 'qatarairways.com',
  'nike-hk': 'nike.com',
  'adidas-hk': 'adidas.com.tw',
  'lookfantastic': 'lookfantastic.com',
  'strawberrynet-hk': 'strawberrynet.com',
  'olive-young-global': 'global.oliveyoung.com',
  'love-bonito': 'lovebonito.com',
  'chow-sang-sang': 'chow-sang-sang-tw',
  'fila': 'fila.com.tw',
  'harvey-nichols': 'harveynichols.com',
  'iherb': 'tw.iherb.com',
  'jo-malone': 'jomalone.com.tw',
  'lenovo': 'lenovo.com',
  'lg': 'lg.com',
  'maccosmetics': 'maccosmetics.com.tw',
  'msi': 'tw.msi.com',
  'pinkoi': 'pinkoi.com',
  'pizza-hut': 'pizzahut.com.tw',
  'polo-ralph-lauren': 'ralphlauren.com.tw',
  'puma': 'tw.puma.com',
  'samsung': 'samsung.com',
  'sephora-hk': 'sephora.com',
  'taobao': 'taobao.com',
  'the-body-shop': 'thebodyshop.com.tw',
  'dyson': 'dyson.tw',
  'clinique': 'clinique.com.tw',
  'estee-lauder': 'esteelauder.com.tw',
  'bobbi-brown': 'bobbibrown.com.tw',
  'calvin-klein': 'calvinklein.com.tw',
  'lancome': 'lancome.com.tw',
  'end-clothing': 'endclothing.com',
};

// Apply known mappings first
for (const [hk, tw] of Object.entries(knownMappings)) {
  if (hkSlugs.includes(hk) && twSlugs.includes(tw)) {
    mapping[hk] = tw;
    unmatchedTW.splice(unmatchedTW.indexOf(tw), 1);
  }
}

// Try to match remaining
for (const hkSlug of hkSlugs) {
  if (mapping[hkSlug]) continue; // Already mapped
  
  const normalizedHK = normalizeSlug(hkSlug);
  const baseHK = getBaseName(hkSlug);
  
  // Try exact match
  if (twSlugs.includes(hkSlug)) {
    mapping[hkSlug] = hkSlug;
    continue;
  }
  
  // Try normalized match
  let found = false;
  for (const twSlug of unmatchedTW) {
    const normalizedTW = normalizeSlug(twSlug);
    const baseTW = getBaseName(twSlug);
    
    if (normalizedHK === normalizedTW || baseHK === baseTW) {
      mapping[hkSlug] = twSlug;
      unmatchedTW.splice(unmatchedTW.indexOf(twSlug), 1);
      found = true;
      break;
    }
  }
  
  if (!found) {
    unmatchedHK.push(hkSlug);
  }
}

console.log(`\n✅ Generated ${Object.keys(mapping).length} mappings`);
console.log(`⚠️  ${unmatchedHK.length} HK merchants without TW match`);
console.log(`⚠️  ${unmatchedTW.length} TW merchants without HK match\n`);

// Generate PHP code
let phpCode = '<?php\n';
phpCode += '/**\n';
phpCode += ' * HK slug → TW slug mapping\n';
phpCode += ' * Auto-generated from sitemaps\n';
phpCode += ' * Generated: ' + new Date().toISOString() + '\n';
phpCode += ' */\n';
phpCode += 'function dealy_get_hk_to_tw_mapping() {\n';
phpCode += '    return [\n';

// Sort by HK slug for easier reading
const sortedMapping = Object.entries(mapping).sort((a, b) => a[0].localeCompare(b[0]));

for (const [hk, tw] of sortedMapping) {
  phpCode += `        '${hk}' => '${tw}',\n`;
}

phpCode += '    ];\n';
phpCode += '}\n';

console.log('PHP Code:\n');
console.log(phpCode);

// Also output JSON for reference
const fs = require('fs');
fs.writeFileSync('hk-to-tw-mapping.json', JSON.stringify(mapping, null, 2));
fs.writeFileSync('hk-to-tw-mapping.php', phpCode);

console.log('\n✅ Generated files:');
console.log('  - hk-to-tw-mapping.json');
console.log('  - hk-to-tw-mapping.php');

if (unmatchedHK.length > 0) {
  console.log('\n⚠️  Unmatched HK merchants:');
  unmatchedHK.forEach(slug => console.log(`  - ${slug}`));
}

