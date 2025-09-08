# Environment Variables Setup Guide

## Next.js Environment Variables
Create file: `dealy-tw-frontend/.env.local`

```bash
# Base URL of Strapi (dev)
STRAPI_URL=http://localhost:1337
# Strapi API token (read-only, limited scope)
STRAPI_TOKEN=...your-token...
# For on-demand revalidation + preview
NEXT_REVALIDATE_TOKEN=...a-long-random-string...
NEXT_PREVIEW_TOKEN=...a-long-random-string...

# Additional variables for frontend
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Dealy.HK
NODE_ENV=development
```

## Required Values:

### 1. STRAPI_TOKEN
- **Purpose**: API authentication for Strapi
- **Scope**: Read-only access to merchants, coupons, etc.
- **How to get**: 
  1. Go to Strapi admin → Settings → API Tokens
  2. Create new token with "Read" permissions
  3. Copy the generated token

### 2. NEXT_REVALIDATE_TOKEN
- **Purpose**: On-demand revalidation of Next.js pages
- **Usage**: Triggered when Strapi content changes
- **Generate**: Use a secure random string generator
- **Example**: `revalidate_abc123def456ghi789`

### 3. NEXT_PREVIEW_TOKEN
- **Purpose**: Preview mode for draft content
- **Usage**: Preview unpublished Strapi content
- **Generate**: Use a secure random string generator
- **Example**: `preview_xyz789uvw456rst123`

## Next Steps:
1. **Create the file**: `dealy-tw-frontend/.env.local`
2. **Add the values**: Copy the template above
3. **Get Strapi token**: From Strapi admin interface
4. **Generate tokens**: Use secure random strings
5. **Test connection**: Start both services

## Security Notes:
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Use read-only tokens for production
- ✅ Rotate tokens regularly
- ✅ Use different tokens for dev/staging/prod
