import { createClient } from "./client";
import { UserRole, VerificationStatus, UrgencyLevel, IncidentType, RequestStatus } from "@/types/database";

export interface SubmitSosArgs {
  p_client_request_id?: string | null;
  p_lat: number;
  p_lng: number;
  p_accuracy?: number | null;
  p_contact_phone?: string | null;
  p_people_count?: number;
  p_has_vulnerable?: boolean;
  p_declared_urgency?: UrgencyLevel;
  p_type?: IncidentType;
  p_description?: string;
  p_address_text?: string | null;
}

export interface SubmitSosResult {
  id: string;
  short_code: string;
  status: RequestStatus;
  priority_score: number;
  duplicate_of: string | null;
  is_existing: boolean;
}

export interface UpdateSosDetailsArgs {
  p_request_id: string;
  p_people_count?: number | null;
  p_has_vulnerable?: boolean | null;
  p_declared_urgency?: UrgencyLevel | null;
  p_type?: IncidentType | null;
  p_description?: string | null;
  p_media_urls?: string[] | null;
}

export interface ReportFloodIncidentArgs {
  p_title: string;
  p_description?: string | null;
  p_severity: UrgencyLevel;
  p_lat: number;
  p_lng: number;
  p_water_level_cm?: number | null;
  p_media_urls?: string[];
}

export async function submitSosRpc(
  supabase: ReturnType<typeof createClient>,
  args: SubmitSosArgs
): Promise<{ data: SubmitSosResult | null; error: Error | null }> {
  type RpcSignature = (
    fn: string,
    params: Record<string, unknown>
  ) => Promise<{ data: SubmitSosResult | null; error: Error | null }>;

  return (supabase.rpc as unknown as RpcSignature)(
    "submit_sos",
    args as unknown as Record<string, unknown>
  );
}

export async function updateSosDetailsRpc(
  supabase: ReturnType<typeof createClient>,
  args: UpdateSosDetailsArgs
): Promise<{ data: boolean | null; error: Error | null }> {
  type RpcSignature = (
    fn: string,
    params: Record<string, unknown>
  ) => Promise<{ data: boolean | null; error: Error | null }>;

  return (supabase.rpc as unknown as RpcSignature)(
    "update_sos_details",
    args as unknown as Record<string, unknown>
  );
}

export async function cancelRequestRpc(
  supabase: ReturnType<typeof createClient>,
  args: { p_request_id: string; p_reason?: string }
): Promise<{ data: boolean | null; error: Error | null }> {
  type RpcSignature = (
    fn: string,
    params: Record<string, unknown>
  ) => Promise<{ data: boolean | null; error: Error | null }>;

  return (supabase.rpc as unknown as RpcSignature)(
    "cancel_request",
    args as unknown as Record<string, unknown>
  );
}

export async function reportFloodIncidentRpc(
  supabase: ReturnType<typeof createClient>,
  args: ReportFloodIncidentArgs
): Promise<{ data: string | null; error: Error | null }> {
  type RpcSignature = (
    fn: string,
    params: Record<string, unknown>
  ) => Promise<{ data: string | null; error: Error | null }>;

  return (supabase.rpc as unknown as RpcSignature)(
    "report_flood_incident",
    args as unknown as Record<string, unknown>
  );
}

export interface AssignRequestArgs {
  p_request_id: string;
  p_team_id: string;
}

export interface AssignRequestResult {
  operation_id: string;
  request_id: string;
  team_name: string;
  status: string;
}

export async function assignRequestRpc(
  supabase: ReturnType<typeof createClient>,
  args: AssignRequestArgs
): Promise<{ data: AssignRequestResult | null; error: Error | null }> {
  type RpcSignature = (
    fn: string,
    params: Record<string, unknown>
  ) => Promise<{ data: AssignRequestResult | null; error: Error | null }>;

  return (supabase.rpc as unknown as RpcSignature)(
    "assign_request",
    args as unknown as Record<string, unknown>
  );
}

