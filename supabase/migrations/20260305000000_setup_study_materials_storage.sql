-- Create a storage bucket for study materials if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('study_materials', 'study_materials', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
-- Allow public read access to the study_materials bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'study_materials' );

-- Allow wardens (authenticated users) to upload new files
CREATE POLICY "Wardens can upload materials"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'study_materials' );

-- Allow wardens to update their own uploads (optional, but good practice)
CREATE POLICY "Wardens can update materials"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'study_materials' );

-- Allow wardens to delete materials
CREATE POLICY "Wardens can delete materials"
ON storage.objects FOR DELETE
USING ( bucket_id = 'study_materials' );
