-- Add metadata column to friendships to store pending group invites
ALTER TABLE public.friendships ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create the trigger function to automatically add friends to groups
CREATE OR REPLACE FUNCTION public.on_friendship_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  group_id_text text;
  g_id uuid;
BEGIN
  -- If the friendship status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Check if there are any pending groups in metadata
    IF NEW.metadata ? 'pending_groups' THEN
      
      -- Loop through each group ID in the pending_groups array
      FOR group_id_text IN SELECT * FROM jsonb_array_elements_text(NEW.metadata->'pending_groups')
      LOOP
        g_id := group_id_text::uuid;
        
        -- Insert the initiator if not already in group
        INSERT INTO public.group_members (group_id, user_id, balance)
        VALUES (g_id, NEW.user_id, 0)
        ON CONFLICT (group_id, user_id) DO NOTHING;
        
        -- Insert the friend if not already in group
        INSERT INTO public.group_members (group_id, user_id, balance)
        VALUES (g_id, NEW.friend_id, 0)
        ON CONFLICT (group_id, user_id) DO NOTHING;
      END LOOP;
      
      -- Clear the pending groups from metadata after successful processing
      NEW.metadata := NEW.metadata - 'pending_groups';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach the trigger to the friendships table
DROP TRIGGER IF EXISTS handle_friendship_accepted_trigger ON public.friendships;
CREATE TRIGGER handle_friendship_accepted_trigger
BEFORE UPDATE ON public.friendships
FOR EACH ROW
EXECUTE FUNCTION public.on_friendship_accepted();
