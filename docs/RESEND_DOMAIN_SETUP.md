# Resend Domain Verification Setup Guide

This guide will help you verify your `dealy.tw` domain in Resend so you can send emails from `@dealy.tw` addresses (like `noreply@dealy.tw` and `info@dealy.tw`).

## Why Verify Your Domain?

- ✅ **Better deliverability**: Emails from verified domains are less likely to be marked as spam
- ✅ **Professional appearance**: Use your own domain instead of Resend's default domain
- ✅ **Brand trust**: Recipients see emails from `@dealy.tw` instead of generic addresses
- ✅ **Required for production**: Resend requires domain verification for sending to external domains

## Step-by-Step Setup

### Step 1: Sign Up / Log In to Resend

1. Go to https://resend.com
2. Sign up for a free account (or log in if you already have one)
3. Free tier includes: **3,000 emails/month**

### Step 2: Get Your API Key

1. In Resend dashboard, go to **API Keys** (https://resend.com/api-keys)
2. Click **"Create API Key"**
3. Give it a name (e.g., "Dealy TW Production")
4. Copy the API key immediately (you won't be able to see it again!)
5. Save it securely

### Step 3: Add Domain to Resend

1. In Resend dashboard, go to **Domains** (https://resend.com/domains)
2. Click **"Add Domain"**
3. Enter your domain: `dealy.tw` (without `www` or `https://`)
4. Click **"Add"**

### Step 4: Add DNS Records

Resend will show you DNS records that need to be added to your domain. You'll need to add these records in your DNS provider (e.g., Cloudflare, Namecheap, GoDaddy).

#### Required DNS Records:

Resend will provide you with specific values, but typically you'll need:

1. **SPF Record** (TXT record):
   ```
   Type: TXT
   Name: @ (or dealy.tw)
   Value: v=spf1 include:resend.com ~all
   TTL: 3600 (or Auto)
   ```

2. **DKIM Records** (2 TXT records):
   ```
   Type: TXT
   Name: resend._domainkey (or similar)
   Value: [Resend will provide this]
   TTL: 3600 (or Auto)
   ```

3. **DMARC Record** (TXT record - optional but recommended):
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:info@dealy.tw
   TTL: 3600 (or Auto)
   ```

#### Where to Add DNS Records:

**If using Cloudflare:**
1. Log in to Cloudflare dashboard
2. Select your domain (`dealy.tw`)
3. Go to **DNS** → **Records**
4. Click **"Add record"**
5. Select the record type (TXT)
6. Enter the Name and Value from Resend
7. Click **"Save"**

**If using other DNS providers:**
- Go to your domain registrar's DNS management
- Add the TXT records as shown in Resend dashboard
- Save changes

### Step 5: Wait for DNS Propagation

1. DNS changes can take **5 minutes to 48 hours** to propagate
2. In Resend dashboard, you'll see the domain status as **"Pending"**
3. Resend will automatically check DNS records periodically
4. Once verified, status will change to **"Verified"** ✅

**Tip:** You can check DNS propagation status using:
- https://dnschecker.org
- Or use `dig` command: `dig TXT dealy.tw`

### Step 6: Verify Domain Status

1. Go back to Resend dashboard → **Domains**
2. Check if `dealy.tw` shows as **"Verified"** (green checkmark)
3. If still pending, wait a bit longer and refresh

### Step 7: Add Environment Variables

Once domain is verified, add these to your Vercel project:

1. Go to Vercel dashboard → Your project → **Settings** → **Environment Variables**
2. Add the following:

   **Required:**
   ```
   RESEND_API_KEY = re_xxxxxxxxxxxxx (your API key from Step 2)
   ```

   **Optional (but recommended):**
   ```
   RESEND_FROM_EMAIL = noreply@dealy.tw
   ```

3. Make sure to add these to **Production**, **Preview**, and **Development** environments
4. Click **"Save"**

### Step 8: Redeploy Your Site

1. After adding environment variables, **redeploy** your site
2. In Vercel: Go to **Deployments** → Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger a deployment

### Step 9: Test the Contact Form

1. Go to your website
2. Submit a test message through the contact form
3. Check if you receive the email at `info@dealy.tw`
4. Verify the email shows as coming from `noreply@dealy.tw` (or your `RESEND_FROM_EMAIL`)

## Troubleshooting

### Domain Not Verifying?

1. **Check DNS records are correct:**
   - Use https://dnschecker.org to verify TXT records are propagated
   - Make sure there are no typos in the DNS records

2. **Wait longer:**
   - DNS can take up to 48 hours to fully propagate
   - Some DNS providers cache records longer

3. **Check for conflicting records:**
   - Make sure you don't have duplicate SPF records
   - If you have multiple SPF records, combine them into one

4. **Contact Resend support:**
   - If still not working after 48 hours, contact Resend support
   - They can help diagnose DNS issues

### Emails Not Sending?

1. **Check API key:**
   - Make sure `RESEND_API_KEY` is set correctly in Vercel
   - Check Vercel logs for errors

2. **Check domain status:**
   - Domain must be **"Verified"** in Resend dashboard
   - Unverified domains can't send emails

3. **Check email limits:**
   - Free tier: 3,000 emails/month
   - Check Resend dashboard for usage

4. **Check Vercel logs:**
   - Go to Vercel → Your project → **Logs**
   - Look for error messages related to Resend

### Emails Going to Spam?

1. **Verify domain is verified:**
   - Unverified domains have lower deliverability

2. **Check SPF/DKIM/DMARC:**
   - All three should be properly configured
   - Use https://mxtoolbox.com to check your domain's email reputation

3. **Warm up your domain:**
   - Start with small volumes
   - Gradually increase email volume

## Current Configuration

After setup, your contact forms will:
- ✅ Send emails to: `info@dealy.tw`
- ✅ Send emails from: `noreply@dealy.tw` (or your `RESEND_FROM_EMAIL`)
- ✅ Use verified domain: `dealy.tw`
- ✅ Include proper SPF/DKIM/DMARC authentication

## Additional Resources

- **Resend Documentation**: https://resend.com/docs
- **Resend Domain Setup**: https://resend.com/docs/dashboard/domains/introduction
- **DNS Record Types Explained**: https://resend.com/docs/dashboard/domains/dns-records
- **Resend Support**: support@resend.com

## Quick Checklist

- [ ] Signed up for Resend account
- [ ] Created API key
- [ ] Added `dealy.tw` domain in Resend
- [ ] Added SPF TXT record to DNS
- [ ] Added DKIM TXT records to DNS
- [ ] Added DMARC TXT record to DNS (optional)
- [ ] Waited for DNS propagation
- [ ] Verified domain shows as "Verified" in Resend
- [ ] Added `RESEND_API_KEY` to Vercel environment variables
- [ ] Added `RESEND_FROM_EMAIL` to Vercel environment variables (optional)
- [ ] Redeployed site
- [ ] Tested contact form
- [ ] Received test email successfully

---

**Note:** The contact form code is already configured to send to `info@dealy.tw`. You just need to complete the Resend domain verification setup above.

