-- ====================================================================
-- FIX: STUDENT DELETE - RLS BYPASS VIA SECURITY DEFINER FUNCTION
-- This migration creates a stored procedure that BYPASSES RLS so the
-- warden can fully delete a student and all their associated data.
-- ====================================================================

-- STEP 1: Drop any conflicting old delete policies and re-create them
-- (in case previous migrations didn't run or ran with errors)
DROP POLICY IF EXISTS "Enable delete for anyone students" ON public.students;
DROP POLICY IF EXISTS "Enable delete for anyone applications" ON public.hostel_applications;
DROP POLICY IF EXISTS "Enable delete for anyone gate passes" ON public.gate_passes;
DROP POLICY IF EXISTS "Enable delete for anyone electrical issues" ON public.electrical_issues;
DROP POLICY IF EXISTS "Enable delete for anyone food issues" ON public.food_issues;
DROP POLICY IF EXISTS "Enable delete for anyone parents" ON public.parents;
DROP POLICY IF EXISTS "Enable delete for anyone medical alerts" ON public.medical_alerts;
DROP POLICY IF EXISTS "Enable delete for anyone study materials" ON public.study_materials;
DROP POLICY IF EXISTS "No delete students" ON public.students;
DROP POLICY IF EXISTS "No delete applications" ON public.hostel_applications;
DROP POLICY IF EXISTS "No delete gate passes" ON public.gate_passes;

-- STEP 2: Create universal DELETE policies (permissive - internal college system)
CREATE POLICY "Enable delete for anyone students" ON public.students FOR DELETE USING (true);
CREATE POLICY "Enable delete for anyone applications" ON public.hostel_applications FOR DELETE USING (true);
CREATE POLICY "Enable delete for anyone gate passes" ON public.gate_passes FOR DELETE USING (true);
CREATE POLICY "Enable delete for anyone electrical issues" ON public.electrical_issues FOR DELETE USING (true);
CREATE POLICY "Enable delete for anyone food issues" ON public.food_issues FOR DELETE USING (true);

-- Also add delete for parents/medical_alerts if those tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parents' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Enable delete for anyone parents" ON public.parents;
    EXECUTE 'CREATE POLICY "Enable delete for anyone parents" ON public.parents FOR DELETE USING (true)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_alerts' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Enable delete for anyone medical alerts" ON public.medical_alerts;
    EXECUTE 'CREATE POLICY "Enable delete for anyone medical alerts" ON public.medical_alerts FOR DELETE USING (true)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Enable delete for anyone password_reset_tokens" ON public.password_reset_tokens;
    EXECUTE 'CREATE POLICY "Enable delete for anyone password_reset_tokens" ON public.password_reset_tokens FOR DELETE USING (true)';
  END IF;
END $$;

-- STEP 3: Create a SECURITY DEFINER function that bypasses RLS entirely
-- This is the nuclear approach - runs as the DB owner, ignoring all RLS policies
CREATE OR REPLACE FUNCTION public.delete_student_complete(p_student_id UUID, p_roll_number TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_roll TEXT;
  v_deleted_count INTEGER;
  v_room_number TEXT;
BEGIN
  -- Normalize roll number to uppercase
  v_roll := UPPER(TRIM(p_roll_number));

  -- Get the room number before deletion (to update occupied_beds after)
  SELECT hostel_room_number INTO v_room_number
  FROM public.students
  WHERE id = p_student_id;

  -- Delete all dependent records first
  DELETE FROM public.gate_passes WHERE roll_number = v_roll OR student_id = p_student_id;
  DELETE FROM public.electrical_issues WHERE roll_number = v_roll OR student_id = p_student_id;
  DELETE FROM public.food_issues WHERE roll_number = v_roll OR student_id = p_student_id;

  -- Conditional deletes for optional tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_alerts' AND table_schema = 'public') THEN
    EXECUTE 'DELETE FROM public.medical_alerts WHERE roll_number = $1 OR student_id = $2' USING v_roll, p_student_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parents' AND table_schema = 'public') THEN
    EXECUTE 'DELETE FROM public.parents WHERE student_roll_number = $1' USING v_roll;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens' AND table_schema = 'public') THEN
    EXECUTE 'DELETE FROM public.password_reset_tokens WHERE user_identifier = $1' USING v_roll;
  END IF;

  -- Delete the student record itself
  DELETE FROM public.students WHERE id = p_student_id;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- If deletion succeeded, update room occupied_beds
  IF v_deleted_count > 0 AND v_room_number IS NOT NULL THEN
    UPDATE public.rooms
    SET occupied_beds = (
      SELECT COUNT(*) FROM public.students
      WHERE hostel_room_number = v_room_number AND room_allotted = true
    )
    WHERE room_number = v_room_number;
  END IF;

  IF v_deleted_count > 0 THEN
    RETURN jsonb_build_object('success', true, 'message', 'Student deleted successfully');
  ELSE
    RETURN jsonb_build_object('success', false, 'message', 'Student not found or already deleted');
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.delete_student_complete(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_student_complete(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_student_complete(UUID, TEXT) TO service_role;
