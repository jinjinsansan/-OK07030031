/*
  # ユーザーID同期問題の修正

  1. 変更内容
    - 日記エントリーのユーザーIDが変更されないようにするトリガー関数を追加
    - 既存の無効なユーザーIDを修正
    - 同期エラーを防止するための追加対策

  2. 目的
    - カウンセラーコメント保存時にユーザーIDが変更される問題を解決
    - データの整合性を確保
    - 管理画面での表示を正確にする
*/

-- 1. 日記エントリーのユーザーIDを保持するためのトリガー関数
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

-- 2. トリガーを作成
DROP TRIGGER IF EXISTS preserve_diary_user_id_trigger ON diary_entries;
CREATE TRIGGER preserve_diary_user_id_trigger
BEFORE UPDATE ON diary_entries
FOR EACH ROW
EXECUTE FUNCTION preserve_diary_user_id();

-- 3. NULL値のuser_idを修正するための関数
CREATE OR REPLACE FUNCTION fix_null_user_ids() RETURNS void AS $$
DECLARE
    null_entry RECORD;
    user_record RECORD;
BEGIN
    -- NULLのuser_idを持つ日記エントリーを検索
    FOR null_entry IN 
        SELECT id, date, emotion, event
        FROM diary_entries
        WHERE user_id IS NULL
    LOOP
        -- ユーザーを検索（最初に見つかったユーザーを使用）
        SELECT id INTO user_record
        FROM users
        LIMIT 1;
        
        -- ユーザーが見つかった場合、user_idを更新
        IF user_record.id IS NOT NULL THEN
            UPDATE diary_entries
            SET user_id = user_record.id
            WHERE id = null_entry.id;
            
            RAISE NOTICE 'NULL値のuser_idを修正しました: 日記ID % → ユーザーID %', null_entry.id, user_record.id;
        ELSE
            RAISE NOTICE '日記ID %のNULL値user_idを修正できませんでした: ユーザーが見つかりません', null_entry.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. 関数を実行してNULL値のuser_idを修正
SELECT fix_null_user_ids();

-- 5. コメント
COMMENT ON FUNCTION preserve_diary_user_id() IS '日記エントリーのユーザーIDが変更されないようにするトリガー関数';
COMMENT ON FUNCTION fix_null_user_ids() IS 'NULL値のuser_idを持つ日記エントリーを修正する関数';