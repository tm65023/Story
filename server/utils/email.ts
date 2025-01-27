import nodemailer from "nodemailer";

const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing email configuration: ${missingVars.join(', ')}`);
  throw new Error("Email configuration missing. Check SMTP_* environment variables");
}

let transporter: nodemailer.Transporter | null = null;
let retryCount = 0;
const MAX_RETRIES = 3;

async function createTransporter() {
  if (transporter) return transporter;

  try {
    // Log SMTP configuration (without password)
    console.log("Attempting SMTP connection with:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      secure: process.env.SMTP_PORT === "465"
    });

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT!),
      secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Gmail-specific settings
      tls: {
        rejectUnauthorized: true,
        ciphers: 'SSLv3',
      },
    });

    // Verify connection configuration
    await transporter.verify();
    console.log("SMTP connection established successfully");
    retryCount = 0; // Reset retry count on successful connection
    return transporter;
  } catch (error) {
    console.error("Failed to create SMTP transporter:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    // Reset transporter on error to force recreation
    transporter = null;

    // Handle retry logic
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Retrying SMTP connection (attempt ${retryCount} of ${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
      return createTransporter();
    }

    throw new Error("Failed to establish SMTP connection after multiple attempts. Please check your credentials.");
  }
}

export async function sendOTPEmail(to: string, otp: string, type: "signup" | "login") {
  const subject = type === "signup" ? "Complete your registration" : "Login verification code";
  const text = `Your verification code is: ${otp}\nThis code will expire in 10 minutes.`;

  try {
    console.log(`Attempting to send ${type} email to: ${to}`);
    const mailer = await createTransporter();

    const info = await mailer.sendMail({
      from: `"Mindful Journal" <${process.env.SMTP_USER}>`,
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
          <p style="font-size: 12px; color: #999; margin-top: 20px;">
            If you didn't request this code, you can safely ignore this email.
          </p>
          <p style="font-size: 12px; color: #999;">
            Having trouble? Make sure to check your spam folder.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", {
      messageId: info.messageId,
      response: info.response,
    });
    return info;
  } catch (error) {
    console.error("Failed to send email:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    // Test SMTP connection to provide better error messages
    try {
      await createTransporter();
    } catch (connError) {
      if (connError instanceof Error && connError.message.includes('535')) {
        throw new Error(
          "Email server rejected the credentials. If you're using Gmail, make sure to use an App Password instead of your regular password."
        );
      }
    }

    throw error;
  }
}

// Test SMTP connection on startup
createTransporter().catch(error => {
  console.error("Initial SMTP connection test failed:", error);
});