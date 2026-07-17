-- Add trial_ends_at to profiles to support 3-day free trials
ALTER TABLE public.profiles
ADD COLUMN trial_ends_at timestamp with time zone;
