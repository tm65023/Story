import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "@db";
import { users, otps } from "@db/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendOTPEmail } from "./utils/email";
import { randomBytes } from "crypto";

const generateOTP = () => {
  return randomBytes(3).toString('hex').toUpperCase();
};

const MemoryStore = createMemoryStore(session);

export function setupAuth(app: Express) {
  // Session setup
  const sessionConfig = {
    store: new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    }),
    secret: process.env.REPL_ID || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: app.get("env") === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionConfig));

  // Auth routes with improved error handling
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      if (!email.includes('@')) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }

      // Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        if (!existingUser.isVerified) {
          // Generate new OTP for unverified user
          const code = generateOTP();
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

          await db.insert(otps).values({
            userId: existingUser.id,
            code,
            expiresAt,
            type: 'signup'
          });

          // Don't wait for email to be sent
          sendOTPEmail(email, code, 'signup').catch(err => {
            console.error('Failed to send signup email:', err);
          });

          return res.json({ 
            message: "Please check your email for verification code",
            action: "verify"
          });
        }
        return res.status(400).json({ message: "Email already registered" });
      }

      // Create new user without waiting for email
      const [user] = await db.insert(users)
        .values({
          email,
          isVerified: false,
        })
        .returning();

      // Generate OTP
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await db.insert(otps).values({
        userId: user.id,
        code,
        expiresAt,
        type: 'signup'
      });

      // Send email asynchronously
      sendOTPEmail(email, code, 'signup').catch(err => {
        console.error('Failed to send signup email:', err);
      });

      res.json({ 
        message: "Please check your email for verification code",
        action: "verify"
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ 
        message: "Failed to process signup. Please try again." 
      });
    }
  });

  app.post("/api/auth/verify", async (req, res) => {
    try {
      const { email, code } = req.body;

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify OTP
      const otp = await db.query.otps.findFirst({
        where: and(
          eq(otps.userId, user.id),
          eq(otps.code, code),
          gt(otps.expiresAt, new Date())
        ),
      });

      if (!otp) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      // Update user verification status for signup
      if (otp.type === 'signup') {
        await db.update(users)
          .set({ isVerified: true })
          .where(eq(users.id, user.id));
      }

      // Set session
      req.session.userId = user.id;

      // Delete used OTP
      await db.delete(otps).where(eq(otps.id, otp.id));

      res.json({ 
        message: "Successfully verified",
        user: { id: user.id, email: user.email }
      });
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({ message: "Failed to verify code" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.isVerified) {
        return res.status(400).json({ message: "Email not verified" });
      }

      // Generate OTP
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await db.insert(otps).values({
        userId: user.id,
        code,
        expiresAt,
        type: 'login'
      });

      // Send email asynchronously
      sendOTPEmail(email, code, 'login').catch(err => {
        console.error('Failed to send login email:', err);
      });

      res.json({ 
        message: "Please check your email for verification code",
        action: "verify" 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Failed to process login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    db.query.users.findFirst({
      where: eq(users.id, req.session.userId),
    }).then(user => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: user.id, email: user.email });
    }).catch(error => {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Failed to get user details" });
    });
  });
}