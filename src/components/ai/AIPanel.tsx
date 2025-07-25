import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Code, Database, Settings, FolderOpen, Key } from 'lucide-react';
import { ChatInterface } from './ChatInterface';
import { CodeAnalyzer } from './CodeAnalyzer';
import { KnowledgeBase } from './KnowledgeBase';
import { AISettings } from './AISettings';
import FileSystemIntegration from './FileSystemIntegration';
import ApiConfiguration from './ApiConfiguration';

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: string;
  embedded?: boolean;
  context?: {
    mode?: 'learning' | 'general';
    currentLesson?: any;
  };
}

const AIPanel: React.FC<AIPanelProps> = ({ 
  isOpen, 
  onClose, 
  activeTab: externalActiveTab, 
  embedded = false,
  context 
}) => {
  const [activeTab, setActiveTab] = useState(externalActiveTab || 'chat');

  // 外部からのactiveTab変更に対応
  useEffect(() => {
    if (externalActiveTab) {
      setActiveTab(externalActiveTab);
    }
  }, [externalActiveTab]);

  const tabs = [
    { 
      id: 'chat', 
      label: 'チャット', 
      icon: MessageCircle,
      description: 'AIとの対話'
    },
    { 
      id: 'analysis', 
      label: '分析', 
      icon: Code,
      description: 'コード品質分析'
    },
    { 
      id: 'knowledge', 
      label: '知識', 
      icon: Database,
      description: 'プロジェクト知識ベース'
    },
    { 
      id: 'filesystem', 
      label: 'ファイル', 
      icon: FolderOpen,
      description: 'ファイルシステム統合'
    },
    { 
      id: 'api', 
      label: 'API', 
      icon: Key,
      description: 'Claude API設定'
    },
    { 
      id: 'settings', 
      label: '設定', 
      icon: Settings,
      description: 'AI機能設定'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatInterface isOnline={true} context={context} />;
      case 'analysis':
        return <CodeAnalyzer isOnline={true} context={context} />;
      case 'knowledge':
        return <KnowledgeBase isOnline={true} context={context} />;
      case 'filesystem':
        return <FileSystemIntegration />;
      case 'api':
        return <ApiConfiguration />;
      case 'settings':
        return <AISettings />;
      default:
        return <ChatInterface isOnline={true} context={context} />;
    }
  };

  // 埋め込みモードの場合
  if (embedded) {
    return (
      <div className="h-full flex flex-col bg-white border-l border-gray-200" data-testid="ai-panel-embedded">
        {/* ヘッダー */}
        <div className="border-b border-gray-200 p-4 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              AI Assistant
              <span className="ml-2 text-sm font-normal text-blue-600">Learning Mode</span>
            </h2>
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>

          {/* タブナビゲーション */}
          <div className="flex space-x-1 mt-3 bg-gray-100 p-1 rounded-lg">
            {tabs.slice(0, 3).map((tab) => { // 埋め込みモードでは主要なタブのみ表示
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:bg-opacity-50'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto">
          <div className="h-full">
            {renderTabContent()}
          </div>
        </div>
      </div>
    );
  }

  // フローティングモード
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* オーバーレイ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* メインパネル */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:max-w-2xl bg-white shadow-2xl z-50"
            data-testid="ai-panel"
          >
            {/* ヘッダー */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    AI Assistant
                    <span className="ml-2 text-sm font-normal text-blue-600">Phase 3</span>
                  </h2>
                  <p className="text-sm text-gray-600">
                    {tabs.find(tab => tab.id === activeTab)?.description}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="パネルを閉じる"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* タブナビゲーション */}
              <div className="mt-4 bg-gray-100 p-1 rounded-lg overflow-x-auto">
                <div className="flex space-x-1 min-w-max">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:bg-opacity-50'
                        }`}
                        data-testid={`tab-${tab.id}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* コンテンツエリア */}
            <div className="h-full pb-20 overflow-y-auto">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderTabContent()}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIPanel; 