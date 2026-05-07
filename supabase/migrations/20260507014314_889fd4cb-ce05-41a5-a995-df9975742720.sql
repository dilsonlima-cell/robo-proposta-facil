-- Create storage bucket for proposal images
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-images', 'proposal-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for proposal images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'proposal-images');

-- Allow public insert (edge function uses service role but just in case)
CREATE POLICY "Allow insert for proposal images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'proposal-images');