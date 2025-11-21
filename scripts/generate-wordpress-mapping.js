// Script to generate WordPress hreflang mapping
// Parses TW sitemap and matches with HK slugs

const fs = require('fs');
const https = require('https');

// HK slugs (from HK sitemap - already extracted)
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

// Normalize slug for matching
function normalizeSlug(slug) {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Normalize merchant name to slug format
function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Fetch and parse TW sitemap
function fetchTWSitemap() {
  return new Promise((resolve, reject) => {
    https.get('https://dealy.tw/shop-sitemap.xml', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        // Parse XML to extract TW slugs
        const twSlugs = [];
        const urlPattern = /<loc>https?:\/\/[^\/]+\/shop\/([^<]+)<\/loc>/gi;
        let match;
        while ((match = urlPattern.exec(data)) !== null) {
          twSlugs.push(match[1].trim());
        }
        resolve(twSlugs);
      });
    }).on('error', reject);
  });
}

// Generate mapping
async function generateMapping() {
  console.log('Fetching TW sitemap...');
  const twSlugs = await fetchTWSitemap();
  console.log(`Found ${twSlugs.length} TW merchants`);
  
  const mapping = {};
  
  // Try to match HK slugs with TW slugs
  for (const hkSlug of hkSlugs) {
    const normalizedHK = normalizeSlug(hkSlug);
    
    // Try exact match first
    if (twSlugs.includes(hkSlug)) {
      mapping[hkSlug] = hkSlug;
      continue;
    }
    
    // Try normalized match
    const match = twSlugs.find(tw => normalizeSlug(tw) === normalizedHK);
    if (match) {
      mapping[hkSlug] = match;
      continue;
    }
    
    // Try partial match (remove -hk, -hk suffix, etc.)
    const hkBase = hkSlug.replace(/-hk$/, '').replace(/^hk-/, '');
    const partialMatch = twSlugs.find(tw => {
      const twBase = tw.replace(/-tw$/, '').replace(/^tw-/, '');
      return normalizeSlug(twBase) === normalizeSlug(hkBase);
    });
    
    if (partialMatch) {
      mapping[hkSlug] = partialMatch;
    }
  }
  
  console.log(`\nGenerated ${Object.keys(mapping).length} mappings`);
  console.log('\nMappings:');
  console.log(JSON.stringify(mapping, null, 2));
  
  // Generate PHP code
  let phpCode = '<?php\n';
  phpCode += '/**\n';
  phpCode += ' * HK slug → TW slug mapping\n';
  phpCode += ' * Auto-generated from sitemaps\n';
  phpCode += ' */\n';
  phpCode += 'function dealy_get_hk_to_tw_mapping() {\n';
  phpCode += '    return [\n';
  
  for (const [hk, tw] of Object.entries(mapping)) {
    phpCode += `        '${hk}' => '${tw}',\n`;
  }
  
  phpCode += '    ];\n';
  phpCode += '}\n';
  
  fs.writeFileSync('wordpress-mapping.php', phpCode);
  console.log('\n✅ Generated wordpress-mapping.php');
}

generateMapping().catch(console.error);

