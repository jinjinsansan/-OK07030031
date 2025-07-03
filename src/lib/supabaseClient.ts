import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントの作成
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isLocalMode = import.meta.env.VITE_LOCAL_MODE === 'true';

// ローカルモードの場合はsupabaseをnullに設定
export const supabase = !isLocalMode && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default supabase;