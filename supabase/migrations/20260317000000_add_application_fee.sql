-- Add application fee fields to hostel_applications
ALTER TABLE public.hostel_applications 
ADD COLUMN IF NOT EXISTS application_fee_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS application_fee_amount NUMERIC DEFAULT 100,
ADD COLUMN IF NOT EXISTS application_fee_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS application_fee_payment_method TEXT,
ADD COLUMN IF NOT EXISTS application_fee_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS application_fee_receipt_url TEXT;

-- Update existing records to reflect they were before this change (optional but good)
UPDATE public.hostel_applications SET application_fee_status = 'paid' WHERE application_fee_status IS NULL;
