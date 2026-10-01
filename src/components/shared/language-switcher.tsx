"use client";

import React from "react";
import { useTranslation, Language } from "@/lib/i18n/context";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  const languages: { code: Language; label: string }[] = [
    { code: "en", label: "English" },
    { code: "te", label: "తెలుగు" },
    { code: "hi", label: "हिन्दी" },
  ];

  return (
    <div className="relative inline-flex items-center">
      <label htmlFor="language-select" className="sr-only">
        Select Language
      </label>
      <div className="flex items-center gap-1 bg-secondary/80 hover:bg-secondary border rounded-md px-2 py-1 text-xs font-semibold">
        <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
        <select
          id="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-transparent text-xs font-semibold cursor-pointer outline-none focus:ring-0 text-foreground"
          aria-label="Language selector"
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code} className="bg-background text-foreground">
              {l.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
