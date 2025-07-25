import { useState, useEffect } from 'react';
import { AIAssistant } from '../../components/ai/AIAssistant';
import { useLearningStore } from '../../stores/learningStore';
import { getBeginnerCSharpQuestions } from '../learning/constants/csharpPresetQuestions';
import type { LearningContext } from '../learning/types';

interface LearningAIAssistantProps {
  // 既存のAIAssistantと同じProps
}

/**
 * 学習コンテキストを自動的に含めるAIアシスタント
 */
export const LearningAIAssistant: React.FC<LearningAIAssistantProps> = (props) => {
  const { currentCourse, currentLesson, getLearningContext } = useLearningStore();
  const [enhancedContext, setEnhancedContext] = useState<string>('');

  // C#専用システムプロンプトを生成
  const generateCSharpSystemPrompt = () => {
    const lessonTitle = currentLesson?.title || '現在のレッスン';
    const courseTitle = currentCourse?.title || 'C# DDD学習プラットフォーム';
    
    return `
あなたはC#プログラミング専門の学習アシスタントです。
以下のルールを厳守してください：

【必須制約】
1. **C#のみで回答する**
   - すべてのコード例はC#で提供
   - 他の言語（JavaScript、TypeScript、Python、Java等）の例は一切含めない
   - C#の文法とベストプラクティスに従う
   - .NET 6/7/8の最新機能を活用

2. **現在の学習コンテキスト**
   - コース: ${courseTitle}
   - レッスン: ${lessonTitle}
   - 対象言語: C# (.NET)
   - 学習目標: ドメイン駆動設計(DDD)への理解

3. **回答スタイル**
   - C#初学者にも分かりやすく説明
   - 実践的なC#コード例を必ず含める
   - DDDの概念に関連付けて説明
   - コード例にはコメントを日本語で追加

4. **絶対禁止事項**
   - 他のプログラミング言語の例を出さない
   - "他の言語では..." といった比較をしない
   - C#以外の構文を混ぜない
   - JavaScriptやPythonのコードを含めない

5. **推奨事項**
   - C#の型安全性を強調
   - SOLID原則との関連を説明
   - 将来のDDD実装への道筋を示す
   - using文、nullable、recordなど現代的なC#機能を活用

質問に対してC#の観点からのみ回答してください。
    `;
  };

  // API基本URLを動的に決定
  const getApiBaseUrl = () => {
    // 開発環境での動的URL生成
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // WSL環境やモバイルアクセスを考慮
      if (hostname === '0.0.0.0' || hostname.includes('192.168.') || hostname.includes('10.0.')) {
        return `http://${hostname}:3001`;
      }
    }
    return 'http://localhost:3001';
  };

  // AI に質問を送信する関数
  const sendQuestionToAI = async (question: string) => {
    try {
      const systemPrompt = generateCSharpSystemPrompt();
      const apiUrl = `${getApiBaseUrl()}/api/ai/chat`;
      
      console.log('Sending request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: question,
          systemPrompt: systemPrompt,
          context: {
            mode: 'learning-assistance',
            language: 'csharp',
            courseType: 'C# to DDD Learning Platform',
            currentLesson: currentLesson?.title,
            strict: true // C#制約を厳格に適用
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('AI Response:', result.response);
        // 既存のAIアシスタントのチャットインターフェースを使用
        // TODO: 実際のAIアシスタントUIに結果を表示する適切な方法を実装
        console.log('C#アシスタント回答:', result.response);
      } else {
        console.error('Server response error:', response.status, response.statusText);
        throw new Error(`サーバーエラー: ${response.status}`);
      }
    } catch (error) {
      console.error('AI質問送信エラー:', error);
      console.error('C#アシスタントに接続できません。サーバーが起動しているか確認してください。');
    }
  };

  // 学習コンテキストを構築
  useEffect(() => {
    const buildLearningContext = () => {
      if (!currentCourse || !currentLesson) {
        setEnhancedContext('');
        return;
      }

      const context = getLearningContext();
      
      const contextString = `
## 現在の学習状況
- **コース**: ${currentCourse.title} (${currentCourse.level})
- **現在のレッスン**: ${currentLesson.title}
- **学習内容**: ${currentLesson.content ? currentLesson.content.substring(0, 200) + '...' : 'なし'}

## 学習目標
- C#プログラミングの基礎を習得
- 実際にコードを書いて動かすことができる
- プログラミングの基本概念を理解する

## 教育方針
- **初心者に優しい説明**: 専門用語は分かりやすく説明
- **実践重視**: 具体的なコード例を提供
- **段階的学習**: 少しずつステップアップ
- **励ましとサポート**: 学習者を励まし、モチベーションを維持

## 回答スタイル
- 簡潔で分かりやすい説明
- 具体的なコード例を含める
- エラーの場合は原因と解決方法を明示
- 次のステップも提案する

現在のユーザーコード: ${context.userCode || 'なし'}
実行結果: ${context.executionResult ? (context.executionResult.isSuccess ? context.executionResult.output : context.executionResult.error) : 'なし'}
      `.trim();

      setEnhancedContext(contextString);
    };

    buildLearningContext();
  }, [currentCourse, currentLesson, getLearningContext]);

  // Future enhancement: Add learning-specific prompt enhancement and quick questions

  return (
    <div className="relative">
      {/* 既存のAIAssistantコンポーネントを拡張 */}
      <AIAssistant {...props} />
      
      {/* 学習コンテキストが有効な場合の追加UI */}
      {enhancedContext && (
        <div className="fixed bottom-24 right-6 z-40">
          {/* 学習用クイックアクションボタン */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 mb-2">
            <h4 className="text-xs font-medium text-gray-700 mb-2">💡 学習サポート</h4>
            <div className="space-y-1">
              {/* C#基礎質問を表示 */}
              {getBeginnerCSharpQuestions().slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // C#専用AIアシスタントに質問を送信
                    sendQuestionToAI(question.prompt);
                  }}
                  className="w-full text-left px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title={question.prompt}
                >
                  {question.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 学習コンテキストを既存のAIサービスに注入するヘルパー関数
 */
export const injectCSharpLearningContext = (originalMessage: string, context?: LearningContext): string => {
  if (!context || (!context.currentCourse && !context.currentLesson)) {
    return originalMessage;
  }

  const contextInfo = [];
  
  if (context.currentCourse) {
    contextInfo.push(`C#学習コース: ${context.currentCourse.title}`);
  }
  
  if (context.currentLesson) {
    contextInfo.push(`現在のC#レッスン: ${context.currentLesson.title}`);
  }
  
  if (context.userCode) {
    contextInfo.push(`ユーザーのC#コード:\n\`\`\`csharp\n${context.userCode}\n\`\`\``);
  }
  
  if (context.executionResult) {
    if (context.executionResult.isSuccess) {
      contextInfo.push(`C#実行結果: ${context.executionResult.output}`);
    } else {
      contextInfo.push(`C#エラー: ${context.executionResult.error}`);
    }
  }

  if (contextInfo.length === 0) {
    return originalMessage;
  }

  return `【C#学習コンテキスト】
${contextInfo.join('\n')}

【C#に関する質問】
${originalMessage}

上記のコンテキストを踏まえて、C#のみで回答し、他のプログラミング言語の例は一切含めないでください。`;
};

// 旧関数名を保持（下位互換性のため）
export const injectLearningContext = injectCSharpLearningContext;

export default LearningAIAssistant;