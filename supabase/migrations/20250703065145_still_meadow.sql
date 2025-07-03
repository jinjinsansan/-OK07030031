-- 1. Create a new RLS policy that allows authenticated users to access all diary entries
CREATE POLICY "admin_panel_display_fix_final" ON diary_entries
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Fix NULL values in diary entries
UPDATE diary_entries
SET 
  event = COALESCE(event, ''),
  realization = COALESCE(realization, ''),
  counselor_memo = COALESCE(counselor_memo, ''),
  counselor_name = COALESCE(counselor_name, ''),
  assigned_counselor = COALESCE(assigned_counselor, ''),
  urgency_level = COALESCE(urgency_level, ''),
  is_visible_to_user = COALESCE(is_visible_to_user, false),
  self_esteem_score = COALESCE(self_esteem_score, 50),
  worthlessness_score = COALESCE(worthlessness_score, 50);

-- 3. Create a trigger to preserve user_id during updates
CREATE OR REPLACE FUNCTION preserve_diary_owner() RETURNS TRIGGER AS $$
BEGIN
  -- Ensure user_id is not changed during updates
  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    NEW.user_id := OLD.user_id;
    RAISE NOTICE 'Preserved original user_id: %', OLD.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create a trigger to apply the function
DROP TRIGGER IF EXISTS trg_preserve_diary_owner ON diary_entries;
CREATE TRIGGER trg_preserve_diary_owner
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION preserve_diary_owner();

-- 5. Optimize indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_diary_entries_emotion_date ON diary_entries(emotion, date);
CREATE INDEX IF NOT EXISTS idx_diary_entries_event_text ON diary_entries USING gin(to_tsvector('english', event));
CREATE INDEX IF NOT EXISTS idx_diary_entries_realization_text ON diary_entries USING gin(to_tsvector('english', realization));

-- 6. Add comments
COMMENT ON FUNCTION preserve_diary_owner() IS 'Preserves the original user_id when updating diary entries';
COMMENT ON POLICY "admin_panel_display_fix_final" ON diary_entries IS 'Allows authenticated users to access all diary entries';