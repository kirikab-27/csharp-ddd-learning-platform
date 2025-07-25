import Anthropic from '@anthropic-ai/sdk';
import { claude } from '@instantlyeasy/claude-code-sdk-ts';

export type AIProvider = 'claude-code-sdk' | 'anthropic-api' | 'mock-provider';

export interface AIProviderConfig {
  provider: AIProvider;
  isAvailable: boolean;
  lastError?: string;
  responseTime?: number;
}

export interface HybridAIRequest {
  message: string;
  systemPrompt?: string;
  context?: any;
  preferredProvider?: AIProvider;
  requestInfo?: {
    ip: string;
    userAgent: string;
    isLocal: boolean;
  };
}

export interface HybridAIResponse {
  response: string;
  provider: AIProvider;
  model: string;
  timestamp: string;
  mode: string;
}

class HybridAIService {
  private anthropic?: Anthropic;
  private providerStatus: Map<AIProvider, AIProviderConfig> = new Map();
  
  constructor() {
    this.initializeProviders();
  }

  private async initializeProviders() {
    // Anthropic API初期化
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      await this.testAnthropicAPI();
    } else {
      this.setProviderStatus('anthropic-api', false, 'API key not configured');
    }

    // Claude Code SDK初期化
    await this.testClaudeCodeSDK();

    // Mock Provider (常に利用可能)
    this.setProviderStatus('mock-provider', true);
    
