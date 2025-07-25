import { useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import type { Lesson } from '../types';

interface LearningHotkeysOptions {
  currentLesson?: Lesson | null;
  onNextLesson?: () => void;
  onPreviousLesson?: () => void;
  onOpenAIMentor?: () => void;
  onToggleAIPanel?: () => void;
  onToggleHelp?: () => void;
  onRunCode?: () => void;
  onResetCode?: () => void;
  isInCodeEditor?: boolean;
}

interface HotkeyAction {
  key: string;
  description: string;
  action: () => void;
  enabled: boolean;
}

export const useLearningHotkeys = (options: LearningHotkeysOptions) => {
  const [showHelp, setShowHelp] = useState(false);
  
  const {
    // currentLesson,
    onNextLesson,
    onPreviousLesson,
    onOpenAIMentor,
    onToggleAIPanel,
    onToggleHelp,
    onRunCode,
    onResetCode,
    isInCodeEditor = false
  } = options;

  // ヘルプの表示/非表示を切り替え
  const handleToggleHelp = () => {
    const newShowHelp = !showHelp;
    setShowHelp(newShowHelp);
    onToggleHelp?.();
  };

  // ホットキーの定義
  const hotkeyActions: HotkeyAction[] = [
    {
      key: 'F1',
      description: 'ヘルプを表示',
      action: handleToggleHelp,
      enabled: true
    },
    {
      key: 'ctrl+m',
      description: 'AIメンターを開く',
      action: () => onOpenAIMentor?.(),
      enabled: !!onOpenAIMentor
    },
    {
      key: 'ctrl+shift+a',
      description: 'AIパネルを開閉',
      action: () => onToggleAIPanel?.(),
      enabled: !!onToggleAIPanel
    },
    {
      key: 'ctrl+right',
      description: '次のレッスンへ',
      action: () => onNextLesson?.(),
      enabled: !!onNextLesson
    },
    {
      key: 'ctrl+left',
      description: '前のレッスンへ',
      action: () => onPreviousLesson?.(),
      enabled: !!onPreviousLesson
    },
    {
      key: 'ctrl+enter',
      description: 'コードを実行',
      action: () => onRunCode?.(),
      enabled: isInCodeEditor && !!onRunCode
    },
    {
      key: 'ctrl+r',
      description: 'コードをリセット',
      action: () => onResetCode?.(),
      enabled: isInCodeEditor && !!onResetCode
    },
    {
      key: 'ctrl+/',
      description: 'ショートカット一覧',
      action: handleToggleHelp,
      enabled: true
    },
    {
      key: 'escape',
      description: 'ヘルプを閉じる',
      action: () => setShowHelp(false),
      enabled: showHelp
    }
  ];

  // ホットキーの登録
  hotkeyActions.forEach(({ key, action, enabled }) => {
    useHotkeys(
      key,
      (event) => {
        if (enabled) {
          event.preventDefault();
          action();
        }
      },
      {
        enabled,
        enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'], // フォーム内でも有効
      }
    );
  });

  // ESCキーでヘルプを閉じる
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showHelp) {
        setShowHelp(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showHelp]);

  return {
    showHelp,
    setShowHelp,
    hotkeyActions: hotkeyActions.filter(action => action.enabled)
  };
};