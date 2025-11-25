# Email Setup Guide

This project uses **Resend** to send emails from contact forms. Resend offers a **free tier with 3,000 emails/month** - perfect for getting started!

## Quick Setup (5 minutes)

1. **Sign up for Resend** (free):
   - Go to https://resend.com
   - Create a free account
   - You'll get 3,000 emails/month for free

2. **Get your API Key**:
   - Go to https://resend.com/api-keys
   - Click "Create API Key"
   - Copy the API key

3. **Add to Environment Variables**:
   - In Vercel: Go to your project → Settings → Environment Variables
   - Add: `RESEND_API_KEY` = `your_api_key_here`
   - Add (optional): `RESEND_FROM_EMAIL` = `noreply@dealy.tw` (or your verified domain email)

4. **Verify Your Domain** (required for production):
   - **📖 See detailed guide:** [`docs/RESEND_DOMAIN_SETUP.md`](./docs/RESEND_DOMAIN_SETUP.md)
   - In Resend dashboard, go to Domains
   - Add your domain (e.g., `dealy.tw`)
   - Add DNS records (SPF, DKIM, DMARC) to your DNS provider
   - Wait for verification (5 minutes to 48 hours)
   - This allows you to send from `@dealy.tw` emails

5. **Redeploy**:
   - After adding environment variables, redeploy your site
   - Forms will now send emails to `info@dealy.tw`

## What's Included

✅ **Submit Coupons Form** (`/submit-coupons`)
- Sends emails when users submit coupon information
- Email includes: name, email, merchant, coupon code, value, message

✅ **Contact Form** (on merchant pages)
- Sends emails when users contact from merchant pages
- Email includes: name, email, message, merchant name

Both forms send emails to: **info@dealy.tw**

## Without API Key

If `RESEND_API_KEY` is not set, forms will still work:
- User sees success message
- Form data is logged to server console
- You can manually check server logs for submissions

## Alternative Email Services

If you prefer a different service:
- **SendGrid**: Free tier (100 emails/day)
- **Mailgun**: Free tier (5,000 emails/month for first 3 months)
- **Nodemailer + SMTP**: Free (requires SMTP server like Gmail, Outlook)

To switch, just update the email sending code in:
- `/app/api/submit-coupon/route.ts`
- `/app/api/contact/route.ts`

