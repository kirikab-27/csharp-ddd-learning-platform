# ハイブリッドAIシステム実装ガイド

## 概要

本プロジェクトでは、異なる環境やニーズに対応するため、3つのAIプロバイダーを統合したハイブリッドAIシステムを実装しています。このドキュメントでは、システムの設計思想、実装詳細、および使用方法について説明します。

## 目次

1. [システム構成](#システム構成)
2. [プロバイダー詳細](#プロバイダー詳細)
3. [自動選択ロジック](#自動選択ロジック)
4. [実装詳細](#実装詳細)
5. [UI統合](#ui統合)
6. [トラブルシューティング](#トラブルシューティング)

## システム構成

### アーキテクチャ概要

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude Code    │     │  Anthropic      │     │     Mock        │
│     SDK         │     │     API         │     │   Provider      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                         │
         └───────────────┬───────┴─────────────────────────┘
                         │
                  ┌──────┴──────┐
                  │  Hybrid AI   │
                  │   Service    │
                  └──────┬──────┘
                         │
              ┌──────────┴──────────┐
              │   Express Server    │
              └──────────┬──────────┘
                         │
              ┌──────────┴──────────┐
              │   React Frontend    │
              └─────────────────────┘
```

### 主要コンポーネント

1. **`hybridAIService.ts`**: コアロジックとプロバイダー管理
2. **`AIProviderSelector.tsx`**: UI選択コンポーネント
3. **`server/index.ts`**: APIエンドポイント統合

## プロバイダー詳細

### 1. Claude Code SDK
- **用途**: ローカル開発環境での無料・無制限利用
- **要件**: Claude CLIのインストールと認証
- **特徴**: 
  - 高速レスポンス
  - ファイルシステムアクセス
  - コード実行機能

### 2. Anthropic API
- **用途**: リモートアクセス、本番環境
- **要件**: APIキーの設定（`ANTHROPIC_API_KEY`）
- **特徴**:
  - 高品質な応答
  - スケーラブル
  - 従量課金制

### 3. Mock Provider
- **用途**: オフライン環境、フォールバック
- **要件**: なし（常に利用可能）
- **特徴**:
  - 基本的な応答のみ
  - インターネット接続不要
  - テスト用途

## 自動選択ロジック

### 選択優先順位

```typescript
public selectOptimalProvider(request: HybridAIRequest): AIProvider {
  // 1. 手動選択がある場合は優先
  if (preferredProvider && this.isProviderAvailable(preferredProvider)) {
    return preferredProvider;
  }

  // 2. 環境に基づく自動選択
  const isLocal = requestInfo?.isLocal || false;
  const isWindows = process.platform === 'win32';

  // ローカル + Windows = Claude Code SDK
  if (isLocal && isWindows && this.isProviderAvailable('claude-code-sdk')) {
    return 'claude-code-sdk';
  }

  // リモートまたは非Windows = Anthropic API
  if (this.isProviderAvailable('anthropic-api')) {
    return 'anthropic-api';
  }

  // フォールバック = Mock Provider
  return 'mock-provider';
}
```

### リクエスト情報の判定

```typescript
function analyzeRequest(req: express.Request) {
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  
  const isLocal = ip === '127.0.0.1' || 
                  ip === '::1' || 
                  ip.startsWith('192.168.') || 
                  ip.startsWith('10.') || 
                  ip.startsWith('172.');

  return { ip, userAgent, isLocal };
}
```

## 実装詳細

### サーバー側の実装

#### 1. ヘルスチェックエンドポイント

```typescript
app.get('/api/health', (req, res) => {
  const requestInfo = analyzeRequest(req);
  const aiHealth = hybridAIService.getHealthStatus();
  
  res.json({ 
    status: 'ok',
    ai: {
      ...aiHealth,
      currentProvider: hybridAIService.selectOptimalProvider({
        message: 'test',
        requestInfo
      }),
      selectionMode: 'auto'
    },
    requestInfo,
    capabilities: {
      chat: true,
      codeExecution: true,
      fileOperations: true,
      projectAnalysis: true,
      hybridAI: true
    }
  });
});
```

#### 2. チャットエンドポイント

```typescript
app.post('/api/ai/chat', async (req, res) => {
  const { message, systemPrompt, context, preferredProvider } = req.body;
  const requestInfo = analyzeRequest(req);

  const hybridRequest: HybridAIRequest = {
    message,
    systemPrompt,
    context,
    preferredProvider,
    requestInfo
  };

  const result = await hybridAIService.processRequest(hybridRequest);
  res.json(result);
});
```

### フロントエンド側の実装

#### ChatInterface統合

```typescript
const requestBody = {
  message: userInput,
  systemPrompt: systemPrompt,
  context: {
    mode: 'learning-chat',
    language: 'csharp',
    courseType: 'C# to DDD Learning Platform',
    currentLesson: context?.currentLesson?.title,
    strict: true
  },
  preferredProvider: selectedProvider !== 'auto' ? selectedProvider : undefined
};
```

## UI統合

### AIProviderSelector コンポーネント

#### 基本構造

```typescript
export const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  className = ''
}) => {
  const [providerStatus, setProviderStatus] = useState<Record<AIProvider, AIProviderConfig>>();
  
  // プロバイダーステータスを定期的に更新
  useEffect(() => {
    fetchProviderStatus();
    const interval = setInterval(fetchProviderStatus, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // ...
};
```

#### 主な機能

1. **リアルタイムステータス表示**
   - 各プロバイダーの利用可能状態
   - レスポンスタイム
   - エラー情報

2. **視覚的フィードバック**
   - 色分けされたステータスインジケーター
   - アイコンによる直感的な表示
   - 推奨プロバイダーの強調表示

3. **ユーザー制御**
   - 自動選択モード
   - 手動プロバイダー選択
   - 選択の永続化（セッション内）

### ChatInterfaceへの統合

```typescript
export function ChatInterface({ isOnline, context }: ChatInterfaceProps) {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('auto');
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="h-full flex flex-col">
      {/* 設定エリア */}
      <div className="border-b bg-white">
        <button onClick={() => setShowSettings(!showSettings)}>
          <Settings className="w-5 h-5" />
        </button>
        
        {showSettings && (
          <AIProviderSelector
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
          />
        )}
      </div>
      
      {/* チャットエリア */}
      {/* ... */}
    </div>
  );
}
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. Claude Code SDKが利用できない

**症状**: プロバイダーステータスで「利用不可」と表示される

**原因と解決方法**:
- Claude CLIがインストールされていない → `npm install -g @anthropic-ai/claude-code`
- 認証されていない → `claude login`
- WSL環境での制限 → Anthropic APIを使用

#### 2. Anthropic APIが利用できない

**症状**: API呼び出しがエラーになる

**原因と解決方法**:
- APIキーが設定されていない → `.env`ファイルに`ANTHROPIC_API_KEY`を設定
- レート制限 → 少し待ってから再試行
- ネットワークエラー → プロキシ設定を確認

#### 3. 自動選択が期待通りに動作しない

**症状**: 意図しないプロバイダーが選択される

**原因と解決方法**:
- IPアドレスの判定ミス → `requestInfo`のログを確認
- プロバイダーの状態更新遅延 → 手動で状態更新ボタンをクリック

### パフォーマンス最適化

1. **プロバイダー状態のキャッシュ**
   - 30秒ごとの自動更新
   - 手動更新オプション

2. **レスポンスタイム監視**
   - 各プロバイダーの応答時間を記録
   - 遅いプロバイダーの自動回避

3. **フォールバック戦略**
   - エラー時の自動切り替え
   - ユーザーへの通知

## 今後の拡張計画

1. **プロバイダーの追加**
   - Google Vertex AI
   - Azure OpenAI Service
   - ローカルLLM（Ollama等）

2. **高度な選択ロジック**
   - コスト最適化モード
   - 品質優先モード
   - レイテンシ優先モード

3. **分析機能**
   - 使用統計の収集
   - コスト分析
   - パフォーマンスレポート

## まとめ

ハイブリッドAIシステムにより、以下が実現されました：

- **柔軟性**: 様々な環境での動作
- **信頼性**: フォールバック機能による高可用性
- **経済性**: 無料オプションの活用
- **ユーザビリティ**: 直感的なUI操作

このシステムは、開発環境から本番環境まで、シームレスなAI体験を提供します。