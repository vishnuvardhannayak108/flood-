"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/shared/brand-logo";
import { UserRole } from "@/types/database";
import { AlertCircle, CheckCircle2, Loader2, ShieldAlert, User, HeartHandshake } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<UserRole>("citizen");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [vehicleType, setVehicleType] = useState("Inflatable Boat");
  const [capacity, setCapacity] = useState("4");
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const isMock = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").includes("dummy-project");
    if (isMock) {
      if (role === "citizen") {
        document.cookie = `ferrcs_demo_role=citizen; path=/`;
        router.push("/citizen");
      } else {
        router.push("/pending-approval");
      }
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          role,
          organization: orgName,
          vehicle_type: vehicleType,
          capacity: parseInt(capacity) || 4,
          skills,
        },
      },
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (data.user) {
      if (role === "citizen") {
        router.push("/citizen");
      } else {
        router.push("/pending-approval");
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
      <Card className="w-full max-w-lg shadow-lg border-2 my-4">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <BrandLogo size={32} />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create FERRCS Account</CardTitle>
          <CardDescription>
            Join the flood emergency network as a citizen, rescue responder, or volunteer.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-md flex items-center gap-2 text-sm text-red-800 dark:text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Role Selection Segment */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Account Type</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole("citizen")}
                className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${
                  role === "citizen"
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <User className="h-5 w-5 mb-1 text-blue-500" />
                <span className="text-xs">Citizen</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("rescue_team")}
                className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${
                  role === "rescue_team"
                    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shadow-sm"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <ShieldAlert className="h-5 w-5 mb-1 text-amber-500" />
                <span className="text-xs">Rescue Team</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("volunteer")}
                className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${
                  role === "volunteer"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <HeartHandshake className="h-5 w-5 mb-1 text-emerald-500" />
                <span className="text-xs">Volunteer</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name / Primary Contact</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password (Minimum 8 characters)</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {/* Additional Fields for Rescue Team */}
            {role === "rescue_team" && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Rescue Team Credentials (Requires Admin Verification)
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization / Agency</Label>
                  <Input
                    id="orgName"
                    placeholder="e.g. SDRF Team Bravo / Local Boat Club"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleType">Primary Vehicle</Label>
                    <Input
                      id="vehicleType"
                      placeholder="e.g. Inflatable Boat"
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacity">Evacuation Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min={1}
                      max={50}
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Additional Fields for Volunteer */}
            {role === "volunteer" && (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Volunteer Qualifications
                </div>

                <div className="space-y-2">
                  <Label>Relevant Disaster Skills</Label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {["First Aid Certified", "Swimming & Water Rescue", "Boat Navigation", "Logistics & Food Distribution"].map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`p-2 rounded border text-left flex items-center justify-between ${
                          skills.includes(skill)
                            ? "bg-emerald-600 text-white font-semibold"
                            : "bg-background text-foreground hover:bg-muted"
                        }`}
                      >
                        <span>{skill}</span>
                        {skills.includes(skill) && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {role === "citizen" ? "Complete Registration" : "Submit for Verification"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
