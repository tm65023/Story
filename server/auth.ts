import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "@db";
import { users, otps } from "@db/schema";
import { eq, and, gt } from "drizzle-orm";
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

  // Auth routes
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
        return res.status(400).json({ message: "Email already registered" });
      }

      // Create new user
      const [user] = await db.insert(users)
        .values({
          email,
          isVerified: true, // No email verification needed
        })
        .returning();

      // Generate OTP for login
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await db.insert(otps).values({
        userId: user.id,
        code,
        expiresAt,
        type: 'signup'
      });

      console.log(`New signup OTP generated: ${code}`);
      res.json({ message: "Account created. Use the code shown in console to login." });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: "Failed to process signup" });
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

      // Delete any existing OTPs for this user
      await db.delete(otps).where(eq(otps.userId, user.id));

      // Generate OTP
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await db.insert(otps).values({
        userId: user.id,
        code,
        expiresAt,
        type: 'login'
      });

      console.log(`New login OTP generated: ${code}`);
      res.json({ message: "Please use the code shown in console to verify" });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Failed to process login" });
    }
  });

  app.post("/api/auth/verify", async (req, res) => {
    try {
      const { email, code } = req.body;

      // Convert code to uppercase for consistent comparison
      const normalizedCode = code.toUpperCase();

      console.log(`Attempting to verify code: ${normalizedCode} for email: ${email}`);

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        console.log('User not found for email:', email);
        return res.status(404).json({ message: "User not found" });
      }

      // Verify OTP
      const otp = await db.query.otps.findFirst({
        where: and(
          eq(otps.userId, user.id),
          eq(otps.code, normalizedCode)
        ),
      });

      if (!otp) {
        console.log('No matching OTP found');
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      // Check if OTP is expired
      if (otp.expiresAt < new Date()) {
        console.log('OTP expired');
        await db.delete(otps).where(eq(otps.id, otp.id));
        return res.status(400).json({ message: "Code has expired. Please request a new one." });
      }

      // Set session
      req.session.userId = user.id;

      // Delete used OTP
      await db.delete(otps).where(eq(otps.id, otp.id));

      console.log(`Successfully verified code for user: ${user.id}`);

      res.json({ 
        message: "Successfully verified",
        user: { id: user.id, email: user.email }
      });
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({ message: "Failed to verify code" });
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