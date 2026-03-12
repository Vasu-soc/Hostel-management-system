-- Create payment_submissions table
CREATE TABLE IF NOT EXISTS public.payment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    branch TEXT NOT NULL,
    year TEXT NOT NULL,
    hostel_fee NUMERIC NOT NULL,
    amount_paid NUMERIC NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    receipt_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.payment_submissions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.payment_submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.payment_submissions
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.payment_submissions
    FOR DELETE USING (true);

-- Enable Realtime for payment_submissions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'payment_submissions') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_submissions;
    END IF;
END $$;

-- Create a storage bucket for payment receipts if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_receipts', 'payment_receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for payment_receipts bucket
CREATE POLICY "Public Access for Payment Receipts"
ON storage.objects FOR SELECT
USING ( bucket_id = 'payment_receipts' );

CREATE POLICY "Anyone can upload payment receipts"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'payment_receipts' );

CREATE POLICY "Users can update their payment receipts"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'payment_receipts' );

CREATE POLICY "Users can delete their payment receipts"
ON storage.objects FOR DELETE
USING ( bucket_id = 'payment_receipts' );
