# Centralized Queries Documentation

## Overview
All data fetching logic is centralized in `/src/data/queries.ts` to provide:
- **Single source of truth** for all API calls
- **Consistent error handling** and validation
- **Optimized caching** with Next.js tags
- **Type safety** with Zod validation
- **Easy maintenance** and updates

## Available Queries

### Home Page Data
```typescript
// Get home page data (hero + latest coupons + featured shops)
const homeData = await getHome({ draft: false });
```

### Shop/Merchant Queries
```typescript
// Get shop by slug
const shop = await getShopBySlug('trip-com', { draft: false });

// Get all shops with filters
const shops = await getShops({
  featured: true,
  market: 'HK',
  limit: 24,
  draft: false
});

// Search shops
const searchResults = await searchShops('trip', { draft: false });

// Get all shop slugs for SSG
const slugs = await getAllShopSlugs();
```

### Coupon Queries
```typescript
// Get coupon by slug
const coupon = await getCouponBySlug('summer-sale', { draft: false });

// Get coupons with filters
const coupons = await getCoupons({
  shopSlug: 'trip-com',
  active: true,
  limit: 48,
  draft: false
});

// Get coupons for specific shop
const shopCoupons = await getCouponsForShop(123, { draft: false });

// Search coupons
const searchResults = await searchCoupons('discount', { draft: false });

// Get all coupon slugs for SSG
const slugs = await getAllCouponSlugs();
```

### Topic Queries
```typescript
// Get topic by slug
const topic = await getTopicBySlug('travel', { draft: false });

// Get all topics
const topics = await getTopics({
  limit: 12,
  draft: false
});

// Get all topic slugs for SSG
const slugs = await getAllTopicSlugs();
```

## API Routes

### Merchant API
- **GET** `/api/merchants/[id]` - Get merchant by slug
- **GET** `/api/coupons/[id]` - Get coupon by slug  
- **GET** `/api/topics/[id]` - Get topic by slug
- **GET** `/api/home` - Get home page data
- **POST** `/api/revalidate` - On-demand revalidation

## Caching Strategy

### Cache Tags
- `global` - Global site settings
- `shop:list` - Shop listings
- `shop:featured` - Featured shops
- `shop:{slug}` - Individual shop pages
- `coupon:list` - Coupon listings
- `coupon:search` - Coupon search results
- `coupon:{slug}` - Individual coupon pages
- `topic:list` - Topic listings
- `topic:{slug}` - Individual topic pages

### Revalidation
- **Time-based**: 5-10 minutes for dynamic content
- **On-demand**: Via webhooks from Strapi
- **Tag-based**: Granular cache invalidation

## Usage Examples

### In API Routes
```typescript
import { getShopBySlug } from '@/data/queries';

export async function GET(request: NextRequest, { params }) {
  const shop = await getShopBySlug(params.id);
  return NextResponse.json(shop);
}
```

### In Server Components
```typescript
import { getHome } from '@/data/queries';

export default async function HomePage() {
  const { coupons, shops } = await getHome();
  return <HomePageContent coupons={coupons} shops={shops} />;
}
```

### In Client Components
```typescript
import { getCoupons } from '@/data/queries';

export default function CouponList() {
  const [coupons, setCoupons] = useState([]);
  
  useEffect(() => {
    getCoupons({ active: true }).then(setCoupons);
  }, []);
  
  return <CouponGrid coupons={coupons} />;
}
```

## Benefits

1. **Centralized Logic**: All API calls in one place
2. **Type Safety**: Full TypeScript support with Zod validation
3. **Performance**: Optimized caching and revalidation
4. **Maintainability**: Easy to update and extend
5. **Consistency**: Uniform error handling and data transformation
6. **Developer Experience**: IntelliSense and autocomplete
7. **Production Ready**: Robust error handling and fallbacks
