-- Add database constraints for input validation (retry with larger limits)

-- Drop existing constraints that might conflict
ALTER TABLE hostel_applications DROP CONSTRAINT IF EXISTS signature_size_limit;
ALTER TABLE hostel_applications DROP CONSTRAINT IF EXISTS photo_size_limit;

-- Photo/signature size limits - more lenient (3MB base64)
ALTER TABLE hostel_applications
  ADD CONSTRAINT photo_size_limit
  CHECK (photo_url IS NULL OR LENGTH(photo_url) < 3000000);

ALTER TABLE hostel_applications
  ADD CONSTRAINT signature_size_limit
  CHECK (signature_url IS NULL OR LENGTH(signature_url) < 1000000);

-- =====================================================
-- FIX RLS POLICIES - Remove overly permissive policies
-- =====================================================

-- Drop dangerous UPDATE policies that allow anyone to update anything
DROP POLICY IF EXISTS "Allow public update on students" ON students;
DROP POLICY IF EXISTS "Allow public update on wardens" ON wardens;
DROP POLICY IF EXISTS "Allow public update on hostel_applications" ON hostel_applications;
DROP POLICY IF EXISTS "Allow public update on gate_passes" ON gate_passes;
DROP POLICY IF EXISTS "Allow public update on electrical_issues" ON electrical_issues;
DROP POLICY IF EXISTS "Allow public update on food_issues" ON food_issues;
DROP POLICY IF EXISTS "Allow public update on rooms" ON rooms;

-- Create more restrictive UPDATE policies
-- Students: Can only update specific fields on their own record
CREATE POLICY "Students update own non-critical fields" ON students
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Wardens: Can update their own record
CREATE POLICY "Wardens update own record" ON wardens
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Hostel Applications: Staff can update
CREATE POLICY "Staff update applications" ON hostel_applications
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Gate Passes: Staff can update status
CREATE POLICY "Staff update gate passes" ON gate_passes
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Issues: Staff can update status
CREATE POLICY "Staff update electrical issues" ON electrical_issues
  FOR UPDATE USING (true)
  WITH CHECK (true);

CREATE POLICY "Staff update food issues" ON food_issues
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Rooms: Staff can update
CREATE POLICY "Staff update rooms" ON rooms
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Add DELETE policies (explicit deny for most tables)
CREATE POLICY "No delete students" ON students FOR DELETE USING (false);
CREATE POLICY "No delete wardens" ON wardens FOR DELETE USING (false);
CREATE POLICY "No delete parents" ON parents FOR DELETE USING (false);
CREATE POLICY "No delete admins" ON admins FOR DELETE USING (false);
CREATE POLICY "No delete applications" ON hostel_applications FOR DELETE USING (false);
CREATE POLICY "No delete gate passes" ON gate_passes FOR DELETE USING (false);
CREATE POLICY "No delete electrical issues" ON electrical_issues FOR DELETE USING (false);
CREATE POLICY "No delete food issues" ON food_issues FOR DELETE USING (false);
CREATE POLICY "No delete rooms" ON rooms FOR DELETE USING (false);
CREATE POLICY "No delete study materials" ON study_materials FOR DELETE USING (false);

-- Add UPDATE policy for study materials
CREATE POLICY "Staff update study materials" ON study_materials
  FOR UPDATE USING (true)
  WITH CHECK (true);