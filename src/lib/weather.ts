// Weather Alert and Hydrological Telemetry Helper

export type AlertSeverity = "info" | "warning" | "watch" | "advisory" | "critical";

export interface WeatherAlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  source: string;
  issuedAt: string;
  expiresAt: string;
  floodBasin?: string;
  suggestedAction?: string;
}

export interface HydrologicalReading {
  gaugeName: string;
  currentLevelM: number;
  dangerLevelM: number;
  trend: "rising" | "steady" | "falling";
  flowRateCusecs: number;
  lastUpdated: string;
}

export const DEMO_WEATHER_ALERTS: WeatherAlertItem[] = [
  {
    id: "alert-1",
    severity: "critical",
    title: "Flash Flood Emergency: Musi River Basin",
    description:
      "Extremely heavy rainfall (185mm) upstream has forced the opening of 8 flood gates at Himayat Sagar and Osman Sagar reservoirs (12,000 cusecs total outflow). Low-lying residential areas in Chaderghat, Moosarambagh, and Amberpet must execute immediate evacuation.",
    source: "GHMC Disaster Management Authority / IMD",
    issuedAt: "15 mins ago",
    expiresAt: "In 12 hours",
    floodBasin: "Musi River Central Corridor",
    suggestedAction: "Move immediately to higher floors or nearest designated relief shelter."
  },
  {
    id: "alert-2",
    severity: "warning",
    title: "Severe Waterlogging & Causeway Closure",
    description:
      "Moosarambagh causeway and Chaderghat low-level bridge submerged under 3-5 ft of water. Both vehicular and foot traffic strictly prohibited by Hyderabad Traffic Police.",
    source: "Hyderabad City Police & SDRF",
    issuedAt: "45 mins ago",
    expiresAt: "In 8 hours",
    floodBasin: "Moosarambagh & Malakpet",
    suggestedAction: "Do not attempt to cross flooded causeways or underpasses."
  },
  {
    id: "alert-3",
    severity: "advisory",
    title: "High Discharge Watch: Hussain Sagar Lake",
    description:
      "Water level reached full tank level (FTL) 513.41m. Surplus water being drained into downstream nalas towards Ashok Nagar. Precautionary alert for low-lying slums.",
    source: "Irrigation & Command Area Development Dept",
    issuedAt: "2 hours ago",
    expiresAt: "In 18 hours",
    floodBasin: "Hussain Sagar Surplus Drain",
    suggestedAction: "Keep emergency bag packed with essential medications and documents."
  }
];

export const HYDRO_GAUGES: HydrologicalReading[] = [
  {
    gaugeName: "Musi River - Moosarambagh Gauge",
    currentLevelM: 4.8,
    dangerLevelM: 4.0,
    trend: "rising",
    flowRateCusecs: 14200,
    lastUpdated: "5 mins ago"
  },
  {
    gaugeName: "Himayat Sagar Reservoir Outflow",
    currentLevelM: 535.5,
    dangerLevelM: 536.0,
    trend: "rising",
    flowRateCusecs: 6500,
    lastUpdated: "12 mins ago"
  },
  {
    gaugeName: "Osman Sagar Reservoir Outflow",
    currentLevelM: 541.2,
    dangerLevelM: 542.0,
    trend: "rising",
    flowRateCusecs: 5500,
    lastUpdated: "15 mins ago"
  }
];

export const DEMO_HYDRO_GAUGES = HYDRO_GAUGES;

export function getSeverityColor(severity: AlertSeverity): {
  badgeBg: string;
  badgeText: string;
  border: string;
  iconColor: string;
} {
  switch (severity) {
    case "critical":
      return {
        badgeBg: "bg-red-100 dark:bg-red-950/60",
        badgeText: "text-red-700 dark:text-red-300",
        border: "border-l-4 border-l-red-600 border-red-200 dark:border-red-900",
        iconColor: "text-red-600"
      };
    case "warning":
      return {
        badgeBg: "bg-amber-100 dark:bg-amber-950/60",
        badgeText: "text-amber-800 dark:text-amber-300",
        border: "border-l-4 border-l-amber-500 border-amber-200 dark:border-amber-900",
        iconColor: "text-amber-600"
      };
    case "watch":
    case "advisory":
      return {
        badgeBg: "bg-blue-100 dark:bg-blue-950/60",
        badgeText: "text-blue-800 dark:text-blue-300",
        border: "border-l-4 border-l-blue-500 border-blue-200 dark:border-blue-900",
        iconColor: "text-blue-600"
      };
    default:
      return {
        badgeBg: "bg-slate-100 dark:bg-slate-800",
        badgeText: "text-slate-800 dark:text-slate-300",
        border: "border-l-4 border-l-slate-400 border-slate-200 dark:border-slate-800",
        iconColor: "text-slate-500"
      };
  }
}
