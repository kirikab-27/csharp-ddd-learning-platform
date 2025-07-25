# Claude Code実装計画書 - C# DDD学習プラットフォーム

## プロジェクト概要
vibe-ai-templateをベースに、C#からDDD（ドメイン駆動設計）までを体系的に学習できるインタラクティブな学習プラットフォームを構築する。

## 技術スタック
- **フロントエンド**: React 18 + TypeScript + Vite
- **スタイリング**: Tailwind CSS + Framer Motion
- **AI統合**: Claude API (@anthropic-ai/sdk)
- **コードエディタ**: Monaco Editor
- **状態管理**: React Hooks + Context API
- **ストレージ**: LocalStorage (進捗管理)

## 実装優先順位

### Phase 1: 基本構造とナビゲーション（最優先）

1. **ディレクトリ構造の作成**
```
src/
├── components/
│   └── learning/
│       ├── CourseNavigation.tsx    # コース一覧と選択
│       ├── LessonViewer.tsx         # レッスン表示
│       └── ProgressBar.tsx          # 進捗表示
├── content/
│   └── courses/
│       └── csharp-basics/
│           ├── index.ts             # コース定義
│           └── lessons/
│               ├── 01-variables.md  # レッスン1
│               └── 02-control-flow.md
└── types/
    └── learning.ts                  # 型定義
```

2. **基本的な型定義** (`src/types/learning.ts`)
```typescript
export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  icon?: string;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  codeExamples?: CodeExample[];
  exercises?: Exercise[];
}

export interface CodeExample {
  language: string;
  code: string;
  description?: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  solution?: string;
  hints?: string[];
}
```

3. **メインレイアウトの更新**
- `src/App.tsx`を更新して学習プラットフォームのレイアウトに変更
- サイドバーにコース一覧、メインエリアにレッスン表示

### Phase 2: コンテンツ表示とコードエディタ

1. **Markdownレンダラーの実装**
- react-markdownを使用してレッスンコンテンツを表示
- シンタックスハイライト対応

2. **Monaco Editor統合**
```typescript
// src/components/learning/CodeEditor.tsx
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  language: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}
```

3. **サンプルレッスンコンテンツ作成**
- C#基礎の最初の3レッスン
- 各レッスンにコード例と簡単な演習を含める

### Phase 3: AI機能の統合

1. **AIメンター機能の実装**
```typescript
// src/components/ai/LearningAssistant.tsx
// 既存のAIアシスタントを拡張して学習コンテキストを追加
interface LearningContext {
  currentCourse: string;
  currentLesson: string;
  userCode?: string;
  question: string;
}
```

2. **コードレビュー機能**
- ユーザーのコードをAIが分析
- 改善提案とベストプラクティスの提示

3. **質問応答システム**
- レッスンに関する質問に回答
- コンテキストを考慮した説明

## 実装手順

### Step 1: プロジェクトセットアップ（完了済み）
```bash
git clone https://github.com/kirikab-27/vibe-ai-template.git
cd vibe-ai-template
mv vibe-ai-template csharp-ddd-learning-platform
cd csharp-ddd-learning-platform
npm install
```

### Step 2: 基本構造の実装
1. 上記のディレクトリ構造を作成
2. 型定義ファイルを作成
3. 基本的なコンポーネントの骨組みを作成

### Step 3: ルーティングとナビゲーション
1. React Routerを追加（必要に応じて）
2. コース選択とレッスン遷移の実装
3. 進捗管理のローカルストレージ保存

### Step 4: コンテンツ表示
1. Markdownパーサーの設定
2. コード例の表示
3. レスポンシブデザインの適用

### Step 5: インタラクティブ機能
1. コードエディタの統合
2. 実行結果のシミュレーション（AIによる）
3. 演習問題の表示と検証

## コマンド例

```bash
# 開発サーバー起動
npm run dev

# 型チェック
npm run type-check

# ビルド
npm run build
```

## 重要な実装ポイント

1. **既存機能の活用**
   - AIアシスタントUIをそのまま活用
   - ホットキーシステムを学習ショートカットに転用
   - 知識ベースを学習履歴管理に使用

2. **段階的な実装**
   - まず静的なコンテンツ表示から始める
   - 次にインタラクティブな要素を追加
   - 最後にAI機能を統合

3. **ユーザビリティ重視**
   - 直感的なナビゲーション
   - 明確な進捗表示
   - レスポンシブデザイン

## 最初の実装タスク

1. `src/types/learning.ts`を作成して型定義
2. `src/components/learning/CourseNavigation.tsx`を作成
3. `src/content/courses/csharp-basics/index.ts`でコース定義
4. `src/App.tsx`を更新して学習UIに変更
5. 最初のレッスンコンテンツを作成

## 成功基準

- [x] コース一覧が表示される ✅ **完了**
- [x] レッスンが選択・表示できる ✅ **完了**
- [x] コード例がシンタックスハイライト付きで表示される ✅ **完了**
- [x] 進捗が保存される ✅ **完了**
- [x] AIアシスタントに質問できる ✅ **完了**
- [x] C# 中級コースが実装されている ✅ **完了**
- [x] 複数コースの切り替えができる ✅ **完了**

## 備考

- 既存のvibe-ai-templateの機能を最大限活用する
- 必要最小限の変更で学習プラットフォームを実現
- Phase 1-3の実装で基本的な学習体験を提供可能 ✅ **完了**

## Phase 4 計画: C# 上級コース開発

### 目標
C# 中級コースで得た知見を活かし、DDD（ドメイン駆動設計）に特化した上級コースを開発する。

### 実装予定内容

#### 1. C# 上級コース コンテンツ
- **DDD基礎概念**
  - ドメイン、境界付けられたコンテキスト
  - エンティティとバリューオブジェクト
  - 集約ルート
  - ドメインサービス

- **DDD実践パターン**
  - リポジトリパターン
  - ファクトリーパターン
  - ドメインイベント
  - CQRS（Command Query Responsibility Segregation）

- **実践プロジェクト**
  - ECサイト構築プロジェクト
  - 段階的な要件追加と設計改善
  - リファクタリング演習

#### 2. 高度な学習機能
- **インタラクティブ演習システム**
  - 実際のコード実行環境
  - ユニットテスト統合
  - リアルタイムフィードバック

- **学習分析機能**
  - 学習時間追跡
  - 理解度測定
  - 個別化されたおすすめレッスン

- **プロジェクトベース学習**
  - Git統合
  - コードレビュー機能
  - チーム開発シミュレーション

#### 3. 技術的改善
- **パフォーマンス最適化**
- **アクセシビリティ向上**
- **PWA対応**
- **レスポンシブデザイン最適化**

### 中級コース実装で得た教訓の適用

1. **コンテンツ作成効率化**
   - テンプレート活用
   - TypeScript Template Literal最適化
   - エラーハンドリング強化

2. **学習体験向上**
   - 段階的学習設計
   - 実践的なコード例
   - DDD概念の自然な導入

3. **技術的な安定性**
   - import/export管理の改善
   - ビルドプロセスの最適化
   - 複数コース対応の拡張
