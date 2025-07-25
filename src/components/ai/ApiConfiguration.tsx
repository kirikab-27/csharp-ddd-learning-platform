import { useState, useEffect } from 'react';
// import { motion } from 'framer-motion'; // 将来のアニメーション用
import { 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  Activity,
  Settings,
  Info
} from 'lucide-react';
import { claudeApiService } from '../../services/claudeApiService';
import { aiService } from '../../services/aiService';

const ApiConfiguration: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'claude-3-haiku-20240307' | 'claude-3-sonnet-20240229' | 'claude-3-opus-20240229'>('claude-3-sonnet-20240229');
  const [maxTokens, setMaxTokens] = useState(1000);
  const [temperature, setTemperature] = useState(0.7);
  const [usageStats, setUsageStats] = useState({
    requestCount: 0,
    resetTime: Date.now(),
    isConfigured: false,
    model: 'claude-3-sonnet-20240229'
  });

  useEffect(() => {
    // 初期状態の確認
    const configured = claudeApiService.isConfigured();
    setIsConfigured(configured);
    
    // 保存されたAPIキーの取得
    const storedKey = localStorage.getItem('claude-api-key');
    if (storedKey) {
      setApiKey(storedKey);
    }

    // 使用統計の取得
    const stats = claudeApiService.getUsageStats();
    setUsageStats({
      ...stats,
      isConfigured: true
    });

    // ヘルスチェック
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    const status = await aiService.healthCheck();
    setIsOnline(status);
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Claude API Service のsetApiKeyメソッドを実装
      const success = true; // 一時的にtrueを返す
      
      if (success) {
        setIsConfigured(true);
        
        // ヘルスチェック実行
        const isHealthy = await claudeApiService.healthCheck();
        setIsOnline(isHealthy);
        
        // AIServiceにも設定を反映
        aiService.setApiKey(apiKey.trim());
        
        console.log('✅ API key configured successfully');
      }
    } catch (error) {
      console.error('Failed to configure API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateConfig = () => {
    claudeApiService.updateConfig({
      model: selectedModel as 'sonnet' | 'opus' | 'haiku',
      // maxTokens, // TODO: ClaudeConfigインターフェースにmaxTokensを追加
      // temperature // TODO: ClaudeConfigインターフェースにtemperatureを追加
    });

    console.log('🔧 API configuration updated');
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const isHealthy = await claudeApiService.healthCheck();
      setIsOnline(isHealthy);
      
      if (isHealthy) {
        console.log('✅ Connection test successful');
      } else {
        console.warn('⚠️ Connection test failed');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeRemaining = (resetTime: number): string => {
    const remaining = Math.max(0, resetTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Claude API設定</h3>
          <p className="text-sm text-gray-600">AnthropicのClaude APIとの接続設定</p>
        </div>
        <div className="flex items-center space-x-2">
          {isConfigured ? (
            isOnline ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          <span className="text-sm font-medium">
            {isConfigured ? (isOnline ? 'オンライン' : 'オフライン') : '未設定'}
          </span>
        </div>
      </div>

      {/* API Key設定 */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center space-x-2">
          <Key className="w-4 h-4" />
          <span>APIキー</span>
        </h4>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">APIキーの取得方法:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li><a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline">Anthropic Console</a>にアクセス</li>
                <li>アカウントにログインまたは登録</li>
                <li>"API Keys"セクションで新しいキーを作成</li>
                <li>キーをコピーして下記に貼り付け</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim() || isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '設定中...' : 'APIキーを保存'}
            </button>
            
            {isConfigured && (
              <button
                onClick={handleTestConnection}
                disabled={isLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'テスト中...' : '接続テスト'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* モデル設定 */}
      {isConfigured && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>モデル設定</span>
          </h4>

          <div className="grid grid-cols-1 gap-4">
            {/* モデル選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Claudeモデル
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="claude-3-haiku-20240307">Claude 3 Haiku (高速・低コスト)</option>
                <option value="claude-3-sonnet-20240229">Claude 3 Sonnet (バランス)</option>
                <option value="claude-3-opus-20240229">Claude 3 Opus (最高性能)</option>
              </select>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最大トークン数: {maxTokens}
              </label>
              <input
                type="range"
                min="100"
                max="4000"
                step="100"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>100</span>
                <span>4000</span>
              </div>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                創造性 (Temperature): {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 (厳密)</span>
                <span>1 (創造的)</span>
              </div>
            </div>

            <button
              onClick={handleUpdateConfig}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              設定を更新
            </button>
          </div>
        </div>
      )}

      {/* 使用統計 */}
      {isConfigured && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>使用統計</span>
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{usageStats.requestCount}</div>
              <div className="text-sm text-gray-600">今分のリクエスト数</div>
              <div className="text-xs text-gray-500 mt-1">
                リセット: {formatTimeRemaining(usageStats.resetTime)}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-lg font-bold text-gray-900">{usageStats.model.split('-')[1]}</div>
              <div className="text-sm text-gray-600">使用中のモデル</div>
              <div className="text-xs text-gray-500 mt-1">
                {usageStats.model.includes('haiku') ? '⚡ 高速' :
                 usageStats.model.includes('sonnet') ? '⚖️ バランス' : '🎯 高性能'}
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">レート制限について</p>
                <p>Anthropic APIには使用制限があります。制限に達した場合、一時的にオフライン機能に切り替わります。</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* セキュリティ情報 */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-medium mb-2">セキュリティに関する重要な注意事項:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>APIキーは機密情報です。他者と共有しないでください</li>
              <li>このアプリケーションはブラウザのローカルストレージに保存します</li>
              <li>共有PCでは使用後にAPIキーを削除してください</li>
              <li>不審な活動を発見した場合はすぐにキーを無効化してください</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiConfiguration; 