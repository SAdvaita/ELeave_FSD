import nodemailer from 'nodemailer';

// Create a reusable transporter using Gmail SMTP
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
};

/**
 * Send a password reset OTP email
 * @param {string} toEmail - recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} name - recipient's name
 */
export const sendPasswordResetEmail = async (toEmail, otp, name) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `"ETime LMS" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: '🔑 Your ETime LMS Password Reset OTP',
        html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 40px; text-align: center;">
                <div style="font-size: 36px; margin-bottom: 8px;">🏢</div>
                <div style="color: white; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">ETime LMS</div>
                <div style="color: rgba(255,255,255,0.75); font-size: 13px; margin-top: 4px;">Leave Management System</div>
            </div>

            <!-- Body -->
            <div style="background: white; padding: 36px 40px;">
                <p style="font-size: 16px; color: #1e293b; margin: 0 0 8px; font-weight: 600;">Hello ${name} 👋</p>
                <p style="font-size: 14px; color: #64748b; margin: 0 0 28px; line-height: 1.6;">
                    We received a request to reset your ETime LMS password. Use the OTP below to proceed. 
                    This code expires in <strong>10 minutes</strong>.
                </p>

                <!-- OTP Box -->
                <div style="background: #f1f5f9; border: 2px dashed #2563eb; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 28px;">
                    <div style="font-size: 12px; font-weight: 700; color: #64748b; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">Your Reset OTP</div>
                    <div style="font-size: 44px; font-weight: 900; color: #2563eb; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 10px;">Valid for 10 minutes only</div>
                </div>

                <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0;">
                    If you didn't request this, you can safely ignore this email. Your password won't change.
                </p>
            </div>

            <!-- Footer -->
            <div style="background: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">© 2026 ETime LMS · All rights reserved</p>
            </div>
        </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};
