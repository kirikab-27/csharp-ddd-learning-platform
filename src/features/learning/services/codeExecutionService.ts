import type { CodeExecutionResult } from '../types';

export interface ExecutionOptions {
  timeout?: number;
  language: 'csharp' | 'javascript' | 'typescript';
  includeCompileCheck?: boolean;
}

/**
 * AI を使用してコードの実行結果をシミュレートする
 */
export const simulateCodeExecution = async (
  code: string, 
  options: ExecutionOptions
): Promise<CodeExecutionResult> => {
  const startTime = Date.now();
  
  try {
    // C#専用プロンプトの構築
    // const prompt = buildExecutionPrompt(code, options.language);
    
    // C#専用システムプロンプト
    // const systemPrompt = `
    // あなたはC#コード実行エキスパートです。
    // C#のみに関する分析を行い、他の言語の例は一切含めないでください。
    // .NET Framework/Coreの動作に基づいて正確に予測してください。
    // `;
    
    // 専用のコード実行エンドポイントを使用
    const response = await fetch('http://localhost:3001/api/ai/execute-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        language: 'csharp',
        options: {
          includeCompileCheck: options.includeCompileCheck,
          timeout: options.timeout || 10000
        }
      }),
      signal: AbortSignal.timeout(options.timeout || 10000)
    });

    if (!response.ok) {
      throw new Error(`コード実行エラー: ${response.status}`);
    }

    const result = await response.json();
    const executionTime = Date.now() - startTime;

    // レスポンスを正しい形式に変換
    return {
      output: result.output || '',
      error: result.error || '',
      executionTime: result.executionTime || executionTime,
      isSuccess: result.isSuccess || false,
      memoryUsage: result.memoryUsage || 1024
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        output: '',
        error: 'タイムアウト: 実行時間が長すぎます',
        executionTime,
        isSuccess: false,
        memoryUsage: 0
      };
    }

    // フォールバック: 基本的な静的解析
    return await fallbackExecution(code, options.language, executionTime);
  }
};

// C# prompt building logic removed - now handled by server API

// Note: Legacy functions removed to clean up unused code

/**
 * フォールバック実行（AI が利用できない場合）
 */
async function fallbackExecution(
  code: string, 
  language: string, 
  executionTime: number
): Promise<CodeExecutionResult> {
  // 基本的な静的解析
  const analysis = analyzeCodeStatically(code, language);
  
  return {
    output: analysis.expectedOutput,
    error: analysis.error,
    executionTime,
    isSuccess: !analysis.error,
    memoryUsage: 64 // デフォルト値
  };
}

/**
 * 静的コード解析（フォールバック用）
 */
function analyzeCodeStatically(code: string, language: string) {
  let expectedOutput = '';
  let error = '';

  try {
    if (language === 'csharp') {
      // C#の詳細な解析
      const consoleWriteLines = code.match(/Console\.WriteLine\s*\(\s*([^)]+)\s*\)/g);
      
      if (consoleWriteLines) {
        const outputs = consoleWriteLines.map(line => {
          // 文字列リテラルの抽出
          const stringMatch = line.match(/["']([^"']+)["']/);
          if (stringMatch) {
            return stringMatch[1];
          }
          
          // 変数や式の場合は推測
          const contentMatch = line.match(/Console\.WriteLine\s*\(\s*([^)]+)\s*\)/);
          if (contentMatch) {
            const content = contentMatch[1].trim();
            if (content === '"Hello, World!"' || content === "'Hello, World!'") {
              return 'Hello, World!';
            }
            return `[${content}の値]`;
          }
          
          return '（出力内容）';
        });
        
        expectedOutput = outputs.join('\n');
      }

      // 基本的な構文エラーチェック
      if (!code.includes('using System') && code.includes('Console.WriteLine')) {
        error = 'using System; が必要です';
      } else if (!code.includes('static void Main') && code.includes('Console.WriteLine')) {
        error = 'Mainメソッドが見つかりません';
      }

    } else if (language === 'javascript' || language === 'typescript') {
      // JavaScript/TypeScript の基本的な解析
      const consoleLogs = code.match(/console\.log\s*\(\s*([^)]+)\s*\)/g);
      
      if (consoleLogs) {
        const outputs = consoleLogs.map(line => {
          const stringMatch = line.match(/["'`]([^"'`]+)["'`]/);
          if (stringMatch) {
            return stringMatch[1];
          }
          return '（出力内容）';
        });
        
        expectedOutput = outputs.join('\n');
      }
    }

    if (!expectedOutput && !error) {
      expectedOutput = '（出力なし）';
    }

  } catch (e) {
    error = 'コード解析中にエラーが発生しました';
  }

  return { expectedOutput, error };
}

/**
 * コードの実行可能性をチェック
 */
export const validateCode = (code: string, language: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!code.trim()) {
    errors.push('コードが空です');
    return { isValid: false, errors };
  }

  if (language === 'csharp') {
    // C# の基本的なバリデーション
    if (code.includes('Console.WriteLine') && !code.includes('using System')) {
      errors.push('using System; が必要です');
    }
    
    if (code.includes('Console.WriteLine') && !code.includes('static void Main')) {
      errors.push('static void Main メソッドが必要です');
    }

    // 基本的な構文チェック
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push('括弧 { } の数が一致しません');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};