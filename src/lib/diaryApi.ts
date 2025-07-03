import { supabase } from './supabase';

/**
 * 日記データ取得ユーティリティ
 * 
 * 読み取り操作は counselor_diary_view を使用
 * 書き込み操作は diary_entries を使用
 */

/**
 * 日記エントリーの一覧を取得する
 */
export async function fetchDiaryEntries() {
  try {
    // 一覧取得（新: 公開済みビュー）
    const { data, error } = await supabase
      .from('counselor_diary_view')
      .select(`
        *,
        users (
          line_username
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('日記データ取得エラー:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('日記データ取得エラー:', error);
    return { data: null, error };
  }
}

/**
 * 日付範囲を指定して日記エントリーの件数を取得する
 */
export async function fetchDiaryCountByDate(from: string, to: string) {
  try {
    // カレンダー用：日付ごとの件数
    const { data, error } = await supabase
      .from('counselor_diary_view')
      .select('date, count:id', { head: false })
      .gt('date', from)
      .lte('date', to)
      .group('date');
    
    if (error) {
      console.error('日記カウント取得エラー:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('日記カウント取得エラー:', error);
    return { data: null, error };
  }
}

/**
 * フィルターを指定して日記エントリーを検索する
 */
export async function searchDiaryEntries(filters: any) {
  try {
    // 検索／エクスポート用：条件付き取得
    const { data, error } = await supabase
      .from('counselor_diary_view')
      .select('*')
      .match(filters)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('日記検索エラー:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('日記検索エラー:', error);
    return { data: null, error };
  }
}

/**
 * 日記エントリーを更新する（書き込みは diary_entries テーブルを使用）
 */
export async function updateDiaryEntry(id: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from('diary_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('日記更新エラー:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('日記更新エラー:', error);
    return { data: null, error };
  }
}

/**
 * 日記エントリーを削除する（書き込みは diary_entries テーブルを使用）
 */
export async function deleteDiaryEntry(id: string) {
  try {
    const { error } = await supabase
      .from('diary_entries')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('日記削除エラー:', error);
      throw error;
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('日記削除エラー:', error);
    return { success: false, error };
  }
}

/**
 * カウンセラーコメントを更新する（書き込みは diary_entries テーブルを使用）
 */
export async function updateCounselorComment(id: string, comment: string, isVisible: boolean, counselorName: string) {
  try {
    const { data, error } = await supabase
      .from('diary_entries')
      .update({
        counselor_memo: comment,
        is_visible_to_user: isVisible,
        counselor_name: counselorName
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('カウンセラーコメント更新エラー:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('カウンセラーコメント更新エラー:', error);
    return { data: null, error };
  }
}

/**
 * 担当カウンセラーと緊急度を更新する（書き込みは diary_entries テーブルを使用）
 */
export async function updateAssignment(id: string, assignedCounselor: string, urgencyLevel: string) {
  try {
    const { data, error } = await supabase
      .from('diary_entries')
      .update({
        assigned_counselor: assignedCounselor,
        urgency_level: urgencyLevel
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('担当カウンセラー更新エラー:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('担当カウンセラー更新エラー:', error);
    return { data: null, error };
  }
}