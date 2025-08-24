-- Drop the existing policy and create a more permissive one
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;

-- Allow any authenticated user to create a profile (we'll validate in the app)
CREATE POLICY "Authenticated users can create profiles" ON public.users
    FOR INSERT TO authenticated WITH CHECK (true);

-- Alternative: Allow service role to create profiles (for signup process)
CREATE POLICY "Service role can create profiles" ON public.users
    FOR INSERT TO service_role WITH CHECK (true);