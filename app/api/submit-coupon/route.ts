import { NextResponse } from 'next/server';

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

    // Send email to info@dealy.hk
    const emailSubject = `[Dealy.TW] ${merchant ? `商家：${merchant}` : '聯絡我們'} - ${name}`;
    const emailBody = `
新的提交來自 Dealy.TW：

姓名：${name}
電郵：${email}
${merchant ? `商家名稱：${merchant}\n` : ''}${coupon ? `優惠券代碼：${coupon}\n` : ''}${value ? `優惠金額：${value}\n` : ''}
訊息：
${message}

---
此訊息來自 Dealy.TW 提交優惠券表單
`;

    // Use a mail service or email API (e.g., Resend, SendGrid, etc.)
    // For now, we'll just log it and return success
    // You can integrate with your email service provider here
    console.log('Email would be sent to:', 'info@dealy.hk');
    console.log('Subject:', emailSubject);
    console.log('Body:', emailBody);

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'noreply@dealy.tw',
    //   to: 'info@dealy.hk',
    //   subject: emailSubject,
    //   text: emailBody,
    // });

    return NextResponse.json(
      { message: '提交成功！我們會盡快回覆您的訊息。' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error submitting form:', error);
    return NextResponse.json(
      { error: '提交失敗，請稍後再試。' },
      { status: 500 }
    );
  }
}

