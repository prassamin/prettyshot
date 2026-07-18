-- Protect sensitive profile fields from being modified by clients
-- Since users can update their own profiles (RLS allows UPDATE), 
-- they could potentially set is_pro = true from the browser console.
-- This trigger ensures that if the authenticated user tries to update,
-- the sensitive fields are locked to their OLD values.

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger AS $$
BEGIN
  -- If the request is coming from the browser (authenticated user)
  IF auth.role() = 'authenticated' THEN
    NEW.is_pro = OLD.is_pro;
    NEW.polar_order_id = OLD.polar_order_id;
    NEW.trial_ends_at = OLD.trial_ends_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_profile_fields_trigger ON public.profiles;
CREATE TRIGGER protect_profile_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.protect_profile_fields();
