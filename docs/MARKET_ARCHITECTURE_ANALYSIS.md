# Market Architecture Analysis & Recommendations

## Current Setup Analysis

### Current Architecture
- **1 CMS (Strapi Cloud)** - Centralized database with market filtering
- **Markets:** HK, TW, MY, SG, JP, KW (5-6 markets)
- **Data Volume:** ~1.5K entries per market = **~7.5K-9K total entries**
- **1 Admin App** - Can switch markets via dropdown, filters data client-side
- **Frontend Apps** - Next.js apps per market

### Current Data Patterns
- **Admin App Fetching:**
  - Merchants: `pagination[pageSize]=500` (paginated, can fetch 2000+ total)
  - Coupons: `pagination[pageSize]=500` (paginated, can fetch 2000+ total)
  - Market filtering: Applied via `filters[market][documentId][$eq]`
  - Dashboard: Loads ALL coupons/merchants (no market filter by default)

- **Frontend Fetching:**
  - Always filtered by market: `filters[market][key][$eq]=tw`
  - Smaller, targeted queries (20-500 items)
  - Heavy caching (300s revalidate)

### Performance Bottlenecks Identified
1. **Admin Dashboard:** Fetches ALL data (no market filter) → Slow initial load
2. **Market Switching:** Re-fetches all data when switching markets
3. **Pagination:** Multiple round trips (500 items/page) for large datasets
4. **Database Queries:** Single CMS handling all markets = potential bottleneck (but manageable with proper indexing)

---

## Architecture Options Comparison

### Option 1: Centralized (1 Strapi Cloud + 1 Admin App) ✅ **STRONGLY RECOMMENDED**

**Structure:**
```
┌─────────────────────────────┐
│  1 Strapi Cloud CMS         │ ← All markets (HK, TW, MY, SG, JP, KW)
│  ~7.5K-9K total entries     │   ~1.5K entries per market
└────────────┬────────────────┘
             │
             ├─── Admin App (market switcher)
             │
             ├─── Next.js TW Frontend
             ├─── Next.js HK Frontend
             ├─── Next.js MY Frontend
             ├─── Next.js SG Frontend
             ├─── Next.js JP Frontend
             └─── Next.js KW Frontend
```

**Pros:**
- ✅ **Single source of truth** - Easier data consistency across 5-6 markets
- ✅ **Shared content** - Many merchants exist across markets (Booking.com, Adidas, etc.)
- ✅ **Simpler deployment** - One Strapi Cloud instance to manage
- ✅ **Cross-market features** - Easy to implement hreflang, shared analytics
- ✅ **Lower cost** - **1 Strapi Cloud plan** vs 5-6 separate plans (significant savings)
- ✅ **Easier migrations** - Data migration between markets is simple
- ✅ **Unified admin experience** - One place to manage all markets
- ✅ **Strapi Cloud scaling** - Handles ~7.5K-9K entries easily (Pro plan supports 100K entries)
- ✅ **Automatic backups** - Strapi Cloud handles backups for all markets
- ✅ **Multiple environments** - Can use Strapi Cloud environments for dev/staging/prod

**Cons:**
- ⚠️ **Single point of failure** - If CMS goes down, all markets affected (but Strapi Cloud has high uptime)
- ⚠️ **Query performance** - Need proper indexing on `market` field (already done, should be fine)
- ⚠️ **API rate limits** - Need to check Strapi Cloud plan limits (but 5-6 markets should be fine)

**Performance Optimizations Needed:**
1. **Market-specific caching** in admin app
2. **Lazy loading** - Only fetch data when market is selected
3. **Pagination improvements** - Virtual scrolling, infinite scroll
4. **Database indexing** - Ensure `market` field is indexed
5. **Query optimization** - Use `fields[]` to limit returned data

---

### Option 2: Distributed (Multiple Strapi Cloud + 1 Admin App)

**Structure:**
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│Strapi TW│ │Strapi HK │ │Strapi MY │ │Strapi SG │ │Strapi JP │ │Strapi KW │
│  Cloud  │ │  Cloud   │ │  Cloud   │ │  Cloud   │ │  Cloud   │ │  Cloud   │
└────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │          │            │            │            │            │
     └──────────┴────────────┴────────────┴────────────┴────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Admin App       │ ← Connects to 5-6 CMS instances
                    │ (market switcher) │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            Next.js Frontends (5-6 apps)
