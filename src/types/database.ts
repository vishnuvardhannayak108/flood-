export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "citizen" | "rescue_team" | "volunteer" | "admin";
export type VerificationStatus = "pending" | "verified" | "rejected" | "suspended";
export type RequestStatus =
  | "submitted"
  | "verified"
  | "prioritized"
  | "assigned"
  | "accepted"
  | "en_route"
  | "on_site"
  | "completed"
  | "cancelled"
  | "rejected"
  | "duplicate";
export type UrgencyLevel = "low" | "medium" | "high" | "critical";
export type IncidentType =
  | "flooding"
  | "trapped"
  | "medical"
  | "structural_damage"
  | "missing_person"
  | "supplies_needed"
  | "other";
export type AlertSeverity = "info" | "advisory" | "warning" | "emergency";
export type TaskStatus = "open" | "accepted" | "in_progress" | "completed" | "cancelled";
export type TeamStatus = "available" | "busy" | "offline";
export type OperationStatus = "assigned" | "accepted" | "en_route" | "on_site" | "completed" | "aborted";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          role: UserRole;
          verification_status: VerificationStatus;
          preferred_language: string;
          home_location: unknown | null;
          emergency_contacts: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          role?: UserRole;
          verification_status?: VerificationStatus;
          preferred_language?: string;
          home_location?: unknown | null;
          emergency_contacts?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          role?: UserRole;
          verification_status?: VerificationStatus;
          preferred_language?: string;
          home_location?: unknown | null;
          emergency_contacts?: Json;
          updated_at?: string;
        };
      };
      rescue_teams: {
        Row: {
          id: string;
          name: string;
          organization: string;
          contact_phone: string;
          capacity: number;
          vehicle_type: string;
          status: TeamStatus;
          current_location: unknown | null;
          last_seen_at: string | null;
          verification_status: VerificationStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          organization: string;
          contact_phone: string;
          capacity?: number;
          vehicle_type?: string;
          status?: TeamStatus;
          current_location?: unknown | null;
          last_seen_at?: string | null;
          verification_status?: VerificationStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          organization?: string;
          contact_phone?: string;
          capacity?: number;
          vehicle_type?: string;
          status?: TeamStatus;
          current_location?: unknown | null;
          last_seen_at?: string | null;
          verification_status?: VerificationStatus;
        };
      };
      rescue_team_members: {
        Row: {
          team_id: string;
          user_id: string;
          is_leader: boolean;
          joined_at: string;
        };
        Insert: {
          team_id: string;
          user_id: string;
          is_leader?: boolean;
          joined_at?: string;
        };
        Update: {
          team_id?: string;
          user_id?: string;
          is_leader?: boolean;
        };
      };
      volunteers: {
        Row: {
          user_id: string;
          skills: string[];
          availability: boolean;
          verification_status: VerificationStatus;
          current_location: unknown | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          skills?: string[];
          availability?: boolean;
          verification_status?: VerificationStatus;
          current_location?: unknown | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          skills?: string[];
          availability?: boolean;
          verification_status?: VerificationStatus;
          current_location?: unknown | null;
        };
      };
      emergency_requests: {
        Row: {
          id: string;
          short_code: string;
          citizen_id: string | null;
          incident_id: string | null;
          type: IncidentType;
          description: string | null;
          people_count: number;
          has_vulnerable_persons: boolean;
          declared_urgency: UrgencyLevel;
          priority_score: number;
          status: RequestStatus;
          location: unknown;
          location_accuracy_m: number | null;
          address_text: string | null;
          contact_phone: string;
          media_urls: string[];
          duplicate_of: string | null;
          verified_by: string | null;
          client_request_id: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          short_code?: string;
          citizen_id?: string | null;
          incident_id?: string | null;
          type?: IncidentType;
          description?: string | null;
          people_count?: number;
          has_vulnerable_persons?: boolean;
          declared_urgency?: UrgencyLevel;
          priority_score?: number;
          status?: RequestStatus;
          location: unknown;
          location_accuracy_m?: number | null;
          address_text?: string | null;
          contact_phone: string;
          media_urls?: string[];
          duplicate_of?: string | null;
          verified_by?: string | null;
          client_request_id?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          short_code?: string;
          citizen_id?: string | null;
          incident_id?: string | null;
          type?: IncidentType;
          description?: string | null;
          people_count?: number;
          has_vulnerable_persons?: boolean;
          declared_urgency?: UrgencyLevel;
          priority_score?: number;
          status?: RequestStatus;
          location?: unknown;
          location_accuracy_m?: number | null;
          address_text?: string | null;
          contact_phone?: string;
          media_urls?: string[];
          duplicate_of?: string | null;
          verified_by?: string | null;
          client_request_id?: string | null;
          updated_at?: string;
          completed_at?: string | null;
        };
      };
      rescue_operations: {
        Row: {
          id: string;
          request_id: string;
          team_id: string;
          assigned_by: string | null;
          status: OperationStatus;
          assigned_at: string;
          accepted_at: string | null;
          en_route_at: string | null;
          arrived_at: string | null;
          completed_at: string | null;
          people_rescued: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          request_id: string;
          team_id: string;
          assigned_by?: string | null;
          status?: OperationStatus;
          assigned_at?: string;
          accepted_at?: string | null;
          en_route_at?: string | null;
          arrived_at?: string | null;
          completed_at?: string | null;
          people_rescued?: number;
          notes?: string | null;
        };
        Update: {
          id?: string;
          request_id?: string;
          team_id?: string;
          assigned_by?: string | null;
          status?: OperationStatus;
          accepted_at?: string | null;
          en_route_at?: string | null;
          arrived_at?: string | null;
          completed_at?: string | null;
          people_rescued?: number;
          notes?: string | null;
        };
      };
      request_status_history: {
        Row: {
          id: string;
          request_id: string;
          old_status: RequestStatus | null;
          new_status: RequestStatus;
          changed_by: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          old_status?: RequestStatus | null;
          new_status: RequestStatus;
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          old_status?: RequestStatus | null;
          new_status?: RequestStatus;
          changed_by?: string | null;
          note?: string | null;
        };
      };
      shelters: {
        Row: {
          id: string;
          name: string;
          address: string;
          location: unknown;
          capacity: number;
          current_occupancy: number;
          contact_phone: string;
          facilities: string[];
          is_open: boolean;
          managed_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          location: unknown;
          capacity: number;
          current_occupancy?: number;
          contact_phone: string;
          facilities?: string[];
          is_open?: boolean;
          managed_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          location?: unknown;
          capacity?: number;
          current_occupancy?: number;
          contact_phone?: string;
          facilities?: string[];
          is_open?: boolean;
          managed_by?: string | null;
          updated_at?: string;
        };
      };
      weather_alerts: {
        Row: {
          id: string;
          source: string;
          severity: AlertSeverity;
          title: string;
          message: string;
          center: unknown;
          radius_m: number;
          starts_at: string;
          expires_at: string;
          created_by: string | null;
          is_simulated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          source?: string;
          severity?: AlertSeverity;
          title: string;
          message: string;
          center: unknown;
          radius_m?: number;
          starts_at?: string;
          expires_at: string;
          created_by?: string | null;
          is_simulated?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          source?: string;
          severity?: AlertSeverity;
          title?: string;
          message?: string;
          center?: unknown;
          radius_m?: number;
          starts_at?: string;
          expires_at?: string;
          is_simulated?: boolean;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          related_request_id: string | null;
          related_alert_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          related_request_id?: string | null;
          related_alert_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          read_at?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      app_settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          value?: Json;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_my_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      public_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          active_rescues: number;
          open_shelters: number;
          total_completed: number;
          available_teams: number;
        };
      };
      admin_set_user_role: {
        Args: {
          p_user_id: string;
          p_new_role: UserRole;
        };
        Returns: boolean;
      };
      admin_verify_user: {
        Args: {
          p_user_id: string;
          p_new_status: VerificationStatus;
        };
        Returns: boolean;
      };
      submit_sos: {
        Args: {
          p_client_request_id?: string | null | undefined;
          p_lat: number;
          p_lng: number;
          p_accuracy?: number | null | undefined;
          p_contact_phone?: string | null | undefined;
          p_people_count?: number | undefined;
          p_has_vulnerable?: boolean | undefined;
          p_declared_urgency?: UrgencyLevel | undefined;
          p_type?: IncidentType | undefined;
          p_description?: string | undefined;
          p_address_text?: string | null | undefined;
        };
        Returns: {
          id: string;
          short_code: string;
          status: RequestStatus;
          priority_score: number;
          duplicate_of: string | null;
          is_existing: boolean;
        };
      };
      update_sos_details: {
        Args: {
          p_request_id: string;
          p_people_count?: number | null | undefined;
          p_has_vulnerable?: boolean | null | undefined;
          p_declared_urgency?: UrgencyLevel | null | undefined;
          p_type?: IncidentType | null | undefined;
          p_description?: string | null | undefined;
          p_media_urls?: string[] | null | undefined;
        };
        Returns: boolean;
      };
      cancel_request: {
        Args: {
          p_request_id: string;
          p_reason?: string | undefined;
        };
        Returns: boolean;
      };
      report_flood_incident: {
        Args: {
          p_title: string;
          p_description?: string | null | undefined;
          p_severity: UrgencyLevel;
          p_lat: number;
          p_lng: number;
          p_water_level_cm?: number | null | undefined;
          p_media_urls?: string[] | undefined;
        };
        Returns: string;
      };
      compute_priority_score: {
        Args: {
          p_urgency: UrgencyLevel;
          p_people_count: number;
          p_has_vulnerable: boolean;
          p_created_at: string;
          p_location: unknown;
        };
        Returns: number;
      };
    };
    Enums: {
      user_role: UserRole;
      verification_status: VerificationStatus;
      request_status: RequestStatus;
      urgency_level: UrgencyLevel;
      incident_type: IncidentType;
      alert_severity: AlertSeverity;
      task_status: TaskStatus;
      team_status: TeamStatus;
      operation_status: OperationStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
