import type { AIAnalysisResult, AIServiceConfig, AIServiceStatus } from '../types/ai';
import { claudeApiService } from './claudeApiService';
import { fileSystemService } from './fileSystemService';
import { knowledgeService } from './knowledgeService';

class AIService {
  private config: AIServiceConfig = {
    preferredModel: 'sonnet',
    enableOfflineFallback: true,
    timeout: 30000,
    retryAttempts: 3
  };

  private status: AIServiceStatus = {
    isOnline: false,
    successCount: 0,
    errorCount: 0,
    lastHealthCheck: Date.now(),
    config: this.config
  };

  constructor() {
    console.log('🚀 AIService constructor called');
    this.initializeService();
  }

  private async initializeService() {
    console.log('🤖 Initializing AI Service Phase 3...');
    
    // Claude API接続確認
    await this.checkClaudeConnection();
    
    // File System capabilities確認
    const fsCapabilities = fileSystemService.getCapabilities();
    console.log('📁 File System capabilities:', fsCapabilities);
    
    // 定期的なヘルスチェック
    this.startHealthCheck();
  }

  private async checkClaudeConnection(): Promise<void> {
    try {
      console.log('🔍 Starting Claude API health check...');
      
      if (claudeApiService.isConfigured()) {
        console.log('✓ Claude API is configured');
        const isHealthy = await claudeApiService.healthCheck();
        console.log('🩺 Health check result:', isHealthy);
        
        this.status.isOnline = isHealthy;
        
        if (isHealthy) {
          console.log('✅ Claude API connection established - ONLINE MODE');
          this.status.successCount++;
        } else {
          console.warn('⚠️ Claude API health check failed - using fallback mode');
          this.status.errorCount++;
        }
      } else {
        console.warn('⚠️ Claude API not configured - using fallback mode');
        this.status.isOnline = false;
      }
    } catch (error) {
      console.error('❌ Claude API connection error - using fallback mode:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : '');
      this.status.isOnline = false;
      this.status.errorCount++;
    }
    
    this.status.lastHealthCheck = Date.now();
    console.log('📊 Final status: isOnline =', this.status.isOnline);
  }

  // APIキーの設定
  setApiKey(_apiKey: string): boolean {
    // Note: Claude API service doesn't have setApiKey method currently
    // The API key is managed at the server level
    console.log('API key configuration requested, but handled at server level');
    this.checkClaudeConnection();
    return true;
  }

  // コード分析（Phase 3強化版）
  async analyzeCode(code: string, context?: string): Promise<AIAnalysisResult | null> {
    try {
      // プロジェクトコンテキストを追加
      const projectContext = await this.getProjectContext();
      const fullContext = context ? `${context}\n\n${projectContext}` : projectContext;

      // Claude APIを優先使用
      if (claudeApiService.isConfigured()) {
        const result = await claudeApiService.analyzeCode(code, fullContext);
        if (result) {
          this.status.successCount++;
          
          // 知識ベースに結果を記録（学習機能）
          await this.recordAnalysisResult(code, result);
          
          return result;
        }
      }

      // フォールバック: ローカル知識ベース + パターン分析
      return await this.fallbackAnalysis(code, fullContext);
      
    } catch (error) {
      console.error('AI analysis failed:', error);
      this.status.errorCount++;
      return null;
    }
  }

  // チャット（Phase 3強化版）
  async generateCode(message: string): Promise<string | null> {
    try {
      // プロジェクトコンテキストを追加
      const projectContext = await this.getProjectContext();
      
      // Claude APIを優先使用
      if (claudeApiService.isConfigured()) {
        const response = await claudeApiService.chat(message, projectContext);
        if (response) {
          this.status.successCount++;
          return response;
        }
      }

      // フォールバック: 知識ベース検索 + 定型応答
      return await this.fallbackChat(message);
      
    } catch (error) {
      console.error('AI chat failed:', error);
      this.status.errorCount++;
      return null;
    }
  }

  // プロジェクトコンテキストの取得（Phase 3新機能）
  private async getProjectContext(): Promise<string> {
    try {
      // File Systemからプロジェクト構造を取得
      const projectFiles = await fileSystemService.scanProjectStructure();
      const stats = fileSystemService.calculateProjectStats(projectFiles);
      
      // 現在のファイル情報
      const fsStatus = fileSystemService.getStatus();
      
      const context = `
## プロジェクト情報 (Phase 3)
- ファイル数: ${stats.totalFiles}
- 総サイズ: ${(stats.totalSize / 1024).toFixed(1)}KB
- ファイルタイプ: ${Object.entries(stats.fileTypes).map(([ext, count]) => `${ext}(${count})`).join(', ')}
- ディレクトリアクセス: ${fsStatus.hasDirectoryAccess ? '有効' : '無効'}
- ファイル監視: ${fsStatus.isWatching ? '有効' : '無効'}

## 最近のファイル
${projectFiles.filter(f => f.type === 'file').slice(0, 10).map(f => `- ${f.path}`).join('\n')}
      `.trim();

      return context;
    } catch (error) {
      console.error('Failed to get project context:', error);
      return 'プロジェクトコンテキストの取得に失敗しました';
    }
  }

  // 分析結果の記録（学習機能）
  private async recordAnalysisResult(code: string, result: AIAnalysisResult): Promise<void> {
    try {
      // 知識ベースに新しいパターンを追加
      if (result.suggestions.length > 0) {
        const existingPatterns = knowledgeService.search('pattern');
        const isNewPattern = !existingPatterns.some(p => 
          p.entry.content.includes(result.suggestions[0])
        );

        if (isNewPattern) {
          knowledgeService.addEntry({
            title: `コード改善パターン: ${new Date().toLocaleDateString()}`,
            content: `
## 分析されたコード
\`\`\`typescript
${code.slice(0, 200)}${code.length > 200 ? '...' : ''}
\`\`\`

## 検出された問題
${result.potentialIssues.map(issue => `- ${issue}`).join('\n')}

## 改善提案
${result.suggestions.map(suggestion => `- ${suggestion}`).join('\n')}

## 説明
${result.explanation}
            `,
            tags: ['analysis', 'pattern', 'improvement'],
            category: 'pattern'
          });

          console.log('📚 New pattern added to knowledge base');
        }
      }
    } catch (error) {
      console.error('Failed to record analysis result:', error);
    }
  }

  // フォールバック分析
  private async fallbackAnalysis(code: string, _context?: string): Promise<AIAnalysisResult> {
    // 知識ベースから関連パターンを検索
    const codeLanguage = this.detectLanguage(code);
    const relatedKnowledge = knowledgeService.search(codeLanguage);
    
    // 基本的なコード分析
    const lines = code.split('\n').length;
    const hasTypes = code.includes(': ') || code.includes('interface ');
    const hasComments = code.includes('//') || code.includes('/*');
    const complexity = this.calculateComplexity(code);
    
    let quality: 'high' | 'medium' | 'low' = 'medium';
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 品質判定
    if (complexity < 5 && hasTypes && hasComments) {
      quality = 'high';
    } else if (complexity > 15 || (!hasTypes && codeLanguage === 'typescript')) {
      quality = 'low';
    }

    // 問題検出
    if (!hasTypes && codeLanguage === 'typescript') {
      issues.push('TypeScript型注釈が不足しています');
      suggestions.push('適切な型定義を追加してください');
    }
    
    if (!hasComments && lines > 10) {
      issues.push('コメントが不足しています');
      suggestions.push('コードの意図を説明するコメントを追加してください');
    }
    
    if (complexity > 10) {
      issues.push('関数が複雑すぎます');
      suggestions.push('関数を小さく分割することを検討してください');
    }

    // 知識ベースからの提案
    if (relatedKnowledge.length > 0) {
      suggestions.push(`関連パターン: ${relatedKnowledge[0].entry.title} を参照してください`);
    }

    return {
      codeQuality: quality,
      potentialIssues: issues,
      suggestions,
      explanation: `フォールバック分析による結果。複雑度: ${complexity}, 行数: ${lines}`,
      confidence: 0.7,
      source: 'fallback',
      timestamp: Date.now()
    };
  }

  // フォールバックチャット
  private async fallbackChat(message: string): Promise<string> {
    // 知識ベースから関連情報を検索
    const searchResults = knowledgeService.search(message);
    
    if (searchResults.length > 0) {
      const bestMatch = searchResults[0];
      return `知識ベースから関連情報を見つけました:\n\n**${bestMatch.entry.title}**\n\n${bestMatch.entry.content.slice(0, 300)}...\n\n詳細は知識タブでご確認ください。`;
    }

    // 基本的な応答
    const responses = [
      'Claude APIが利用できません。APIキーを設定すると、より詳細な回答が可能になります。',
      'オフラインモードです。知識ベースから関連情報を検索しましたが、該当する情報が見つかりませんでした。',
      'より具体的な質問をしていただけると、知識ベースから適切な情報をお探しできます。'
    ];

    return responses[Math.floor(Math.random() * responses.length)] + `\n\nご質問: "${message}"`;
  }

  // 言語検出
  private detectLanguage(code: string): string {
    if (code.includes('interface ') || code.includes(': ')) return 'typescript';
    if (code.includes('useState') || code.includes('useEffect')) return 'react';
    if (code.includes('function ') || code.includes('const ')) return 'javascript';
    return 'unknown';
  }

  // 複雑度計算
  private calculateComplexity(code: string): number {
    let complexity = 1;
    
    const patterns = [
      /if\s*\(/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /switch\s*\(/g,
      /catch\s*\(/g,
      /\?\s*.*?\s*:/g, // ternary operator
    ];

    patterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) complexity += matches.length;
    });

    return complexity;
  }

  // 定期ヘルスチェック
  private startHealthCheck(): void {
    setInterval(async () => {
      await this.checkClaudeConnection();
    }, 60000); // 1分ごと
  }

  // 設定更新
  updateConfig(config: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.preferredModel) {
      claudeApiService.updateConfig({ model: config.preferredModel as any });
    }
  }

  // ステータス取得
  getStatus(): AIServiceStatus {
    return { ...this.status };
  }

  // ヘルスチェック
  async healthCheck(): Promise<boolean> {
    await this.checkClaudeConnection();
    return this.status.isOnline;
  }

  // Phase 2互換性のための古いメソッド
  get isOnline(): boolean {
    return this.status.isOnline;
  }

  get isLoading(): boolean {
    return false; // Phase 3では個別の操作でローディング状態を管理
  }

  get error(): string | null {
    return this.status.errorCount > 0 ? 'APIエラーが発生しています' : null;
  }

  // 使用統計
  getUsageStats() {
    return {
      aiService: this.status,
      claudeApi: claudeApiService.getUsageStats(),
      fileSystem: fileSystemService.getStatus(),
    };
  }
}

// シングルトンインスタンス
export const aiService = new AIService(); 