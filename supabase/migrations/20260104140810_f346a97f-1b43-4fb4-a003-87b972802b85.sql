-- Create storage bucket for warden signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true);

-- Create storage policies for signatures bucket
CREATE POLICY "Anyone can view signatures"
ON storage.objects
FOR SELECT
USING (bucket_id = 'signatures');

CREATE POLICY "Authenticated users can upload signatures"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Users can update signatures"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'signatures');

CREATE POLICY "Users can delete signatures"
ON storage.objects
FOR DELETE
USING (bucket_id = 'signatures');