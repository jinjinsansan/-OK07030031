-- 1. 日記エントリーの所有者を保護するためのトリガー関数
CREATE OR REPLACE FUNCTION protect_diary_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- user_idが変更されようとした場合、元の値を保持
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE LOG 'Protecting diary owner: Attempted to change user_id from % to % for diary %',
              OLD.user_id, NEW.user_id, NEW.id;
    NEW.user_id := OLD.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. トリガーを作成
DROP TRIGGER IF EXISTS trg_protect_diary_owner ON diary_entries;
CREATE TRIGGER trg_protect_diary_owner
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION protect_diary_owner();

-- 3. コメント
COMMENT ON FUNCTION protect_diary_owner() IS '日記エントリーの所有者（user_id）が変更されないようにするトリガー関数';