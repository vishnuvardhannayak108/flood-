-- FERRCS: Migration 04 - Core Auth Triggers, Audited Admin RPCs, and Public Aggregates

-- 1. Automatic User Profile Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    requested_role public.user_role := 'citizen';
    role_text text;
    v_status public.verification_status := 'verified';
    user_name text;
    user_phone text;
BEGIN
    -- Extract optional raw user metadata
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'FERRCS User');
    user_phone := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone');
    role_text := NEW.raw_user_meta_data->>'role';

    -- Determine requested role (disallow self-assigning admin)
    IF role_text = 'rescue_team' THEN
        requested_role := 'rescue_team';
        v_status := 'pending';
    ELSIF role_text = 'volunteer' THEN
        requested_role := 'volunteer';
        v_status := 'pending';
    ELSE
        requested_role := 'citizen';
        v_status := 'verified';
    END IF;

    -- Insert into public.profiles
    INSERT INTO public.profiles (
        id,
        full_name,
        phone,
        role,
        verification_status,
        preferred_language,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_name,
        user_phone,
        requested_role,
        v_status,
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 2. Human-friendly Short Code Generator
CREATE OR REPLACE FUNCTION public.generate_short_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    chars TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    result TEXT := 'FR-';
    i INT;
    candidate TEXT;
BEGIN
    LOOP
        result := 'FR-';
        FOR i IN 1..4 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;
        
        -- Check if exists
        PERFORM 1 FROM public.emergency_requests WHERE short_code = result;
        IF NOT FOUND THEN
            RETURN result;
        END IF;
    END LOOP;
END;
$$;

-- 3. Admin: Change User Role (Audited)
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
    p_user_id UUID,
    p_new_role public.user_role
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    caller_id UUID := (SELECT auth.uid());
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.';
    END IF;

    UPDATE public.profiles
    SET role = p_new_role,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id;

    -- Audit log
    INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, metadata)
    VALUES (
        caller_id,
        'CHANGE_ROLE',
        'profiles',
        p_user_id,
        jsonb_build_object('new_role', p_new_role)
    );

    RETURN TRUE;
END;
$$;

-- 4. Admin: Verify or Suspend User (Audited)
CREATE OR REPLACE FUNCTION public.admin_verify_user(
    p_user_id UUID,
    p_new_status public.verification_status
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    caller_id UUID := (SELECT auth.uid());
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.';
    END IF;

    UPDATE public.profiles
    SET verification_status = p_new_status,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id;

    -- Also update volunteer/rescue status if exists
    UPDATE public.volunteers
    SET verification_status = p_new_status
    WHERE user_id = p_user_id;

    -- Audit log
    INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, metadata)
    VALUES (
        caller_id,
        'VERIFY_USER',
        'profiles',
        p_user_id,
        jsonb_build_object('verification_status', p_new_status)
    );

    RETURN TRUE;
END;
$$;

-- 5. Public Aggregate Stats (No PII, cached/live)
CREATE OR REPLACE FUNCTION public.public_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_active_rescues INT;
    v_open_shelters INT;
    v_total_completed INT;
    v_available_teams INT;
BEGIN
    SELECT COUNT(*) INTO v_active_rescues
    FROM public.emergency_requests
    WHERE status IN ('assigned', 'accepted', 'en_route', 'on_site');

    SELECT COUNT(*) INTO v_open_shelters
    FROM public.shelters
    WHERE is_open = true;

    SELECT COUNT(*) INTO v_total_completed
    FROM public.emergency_requests
    WHERE status = 'completed';

    SELECT COUNT(*) INTO v_available_teams
    FROM public.rescue_teams
    WHERE status = 'available';

    RETURN jsonb_build_object(
        'active_rescues', v_active_rescues,
        'open_shelters', v_open_shelters,
        'total_completed', v_total_completed,
        'available_teams', v_available_teams
    );
END;
$$;

-- Grant execution to anon and authenticated
GRANT EXECUTE ON FUNCTION public.public_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_short_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, public.user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_user(UUID, public.verification_status) TO authenticated;
