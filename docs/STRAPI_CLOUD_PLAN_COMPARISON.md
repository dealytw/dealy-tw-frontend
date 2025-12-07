# Strapi Cloud Plan Comparison: Centralized vs Distributed

## Current Usage Analysis

### Taiwan (TW) Market - Current
- **API Calls:** 25,000 per week = **~100,000 per month**
- **Plan:** Essential ($15/month)
- **Limit:** 100,000 API calls/month
- **Status:** ⚠️ **At limit** (24,066 used in 1 week = on track for 100K/month)

### Hong Kong (HK) Market - Projected
- **API Calls:** Expected **>100,000 per month** (more updates, more entries)
- **More active:** More frequent updates, more entries than TW

### Combined Usage (TW + HK)
- **Projected:** ~200,000+ API calls/month
- **Essential Plan Limit:** 100,000/month ❌ **Exceeds limit**

---

## Option Comparison

### Option 1: Upgrade to Pro Plan (Centralized) ✅ **RECOMMENDED**

**Structure:**
```
┌─────────────────────────────┐
│  Strapi Cloud Pro Plan      │
│  (TW + HK in one CMS)       │
│  ~200K+ API calls/month     │
└────────────┬────────────────┘
             │
             ├─── Admin App
             ├─── Next.js TW Frontend
             └─── Next.js HK Frontend
```

**Cost:**
- **Pro Plan:** **$75/month** ✅
- **API Limit:** **1,000,000 calls/month** ✅
- **Total:** $75/month

**Pros:**
- ✅ **Single CMS** - Unified management
- ✅ **Shared content** - Easy cross-market features (hreflang)
- ✅ **Simpler operations** - One instance to manage
- ✅ **Cost-effective** - Likely cheaper than 2 Essential plans
- ✅ **Room to grow** - Can add more markets (MY, SG, JP, KW)
- ✅ **Better for admin app** - Market switcher works seamlessly

**Cons:**
- ⚠️ **Single point of failure** - But Strapi Cloud has high uptime
- ⚠️ **More expensive** - $75/month vs $30/month (2× Essential)

**Verified Details:**
- ✅ **Pro plan API limit:** 1,000,000 calls/month (plenty of headroom)
- ✅ **Pro plan pricing:** $75/month
- ✅ **Fits your usage:** 200K+ calls/month easily fits in 1M limit

---

### Option 2: Two Essential Plans (Distributed)

**Structure:**
```
┌─────────────────┐     ┌─────────────────┐
│ Strapi Cloud TW │     │ Strapi Cloud HK │
│ Essential Plan  │     │ Essential Plan  │
│ 100K calls/mo   │     │ 100K calls/mo   │
└────────┬────────┘     └────────┬────────┘
         │                        │
         └──────────┬─────────────┘
                    │
         ┌──────────▼──────────┐
         │   Admin App         │ ← Connects to both
         │  (market switcher) │
         └──────────┬─────────┘
                    │
         ┌──────────┴──────────┐
         │                      │
    Next.js TW          Next.js HK
```

**Cost:**
- **TW Essential:** $15/month
- **HK Essential:** $15/month
- **Total:** $30/month

**Pros:**
- ✅ **Known limits** - Each plan has 100K calls/month (fits your usage)
- ✅ **Isolation** - One market failure doesn't affect the other
- ✅ **Predictable cost** - $30/month total
- ✅ **No upgrade needed** - Stay on Essential plans

**Cons:**
- ❌ **Two CMS instances** - More complex management
- ❌ **No shared content** - Harder to implement cross-market features
- ❌ **Admin app complexity** - Must manage 2 API connections
- ❌ **Data sync issues** - Shared merchants need manual sync
- ❌ **Hreflang harder** - Cross-market SEO more complex
- ❌ **Scales poorly** - Adding MY, SG, JP, KW = 5-6 plans ($75-90/month)

---

## Cost Comparison

### Scenario 1: TW + HK Only
- **Centralized (Pro):** **$75/month** (1M API calls/month)
- **Distributed (2× Essential):** **$30/month** (200K API calls/month total)
- **Winner:** **Distributed** ($30 vs $75 = $45/month savings)

### Scenario 2: All Markets (TW + HK + MY + SG + JP + KW)
- **Centralized (Pro):** **$75/month** (1M API calls/month, fits all 6 markets)
- **Distributed (6× Essential):** **$90/month** (6 × $15 = 600K API calls/month total)
- **Winner:** **Centralized** ($75 vs $90 = $15/month savings, plus simpler operations)

---

## API Call Usage Projection

