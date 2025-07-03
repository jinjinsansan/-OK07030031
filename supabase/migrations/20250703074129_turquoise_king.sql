/*
  # 管理者パネルの日記表示問題を修正

  1. 変更内容
    - RLSポリシーを修正して管理者が全ての日記エントリーにアクセスできるようにする
    - 日記エントリーのインデックスを最適化
    - NULL値を適切に処理

  2. 目的
    - カウンセラー管理画面の全タブが正常に動作するようにする
    - データの整合性を確保
    - 検索機能の安定性向上
*/

-- 1. 既存のRLSポリシーを削除
DO $$ 
BEGIN
  -- 既存のポリシーを確認して削除
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "diary_entries_access_policy" ON diary_entries';
  EXCEPTION
    WHEN OTHERS THEN
      -- エラーを無視して続行
      NULL;
  END;
END $$;

-- 2. 新しいRLSポリシーを作成
CREATE POLICY "diary_entries_access_policy_v2" ON diary_entries
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. 日記エントリーのNULL値を修正
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

-- 4. 日記エントリーのインデックスを最適化
CREATE INDEX IF NOT EXISTS idx_diary_entries_emotion_date_user ON diary_entries(emotion, date, user_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_counselor_memo_search ON diary_entries(counselor_memo);
CREATE INDEX IF NOT EXISTS idx_diary_entries_event_search ON diary_entries(event);
CREATE INDEX IF NOT EXISTS idx_diary_entries_realization_search ON diary_entries(realization);

-- 5. 日記エントリーのユーザー情報を保持するためのトリガー関数
CREATE OR REPLACE FUNCTION preserve_diary_user_id() RETURNS TRIGGER AS $$
BEGIN
    -- user_idが変更されないようにする
    IF TG_OP = 'UPDATE' AND OLD.user_id IS NOT NULL THEN
        -- 変更の試みをログに記録（デバッグ用）
        IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
            RAISE LOG 'ユーザーID保持: % から % への変更を防止しました（日記ID: %）', 
                      OLD.user_id, NEW.user_id, NEW.id;
        END IF;
        
        -- 常に元のuser_idを保持
        NEW.user_id := OLD.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. トリガーを作成
DROP TRIGGER IF EXISTS preserve_diary_user_id_trigger ON diary_entries;
CREATE TRIGGER preserve_diary_user_id_trigger
BEFORE UPDATE ON diary_entries
FOR EACH ROW
EXECUTE FUNCTION preserve_diary_user_id();

-- 7. コメント
COMMENT ON FUNCTION preserve_diary_user_id() IS '日記エントリーのユーザーIDが変更されないようにするトリガー関数';
COMMENT ON POLICY "diary_entries_access_policy_v2" ON diary_entries IS '認証済みユーザーが全ての日記エントリーにアクセスできるようにするポリシー';