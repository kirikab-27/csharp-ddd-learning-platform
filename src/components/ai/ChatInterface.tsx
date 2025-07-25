import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Bot, Sparkles, Copy, Check, Settings } from 'lucide-react';
// import { ChevronDown, ChevronUp } from 'lucide-react'; // 将来の展開/折りたたみ機能用
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
// import { useAIService } from '../../hooks/ai/useAIService'; // 将来のAIサービス統合用
import AIProviderSelector, { type AIProvider } from './AIProviderSelector';
import type { ChatMessage } from '../../types/ai';

interface ChatInterfaceProps {
  isOnline: boolean;
  context?: {
    mode?: 'learning' | 'general';
    currentLesson?: any;
  };
}

// コピーボタン付きコードブロックコンポーネント
interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
  inline?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ className, children, inline, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'csharp'; // デフォルトはC#
  
  const handleCopy = async () => {
    const text = String(children).replace(/\n$/, '');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  if (inline) {
    return (
      <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-red-600 dark:text-red-400">
        {children}
      </code>
    );
  }
  
  return (
    <div className="relative group my-4">
      {/* コピーボタン */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        title="コードをコピー"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      
      {/* コードヘッダー */}
      <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300 font-mono border-b border-gray-700 flex items-center justify-between">
        <span>{language.toUpperCase()}</span>
        <span className="text-xs opacity-75">C# Code Example</span>
      </div>
      
      {/* シンタックスハイライト */}
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        className="!mt-0 !rounded-t-none"
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0
        }}
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
};

// メッセージコンテンツコンポーネント
interface MessageContentProps {
  content: string;
  timestamp: number;
}

