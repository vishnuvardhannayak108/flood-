"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ArrowRight,
  Phone,
  Eye,
  EyeOff,
  Radio,
  Shield,
  Zap,
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
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const { t } = useTranslation();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [supabaseUsers, setSupabaseUsers] = useState<SupabaseUserCredential[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function loadSupabaseCredentials() {
      try {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });
      if (error) {
        setErrorMsg(`Authentication failed: ${error.message}`);
        setLoading(false);
        return;
      }
      if (data?.user) {
        const role =
          data.user.user_metadata?.role ||
          (cleanEmail.includes("admin")
            ? "admin"
            : cleanEmail.includes("rescue")
            ? "rescue_team"
            : cleanEmail.includes("volunteer")
            ? "volunteer"
            : "citizen");
        const defaultPortal =
          role === "admin"
            ? "/admin"
            : role === "rescue_team"
            ? "/rescue"
            : role === "volunteer"
            ? "/volunteer"
            : "/citizen";
        window.location.href = nextPath || defaultPortal;
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
      if (error) { setErrorMsg(`SMS failed: ${error.message}`); setLoading(false); return; }
      setOtpSent(true);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone.trim(), token: otpCode.trim(), type: "sms",
      });
      if (error) { setErrorMsg(`Verification failed: ${error.message}`); setLoading(false); return; }
      if (data?.user) window.location.href = nextPath || "/citizen";
    } catch (err) {
      setErrorMsg((err as Error).message);
      setLoading(false);
    }
  };

  const applyCredentials = (credEmail: string, credPass: string) => {
    setEmail(credEmail);
    setPassword(credPass);
    setErrorMsg(null);
    setCopiedField(credEmail);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return { label: "Admin HQ", className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20", icon: ShieldCheck };
      case "rescue_team": return { label: "Rescue Ops", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", icon: ShieldAlert };
      case "volunteer": return { label: "Volunteer", className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20", icon: HeartHandshake };
      default: return { label: "Citizen", className: "bg-primary/10 text-primary border-primary/20", icon: User };
    }
  };

  return (
    <div className="flex-1 min-h-screen flex">

      {/* ─── Left Brand Panel (desktop only) ─── */}
      <div className="hidden lg:flex lg:w-[440px] xl:w-[520px] shrink-0 flex-col relative overflow-hidden bg-[hsl(222_32%_8%)]">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-sos/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-safe/10 blur-3xl" />
        </div>
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative flex flex-col h-full p-10 xl:p-12">
          {/* Logo */}
          <BrandLogo size={32} variant="white" />

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight">
                Coordinated rescue.{" "}
                <br />
                <span className="text-gradient-primary">When it matters.</span>
              </h2>
              <p className="text-white/60 leading-relaxed text-sm">
                Sign in to access your role-specific command portal for real-time
                flood emergency coordination.
              </p>
            </div>

            {/* Feature bullets */}
            <div className="space-y-3">
              {[
                { icon: Zap, text: "Sub-3-tap SOS dispatch" },
                { icon: Radio, text: "Real-time GPS tracking" },
                { icon: Shield, text: "Offline-first PWA" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.text} className="flex items-center gap-3 text-sm text-white/70">
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-white/10 border border-white/10 shrink-0">
                      <Icon className="h-3.5 w-3.5 text-white/80" />
                    </div>
                    {item.text}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-white/30 text-xs">
            FERRCS · Disaster-hardened coordination system
          </p>
        </div>
      </div>

      {/* ─── Right Form Panel ─── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile-only logo */}
          <div className="lg:hidden flex justify-center mb-2">
            <BrandLogo size={28} />
          </div>

          {/* Header */}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your FERRCS account
              {nextPath && (
                <span className="ml-1 text-primary font-medium">to continue</span>
              )}
            </p>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/8 border border-destructive/20 text-destructive text-sm animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="break-all">{errorMsg}</span>
            </div>
          )}

          {/* Auth forms */}
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-1">
              <TabsTrigger value="email">Email & Password</TabsTrigger>
              <TabsTrigger value="phone">Phone OTP</TabsTrigger>
            </TabsList>

            {/* Email form */}
            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@ferrcs.demo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pr-11 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</>
                  ) : (
                    <><KeyRound className="mr-2 h-4 w-4" />Sign In</>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Phone OTP form */}
            <TabsContent value="phone">
              {!otpSent ? (
                <form onSubmit={handleSendPhoneOtp} className="space-y-4 pt-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm font-semibold">Mobile Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 91000 00002"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required disabled={loading}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">A 6-digit code will be sent via SMS.</p>
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Code
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4 pt-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="otp" className="text-sm font-semibold">6-Digit Passcode</Label>
                    <Input
                      id="otp" type="text" maxLength={6}
                      placeholder="1 2 3 4 5 6"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required disabled={loading}
                      className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                    />
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify & Sign In
                  </Button>
                  <button type="button" onClick={() => setOtpSent(false)}
                    className="text-xs text-muted-foreground hover:text-foreground w-full text-center transition-colors">
                    ← Change phone number
                  </button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          {/* Register link */}
          <p className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Create one
            </Link>
          </p>

          {/* Credentials directory */}
          {(loadingUsers || supabaseUsers.length > 0) && (
            <div className="border border-border/60 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b border-border/40">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-foreground">Demo Accounts</span>
                <span className="ml-auto text-[10px] font-mono text-muted-foreground">Live Supabase</span>
              </div>
              <div className="divide-y divide-border/40 max-h-64 overflow-y-auto">
                {loadingUsers ? (
                  <div className="p-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading accounts…
                  </div>
                ) : (
                  supabaseUsers.map((u) => {
                    const badge = getRoleBadge(u.role);
                    const Icon = badge.icon;
                    const isCurrent = email === u.email;
                    return (
                      <div
                        key={u.email}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                          isCurrent ? "bg-primary/5" : "hover:bg-muted/40"
                        }`}
                      >
                        <div className={`flex items-center justify-center h-7 w-7 rounded-lg border shrink-0 ${badge.className}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badge.className}`}>
                              {badge.label}
                            </span>
                            <span className="text-[11px] font-medium text-foreground truncate">{u.fullName}</span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground truncate block">{u.email}</span>
                        </div>
                        <Button
                          type="button"
                          variant={isCurrent ? "default" : "outline"}
                          size="sm"
                          onClick={() => applyCredentials(u.email, u.password)}
                          className="h-7 px-2.5 text-[10px] shrink-0"
                        >
                          {copiedField === u.email ? (
                            <><Check className="h-3 w-3 mr-1 text-emerald-500" />Done</>
                          ) : (
                            <>Fill <ArrowRight className="h-3 w-3 ml-1" /></>
                          )}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
