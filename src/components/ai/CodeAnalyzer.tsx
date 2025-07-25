import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, AlertTriangle, Lightbulb, CheckCircle, Loader } from 'lucide-react';
import { useAIService } from '../../hooks/ai/useAIService';
import type { AIAnalysisResult } from '../../types/ai';

interface CodeAnalyzerProps {
  isOnline: boolean;
  context?: {
    mode?: 'learning' | 'general';
    currentLesson?: any;
  };
}

export function CodeAnalyzer({ isOnline: _isOnline, context: _context }: CodeAnalyzerProps) {
  // _isOnline, _context は将来の機能拡張用
  const [code, setCode] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const { analyzeCode, isLoading, error } = useAIService();

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    
    const analysisResult = await analyzeCode(code, context);
    if (analysisResult) {
      setResult(analysisResult);
    }
  };

  const getQualityColor = (quality: 'high' | 'medium' | 'low') => {
    switch (quality) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
    }
  };

  const getQualityIcon = (quality: 'high' | 'medium' | 'low') => {
    switch (quality) {
      case 'high': return <CheckCircle size={16} className="text-green-600" />;
      case 'medium': return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'low': return <AlertTriangle size={16} className="text-red-600" />;
    }
  };

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* コード入力エリア */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            分析対象のコード
          </label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="TypeScript/JavaScriptコードを入力してください..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
            data-analyzer-input
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            コンテキスト（オプション）
          </label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="例: React component, API handler..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!code.trim() || isLoading}
          className={`
            w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium text-sm
            transition-colors
            ${!code.trim() || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {isLoading ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <Play size={16} />
          )}
          {isLoading ? '分析中...' : 'コードを分析'}
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-red-800 text-sm">{error}</p>
        </motion.div>
      )}

      {/* 分析結果 */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 space-y-4 overflow-y-auto"
        >
          {/* 品質スコア */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {getQualityIcon(result.codeQuality)}
              <span className="font-medium">コード品質</span>
            </div>
            <span className={`font-bold ${getQualityColor(result.codeQuality)}`}>
              {result.codeQuality.toUpperCase()}
            </span>
          </div>

          {/* 潜在的な問題 */}
          {result.potentialIssues.length > 0 && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium text-gray-900">
                <AlertTriangle size={16} className="text-red-500" />
                潜在的な問題 ({result.potentialIssues.length})
              </h4>
              <div className="space-y-2">
                {result.potentialIssues.map((issue, index) => (
                  <div key={index} className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                    <p className="text-red-800 text-sm">{issue}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 改善提案 */}
          {result.suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium text-gray-900">
                <Lightbulb size={16} className="text-yellow-500" />
                改善提案 ({result.suggestions.length})
              </h4>
              <div className="space-y-2">
                {result.suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                    <p className="text-yellow-800 text-sm">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 説明 */}
          {result.explanation && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">分析詳細</h4>
              <p className="text-gray-700 text-sm bg-blue-50 p-3 rounded-lg">
                {result.explanation}
              </p>
            </div>
          )}

          {/* メタ情報 */}
          <div className="text-xs text-gray-500 pt-2 border-t">
            <div className="flex justify-between">
              <span>ソース: {result.source === 'claude' ? 'Claude Code' : 'ローカル分析'}</span>
              <span>信頼度: {result.confidence}</span>
            </div>
            <div className="mt-1">
              分析時刻: {new Date(result.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </motion.div>
      )}

      {/* 初期状態メッセージ */}
      {!result && !error && !isLoading && (
        <div className="flex-1 flex items-center justify-center text-center">
          <div className="text-gray-500">
            <div className="mb-2">📝</div>
            <p className="text-sm">
              分析したいコードを入力して<br />
              「コードを分析」ボタンを押してください
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 