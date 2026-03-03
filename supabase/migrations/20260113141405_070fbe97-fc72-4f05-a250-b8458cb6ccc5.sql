-- Add email column to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email TEXT;

-- Create password_reset_tokens table for forgot password functionality
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'warden', 'parent', 'admin')),
  user_identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Allow public insert for password reset requests
CREATE POLICY "Allow public insert password reset tokens"
ON public.password_reset_tokens
FOR INSERT
WITH CHECK (true);

-- Allow public read for token validation
CREATE POLICY "Allow public read password reset tokens"
ON public.password_reset_tokens
FOR SELECT
USING (true);

-- Allow public update for marking token as used
CREATE POLICY "Allow public update password reset tokens"
ON public.password_reset_tokens
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow public delete for cleanup
CREATE POLICY "Allow public delete password reset tokens"
ON public.password_reset_tokens
FOR DELETE
USING (true);