-- Add approval status to wardens table
ALTER TABLE public.wardens 
ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS rejected_reason text;

-- Update existing wardens to be approved (since they were already registered through token system)
UPDATE public.wardens SET is_approved = true, approval_status = 'approved' WHERE is_approved IS NULL OR is_approved = false;