import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronLeft } from 'lucide-react';
import { AIAssistant } from './components/ai/AIAssistant';
import { CourseNavigation } from './features/learning/components/CourseNavigation';
import { LessonViewer } from './features/learning/components/LessonViewer';
import { HelpModal } from './features/learning/components/HelpModal';
import { LearningDashboard } from './features/learning/components/LearningDashboard';
import { useLearningStore } from './stores/learningStore';
import { useLearningHotkeys } from './features/learning/hooks/useLearningHotkeys';
import csharpBasicsCourse from './content/courses/csharp-basics';
import csharpIntermediateCourse from './content/courses/csharp-intermediate';
import csharpAdvancedCourse from './content/courses/csharp-advanced';
import type { Lesson, Course } from './features/learning/types';

// ホームページコンポーネント（従来の内容を一部残す）
function HomePage() {
  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8">
      <div className="text-center mb-8 lg:mb-12">
        <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-4">
          🎓 C# DDD学習プラットフォーム
        </h1>
        <p className="text-lg lg:text-xl text-gray-600 mb-6 lg:mb-8">
          C#からドメイン駆動設計まで、段階的に学べるインタラクティブな学習環境
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">✨ 学習機能</h3>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <ul className="space-y-2 text-blue-700">
              <li>📚 段階的なカリキュラム</li>
              <li>💻 インタラクティブなコード例</li>
              <li>🎯 実践的な演習問題</li>
            </ul>
            <ul className="space-y-2 text-blue-700">
              <li>🤖 AIメンターによるサポート</li>
              <li>📊 学習進捗の可視化</li>
              <li>🚀 自走できるエンジニアを目指す</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">🚀 学習を始める</h3>
        <p className="text-gray-600 mb-6">
          C#の基礎から始めて、段階的にドメイン駆動設計まで学習できます。レベルに応じてコースを選択してください。
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-semibold text-blue-800 mb-2">基礎コース</h4>
            <p className="text-sm text-blue-600">C#の基本文法とプログラミング概念を学習</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🚀</div>
            <h4 className="font-semibold text-purple-800 mb-2">中級コース</h4>
            <p className="text-sm text-purple-600">LINQ、非同期処理、高度なC#機能を習得</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🏗️</div>
            <h4 className="font-semibold text-emerald-800 mb-2">上級コース</h4>
            <p className="text-sm text-emerald-600">ドメイン駆動設計の実践的な実装を学習</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="/courses/csharp-basics" 
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            🎯 C#基礎コース
          </a>
          <a 
            href="/courses/csharp-intermediate" 
            className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
          >
            🚀 C#中級コース
          </a>
          <a 
            href="/courses/csharp-advanced" 
            className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
          >
            🏗️ C#上級コース
          </a>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">🤖 AI機能について</h3>
        <p className="text-gray-600 mb-4">
          右下のAIアシスタントボタンから、学習をサポートするAI機能にアクセスできます：
        </p>
        <ul className="text-gray-700 space-y-1">
          <li>• 学習内容に関する質問応答</li>
          <li>• コードレビューと改善提案</li>
          <li>• 実践的なアドバイス</li>
          <li>• 24時間いつでも利用可能</li>
        </ul>
      </div>

      {/* 学習ダッシュボード */}
      <LearningDashboard />
    </div>
  );
}

