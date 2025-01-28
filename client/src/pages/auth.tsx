import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

type AuthMode = "signup" | "login" | "verify";
type ValidationError = { email?: string; code?: string };

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<ValidationError>({});
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [previousMode, setPreviousMode] = useState<AuthMode>("login");
  const queryClient = useQueryClient();

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

    if (message.toLowerCase().includes('not verified')) {
      setPreviousMode(mode);
      setMode('verify');
      toast({
        title: "Verification Required",
        description: "Please verify your email to continue.",
      });
      return;
    }

    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };

  const parseResponse = async (res: Response) => {
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

      return parseResponse(res);
    },
    onSuccess: () => {
      setErrors({});
      setPreviousMode("signup");
      setMode("verify");
      toast({
        title: "Check your email",
        description: "We've sent you a verification code.",
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

      return parseResponse(res);
    },
    onSuccess: () => {
      setErrors({});
      setPreviousMode("login");
      setMode("verify");
      toast({
        title: "Check your email",
        description: "We've sent you a verification code.",
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

      console.log('Sending verification request:', { email, code });
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await parseResponse(res);
      console.log('Verification response:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Verification successful, updating query data and redirecting');
      setErrors({});
      queryClient.setQueryData(['/api/auth/user'], data.user);
      window.location.href = '/';
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
                Verify Your Email
              </>
            ) : (
              <>
                <Mail className="h-5 w-5 text-primary" />
                {mode === "signup" ? "Create Story Account" : "Welcome to Story"}
              </>
            )}
          </CardTitle>
          {mode !== "verify" && (
            <CardDescription>
              Sign in securely with just your email - no password needed
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "verify" ? (
            <>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  We've sent a verification code to <span className="font-medium">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code to continue
                </p>
              </div>

              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
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
                {verifyMutation.isPending ? "Verifying..." : "Verify and Sign In"}
              </Button>

              <Button
                variant="ghost"
                className="w-full flex items-center gap-2"
                onClick={() => {
                  setMode(previousMode);
                  setCode("");
                  setErrors({});
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Change Email
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
                className="w-full flex items-center gap-2"
                onClick={() =>
                  mode === "signup" ? signupMutation.mutate() : loginMutation.mutate()
                }
                disabled={
                  (mode === "signup" ? signupMutation.isPending : loginMutation.isPending) ||
                  !email
                }
              >
                {mode === "signup" 
                  ? (signupMutation.isPending ? "Creating Account..." : "Continue with Email")
                  : (loginMutation.isPending ? "Signing In..." : "Continue with Email")}
                <ArrowRight className="h-4 w-4" />
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
                ? "Already have an account? Sign in"
                : "Need an account? Sign up"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}