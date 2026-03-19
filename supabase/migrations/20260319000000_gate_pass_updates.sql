-- Update students table to include status
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'IN' CHECK (status IN ('IN', 'OUT'));

-- Update gate_passes table to include extra columns and statuses
ALTER TABLE public.gate_passes ADD COLUMN IF NOT EXISTS exit_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.gate_passes ADD COLUMN IF NOT EXISTS entry_time TIMESTAMP WITH TIME ZONE;

-- Update the check constraint for status if it exists
DO $$ 
BEGIN
    ALTER TABLE public.gate_passes DROP CONSTRAINT IF EXISTS gate_passes_status_check;
    ALTER TABLE public.gate_passes ADD CONSTRAINT gate_passes_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'completed'));
EXCEPTION
    WHEN undefined_object THEN
        -- If constraint doesn't exist, just add it
        ALTER TABLE public.gate_passes ADD CONSTRAINT gate_passes_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'completed'));
END $$;

-- Enable RLS for gate_passes (already enabled, but ensure policies allow updates for watchman/warden)
-- Since the system uses public policies for simplicity, we'll follow that pattern.

-- Create a view or function for student counts if needed, but the user asked for dynamic counts in Warden Dashboard.