    console.log('🔧 AI Providers initialized:', this.getProviderStatus());
  }

  private async testClaudeCodeSDK(): Promise<void> {
    try {
      // Claude CLIの存在確認
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      await execAsync('which claude');
      
      // 簡単なテストクエリ
      const testResponse = await claude()
        .withModel('sonnet')
        .skipPermissions()
        .query('test')
        .asText();
      
      if (testResponse) {
        this.setProviderStatus('claude-code-sdk', true);
        console.log('✅ Claude Code SDK available');
      } else {
        this.setProviderStatus('claude-code-sdk', false, 'Test query failed');
      }
    } catch (error) {
      this.setProviderStatus('claude-code-sdk', false, error.message);
      console.log('⚠️ Claude Code SDK not available:', error.message);
    }
  }

  private async testAnthropicAPI(): Promise<void> {
    try {
      if (!this.anthropic) {
        throw new Error('Anthropic client not initialized');
      }

      // 簡単なテストクエリ
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      });

      if (response.content[0].type === 'text') {
        this.setProviderStatus('anthropic-api', true);
        console.log('✅ Anthropic API available');
      }
    } catch (error) {
      this.setProviderStatus('anthropic-api', false, error.message);
      console.log('⚠️ Anthropic API not available:', error.message);
    }
  }

  private setProviderStatus(provider: AIProvider, isAvailable: boolean, error?: string) {
    this.providerStatus.set(provider, {
      provider,
      isAvailable,
      lastError: error,
      responseTime: undefined
    });
  }

  public getProviderStatus(): Record<AIProvider, AIProviderConfig> {
    const status: Record<AIProvider, AIProviderConfig> = {} as any;
    this.providerStatus.forEach((config, provider) => {
      status[provider] = config;
    });
    return status;
  }

  public selectOptimalProvider(request: HybridAIRequest): AIProvider {
    const { preferredProvider, requestInfo } = request;

    // 手動選択がある場合は優先
    if (preferredProvider && this.isProviderAvailable(preferredProvider)) {
      console.log(`🎯 Using preferred provider: ${preferredProvider}`);
      return preferredProvider;
    }

    // 自動選択ロジック
    const isLocal = requestInfo?.isLocal || false;
    const isWindows = process.platform === 'win32';

    console.log(`🔍 Auto-selecting provider: isLocal=${isLocal}, isWindows=${isWindows}`);

    // 1. ローカル + Windows = Claude Code SDK (無料)
    if (isLocal && isWindows && this.isProviderAvailable('claude-code-sdk')) {
      console.log('✅ Selected: Claude Code SDK (Local Windows)');
      return 'claude-code-sdk';
    }

    // 2. リモートまたは非Windows = Anthropic API
    if (this.isProviderAvailable('anthropic-api')) {
      console.log('✅ Selected: Anthropic API (Remote/WSL)');
      return 'anthropic-api';
    }

    // 3. フォールバック = Mock Provider
    console.log('⚠️ Selected: Mock Provider (Fallback)');
    return 'mock-provider';
  }

  private isProviderAvailable(provider: AIProvider): boolean {
    return this.providerStatus.get(provider)?.isAvailable || false;
  }

  public async processRequest(request: HybridAIRequest): Promise<HybridAIResponse> {
    const startTime = Date.now();
    const selectedProvider = this.selectOptimalProvider(request);
    
    try {
      let result: HybridAIResponse;

      switch (selectedProvider) {
        case 'claude-code-sdk':
          result = await this.processWithClaudeSDK(request);
          break;
        case 'anthropic-api':
          result = await this.processWithAnthropicAPI(request);
          break;
        case 'mock-provider':
        default:
          result = await this.processWithMockProvider(request);
          break;
      }

      // レスポンス時間を記録
      const responseTime = Date.now() - startTime;
      this.updateProviderResponseTime(selectedProvider, responseTime);

      return result;
    } catch (error) {
      console.error(`❌ Error with ${selectedProvider}:`, error);
      
      // エラー時は自動フォールバック
      if (selectedProvider !== 'mock-provider') {
        console.log('🔄 Falling back to mock provider');
        return this.processWithMockProvider(request);
      }
      
      throw error;
    }
  }

  private async processWithClaudeSDK(request: HybridAIRequest): Promise<HybridAIResponse> {
    const { message, systemPrompt } = request;
    
    let enhancedMessage = message;
    if (systemPrompt) {
      enhancedMessage = `${systemPrompt}\n\n${message}`;
    }

    const response = await claude()
      .withModel('sonnet')
      .skipPermissions()
      .query(enhancedMessage)
      .asText();

    return {
      response,
      provider: 'claude-code-sdk',
      model: 'claude-3-5-sonnet',
      timestamp: new Date().toISOString(),
      mode: 'claude-sdk'
    };
  }

  private async processWithAnthropicAPI(request: HybridAIRequest): Promise<HybridAIResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic API not initialized');
    }

    const { message, systemPrompt, context } = request;
    
    // C#学習モードの判定
    const isCSharpLearningMode = context?.mode === 'learning-assistance' || 
                                 context?.mode === 'learning-chat' || 
                                 context?.language === 'csharp';

    let systemMessage = systemPrompt;
    
    // C#学習モード用のシステムプロンプト
    if (isCSharpLearningMode && !systemMessage) {
      systemMessage = `あなたはC#プログラミング専門のアシスタントです。

【必須制約】
- 必ずC#のみで回答し、他の言語の例は一切含めない
- コード例はすべてC#で提供
- .NET Framework/Coreの機能を活用

【学習コンテキスト】
- 目標: ドメイン駆動設計(DDD)への理解
- 対象: C#初学者

【回答スタイル】
- 初心者にも分かりやすく説明
- 実用的なC#コード例を必ず含める
- コメントは日本語で記述
- 将来のDDD実装への道筋を示す

C#に関する質問にのみお答えします。`;
    }

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemMessage,
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    return {
      response: responseText,
      provider: 'anthropic-api',
      model: 'claude-3-5-sonnet-20241022',
      timestamp: new Date().toISOString(),
      mode: isCSharpLearningMode ? 'csharp-api' : 'general-api'
    };
  }

  private async processWithMockProvider(request: HybridAIRequest): Promise<HybridAIResponse> {
    const { message, context } = request;
    
    // C#学習モードの判定
    const isCSharpLearningMode = context?.mode === 'learning-assistance' || 
                                 context?.mode === 'learning-chat' || 
                                 context?.language === 'csharp';

    if (isCSharpLearningMode) {
      // 名前空間に関する質問
      if (message.includes('名前空間') || message.includes('namespace')) {
        return {
          response: `C#における名前空間（namespace）は、関連するクラスや型をグループ化して整理するための仕組みです。

## 基本的な使い方

\`\`\`csharp
// 名前空間の宣言
namespace HelloWorld
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello, World!");
        }
    }
}
\`\`\`

**注意**: 現在はオフラインモードで動作しています。より詳細な回答には、Anthropic API キーの設定またはClaude Code SDKの認証が必要です。`,
          provider: 'mock-provider',
          model: 'mock-csharp',
          timestamp: new Date().toISOString(),
          mode: 'csharp-fallback'
        };
      }

      // 変数に関する質問
      if (message.includes('変数') || message.includes('variable')) {
        return {
          response: `C#の変数は、データを一時的に保存するための入れ物です。

## 基本的な宣言方法

\`\`\`csharp
// 基本データ型
int age = 25;              // 32ビット整数
string name = "Taro";      // 文字列
bool isStudent = true;     // 真偽値
\`\`\`

**注意**: 現在はオフラインモードで動作しています。`,
          provider: 'mock-provider',
          model: 'mock-csharp',
          timestamp: new Date().toISOString(),
          mode: 'csharp-fallback'
        };
      }

      // デフォルトのC#応答
      return {
        response: `C#に関するご質問ありがとうございます！

「${message}」について、より詳細な回答を得るには：

1. **Anthropic API**: 高品質なAI応答
2. **Claude Code SDK**: 無料で無制限利用

現在はオフラインモードで基本的な情報のみ提供しています。`,
        provider: 'mock-provider',
        model: 'mock-csharp',
        timestamp: new Date().toISOString(),
        mode: 'csharp-fallback'
      };
    }

    // 一般モードのフォールバック
    return {
      response: `現在はオフラインモードです。

お使いの環境に応じて以下の設定をご検討ください：

- **ローカル開発**: Claude Code SDK (無料)
- **リモートアクセス**: Anthropic API (従量課金)

ご質問: "${message}"`,
      provider: 'mock-provider',
      model: 'mock-general',
      timestamp: new Date().toISOString(),
      mode: 'general-fallback'
    };
  }

  private updateProviderResponseTime(provider: AIProvider, responseTime: number) {
    const config = this.providerStatus.get(provider);
    if (config) {
      config.responseTime = responseTime;
      this.providerStatus.set(provider, config);
    }
  }

  // ヘルス情報の取得
  public getHealthStatus() {
    return {
      providers: this.getProviderStatus(),
      recommendations: this.getRecommendations()
    };
  }

  private getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (!this.isProviderAvailable('anthropic-api')) {
      recommendations.push('Anthropic API キーを設定すると、高品質なAI応答が利用できます');
    }
    
    if (!this.isProviderAvailable('claude-code-sdk')) {
      recommendations.push('Claude Code SDKを設定すると、無料で無制限にAI機能を利用できます');
    }
    
    return recommendations;
  }
}

export const hybridAIService = new HybridAIService();