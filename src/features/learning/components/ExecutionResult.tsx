import { useState } from 'react';
import { CheckCircle, Clock, Copy, RefreshCw } from 'lucide-react';
import type { CodeExecutionResult } from '../types';

interface ExecutionResultProps {
  result: CodeExecutionResult | null;
  isLoading?: boolean;
  onRetry?: () => void;
}

export const ExecutionResult: React.FC<ExecutionResultProps> = ({
  result,
  isLoading = false,
  onRetry
}) => {
  const [isCopied, setIsCopied] = useState(false);

  // 出力をクリップボードにコピー
  const handleCopyOutput = async () => {
    if (!result) return;
    
    const textToCopy = result.isSuccess ? result.output : result.error || '';
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };

  // ローディング状態
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">コードを実行しています...</span>
        </div>
      </div>
    );
  }

  // 結果がない場合
  if (!result) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-gray-500 mb-2">
          <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>実行ボタンを押してコードを実行してください</p>
        </div>
      </div>
    );
  }

  // const statusIcon = result.isSuccess ? (
  //   <CheckCircle className="w-5 h-5 text-green-600" />
  // ) : (
  //   <XCircle className="w-5 h-5 text-red-600" />
  // );

  // エラーの種類に応じた色分け
  const getStatusColors = () => {
    if (result.isSuccess) {
      return {
        border: 'border-green-200 bg-green-50',
        text: 'text-green-800',
        icon: '✅'
      };
    }
    
    if (result.error && result.error.includes('構文エラー')) {
      return {
        border: 'border-orange-200 bg-orange-50',
        text: 'text-orange-800',
        icon: '⚠️'
      };
    }
    
    return {
      border: 'border-red-200 bg-red-50',
      text: 'text-red-800',
      icon: '❌'
    };
  };

  const statusColors = getStatusColors();

  return (
    <div className={`border rounded-lg ${statusColors.border}`}>
      {/* ヘッダー */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{statusColors.icon}</span>
            <span className={`font-medium ${statusColors.text}`}>
              {result.isSuccess ? '実行成功' : 
               result.error?.includes('構文エラー') ? '構文エラー' : '実行エラー'}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {/* 実行時間 */}
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{result.executionTime}ms</span>
            </div>

            {/* メモリ使用量 */}
            {result.memoryUsage && (
              <div className="flex items-center space-x-1">
                <span className="text-xs">💾</span>
                <span>{result.memoryUsage}MB</span>
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex items-center space-x-1">
              {/* コピーボタン */}
              <button
                onClick={handleCopyOutput}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                title="出力をコピー"
              >
                <Copy className="w-4 h-4" />
              </button>

              {/* 再実行ボタン */}
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  title="再実行"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 出力内容 */}
      <div className="p-4">
        {result.isSuccess ? (
          // 成功時の出力
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">出力:</h4>
            {result.output ? (
              <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                {result.output}
              </pre>
            ) : (
              <div className="bg-gray-100 p-3 rounded text-sm text-gray-600 italic">
                （出力なし）
              </div>
            )}
          </div>
        ) : (
          // エラー時の表示
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">エラー:</h4>
            <pre className="bg-red-900 text-red-100 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
              {result.error}
            </pre>
            
            {/* エラーの場合のヒント */}
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <h5 className="text-sm font-medium text-blue-800 mb-1">💡 ヒント:</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                {getErrorHints(result.error || '').map((hint, index) => (
                  <li key={index}>• {hint}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* コピー成功通知 */}
        {isCopied && (
          <div className="mt-2 text-sm text-green-600 flex items-center space-x-1">
            <CheckCircle className="w-4 h-4" />
            <span>クリップボードにコピーしました</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * エラーに応じたヒントを生成
 */
function getErrorHints(error: string): string[] {
  const hints: string[] = [];

  // 構文エラー関連
  if (error.includes('文字列が閉じられていません') || error.includes('ダブルクォート')) {
    hints.push('文字列は必ず "文字列" のように両側をダブルクォートで囲む必要があります');
    hints.push('例: Console.WriteLine("Hello, World!");');
  }

  if (error.includes('セミコロン') || error.includes(';')) {
    hints.push('C#では文の終わりには必ずセミコロン ; が必要です');
    hints.push('例: Console.WriteLine("test"); ← セミコロンを忘れずに');
  }

  if (error.includes('丸括弧') || error.includes('()')) {
    hints.push('開き括弧 ( と閉じ括弧 ) の数を確認してください');
    hints.push('例: Console.WriteLine("test"); ← 括弧がきちんと閉じているか確認');
  }

  if (error.includes('中括弧') || error.includes('{}')) {
    hints.push('開き括弧 { と閉じ括弧 } の数を確認してください');
    hints.push('メソッドやクラスの { } が正しく対応しているか確認してください');
  }

  // 必須要素関連
  if (error.includes('using System')) {
    hints.push('コードの先頭に "using System;" を追加してください');
    hints.push('Console.WriteLineを使うにはusing Systemが必要です');
  }

  if (error.includes('namespace')) {
    hints.push('namespaceの宣言が必要です');
    hints.push('例: namespace HelloWorld { ... }');
  }

  if (error.includes('class')) {
    hints.push('classの宣言が必要です');
    hints.push('例: class Program { ... }');
  }

  if (error.includes('static void Main')) {
    hints.push('C#プログラムには static void Main メソッドが必要です');
    hints.push('例: static void Main(string[] args) { ... }');
  }

  if (error.includes('Console.WriteLine')) {
    hints.push('Console.WriteLine の書き方を確認してください');
    hints.push('正しい例: Console.WriteLine("Hello!");');
  }

  if (error.includes('タイムアウト')) {
    hints.push('無限ループが発生している可能性があります');
    hints.push('コードを簡単にして再実行してみてください');
  }

  // 一般的なヒントを追加（構文エラーでない場合）
  if (hints.length === 0) {
    hints.push('コードの文法を確認してください');
    hints.push('AIアシスタントに質問してみてください');
  }

  return hints;
}

// Play アイコンコンポーネント（lucide-reactから独立）
const Play: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);