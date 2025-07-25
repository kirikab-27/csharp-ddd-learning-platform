import { useEffect } from 'react';
import { X, Keyboard, Zap, Book, Bot } from 'lucide-react';

interface HotkeyAction {
  key: string;
  description: string;
  enabled: boolean;
}

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotkeyActions: HotkeyAction[];
  currentLessonTitle?: string;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  hotkeyActions,
  currentLessonTitle
}) => {
  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // モーダル外クリックで閉じる
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // ホットキーをカテゴリー別に分類
  const navigationHotkeys = hotkeyActions.filter(action => 
    action.key.includes('left') || action.key.includes('right')
  );
  
  const codeEditorHotkeys = hotkeyActions.filter(action => 
    action.key.includes('enter') || action.key.includes('ctrl+r')
  );
  
  const generalHotkeys = hotkeyActions.filter(action => 
    !navigationHotkeys.includes(action) && !codeEditorHotkeys.includes(action)
  );

  const formatKey = (key: string): string => {
    return key
      .replace('ctrl+', 'Ctrl + ')
      .replace('shift+', 'Shift + ')
      .replace('alt+', 'Alt + ')
      .replace('cmd+', 'Cmd + ')
      .toUpperCase();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Keyboard className="w-6 h-6" />
              <h2 className="text-xl font-semibold">学習ヘルプ & ショートカット</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {currentLessonTitle && (
            <p className="mt-2 text-blue-100">
              現在のレッスン: {currentLessonTitle}
            </p>
          )}
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* 学習のヒント */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Book className="w-5 h-5 mr-2 text-blue-600" />
              学習のコツ
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• <strong>実際にコードを書く:</strong> 読むだけでなく、手を動かして学習しましょう</li>
                <li>• <strong>エラーを恐れない:</strong> エラーは学習の機会です</li>
                <li>• <strong>AIメンターを活用:</strong> 分からないことは気軽に質問してください</li>
                <li>• <strong>復習を大切に:</strong> 前のレッスンを振り返ることで理解が深まります</li>
              </ul>
            </div>
          </section>

          {/* 全般的なショートカット */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-green-600" />
              全般的なショートカット
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {generalHotkeys.map((action, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">{action.description}</span>
                  <kbd className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm font-mono">
                    {formatKey(action.key)}
                  </kbd>
                </div>
              ))}
            </div>
          </section>

          {/* ナビゲーション */}
          {navigationHotkeys.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Book className="w-5 h-5 mr-2 text-purple-600" />
                レッスンナビゲーション
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {navigationHotkeys.map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-gray-700">{action.description}</span>
                    <kbd className="px-2 py-1 bg-purple-200 text-purple-800 rounded text-sm font-mono">
                      {formatKey(action.key)}
                    </kbd>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* コードエディタ */}
          {codeEditorHotkeys.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Keyboard className="w-5 h-5 mr-2 text-orange-600" />
                コードエディタ
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {codeEditorHotkeys.map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-gray-700">{action.description}</span>
                    <kbd className="px-2 py-1 bg-orange-200 text-orange-800 rounded text-sm font-mono">
                      {formatKey(action.key)}
                    </kbd>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* AIメンターについて */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Bot className="w-5 h-5 mr-2 text-indigo-600" />
              AIメンターの活用方法
            </h3>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-indigo-800">
                <li>• <strong>質問例:</strong> 「この文法の意味を教えて」「エラーの原因は何ですか？」</li>
                <li>• <strong>コードレビュー:</strong> 作成したコードの改善点を聞けます</li>
                <li>• <strong>学習アドバイス:</strong> 次に学ぶべき内容を相談できます</li>
                <li>• <strong>24時間対応:</strong> いつでも気軽に質問してください</li>
              </ul>
            </div>
          </section>
        </div>

        {/* フッター */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              困ったときは <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">F1</kbd> でこのヘルプを表示
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};