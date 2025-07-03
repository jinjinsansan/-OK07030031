/**
 * 日記を Supabase に保存／同期する共通ユーティリティ
 *
 * 変更点
 *  - 認証ユーザー（user.id）を必ず付与して upsert
 *  - 認証ユーザーが未取得の場合は保存を中止してエラーを返す
 *  - syncStatus は必ず 'supabase'
 */

import { supabase } from './supabaseClient';      // ←既存の Supabase クライアント
import { useSupabaseAuth } from './useSupabaseAuth'; // ←認証フック（実装済み）

export async function saveDiaryEntry(payload: Record<string, any>) {
  // 1. 認証ユーザーを取得
  const { user } = useSupabaseAuth();
  if (!user) {
    // 未ログイン・ゲストの場合は保存しない
    console.error('[saveDiaryEntry] no auth user, abort save');
    return { data: null, error: new Error('no auth user') };
  }

  // 2. 必須フィールドを補完して upsert
  const { data, error } = await supabase
    .from('diary_entries')
    .upsert(
      {
        ...payload,
        user_id: user.id,                            // ★必ずセット
        commented_at: new Date().toISOString(),
        syncStatus: 'supabase',                      // ★必ず 'supabase'
      },
      {
        onConflict: ['user_id', 'date', 'emotion', 'event'],
        ignoreDuplicates: false,
      },
    );

  if (error) {
    console.error('[saveDiaryEntry] upsert error', error);
  }
  return { data, error };
}