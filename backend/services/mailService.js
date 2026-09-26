const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASSWORD) {
    return nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT) || 587,
      secure: Number(process.env.MAIL_PORT) === 465,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }
  return null;
};

const sendPasswordResetEmail = async ({ toEmail, userName, resetUrl }) => {
  const transporter = createTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; }
        .email-container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
        .email-header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px; text-align: center; color: #ffffff; }
        .email-header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px; }
        .email-body { padding: 32px 28px; color: #334155; line-height: 1.6; }
        .email-body h2 { color: #1e293b; margin-top: 0; font-size: 20px; }
        .btn-container { text-align: center; margin: 32px 0; }
        .reset-btn { background-color: #4f46e5; color: #ffffff !important; padding: 14px 28px; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
        .email-footer { background-color: #f8fafc; padding: 20px 28px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .warning-text { background: #fffbe6; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #78350f; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>Kabi Notes</h1>
        </div>
        <div class="email-body">
          <h2>Password Reset Request</h2>
          <p>Hello <strong>${userName}</strong>,</p>
          <p>You requested to reset your password for your Kabi Notes account. Click the button below to set a new password:</p>
          <div class="btn-container">
            <a href="${resetUrl}" class="reset-btn" target="_blank">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4f46e5;"><a href="${resetUrl}">${resetUrl}</a></p>
          <div class="warning-text">
            ⏰ <strong>Important:</strong> This password reset link will expire in <strong>15 minutes</strong>. If you did not request this, please ignore this email.
          </div>
        </div>
        <div class="email-footer">
          &copy; ${new Date().getFullYear()} Kabi Notes App. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log('\n======================================================');
    console.log('📬 MAIL SERVICE NOTICE: SMTP Credentials not configured in .env');
    console.log(`To Email: ${toEmail}`);
    console.log(`User Name: ${userName}`);
    console.log(`PASSWORD RESET LINK: ${resetUrl}`);
    console.log('======================================================\n');
    return { success: true, simulated: true };
  }

  const mailOptions = {
    from: process.env.MAIL_FROM || '"Kabi Notes" <noreply@kabinotes.com>',
    to: toEmail,
    subject: 'Password Reset Request - Kabi Notes',
    html: htmlContent,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent successfully: ${info.messageId}`);
  return { success: true, messageId: info.messageId };
};

module.exports = {
  sendPasswordResetEmail,
};
