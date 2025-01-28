import nodemailer from "nodemailer";

const isDevelopment = process.env.NODE_ENV !== "production";

// In development, we'll create a test account if SMTP isn't configured
async function createDevTransporter() {
  // Create test account if SMTP not configured
  const testAccount = await nodemailer.createTestAccount();
  console.log("Created test email account:", {
    user: testAccount.user,
    pass: testAccount.pass,
  });

  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

async function createTransporter() {
  // If we're in development and no SMTP is configured or fails, use test account
  if (isDevelopment) {
    return createDevTransporter();
  }

  // Check required env vars only if SMTP is being used
  if (process.env.SMTP_HOST) {
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error(`Missing email configuration: ${missingVars.join(', ')}`);
      throw new Error("Email configuration missing. Check SMTP_* environment variables");
    }
  }

  // In development, always log the configuration attempt
  if (isDevelopment) {
    console.log("Attempting SMTP configuration with:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: "****"
      }
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT!),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    return transporter;
  } catch (error) {
    console.error("Failed to create SMTP transporter:", error);
    if (isDevelopment) {
      return createDevTransporter();
    }
    throw error;
  }
}

export async function sendOTPEmail(to: string, otp: string, type: "signup" | "login") {
  const subject = type === "signup" ? "Complete your registration" : "Login verification code";

  // Always log the OTP in development
  if (isDevelopment) {
    console.log(`[DEV MODE] Verification code for ${to}: ${otp}`);
    // In dev mode without SMTP, we can return early since the code is logged
    if (!process.env.SMTP_HOST) {
      return;
    }
  }

  try {
    const mailer = await createTransporter();

    const info = await mailer.sendMail({
      from: process.env.SMTP_USER ? `"Story" <${process.env.SMTP_USER}>` : '"Story" <no-reply@story.app>',
      to,
      subject,
      text: `Your verification code is: ${otp}\nThis code will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${subject}</h2>
          <p style="font-size: 16px; color: #666;">Your verification code is:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #999;">This code will expire in 10 minutes.</p>
          <p style="font-size: 12px; color: #999; margin-top: 20px;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (isDevelopment && info) {
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (error) {
    console.error("Failed to send email:", error);
    // In development, we'll continue even if email fails
    // since the code is already logged
    if (!isDevelopment) {
      throw error;
    }
  }
}