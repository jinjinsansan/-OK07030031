import React, { useState, useEffect } from 'react';
import { Eye, Edit3, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminDiaryListProps {
  allEntries: any[];
  onViewEntry: (entry: any) => void;
  onDeleteEntry?: (entryId: string) => void;
}

const AdminDiaryList: React.FC<AdminDiaryListProps> = ({
  allEntries,
  onViewEntry,
  onDeleteEntry
}) => {
  const [visibleEntries, setVisibleEntries] = useState<any[]>([]);
  
  useEffect(() => {
    // 表示する日記エントリーをフィルタリング
    // syncStatusが空またはsupabaseのエントリーのみを表示
    const filteredEntries = allEntries
      .filter(e => !e.syncStatus || e.syncStatus === 'supabase');
    
    setVisibleEntries(filteredEntries);
  }, [allEntries]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || !dateString) {
      return dateString || '日付なし';
    }
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 感情ごとの Tailwind 色
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

  const getEmotionColor = (emotion: string) => {
    const colorMap: { [key: string]: string } = {
      '恐怖': 'bg-purple-100 text-purple-800 border-purple-200',
      '悲しみ': 'bg-blue-100 text-blue-800 border-blue-200',
      '怒り': 'bg-red-100 text-red-800 border-red-200',
      '悔しい': 'bg-green-100 text-green-800 border-green-200',
      '無価値感': 'bg-gray-100 text-gray-800 border-gray-300',
      '罪悪感': 'bg-orange-100 text-orange-800 border-orange-200',
      '寂しさ': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      '恥ずかしさ': 'bg-pink-100 text-pink-800 border-pink-200',
      '嬉しい': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      '感謝': 'bg-teal-100 text-teal-800 border-teal-200',
      '達成感': 'bg-lime-100 text-lime-800 border-lime-200',
      '幸せ': 'bg-amber-100 text-amber-800 border-amber-200'
    };
    return colorMap[emotion] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getUrgencyLevelColor = (level: string) => {
    const colorMap: { [key: string]: string } = {
      'high': 'bg-red-100 text-red-800 border-red-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200'
    };
    return colorMap[level] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getUrgencyLevelText = (level: string) => {
    const textMap: { [key: string]: string } = {
      'high': '高',
      'medium': '中',
      'low': '低'
    };
    return textMap[level] || '未設定';
  };

  return (
    <div className="space-y-4">
      {visibleEntries.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-jp-medium text-gray-500 mb-2">
            日記が見つかりませんでした
          </h3>
          <p className="text-gray-400 font-jp-normal">
            検索条件を変更するか、新しい日記を作成してください
          </p>
        </div>
      ) : (
        visibleEntries.map((entry) => (
          <div
            className={`rounded-xl p-6 shadow ${emotionColor[entry.emotion] ?? 'bg-white'}`}
            key={entry.id}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-jp-medium border ${getEmotionColor(entry.emotion)}`}>
                  {entry.emotion}
                </span>
                <span className="text-gray-500 text-xs sm:text-sm font-jp-normal">
                  {formatDate(entry.date)}
                </span>
                {entry.syncStatus && (
                  <span className={`px-2 py-1 rounded-full text-xs font-jp-medium ${
                    entry.syncStatus === 'supabase' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {entry.syncStatus === 'supabase' ? 'Supabase' : 'ローカル'}
                  </span>
                )}
                {(entry.urgency_level || entry.urgencyLevel) && (
                  <span className={`px-2 py-1 rounded-full text-xs font-jp-medium ${
                    getUrgencyLevelColor(entry.urgency_level || entry.urgencyLevel)
                  }`}>
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    {getUrgencyLevelText(entry.urgency_level || entry.urgencyLevel)}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {entry.user?.line_username && (
                  <span className="text-xs text-gray-500 font-jp-normal">
                    {entry.user.line_username}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <h4 className="font-jp-semibold text-gray-700 mb-1 text-sm">出来事</h4>
                <p className="text-gray-600 text-xs sm:text-sm font-jp-normal leading-relaxed break-words">
                  {entry.event.length > 100 ? `${entry.event.substring(0, 100)}...` : entry.event}
                </p>
              </div>
              <div>
                <h4 className="font-jp-semibold text-gray-700 mb-1 text-sm">気づき</h4>
                <p className="text-gray-600 text-xs sm:text-sm font-jp-normal leading-relaxed break-words">
                  {entry.realization && entry.realization.length > 100 ? `${entry.realization.substring(0, 100)}...` : entry.realization}
                </p>
              </div>
            </div>

            {/* カウンセラーコメント */}
            {((entry.is_visible_to_user || entry.isVisibleToUser) && (entry.counselor_memo || entry.counselorMemo)) && (
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
            )}

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
                <button
                  onClick={() => onViewEntry(entry)}
                  className="text-green-600 hover:text-green-700 p-1 cursor-pointer"
                  title="編集"
                >
                  <Edit3 className="w-4 h-4" />
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
        ))
      )}
    </div>
  );
};

export default AdminDiaryList;