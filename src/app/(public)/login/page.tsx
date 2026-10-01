"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/shared/brand-logo";
import { useTranslation } from "@/lib/i18n/context";
import { 
  AlertCircle, 
  Loader2, 
  ShieldAlert, 
  ShieldCheck, 
  User, 
  HeartHandshake, 
  KeyRound, 
  Check, 
  Database,
  ArrowRight
} from "lucide-react";

interface SupabaseUserCredential {
  id?: string;
  email: string;
  role: string;
  fullName: string;
  phone?: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Supabase credentials fetched from backend
  const [supabaseUsers, setSupabaseUsers] = useState<SupabaseUserCredential[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch registered credentials from Supabase on mount
  useEffect(() => {
    async function loadSupabaseCredentials() {
      try {
        setLoadingUsers(true);
        const res = await fetch("/api/auth/supabase-users");
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setSupabaseUsers(data.users);
        }
      } catch (err) {
        console.error("Failed to fetch Supabase user credentials:", err);
      } finally {
        setLoadingUsers(false);
      }
    }
    loadSupabaseCredentials();
  }, []);

  // Handle Email & Password Login (Credential Authentication only)
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg("Please enter both email address and password.");
      setLoading(false);
      return;
    }

    try {
      // Authenticate directly against Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        setErrorMsg(`Supabase Authentication Failed: ${error.message}`);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Resolve user role from metadata or email structure
        const role =
          data.user.user_metadata?.role ||
          (cleanEmail.includes("admin")
            ? "admin"
            : cleanEmail.includes("rescue")
            ? "rescue_team"
            : cleanEmail.includes("volunteer")
            ? "volunteer"
            : "citizen");

        // Sync authenticated role cookie for middleware and SSR navigation
        document.cookie = `ferrcs_demo_role=${role}; path=/; max-age=86400`;

        // Direct navigation to authenticated portal
        if (role === "admin") {
          window.location.href = "/admin";
        } else if (role === "rescue_team") {
          window.location.href = "/rescue";
        } else if (role === "volunteer") {
          window.location.href = "/volunteer";
        } else {
          window.location.href = "/citizen";
        }
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "An unexpected error occurred during authentication.");
      setLoading(false);
    }
  };

  // Handle Phone OTP Send
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone.trim(),
      });

      if (error) {
        setErrorMsg(`SMS Dispatch Failed: ${error.message}`);
        setLoading(false);
        return;
      }
      setOtpSent(true);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Phone OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: otpCode.trim(),
        type: "sms",
      });

      if (error) {
        setErrorMsg(`Passcode Verification Failed: ${error.message}`);
        setLoading(false);
        return;
      }

      if (data?.user) {
        document.cookie = `ferrcs_demo_role=citizen; path=/; max-age=86400`;
        window.location.href = "/citizen";
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
      setLoading(false);
    }
  };

  // Helper to load credentials into inputs without auto-submitting
  const applyCredentials = (credEmail: string, credPass: string) => {
    setEmail(credEmail);
    setPassword(credPass);
    setErrorMsg(null);
    setCopiedField(credEmail);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return {
          label: "ADMIN HQ",
          className: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-900",
          icon: ShieldCheck,
        };
      case "rescue_team":
        return {
          label: "RESCUE OPS",
          className: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900",
          icon: ShieldAlert,
        };
      case "volunteer":
        return {
          label: "VOLUNTEER",
          className: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900",
          icon: HeartHandshake,
        };
      default:
        return {
          label: "CITIZEN",
          className: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900",
          icon: User,
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Credential Login Card */}
        <div className="lg:col-span-7">
          <Card className="w-full shadow-lg border-2">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-2">
                <BrandLogo size={36} />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">Sign In to FERRCS</CardTitle>
              <CardDescription>
                Authenticate with your verified credentials to access your designated command portal.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-md flex items-start gap-2 text-xs font-medium text-red-800 dark:text-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="break-all">{errorMsg}</span>
                </div>
              )}

              <Tabs defaultValue="email" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email">Email & Password</TabsTrigger>
                  <TabsTrigger value="phone">Phone OTP</TabsTrigger>
                </TabsList>

                {/* Email + Password Form */}
                <TabsContent value="email">
                  <form onSubmit={handleEmailLogin} className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="e.g. admin@ferrcs.demo"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link
                          href="/forgot-password"
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="font-mono"
                      />
                    </div>

                    <Button type="submit" className="w-full h-11 text-sm font-bold" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Authenticating via Supabase...
                        </>
                      ) : (
                        <>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Sign In with Credentials
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Phone OTP Form */}
                <TabsContent value="phone">
                  {!otpSent ? (
                    <form onSubmit={handleSendPhoneOtp} className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Mobile Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 91000 00002"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          disabled={loading}
                        />
                        <p className="text-[11px] text-muted-foreground">
                          A 6-digit confirmation code will be dispatched via SMS.
                        </p>
                      </div>
                      <Button type="submit" className="w-full h-11 text-sm font-bold" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Verification Code
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="otp">Enter 6-Digit Passcode</Label>
                        <Input
                          id="otp"
                          type="text"
                          maxLength={6}
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          required
                          disabled={loading}
                          className="text-center text-lg tracking-widest font-mono"
                        />
                      </div>
                      <Button type="submit" className="w-full h-11 text-sm font-bold" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify & Sign In
                      </Button>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-xs text-primary w-full text-center hover:underline"
                      >
                        Change phone number
                      </button>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>

            <CardFooter className="flex flex-col space-y-2 border-t pt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Don't have an account yet?{" "}
                <Link href="/register" className="text-primary font-semibold hover:underline">
                  Register new account
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>

        {/* Supabase Fetched Credentials Directory Panel */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border shadow-md bg-slate-100/70 dark:bg-slate-900/60">
            <CardHeader className="pb-3 pt-4 px-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold">Supabase Cloud Credentials</CardTitle>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  LIVE SUPABASE
                </span>
              </div>
              <CardDescription className="text-xs mt-1">
                Accounts registered in Supabase Auth. Click &ldquo;Autofill&rdquo; to populate the inputs, then click &ldquo;Sign In&rdquo; to authenticate.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-3 space-y-2.5 max-h-[520px] overflow-y-auto">
              {loadingUsers ? (
                <div className="p-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Fetching accounts from Supabase Auth...
                </div>
              ) : supabaseUsers.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No accounts found in Supabase Auth.
                </div>
              ) : (
                supabaseUsers.map((u) => {
                  const badge = getRoleBadge(u.role);
                  const Icon = badge.icon;
                  const isCurrent = email === u.email;

                  return (
                    <div
                      key={u.email}
                      className={`p-3 rounded-lg border bg-background transition-all ${
                        isCurrent
                          ? "border-primary ring-1 ring-primary shadow-sm"
                          : "hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${badge.className}`}
                        >
                          <Icon className="h-3 w-3" />
                          {badge.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[140px]">
                          {u.fullName}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs font-mono">
                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                          <span className="text-[10px] uppercase font-sans text-muted-foreground">Email:</span>
                          <span className="font-semibold select-all text-[11px]">{u.email}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                          <span className="text-[10px] uppercase font-sans text-muted-foreground">Password:</span>
                          <span className="font-semibold select-all text-[11px] text-primary">{u.password}</span>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t flex justify-end">
                        <Button
                          type="button"
                          variant={isCurrent ? "default" : "outline"}
                          size="sm"
                          onClick={() => applyCredentials(u.email, u.password)}
                          className="h-7 text-[11px] px-2.5"
                        >
                          {copiedField === u.email ? (
                            <>
                              <Check className="h-3 w-3 mr-1 text-emerald-500" />
                              Populated
                            </>
                          ) : (
                            <>
                              Autofill Inputs
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
