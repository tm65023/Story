import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "signup" | "login" | "verify";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const { toast } = useToast();

  const handleError = (error: any) => {
    const message = error.message || 
      (typeof error === 'string' ? error : 'An unexpected error occurred');

    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };

  const signupMutation = useMutation({
    mutationFn: async () => {
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
      if (data.action === "verify") {
        setMode("verify");
      }
      toast({
        title: "Check your email",
        description: data.message || "We've sent you a verification code",
      });
    },
    onError: handleError,
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setMode("verify");
      toast({
        title: "Check your email",
        description: "We've sent you a verification code",
      });
    },
    onError: handleError,
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
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
          <CardTitle>
            {mode === "verify"
              ? "Enter Verification Code"
              : mode === "signup"
              ? "Create Account"
              : "Welcome Back"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "verify" ? (
            <>
              <p className="text-sm text-muted-foreground">
                Enter the verification code sent to your email.
                If you don't see it, check your spam folder.
              </p>
              <Input
                type="text"
                placeholder="Enter verification code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center text-2xl tracking-widest"
                maxLength={6}
              />
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
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
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
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
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