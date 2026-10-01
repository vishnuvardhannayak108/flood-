-- FERRCS: Migration 03 - Row Level Security (RLS) Policies

-- Helper: Get current user's role securely
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

-- Helper: Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = (SELECT auth.uid())), false);
$$;

-- Helper: Get current user's rescue team ID
CREATE OR REPLACE FUNCTION public.get_my_rescue_team_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT team_id FROM public.rescue_team_members WHERE user_id = (SELECT auth.uid()) LIMIT 1;
$$;

-- Guard trigger: Prevent non-admins from changing role or verification_status on profiles
CREATE OR REPLACE FUNCTION public.protect_profile_role_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.verification_status IS DISTINCT FROM NEW.verification_status) THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Only administrators can modify user role or verification status.';
        END IF;
    END IF;
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_role_fields();

-- Enable RLS on ALL public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescue_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescue_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flood_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescue_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = (SELECT auth.uid()) OR public.is_admin())
    WITH CHECK (id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = (SELECT auth.uid()) OR public.is_admin());

-- Rescue team can view citizen name and phone for assigned operations
CREATE POLICY "profiles_select_assigned_for_rescue" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        public.get_my_role() = 'rescue_team' AND
        id IN (
            SELECT er.citizen_id 
            FROM public.emergency_requests er
            JOIN public.rescue_operations ro ON er.id = ro.request_id
            WHERE ro.team_id = public.get_my_rescue_team_id()
              AND ro.status NOT IN ('completed', 'aborted')
        )
    );

-- 2. Rescue Teams Policies
CREATE POLICY "rescue_teams_select_all" ON public.rescue_teams
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "rescue_teams_admin_all" ON public.rescue_teams
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "rescue_teams_update_own" ON public.rescue_teams
    FOR UPDATE TO authenticated
    USING (id = public.get_my_rescue_team_id())
    WITH CHECK (id = public.get_my_rescue_team_id());

-- 3. Rescue Team Members Policies
CREATE POLICY "rescue_members_select" ON public.rescue_team_members
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "rescue_members_admin_all" ON public.rescue_team_members
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. Volunteers Policies
CREATE POLICY "volunteers_select" ON public.volunteers
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "volunteers_update_own" ON public.volunteers
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "volunteers_admin_all" ON public.volunteers
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. Flood Incidents Policies
CREATE POLICY "incidents_select" ON public.flood_incidents
    FOR SELECT TO authenticated
    USING (
        verification_status = 'verified' OR 
        reported_by = (SELECT auth.uid()) OR 
        public.is_admin() OR
        public.get_my_role() = 'rescue_team'
    );

CREATE POLICY "incidents_insert" ON public.flood_incidents
    FOR INSERT TO authenticated
    WITH CHECK (reported_by = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "incidents_admin_all" ON public.flood_incidents
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. Emergency Requests Policies
CREATE POLICY "requests_select_citizen" ON public.emergency_requests
    FOR SELECT TO authenticated
    USING (citizen_id = (SELECT auth.uid()));

CREATE POLICY "requests_select_rescue" ON public.emergency_requests
    FOR SELECT TO authenticated
    USING (
        public.get_my_role() = 'rescue_team' AND
        (status IN ('verified', 'prioritized', 'assigned', 'accepted', 'en_route', 'on_site') OR
         id IN (SELECT request_id FROM public.rescue_operations WHERE team_id = public.get_my_rescue_team_id()))
    );

CREATE POLICY "requests_admin_all" ON public.emergency_requests
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7. Rescue Operations Policies
CREATE POLICY "operations_select_citizen" ON public.rescue_operations
    FOR SELECT TO authenticated
    USING (
        request_id IN (SELECT id FROM public.emergency_requests WHERE citizen_id = (SELECT auth.uid()))
    );

CREATE POLICY "operations_select_rescue" ON public.rescue_operations
    FOR SELECT TO authenticated
    USING (
        team_id = public.get_my_rescue_team_id() OR public.is_admin()
    );

CREATE POLICY "operations_admin_all" ON public.rescue_operations
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 8. Request Status History Policies
CREATE POLICY "history_select_citizen" ON public.request_status_history
    FOR SELECT TO authenticated
    USING (
        request_id IN (SELECT id FROM public.emergency_requests WHERE citizen_id = (SELECT auth.uid()))
    );

CREATE POLICY "history_select_rescue" ON public.request_status_history
    FOR SELECT TO authenticated
    USING (
        public.get_my_role() = 'rescue_team' AND
        request_id IN (SELECT request_id FROM public.rescue_operations WHERE team_id = public.get_my_rescue_team_id())
    );

CREATE POLICY "history_admin_all" ON public.request_status_history
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 9. Shelters Policies
CREATE POLICY "shelters_select_open" ON public.shelters
    FOR SELECT TO authenticated
    USING (is_open = true OR public.is_admin() OR public.get_my_role() = 'rescue_team');

CREATE POLICY "shelters_admin_all" ON public.shelters
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10. Weather Alerts Policies
CREATE POLICY "alerts_select" ON public.weather_alerts
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "alerts_admin_all" ON public.weather_alerts
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 11. Notifications Policies
CREATE POLICY "notifications_own" ON public.notifications
    FOR ALL TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- 12. Push Subscriptions Policies
CREATE POLICY "push_subscriptions_own" ON public.push_subscriptions
    FOR ALL TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- 13. Volunteer Tasks Policies
CREATE POLICY "volunteer_tasks_select" ON public.volunteer_tasks
    FOR SELECT TO authenticated
    USING (
        status = 'open' OR 
        volunteer_id = (SELECT auth.uid()) OR 
        public.is_admin() OR 
        public.get_my_role() = 'rescue_team'
    );

CREATE POLICY "volunteer_tasks_admin_all" ON public.volunteer_tasks
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 14. App Settings Policies
CREATE POLICY "settings_select" ON public.app_settings
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "settings_admin_all" ON public.app_settings
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 15. Audit Logs Policies
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.is_admin());
