-- Fix missing INSERT policy for users table
-- This allows authenticated users to create their own user profile

CREATE POLICY "Users can create own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);