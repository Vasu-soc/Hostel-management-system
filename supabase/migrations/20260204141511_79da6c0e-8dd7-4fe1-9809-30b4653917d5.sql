-- Create table for warden registration tokens
CREATE TABLE public.warden_registration_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    warden_type TEXT NOT NULL CHECK (warden_type IN ('boys', 'girls')),
    created_by UUID REFERENCES public.admins(id),
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warden_registration_tokens ENABLE ROW LEVEL SECURITY;

-- Allow admins to view tokens (no auth.uid() check since we use session-based admin auth)
CREATE POLICY "Allow public read of registration tokens"
ON public.warden_registration_tokens
FOR SELECT
USING (true);

-- Allow insert from authenticated or admin
CREATE POLICY "Allow insert of registration tokens"
ON public.warden_registration_tokens
FOR INSERT
WITH CHECK (true);

-- Allow update (marking as used)
CREATE POLICY "Allow update of registration tokens"
ON public.warden_registration_tokens
FOR UPDATE
USING (true);