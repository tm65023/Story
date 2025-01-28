import nodemailer from "nodemailer";

const isDevelopment = process.env.NODE_ENV !== "production";

// In development, we'll create a test account if SMTP isn't configured
async function createDevTransporter() {
  try {
    // Create test account if SMTP not configured
    const testAccount = await nodemailer.createTestAccount();
    console.log("Created Ethereal test email account:", {
      user: testAccount.user,
      pass: testAccount.pass,
      web: "https://ethereal.email",
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
  } catch (error) {
    console.error("Failed to create test account:", error);
    throw error;
  }
}

async function createTransporter() {
  // In development, always use Ethereal for reliable testing
  if (isDevelopment) {
    console.log("Development mode: Using Ethereal email service");
    return createDevTransporter();
  }

  // Production SMTP setup
  if (!process.env.SMTP_HOST) {
    throw new Error("SMTP_HOST is required in production");
  }

  const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing email configuration: ${missingVars.join(', ')}`);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT!),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendOTPEmail(to: string, otp: string, type: "signup" | "login") {
  const subject = type === "signup" ? "Complete your registration" : "Login verification code";

  console.log(`Attempting to send ${type} verification code to ${to}`);

  try {
    const mailer = await createTransporter();

    // Always log the OTP in development mode
    if (isDevelopment) {
      console.log(`[DEV MODE] Verification code for ${to}: ${otp}`);
    }

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
      console.log("Ethereal Email Preview URL:", nodemailer.getTestMessageUrl(info));
      console.log("Check the preview URL to view the email in your browser");
    }

    return info;
  } catch (error) {
    console.error("Failed to send email:", error);
    // In development mode, we'll continue since we logged the code
    if (!isDevelopment) {
      throw error;
    }
  }
}