-- Run this in the Supabase SQL Editor if you prefer storage policies
-- instead of using SUPABASE_SERVICE_ROLE_KEY on the server.

CREATE POLICY "Authenticated users can upload to issues folder 4"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'issues'
  AND name LIKE '4/%'
);

CREATE POLICY "Authenticated users can read issues folder 4"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'issues'
  AND name LIKE '4/%'
);
