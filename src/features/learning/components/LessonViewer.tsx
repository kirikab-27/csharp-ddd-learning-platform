import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Book, Clock, Target, Bot, ArrowRight, CheckCircle } from 'lucide-react';
import { ExerciseRunner } from './ExerciseRunner';
import { AITestButton } from './AITestButton';
import { SplitViewLayout } from './SplitViewLayout';
import { AIAssistant } from '../../../components/ai/AIAssistant';
import { useLearningHotkeys } from '../hooks/useLearningHotkeys';
import { useLearningStore } from '../../../stores/learningStore';
import type { Lesson, CodeExample } from '../types';

interface LessonViewerProps {
  lesson: Lesson | null;
  isLoading?: boolean;
}

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
  inline?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ className, children, inline, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  
  if (inline) {
    return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>;
  }
  
  return (
    <SyntaxHighlighter
      style={vscDarkPlus}
      language={language}
      PreTag="div"
      className="rounded-lg"
      {...props}
    >
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  );
};

const CodeExampleCard: React.FC<{ example: CodeExample }> = ({ example }) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      {example.title && (
        <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
          <Target className="w-5 h-5 mr-2 text-blue-600" />
          {example.title}
        </h4>
      )}
      
      {example.description && (
        <p className="text-gray-600 mb-4 text-sm">{example.description}</p>
      )}
      
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
          <span className="text-gray-300 text-sm font-mono">
            {example.language.toUpperCase()}
          </span>
        </div>
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={example.language}
          PreTag="div"
          className="!bg-transparent !m-0"
          customStyle={{
            padding: '1rem',
            margin: 0,
            background: 'transparent'
          }}
        >
          {example.code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export const LessonViewer: React.FC<LessonViewerProps> = ({ lesson, isLoading = false }) => {
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [contentLoading, setContentLoading] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  
  const { currentCourse, updateProgress } = useLearningStore();

  const toggleAIPanel = () => {
    setIsAIPanelOpen(!isAIPanelOpen);
  };

  // ホットキー設定
  const { showHelp, hotkeyActions } = useLearningHotkeys({
    currentLesson: lesson,
    onToggleAIPanel: toggleAIPanel,
    onToggleHelp: () => console.log('ヘルプを表示'), // 一時的な実装
  });

  useEffect(() => {
    if (!lesson) {
      setMarkdownContent('');
      return;
    }
    
    // レッスンオブジェクトから直接コンテンツを読み込む
    setContentLoading(true);
    
    try {
      console.log('🔍 Loading lesson:', lesson.id);
      console.log('🔍 Lesson content type:', typeof lesson.content);
      
      // lesson.contentが文字列であることを確認
      const content = typeof lesson.content === 'string' 
        ? lesson.content 
        : `# ${lesson.title}\n\nこのレッスンのコンテンツを準備中です...`;
        
      setMarkdownContent(content || `# ${lesson.title}\n\nコンテンツが見つかりません。`);
    } catch (error) {
      console.error('Failed to load lesson content:', error);
      setMarkdownContent(`# ${lesson.title}\n\nコンテンツの読み込みに失敗しました。`);
    } finally {
      setContentLoading(false);
    }
  }, [lesson]);

  if (isLoading || contentLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">レッスンを読み込んでいます...</span>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-12 px-4">
        <Book className="w-12 h-12 lg:w-16 lg:h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-base lg:text-lg font-medium text-gray-600 mb-2">レッスンを選択してください</h3>
        <p className="text-sm lg:text-base text-gray-500">
          <span className="lg:hidden">左上のメニューボタン</span>
          <span className="hidden lg:inline">左側のナビゲーション</span>
          からレッスンを選んで学習を始めましょう。
        </p>
      </div>
    );
  }

  // レッスンコンテンツ
  const lessonContent = (
    <div className="h-full">
      <div className="px-4 lg:px-8 py-4 lg:py-6 lg:ml-8">
        {/* レッスンヘッダー */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 mb-4 lg:mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-xl lg:text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
              <div className="flex flex-wrap items-center text-sm text-gray-600 gap-2 lg:gap-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  推定時間: 15分
                </div>
                <div className="flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  難易度: 初級
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* デバッグ用キャッシュクリアボタン */}
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                🗑️ キャッシュクリア
              </button>
              
              {/* AIアシスタント開閉ボタン */}
              <button
                onClick={toggleAIPanel}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Bot className="w-4 h-4" />
                <span>AIアシスタント</span>
              </button>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 mb-4 lg:mb-6 shadow-sm">
          <div className="prose prose-sm lg:prose-lg max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: CodeBlock as any,
              }}
            >
              {typeof markdownContent === 'string' ? markdownContent : '# エラー\n\nコンテンツの形式が不正です'}
            </ReactMarkdown>
          </div>
        </div>

        {/* AIテスト機能 */}
        <AITestButton />

        {/* コード例 */}
        {lesson.codeExamples && lesson.codeExamples.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Book className="w-6 h-6 mr-2 text-blue-600" />
              コード例
            </h3>
            {lesson.codeExamples.map((example) => (
              <CodeExampleCard key={example.id} example={example} />
            ))}
          </div>
        )}

        {/* 演習問題 */}
        {(() => {
          console.log('🔍 Lesson exercises check:', lesson.exercises);
          console.log('🔍 Exercises length:', lesson.exercises?.length);
          console.log('🔍 Exercises array:', lesson.exercises);
          return null;
        })()}
        {lesson.exercises && lesson.exercises.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <Target className="w-7 h-7 mr-3 text-blue-600" />
              演習問題 ({lesson.exercises.length}個)
            </h3>
            {lesson.exercises.map((exercise, index) => (
              <div key={exercise.id} className="mb-8">
                <div className="mb-4">
                  <h4 className="text-lg font-medium text-gray-700 mb-2">
                    演習 {index + 1}
                  </h4>
                </div>
                <ExerciseRunner 
                  exercise={exercise}
                  onComplete={(score) => {
                    console.log(`演習 ${exercise.id} 完了! スコア: ${score}`);
                    
                    // 演習を完了済みとしてマーク
                    setCompletedExercises(prev => new Set([...prev, exercise.id]));
                    
                    // 進捗をストアに保存
                    if (currentCourse && lesson) {
                      updateProgress(currentCourse.id, lesson.id);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* レッスン完了メッセージ */}
        {lesson.exercises && lesson.exercises.length > 0 && 
         completedExercises.size === lesson.exercises.length && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-green-800">
                レッスン完了！おめでとうございます！
              </h3>
            </div>
            <p className="text-green-700 mb-4">
              すべての演習を完了しました。よく頑張りました！
            </p>
            {lesson.nextLesson && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    // TODO: 次のレッスンに移動する処理
                    console.log('次のレッスンに移動:', lesson.nextLesson);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <span>次のレッスンへ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-sm text-green-600">
                  次: {lesson.nextLesson}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // AIアシスタントコンテンツ
  const aiContent = (
    <div className="h-full">
      <AIAssistant 
        context={{
          mode: 'learning',
          currentLesson: lesson,
          embedded: true // 埋め込みモード
        }}
      />
    </div>
  );

  return (
    <>
      <SplitViewLayout
        leftContent={lessonContent}
        rightContent={aiContent}
        isRightPanelOpen={isAIPanelOpen}
        onToggleRightPanel={toggleAIPanel}
        defaultSplitRatio={60}
      />
      
      {/* ホットキーヘルプモーダル */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">キーボードショートカット</h3>
            <div className="space-y-2">
              {hotkeyActions.map((action, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{action.description}</span>
                  <kbd className="px-2 py-1 text-xs bg-gray-200 rounded">
                    {action.key.replace('ctrl', 'Ctrl').replace('shift', 'Shift')}
                  </kbd>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <button 
                onClick={() => console.log('ヘルプを閉じる')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};