import { useState, useEffect, useCallback } from 'react';
import { supabase, userService, diaryService } from '../lib/supabase';
import { getCurrentUser } from '../lib/deviceAuth';
import { formatDiaryForSupabase } from '../lib/utils';

interface AutoSyncState {
  isAutoSyncEnabled: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  error: string | null;
  currentUser: any | null;
  triggerManualSync: () => Promise<boolean>;
  syncDeleteDiary: (diaryId: string) => Promise<boolean>;
  syncBulkDeleteDiaries: (diaryIds: string[]) => Promise<boolean>;
}

export const useAutoSync = (): AutoSyncState => {
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(localStorage.getItem('last_sync_time'));
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [processedEntryIds, setProcessedEntryIds] = useState<Set<string>>(new Set());
  
  // 重複チェック用のマップ
  const [processedEntryMap, setProcessedEntryMap] = useState<Map<string, boolean>>(new Map());
  
  // 自動同期設定の読み込み
  useEffect(() => {
    const autoSyncSetting = localStorage.getItem('auto_sync_enabled');
    setIsAutoSyncEnabled(autoSyncSetting !== 'false'); // デフォルトはtrue
    
    // 最後の同期時間を読み込み
    const savedLastSyncTime = localStorage.getItem('last_sync_time');
    if (savedLastSyncTime) {
      setLastSyncTime(savedLastSyncTime);
    }
  }, []);
  
  // ユーザー情報の初期化
  useEffect(() => {
    initializeUser();
    
    // アプリ起動時に自動的に同期を実行（少し遅延させる）
    setTimeout(() => {
      if (isAutoSyncEnabled && !isSyncing) {
        syncData().catch(error => {
          console.error('初期同期エラー:', error);
        });
      }
    }, 3000);
  }, []);
  
  // 自動同期の設定
  useEffect(() => {
    if (!isAutoSyncEnabled || !supabase) return;
    
    // 5分ごとに自動同期を実行
    const interval = setInterval(() => {
      if (!isSyncing) {
        syncData();
      }
    }, 5 * 60 * 1000); // 5分 = 300,000ミリ秒
    
    return () => clearInterval(interval);
  }, [isAutoSyncEnabled, isSyncing]);
  
  // ユーザー情報の初期化
  const initializeUser = useCallback(async () => {
    if (!supabase) {
      console.log('ローカルモードで動作中: Supabase接続なし、同期は無効');
      // ローカルモードでも、ユーザー名が設定されていれば現在のユーザーとして扱う
      const lineUsername = localStorage.getItem('line-username');
      if (lineUsername) {
        setCurrentUser({ id: 'local-user', line_username: lineUsername });
      }
      return;
    }
    
    try {
      // 現在のユーザーを取得
      const user = getCurrentUser();
      // ユーザー情報がない場合はローカルストレージから取得
      const lineUsername = user?.lineUsername || localStorage.getItem('line-username');
      
      if (!lineUsername || lineUsername.trim() === '') {
        console.error('ユーザーがログインしていないか、ユーザー名がありません');
        setError('ユーザー名が設定されていません');
        return null;
      }
      
      // Supabaseでユーザーを作成または取得
      const supabaseUser = await userService.createOrGetUser(lineUsername);
      if (supabaseUser) {
        setCurrentUser(supabaseUser);
        console.log('ユーザー初期化完了:', supabaseUser.line_username, 'ID:', supabaseUser.id);
        return supabaseUser;
      }
      return null;
    } catch (error) {
      console.error('ユーザー初期化エラー:', error);
      setError('ユーザー初期化に失敗しました');
      return null;
    }
  }, []);
  
  // データ同期処理
  const syncData = useCallback(async (): Promise<boolean> => {
    if (!supabase) {
      console.log('ローカルモードで動作中: Supabase接続なし、同期をスキップします');
      return false;
    }
    
    if (isSyncing) {
      console.log('既に同期中です');
      return false;
    }
    
    setIsSyncing(true);
    setError(null);
    
    try {
      // 重複チェック用のマップをリセット（手動同期の場合）
      setProcessedEntryMap(new Map());
      setProcessedEntryIds(new Set());
      
      // 現在のユーザーを取得
      const user = getCurrentUser();
      // ユーザー情報がない場合はローカルストレージから取得
      const lineUsername = user?.lineUsername || localStorage.getItem('line-username') || 'Unknown User';
      
      if (!lineUsername || lineUsername === 'Unknown User') {
        console.warn('ユーザー名が設定されていないか、デフォルト値です');
      }
      
      console.log('同期を開始します。ユーザー:', lineUsername);
      
      // ユーザーIDを取得
      let userId = currentUser?.id;
      
      // ユーザーIDがない場合は初期化
      if (!userId) {
        const supabaseUser = await userService.createOrGetUser(lineUsername);
        if (!supabaseUser) {
          console.error('ユーザーの作成に失敗しました');
          setError('ユーザーの作成に失敗しました');
          return false;
        }
        
        userId = supabaseUser.id;
        console.log('新しいユーザーを作成/取得しました:', lineUsername, 'ID:', userId);
        setCurrentUser(supabaseUser);
      }
      
      // UUIDの形式を検証
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        console.error('無効なユーザーID形式:', userId);
        
        // 無効なユーザーIDの場合は、新しいユーザーを作成して再試行
        try {
          console.log('無効なユーザーIDを検出。新しいユーザーを作成します...');
          const newUser = await userService.createOrGetUser(lineUsername);
          if (!newUser || !newUser.id) {
            setError('新しいユーザーの作成に失敗しました');
            return false;
          }
          
          userId = newUser.id;
          setCurrentUser(newUser);
          console.log('新しいユーザーを作成しました:', lineUsername, 'ID:', userId);
        } catch (error) {
          console.error('ユーザー作成エラー:', error);
          setError('ユーザー作成に失敗しました');
          return false;
        }
      }
      
      // ローカルストレージから日記データを取得
      const savedEntries = localStorage.getItem('journalEntries');
      if (!savedEntries) {
        console.log('同期するデータがありません: journalEntriesが存在しません');
        setLastSyncTime(new Date().toISOString());
        localStorage.setItem('last_sync_time', new Date().toISOString());
        return true;
      }
      
      let entries;
      try {
        entries = JSON.parse(savedEntries);
        if (!entries || !Array.isArray(entries)) {
          console.error('日記データが配列ではありません:', entries);
          setError('日記データの形式が正しくありません');
          return false;
        }
      } catch (parseError) {
        console.error('日記データの解析エラー:', parseError);
        setError('日記データの解析に失敗しました');
        return false;
      }
      
      // 空の配列の場合は同期をスキップ
      if (!entries || entries.length === 0) {
        console.log('同期するデータがありません: 空の配列です');
        const now = new Date().toISOString();
        setLastSyncTime(now);
        localStorage.setItem('last_sync_time', now);
        return true;
      }
      
     // 既に処理済みのエントリーIDを取得
     const currentProcessedIds = new Set(processedEntryIds);
     
     // 重複チェック用のマップ
     const entryMap = new Map();
     
     // 無効なUUIDを修正する関数
     const fixInvalidUuid = (id: string): string => {
       // 緩やかなUUIDの正規表現パターン（形式が近ければ許容）
       const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
       if (!uuidRegex.test(id)) {
         console.warn(`無効なUUID形式を検出: ${id}`);
         try {
           // crypto.randomUUID()が利用可能な場合はそれを使用
           if (typeof crypto !== 'undefined' && crypto.randomUUID) {
             const newUuid = crypto.randomUUID();
             console.log(`無効なUUID "${id}" を新しいUUID "${newUuid}" に置き換えました`);
             return newUuid;
           } else {
             // 代替の方法でUUIDを生成
             const newUuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
               const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
               return v.toString(16);
             });
             console.log(`無効なUUID "${id}" を新しいUUID "${newUuid}" に置き換えました`);
             return newUuid;
           }
         } catch (error) {
           console.error('UUID生成エラー:', error);
           // エラーが発生した場合は元のIDを使用
           return id;
         }
       }
       return id;
     };
     
     // エントリーをフィルタリングして無効なIDを修正
     const newEntries = entries.filter((entry: any) => {
       // 基本的な検証
       if (!entry || !entry.id) {
         console.warn('無効なエントリーをスキップします (IDなし):', entry);
         return false;
       }
       
       if (!entry.date) {
         console.warn('無効なエントリーをスキップします (日付なし):', entry.id);
         return false;
       }
       
       if (!entry.emotion) {
         console.warn('無効なエントリーをスキップします (感情なし):', entry.id);
         return false;
       }
       
       // 重複チェック用のキーを作成（日付+感情+内容の先頭50文字）
       const key = `${entry.date}_${entry.emotion}_${entry.event?.substring(0, 50)}`;
       
       // 重複チェック
       if (processedEntryMap.has(key) || entryMap.has(key)) {
         console.log('重複エントリーをスキップ:', key);
         return false;
       }
       
       // 処理済みIDに含まれている場合もスキップ
       if (currentProcessedIds.has(entry.id)) {
         console.log('既に処理済みのエントリーをスキップ:', entry.id);
         return false;
       }
       
       // 重複チェック用のマップに追加
       entryMap.set(key, true);
       return true;
     });
     
     if (newEntries.length === 0) {
       console.log('同期するデータがありません: フィルタリング後のエントリーが0件です');
       const now = new Date().toISOString();
       setLastSyncTime(now);
       localStorage.setItem('last_sync_time', now);
       return true;
     }
     
     console.log('同期する日記データ:', newEntries.length, '件（全', entries.length, '件中、重複除外後）', 'ユーザーID:', userId);

      // 各エントリーをSupabase形式に変換
     const formattedEntries = newEntries.map((entry: any) => {          
        // 無効なUUIDを修正（元のIDを保持）
        let entryId = fixInvalidUuid(entry.id);
          
        // 必須フィールドを含め、NULL値を適切に処理
        const formattedEntry: any = {
          id: entryId, // 修正したIDを使用
          user_id: userId, // 現在のユーザーIDを使用
          date: entry.date || new Date().toISOString().split('T')[0],
          emotion: entry.emotion || '不明',
          event: entry.event || '', // 空文字列をデフォルト値に
          realization: entry.realization || '', // 空文字列をデフォルト値に
          created_at: entry.created_at || new Date().toISOString()
        };
          
          // スコアフィールドの処理
          if (entry.emotion === '無価値感' || 
              entry.emotion === '嬉しい' || 
              entry.emotion === '感謝' ||
              entry.emotion === '達成感' || 
              entry.emotion === '幸せ') {
            
            // 必ずNULLにならないように数値に変換し、デフォルト値を設定
            formattedEntry.self_esteem_score = 
              typeof entry.selfEsteemScore === 'number' ? entry.selfEsteemScore : 
              (typeof entry.selfEsteemScore === 'string' && entry.selfEsteemScore !== '' ? parseInt(entry.selfEsteemScore) : 
               (typeof entry.self_esteem_score === 'number' ? entry.self_esteem_score : 
                (typeof entry.self_esteem_score === 'string' && entry.self_esteem_score !== '' ? parseInt(entry.self_esteem_score) : 50)));
            
            formattedEntry.worthlessness_score = 
              typeof entry.worthlessnessScore === 'number' ? entry.worthlessnessScore : 
              (typeof entry.worthlessnessScore === 'string' && entry.worthlessnessScore !== '' ? parseInt(entry.worthlessnessScore) : 
               (typeof entry.worthlessness_score === 'number' ? entry.worthlessness_score : 
                (typeof entry.worthlessness_score === 'string' && entry.worthlessness_score !== '' ? parseInt(entry.worthlessness_score) : 50)));
          }
          
          // オプションフィールドは存在する場合のみ追加
          const optionalFields: any = {
            assigned_counselor: entry.assigned_counselor || entry.assignedCounselor || '',
            urgency_level: '',
            is_visible_to_user: entry.is_visible_to_user !== undefined ? !!entry.is_visible_to_user : 
                               (entry.isVisibleToUser !== undefined ? !!entry.isVisibleToUser : false),
            counselor_name: entry.counselor_name || entry.counselorName || '',
            counselor_memo: entry.counselor_memo || entry.counselorMemo || ''
          };
          
          // 値が存在するフィールドのみを追加
          formattedEntry.assigned_counselor = optionalFields.assigned_counselor;
          formattedEntry.urgency_level = optionalFields.urgency_level;
          formattedEntry.is_visible_to_user = optionalFields.is_visible_to_user;
          formattedEntry.counselor_name = optionalFields.counselor_name;
          formattedEntry.counselor_memo = optionalFields.counselor_memo;
          
          // 緊急度の値を設定（安全のため常に空文字列）
          if (entry.urgency_level === 'high' || entry.urgency_level === 'medium' || entry.urgency_level === 'low' ||
              entry.urgencyLevel === 'high' || entry.urgencyLevel === 'medium' || entry.urgencyLevel === 'low') {
            formattedEntry.urgency_level = entry.urgency_level || entry.urgencyLevel || '';
          } else {
            formattedEntry.urgency_level = '';
          }
          
          return formattedEntry;
        });
      
      // 日記データを同期
      const { success, error } = await diaryService.syncDiaries(userId, formattedEntries);
      
      // 同期結果をログに出力
      console.log('同期結果:', success ? '✅ 成功' : '❌ 失敗', error || '', 'データ件数:', formattedEntries.length);
      
      if (!success) {
        throw new Error(error);
      }
      
     // 同期に成功したエントリーIDを記録
     newEntries.forEach((entry: any) => {
       currentProcessedIds.add(entry.id);
       
       // 重複チェック用のマップにも追加
       const key = `${entry.date}_${entry.emotion}_${entry.event.substring(0, 50)}`;
       processedEntryMap.set(key, true);
     });
     setProcessedEntryIds(currentProcessedIds);
     setProcessedEntryMap(new Map([...processedEntryMap, ...entryMap]));
      
      // 同期時間を更新
      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem('last_sync_time', now);
      
      console.log('データ同期完了:', newEntries.length, '件', 'ユーザーID:', userId, '時刻:', now, '同期されたデータ:', formattedEntries.slice(0, 1));
      return true;
    } catch (err) {
      console.error('データ同期エラー:', err);
      setError(err instanceof Error ? err.message : '不明なエラー');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, currentUser, processedEntryIds, processedEntryMap]);
  
  // 日記削除時の同期処理
  const syncDeleteDiary = useCallback(async (diaryId: string): Promise<boolean> => {
    if (!supabase) {
      console.log('ローカルモードで動作中: Supabase接続なし、削除同期をスキップします', diaryId);
      return true; // ローカルモードでは成功とみなす
    }
    
    if (isSyncing) {
      console.log('既に同期中です、削除同期をスキップします');
      return false;
    }
    
    setIsSyncing(true);
    setError(null);
    
    try {
      // Supabaseから日記を削除
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', diaryId);
      
      if (error) {
        console.error('Supabase日記削除エラー:', error, 'ID:', diaryId);
        setError(`日記削除エラー: ${error.message}`);
        return false;
      }
      
     // 処理済みIDリストから削除
     setProcessedEntryIds(prev => {
       const newSet = new Set(prev);
       newSet.delete(diaryId);
       return newSet;
     });
     
      // 同期時間を更新
      const now = new Date().toISOString();
      setLastSyncTime(now); 
      localStorage.setItem('last_sync_time', now);

      console.log('日記削除同期完了:', diaryId, '時刻:', now);
      return true;
    } catch (err) {
      console.error('日記削除同期エラー:', err);
      // エラーがあっても処理を続行（ローカルでは削除されている）
      return true;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);
  
  // 複数日記削除時の同期処理
  const syncBulkDeleteDiaries = useCallback(async (diaryIds: string[]): Promise<boolean> => {
    if (!supabase) {
      console.log('ローカルモードで動作中: Supabase接続なし、一括削除同期をスキップします', diaryIds?.length);
      return true; // ローカルモードでは成功とみなす
    }
    
    if (isSyncing) {
      console.log('既に同期中です、一括削除同期をスキップします');
      return false;
    }
    
    if (!diaryIds || !Array.isArray(diaryIds) || diaryIds.length === 0) {
      console.log('削除する日記IDがありません');
      return true; // 削除するものがない場合は成功とみなす
    }
    
    setIsSyncing(true);
    setError(null);
    
    try {
      // 一括削除（100件ずつに分割して実行）
      const chunkSize = 100;
      let success = true;
      let deletedCount = 0;
      
      for (let i = 0; i < diaryIds.length; i += chunkSize) {
        const chunk = diaryIds.slice(i, i + chunkSize);
        try {
          const { error, count } = await supabase
            .from('diary_entries')
            .delete()
            .in('id', chunk)
            .select();
          
          if (error) {
            console.error(`日記の一括削除エラー (${i}~${i+chunk.length})`, error, 'IDs:', chunk);
            success = false;
          } else {
            deletedCount += count || 0;
          }
        } catch (err) {
          console.error(`日記の一括削除中にエラー (${i}~${i+chunk.length})`, err, 'IDs:', chunk);
          // エラーがあっても処理を続行
        }
      }
      
     // 処理済みIDリストから削除
     setProcessedEntryIds(prev => {
       const newSet = new Set(prev);
       diaryIds.forEach(id => newSet.delete(id));
       return newSet;
     });
     
      // 同期時間を更新
      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem('last_sync_time', now);
      
      console.log('一括削除同期完了:', deletedCount, '/', diaryIds.length, '件', '時刻:', now);
      return success;
    } catch (err) {
      console.error('一括削除同期エラー:', err);
      // エラーがあっても処理を続行（ローカルでは削除されている）
      return true;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);
  
  // 手動同期のトリガー
  const triggerManualSync = useCallback(async (): Promise<boolean> => {
   // 手動同期の場合は処理済みIDをリセットして全データを同期
    setProcessedEntryIds(new Set());
    setProcessedEntryMap(new Map());
    return await syncData();
  }, [syncData]);
  
  return {
    isAutoSyncEnabled,
    isSyncing,
    lastSyncTime,
    error,
    currentUser,
    triggerManualSync,
    syncDeleteDiary,
    syncBulkDeleteDiaries
  };
};