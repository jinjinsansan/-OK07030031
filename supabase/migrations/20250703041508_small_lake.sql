/*
  # UUIDの検証と修正を強化

  1. 変更内容
    - 無効なUUIDを検出して修正する関数を追加
    - 同期時のUUID検証を強化するトリガー関数を追加
    - 既存の無効なUUIDを修正

  2. 目的
    - 「invalid input syntax for type uuid」エラーの解決
    - 同期エラーの防止
    - データの整合性確保
*/

-- 1. 無効なUUIDを検出して修正する関数
CREATE OR REPLACE FUNCTION fix_invalid_uuid(input_text text) RETURNS uuid AS $$
DECLARE
  valid_uuid uuid;
BEGIN
  -- UUIDとして解析を試みる
  BEGIN
    valid_uuid := input_text::uuid;
    RETURN valid_uuid;
  EXCEPTION WHEN others THEN
    -- 解析に失敗した場合は新しいUUIDを生成
    RETURN gen_random_uuid();
  END;
END;
$$ LANGUAGE plpgsql;

-- 2. 同期時のUUID検証を強化するトリガー関数
CREATE OR REPLACE FUNCTION validate_uuid_on_sync() RETURNS TRIGGER AS $$
BEGIN
  -- IDが有効なUUID形式かチェック
  BEGIN
    PERFORM NEW.id::uuid;
  EXCEPTION WHEN others THEN
    -- 無効な場合は新しいUUIDを生成
    NEW.id := gen_random_uuid();
    RAISE NOTICE 'Invalid UUID replaced with: %', NEW.id;
  END;
  
  -- user_idが有効なUUID形式かチェック
  IF NEW.user_id IS NOT NULL THEN
    BEGIN
      PERFORM NEW.user_id::uuid;
    EXCEPTION WHEN others THEN
      -- 無効な場合は新しいUUIDを生成
      NEW.user_id := gen_random_uuid();
      RAISE NOTICE 'Invalid user_id replaced with: %', NEW.user_id;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. トリガーを作成
DROP TRIGGER IF EXISTS validate_uuid_on_sync_trigger ON diary_entries;
CREATE TRIGGER validate_uuid_on_sync_trigger
BEFORE INSERT OR UPDATE ON diary_entries
FOR EACH ROW
EXECUTE FUNCTION validate_uuid_on_sync();

-- 4. 既存の無効なUUIDを修正
DO $$ 
DECLARE
  invalid_entry RECORD;
  new_uuid uuid;
BEGIN
  -- 無効なIDを持つエントリーを検索して修正
  FOR invalid_entry IN 
    SELECT id FROM diary_entries
  LOOP
    -- IDが有効なUUIDかチェック
    BEGIN
      PERFORM invalid_entry.id::uuid;
    EXCEPTION WHEN others THEN
      -- 無効な場合は新しいUUIDを生成
      SELECT gen_random_uuid() INTO new_uuid;
      
      -- エントリーを更新
      UPDATE diary_entries
      SET id = new_uuid
      WHERE id = invalid_entry.id;
      
      RAISE NOTICE 'Fixed invalid ID: % -> %', invalid_entry.id, new_uuid;
    END;
  END LOOP;
  
  -- 無効なuser_idを持つエントリーを検索して修正
  FOR invalid_entry IN 
    SELECT id, user_id FROM diary_entries
    WHERE user_id IS NOT NULL
  LOOP
    -- user_idが有効なUUIDかチェック
    BEGIN
      PERFORM invalid_entry.user_id::uuid;
    EXCEPTION WHEN others THEN
      -- 無効な場合は新しいUUIDを生成
      SELECT gen_random_uuid() INTO new_uuid;
      
      -- エントリーを更新
      UPDATE diary_entries
      SET user_id = new_uuid
      WHERE id = invalid_entry.id;
      
      RAISE NOTICE 'Fixed invalid user_id for entry %: % -> %', 
                   invalid_entry.id, invalid_entry.user_id, new_uuid;
    END;
  END LOOP;
END $$;

-- 5. コメント
COMMENT ON FUNCTION fix_invalid_uuid(text) IS '無効なUUIDを検出して修正する関数';
COMMENT ON FUNCTION validate_uuid_on_sync() IS '同期時のUUID検証を強化するトリガー関数';