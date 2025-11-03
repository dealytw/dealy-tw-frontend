import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, merchant, coupon, value, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: '姓名、電郵地址和訊息為必填項' },
        { status: 400 }
      );
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      // Still return success to user, but log the submission
      console.log('Form submission (email service not configured):', {
        name,
        email,
        merchant,
        coupon,
        value,
        message,
      });
      return NextResponse.json(
        { message: '提交成功！我們會盡快回覆您的訊息。' },
        { status: 200 }
      );
    }

    // Send email to info@dealy.hk
    const emailSubject = `[Dealy.TW] ${merchant ? `商家：${merchant}` : '聯絡我們'} - ${name}`;
    const emailText = `
新的提交來自 Dealy.TW：

姓名：${name}
電郵：${email}
${merchant ? `商家名稱：${merchant}\n` : ''}${coupon ? `優惠券代碼：${coupon}\n` : ''}${value ? `優惠金額：${value}\n` : ''}
訊息：
${message}

---
此訊息來自 Dealy.TW 提交優惠券表單
`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">新的提交來自 Dealy.TW</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>姓名：</strong>${name}</p>
          <p><strong>電郵：</strong><a href="mailto:${email}">${email}</a></p>
          ${merchant ? `<p><strong>商家名稱：</strong>${merchant}</p>` : ''}
          ${coupon ? `<p><strong>優惠券代碼：</strong>${coupon}</p>` : ''}
          ${value ? `<p><strong>優惠金額：</strong>${value}</p>` : ''}
        </div>
        <div style="margin: 20px 0;">
          <h3 style="color: #333;">訊息：</h3>
          <p style="white-space: pre-wrap; background: #fff; padding: 15px; border-left: 4px solid #0066cc;">${message}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">此訊息來自 Dealy.TW 提交優惠券表單</p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@dealy.tw',
        to: 'info@dealy.tw',
        replyTo: email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });

      return NextResponse.json(
        { message: '提交成功！我們會盡快回覆您的訊息。' },
        { status: 200 }
      );
    } catch (emailError: any) {
      console.error('Error sending email:', emailError);
      // Still return success to user even if email fails
      return NextResponse.json(
        { message: '提交成功！我們會盡快回覆您的訊息。' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    return NextResponse.json(
      { error: '提交失敗，請稍後再試。' },
      { status: 500 }
    );
  }
}

