import nodemailer from "nodemailer";

async function createTransporter() {
  try {
    // First try configured SMTP settings
    console.log("Attempting to use configured SMTP settings...");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT!),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify the connection
    await transporter.verify();
    console.log("SMTP connection verified successfully");
    return transporter;
  } catch (error) {
    console.log("SMTP connection failed, falling back to Ethereal email");
    // Create test account as fallback
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
  }
}

export async function sendOTPEmail(to: string, otp: string, type: "signup" | "login") {
  const subject = type === "signup" ? "Complete your registration" : "Login verification code";

  console.log(`Attempting to send ${type} verification code to ${to}`);

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

    // Always show preview URL in development for testing
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("Preview URL:", previewUrl);
      console.log("Open this URL to see the email in your browser");
    }

    return info;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}