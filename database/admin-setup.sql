-- Run once in Supabase SQL Editor after creating your account.
-- This promotes the exact account used by Genera Tech Hub to admin.
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
WHERE lower(email) = 'mudasirumukthar@gmail.com';

-- Confirm the result. It should return role = admin.
SELECT email, raw_app_meta_data ->> 'role' AS role
FROM auth.users
WHERE lower(email) = 'mudasirumukthar@gmail.com';
