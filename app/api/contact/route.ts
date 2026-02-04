import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const DEBUG = process.env.NODE_ENV !== 'production';
const MIN_SUBMIT_MS = 1500; // Too fast = likely bot

// Lazy-safe Resend client: avoid throwing at import time when API key is missing
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

function getClientIp(request: Request): string | null {
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf;
  const xff = request.headers.get('x-forwarded-for');
  return xff ? xff.split(',')[0].trim() : null;
}

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Skip if not configured (dev)
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json();
    return !!data?.success;
  } catch (e) {
    if (DEBUG) console.warn('[contact] Turnstile verify error:', e);
    return false;
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { message: '提交成功！我們會盡快回覆您的訊息。' },
        { status: 200 }
      );
    }

    const { name, email, message, merchantName, turnstileToken, pageLoadTs, company_website } = body;

    // Anti-spam: honeypot filled → return 200 (don't send)
    if (company_website && String(company_website).trim()) {
      if (DEBUG) console.log('[contact] Blocked: honeypot filled');
      return NextResponse.json(
        { message: '提交成功！我們會盡快回覆您的訊息。' },
        { status: 200 }
      );
    }

    // Anti-spam: submission too fast (< 1500ms from page load)
    if (typeof pageLoadTs === 'number' && Date.now() - pageLoadTs < MIN_SUBMIT_MS) {
      if (DEBUG) console.log('[contact] Blocked: submission too fast');
      return NextResponse.json(
        { message: '提交成功！我們會盡快回覆您的訊息。' },
        { status: 200 }
      );
    }

    // Anti-spam: verify Turnstile server-side
    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken || typeof turnstileToken !== 'string') {
        if (DEBUG) console.log('[contact] Blocked: missing Turnstile token');
        return NextResponse.json(
          { message: '提交成功！我們會盡快回覆您的訊息。' },
          { status: 200 }
        );
      }
      const ok = await verifyTurnstile(turnstileToken);
      if (!ok) {
        if (DEBUG) console.log('[contact] Blocked: Turnstile verification failed');
        return NextResponse.json(
          { message: '提交成功！我們會盡快回覆您的訊息。' },
          { status: 200 }
        );
      }
    }

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { message: '提交成功！我們會盡快回覆您的訊息。' },
        { status: 200 }
      );
    }

    // Validate email format and message length
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: '提交成功！我們會盡快回覆您的訊息。' },
        { status: 200 }
      );
    }
    if (String(message).length > 10000) {
      return NextResponse.json(
        { message: '提交成功！我們會盡快回覆您的訊息。' },
        { status: 200 }
      );
    }

    // Check if Resend API key is configured
    if (!resend) {
      console.error('RESEND_API_KEY is not configured');
      // Still return success to user, but DO NOT log PII to server logs
      if (DEBUG) {
        console.warn('[contact] Email service not configured; dropping submission', {
          hasName: !!name,
          hasEmail: !!email,
          hasMessage: !!message,
          hasMerchantName: !!merchantName,
        });
      }
      return NextResponse.json(
        { message: '提交成功！我們會盡快回覆您的訊息。' },
        { status: 200 }
      );
    }

    // Escape HTML to prevent XSS in email template
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    // Include source and IP for inbox/debugging
    const source = request.headers.get('origin') || request.headers.get('referer') || 'https://dealy.tw';
    const clientIp = getClientIp(request);

    // Send email to info@dealy.tw
    const emailSubject = `[Dealy.TW] 聯絡我們${merchantName ? ` - ${merchantName}` : ''} - ${name}`;
    const emailText = `
新的聯絡訊息來自 Dealy.TW：

姓名：${name}
電郵：${email}
${merchantName ? `商家：${merchantName}\n` : ''}
來源：${source}
${clientIp ? `IP：${clientIp}\n` : ''}
訊息：
${message}

---
此訊息來自 Dealy.TW 聯絡我們表單
`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">新的聯絡訊息來自 Dealy.TW</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>姓名：</strong>${escapeHtml(name)}</p>
          <p><strong>電郵：</strong><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
          ${merchantName ? `<p><strong>商家：</strong>${escapeHtml(merchantName)}</p>` : ''}
          <p><strong>來源：</strong>${escapeHtml(source)}</p>
          ${clientIp ? `<p><strong>IP：</strong>${escapeHtml(clientIp)}</p>` : ''}
        </div>
        <div style="margin: 20px 0;">
          <h3 style="color: #333;">訊息：</h3>
          <p style="white-space: pre-wrap; background: #fff; padding: 15px; border-left: 4px solid #0066cc;">${escapeHtml(message)}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">此訊息來自 Dealy.TW 聯絡我們表單</p>
      </div>
    `;

    try {
      if (!resend) {
        throw new Error('Resend client is not initialized');
      }

      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Dealy TW Team <info@dealy.tw>';

      if (DEBUG) {
        console.log('[contact] Sending email', {
          to: 'info@dealy.tw',
          from: fromEmail,
          hasName: !!name,
          hasEmail: !!email,
          hasMessage: !!message,
          hasMerchantName: !!merchantName,
        });
      }

      const emailResult = await resend.emails.send({
        from: fromEmail,
        to: 'info@dealy.tw',
        replyTo: email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });

      if (DEBUG) console.log('[contact] Email sent');

      return NextResponse.json(
        { message: '提交成功！我們會盡快回覆您的訊息。' },
        { status: 200 }
      );
    } catch (emailError: any) {
      console.error('Error sending email:', {
        error: emailError,
        message: emailError?.message,
        stack: emailError?.stack,
        name: emailError?.name,
      });
      // Still return success to user even if email fails (to prevent user confusion)
      // But log the error for debugging
      return NextResponse.json(
        { message: '提交成功！我們會盡快回覆您的訊息。' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error submitting contact form:', error);
    // Always return 200 + generic success to avoid leaking info to bots
    return NextResponse.json(
      { message: '提交成功！我們會盡快回覆您的訊息。' },
      { status: 200 }
    );
  }
}

