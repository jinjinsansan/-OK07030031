-- 1. 既存のRLSポリシーを削除
DO $$ 
BEGIN
  -- 既存のポリシーを確認して削除
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "diary_entries_access_policy_v3" ON diary_entries';
    EXECUTE 'DROP POLICY IF EXISTS "diary_entries_access_policy_final" ON diary_entries';
  EXCEPTION
    WHEN OTHERS THEN
      -- エラーを無視して続行
      NULL;
  END;
END $$;

-- 2. 新しいRLSポリシーを作成
CREATE POLICY "diary_entries_access_policy_final_v2" ON diary_entries
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

-- 5. コメント
COMMENT ON POLICY "diary_entries_access_policy_final_v2" ON diary_entries IS '認証済みユーザーが全ての日記エントリーにアクセスできるようにするポリシー';