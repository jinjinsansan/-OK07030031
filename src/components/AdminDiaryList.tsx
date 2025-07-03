import React, { useState, useEffect } from 'react';
import { Eye, Trash2, Calendar, User, Tag } from 'lucide-react';

interface DiaryEntry {
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

interface AdminDiaryListProps {
  allEntries: DiaryEntry[];
  onViewEntry: (entry: DiaryEntry) => void;
  onDeleteEntry?: (entryId: string) => void;
}

const AdminDiaryList: React.FC<AdminDiaryListProps> = ({
  allEntries,
  onViewEntry,
  onDeleteEntry
}) => {
  const [visibleEntries, setVisibleEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    // 表示対象のエントリーをフィルタリング
    const visibleEntries =
      allEntries
        .filter(e => e.is_visible_to_user)
        .filter(e => !e.syncStatus || e.syncStatus === 'supabase');
    
    setVisibleEntries(visibleEntries);
  }, [allEntries]);

  const emotionColor: Record<string, string> = {
    '恐怖':       'bg-violet-100',
    '怒り':       'bg-red-100',
    '無価値感':   'bg-gray-100',
    '悲しみ':     'bg-blue-100',
    '悔しい':     'bg-green-100',
    '罪悪感':     'bg-orange-100',
    '寂しさ':     'bg-indigo-100',
    '恥ずかしさ': 'bg-pink-100',
    '嬉しい':     'bg-yellow-100',
    '感謝':       'bg-teal-100',
    '達成感':     'bg-lime-100',
    '幸せ':       'bg-amber-100',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // 無効な日付の場合は元の文字列を返す
    if (isNaN(date.getTime())) {
      return dateString || '日付なし';
    }
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return `${month}月${day}日 (${dayOfWeek})`;
  };

  const getUrgencyLevelColor = (level?: string) => {
    const colorMap: { [key: string]: string } = {
      'high': 'bg-red-100 text-red-800 border-red-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200'
    };
    return level ? colorMap[level] || 'bg-gray-100 text-gray-800 border-gray-200' : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getUrgencyLevelText = (level?: string) => {
    const textMap: { [key: string]: string } = {
      'high': '高',
      'medium': '中',
      'low': '低'
    };
    return level ? textMap[level] || '未設定' : '未設定';
  };

  return (
    <div className="space-y-4">
      {visibleEntries.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-jp-medium text-gray-500 mb-2">
            表示可能な日記がありません
          </h3>
          <p className="text-gray-400 font-jp-normal">
            カウンセラーコメントを表示設定にした日記がここに表示されます
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleEntries.map((entry) => (
            <div key={entry.id} className={`rounded-xl p-6 shadow ${emotionColor[entry.emotion] ?? 'bg-white'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="text-sm font-jp-medium text-gray-900">{formatDate(entry.date)}</span>
                  <span className="px-3 py-1 rounded-full text-xs font-jp-medium border border-gray-200 bg-white">
                    {entry.emotion}
                  </span>
                  {(entry.urgency_level || entry.urgencyLevel) && (
                    <span className={`px-2 py-1 rounded-full text-xs font-jp-medium border ${
                      getUrgencyLevelColor(entry.urgency_level || entry.urgencyLevel)
                    }`}>
                      {getUrgencyLevelText(entry.urgency_level || entry.urgencyLevel)}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {(entry.user?.line_username || entry.users?.line_username) && (
                    <span className="text-xs text-gray-500 font-jp-normal flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {entry.user?.line_username || entry.users?.line_username}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <h4 className="font-jp-semibold text-gray-700 mb-1 text-sm">出来事</h4>
                  <p className="text-gray-600 text-xs sm:text-sm font-jp-normal leading-relaxed break-words">
                    {entry.event}
                  </p>
                </div>
                <div>
                  <h4 className="font-jp-semibold text-gray-700 mb-1 text-sm">気づき</h4>
                  <p className="text-gray-600 text-xs sm:text-sm font-jp-normal leading-relaxed break-words">
                    {entry.realization}
                  </p>
                </div>
              </div>
              
              {/* カウンセラーコメント */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-3">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-jp-medium text-blue-700 break-words">
                    {entry.counselor_name || entry.counselorName || 'カウンセラー'}からのコメント
                  </span>
                </div>
                <p className="text-blue-800 text-sm font-jp-normal leading-relaxed break-words">
                  {entry.counselor_memo || entry.counselorMemo}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {(entry.assignedCounselor || entry.assigned_counselor) ?
                    `担当: ${entry.assignedCounselor || entry.assigned_counselor}` :
                    '未割り当て'}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onViewEntry(entry)}
                    className="text-blue-600 hover:text-blue-700 p-1 cursor-pointer"
                    title="詳細を見る"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {onDeleteEntry && (
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      className="text-red-600 hover:text-red-700 p-1 cursor-pointer"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDiaryList;