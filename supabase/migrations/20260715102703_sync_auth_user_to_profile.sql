-- 1. Add columns to public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Update the existing trigger function to handle inserts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- 3. Create a trigger function to handle updates from auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_update_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    email = new.email,
    name = new.raw_user_meta_data->>'full_name',
    avatar_url = new.raw_user_meta_data->>'avatar_url'
  WHERE id = new.id;
  RETURN new;
END;
$$;

-- 4. Attach the update trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_update_user();

-- 5. Backfill existing data
UPDATE public.profiles p
SET 
  email = u.email,
  name = u.raw_user_meta_data->>'full_name',
  avatar_url = u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
WHERE p.id = u.id;
