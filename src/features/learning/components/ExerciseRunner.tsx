import { useState, useEffect } from 'react';
import { CodeEditor } from './CodeEditor';
import { ExecutionResult } from './ExecutionResult';
import { simulateCodeExecution, validateCode } from '../services/codeExecutionService';
import { Target, Lightbulb, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import type { Exercise, CodeExecutionResult } from '../types';

interface ExerciseRunnerProps {
  exercise: Exercise;
  onComplete?: (score: number) => void;
}

export const ExerciseRunner: React.FC<ExerciseRunnerProps> = ({
  exercise,
  onComplete
}) => {
  const [userCode, setUserCode] = useState(exercise.starterCode);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [usedHints, setUsedHints] = useState<number[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // 演習の完了状態をチェック
  useEffect(() => {
    if (executionResult?.isSuccess) {
      // 成功した場合の簡易チェック
      const score = calculateScore();
      if (score > 70) { // 70%以上で合格
        setIsCompleted(true);
        onComplete?.(score);
      }
    }
  }, [executionResult]);

  // コード実行
  const handleRunCode = async (code: string) => {
    setIsExecuting(true);
    
    try {
      // 事前バリデーション
      const validation = validateCode(code, 'csharp');
      if (!validation.isValid) {
        setExecutionResult({
          output: '',
          error: validation.errors.join('\n'),
          executionTime: 0,
          isSuccess: false,
          memoryUsage: 0
        });
        return;
      }

      // AI による実行シミュレーション
      const result = await simulateCodeExecution(code, {
        language: 'csharp',
        includeCompileCheck: true,
        timeout: 15000
      });
      
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({
        output: '',
        error: `実行エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
        executionTime: 0,
        isSuccess: false,
        memoryUsage: 0
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // ヒントを表示
  const showHint = (hintIndex: number) => {
    if (!usedHints.includes(hintIndex)) {
      setUsedHints([...usedHints, hintIndex]);
    }
  };

  // スコア計算
  const calculateScore = (): number => {
    let score = 100;
    
    // ヒント使用によるペナルティ
    score -= usedHints.length * 10;
    
    // 解答表示によるペナルティ
    if (showSolution) {
      score -= 50;
    }
    
    // 最小スコアは0
    return Math.max(0, score);
  };

  // コードリセット
  const handleReset = () => {
    setUserCode(exercise.starterCode);
    setExecutionResult(null);
    setUsedHints([]);
    setShowSolution(false);
    setIsCompleted(false);
  };

  const difficultyColor = {
    easy: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    intermediate: 'text-blue-600 bg-blue-100',
    advanced: 'text-purple-600 bg-purple-100',
    hard: 'text-red-600 bg-red-100'
  };

  const difficultyLabel = {
    easy: '初級',
    medium: '中級',
    intermediate: '中級',
    advanced: '上級',
    hard: '上級'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* 演習ヘッダー */}
      <div className="bg-blue-50 border-b border-blue-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-800">{exercise.title}</h3>
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                difficultyColor[exercise.difficulty]
              }`}>
                {difficultyLabel[exercise.difficulty]}
              </span>
            </div>
          </div>
          
          {isCompleted && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">完了!</span>
              <span className="text-sm">スコア: {calculateScore()}点</span>
            </div>
          )}
        </div>

        <p className="text-gray-700 mb-4">{exercise.description}</p>

        {/* アクションボタン */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowHints(!showHints)}
            className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            <span>ヒント ({exercise.hints?.length || 0}個)</span>
          </button>

          {exercise.solution && (
            <button
              onClick={() => setShowSolution(!showSolution)}
              className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              {showSolution ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showSolution ? '解答を隠す' : '解答を見る'}</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            リセット
          </button>
        </div>
      </div>

      {/* ヒント表示 */}
      {showHints && exercise.hints && exercise.hints.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-3 flex items-center">
            <Lightbulb className="w-4 h-4 mr-2" />
            ヒント
          </h4>
          <div className="space-y-2">
            {exercise.hints.map((hint, index) => (
              <div key={index} className="flex items-start space-x-3">
                {usedHints.includes(index) ? (
                  <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 flex-1">
                    <p className="text-sm text-yellow-800">{hint}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => showHint(index)}
                    className="bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-3 py-2 rounded-md text-sm transition-colors"
                  >
                    ヒント {index + 1} を表示 (-10点)
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 解答表示 */}
      {showSolution && exercise.solution && (
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            模範解答 (-50点)
          </h4>
          <CodeEditor
            initialCode={exercise.solution}
            language="csharp"
            height="200px"
            readOnly={true}
            title="模範解答"
            showRunButton={false}
          />
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* コードエディタ */}
          <div>
            <h4 className="text-lg font-medium text-gray-800 mb-4">あなたのコード</h4>
            <CodeEditor
              initialCode={userCode}
              language="csharp"
              height="300px"
              onChange={setUserCode}
              onRun={handleRunCode}
              title="演習エディタ"
            />
          </div>

          {/* 実行結果 */}
          <div>
            <h4 className="text-lg font-medium text-gray-800 mb-4">実行結果</h4>
            <ExecutionResult
              result={executionResult}
              isLoading={isExecuting}
              onRetry={() => handleRunCode(userCode)}
            />
          </div>
        </div>

        {/* 成功時のメッセージ */}
        {isCompleted && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h4 className="text-lg font-semibold text-green-800">
                  おめでとうございます！演習を完了しました 🎉
                </h4>
                <p className="text-green-700">
                  スコア: {calculateScore()}点 
                  {usedHints.length > 0 && ` (ヒント使用: ${usedHints.length}個)`}
                  {showSolution && ` (解答参照)`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};