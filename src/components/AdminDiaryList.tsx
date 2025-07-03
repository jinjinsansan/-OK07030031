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
      '恐怖': 'bg-purple-100',
      '悲しみ': 'bg-blue-100',
      '怒り': 'bg-red-100',
      '悔しい': 'bg-green-100',
      '無価値感': 'bg-gray-100',
      '罪悪感': 'bg-orange-100',
      '寂しさ': 'bg-indigo-100',
      '恥ずかしさ': 'bg-pink-100',
      // ポジティブな感情
      '嬉しい': 'bg-yellow-100',
      '感謝': 'bg-teal-100',
      '達成感': 'bg-lime-100',
      '幸せ': 'bg-amber-100'
    };
    return colorMap[emotion] || 'bg-white';
  };

  const getEmotionBorderColor = (emotion: string) => {
    const colorMap: { [key: string]: string } = {
      // ネガティブな感情
      '恐怖': 'border-purple-300',
      '悲しみ': 'border-blue-300',
      '怒り': 'border-red-300',
      '悔しい': 'border-green-300',
      '無価値感': 'border-gray-400',
      '罪悪感': 'border-orange-300',
      '寂しさ': 'border-indigo-300',
      '恥ずかしさ': 'border-pink-300',
      // ポジティブな感情
      '嬉しい': 'border-yellow-300',
      '感謝': 'border-teal-300',
      '達成感': 'border-lime-300',
      '幸せ': 'border-amber-300'
    };
    return colorMap[emotion] || 'border-gray-200';
  };

  const getEmotionTextColor = (emotion: string) => {
    const colorMap: { [key: string]: string } = {
      // ネガティブな感情
      '恐怖': 'text-purple-900',
      '悲しみ': 'text-blue-900',
      '怒り': 'text-red-900',
      '悔しい': 'text-green-900',
      '無価値感': 'text-gray-900',
      '罪悪感': 'text-orange-900',
      '寂しさ': 'text-indigo-900',
      '恥ずかしさ': 'text-pink-900',
      // ポジティブな感情
      '嬉しい': 'text-yellow-900',
      '感謝': 'text-teal-900',
      '達成感': 'text-lime-900',
      '幸せ': 'text-amber-900'
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
              className={`border-2 ${getEmotionBorderColor(entry.emotion)} rounded-lg p-4 hover:shadow-lg transition-all ${getEmotionColor(entry.emotion)} shadow-sm`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                  <span className="text-sm font-jp-medium text-gray-900">{formatDate(entry.date)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-jp-bold border-2 ${getEmotionBorderColor(entry.emotion)} ${getEmotionTextColor(entry.emotion)} bg-white`}>
                    {entry.emotion}
                  </span>
                  {entry.syncStatus && (
                    <span className={`px-2 py-1 rounded-full text-xs font-jp-bold ${
                      entry.syncStatus === 'supabase' 
                        ? 'bg-green-100 text-green-900 border-2 border-green-300' 
                        : 'bg-yellow-100 text-yellow-900 border-2 border-yellow-300'
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
                    <span className="text-xs text-gray-700 font-jp-medium flex items-center bg-white px-2 py-1 rounded-lg shadow-sm">
                      <User className="w-3 h-3 mr-1" />
                      {entry.user?.line_username || entry.users?.line_username}
                    </span>
                  )}
                  {(entry.self_esteem_score || entry.selfEsteemScore || entry.worthlessness_score || entry.worthlessnessScore) && (
                    <div className="flex items-center space-x-1 text-xs text-gray-700 bg-white px-2 py-1 rounded-lg shadow-sm">
                      <Tag className="w-3 h-3" />
                      <span className="font-jp-medium">自己肯定感: <span className="text-blue-700 font-jp-bold">{entry.self_esteem_score || entry.selfEsteemScore || 'N/A'}</span></span>
                      <span className="font-jp-medium">無価値感: <span className="text-red-700 font-jp-bold">{entry.worthlessness_score || entry.worthlessnessScore || 'N/A'}</span></span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-sm font-jp-bold text-gray-700">出来事: </span>
                  <span className="text-sm text-gray-900 font-jp-normal whitespace-pre-wrap">{entry.event}</span>
                </div>
                <div>
                  <span className="text-sm font-jp-bold text-gray-700">気づき: </span>
                  <span className="text-sm text-gray-900 font-jp-normal whitespace-pre-wrap">{entry.realization}</span>
                </div>
                {(entry.counselor_memo || entry.counselorMemo) && (
                  <div className="bg-yellow-100 p-3 rounded-lg border-2 border-yellow-300 shadow-sm">
                    <span className="text-sm font-jp-bold text-gray-700">カウンセラーメモ: </span>
                    <span className="text-sm text-gray-900 font-jp-normal whitespace-pre-wrap">{entry.counselor_memo || entry.counselorMemo}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-lg shadow-sm">
                  <span className="text-xs text-gray-700 font-jp-medium">
                    {entry.assigned_counselor || entry.assignedCounselor || '未割り当て'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewEntry(entry)}
                      className="text-blue-600 hover:text-blue-700 p-1 cursor-pointer bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                      title="詳細を見る"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {onDeleteEntry && (
                      <button
                        onClick={() => onDeleteEntry(entry.id)}
                        className="text-red-600 hover:text-red-700 p-1 cursor-pointer bg-red-50 rounded-full hover:bg-red-100 transition-colors"
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