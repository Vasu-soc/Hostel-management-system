-- Run this in your Supabase SQL Editor
ALTER TABLE public.gate_passes ADD COLUMN IF NOT EXISTS pass_type TEXT DEFAULT 'gatepass' CHECK (pass_type IN ('gatepass', 'leave'));
