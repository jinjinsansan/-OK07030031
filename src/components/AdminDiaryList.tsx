import React, { useState, useEffect } from 'react';
import { Eye, Trash2, Calendar, User, Tag, AlertTriangle } from 'lucide-react';

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
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    // 表示対象のエントリーを設定
    setEntries(allEntries);
  }, [allEntries]);

  const getEmotionColor = (emotion: string) => {
    const colorMap: { [key: string]: string } = {
      // ネガティブな感情
      '恐怖': 'bg-purple-50',
      '悲しみ': 'bg-blue-50',
      '怒り': 'bg-red-50',
      '悔しい': 'bg-green-50',
      '無価値感': 'bg-gray-50',
      '罪悪感': 'bg-orange-50',
      '寂しさ': 'bg-indigo-50',
      '恥ずかしさ': 'bg-pink-50',
      // ポジティブな感情
      '嬉しい': 'bg-yellow-50',
      '感謝': 'bg-teal-50',
      '達成感': 'bg-lime-50',
      '幸せ': 'bg-amber-50'
    };
    return colorMap[emotion] || 'bg-white';
  };

  const getEmotionBorderColor = (emotion: string) => {
    const colorMap: { [key: string]: string } = {
      // ネガティブな感情
      '恐怖': 'border-purple-200',
      '悲しみ': 'border-blue-200',
      '怒り': 'border-red-200',
      '悔しい': 'border-green-200',
      '無価値感': 'border-gray-300',
      '罪悪感': 'border-orange-200',
      '寂しさ': 'border-indigo-200',
      '恥ずかしさ': 'border-pink-200',
      // ポジティブな感情
      '嬉しい': 'border-yellow-200',
      '感謝': 'border-teal-200',
      '達成感': 'border-lime-200',
      '幸せ': 'border-amber-200'
    };
    return colorMap[emotion] || 'border-gray-200';
  };

  const getEmotionTextColor = (emotion: string) => {
    const colorMap: { [key: string]: string } = {
      // ネガティブな感情
      '恐怖': 'text-purple-800',
      '悲しみ': 'text-blue-800',
      '怒り': 'text-red-800',
      '悔しい': 'text-green-800',
      '無価値感': 'text-gray-800',
      '罪悪感': 'text-orange-800',
      '寂しさ': 'text-indigo-800',
      '恥ずかしさ': 'text-pink-800',
      // ポジティブな感情
      '嬉しい': 'text-yellow-800',
      '感謝': 'text-teal-800',
      '達成感': 'text-lime-800',
      '幸せ': 'text-amber-800'
    };
    return colorMap[emotion] || 'text-gray-800';
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
      {entries.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-jp-medium text-gray-500 mb-2">
            日記がありません
          </h3>
          <p className="text-gray-400 font-jp-normal">
            日記が作成されるとここに表示されます
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div 
              key={entry.id} 
              className={`border ${getEmotionBorderColor(entry.emotion)} rounded-lg p-4 hover:shadow-md transition-shadow ${getEmotionColor(entry.emotion)}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                  <span className="text-sm font-jp-medium text-gray-900">{formatDate(entry.date)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-jp-medium border ${getEmotionBorderColor(entry.emotion)} ${getEmotionTextColor(entry.emotion)}`}>
                    {entry.emotion}
                  </span>
                  {entry.syncStatus && (
                    <span className={`px-2 py-1 rounded-full text-xs font-jp-bold ${
                      entry.syncStatus === 'supabase' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {entry.syncStatus === 'supabase' ? 'Supabase' : 'ローカル'}
                    </span>
                  )}
                  {(entry.urgency_level || entry.urgencyLevel) && (
                    <span className={`px-2 py-1 rounded-full text-xs font-jp-bold ${
                      getUrgencyLevelColor(entry.urgency_level || entry.urgencyLevel)
                    }`}>
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
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
                  {(entry.self_esteem_score || entry.selfEsteemScore || entry.worthlessness_score || entry.worthlessnessScore) && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Tag className="w-3 h-3" />
                      <span>自己肯定感: {entry.self_esteem_score || entry.selfEsteemScore || 'N/A'}</span>
                      <span>無価値感: {entry.worthlessness_score || entry.worthlessnessScore || 'N/A'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-sm font-jp-medium text-gray-700">出来事: </span>
                  <span className="text-sm text-gray-900 font-jp-normal whitespace-pre-wrap">{entry.event}</span>
                </div>
                <div>
                  <span className="text-sm font-jp-medium text-gray-700">気づき: </span>
                  <span className="text-sm text-gray-900 font-jp-normal whitespace-pre-wrap">{entry.realization}</span>
                </div>
                {(entry.counselor_memo || entry.counselorMemo) && (
                  <div className="bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                    <span className="text-sm font-jp-medium text-gray-700">カウンセラーメモ: </span>
                    <span className="text-sm text-gray-900 font-jp-normal whitespace-pre-wrap">{entry.counselor_memo || entry.counselorMemo}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 font-jp-normal">
                    {entry.assigned_counselor || entry.assignedCounselor || '未割り当て'}
                  </span>
                  <div className="flex items-center space-x-2">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDiaryList;