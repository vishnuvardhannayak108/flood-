-- FERRCS: Migration 06 - Rescue Coordination, State Machine, and Concurrency-Safe Assignment

-- 1. Concurrency-Safe Request Assignment RPC
CREATE OR REPLACE FUNCTION public.assign_request(
    p_request_id UUID,
    p_team_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID := (SELECT auth.uid());
    v_req public.emergency_requests%ROWTYPE;
    v_team public.rescue_teams%ROWTYPE;
    v_op_id UUID;
    v_member_record RECORD;
BEGIN
    -- Only rescue teams and admins can assign requests
    IF public.get_my_role() NOT IN ('rescue_team', 'admin') THEN
        RAISE EXCEPTION 'Access denied. Only rescue responders or administrators can assign requests.';
    END IF;

    -- Pessimistic Lock with FOR UPDATE to prevent race conditions (double assignment)
    SELECT * INTO v_req
    FROM public.emergency_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Emergency request not found.';
    END IF;

    -- Check if request is already claimed/in-progress
    IF v_req.status IN ('accepted', 'en_route', 'on_site', 'completed') THEN
        RAISE EXCEPTION 'Request #% is already in progress or completed by another team.', v_req.short_code;
    END IF;

    -- Verify target rescue team exists
    SELECT * INTO v_team
    FROM public.rescue_teams
    WHERE id = p_team_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target rescue team not found.';
    END IF;

    -- Update emergency_requests status
    UPDATE public.emergency_requests
    SET status = 'assigned',
        updated_at = timezone('utc'::text, now())
    WHERE id = p_request_id;

    -- Insert or update active rescue_operations record
    INSERT INTO public.rescue_operations (
        request_id,
        team_id,
        assigned_by,
        status,
        assigned_at
    ) VALUES (
        p_request_id,
        p_team_id,
        v_caller_id,
        'assigned',
        timezone('utc'::text, now())
    ) ON CONFLICT (request_id) WHERE status NOT IN ('completed', 'aborted')
    DO UPDATE SET
        team_id = EXCLUDED.team_id,
        assigned_by = EXCLUDED.assigned_by,
        assigned_at = timezone('utc'::text, now())
    RETURNING id INTO v_op_id;

    -- Record in request_status_history
    INSERT INTO public.request_status_history (
        request_id,
        old_status,
        new_status,
        changed_by,
        note,
        created_at
    ) VALUES (
        p_request_id,
        v_req.status,
        'assigned',
        v_caller_id,
        'Assigned to rescue team: ' || v_team.name,
        timezone('utc'::text, now())
    );

    -- Notify Citizen (if account exists)
    IF v_req.citizen_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            body,
            related_request_id,
            created_at
        ) VALUES (
            v_req.citizen_id,
            'STATUS_ASSIGNED',
            'Rescue Team Assigned: ' || v_team.name,
            'A rescue boat team has been assigned to request #' || v_req.short_code || '. Tap to view details and contact info.',
            p_request_id,
            timezone('utc'::text, now())
        );
    END IF;

    -- Notify Team Members
    FOR v_member_record IN 
        SELECT user_id FROM public.rescue_team_members WHERE team_id = p_team_id
    LOOP
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            body,
            related_request_id,
            created_at
        ) VALUES (
            v_member_record.user_id,
            'NEW_MISSION',
            'New Mission Assigned: #' || v_req.short_code,
            'Urgency: ' || v_req.declared_urgency || ' • People: ' || v_req.people_count,
            p_request_id,
            timezone('utc'::text, now())
        );
    END LOOP;

    RETURN jsonb_build_object(
        'operation_id', v_op_id,
        'request_id', p_request_id,
        'team_name', v_team.name,
        'status', 'assigned'
    );
END;
$$;

