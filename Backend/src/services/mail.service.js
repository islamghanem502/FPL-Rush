const { Resend } = require("resend");

// Lazy getter — instantiated on first use so dotenv has time to load
const getResend = () => new Resend(process.env.RESEND_API_KEY);

// ── Generic text email ────────────────────────────────────────────────────────
const sendMail = async (to, subject, text) => {
  try {
    await getResend().emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text
    });
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
};

// ── Password Reset Code (only Resend use case) ─────────────────────────────────
const sendPasswordResetEmail = async (to, code) => {
  const html = `
  <!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0f0f1a; margin: 0; padding: 0; }
      .container { max-width: 520px; margin: 40px auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a4a; }
      .header { background: linear-gradient(135deg, #6c47ff, #00c6ff); padding: 32px; text-align: center; }
      .header h1 { color: #fff; margin: 0; font-size: 26px; letter-spacing: 1px; }
      .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
      .body { padding: 32px; color: #c8c8d8; line-height: 1.7; text-align: center; }
      .body p { margin: 0 0 16px; font-size: 15px; }
      .code-box { display: inline-block; background: #0f0f1a; border: 2px dashed #6c47ff; border-radius: 16px; padding: 16px 32px; margin: 16px 0; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #00c6ff; font-family: monospace; }
      .note { background: #12122a; border-radius: 10px; padding: 14px 18px; font-size: 13px; color: #888; margin-top: 20px; border-right: 3px solid #ff4747; text-align: right; }
      .footer { text-align: center; padding: 18px; font-size: 12px; color: #555; border-top: 1px solid #2a2a4a; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>⚡ FPL Rush</h1>
        <p>رمز إعادة تعيين كلمة المرور</p>
      </div>
      <div class="body">
        <p>استقبلنا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
        <p>رمز التحقق الخاص بك هو:</p>
        <div class="code-box">${code}</div>
        <div class="note">
          ⏰ هذا الرمز صالح لمدة <strong>15 دقيقة</strong> فقط.<br/>
          إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذا البريد — حسابك بأمان تام.
        </div>
      </div>
      <div class="footer">© 2025 FPL Rush — All rights reserved</div>
    </div>
  </body>
  </html>
  `;

  try {
    await getResend().emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject: `🔑 كود إعادة تعيين كلمة المرور: ${code}`,
      html
    });
    return true;
  } catch (error) {
    console.error("Password reset email error:", error);
    return false;
  }
};

module.exports = { sendMail, sendPasswordResetEmail };
