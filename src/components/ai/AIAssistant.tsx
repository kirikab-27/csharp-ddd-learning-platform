import { useState } from 'react';
import { AIFloatingButton } from './AIFloatingButton';
import AIPanel from './AIPanel';
import { useAIService } from '../../hooks/ai/useAIService';

interface AIAssistantProps {
  context?: {
    mode?: 'learning' | 'general';
    currentLesson?: any;
    embedded?: boolean; // 埋め込みモードかどうか
  };
}

export function AIAssistant({ context }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab] = useState<string>('chat'); // setActiveTab は将来の実装用
  const { isOnline } = useAIService();

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Phase 3: ホットキー対応は一時的にコメントアウト
  /*
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (!isOpen) {
      setIsOpen(true);
    }
  };
  
  useAIHotkeys({
    'ctrl+k, cmd+k': () => handleToggle(),
    'ctrl+shift+c, cmd+shift+c': () => handleTabChange('chat'),
    'ctrl+shift+a, cmd+shift+a': () => handleTabChange('analysis'),
    'escape': () => setIsOpen(false),
  });
  */

  // 埋め込みモードの場合はフローティングUIを無効化
  if (context?.embedded) {
    return (
      <div className="h-full flex flex-col">
        <AIPanel
          isOpen={true}
          onClose={() => {}} // 埋め込みモードでは閉じる操作を無効化
          activeTab={activeTab}
          embedded={true}
          context={context}
        />
      </div>
    );
  }

  return (
    <>
      <AIFloatingButton 
        onClick={handleToggle}
        isOpen={isOpen}
        isOnline={isOnline}
      />
      
      <AIPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        activeTab={activeTab}
        context={context}
      />
    </>
  );
} 