-- 2. State Machine Status Transition RPC
CREATE OR REPLACE FUNCTION public.update_request_status(
    p_request_id UUID,
    p_new_status public.request_status,
    p_note TEXT DEFAULT NULL,
    p_people_rescued INT DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID := (SELECT auth.uid());
    v_caller_role public.user_role := public.get_my_role();
    v_caller_team UUID := public.get_my_rescue_team_id();
    v_req public.emergency_requests%ROWTYPE;
    v_op public.rescue_operations%ROWTYPE;
BEGIN
    SELECT * INTO v_req
    FROM public.emergency_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found.';
    END IF;

    -- Validate state transition according to state machine
    IF v_req.status = 'submitted' AND p_new_status NOT IN ('verified', 'prioritized', 'cancelled', 'rejected', 'duplicate') THEN
        RAISE EXCEPTION 'Invalid transition from % to %.', v_req.status, p_new_status;
    ELSIF v_req.status = 'verified' AND p_new_status NOT IN ('prioritized', 'assigned', 'cancelled', 'duplicate') THEN
        RAISE EXCEPTION 'Invalid transition from % to %.', v_req.status, p_new_status;
    ELSIF v_req.status = 'prioritized' AND p_new_status NOT IN ('assigned', 'cancelled', 'duplicate') THEN
        RAISE EXCEPTION 'Invalid transition from % to %.', v_req.status, p_new_status;
    ELSIF v_req.status = 'assigned' AND p_new_status NOT IN ('accepted', 'rejected', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition from % to %.', v_req.status, p_new_status;
    ELSIF v_req.status = 'accepted' AND p_new_status NOT IN ('en_route', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition from % to %.', v_req.status, p_new_status;
    ELSIF v_req.status = 'en_route' AND p_new_status NOT IN ('on_site', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition from % to %.', v_req.status, p_new_status;
    ELSIF v_req.status = 'on_site' AND p_new_status NOT IN ('completed', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition from % to %.', v_req.status, p_new_status;
    ELSIF v_req.status IN ('completed', 'cancelled', 'duplicate') THEN
        RAISE EXCEPTION 'Cannot modify request in terminal status %.', v_req.status;
    END IF;

    -- Update emergency_requests
    UPDATE public.emergency_requests
    SET status = p_new_status,
        completed_at = CASE WHEN p_new_status = 'completed' THEN timezone('utc'::text, now()) ELSE completed_at END,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_request_id;

    -- Update rescue_operations timestamp progression
    UPDATE public.rescue_operations
    SET 
        status = CASE 
            WHEN p_new_status = 'accepted' THEN 'accepted'::public.operation_status
            WHEN p_new_status = 'en_route' THEN 'en_route'::public.operation_status
            WHEN p_new_status = 'on_site' THEN 'on_site'::public.operation_status
            WHEN p_new_status = 'completed' THEN 'completed'::public.operation_status
            WHEN p_new_status = 'rejected' THEN 'aborted'::public.operation_status
            ELSE status
        END,
        accepted_at = CASE WHEN p_new_status = 'accepted' AND accepted_at IS NULL THEN timezone('utc'::text, now()) ELSE accepted_at END,
        en_route_at = CASE WHEN p_new_status = 'en_route' AND en_route_at IS NULL THEN timezone('utc'::text, now()) ELSE en_route_at END,
        arrived_at = CASE WHEN p_new_status = 'on_site' AND arrived_at IS NULL THEN timezone('utc'::text, now()) ELSE arrived_at END,
        completed_at = CASE WHEN p_new_status = 'completed' AND completed_at IS NULL THEN timezone('utc'::text, now()) ELSE completed_at END,
        people_rescued = CASE WHEN p_new_status = 'completed' THEN GREATEST(p_people_rescued, v_req.people_count) ELSE people_rescued END,
        notes = COALESCE(p_note, notes)
    WHERE request_id = p_request_id AND status NOT IN ('completed', 'aborted');

    -- Record in request_status_history
    INSERT INTO public.request_status_history (
        request_id,
        old_status,
        new_status,
        changed_by,
        note,
        created_at
    ) VALUES (
        p_request_id,
        v_req.status,
        p_new_status,
        v_caller_id,
        p_note,
        timezone('utc'::text, now())
    );

    -- Notify Citizen on state change
    IF v_req.citizen_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            body,
            related_request_id,
            created_at
        ) VALUES (
            v_req.citizen_id,
            'STATUS_CHANGE',
            'Request Status: ' || upper(p_new_status::text),
            'Your emergency request #' || v_req.short_code || ' is now ' || p_new_status::text || '.' || COALESCE(' Note: ' || p_note, ''),
            p_request_id,
            timezone('utc'::text, now())
        );
    END IF;

    RETURN TRUE;
END;
$$;

-- 3. Update Team Location & Status (Throttled)
CREATE OR REPLACE FUNCTION public.update_team_telemetry(
    p_team_id UUID,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_status public.team_status DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_team UUID := public.get_my_rescue_team_id();
BEGIN
    IF v_caller_team <> p_team_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. You can only update telemetry for your own team.';
    END IF;

    UPDATE public.rescue_teams
    SET 
        current_location = public.ST_SetSRID(public.ST_MakePoint(p_lng, p_lat), 4326),
        status = COALESCE(p_status, status),
        last_seen_at = timezone('utc'::text, now())
    WHERE id = p_team_id;

    RETURN TRUE;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.assign_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_request_status(UUID, public.request_status, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_team_telemetry(UUID, DOUBLE PRECISION, DOUBLE PRECISION, public.team_status) TO authenticated;