// コース学習ページコンポーネント
function CoursePage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { 
    currentCourse, 
    currentLesson, 
    setCurrentCourse, 
    setCurrentLesson,
    updateProgress,
    initializeProgress 
  } = useLearningStore();

  // const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  
  // デバッグ用
  useEffect(() => {
    console.log('Menu state:', { isMenuHovered, isMenuExpanded });
  }, [isMenuHovered, isMenuExpanded]);

  // コース辞書
  const courses: Record<string, Course> = {
    'csharp-basics': csharpBasicsCourse,
    'csharp-intermediate': csharpIntermediateCourse,
    'csharp-advanced': csharpAdvancedCourse
  };

  // コースの初期化
  useEffect(() => {
    initializeProgress();
    
    // URLパラメータに基づいてコースを選択
    if (courseId && courseId in courses) {
      const selectedCourse = courses[courseId];
      setCurrentCourse(selectedCourse);
      
      // レッスンIDがある場合は特定のレッスンを選択
      if (lessonId) {
        for (const module of selectedCourse.modules) {
          const lesson = module.lessons.find((l: Lesson) => l.id === lessonId);
          if (lesson) {
            setCurrentLesson(lesson);
            break;
          }
        }
      } else {
        // 最初のレッスンを選択
        const firstLesson = selectedCourse.modules[0]?.lessons[0];
        if (firstLesson) {
          setCurrentLesson(firstLesson);
        }
      }
    } else if (!currentCourse) {
      // デフォルトで基礎コースを選択
      setCurrentCourse(csharpBasicsCourse);
      const firstLesson = csharpBasicsCourse.modules[0]?.lessons[0];
      if (firstLesson) {
        setCurrentLesson(firstLesson);
      }
    }
  }, [courseId, lessonId, setCurrentCourse, setCurrentLesson, initializeProgress]);

  const handleLessonSelect = (lesson: Lesson) => {
    console.log('🎯 Selected lesson:', lesson.id, lesson.title);
    console.log('🎯 Lesson content type:', typeof lesson.content);
    console.log('🎯 Lesson has codeExamples:', lesson.codeExamples ? lesson.codeExamples.length : 0);
    
    setCurrentLesson(lesson);
    // 進捗を更新（レッスンを開いた時点で進捗に追加）
    if (currentCourse) {
      updateProgress(currentCourse.id, lesson.id);
      // URLを更新
      navigate(`/courses/${currentCourse.id}/lessons/${lesson.id}`);
    }
    // モバイルの場合はメニューを閉じる
    setShowMobileMenu(false);
  };

  // レッスンナビゲーション関数
  const navigateToNextLesson = () => {
    if (!currentCourse || !currentLesson) return;
    
    // 現在のレッスンの次のレッスンを見つける
    for (const module of currentCourse.modules) {
      const currentIndex = module.lessons.findIndex(l => l.id === currentLesson.id);
      if (currentIndex !== -1) {
        if (currentIndex < module.lessons.length - 1) {
          // 同じモジュール内の次のレッスン
          handleLessonSelect(module.lessons[currentIndex + 1]);
          return;
        } else {
          // 次のモジュールの最初のレッスン
          const moduleIndex = currentCourse.modules.findIndex(m => m.id === module.id);
          if (moduleIndex < currentCourse.modules.length - 1) {
            const nextModule = currentCourse.modules[moduleIndex + 1];
            if (nextModule.lessons.length > 0) {
              handleLessonSelect(nextModule.lessons[0]);
              return;
            }
          }
        }
      }
    }
  };

  const navigateToPreviousLesson = () => {
    if (!currentCourse || !currentLesson) return;
    
    // 現在のレッスンの前のレッスンを見つける
    for (const module of currentCourse.modules) {
      const currentIndex = module.lessons.findIndex(l => l.id === currentLesson.id);
      if (currentIndex !== -1) {
        if (currentIndex > 0) {
          // 同じモジュール内の前のレッスン
          handleLessonSelect(module.lessons[currentIndex - 1]);
          return;
        } else {
          // 前のモジュールの最後のレッスン
          const moduleIndex = currentCourse.modules.findIndex(m => m.id === module.id);
          if (moduleIndex > 0) {
            const prevModule = currentCourse.modules[moduleIndex - 1];
            if (prevModule.lessons.length > 0) {
              handleLessonSelect(prevModule.lessons[prevModule.lessons.length - 1]);
              return;
            }
          }
        }
      }
    }
  };

  // 学習用ホットキーの設定
  const { showHelp, setShowHelp, hotkeyActions } = useLearningHotkeys({
    currentLesson,
    onNextLesson: navigateToNextLesson,
    onPreviousLesson: navigateToPreviousLesson,
    onOpenAIMentor: () => {}, // TODO: AI mentor functionality
    onToggleHelp: () => setShowHelp(!showHelp)
  });

  if (!currentCourse) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">コースを読み込んでいます...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 relative overflow-hidden">
      {/* モバイルメニュートグルボタン */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* サイドバー（ナビゲーション） - デスクトップはホバー制御、モバイルはオーバーレイ */}
      <div 
        className={`
          ${showMobileMenu ? 'translate-x-0 w-80' : '-translate-x-full'} 
          lg:translate-x-0 
          fixed lg:absolute 
          inset-y-0 left-0 
          bg-white 
          z-40 
          transition-all duration-300 ease-in-out
          border-r border-gray-200
          ${(isMenuExpanded || isMenuHovered) ? 'lg:w-80' : 'lg:w-12'}
        `}
        onMouseEnter={() => {
          console.log('Mouse enter sidebar');
          setIsMenuHovered(true);
        }}
        onMouseLeave={() => {
          console.log('Mouse leave sidebar');
          setIsMenuHovered(false);
        }}
      >
        {/* メニュー展開/折りたたみボタン（デスクトップのみ） */}
        <div className="hidden lg:block absolute top-2 right-1 z-50">
          <button
            onClick={() => setIsMenuExpanded(!isMenuExpanded)}
            className={`
              p-1.5 rounded-lg transition-all duration-200
              ${isMenuExpanded || isMenuHovered 
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
            `}
            title={isMenuExpanded ? 'メニューを折りたたむ' : 'メニューを展開'}
          >
            <ChevronLeft 
              className={`w-4 h-4 transition-transform duration-200 ${
                isMenuExpanded || isMenuHovered ? '' : 'rotate-180'
              }`} 
            />
          </button>
        </div>

        <CourseNavigation 
          course={currentCourse} 
          onLessonSelect={handleLessonSelect}
          isCollapsed={!(isMenuExpanded || isMenuHovered)}
        />
      </div>

      {/* モバイル用オーバーレイ */}
      {showMobileMenu && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowMobileMenu(false)}
        />
      )}
      
      {/* メインコンテンツエリア */}
      <div className={`
        flex-1 overflow-auto min-w-0 transition-all duration-300
        ${(isMenuExpanded || isMenuHovered) ? 'lg:ml-80' : 'lg:ml-12'}
      `}>
        {/* モバイル用ヘッダー */}
        <div className="lg:hidden sticky top-0 bg-white border-b border-gray-200 p-4 pl-16">
          <h1 className="text-lg font-semibold text-gray-800">
            {currentLesson?.title || 'レッスンを選択してください'}
          </h1>
        </div>
        
        <LessonViewer lesson={currentLesson} />
      </div>

      {/* ヘルプモーダル */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        hotkeyActions={hotkeyActions}
        currentLessonTitle={currentLesson?.title}
      />
    </div>
  );
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<Navigate to="/courses/csharp-basics" replace />} />
        <Route path="/courses/:courseId" element={<CoursePage />} />
        <Route path="/courses/:courseId/lessons/:lessonId" element={<CoursePage />} />
        {/* 404ページ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* AI Assistant - 全ページで利用可能 */}
      <AIAssistant />
    </>
  );
}

export default App