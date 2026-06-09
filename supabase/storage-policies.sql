-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Storage → issues bucket must exist before these policies apply.

-- Upload policy (server upload API uses service role; this covers direct client uploads)
DROP POLICY IF EXISTS "Authenticated users can upload to issues folder 4" ON storage.objects;

CREATE POLICY "Authenticated users can upload to issues bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'issues');

-- Read policy for photo thumbnails (signed URLs and direct downloads)
DROP POLICY IF EXISTS "Authenticated users can read issues folder 4" ON storage.objects;

CREATE POLICY "Authenticated users can read issues bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'issues');
