import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type SignupForm = z.infer<typeof signupSchema>;
type LoginForm = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [otpRequested, setOtpRequested] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      otp: "",
    },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      otp: "",
    },
  });

  // Request OTP mutations
  const requestLoginOTP = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/auth/login/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      setOtpRequested(true);
      toast({
        title: "OTP Sent",
        description: "Please check your email for the verification code",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const requestSignupOTP = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/auth/signup/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      setOtpRequested(true);
      toast({
        title: "OTP Sent",
        description: "Please check your email for the verification code",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify OTP mutations
  const verifyLoginOTP = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await fetch("/api/auth/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      setLocation("/");
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifySignupOTP = useMutation({
    mutationFn: async (data: SignupForm) => {
      const res = await fetch("/api/auth/signup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      setLocation("/");
      toast({
        title: "Success",
        description: "Account created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLoginSubmit = async (data: LoginForm) => {
    if (!otpRequested) {
      await requestLoginOTP.mutateAsync(data.email);
    } else {
      await verifyLoginOTP.mutateAsync(data);
    }
  };

  const handleSignupSubmit = async (data: SignupForm) => {
    if (!otpRequested) {
      await requestSignupOTP.mutateAsync(data.email);
    } else {
      await verifySignupOTP.mutateAsync(data);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>{isLogin ? "Login" : "Create Account"}</CardTitle>
          <CardDescription>
            {otpRequested
              ? "Enter the verification code sent to your email"
              : `${isLogin ? "Login" : "Sign up"} to your account using OTP`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLogin ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" disabled={otpRequested} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {otpRequested && (
                  <FormField
                    control={loginForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Code</FormLabel>
                        <FormControl>
                          <Input {...field} maxLength={6} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={requestLoginOTP.isPending || verifyLoginOTP.isPending}
                >
                  {(requestLoginOTP.isPending || verifyLoginOTP.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {otpRequested ? "Verify Code" : "Request Code"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(handleSignupSubmit)} className="space-y-4">
                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" disabled={otpRequested} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" disabled={otpRequested} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {otpRequested && (
                  <FormField
                    control={signupForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Code</FormLabel>
                        <FormControl>
                          <Input {...field} maxLength={6} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={requestSignupOTP.isPending || verifySignupOTP.isPending}
                >
                  {(requestSignupOTP.isPending || verifySignupOTP.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {otpRequested ? "Create Account" : "Request Code"}
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setOtpRequested(false);
              }}
              className="text-primary hover:underline"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
