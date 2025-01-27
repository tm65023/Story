import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Mail, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthMode = "signup" | "login" | "verify";
type ValidationError = { email?: string; code?: string };

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<ValidationError>({});
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    if (!email) {
      return "Email is required";
    }
    if (!email.includes('@')) {
      return "Please enter a valid email address";
    }
    return undefined;
  };

  const validateCode = (code: string) => {
    if (!code) {
      return "Verification code is required";
    }
    if (code.length !== 6) {
      return "Code must be 6 characters";
    }
    return undefined;
  };

  const handleError = (error: any) => {
    const message = error.message || 
      (typeof error === 'string' ? error : 'An unexpected error occurred');

    // Check for specific error messages to handle state transitions
    if (message.toLowerCase().includes('not verified')) {
      setMode('verify');
      toast({
        title: "Verification Required",
        description: "Please verify your email before logging in.",
        variant: "default",
      });
      return;
    }

    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };

  const signupMutation = useMutation({
    mutationFn: async () => {
      const emailError = validateEmail(email);
      if (emailError) {
        setErrors({ email: emailError });
        throw new Error(emailError);
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          throw new Error(data.message || text);
        } catch {
          throw new Error(text);
        }
      }

      return res.json();
    },
    onSuccess: (data) => {
      setErrors({});
      setMode("verify");
      toast({
        title: "Check your email",
        description: data.message || "We've sent you a verification code. Check your spam folder if you don't see it.",
      });
    },
    onError: handleError,
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      const emailError = validateEmail(email);
      if (emailError) {
        setErrors({ email: emailError });
        throw new Error(emailError);
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          throw new Error(data.message || text);
        } catch {
          throw new Error(text);
        }
      }

      return res.json();
    },
    onSuccess: () => {
      setErrors({});
      setMode("verify");
      toast({
        title: "Check your email",
        description: "We've sent you a verification code. Check your spam folder if you don't see it.",
      });
    },
    onError: handleError,
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const codeError = validateCode(code);
      if (codeError) {
        setErrors({ code: codeError });
        throw new Error(codeError);
      }

      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          throw new Error(data.message || text);
        } catch {
          throw new Error(text);
        }
      }

      return res.json();
    },
    onSuccess: () => {
      setErrors({});
      toast({
        title: "Success",
        description: mode === "signup" ? "Account created successfully" : "Logged in successfully",
      });
      // The page will automatically redirect since user state will update
    },
    onError: handleError,
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {mode === "verify" ? (
              <>
                <Mail className="h-5 w-5 text-primary" />
                Enter Verification Code
              </>
            ) : mode === "signup" ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Create Account
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Welcome Back
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "verify" ? (
            <>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  We've sent a verification code to <span className="font-medium">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  The code will expire in 10 minutes. Check your spam folder if you don't see it.
                </p>
              </div>

              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter verification code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setErrors({});
                  }}
                  className={cn(
                    "text-center text-2xl tracking-widest",
                    errors.code && "border-destructive"
                  )}
                  maxLength={6}
                />
                {errors.code && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {errors.code}
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending || !code}
              >
                {verifyMutation.isPending ? "Verifying..." : "Verify Code"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors({});
                  }}
                  className={cn(errors.email && "border-destructive")}
                />
                {errors.email && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email}
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                onClick={() =>
                  mode === "signup" ? signupMutation.mutate() : loginMutation.mutate()
                }
                disabled={
                  (mode === "signup" ? signupMutation.isPending : loginMutation.isPending) ||
                  !email
                }
              >
                {mode === "signup" 
                  ? (signupMutation.isPending ? "Signing up..." : "Sign Up")
                  : (loginMutation.isPending ? "Logging in..." : "Log In")}
              </Button>
            </>
          )}

          {mode !== "verify" && (
            <Button
              variant="link"
              className="w-full"
              onClick={() => {
                setMode(mode === "signup" ? "login" : "signup");
                setErrors({});
              }}
            >
              {mode === "signup"
                ? "Already have an account? Log in"
                : "Need an account? Sign up"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}