// 日記エントリーの型定義
export interface DiaryEntry {
  id: string;
  date: string;
  emotion: string;
  event: string;
  realization: string;
  self_esteem_score?: number;
  selfEsteemScore?: number;
  worthlessness_score?: number;
  worthlessnessScore?: number;
  created_at: string;
  user_id?: string;
  user?: {
    line_username: string;
  };
  users?: {
    line_username: string;
  };
  assigned_counselor?: string;
  assignedCounselor?: string;
  urgency_level?: 'high' | 'medium' | 'low';
  urgencyLevel?: 'high' | 'medium' | 'low';
  counselor_memo?: string;
  counselorMemo?: string;
  is_visible_to_user?: boolean;
  isVisibleToUser?: boolean;
  counselor_name?: string;
  counselorName?: string;
  syncStatus?: string;
}

// Supabaseデータベースの型定義
export interface Database {
  public: {
    Tables: {
      diary_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          emotion: string;
          event: string;
          realization: string;
          self_esteem_score: number;
          worthlessness_score: number;
          created_at: string;
          counselor_memo?: string;
          is_visible_to_user?: boolean;
          counselor_name?: string;
          assigned_counselor?: string;
          urgency_level?: string;
        };
      };
      users: {
        Row: {
          id: string;
          line_username: string;
          created_at: string;
        };
      };
    };
  };
}