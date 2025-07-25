import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Copy, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';

interface CodeEditorProps {
  initialCode: string;
  language: 'csharp' | 'javascript' | 'typescript';
  height?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onRun?: (code: string) => void;
  showRunButton?: boolean;
  title?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode,
  language,
  height = '400px',
  readOnly = false,
  onChange,
  onRun,
  showRunButton = true,
  title = 'コードエディタ'
}) => {
  const [code, setCode] = useState(initialCode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const editorRef = useRef<any>(null);

  // テーマの初期化（ダークモード検出）
  useEffect(() => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(isDarkMode ? 'vs-dark' : 'light');
  }, []);

  // コード変更ハンドラー
  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    onChange?.(newCode);
  };

  // 実行ハンドラー
  const handleRun = () => {
    onRun?.(code);
  };

  // コピーハンドラー
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      // TODO: トースト通知を追加
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };

  // リセットハンドラー
  const handleReset = () => {
    setCode(initialCode);
    onChange?.(initialCode);
  };

  // フルスクリーン切り替え
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Monaco Editor設定
  const editorOptions = {
    minimap: { enabled: !isFullscreen },
    fontSize: 14,
    lineNumbers: 'on' as const,
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly,
    automaticLayout: true,
    wordWrap: 'on' as const,
    tabSize: 4,
    insertSpaces: true,
    folding: true,
    lineDecorationsWidth: 10,
    lineNumbersMinChars: 3,
    glyphMargin: false,
    contextmenu: true,
    mouseWheelZoom: true,
    smoothScrolling: true,
    cursorBlinking: 'blink' as const,
    cursorSmoothCaretAnimation: 'on' as const,
    renderWhitespace: 'selection' as const,
    // C#固有の設定
    ...(language === 'csharp' && {
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
    }),
  };

  // キーボードショートカットの設定
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Ctrl+Enter で実行
    editor.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        if (onRun && !readOnly) {
          handleRun();
        }
      },
    });

    // Ctrl+R でリセット
    editor.addAction({
      id: 'reset-code',
      label: 'Reset Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR],
      run: () => {
        if (!readOnly) {
          handleReset();
        }
      },
    });

    // F11 でフルスクリーン
    editor.addAction({
      id: 'toggle-fullscreen',
      label: 'Toggle Fullscreen',
      keybindings: [monaco.KeyCode.F11],
      run: toggleFullscreen,
    });

    // C#言語サポートの設定
    if (language === 'csharp') {
      monaco.languages.registerCompletionItemProvider('csharp', {
        provideCompletionItems: () => {
          // 基本的なC#キーワードと構文の補完
          const suggestions = [
            {
              label: 'Console.WriteLine',
              kind: monaco.languages.CompletionItemKind.Method,
              insertText: 'Console.WriteLine($1);',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'コンソールに文字列を出力します',
            },
            {
              label: 'using System',
              kind: monaco.languages.CompletionItemKind.Module,
              insertText: 'using System;',
              documentation: 'Systemライブラリを使用します',
            },
            {
              label: 'Main method',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'static void Main(string[] args)\n{\n\t$1\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'プログラムのエントリーポイント',
            },
          ];
          return { suggestions };
        },
      });
    }
  };

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-white'
    : 'relative border border-gray-200 rounded-lg overflow-hidden';

  return (
    <div className={containerClass}>
      {/* ツールバー */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          <span className="text-xs text-gray-500">
            {language.toUpperCase()}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* テーマ切り替え */}
          <button
            onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title="テーマ切り替え"
          >
            {theme === 'vs-dark' ? '🌙' : '☀️'}
          </button>

          {/* コピーボタン */}
          <button
            onClick={handleCopy}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title="コードをコピー"
          >
            <Copy className="w-4 h-4" />
          </button>

          {/* リセットボタン */}
          {!readOnly && (
            <button
              onClick={handleReset}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title="コードをリセット (Ctrl+R)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* 実行ボタン */}
          {showRunButton && onRun && !readOnly && (
            <button
              onClick={handleRun}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center space-x-1"
              title="コードを実行 (Ctrl+Enter)"
            >
              <Play className="w-3 h-3" />
              <span>実行</span>
            </button>
          )}

          {/* フルスクリーンボタン */}
          <button
            onClick={toggleFullscreen}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title="フルスクリーン切り替え (F11)"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* エディタ */}
      <div style={{ height: isFullscreen ? 'calc(100vh - 48px)' : height }}>
        <Editor
          value={code}
          language={language}
          theme={theme}
          options={editorOptions}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">エディタを読み込んでいます...</span>
            </div>
          }
        />
      </div>

      {/* フルスクリーン時のキーボードショートカット案内 */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs px-3 py-2 rounded">
          <div>Ctrl+Enter: 実行 | Ctrl+R: リセット | F11: フルスクリーン終了</div>
        </div>
      )}
    </div>
  );
};