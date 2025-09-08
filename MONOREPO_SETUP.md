# Monorepo Configuration Guide

## Environment Setup

### 1. Root Directory Structure
```
/projects
  /dealy-tw-cms              # Strapi v5 project
  /dealy-tw-frontend            # Next.js 15.5.x frontend
  .env                       # root (optional)
```

### 2. Strapi CMS Environment (.env)
Create `dealy-tw-cms/.env`:
```bash
# Database
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=dealy_cms
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password

# Server
HOST=0.0.0.0
PORT=1337
APP_KEYS=your_app_keys_here
API_TOKEN_SALT=your_api_token_salt
ADMIN_JWT_SECRET=your_admin_jwt_secret
TRANSFER_TOKEN_SALT=your_transfer_token_salt
JWT_SECRET=your_jwt_secret

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. Next.js Frontend Environment (.env.local)
Create `dealy-tw-frontend/.env.local`:
```bash
# Strapi CMS Configuration
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_api_token_here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Dealy.HK

# Development Configuration
NODE_ENV=development
```

## API Integration

### 1. Strapi Merchant Schema Updated
The merchant schema now includes:
- `pageLayout`: enumeration ["coupon", "blog"]
- Default: "coupon"

### 2. Next.js API Route
- `/api/merchants/[id]` - Fetches merchant data from Strapi
- Transforms Strapi data to frontend format
- Handles both coupon and blog layouts

### 3. Dynamic Layout Rendering
- Single route: `/merchant/[slug]`
- Layout determined by `merchant.pageLayout` from Strapi
- Same URL structure for both layouts

## Development Commands

### Start Strapi CMS
```bash
cd dealy-tw-cms
npm run dev
# Runs on http://localhost:1337
```

### Start Next.js Frontend
```bash
cd dealy-tw-frontend
npm run dev
# Runs on http://localhost:3000
```

## Strapi Admin Interface

### Merchant Collection Fields:
- **Merchant Name**: Trip.com
- **Slug**: trip-com (auto-generated)
- **Logo**: Upload image
- **Site URL**: hk.trip.com
- **Summary**: Brief description
- **Store Description**: Rich text content
- **Default Affiliate Link**: https://hk.trip.com
- **Is Featured**: Boolean
- **Page Layout**: [Dropdown] "Coupon" or "Blog"
- **Market**: [Dropdown] "TW" or "HK"
- **SEO Title**: Page title
- **SEO Description**: Meta description
- **Canonical URL**: Canonical link
- **Priority**: Integer (sorting)
- **Robots**: index,follow

## URL Structure

### Same URL, Different Layouts:
```
/merchant/trip-com  → Coupon layout (if pageLayout = "coupon")
/merchant/trip-com  → Blog layout (if pageLayout = "blog")
```

### Benefits:
- ✅ CMS-controlled layout selection
- ✅ Same URL structure
- ✅ Easy switching between layouts
- ✅ SEO-friendly URLs
- ✅ Consistent branding

## Next Steps

1. **Update Strapi Schema**: Restart Strapi to apply schema changes
2. **Create Merchants**: Add merchants in Strapi admin
3. **Set Page Layouts**: Choose "coupon" or "blog" for each merchant
4. **Test Integration**: Verify API calls work correctly
5. **Deploy**: Update production environment variables
