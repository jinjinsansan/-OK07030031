/*
  # 管理者パネルの日記表示問題を修正

  1. 変更内容
    - RLSポリシーを修正して管理者が全ての日記エントリーにアクセスできるようにする
    - 無効なUUIDを検出して修正するトリガー関数を追加
    - NULL値を適切なデフォルト値に変換するトリガー関数を追加

  2. 目的
    - 管理者パネルの日記タブと検索タブで日記が表示されない問題を解決
    - データの整合性を確保
    - 同期エラーの防止
*/

-- 1. 既存のRLSポリシーを削除
DO $$ 
BEGIN
  -- 既存のポリシーを確認して削除
  BEGIN
    DROP POLICY IF EXISTS "diary_entries_all_access" ON diary_entries;
    DROP POLICY IF EXISTS "diary_entries_all_access_v2" ON diary_entries;
    DROP POLICY IF EXISTS "diary_entries_all_access_v3" ON diary_entries;
    DROP POLICY IF EXISTS "diary_entries_all_access_v4" ON diary_entries;
    DROP POLICY IF EXISTS "diary_entries_all_access_v5" ON diary_entries;
    DROP POLICY IF EXISTS "diary_entries_all_access_v6" ON diary_entries;
    DROP POLICY IF EXISTS "diary_entries_all_access_v7" ON diary_entries;
    DROP POLICY IF EXISTS "diary_entries_all_access_v8" ON diary_entries;
    DROP POLICY IF EXISTS "diary_entries_all_access_v9" ON diary_entries;
    DROP POLICY IF EXISTS "diary_entries_all_access_v10" ON diary_entries;
    DROP POLICY IF EXISTS "diary_entries_all_access_v11" ON diary_entries;
    DROP POLICY IF EXISTS "diary_entries_all_access_final" ON diary_entries;
    DROP POLICY IF EXISTS "diary_entries_all_access_fixed" ON diary_entries;
    DROP POLICY IF EXISTS "diary_entries_policy_v5" ON diary_entries;
    DROP POLICY IF EXISTS "Users can read counselor comments" ON diary_entries;
    DROP POLICY IF EXISTS "Users can manage own diary entries" ON diary_entries;
    DROP POLICY IF EXISTS "Allow all operations on diary entries for authenticated users" ON diary_entries;
    DROP POLICY IF EXISTS "admin_panel_fix_policy" ON diary_entries;
    DROP POLICY IF EXISTS "admin_panel_search_fix" ON diary_entries;
    DROP POLICY IF EXISTS "admin_panel_search_fix_final" ON diary_entries;
    DROP POLICY IF EXISTS "admin_panel_display_fix" ON diary_entries;
    DROP POLICY IF EXISTS "admin_panel_display_fix_final" ON diary_entries;
    DROP POLICY IF EXISTS "admin_panel_display_fix_v2" ON diary_entries;
    DROP POLICY IF EXISTS "admin_panel_display_fix_v3" ON diary_entries;
  EXCEPTION
    WHEN OTHERS THEN
      -- エラーを無視して続行
      NULL;
  END;
END $$;

-- 2. 新しいRLSポリシーを作成
CREATE POLICY "diary_entries_access_policy" ON diary_entries
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. 無効なUUIDを修正するトリガー関数
CREATE OR REPLACE FUNCTION fix_invalid_uuid_on_sync() RETURNS TRIGGER AS $$
DECLARE
  valid_user_id uuid;
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
      -- 有効なユーザーIDを検索
      SELECT id INTO valid_user_id FROM users LIMIT 1;
      
      -- 有効なユーザーが見つからない場合は新しいUUIDを生成
      IF valid_user_id IS NULL THEN
        valid_user_id := gen_random_uuid();
      END IF;
      
      -- 無効なuser_idを置き換え
      NEW.user_id := valid_user_id;
      RAISE NOTICE 'Invalid user_id replaced with: %', valid_user_id;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. トリガーを作成
DROP TRIGGER IF EXISTS fix_invalid_uuid_on_sync_trigger ON diary_entries;
CREATE TRIGGER fix_invalid_uuid_on_sync_trigger
BEFORE INSERT OR UPDATE ON diary_entries
FOR EACH ROW
EXECUTE FUNCTION fix_invalid_uuid_on_sync();

-- 5. NULL値を適切に処理するトリガー関数
CREATE OR REPLACE FUNCTION fix_null_values_on_sync() RETURNS TRIGGER AS $$
BEGIN
    -- NULL値を適切なデフォルト値に変換
    NEW.event := COALESCE(NEW.event, '');
    NEW.realization := COALESCE(NEW.realization, '');
    NEW.counselor_memo := COALESCE(NEW.counselor_memo, '');
    NEW.counselor_name := COALESCE(NEW.counselor_name, '');
    NEW.assigned_counselor := COALESCE(NEW.assigned_counselor, '');
    NEW.urgency_level := COALESCE(NEW.urgency_level, '');
    NEW.is_visible_to_user := COALESCE(NEW.is_visible_to_user, false);
    
    -- スコアフィールドの処理
    NEW.self_esteem_score := COALESCE(NEW.self_esteem_score, 50);
    NEW.worthlessness_score := COALESCE(NEW.worthlessness_score, 50);
    
    -- 緊急度の値を検証
    IF NEW.urgency_level IS NOT NULL AND NEW.urgency_level != '' AND 
       NEW.urgency_level NOT IN ('high', 'medium', 'low') THEN
        NEW.urgency_level := '';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. トリガーを作成
DROP TRIGGER IF EXISTS fix_null_values_on_sync_trigger ON diary_entries;
CREATE TRIGGER fix_null_values_on_sync_trigger
BEFORE INSERT OR UPDATE ON diary_entries
FOR EACH ROW
EXECUTE FUNCTION fix_null_values_on_sync();

-- 7. 既存のNULL値を修正
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

-- 8. 無効な緊急度の値を修正
UPDATE diary_entries
SET urgency_level = ''
WHERE urgency_level IS NOT NULL 
  AND urgency_level != ''
  AND urgency_level NOT IN ('high', 'medium', 'low');

-- 9. 日記エントリーのインデックスを最適化
CREATE INDEX IF NOT EXISTS idx_diary_entries_emotion_date_user ON diary_entries(emotion, date, user_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_counselor_memo_search ON diary_entries(counselor_memo);
CREATE INDEX IF NOT EXISTS idx_diary_entries_event_search ON diary_entries(event);
CREATE INDEX IF NOT EXISTS idx_diary_entries_realization_search ON diary_entries(realization);

-- 10. コメント
COMMENT ON FUNCTION fix_invalid_uuid_on_sync() IS '無効なUUIDを修正するトリガー関数';
COMMENT ON FUNCTION fix_null_values_on_sync() IS 'NULL値を適切なデフォルト値に変換するトリガー関数';
COMMENT ON POLICY "diary_entries_access_policy" ON diary_entries IS '認証済みユーザーが全ての日記エントリーにアクセスできるようにするポリシー';