export interface UpdateRequestStatusArgs {
  p_request_id: string;
  p_new_status: RequestStatus;
  p_note?: string | null;
  p_people_rescued?: number;
}

export async function updateRequestStatusRpc(
  supabase: ReturnType<typeof createClient>,
  args: UpdateRequestStatusArgs
): Promise<{ data: boolean | null; error: Error | null }> {
  type RpcSignature = (
    fn: string,
    params: Record<string, unknown>
  ) => Promise<{ data: boolean | null; error: Error | null }>;

  return (supabase.rpc as unknown as RpcSignature)(
    "update_request_status",
    args as unknown as Record<string, unknown>
  );
}

export interface UpdateTeamTelemetryArgs {
  p_team_id: string;
  p_lat: number;
  p_lng: number;
  p_status?: string | null;
}

export async function updateTeamTelemetryRpc(
  supabase: ReturnType<typeof createClient>,
  args: UpdateTeamTelemetryArgs
): Promise<{ data: boolean | null; error: Error | null }> {
  type RpcSignature = (
    fn: string,
    params: Record<string, unknown>
  ) => Promise<{ data: boolean | null; error: Error | null }>;

  return (supabase.rpc as unknown as RpcSignature)(
    "update_team_telemetry",
    args as unknown as Record<string, unknown>
  );
}

export interface NearbyShelterItem {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance_meters: number;
  distance_km: number;
  max_capacity: number;
  current_occupancy: number;
  occupancy_pct: number;
  status: "open" | "full" | "closed";
  facilities: string[] | Record<string, unknown>;
  contact_phone: string | null;
  contact_person: string | null;
  updated_at: string;
}

export async function nearbySheltersRpc(
  supabase: ReturnType<typeof createClient>,
  args: { p_lat: number; p_lng: number; p_radius_m?: number; p_only_open?: boolean }
): Promise<{ data: NearbyShelterItem[] | null; error: Error | null }> {
  type RpcSignature = (
    fn: string,
    params: Record<string, unknown>
  ) => Promise<{ data: NearbyShelterItem[] | null; error: Error | null }>;

  return (supabase.rpc as unknown as RpcSignature)(
    "nearby_shelters",
    args as unknown as Record<string, unknown>
  );
}

export async function updateShelterOccupancyRpc(
  supabase: ReturnType<typeof createClient>,
  args: { p_shelter_id: string; p_new_occupancy: number }
): Promise<{ data: Record<string, unknown> | null; error: Error | null }> {
  type RpcSignature = (
    fn: string,
    params: Record<string, unknown>
  ) => Promise<{ data: Record<string, unknown> | null; error: Error | null }>;

  return (supabase.rpc as unknown as RpcSignature)(
    "update_shelter_occupancy",
    args as unknown as Record<string, unknown>
  );
}

export async function broadcastWeatherAlertRpc(
  supabase: ReturnType<typeof createClient>,
  args: {
    p_severity: "info" | "warning" | "watch" | "advisory" | "critical";
    p_title: string;
    p_description: string;
    p_source?: string;
    p_expires_in_hours?: number;
  }
): Promise<{ data: string | null; error: Error | null }> {
  type RpcSignature = (
    fn: string,
    params: Record<string, unknown>
  ) => Promise<{ data: string | null; error: Error | null }>;

  return (supabase.rpc as unknown as RpcSignature)(
    "broadcast_weather_alert",
    args as unknown as Record<string, unknown>
  );
}

export async function simulateFloodScenarioRpc(
  supabase: ReturnType<typeof createClient>
): Promise<{ data: Record<string, unknown> | null; error: Error | null }> {
  type RpcSignature = (
    fn: string,
    params?: Record<string, unknown>
  ) => Promise<{ data: Record<string, unknown> | null; error: Error | null }>;

  return (supabase.rpc as unknown as RpcSignature)(
    "simulate_flood_scenario",
    {}
  );
}