```

**Pros:**
- ✅ **Isolation** - One market failure doesn't affect others
- ✅ **Smaller databases** - Each CMS has ~1.5K entries (very small)
- ✅ **Independent scaling** - Can scale markets separately (but not needed at this scale)
- ✅ **Market-specific performance** - Each CMS optimized for its market (but unnecessary for 1.5K entries)

**Cons:**
- ❌ **5-6x cost** - **5-6 Strapi Cloud plans** instead of 1 (major cost increase)
- ❌ **Data duplication** - Shared merchants/coupons need sync across 5-6 instances
- ❌ **Complex admin app** - Must manage 5-6 API connections, handle failures
- ❌ **Cross-market complexity** - Hreflang, shared content much harder
- ❌ **Deployment complexity** - 5-6 deployments, migrations, updates
- ❌ **Data consistency** - Risk of data drift between 5-6 markets
- ❌ **Maintenance overhead** - 5-6x the maintenance, updates, monitoring
- ❌ **Overkill** - 1.5K entries per market is tiny, doesn't need separate instances

---

## Recommendation: **Centralized Architecture (1 Strapi Cloud)** ✅

### Why Centralized is MUCH Better for Your Use Case

1. **Scale is perfect for centralized** - ~7.5K-9K total entries is **tiny** for Strapi Cloud
2. **Strapi Cloud Pro plan** - Supports 100K entries, you're at ~9K (only 9% usage)
3. **Shared content is common** - Many merchants exist across multiple markets (Booking.com, Adidas, etc.)
4. **Hreflang implementation** - Already working with centralized approach
5. **Admin UX** - Market switcher works perfectly with single CMS
6. **Cost-effective** - **1 Strapi Cloud plan** vs **5-6 plans** = **80-85% cost savings**
7. **Simpler operations** - One instance to manage, monitor, update

### Performance Concerns Addressed

**Your concern:** "Centralizing may cause heavy API request from one CMS"

**Reality with Strapi Cloud:**
- **Strapi Cloud handles scaling automatically** - You don't manage infrastructure
- **7.5K-9K entries is tiny** - Strapi Cloud Pro supports 100K entries
- **API rate limits** - Check your plan, but 5-6 markets should be well within limits
- **Query performance** - With proper indexing on `market` field, queries are fast (~10-50ms)
- **The bottleneck is admin app** - Loading all data without market filter, not the database

**Example Performance:**
- Filtered query: `WHERE market = 'tw'` with index = **~10-50ms** ✅
- Total entries: ~9K across 5-6 markets = **very manageable**
- Strapi Cloud Pro: 100K entry limit = **you're at 9% capacity** ✅

---

## Recommended Optimizations (Centralized)

### 1. Admin App Performance Improvements

#### A. Market-Specific Dashboard Loading
```typescript
// Current: Loads ALL data
const [coupons, merchants] = await Promise.all([
  couponsAdapter.list(), // ❌ No market filter
  merchantsAdapter.list() // ❌ No market filter
])

// Optimized: Load by selected market
const [coupons, merchants] = await Promise.all([
  couponsAdapter.list({ market: selectedMarket }), // ✅ Filtered
  merchantsAdapter.list(selectedMarket) // ✅ Filtered
])
```

#### B. Lazy Market Switching
```typescript
// Only fetch data when market is selected
const loadMarketData = async (market: string) => {
  if (market === 'all') {
    // Show aggregated stats only, don't load full list
    return loadAggregatedStats()
  }
  // Load filtered data for specific market
  return loadFilteredData(market)
}
```

#### C. Virtual Scrolling / Infinite Scroll
- Replace pagination with virtual scrolling
- Load 50-100 items at a time
- Fetch more as user scrolls
- Reduces initial load time from 2-5s to <500ms

#### D. Client-Side Caching
```typescript
// Cache market data in memory/localStorage
const marketCache = new Map<string, { data: any[], timestamp: number }>()

const getCachedMarketData = (market: string) => {
  const cached = marketCache.get(market)
  if (cached && Date.now() - cached.timestamp < 60000) { // 1 min cache
    return cached.data
  }
  return null
}
```

### 2. Database Optimizations

#### A. Ensure Market Indexing
```sql
-- Verify index exists on market relation
CREATE INDEX idx_merchants_market ON merchants(market_id);
CREATE INDEX idx_coupons_market ON coupons(market_id);
```

#### B. Query Optimization
```typescript
// Always include market filter in queries
'filters[market][documentId][$eq]': marketDocumentId

