-- ====================================================================
-- NUCLEAR RESET: REMOVE ALL STUDENT DATA & ENABLE DELETIONS
-- ====================================================================

-- 1. DROP ALL RESTRICTIVE POLICIES
-- We drop both the 'No delete' policies and any old 'Allow' policies to start fresh
DROP POLICY IF EXISTS "No delete students" ON public.students;
DROP POLICY IF EXISTS "No delete applications" ON public.hostel_applications;
DROP POLICY IF EXISTS "No delete gate passes" ON public.gate_passes;
DROP POLICY IF EXISTS "No delete electrical issues" ON public.electrical_issues;
DROP POLICY IF EXISTS "No delete food issues" ON public.food_issues;
DROP POLICY IF EXISTS "No delete parents" ON public.parents;
DROP POLICY IF EXISTS "No delete rooms" ON public.rooms;
DROP POLICY IF EXISTS "No delete study materials" ON public.study_materials;
DROP POLICY IF EXISTS "No delete medical alerts" ON public.medical_alerts;

-- 2. CREATE UNIVERSAL DELETE POLICIES (Required for the App buttons to work)
-- This allows the Warden and Admin dashboards to actually remove records
CREATE POLICY "Enable delete for anyone students" ON public.students FOR DELETE USING (true);
CREATE POLICY "Enable delete for anyone applications" ON public.hostel_applications FOR DELETE USING (true);
CREATE POLICY "Enable delete for anyone gate passes" ON public.gate_passes FOR DELETE USING (true);
CREATE POLICY "Enable delete for anyone electrical issues" ON public.electrical_issues FOR DELETE USING (true);
CREATE POLICY "Enable delete for anyone food issues" ON public.food_issues FOR DELETE USING (true);
CREATE POLICY "Enable delete for anyone parents" ON public.parents FOR DELETE USING (true);
CREATE POLICY "Enable delete for anyone medical alerts" ON public.medical_alerts FOR DELETE USING (true);
CREATE POLICY "Enable delete for anyone study materials" ON public.study_materials FOR DELETE USING (true);

-- 3. PERFORM FULL TRUNCATE (Wipe all registered data immediately)
-- This clears the "Roll Number already registered" issue right now
TRUNCATE TABLE public.gate_passes CASCADE;
TRUNCATE TABLE public.electrical_issues CASCADE;
TRUNCATE TABLE public.food_issues CASCADE;
TRUNCATE TABLE public.medical_alerts CASCADE;
TRUNCATE TABLE public.parents CASCADE;
TRUNCATE TABLE public.hostel_applications CASCADE;
TRUNCATE TABLE public.students CASCADE;

-- 4. RE-INSERT ESSENTIAL ROOMS (Ensuring A101 visibility on Floor 1)
-- Fixes the issue where Floor 1 was missing A101
INSERT INTO public.rooms (room_number, floor_number, room_type, ac_type, total_beds, occupied_beds, closed_beds)
VALUES 
    ('A101', '1', 'double', 'ac', 2, 0, 0),
    ('A102', '1', 'double', 'ac', 2, 0, 0),
    ('A103', '1', 'four', 'ac', 4, 0, 0),
    ('N104', '1', 'four', 'normal', 4, 0, 0),
    ('N105', '1', 'six', 'normal', 6, 0, 0)
ON CONFLICT (room_number) 
DO UPDATE SET 
    floor_number = EXCLUDED.floor_number,
    room_type = EXCLUDED.room_type,
    ac_type = EXCLUDED.ac_type,
    total_beds = EXCLUDED.total_beds,
    occupied_beds = 0,
    closed_beds = 0;

-- Reset all other rooms to 0 occupancy
UPDATE public.rooms SET occupied_beds = 0;

-- 5. CREATE HELPER FUNCTION FOR OCCUPANCY (Used by the Frontend)
CREATE OR REPLACE FUNCTION decrement_occupied_beds(room_no TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.rooms 
  SET occupied_beds = GREATEST(0, occupied_beds - 1)
  WHERE room_number = room_no;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ENSURE RLS IS STILL ON (Safety first)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_passes ENABLE ROW LEVEL SECURITY;
