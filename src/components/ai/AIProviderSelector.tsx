import React, { useState, useEffect } from 'react';
import { Monitor, Cloud, HardDrive, CheckCircle, XCircle, Clock } from 'lucide-react';

export type AIProvider = 'claude-code-sdk' | 'anthropic-api' | 'mock-provider' | 'auto';

export interface AIProviderConfig {
  provider: AIProvider;
  isAvailable: boolean;
  lastError?: string;
  responseTime?: number;
}

export interface AIProviderSelectorProps {
  selectedProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  className?: string;
}

export const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  className = ''
}) => {
  const [providerStatus, setProviderStatus] = useState<Record<AIProvider, AIProviderConfig>>({
    'claude-code-sdk': { provider: 'claude-code-sdk', isAvailable: false },
    'anthropic-api': { provider: 'anthropic-api', isAvailable: false },
    'mock-provider': { provider: 'mock-provider', isAvailable: true },
    'auto': { provider: 'auto', isAvailable: true }
  });
  const [isLoading, setIsLoading] = useState(false);

  // プロバイダーステータスを取得
  const fetchProviderStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        if (data.ai?.providers) {
          setProviderStatus(prev => ({
            ...prev,
            ...data.ai.providers
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch provider status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderStatus();
    // 定期的にステータスを更新
    const interval = setInterval(fetchProviderStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const providers = [
    {
      id: 'auto' as const,
      name: '自動選択',
      description: '環境に応じて最適なプロバイダーを自動選択',
      icon: Monitor,
      color: 'blue',
      isRecommended: true,
      details: 'ローカル環境ではClaude Code SDK、リモートではAnthropic API'
    },
    {
      id: 'claude-code-sdk' as const,
      name: 'Claude Code SDK',
      description: '無料・無制限 (ローカル開発推奨)',
      icon: HardDrive,
      color: 'green',
      isRecommended: false,
      details: 'Claude CLIが必要、認証済み環境での高速応答'
    },
    {
      id: 'anthropic-api' as const,
      name: 'Anthropic API',
      description: '高品質・従量課金',
      icon: Cloud,
      color: 'purple',
      isRecommended: false,
      details: 'APIキーが必要、リモートアクセス対応'
    },
    {
      id: 'mock-provider' as const,
      name: 'オフラインモード',
      description: '基本的な応答のみ',
      icon: XCircle,
      color: 'gray',
      isRecommended: false,
      details: 'インターネット接続不要、限定的な機能'
    }
  ];

  const getStatusIcon = (provider: AIProvider) => {
    if (isLoading) return <Clock className="w-4 h-4 animate-spin text-gray-400" />;
    
    const config = providerStatus[provider];
    if (!config) return <XCircle className="w-4 h-4 text-gray-400" />;
    
    return config.isAvailable 
      ? <CheckCircle className="w-4 h-4 text-green-500" />
      : <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = (provider: AIProvider) => {
    if (isLoading) return '確認中...';
    
    const config = providerStatus[provider];
    if (!config) return '不明';
    
    if (config.isAvailable) {
      return config.responseTime ? `利用可能 (${config.responseTime}ms)` : '利用可能';
    } else {
      return config.lastError || '利用不可';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">AIプロバイダー選択</h3>
        <button
          onClick={fetchProviderStatus}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
        >
          {isLoading ? '確認中...' : '状態更新'}
        </button>
      </div>

      <div className="grid gap-3">
        {providers.map((provider) => {
          const isSelected = selectedProvider === provider.id;
          const config = providerStatus[provider.id];
          const isAvailable = config?.isAvailable || provider.id === 'auto' || provider.id === 'mock-provider';
          
          return (
            <div
              key={provider.id}
              className={`
                relative p-4 border-2 rounded-lg cursor-pointer transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
                ${!isAvailable ? 'opacity-60' : ''}
              `}
              onClick={() => onProviderChange(provider.id)}
            >
              {provider.isRecommended && (
                <div className="absolute -top-2 -right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                  推奨
                </div>
              )}
              
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 p-2 rounded-lg bg-${provider.color}-100`}>
                  <provider.icon className={`w-5 h-5 text-${provider.color}-600`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900">{provider.name}</h4>
                    {getStatusIcon(provider.id)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{provider.details}</p>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs text-gray-500">状態:</span>
                    <span className={`text-xs ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {getStatusText(provider.id)}
                    </span>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <div className={`
                    w-4 h-4 rounded-full border-2 
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300 bg-white'
                    }
                  `}>
                    {isSelected && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedProvider !== 'auto' && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>手動選択中:</strong> 選択されたプロバイダーが利用できない場合、自動的にフォールバックされます。
          </p>
        </div>
      )}
      
      {selectedProvider === 'auto' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>自動選択モード:</strong> 環境とアクセス元に基づいて最適なプロバイダーが自動選択されます。
          </p>
        </div>
      )}
    </div>
  );
};

export default AIProviderSelector;