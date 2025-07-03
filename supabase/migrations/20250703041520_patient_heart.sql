/*
  # 同期問題の修正

  1. 変更内容
    - 日記エントリーのNULLフィールドを修正するトリガー関数を追加
    - 既存のNULL値を修正
    - 同期エラーを防止するための追加対策

  2. 目的
    - 同期エラーの解決
    - データの整合性確保
    - アプリケーションの安定性向上
*/

-- 1. NULL値を適切に処理するトリガー関数
CREATE OR REPLACE FUNCTION fix_null_fields() RETURNS TRIGGER AS $$
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

-- 2. トリガーを作成
DROP TRIGGER IF EXISTS fix_null_fields_trigger ON diary_entries;
CREATE TRIGGER fix_null_fields_trigger
BEFORE INSERT OR UPDATE ON diary_entries
FOR EACH ROW
EXECUTE FUNCTION fix_null_fields();

-- 3. 既存のNULL値を修正
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

-- 4. 無効な緊急度の値を修正
UPDATE diary_entries
SET urgency_level = ''
WHERE urgency_level IS NOT NULL 
  AND urgency_level != ''
  AND urgency_level NOT IN ('high', 'medium', 'low');

-- 5. コメント
COMMENT ON FUNCTION fix_null_fields() IS 'NULL値を適切なデフォルト値に変換するトリガー関数';