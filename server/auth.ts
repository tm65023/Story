import nodemailer from "nodemailer";
import { randomInt } from "crypto";
import { addMinutes, isBefore } from "date-fns";
import type { Request, Response, NextFunction } from "express";
import { db } from "@db";
import { users, otps } from "@db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Generate a 6-digit OTP
function generateOTP(): string {
  return randomInt(100000, 999999).toString();
}

// Send OTP via email
async function sendOTP(email: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Your Verification Code",
    text: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Verification Code</h2>
        <p style="font-size: 24px; font-weight: bold; color: #333; padding: 20px; background: #f5f5f5; border-radius: 5px; text-align: center;">
          ${otp}
        </p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
      </div>
    `,
  });
}

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Authentication routes
export function registerAuthRoutes(app: Express) {
  // Request OTP for signup
  app.post("/api/auth/signup/request", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser?.isVerified) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = addMinutes(new Date(), 10);

      // Store or update OTP
      if (existingUser) {
        await db
          .update(otps)
          .set({ code: otp, expiresAt, type: "signup" })
          .where(eq(otps.userId, existingUser.id));
      } else {
        const [user] = await db
          .insert(users)
          .values({ email })
          .returning();

        await db.insert(otps).values({
          userId: user.id,
          code: otp,
          expiresAt,
          type: "signup",
        });
      }

      // Send OTP via email
      await sendOTP(email, otp);

      res.json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Error in signup request:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  // Verify OTP and complete signup
  app.post("/api/auth/signup/verify", async (req, res) => {
    try {
      const { email, otp, password } = req.body;

      if (!email || !otp || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Find user and OTP
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        return res.status(400).json({ message: "Invalid email" });
      }

      const otpRecord = await db.query.otps.findFirst({
        where: eq(otps.userId, user.id),
      });

      if (!otpRecord || otpRecord.code !== otp || isBefore(otpRecord.expiresAt, new Date())) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // Hash password and update user
      const passwordHash = await bcrypt.hash(password, 10);
      await db
        .update(users)
        .set({ passwordHash, isVerified: true })
        .where(eq(users.id, user.id));

      // Delete used OTP
      await db.delete(otps).where(eq(otps.userId, user.id));

      // Set session
      req.session.userId = user.id;
      
      res.json({ message: "Signup completed successfully" });
    } catch (error) {
      console.error("Error in signup verification:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // Request OTP for login
  app.post("/api/auth/login/request", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user || !user.isVerified) {
        return res.status(400).json({ message: "Invalid email" });
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = addMinutes(new Date(), 10);

      // Store OTP
      await db.insert(otps).values({
        userId: user.id,
        code: otp,
        expiresAt,
        type: "login",
      });

      // Send OTP via email
      await sendOTP(email, otp);

      res.json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Error in login request:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  // Verify OTP and complete login
  app.post("/api/auth/login/verify", async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        return res.status(400).json({ message: "Invalid email" });
      }

      // Verify OTP
      const otpRecord = await db.query.otps.findFirst({
        where: eq(otps.userId, user.id),
      });

      if (!otpRecord || otpRecord.code !== otp || isBefore(otpRecord.expiresAt, new Date())) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // Delete used OTP
      await db.delete(otps).where(eq(otps.userId, user.id));

      // Set session
      req.session.userId = user.id;

      res.json({
        message: "Login successful",
        user: { id: user.id, email: user.email },
      });
    } catch (error) {
      console.error("Error in login verification:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId!),
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ id: user.id, email: user.email });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
