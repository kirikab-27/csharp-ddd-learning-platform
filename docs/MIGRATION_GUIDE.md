# Vibe AI Template への知見移行ガイド

## 🎯 移行の目的

C# DDD学習プラットフォーム開発で得られた以下の知見を元のテンプレートに反映：

1. より良いプロジェクト構造
2. 堅牢なエラーハンドリング
3. 効率的な状態管理
4. 再利用可能なユーティリティ
5. 開発効率を上げる設定

## 📋 段階的移行計画

### Phase 1: 基盤整備（推奨：1-2日）

#### 1.1 プロジェクト構造の再編成
```bash
# 新しいディレクトリ構造を作成
mkdir -p src/{features,stores,hooks,utils,types}

# 既存ファイルを適切な場所に移動
# 例：
# - src/components/ai/* → src/features/ai/components/*
# - 共通コンポーネントは src/components に残す
```

#### 1.2 設定ファイルの更新
```bash
# Tailwind CSS のインストール
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 設定ファイルをコピー
cp ../csharp-ddd-learning-platform/tailwind.config.js .
cp ../csharp-ddd-learning-platform/postcss.config.js .

# index.css に Tailwind ディレクティブを追加
echo '@tailwind base;
@tailwind components;
@tailwind utilities;' > src/index.css
```

#### 1.3 TypeScript設定の強化
```json
// tsconfig.json に追加
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@features/*": ["./src/features/*"],
      "@services/*": ["./src/services/*"],
      "@stores/*": ["./src/stores/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@utils/*": ["./src/utils/*"],
      "@types/*": ["./src/types/*"]
    }
  }
}
```

### Phase 2: コア機能の移植（推奨：2-3日）

#### 2.1 エラーハンドリングシステム
```bash
# エラーハンドリングユーティリティをコピー
cp ../csharp-ddd-learning-platform/docs/TRANSFERABLE_CODE.md の errorHandler.ts を参照

# ErrorBoundary コンポーネントを追加
# App.tsx でラップ
```

#### 2.2 状態管理の導入
```bash
# Zustand のインストール
npm install zustand

# 基本的なストアを作成
mkdir -p src/stores
# TRANSFERABLE_CODE.md の例を参照
```

#### 2.3 APIクライアントの改善
```bash
# 新しいAPIクライアントを作成
cp ../csharp-ddd-learning-platform/docs/TRANSFERABLE_CODE.md の apiClient.ts を参照

# 既存のサービスを新しいクライアントで置き換え
```

### Phase 3: UI/UXの改善（推奨：1-2日）

#### 3.1 共通コンポーネントの整理
```typescript
// src/components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2',
          {
            'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
            'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
            'hover:bg-gray-100': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
```

#### 3.2 レイアウトコンポーネントの追加
```typescript
// src/components/layouts/MainLayout.tsx
export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        {/* ヘッダーコンテンツ */}
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};
```

### Phase 4: 開発体験の向上（推奨：1日）

#### 4.1 開発用スクリプトの追加
```json
// package.json
{
  "scripts": {
    "dev": "concurrently \"npm:dev:*\"",
    "dev:client": "vite",
    "dev:server": "tsx watch server/index.ts",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\"",
    "clean": "rm -rf dist node_modules package-lock.json"
  }
}
```

#### 4.2 VS Code 設定
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### Phase 5: ドキュメント整備（推奨：1日）

#### 5.1 README.md の更新
- 新しい機能の説明
- セットアップ手順の更新
- 開発ガイドラインの追加

#### 5.2 CHANGELOG.md の作成
```markdown
# Changelog

## [2.0.0] - 2024-XX-XX

### Added
- Tailwind CSS for styling
- Zustand for state management
- Improved error handling
- TypeScript path aliases
- Better project structure

### Changed
- Reorganized project structure
- Enhanced TypeScript configuration
- Improved API client with retry logic

### Fixed
- Various TypeScript errors
- Build optimization issues
```

## 🚀 実装チェックリスト

- [ ] **Phase 1: 基盤整備**
  - [ ] ディレクトリ構造の再編成
  - [ ] Tailwind CSS の導入
  - [ ] TypeScript 設定の更新
  - [ ] 環境変数ファイルの改善

- [ ] **Phase 2: コア機能**
  - [ ] エラーハンドリングの実装
  - [ ] 状態管理（Zustand）の導入
  - [ ] APIクライアントの改善
  - [ ] ユーティリティ関数の追加

- [ ] **Phase 3: UI/UX**
  - [ ] 共通UIコンポーネントの作成
  - [ ] レイアウトシステムの構築
  - [ ] レスポンシブデザインの実装

- [ ] **Phase 4: 開発体験**
  - [ ] 開発スクリプトの改善
  - [ ] VS Code 設定の追加
  - [ ] ESLint/Prettier の設定

- [ ] **Phase 5: ドキュメント**
  - [ ] README.md の更新
  - [ ] 開発ガイドの作成
  - [ ] API ドキュメントの整備

## 📝 注意事項

1. **段階的な実装**
   - 一度にすべてを変更せず、段階的に実装する
   - 各段階でテストを実施

2. **後方互換性**
   - 既存の機能を壊さないよう注意
   - 非推奨機能は段階的に削除

3. **チーム開発**
   - 大きな変更は事前にチームで議論
   - プルリクエストでレビューを実施

## 🔗 参考リンク

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Best Practices](https://react.dev/learn)

---

この移行ガイドに従って実装することで、Vibe AI Template をより堅牢で保守しやすいプロジェクトに進化させることができます。