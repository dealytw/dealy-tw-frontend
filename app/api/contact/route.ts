import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const DEBUG = process.env.NODE_ENV !== 'production';

// Lazy-safe Resend client: avoid throwing at import time when API key is missing
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: '無效的請求格式' },
        { status: 400 }
      );
    }

    const { name, email, message, merchantName } = body;

    // Validate required fields
    if (!name || !email || !message) {
      console.error('Missing required fields:', { name: !!name, email: !!email, message: !!message });
      return NextResponse.json(
        { error: '姓名、電郵地址和訊息為必填項' },
        { status: 400 }
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

    // Send email to info@dealy.tw
    const emailSubject = `[Dealy.TW] 聯絡我們${merchantName ? ` - ${merchantName}` : ''} - ${name}`;
    const emailText = `
新的聯絡訊息來自 Dealy.TW：

姓名：${name}
電郵：${email}
${merchantName ? `商家：${merchantName}\n` : ''}
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
    return NextResponse.json(
      { error: '提交失敗，請稍後再試。' },
      { status: 500 }
    );
  }
}

