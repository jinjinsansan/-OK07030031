import { supabase } from './supabase';
import { formatDiaryForSupabase } from './utils';
import { getCurrentUser } from './deviceAuth';

/**
 * 日記エントリーを保存する関数
 * @param entry 保存する日記エントリー
 */
export async function saveDiaryEntry(entry) {
  try {
    // ローカルストレージから既存のエントリーを取得
    const savedEntries = localStorage.getItem('journalEntries');
    let all = [];
    
    if (savedEntries) {
      try {
        all = JSON.parse(savedEntries);
        if (!Array.isArray(all)) {
          console.error('journalEntriesが配列ではありません:', all);
          all = [];
        }
      } catch (error) {
        console.error('journalEntriesの解析エラー:', error);
        all = [];
      }
    }
    
    // UUIDの検証
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(entry.id)) {
      console.warn(`無効なUUID形式のID: ${entry.id} - 新しいUUIDを生成します`);
      // 無効なIDの場合は新しいUUIDを生成
      entry.id = crypto.randomUUID ? crypto.randomUUID() : 
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      console.log(`新しいUUID: ${entry.id}`);
    }
    
    // 新しいエントリーを配列の先頭に追加
    all.unshift(entry);
    
    // ローカルストレージに保存
    localStorage.setItem('journalEntries', JSON.stringify(all));
    /* ---💬 追加ログ -------- */
    const test = localStorage.getItem('journalEntries');
    console.log(
      test ? `🟢 saved (${JSON.parse(test).length})` : '🔴 save FAILED',
      test ? JSON.parse(test)[0] : null
    );
    /* ----------------------- */
    
    // 自動同期が有効な場合は同期を実行
    if (window.autoSync && typeof window.autoSync.triggerManualSync === 'function') {
      try {
        // 現在のユーザーを取得
        const user = getCurrentUser();
        if (!user) {
          console.warn('ユーザー情報が取得できません。同期をスキップします。');
          return;
        }
        
        // ユーザー名を取得
        const lineUsername = user.lineUsername || localStorage.getItem('line-username');
        if (!lineUsername) {
          console.warn('ユーザー名が設定されていません。同期をスキップします。');
          return;
        }
        
        // Supabaseに同期
        await syncToSupabase(entry, lineUsername);
      } catch (error) {
        console.error('自動同期エラー:', error);
      }
    }
  } catch (e) {
    console.error('saveDiaryEntry ERROR:', e);
  }
}

/**
 * 日記エントリーをSupabaseに同期する関数
 * @param entry 同期する日記エントリー
 * @param lineUsername ユーザー名
 */
async function syncToSupabase(entry, lineUsername) {
  if (!supabase) {
    console.log('Supabase接続がありません。同期をスキップします。');
    return;
  }
  
  try {
    // ユーザーIDを取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('line_username', lineUsername)
      .single();
    
    if (userError) {
      console.error('ユーザー取得エラー:', userError);
      
      // ユーザーが存在しない場合は作成
      if (userError.code === 'PGRST116') {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ line_username: lineUsername }])
          .select()
          .single();
        
        if (createError) {
          console.error('ユーザー作成エラー:', createError);
          return;
        }
        
        // 作成したユーザーのIDを使用
        const userId = newUser.id;
        await syncEntry(entry, userId);
      }
      
      return;
    }
    
    // 取得したユーザーIDを使用
    const userId = userData.id;
    await syncEntry(entry, userId);
  } catch (error) {
    console.error('Supabase同期エラー:', error);
  }
}

/**
 * 日記エントリーをSupabaseに同期する内部関数
 * @param entry 同期する日記エントリー
 * @param userId ユーザーID
 */
async function syncEntry(entry, userId) {
  try {
    // エントリーをSupabase形式に変換
    const formattedEntry = formatDiaryForSupabase(entry, userId);
    
    // 同期するエントリーをログに出力
    console.log('同期するエントリー:', formattedEntry);
    
    // Supabaseに同期
    const { error } = await supabase
      .from('diary_entries')
      .upsert([formattedEntry], {
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error('エントリー同期エラー:', error);
      return;
    }
    
    console.log('エントリーを同期しました:', formattedEntry.id);
  } catch (error) {
    console.error('エントリー同期エラー:', error);
  }
}

/**
 * 複数の日記エントリーをSupabaseに同期する関数
 * @param entries 同期する日記エントリーの配列
 * @param userId ユーザーID
 */
export async function syncEntriesToSupabase(entries, userId) {
  if (!supabase) {
    console.log('Supabase接続がありません。同期をスキップします。');
    return { success: false, error: 'Supabase接続がありません' };
  }
  
  try {
    // エントリーをSupabase形式に変換
    const formattedEntries = entries.map(entry => formatDiaryForSupabase(entry, userId));
    
    // 同期するエントリー数をログに出力
    console.log(`${formattedEntries.length}件のエントリーを同期します`);
    
    // 同期するエントリーの候補をログに出力
    console.log('📤 UPLOAD candidates:', formattedEntries.length, formattedEntries);
    
    if (formattedEntries.length === 0) {
      console.log('⏩ 送信するデータなし');
      return { success: true, error: null };
    }
    
    // Supabaseに同期
    const { error } = await supabase
      .from('diary_entries')
      .upsert(formattedEntries, {
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error('エントリー同期エラー:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`${formattedEntries.length}件のエントリーを同期しました`);
    return { success: true, error: null };
  } catch (error) {
    console.error('エントリー同期エラー:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '不明なエラー' 
    };
  }
}