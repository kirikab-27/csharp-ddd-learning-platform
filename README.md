# C# DDD 学習プラットフォーム 🎓

インタラクティブなC#プログラミング学習環境で、基礎から上級のドメイン駆動設計（DDD）まで段階的に学習できるWebアプリケーションです。

![C# Learning Platform](https://img.shields.io/badge/C%23-Learning%20Platform-blue?style=for-the-badge&logo=csharp)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-18.2+-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=flat-square&logo=vite)

## 🌟 特徴

### 📚 包括的なコース構成
- **基礎コース**: C#の基本構文から始める初心者向けコース
- **中級コース**: LINQ、非同期処理、ジェネリクスなどの高度な機能
- **上級コース**: ドメイン駆動設計（DDD）の実践的な実装

### 🚀 学習支援機能
- **インタラクティブなコードエディタ**: リアルタイムでC#コードを編集・実行
- **コード実行シミュレーター**: ブラウザ上でC#コードの実行結果を確認
- **構文ハイライト**: 見やすいコード表示
- **演習問題システム**: 各レッスンに実践的な演習問題を用意
- **ヒントシステム**: 段階的なヒントで学習をサポート
- **進捗トラッキング**: 学習進捗を自動保存・可視化

### 🤖 AI統合
- **AIアシスタント**: 学習内容に応じたコンテキスト認識型サポート
- **コード分析**: AIによるコードレビューと改善提案
- **質問応答**: プログラミングに関する質問にリアルタイムで回答

### 💻 技術的特徴
- **レスポンシブデザイン**: PC・タブレット・スマートフォンに対応
- **オフライン対応**: 一度読み込んだコンテンツはオフラインでも閲覧可能
- **高速な動作**: Viteによる高速な開発・ビルド環境

## 🛠️ 技術スタック

### フロントエンド
- **React 18.2+** - UIライブラリ
- **TypeScript 4.9+** - 型安全な開発
- **Vite 5.0+** - 高速なビルドツール
- **Tailwind CSS 3.0+** - ユーティリティファーストCSS
- **Zustand** - 状態管理
- **React Markdown** - Markdownレンダリング
- **Prism.js** - シンタックスハイライト

### バックエンド
- **Node.js + Express** - APIサーバー
- **TypeScript** - 型安全なサーバーサイド開発

## 📦 インストール

### 前提条件
- Node.js 18.0以上
- npm または yarn

### セットアップ手順

1. リポジトリをクローン
```bash
git clone https://github.com/kirikab-27/csharp-ddd-learning-platform.git
cd csharp-ddd-learning-platform
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
```bash
cp .env.example .env
# .envファイルを編集して必要な設定を行う
```

4. 開発サーバーを起動
```bash
npm run dev
```

5. ブラウザで `http://localhost:8080` にアクセス

## 🚀 使い方

### 基本的な使い方

1. **コース選択**: ホーム画面から学習したいコースを選択
2. **レッスン進行**: 左側のナビゲーションからレッスンを選択
3. **コード実行**: エディタにコードを入力して「実行」ボタンをクリック
4. **演習問題**: 各レッスンの最後にある演習問題に挑戦
5. **進捗確認**: ダッシュボードで学習進捗を確認

### キーボードショートカット

| ショートカット | 機能 |
|--------------|------|
| `Ctrl + Enter` | コード実行 |
| `Ctrl + M` | AIメンターを開く |
| `Ctrl + →` | 次のレッスンへ |
| `Ctrl + ←` | 前のレッスンへ |
| `F1` | ヘルプを表示 |

## 📚 コース内容

### 🟢 基礎コース（11レッスン）
1. Hello, World! - 最初のプログラム
2. 変数とデータ型
3. 演算子
4. 配列とコレクション
5. 条件分岐（if文）
6. 条件分岐（switch文）
7. ループ処理
8. メソッド
9. クラスとオブジェクト
10. 継承とポリモーフィズム
11. インターフェース

### 🟡 中級コース（9レッスン）
1. LINQ基礎
2. LINQ応用
3. 非同期処理（async/await）
4. ジェネリクス
5. コレクションの活用
6. デリゲート
7. イベント
8. 例外処理
9. リソース管理

### 🔴 上級コース - DDD実践（11レッスン）
1. ドメイン駆動設計の基礎
2. エンティティと値オブジェクト
3. 集約
4. リポジトリとファクトリ
5. ドメインイベント
6. 境界づけられたコンテキスト
7. CQRS
8. イベントソーシング
9. DDDアーキテクチャ
10. テスト戦略
11. 実践プロジェクト

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更を行う場合は、まずイシューを作成して変更内容について議論してください。

1. プロジェクトをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🙏 謝辞

- [React](https://reactjs.org/) - UIライブラリ
- [Vite](https://vitejs.dev/) - ビルドツール
- [Tailwind CSS](https://tailwindcss.com/) - CSSフレームワーク
- [Anthropic Claude](https://www.anthropic.com/) - AI支援

## 📞 お問い合わせ

質問や提案がある場合は、[Issues](https://github.com/kirikab-27/csharp-ddd-learning-platform/issues)でお知らせください。

---

Made with ❤️ by [kirikab-27](https://github.com/kirikab-27)