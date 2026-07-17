-- 1. Create a function that syncs is_pro, trial info, and polar id to auth.users metadata
create or replace function public.sync_pro_status_to_auth()
returns trigger as $$
begin
  update auth.users
  set raw_user_meta_data = 
    coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
      'is_pro', new.is_pro,
      'trial_ends_at', new.trial_ends_at,
      'polar_order_id', new.polar_order_id
    )
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

-- 2. Create a trigger on your profiles table
drop trigger if exists on_profile_update_sync_pro on public.profiles;
create trigger on_profile_update_sync_pro
after insert or update of is_pro, trial_ends_at, polar_order_id on public.profiles
for each row execute function public.sync_pro_status_to_auth();
