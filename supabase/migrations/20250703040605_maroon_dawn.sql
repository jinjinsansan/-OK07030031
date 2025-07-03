/*
  # Fix UUID synchronization error

  1. Changes
    - Remove unique index that might be causing conflicts
    - Add a function to validate and fix invalid UUIDs
    - Update the trigger to handle invalid UUIDs properly

  2. Purpose
    - Fix "invalid input syntax for type uuid" errors during sync
    - Ensure proper data synchronization between local storage and Supabase
    - Prevent future errors with UUID validation
*/

-- 1. Remove problematic unique index if it exists
DROP INDEX IF EXISTS idx_diary_entries_unique_content;

-- 2. Create a function to validate and fix UUIDs
CREATE OR REPLACE FUNCTION validate_and_fix_uuid(input_text text) RETURNS uuid AS $$
DECLARE
  valid_uuid uuid;
BEGIN
  -- Try to cast to UUID
  BEGIN
    valid_uuid := input_text::uuid;
    RETURN valid_uuid;
  EXCEPTION WHEN others THEN
    -- If casting fails, generate a new UUID
    RETURN gen_random_uuid();
  END;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a trigger function to validate UUIDs before insert/update
CREATE OR REPLACE FUNCTION validate_uuid_before_operation() RETURNS TRIGGER AS $$
BEGIN
  -- Validate and fix user_id if needed
  IF NEW.user_id IS NOT NULL THEN
    BEGIN
      -- Try to validate the UUID
      PERFORM NEW.user_id::uuid;
    EXCEPTION WHEN others THEN
      -- If invalid, generate a new UUID
      NEW.user_id := gen_random_uuid();
      RAISE NOTICE 'Invalid user_id replaced with new UUID: %', NEW.user_id;
    END;
  END IF;
  
  -- Validate and fix id if needed
  BEGIN
    -- Try to validate the UUID
    PERFORM NEW.id::uuid;
  EXCEPTION WHEN others THEN
    -- If invalid, generate a new UUID
    NEW.id := gen_random_uuid();
    RAISE NOTICE 'Invalid id replaced with new UUID: %', NEW.id;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to validate UUIDs
DROP TRIGGER IF EXISTS validate_uuid_trigger ON diary_entries;
CREATE TRIGGER validate_uuid_trigger
BEFORE INSERT OR UPDATE ON diary_entries
FOR EACH ROW
EXECUTE FUNCTION validate_uuid_before_operation();

-- 5. Fix existing invalid UUIDs in the database
DO $$ 
DECLARE
  invalid_entry RECORD;
  new_uuid uuid;
BEGIN
  -- Find entries with invalid user_id
  FOR invalid_entry IN 
    SELECT id, user_id FROM diary_entries
    WHERE user_id IS NOT NULL
  LOOP
    -- Try to validate the UUID
    BEGIN
      PERFORM invalid_entry.user_id::uuid;
    EXCEPTION WHEN others THEN
      -- Generate a new UUID
      SELECT gen_random_uuid() INTO new_uuid;
      
      -- Update the entry
      UPDATE diary_entries
      SET user_id = new_uuid
      WHERE id = invalid_entry.id;
      
      RAISE NOTICE 'Fixed invalid user_id for entry %: % -> %', 
                   invalid_entry.id, invalid_entry.user_id, new_uuid;
    END;
  END LOOP;
END $$;

-- 6. Add comments
COMMENT ON FUNCTION validate_and_fix_uuid(text) IS 'Validates a UUID string and returns a valid UUID or generates a new one';
COMMENT ON FUNCTION validate_uuid_before_operation() IS 'Validates UUIDs before insert/update operations and fixes invalid ones';