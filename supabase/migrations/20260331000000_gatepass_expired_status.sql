-- Update the check constraint for status to include 'expired'
DO $$ 
BEGIN
    ALTER TABLE public.gate_passes DROP CONSTRAINT IF EXISTS gate_passes_status_check;
    ALTER TABLE public.gate_passes ADD CONSTRAINT gate_passes_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'expired'));
EXCEPTION
    WHEN undefined_object THEN
        ALTER TABLE public.gate_passes ADD CONSTRAINT gate_passes_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'expired'));
END $$;
