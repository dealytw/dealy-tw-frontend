# ✅ Monorepo Setup Complete!

## **Current Structure:**
```
/projects
  /dealy-tw-cms              # Strapi v5 project ✅
  /dealy-tw-frontend            # Next.js 15.5.x frontend ✅
  .env                       # root (optional) ✅
```

## **What's Been Configured:**

### **1. Strapi CMS (dealy-tw-cms)**
- ✅ **Merchant Schema Updated**: Added `pageLayout` field
- ✅ **API Endpoints**: `/api/merchants` with full CRUD
- ✅ **Content Types**: merchant, coupon, topic
- ✅ **Admin Interface**: Ready for content management

### **2. Next.js Frontend (dealy-tw-frontend)**
- ✅ **API Integration**: `/api/merchants/[id]` route
- ✅ **Dynamic Layouts**: Coupon vs Blog based on Strapi data
- ✅ **Type Safety**: Full TypeScript interfaces
- ✅ **Component Library**: Complete shadcn/ui setup

### **3. Integration Features**
- ✅ **Same URL Structure**: `/merchant/[slug]` for both layouts
- ✅ **CMS Control**: Layout selection in Strapi admin
- ✅ **Data Transformation**: Strapi → Next.js format
- ✅ **Fallback Handling**: Development data when Strapi unavailable

## **Next Steps:**

### **1. Environment Setup**
Create these files:

**`dealy-tw-cms/.env`:**
```bash
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=dealy_cms
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
HOST=0.0.0.0
PORT=1337
APP_KEYS=your_app_keys_here
API_TOKEN_SALT=your_api_token_salt
ADMIN_JWT_SECRET=your_admin_jwt_secret
TRANSFER_TOKEN_SALT=your_transfer_token_salt
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
```

**`dealy-tw-frontend/.env.local`:**
```bash
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_api_token_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Dealy.HK
NODE_ENV=development
```

### **2. Start Development**
```bash
# Option 1: Use the batch file (Windows)
./start-dev.bat

# Option 2: Manual start
# Terminal 1: Start Strapi
cd dealy-tw-cms
npm run dev

# Terminal 2: Start Next.js
cd dealy-tw-frontend
npm run dev
```

### **3. Strapi Admin Setup**
1. **Access**: http://localhost:1337/admin
2. **Create Admin**: First-time setup
3. **Merchant Collection**: Add merchants
4. **Page Layout**: Choose "coupon" or "blog"
5. **API Token**: Generate for frontend access

### **4. Test Integration**
1. **Create Merchant**: In Strapi admin
2. **Set Layout**: Choose "coupon" or "blog"
3. **Visit**: http://localhost:3000/merchant/[slug]
4. **Verify**: Correct layout renders

## **Merchant Schema Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `merchant_name` | String | Display name |
| `slug` | UID | URL slug |
| `logo` | Media | Merchant logo |
| `site_url` | String | Website URL |
| `summary` | Text | Brief description |
| `store_description` | Blocks | Rich content |
| `default_affiliate_link` | String | Affiliate URL |
| `is_featured` | Boolean | Featured status |
| `pageLayout` | Enum | "coupon" or "blog" |
| `market` | Enum | "TW" or "HK" |
| `seo_title` | String | SEO title |
| `seo_description` | Text | SEO description |
| `canonical_url` | String | Canonical URL |
| `priority` | Integer | Sort order |
| `robots` | String | Robots meta |

## **URL Examples:**
```
/merchant/trip-com     → Coupon layout (if pageLayout = "coupon")
/merchant/trip-com     → Blog layout (if pageLayout = "blog")
/merchant/klook        → Coupon layout
/merchant/agoda        → Blog layout
```

## **Benefits:**
- ✅ **CMS Controlled**: Layout selection in Strapi
- ✅ **Same URLs**: Consistent URL structure
- ✅ **Easy Switching**: Change layout without URL change
- ✅ **SEO Friendly**: Clean, consistent URLs
- ✅ **Type Safe**: Full TypeScript support
- ✅ **Scalable**: Easy to add more layouts

**🎯 Your monorepo is ready for development!**
