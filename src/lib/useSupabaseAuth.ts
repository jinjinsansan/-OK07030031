import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export function useSupabaseAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ローカルストレージからユーザー名を取得
    const lineUsername = localStorage.getItem('line-username');
    
    if (!supabase) {
      // ローカルモードの場合
      if (lineUsername) {
        setUser({ id: 'local-user', line_username: lineUsername });
      }
      setLoading(false);
      return;
    }
    
    async function getUser() {
      try {
        if (!lineUsername) {
          setLoading(false);
          return;
        }
        
        // Supabaseでユーザーを検索
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('line_username', lineUsername)
          .single();
        
        if (error) {
          // ユーザーが見つからない場合は作成
          if (error.code === 'PGRST116') {
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert([{ line_username: lineUsername }])
              .select()
              .single();
            
            if (createError) {
              throw createError;
            }
            
            setUser(newUser);
          } else {
            throw error;
          }
        } else {
          setUser(data);
        }
      } catch (err) {
        console.error('認証エラー:', err);
        setError(err instanceof Error ? err.message : '認証エラーが発生しました');
      } finally {
        setLoading(false);
      }
    }
    
    getUser();
  }, []);

  return { user, loading, error };
}

export default useSupabaseAuth;