import { useState } from 'react';
import { ChevronRight, ChevronDown, BookOpen, CheckCircle, Circle, Play, Home } from 'lucide-react';
import { useLearningStore } from '../../../stores/learningStore';
import type { Course, Module, Lesson } from '../types';

interface CourseNavigationProps {
  course: Course;
  onLessonSelect: (lesson: Lesson) => void;
  isCollapsed?: boolean;
}

interface ModuleItemProps {
  module: Module;
  isExpanded: boolean;
  onToggle: () => void;
  onLessonSelect: (lesson: Lesson) => void;
  currentLessonId?: string;
  completedLessons: Set<string>;
  isCollapsed?: boolean;
}

const ModuleItem: React.FC<ModuleItemProps> = ({
  module,
  isExpanded,
  onToggle,
  onLessonSelect,
  currentLessonId,
  completedLessons,
  isCollapsed = false
}) => {
  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${isCollapsed ? 'mb-1' : 'mb-3'}`}>
      {/* モジュールヘッダー */}
      <button
        onClick={onToggle}
        className={`w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left ${
          isCollapsed ? 'p-2' : ''
        }`}
        title={isCollapsed ? module.title : ''}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
          <BookOpen className={`text-blue-600 ${isCollapsed ? 'w-4 h-4' : 'w-5 h-5 mr-3'}`} />
          {!isCollapsed && (
            <div>
              <h3 className="font-semibold text-gray-800">{module.title}</h3>
              <p className="text-sm text-gray-600">
                {module.lessons.length}レッスン
              </p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )
        )}
      </button>

      {/* レッスン一覧 */}
      {isExpanded && !isCollapsed && (
        <div className="bg-white">
          {module.lessons
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((lesson) => {
              const isCompleted = completedLessons.has(lesson.id);
              const isCurrent = currentLessonId === lesson.id;

              return (
                <button
                  key={lesson.id}
                  onClick={() => onLessonSelect(lesson)}
                  className={`w-full p-3 text-left hover:bg-blue-50 transition-colors border-t border-gray-100 flex items-center ${
                    isCurrent ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center flex-1">
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
                    ) : isCurrent ? (
                      <Play className="w-4 h-4 text-blue-600 mr-3 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium ${
                        isCurrent ? 'text-blue-900' : 'text-gray-800'
                      }`}>
                        {lesson.title}
                      </h4>
                      <p className="text-xs text-gray-600 truncate">
                        {lesson.codeExamples?.length || 0}個のコード例
                        {lesson.exercises?.length ? ` • ${lesson.exercises.length}個の演習` : ''}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
};

export const CourseNavigation: React.FC<CourseNavigationProps> = ({
  course,
  onLessonSelect,
  isCollapsed = false
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(course.modules.map(m => m.id)) // すべてのモジュールを展開してテスト
  );
  
  // デバッグログを追加
  console.log('🔍 CourseNavigation - Total modules:', course.modules.length);
  console.log('🔍 Expanded modules:', Array.from(expandedModules));
  course.modules.forEach((module, index) => {
    console.log(`🔍 Module ${index + 1}:`, module.title, `(${module.lessons.length} lessons, expanded: ${expandedModules.has(module.id)})`);
    module.lessons.forEach((lesson, lessonIndex) => {
      console.log(`  📖 Lesson ${lessonIndex + 1}:`, lesson.title, `(order: ${lesson.order})`);
    });
  });
  
  const { currentLesson, progress } = useLearningStore();
  
  // 完了済みレッスンの取得
  const completedLessons = progress?.courseProgress.get(course.id)?.completedLessons || new Set<string>();
  
  // 進捗統計の計算
  const totalLessons = course.modules.reduce((total, module) => total + module.lessons.length, 0);
  const completedCount = completedLessons.size;
  const progressPercentage = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  return (
    <div className="bg-white border-r border-gray-200 h-full flex flex-col">
      {/* コースヘッダー */}
      <div className={`border-b border-gray-200 ${isCollapsed ? 'p-2' : 'p-4 lg:p-6'}`}>
        {/* ホームボタン */}
        <div className={`${isCollapsed ? 'mb-2' : 'mb-3'}`}>
          <a
            href="/"
            className={`inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium ${
              isCollapsed ? 'w-full justify-center px-2 py-1' : ''
            }`}
            title="プラットフォームトップに戻る"
          >
            <Home className="w-4 h-4" />
            {!isCollapsed && <span>プラットフォーム</span>}
          </a>
        </div>
        
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'mb-3'}`}>
          <span className={`${isCollapsed ? 'text-lg' : 'text-xl lg:text-2xl mr-2'}`}>{course.icon}</span>
          {!isCollapsed && (
            <h2 className="text-lg lg:text-xl font-bold text-gray-800">{course.title}</h2>
          )}
        </div>
        {!isCollapsed && (
          <>
            <p className="text-gray-600 text-sm mb-4">{course.description}</p>
            
            {/* 進捗表示 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>進捗</span>
                <span>{completedCount}/{totalLessons} レッスン完了</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">
                {progressPercentage.toFixed(0)}% 完了
              </div>
            </div>
          </>
        )}
      </div>

      {/* モジュール一覧 */}
      <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'p-1' : 'p-4'}`}>
        {course.modules
          .sort((a, b) => a.order - b.order)
          .map((module) => (
            <ModuleItem
              key={module.id}
              module={module}
              isExpanded={expandedModules.has(module.id)}
              onToggle={() => toggleModule(module.id)}
              onLessonSelect={onLessonSelect}
              currentLessonId={currentLesson?.id}
              completedLessons={completedLessons}
              isCollapsed={isCollapsed}
            />
          ))}
      </div>

      {/* フッター */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            <p>推定学習時間: {course.estimatedHours}時間</p>
            <p className="mt-1">レベル: {course.level}</p>
          </div>
        </div>
      )}
    </div>
  );
};