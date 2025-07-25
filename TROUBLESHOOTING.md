# トラブルシューティングガイド

## レッスンが表示されない問題の解決方法

### 問題の概要
新しいレッスン（インターフェースレッスン）を追加したが、メニューには表示されるものの、クリックしてもコンテンツが表示されない問題が発生しました。

### 原因
複数の要因が重なって発生した問題でした：

1. **型定義の不一致**
   - 最初に作成したレッスンファイルで、`content`プロパティをオブジェクト形式（`{sections, exercises, quiz}`）で定義していた
   - 正しい型定義では`content`は文字列型であるべきだった

2. **キャッシュの問題**
   - Zustandの永続化機能（localStorage）により、古いレッスン構造がキャッシュされていた
   - Viteのホットリロードが古いモジュールをキャッシュしていた可能性

3. **プロパティの不足**
   - `codeExamples`プロパティが必要だったが、最初は追加していなかった
   - 他のレッスンファイルとの構造の違いが問題を引き起こした

### 解決手順

#### 1. 型定義の確認
```typescript
// 正しいレッスン型定義
export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content: string;  // ⚠️ 文字列型であることに注意
  codeExamples?: CodeExample[];
  exercises?: Exercise[];
  order?: number;
  // ...
}
```

#### 2. レッスンファイルの正しい構造
```typescript
export const exampleLesson: Lesson = {
  id: 'example',
  title: 'レッスンタイトル',
  description: '説明文',
  order: 1,
  content: `# マークダウン形式のコンテンツ
  
  ここにレッスンの内容を記述します。`,
  codeExamples: [
    {
      id: 'example-1',
      title: 'コード例のタイトル',
      language: 'csharp',
      code: `// コード例`,
      description: '説明'
    }
  ]
};
```

#### 3. キャッシュのクリア

##### Zustandストアのバージョン更新
```typescript
// src/stores/learningStore.ts
export const useLearningStore = create<LearningStore>()(
  persist(
    (set, get) => ({...}),
    {
      name: 'learning-store',
      version: 6, // ← この数値を増やす
    }
  )
);
```

##### ブラウザでの手動クリア
```javascript
// 開発者ツールのコンソールで実行
localStorage.clear();
location.reload();
```

#### 4. 開発サーバーの再起動
```bash
# Ctrl+C で停止後
npm run dev
```

### 今後の開発で気を付けるべきポイント

#### 1. 型定義の遵守
- 新しいレッスンを作成する前に、必ず型定義（`types/index.ts`）を確認する
- TypeScriptの型エラーを無視しない
- VSCodeなどのIDEの型チェック機能を活用する

#### 2. 既存レッスンの参照
- 新しいレッスンを作成する際は、正常に動作している既存のレッスンファイルをテンプレートとして使用する
- 構造やプロパティ名を統一する

#### 3. デバッグログの活用
```typescript
// レッスン選択時のデバッグ
console.log('Selected lesson:', lesson);
console.log('Content type:', typeof lesson.content);
console.log('Has codeExamples:', lesson.codeExamples?.length);
```

#### 4. 段階的な確認
1. レッスンファイルを作成
2. コースのindex.tsにインポート・追加
3. **ブラウザをリロードして表示確認**
4. 問題があればコンソールログを確認
5. 必要に応じてキャッシュクリア

#### 5. コンポーネントの理解
- `LessonViewer`がどのようにレッスンデータを期待しているか理解する
- Markdownコンポーネントに渡すデータは必ず文字列である必要がある

### よくある間違いと対策

| 間違い | 症状 | 対策 |
|--------|------|------|
| `content`をオブジェクトで定義 | "コンテンツの形式が不正です"エラー | `content`は文字列で定義 |
| `codeExamples`プロパティの欠如 | コード例が表示されない | 他のレッスンと同じ構造を使用 |
| 古いキャッシュ | 変更が反映されない | Zustandバージョン更新 or localStorage.clear() |
| 型定義の不一致 | TypeScriptエラー | 型定義ファイルを確認・遵守 |

### 推奨される開発フロー

1. **計画** - どのモジュールに追加するか決定
2. **型確認** - `types/index.ts`で型定義を確認
3. **テンプレート作成** - 既存の正常なレッスンをコピー
4. **内容の編集** - IDとコンテンツを変更
5. **インポート追加** - コースのindex.tsに追加
6. **動作確認** - ブラウザで表示確認
7. **デバッグ** - 問題があればコンソールログ確認
8. **キャッシュクリア** - 必要に応じて実施

### 緊急時のチェックリスト

- [ ] レッスンファイルの`content`は文字列型か？
- [ ] `codeExamples`プロパティは正しく定義されているか？
- [ ] コースのindex.tsに正しくインポート・追加されているか？
- [ ] ブラウザの開発者ツールでエラーは出ていないか？
- [ ] localStorage.clear()を試したか？
- [ ] 開発サーバーを再起動したか？
- [ ] Zustandのバージョンを更新したか？

このドキュメントを参照することで、同様の問題を迅速に解決できるようになります。