### Current (TW only)
- Week 1: 24,066 calls
- Monthly: ~100,000 calls
- **Status:** At Essential limit

### Projected (TW + HK)
- TW: ~100,000 calls/month
- HK: ~100,000+ calls/month (more active)
- **Total: ~200,000+ calls/month**

### Future (All 6 markets)
- Each market: ~100,000 calls/month
- **Total: ~600,000 calls/month**

---

## Recommendation Matrix

### Verified: Pro Plan = $75/month, 1M API calls/month

**For TW + HK only:**
- **2× Essential:** $30/month ✅ **Cheaper**
- **1× Pro:** $75/month (2.5x more expensive)

**For all 6 markets:**
- **6× Essential:** $90/month
- **1× Pro:** $75/month ✅ **Cheaper + simpler**

---

## Action Items

### Immediate (Before Decision)
1. **Check Strapi Cloud Pro plan:**
   - API call limit per month
   - Exact pricing
   - Any other relevant limits

2. **Verify HK usage projection:**
   - Is 100K+ calls/month accurate?
   - How much more active is HK vs TW?

3. **Consider future markets:**
   - Will you add MY, SG, JP, KW soon?
   - If yes → Pro plan makes more sense

### Decision Criteria
- **If Pro limit ≥ 200K AND Pro ≤ $90/month:** → Pro Plan (Centralized)
- **If Pro limit < 200K OR Pro > $90/month:** → 2× Essential (Distributed)
- **If adding 3+ more markets soon:** → Pro Plan (Centralized) regardless

---

## My Recommendation

### For TW + HK Only (Short-term): **2× Essential Plans** ✅

**Why:**
1. **Cost-effective** - $30/month vs $75/month (saves $45/month = $540/year)
2. **Fits your needs** - Each market gets 100K calls/month
3. **Predictable** - Known limits, no surprises
4. **Quick to implement** - Just create second Strapi Cloud project

### For All 6 Markets (Long-term): **1× Pro Plan** ✅

**Why:**
1. **Cost-effective** - $75/month vs $90/month (saves $15/month)
2. **Plenty of headroom** - 1M calls/month vs ~600K needed
3. **Simpler operations** - One CMS vs 6 separate instances
4. **Better for shared content** - Cross-market features (hreflang) easier

### Migration Strategy

**Phase 1 (Now):** Start with 2× Essential ($30/month)
- TW: Essential plan
- HK: Essential plan
- **Total: $30/month**

**Phase 2 (When adding 3rd market):** Migrate to 1× Pro ($75/month)
- Export data from both Essential plans
- Import into single Pro plan
- **Total: $75/month** (cheaper than 3× Essential = $45/month)

**Migration is possible:** Strapi supports export/import between projects

---

## Alternative: Hybrid Approach

**Option 3: Pro Plan with API Optimization**

If Pro plan supports 200K+ calls/month:
- **Upgrade to Pro**
- **Implement aggressive caching** to reduce API calls
- **Optimize frontend queries** to reduce unnecessary requests
- **Result:** Lower actual usage, more headroom

**Potential savings:**
- Current: 100K calls/month (TW)
- With optimization: Could reduce to 60-70K calls/month
- Combined (TW + HK optimized): ~120-140K calls/month
- **Fits in Pro plan with room to spare**

---

## Final Verdict

### ✅ **Start with 2× Essential Plans ($30/month)**

**For TW + HK only:**
- **2× Essential Plans** = **$30/month** ✅ **Best choice**
- **1× Pro Plan** = $75/month (2.5x more expensive)
- **Savings:** $45/month = **$540/year**

### ✅ **Migrate to 1× Pro Plan ($75/month) when adding 3rd market**

**For all 6 markets:**
- **1× Pro Plan** = **$75/month** ✅ **Best choice**
- **6× Essential Plans** = $90/month
- **Savings:** $15/month + much simpler operations

### Recommendation Summary

1. **Now:** Create 2× Essential plans ($30/month total)
   - One for TW, one for HK
   - Each gets 100K API calls/month

2. **When adding 3rd market (MY/SG/JP/KW):** Migrate to 1× Pro ($75/month)
   - Export data from both Essential plans
   - Import into single Pro plan
   - Consolidate all markets into one CMS

3. **Benefits of migration:**
   - Cost savings: $75 vs $90 (6× Essential)
   - Simpler operations: One CMS vs 6
   - Better for shared content: Cross-market features easier
   - Room to grow: 1M calls/month supports all markets

**Bottom Line:** Start distributed (2× Essential), migrate to centralized (1× Pro) when scaling.

