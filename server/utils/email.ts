import nodemailer from "nodemailer";

if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  throw new Error("Email configuration missing. Check SMTP_* environment variables");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOTPEmail(to: string, otp: string, type: "signup" | "login") {
  const subject = type === "signup" ? "Complete your registration" : "Login verification code";
  const text = `Your verification code is: ${otp}\nThis code will expire in 10 minutes.`;
  
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${subject}</h2>
        <p style="font-size: 16px; color: #666;">Your verification code is:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #999;">This code will expire in 10 minutes.</p>
      </div>
    `,
  });
}