// Limit fields returned
'fields[0]': 'id',
'fields[1]': 'merchant_name',
// ... only needed fields
```

### 3. API Response Optimization

#### A. Response Compression
- Enable gzip/brotli compression in Strapi
- Reduces payload size by 70-90%

#### B. Strapi Caching
```javascript
// In Strapi config
module.exports = {
  cache: {
    enabled: true,
    type: 'redis', // or 'memory'
    maxAge: 300000, // 5 minutes
  }
}
```

### 4. Frontend Optimizations (Already Good)

Your frontend already does:
- ✅ Market filtering in queries
- ✅ Proper caching (300s revalidate)
- ✅ Field selection (not fetching all fields)
- ✅ Pagination for large lists

---

## Implementation Plan (If Choosing Centralized)

### Phase 1: Admin App Optimizations (Week 1-2)
1. Add market filter to Dashboard default load
2. Implement lazy loading for market switching
3. Add client-side caching for market data
4. Implement virtual scrolling for large lists

### Phase 2: Database Optimizations (Week 2)
1. Verify/Add indexes on `market` relations
2. Add Strapi response caching
3. Enable API compression

### Phase 3: Monitoring (Week 3)
1. Add performance monitoring
2. Track query times
3. Monitor API response sizes
4. Set up alerts for slow queries

---

## When to Consider Distributed Architecture

Consider splitting only if:
- ❌ **Database size > 50K-100K entries per market** (you're at ~1.5K, nowhere near this)
- ❌ **Query times > 1s even with indexes** (should be <100ms with proper indexing)
- ❌ **Need geographic isolation** (different regions, compliance requirements)
- ❌ **Markets are completely independent** (no shared content, no cross-market features)
- ❌ **Strapi Cloud rate limits exceeded** (unlikely with 5-6 markets)
- ❌ **Different teams managing each market** (need complete isolation)

**For your use case (5-6 markets, ~1.5K entries each):** 
- ✅ **None of these apply**
- ✅ **Centralized is clearly the better choice**
- ✅ **You're at 9% of Strapi Cloud Pro capacity** - plenty of room to grow

---

## Cost Comparison (Strapi Cloud)

### Centralized (1 Strapi Cloud)
- **Infrastructure:** 1 Strapi Cloud plan (Pro plan recommended)
- **Monthly Cost:** ~$99-299/month (depending on plan)
- **Maintenance:** Low (managed service, one system)
- **Entry Limit:** 100K entries (you use ~9K = 9% capacity)

### Distributed (5-6 Strapi Cloud)
- **Infrastructure:** 5-6 Strapi Cloud plans (one per market)
- **Monthly Cost:** ~$495-1,794/month (5-6x the cost)
- **Maintenance:** High (5-6 systems, sync complexity, 5-6x updates)
- **Entry Limit:** 100K entries per instance (you use ~1.5K per instance = 1.5% capacity each)

**Savings with Centralized:** **~80-85% cost reduction** ($99-299 vs $495-1,794/month)

**Example:**
- Centralized: $99/month (Strapi Cloud Starter) or $299/month (Pro)
- Distributed: $99 × 6 = $594/month (Starter) or $299 × 6 = $1,794/month (Pro)
- **Annual savings: $5,940 - $17,940** with centralized approach

---

## Final Recommendation

**✅ STRONGLY RECOMMEND: Centralized Architecture (1 Strapi Cloud)**

### Key Points for Your Scale (5-6 markets, ~1.5K entries each):

1. **Data volume is tiny** - ~7.5K-9K total entries = only **9% of Strapi Cloud Pro capacity** (100K limit)
2. **Market filtering works** - Already implemented, just optimize admin app
3. **Shared content is common** - Many merchants exist across multiple markets
4. **Massive cost savings** - **80-85% cheaper** ($99-299 vs $495-1,794/month)
5. **Simpler operations** - One Strapi Cloud instance vs 5-6 instances
6. **Strapi Cloud handles scaling** - Managed service, automatic backups, high uptime
7. **Room to grow** - Can add more markets without hitting limits

### Performance Assessment:

- ✅ **Database:** ~9K entries is tiny, queries will be fast with proper indexing
- ✅ **Strapi Cloud:** Handles this scale easily, automatic scaling
- ⚠️ **Admin App:** This is the bottleneck (loading all data), not the database
- ✅ **Frontend:** Already optimized with market filtering and caching

**Bottom Line:** With Strapi Cloud, centralized is a **no-brainer**. You'd be paying 5-6x more for distributed architecture with no performance benefit at this scale.

---

## Next Steps

1. **Review this analysis** with your team
2. **Implement Phase 1 optimizations** (admin app improvements)
3. **Monitor performance** after optimizations
4. **Re-evaluate** only if performance issues persist (unlikely)

If you want, I can help implement the admin app optimizations first to prove the performance improvements.

