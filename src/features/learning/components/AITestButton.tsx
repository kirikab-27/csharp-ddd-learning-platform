import { useState } from 'react';
import { Bot } from 'lucide-react';

export const AITestButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>('');

  const testAIConnection = async () => {
    setIsLoading(true);
    setResponse('');

    try {
      // C#の名前空間についての質問でテスト
      const testMessage = '名前空間とは何ですか？';
      
      console.log('=== AITestButton Debug ===');
      console.log('Sending test message:', testMessage);
      
      const requestBody = {
        message: testMessage,
        context: {
          mode: 'learning-chat',
          language: 'csharp',
          currentLesson: 'C#基礎'
        }
      };
      
      console.log('Request body:', requestBody);
      
      const apiResponse = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', apiResponse.status);

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        console.log('Response data:', result);
        setResponse(`✅ 成功: C#AIアシスタントが正常に動作しています！\n\n--- 回答 ---\n${result.response}`);
      } else {
        console.error('API error:', apiResponse.status, apiResponse.statusText);
        const errorText = await apiResponse.text();
        console.error('Error details:', errorText);
        setResponse(`❌ エラー: ${apiResponse.status} ${apiResponse.statusText}\n\n詳細: ${errorText}`);
      }
    } catch (error) {
      console.error('Connection error:', error);
      setResponse(`❌ 接続エラー: ${error instanceof Error ? error.message : '不明なエラー'}\n\nサーバーが起動しているか確認してください。`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
        <Bot className="w-5 h-5 mr-2 text-blue-600" />
        AI機能テスト
      </h3>
      
      <button
        onClick={testAIConnection}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
      >
        <Bot className="w-4 h-4" />
        <span>{isLoading ? 'AI接続中...' : 'AI機能をテスト'}</span>
      </button>

      {response && (
        <div className="mt-4 p-3 bg-white border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-700 mb-2">AIテスト結果:</h4>
          <div className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-gray-50 p-2 rounded">
            {response}
          </div>
        </div>
      )}
    </div>
  );
};