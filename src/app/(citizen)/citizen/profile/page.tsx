"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { 
  User, 
  Phone, 
  MapPin, 
  Globe, 
  ShieldCheck, 
  LogOut, 
  Plus, 
  Trash2,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export default function CitizenProfilePage() {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("Priya Sharma");
  const [phone, setPhone] = useState("+91 91000 00002");
  const [address, setAddress] = useState("Flat 302, Riverview Apts, Khairatabad, Hyderabad");
  const [saved, setSaved] = useState(false);

  const [contacts, setContacts] = useState([
    { name: "Rajesh Sharma (Brother)", phone: "+91 98765 11111" },
  ]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const removeContact = (idx: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <span>Citizen Profile & Settings</span>
        </h1>
      </div>

      <Card className="shadow-sm border">
        <CardContent className="p-4 space-y-4">
          {saved && (
            <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="profName" className="text-xs font-semibold">Full Name</Label>
              <Input
                id="profName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profPhone" className="text-xs font-semibold">Primary Contact Phone</Label>
              <Input
                id="profPhone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profHome" className="text-xs font-semibold flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>Saved Home Location / Address</span>
              </Label>
              <Input
                id="profHome"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Building, street, neighborhood..."
              />
              <p className="text-[11px] text-muted-foreground">
                Prefilled when triggering SOS from home.
              </p>
            </div>

            <Button type="submit" size="sm" className="w-full h-10 font-bold bg-primary">
              Save Profile Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Emergency Contacts Section */}
      <Card className="shadow-sm border">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-bold text-foreground">
            Emergency Contacts (Next of Kin)
          </CardTitle>
          <CardDescription className="text-xs">
            Notified with your status link when you trigger an emergency SOS.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 pt-1 space-y-2">
          {contacts.map((c, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/40 text-xs">
              <div>
                <div className="font-bold text-foreground">{c.name}</div>
                <div className="text-muted-foreground">{c.phone}</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeContact(i)}
                className="h-7 w-7 text-muted-foreground hover:text-sos"
                aria-label="Remove contact"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          <Button variant="outline" size="sm" className="w-full text-xs font-semibold mt-1">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Emergency Contact
          </Button>
        </CardContent>
      </Card>

      {/* Preferences & Sign Out */}
      <Card className="shadow-sm border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs py-1 border-b">
            <span className="font-semibold text-foreground">Preferred App Language</span>
            <LanguageSwitcher />
          </div>

          <div className="flex items-center justify-between text-xs py-1 border-b">
            <span className="font-semibold text-foreground">Interface Theme</span>
            <ThemeToggle />
          </div>

          <Button variant="outline" className="w-full text-xs font-semibold text-sos hover:bg-red-50 dark:hover:bg-red-950/30" asChild>
            <Link href="/login">
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sign Out from Device
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
