-- Drop restrictive delete policies
DROP POLICY IF EXISTS "No delete applications" ON hostel_applications;
DROP POLICY IF EXISTS "No delete gate passes" ON gate_passes;

-- Create new delete policies for wardens to delete applications and gate passes
CREATE POLICY "Allow delete hostel applications"
ON hostel_applications
FOR DELETE
USING (true);

CREATE POLICY "Allow delete gate passes"
ON gate_passes
FOR DELETE
USING (true);