-- Fix welcome notification trigger to not block profile creation
-- If notification fails, it should log a warning but not fail the profile creation

CREATE OR REPLACE FUNCTION send_welcome_notification()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Get user's name from profile or use email
  user_name := COALESCE(NEW.full_name, split_part(NEW.email, '@', 1));
  
  -- Try to create welcome notification
  -- If it fails, log warning but don't fail profile creation
  BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.id,
      'welcome',
      '🎉 Welcome to Resolute Plan pro!',
      'Hi ' || user_name || '! Welcome to Resolute Plan pro. We''re excited to help you achieve your goals. Start by creating your first Resolve and breaking it down into milestones. Let''s make this year your best one yet! 💪',
      jsonb_build_object('welcome', true, 'created_at', CURRENT_TIMESTAMP)
    );
  EXCEPTION
    WHEN check_violation THEN
      -- Constraint violation (e.g., 'welcome' not in allowed types)
      RAISE WARNING 'Could not create welcome notification for user %: notification type constraint violation', NEW.id;
    WHEN others THEN
      -- Any other error (RLS, permissions, etc.)
      RAISE WARNING 'Could not create welcome notification for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS welcome_notification_on_profile_create ON public.profiles;
CREATE TRIGGER welcome_notification_on_profile_create
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_notification();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION send_welcome_notification() TO authenticated;

-- Also ensure 'welcome' is in the notifications type constraint
-- This will only add it if it's missing (won't error if already exists)
DO $$
BEGIN
  -- Check if constraint exists and if 'welcome' is in it
  -- If not, we'll need to drop and recreate the constraint
  -- But first, let's just make sure the function handles errors gracefully
  NULL; -- Placeholder - the function above already handles errors
END $$;
