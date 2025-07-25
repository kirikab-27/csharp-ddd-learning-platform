import { useMemo } from 'react';
import { BarChart3, Clock, Target, TrendingUp, BookOpen, CheckCircle } from 'lucide-react';
import { useLearningStore } from '../../../stores/learningStore';

export const LearningDashboard: React.FC = () => {
  const { currentCourse, progress } = useLearningStore();

  // 学習統計の計算
  const stats = useMemo(() => {
    if (!currentCourse || !progress) {
      return {
        totalLessons: 0,
        completedLessons: 0,
        completionRate: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        averageScore: 0,
        recentActivity: []
      };
    }

    const courseProgress = progress.courseProgress.get(currentCourse.id);
    if (!courseProgress) {
      return {
        totalLessons: currentCourse.modules.reduce((total, module) => total + module.lessons.length, 0),
        completedLessons: 0,
        completionRate: 0,
        totalTimeSpent: 0,
        currentStreak: 1,
        averageScore: 0,
        recentActivity: []
      };
    }

    const totalLessons = currentCourse.modules.reduce((total, module) => total + module.lessons.length, 0);
    const completedLessons = courseProgress.completedLessons.size;
    const completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // 演習スコアの平均を計算
    const scores = Array.from(courseProgress.exerciseScores.values());
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

    // 最近のアクティビティを生成（模擬データ）
    const recentActivity = [
      { date: new Date().toLocaleDateString(), action: '新しいレッスンを完了', details: 'Hello World' },
      { date: new Date(Date.now() - 86400000).toLocaleDateString(), action: '演習問題を解いた', details: '自己紹介プログラム' },
      { date: new Date(Date.now() - 172800000).toLocaleDateString(), action: 'コースを開始', details: 'C# 基礎' }
    ];

    return {
      totalLessons,
      completedLessons,
      completionRate,
      totalTimeSpent: courseProgress.timeSpent || 0,
      currentStreak: 3, // 模擬データ
      averageScore,
      recentActivity
    };
  }, [currentCourse, progress]);

  // プログレスバーのコンポーネント
  const ProgressBar: React.FC<{ percentage: number; color?: string }> = ({ 
    percentage, 
    color = 'bg-blue-600' 
  }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`${color} h-2 rounded-full transition-all duration-300`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
          学習ダッシュボード
        </h2>
        {currentCourse && (
          <span className="text-sm text-gray-600">
            {currentCourse.title}
          </span>
        )}
      </div>

      {/* 主要統計 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* 完了率 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-800">完了率</h3>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900 mb-2">
            {stats.completionRate.toFixed(0)}%
          </div>
          <ProgressBar percentage={stats.completionRate} color="bg-blue-600" />
          <p className="text-xs text-blue-700 mt-1">
            {stats.completedLessons}/{stats.totalLessons} レッスン
          </p>
        </div>

        {/* 学習時間 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-800">学習時間</h3>
            <Clock className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-900 mb-2">
            {Math.floor(stats.totalTimeSpent / 60)}h
          </div>
          <p className="text-xs text-green-700">
            合計 {stats.totalTimeSpent} 分
          </p>
        </div>

        {/* 連続学習日数 */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-orange-800">連続学習</h3>
            <TrendingUp className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-900 mb-2">
            {stats.currentStreak}
          </div>
          <p className="text-xs text-orange-700">
            日間継続中
          </p>
        </div>

        {/* 平均スコア */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-800">平均スコア</h3>
            <CheckCircle className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-900 mb-2">
            {stats.averageScore.toFixed(0)}
          </div>
          <p className="text-xs text-purple-700">
            点 / 100点満点
          </p>
        </div>
      </div>

      {/* 進捗グラフ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 学習進捗 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-gray-600" />
            モジュール別進捗
          </h3>
          {currentCourse ? (
            <div className="space-y-3">
              {currentCourse.modules.map((module) => {
                const courseProgress = progress?.courseProgress.get(currentCourse.id);
                const completedInModule = module.lessons.filter(lesson => 
                  courseProgress?.completedLessons.has(lesson.id)
                ).length;
                const progressPercentage = (completedInModule / module.lessons.length) * 100;

                return (
                  <div key={module.id} className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {module.title}
                      </span>
                      <span className="text-xs text-gray-500">
                        {completedInModule}/{module.lessons.length}
                      </span>
                    </div>
                    <ProgressBar 
                      percentage={progressPercentage} 
                      color={progressPercentage === 100 ? 'bg-green-600' : 'bg-blue-600'}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">コースが選択されていません</p>
          )}
        </div>

        {/* 最近のアクティビティ */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            最近のアクティビティ
          </h3>
          <div className="space-y-3">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="bg-white p-3 rounded border flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-600">
                    {activity.details}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 学習のヒント */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 学習のヒント</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 毎日少しずつでも継続することが重要です</li>
          <li>• 演習問題を積極的に解いてスキルを定着させましょう</li>
          <li>• 分からないことはAIメンターに気軽に質問してください</li>
          <li>• 前のレッスンを復習することで理解が深まります</li>
        </ul>
      </div>
    </div>
  );
};