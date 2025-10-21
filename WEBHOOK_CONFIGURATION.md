# Strapi Webhook Configuration for On-Demand Revalidation

This guide explains how to configure Strapi webhooks to trigger on-demand revalidation of your Next.js API routes.

## Overview

The `/api/revalidate` endpoint allows you to invalidate cached data immediately when content is updated in Strapi, ensuring your site always shows fresh content.

## Webhook Endpoint

**URL**: `https://your-domain.com/api/revalidate`  
**Method**: `POST`  
**Content-Type**: `application/json`

## Request Body

```json
{
  "tag": "merchant:agoda-tw",
  "path": "/shop/agoda-tw",
  "secret": "your-revalidation-secret"
}
```

### Parameters

- **`tag`** (required): The cache tag to invalidate
- **`path`** (optional): The specific path to revalidate
- **`secret`** (required): Your revalidation secret for security

## Environment Variables

Add to your `.env.local`:

```bash
REVALIDATE_SECRET=your-super-secret-key-here
```

## Strapi Webhook Configuration

### 1. Access Strapi Admin Panel

1. Go to your Strapi admin panel
2. Navigate to **Settings** → **Webhooks**
3. Click **Add new webhook**

### 2. Configure Webhook

**Name**: `Next.js Revalidation`  
**URL**: `https://your-domain.com/api/revalidate`  
**Events**: Select the events you want to trigger revalidation:

- **Entry**: `create`, `update`, `delete`
- **Media**: `create`, `update`, `delete`

### 3. Webhook Payload Examples

#### For Merchant Updates
```json
{
  "tag": "merchant:{{entry.slug}}",
  "path": "/shop/{{entry.slug}}",
  "secret": "{{process.env.REVALIDATE_SECRET}}"
}
```

#### For Coupon Updates
```json
{
  "tag": "merchant:{{entry.merchant.slug}}",
  "path": "/shop/{{entry.merchant.slug}}",
  "secret": "{{process.env.REVALIDATE_SECRET}}"
}
```

#### For Merchants List Updates
```json
{
  "tag": "merchants:{{entry.market.key}}",
  "secret": "{{process.env.REVALIDATE_SECRET}}"
}
```

## Available Cache Tags

Based on our API implementation, here are the available cache tags:

### Merchant-Related Tags
- `merchant:{slug}` - Individual merchant data
- `merchants:{market}` - Merchants list for a market
- `merchant-coupons:{merchantId}` - Coupons for a specific merchant
- `merchant-coupon:{slug}` - Single coupon for a merchant
- `related-merchants:{slug}` - Related merchants for a merchant

### General Tags
- `active-coupons:{market}` - All active coupons for a market
- `top-coupon:{slug}` - Top coupon for a merchant

## Testing Webhooks

### 1. Test the Revalidation Endpoint

```bash
curl -X POST https://your-domain.com/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{
    "tag": "merchant:agoda-tw",
    "secret": "your-revalidation-secret"
  }'
```

### 2. Verify Cache Invalidation

After triggering the webhook, check that:
1. The cache is cleared
2. Fresh data is fetched on the next request
3. Response times improve after cache rebuild

## Webhook Security

### 1. Use HTTPS
Always use HTTPS for webhook URLs to prevent man-in-the-middle attacks.

### 2. Secret Verification
The endpoint verifies the secret before processing:

```typescript
if (secret !== process.env.REVALIDATE_SECRET) {
  return new Response('Forbidden', { status: 403 });
}
```

### 3. Rate Limiting
Consider implementing rate limiting for the webhook endpoint to prevent abuse.

## Troubleshooting

### Common Issues

1. **403 Forbidden**: Check that the secret matches your environment variable
2. **500 Internal Server Error**: Verify the webhook URL is correct and accessible
3. **Cache not clearing**: Ensure the tag matches exactly what's used in your API routes

### Debugging

Add logging to your revalidation endpoint:

```typescript
console.log(`Revalidating tag: ${tag}`);
console.log(`Revalidating path: ${path}`);
```

## Advanced Configuration

### Multiple Tags
You can invalidate multiple tags by calling the endpoint multiple times or modifying the endpoint to accept an array of tags.

### Conditional Revalidation
Only revalidate when specific conditions are met by adding logic to your webhook payload.

### Batch Operations
For bulk operations, consider batching revalidation calls to avoid overwhelming your server.

## Monitoring

### Webhook Success Rate
Monitor your webhook success rate in Strapi admin panel.

### Cache Performance
Track cache hit rates and response times to measure the effectiveness of your revalidation strategy.

## Example Implementation

Here's a complete example of how to set up webhooks for different content types:

### Merchant Content Type
- **Events**: `create`, `update`, `delete`
- **Payload**: 
  ```json
  {
    "tag": "merchant:{{entry.slug}}",
    "path": "/shop/{{entry.slug}}",
    "secret": "{{process.env.REVALIDATE_SECRET}}"
  }
  ```

### Coupon Content Type
- **Events**: `create`, `update`, `delete`
- **Payload**:
  ```json
  {
    "tag": "merchant:{{entry.merchant.slug}}",
    "secret": "{{process.env.REVALIDATE_SECRET}}"
  }
  ```

### Market Content Type
- **Events**: `create`, `update`, `delete`
- **Payload**:
  ```json
  {
    "tag": "merchants:{{entry.key}}",
    "secret": "{{process.env.REVALIDATE_SECRET}}"
  }
  ```

## Benefits

1. **Real-time Updates**: Content changes are reflected immediately
2. **Better SEO**: Search engines see fresh content
3. **Improved UX**: Users see updated information without delays
4. **Reduced Server Load**: Only revalidate when necessary
5. **Flexible Control**: Choose what to revalidate based on content changes

This webhook configuration ensures your Next.js application stays in sync with your Strapi CMS while maintaining optimal performance through intelligent caching.