const MessageContent: React.FC<MessageContentProps> = ({ content, timestamp }) => {
  return (
    <div className="bg-white rounded-lg">
      <div className="p-3">
        <div className="prose prose-sm max-w-none prose-gray">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: CodeBlock as any,
              // カスタムスタイル
              h1: ({ children }) => <h1 className="text-lg font-bold mb-3 text-gray-900 border-b pb-1">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-gray-900 mt-4">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-medium mb-1 text-gray-900 mt-3">{children}</h3>,
              p: ({ children }) => <p className="text-sm text-gray-800 mb-3 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="text-sm text-gray-800 mb-3 pl-4 space-y-1 list-disc">{children}</ul>,
              ol: ({ children }) => <ol className="text-sm text-gray-800 mb-3 pl-4 space-y-1 list-decimal">{children}</ol>,
              li: ({ children }) => <li className="text-sm">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
              em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 bg-gray-50 py-2 my-3 rounded-r">
                  {children}
                </blockquote>
              ),
              // テーブルサポート
              table: ({ children }) => (
                <div className="overflow-x-auto my-3">
                  <table className="min-w-full border border-gray-300 text-sm">{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead className="bg-gray-100">{children}</thead>,
              tbody: ({ children }) => <tbody>{children}</tbody>,
              tr: ({ children }) => <tr className="border-b border-gray-200">{children}</tr>,
              th: ({ children }) => <th className="px-3 py-2 text-left font-medium text-gray-900">{children}</th>,
              td: ({ children }) => <td className="px-3 py-2 text-gray-800">{children}</td>
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
      <div className="px-3 pb-2 border-t bg-gray-50">
        <p className="text-xs text-gray-500">
          {new Date(timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export function ChatInterface({ isOnline, context }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: context?.mode === 'learning' 
        ? `こんにちは！C#学習アシスタントです。${context.currentLesson ? `「${context.currentLesson.title}」` : '現在のレッスン'}について何か質問はありますか？`
        : 'こんにちは！AI Assistantです。コード生成やプログラミングに関する質問にお答えします。何かお手伝いできることはありますか？',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('auto');
  const [showSettings, setShowSettings] = useState(false);
  // const { generateCode } = useAIService(); // 将来のコード生成機能用
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // オフラインモード用C#応答生成
  const generateOfflineCSharpResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('hello') || lowerInput.includes('こんにちは')) {
      return `こんにちは！C#学習アシスタント（オフラインモード）です。

現在はオフラインモードで動作しており、基本的なC#学習サポートを提供します。

**よくある質問:**
- 「変数について教えて」→ C#の変数宣言と型について説明
- 「名前空間とは」→ namespaceの使い方について説明  
- 「クラスについて」→ C#のクラス定義について説明
- 「メソッドについて」→ C#のメソッド定義について説明

何について学習したいですか？`;
    }
    
    if (lowerInput.includes('変数') || lowerInput.includes('variable')) {
      return `**C#の変数について（オフライン情報）**

\`\`\`csharp
// 基本的な変数宣言
int age = 25;
string name = "Taro";
bool isStudent = true;
double height = 175.5;

// var を使った型推論
var count = 10;        // int型
var message = "Hello"; // string型
\`\`\`

**ポイント:**
- C#は強い型付け言語
- 変数は使用前に宣言が必要
- varキーワードで型推論が可能`;
    }
    
    if (lowerInput.includes('名前空間') || lowerInput.includes('namespace')) {
      return `**C#の名前空間について（オフライン情報）**

\`\`\`csharp
using System;

namespace MyProject
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello World!");
        }
    }
}
\`\`\`

**ポイント:**
- 名前空間はコードを整理するための仕組み
- usingディレクティブで他の名前空間を利用
- 同じ名前のクラスを区別できる`;
    }
    
    return `C#学習アシスタント（オフラインモード）です。

「${input}」についてのオフライン情報は限定的ですが、以下のトピックについて基本的な説明ができます：

- **変数と型** - int, string, bool等の基本型
- **名前空間** - namespaceとusingの使い方
- **クラス** - class定義の基本
- **メソッド** - static void Mainなど

より具体的な質問をしていただければ、オフラインでも学習サポートいたします！`;
  };

  // C#専用システムプロンプトを生成
  const generateCSharpSystemPrompt = () => {
    if (context?.mode !== 'learning') return '';
    
    return `
あなたはC#プログラミング専門のアシスタントです。

【必須制約】
- 必ずC#のみで回答し、他の言語の例は一切含めない
- コード例はすべてC#で提供
- "JavaScriptでは..." や "Pythonでは..." のような比較は禁止
- .NET Framework/Coreの機能を活用

【学習コンテキスト】
- レッスン: ${context?.currentLesson?.title || 'C#基礎'}
- 目標: ドメイン駆動設計(DDD)への理解
- 対象: C#初学者

【回答スタイル】
- 初心者にも分かりやすく説明
- 実用的なC#コード例を必ず含める
- コメントは日本語で記述
- 将来のDDD実装への道筋を示す

C#に関する質問にのみお答えします。
    `;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // フロントエンドデバッグログ
      console.log('=== Frontend Chat Debug ===');
      console.log('User input:', userInput);
      console.log('Context:', context);
      console.log('Mode:', context?.mode);
      console.log('Current URL:', window.location.href);
      console.log('Hostname:', window.location.hostname);
      console.log('Port:', window.location.port);
      
      // API URLを動的に決定（Viteプロキシ経由）
      const getApiUrl = () => {
        // Viteプロキシを使用するため、相対URLを返す
        console.log('Using Vite proxy for API requests - relative URL');
        return '';  // 空文字列 = 現在のoriginを使用
      };

      // C#学習モードの場合は直接APIを呼び出し
      let response;
      
      // テスト用の一時的な固定レスポンス
      // response = 'テスト応答: APIは正常に動作しています。';
      
      if (context?.mode === 'learning') {
        console.log('Learning mode detected, sending to C# specialized endpoint');
        const systemPrompt = generateCSharpSystemPrompt();
        
        const requestBody = {
          message: userInput,
          systemPrompt: systemPrompt,
          context: {
            mode: 'learning-chat',
            language: 'csharp',
            courseType: 'C# to DDD Learning Platform',
            currentLesson: context?.currentLesson?.title,
            strict: true
          },
          preferredProvider: selectedProvider !== 'auto' ? selectedProvider : undefined
        };
        
        console.log('Sending request body:', requestBody);
        
        const baseUrl = getApiUrl();
        const apiUrl = `${baseUrl}/api/ai/chat`;
        console.log('Base URL:', baseUrl);
        console.log('API URL:', apiUrl);
        console.log('Full resolved URL:', apiUrl);

        const apiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
        
        console.log('Fetch response:', apiResponse);
        console.log('Response status:', apiResponse.status);
        console.log('Response URL:', apiResponse.url);
        
        console.log('API Response status:', apiResponse.status);
        
        if (apiResponse.ok) {
          const result = await apiResponse.json();
          console.log('API Response data:', result);
          response = result.response;
          console.log('Extracted response:', response);
        } else {
          console.error('API Error:', apiResponse.status, apiResponse.statusText);
          const errorText = await apiResponse.text();
          console.error('Error details:', errorText);
          
          // フォールバックモードでC#専用の応答を提供
          if (context?.mode === 'learning') {
            response = generateOfflineCSharpResponse(userInput);
          } else {
            response = 'AIサービスに接続できませんでした。オフラインモードで基本的な情報を提供します。';
          }
        }
      } else {
        console.log('General mode, also using API endpoint for consistency');
        // 一般モードでも新しいAPIエンドポイントを使用
        const apiUrl = `${getApiUrl()}/api/ai/chat`;
        
        const requestBody = {
          message: userInput,
          context: {
            mode: 'general-chat',
            language: 'general'
          },
          preferredProvider: selectedProvider !== 'auto' ? selectedProvider : undefined
        };

        const apiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (apiResponse.ok) {
          const result = await apiResponse.json();
          response = result.response;
        } else {
          response = 'AIサービスに接続できませんでした。もう一度お試しください。';
        }
      }
      
      console.log('Final response to display:', response);
      console.log('Response type:', typeof response);
      console.log('Response length:', response?.length);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response || 'C#に関する情報を提供できませんでした。もう一度お試しください。',
        timestamp: Date.now()
      };
      
      console.log('Creating assistant message:', assistantMessage);
      setMessages(prev => {
        console.log('Previous messages:', prev);
        const newMessages = [...prev, assistantMessage];
        console.log('New messages:', newMessages);
        return newMessages;
      });
    } catch (error) {
      console.error('Chat error:', error);
      
      let errorContent = 'エラーが発生しました。';
      
      // フォールバックモードで適切な応答を提供
      if (context?.mode === 'learning') {
        errorContent = generateOfflineCSharpResponse(userInput);
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        errorContent = 'オフラインモードです。基本的な情報のみ提供できます。';
      } else if (error instanceof Error) {
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          errorContent = 'オフラインモードで動作しています。基本的な学習サポートを提供します。';
        } else {
          errorContent = `オフラインモードです: ${error.message}`;
        }
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: errorContent,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // C#学習モードの場合はC#専用のプリセットを使用
  const presetPrompts = context?.mode === 'learning' ? [
    '名前空間とは何ですか？',
    'C#の変数宣言方法を教えて',
    'C#のclassとstructの違いは？',
    'C#でのValueObject実装方法'
  ] : [
    'React コンポーネントを作成して',
    'TypeScript の型定義を教えて',
    'API エンドポイントの例を見せて',
    'エラーハンドリングのベストプラクティス'
  ];

  return (
    <div className="h-full flex flex-col">
      {/* 設定エリア */}
      <div className="border-b bg-white">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {context?.mode === 'learning' ? 'C#学習アシスタント' : 'AI Assistant'}
            </h2>
            <span className={`text-xs px-2 py-1 rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isOnline ? 'オンライン' : 'オフライン'}
            </span>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="AIプロバイダー設定"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t bg-gray-50 overflow-hidden"
          >
            <div className="p-4">
              <AIProviderSelector
                selectedProvider={selectedProvider}
                onProviderChange={setSelectedProvider}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'assistant' && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-white" />
              </div>
            )}
            
            <div className={`
              max-w-[80%] rounded-lg overflow-hidden
              ${message.type === 'user' 
                ? 'bg-blue-600 text-white p-3' 
                : 'bg-gray-100 text-gray-900'
              }
            `}>
              {message.type === 'user' ? (
                <>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </>
              ) : (
                <MessageContent content={message.content} timestamp={message.timestamp} />
              )}
            </div>

            {message.type === 'user' && (
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-white" />
              </div>
            )}
          </motion.div>
        ))}

        {/* ローディング表示 */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* プリセットプロンプト */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500 mb-2">よく使われる質問:</p>
          <div className="grid grid-cols-1 gap-2">
            {presetPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => setInput(prompt)}
                className="text-left p-2 text-xs bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-700"
              >
                <Sparkles size={12} className="inline mr-1" />
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 入力エリア */}
      <div className="p-3 lg:p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isOnline ? "メッセージを入力..." : "オフラインモード - 基本的な応答のみ利用可能"}
            disabled={isLoading}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            rows={1}
            style={{ minHeight: '38px', maxHeight: '120px' }}
            data-chat-input
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`
              px-3 py-2 rounded-lg transition-colors flex items-center justify-center
              ${!input.trim() || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span className="hidden sm:inline">Enter で送信、Shift+Enter で改行</span>
          <span className="sm:hidden">送信: Enter</span>
          <span className="text-xs">
            プロバイダー: <span className="font-medium">{selectedProvider === 'auto' ? '自動選択' : selectedProvider}</span>
          </span>
        </div>
      </div>
    </div>
  );
} 