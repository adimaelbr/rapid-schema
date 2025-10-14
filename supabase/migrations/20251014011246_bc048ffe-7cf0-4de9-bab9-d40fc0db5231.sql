-- Fix 1: Restrict profiles table access
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Fix 2: Hash API route passwords
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.api_routes 
RENAME COLUMN access_password TO password_hash;

-- Update existing passwords to be hashed (this is a one-time migration)
-- Note: Existing plaintext passwords cannot be recovered, users will need to reset them
UPDATE public.api_routes
SET password_hash = crypt(password_hash, gen_salt('bf'))
WHERE password_hash IS NOT NULL AND is_private = true;