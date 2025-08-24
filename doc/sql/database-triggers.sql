-- Database Triggers for Automatic User Profile Creation
-- Run this AFTER the main database-schema.sql

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'user_name', 
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Could not create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle username conflicts
CREATE OR REPLACE FUNCTION public.generate_unique_username(base_username TEXT)
RETURNS TEXT AS $$
DECLARE
  final_username TEXT;
  counter INTEGER := 1;
BEGIN
  final_username := lower(base_username);
  
  -- Remove special characters and limit length
  final_username := regexp_replace(final_username, '[^a-z0-9_-]', '', 'g');
  final_username := left(final_username, 45); -- Leave room for counter
  
  -- Handle empty username
  IF final_username = '' THEN
    final_username := 'user';
  END IF;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = final_username) LOOP
    final_username := left(base_username, 45 - length(counter::TEXT)) || counter::TEXT;
    counter := counter + 1;
    
    -- Safety break to avoid infinite loop
    IF counter > 9999 THEN
      final_username := 'user_' || extract(epoch from now())::INTEGER;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN final_username;
END;
$$ LANGUAGE plpgsql;

-- Updated function to use unique username generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
BEGIN
  -- Extract username from various OAuth providers
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'user_name', 
    NEW.raw_user_meta_data->>'preferred_username',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'user'
  );
  
  -- Generate unique username
  final_username := public.generate_unique_username(base_username);
  
  INSERT INTO public.users (id, email, username, avatar, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    final_username,
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If somehow we still get a conflict, try with timestamp
    final_username := 'user_' || extract(epoch from now())::INTEGER;
    INSERT INTO public.users (id, email, username, avatar, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      final_username,
      NEW.raw_user_meta_data->>'avatar_url',
      NOW(),
      NOW()
    );
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Could not create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the trigger (optional - run to verify it works)
-- SELECT public.generate_unique_username('test user@#$%');
-- This should return 'testuser' or 'testuser1' etc.