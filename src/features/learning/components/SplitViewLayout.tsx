import React, { useState, useEffect } from 'react';
import { X, GripVertical } from 'lucide-react';

interface SplitViewLayoutProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  defaultSplitRatio?: number;
}

export const SplitViewLayout: React.FC<SplitViewLayoutProps> = ({
  leftContent,
  rightContent,
  isRightPanelOpen,
  onToggleRightPanel,
  defaultSplitRatio = 60
}) => {
  const [splitRatio, setSplitRatio] = useState(defaultSplitRatio);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // レスポンシブ対応
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const containerWidth = window.innerWidth;
    const newRatio = (e.clientX / containerWidth) * 100;
    
    // 30%〜70%の範囲に制限
    const clampedRatio = Math.min(Math.max(newRatio, 30), 70);
    setSplitRatio(clampedRatio);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging]);

  // モバイル表示
  if (isMobile) {
    return (
      <div className="relative h-full">
        {/* モバイルでは全画面切り替え */}
        {!isRightPanelOpen ? (
          <div className="h-full">{leftContent}</div>
        ) : (
          <div className="h-full bg-gray-50 dark:bg-gray-900">
            {/* AIパネルヘッダー */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI学習アシスタント</h3>
              <button
                onClick={onToggleRightPanel}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* AIコンテンツ */}
            <div className="h-full overflow-hidden">
              {rightContent}
            </div>
          </div>
        )}
        
        {/* 切り替えボタン */}
        <button
          onClick={onToggleRightPanel}
          className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        >
          {isRightPanelOpen ? '📚' : '🤖'}
        </button>
      </div>
    );
  }

  // デスクトップ表示
  return (
    <div className="flex h-full relative">
      {/* 左側パネル（レッスン） */}
      <div 
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{ width: isRightPanelOpen ? `${splitRatio}%` : '100%' }}
      >
        <div className="h-full overflow-auto pl-8">
          {leftContent}
        </div>
      </div>

      {/* リサイズハンドル */}
      {isRightPanelOpen && (
        <div
          className="flex items-center justify-center w-2 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-600 cursor-col-resize transition-colors group"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="w-3 h-3 text-gray-400 group-hover:text-white" />
        </div>
      )}

      {/* 右側パネル（AI） */}
      {isRightPanelOpen && (
        <div 
          className="bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-lg"
          style={{ width: `${100 - splitRatio}%` }}
        >
          <div className="h-full flex flex-col">
            {/* AIパネルヘッダー */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI学習アシスタント</h3>
              <button
                onClick={onToggleRightPanel}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* AIコンテンツ */}
            <div className="flex-1 overflow-hidden">
              {rightContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};