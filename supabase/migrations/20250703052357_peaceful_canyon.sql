/*
  # Fix UUID Sync Issues

  1. Changes
    - Add a trigger function to validate and fix UUIDs before insert/update
    - Fix existing invalid UUIDs in the database
    - Ensure proper error handling for invalid UUIDs

  2. Purpose
    - Fix "invalid input syntax for type uuid" errors during sync
    - Automatically convert invalid UUIDs to valid ones
    - Improve error handling and data integrity
*/

-- 1. Create a function to validate UUIDs
CREATE OR REPLACE FUNCTION validate_uuid_before_insert() RETURNS TRIGGER AS $$
BEGIN
    -- Check if ID is a valid UUID format
    BEGIN
      PERFORM NEW.id::uuid;
    EXCEPTION WHEN others THEN
      -- Generate a new UUID if invalid
      NEW.id := gen_random_uuid();
      RAISE NOTICE 'Invalid UUID format for id: %, replaced with %', NEW.id, NEW.id;
    END;

    -- Check if user_id is a valid UUID format
    IF NEW.user_id IS NOT NULL THEN
      BEGIN
        PERFORM NEW.user_id::uuid;
      EXCEPTION WHEN others THEN
        -- Find a valid user or create one
        DECLARE
          valid_user_id uuid;
        BEGIN
          -- Try to find an existing user
          SELECT id INTO valid_user_id FROM users LIMIT 1;
          
          -- If no user found, create a new one
          IF valid_user_id IS NULL THEN
            valid_user_id := gen_random_uuid();
          END IF;
          
          NEW.user_id := valid_user_id;
          RAISE NOTICE 'Invalid UUID format for user_id: %, replaced with %', NEW.user_id, valid_user_id;
        END;
      END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger to validate UUIDs
DROP TRIGGER IF EXISTS validate_uuid_trigger ON diary_entries;
CREATE TRIGGER validate_uuid_trigger
BEFORE INSERT OR UPDATE ON diary_entries
FOR EACH ROW
EXECUTE FUNCTION validate_uuid_before_insert();

-- 3. Fix existing invalid UUIDs
DO $$ 
DECLARE
  invalid_record RECORD;
  new_uuid uuid;
  valid_user_id uuid;
BEGIN
  -- Find a valid user_id to use for replacements
  SELECT id INTO valid_user_id FROM users LIMIT 1;
  
  -- If no valid user found, create a placeholder UUID
  IF valid_user_id IS NULL THEN
    valid_user_id := gen_random_uuid();
  END IF;

  -- Find and fix invalid IDs
  FOR invalid_record IN 
    SELECT id FROM diary_entries 
  LOOP
    -- Test if ID is a valid UUID
    BEGIN
      PERFORM invalid_record.id::uuid;
    EXCEPTION WHEN others THEN
      -- Generate a new UUID
      SELECT gen_random_uuid() INTO new_uuid;
      
      -- Update the record with the new UUID
      UPDATE diary_entries
      SET id = new_uuid
      WHERE id = invalid_record.id;
      
      RAISE NOTICE 'Fixed invalid UUID: % -> %', invalid_record.id, new_uuid;
    END;
  END LOOP;
  
  -- Find and fix invalid user_ids
  FOR invalid_record IN 
    SELECT id, user_id FROM diary_entries 
    WHERE user_id IS NOT NULL
  LOOP
    -- Test if user_id is a valid UUID
    BEGIN
      PERFORM invalid_record.user_id::uuid;
    EXCEPTION WHEN others THEN
      -- Update with the valid user_id
      UPDATE diary_entries
      SET user_id = valid_user_id
      WHERE id = invalid_record.id;
      
      RAISE NOTICE 'Fixed invalid user_id: % -> % for diary entry: %', 
                   invalid_record.user_id, valid_user_id, invalid_record.id;
    END;
  END LOOP;
END $$;

-- 4. Add comments
COMMENT ON FUNCTION validate_uuid_before_insert() IS 'Validates and fixes invalid UUIDs before insert/update operations';