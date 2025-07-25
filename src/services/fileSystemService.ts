import type { ProjectFile } from '../hooks/ai/useFileContext';

export interface FileSystemCapabilities {
  canAccessFileSystem: boolean;
  canWatchFiles: boolean;
  canReadFiles: boolean;
  canWriteFiles: boolean;
}

export interface FileChangeEvent {
  type: 'added' | 'modified' | 'deleted';
  path: string;
  timestamp: number;
}

class FileSystemService {
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private fileWatchers: Map<string, number> = new Map();
  private changeListeners: ((event: FileChangeEvent) => void)[] = [];

  constructor() {
    this.initializeCapabilities();
  }

  // File System Access APIの対応状況を確認
  getCapabilities(): FileSystemCapabilities {
    return {
      canAccessFileSystem: 'showDirectoryPicker' in window,
      canWatchFiles: false, // File System Access APIにはwatcherがないため
      canReadFiles: 'showOpenFilePicker' in window,
      canWriteFiles: 'showSaveFilePicker' in window,
    };
  }

  // ディレクトリ選択
  async selectProjectDirectory(): Promise<boolean> {
    if (!this.getCapabilities().canAccessFileSystem) {
      console.warn('File System Access API is not supported');
      return false;
    }

    try {
      this.directoryHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents',
      });

      console.log('📁 Project directory selected:', this.directoryHandle?.name);
      return true;
    } catch (error) {
      if ((error as any).name !== 'AbortError') {
        console.error('Failed to select directory:', error);
      }
      return false;
    }
  }

  // ディレクトリがアクセス可能かチェック
  async checkDirectoryAccess(): Promise<boolean> {
    if (!this.directoryHandle) return false;

    try {
      // Check if permission methods are available
      if ('queryPermission' in this.directoryHandle) {
        const permission = await (this.directoryHandle as any).queryPermission({ mode: 'readwrite' });
        if (permission === 'granted') return true;

        if (permission === 'prompt' && 'requestPermission' in this.directoryHandle) {
          const newPermission = await (this.directoryHandle as any).requestPermission({ mode: 'readwrite' });
          return newPermission === 'granted';
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to check directory access:', error);
      return false;
    }
  }

  // プロジェクト構造のスキャン
  async scanProjectStructure(): Promise<ProjectFile[]> {
    if (!this.directoryHandle || !(await this.checkDirectoryAccess())) {
      return this.getFallbackStructure();
    }

    try {
      const files: ProjectFile[] = [];
      await this.scanDirectory(this.directoryHandle, '', files);
      
      console.log(`📂 Scanned ${files.length} files and directories`);
      return files;
    } catch (error) {
      console.error('Failed to scan project structure:', error);
      return this.getFallbackStructure();
    }
  }

  // ディレクトリの再帰スキャン
  private async scanDirectory(
    dirHandle: FileSystemDirectoryHandle,
    path: string,
    files: ProjectFile[]
  ): Promise<void> {
    const currentPath = path ? `${path}/` : '';

    for await (const [name, handle] of (dirHandle as any).entries()) {
      const fullPath = `${currentPath}${name}`;
      
      // 除外パターン
      if (this.shouldExclude(name)) continue;

      if (handle.kind === 'directory') {
        files.push({
          path: fullPath + '/',
          type: 'directory',
          lastModified: Date.now(),
        });

        // サブディレクトリを再帰的にスキャン
        await this.scanDirectory(handle as FileSystemDirectoryHandle, fullPath, files);
      } else {
        const file = await handle.getFile();
        const extension = this.getFileExtension(name);

        files.push({
          path: fullPath,
          type: 'file',
          extension,
          size: file.size,
          lastModified: file.lastModified,
        });
      }
    }
  }

  // ファイル除外パターン
  private shouldExclude(name: string): boolean {
    const excludePatterns = [
      'node_modules',
      '.git',
      '.vscode',
      'dist',
      'build',
      '.next',
      'coverage',
      '.nyc_output',
      '.DS_Store',
      'Thumbs.db'
    ];

    return excludePatterns.includes(name) || name.startsWith('.');
  }

  // ファイル拡張子の取得
  private getFileExtension(filename: string): string | undefined {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) return undefined;
    return filename.slice(lastDot + 1);
  }

  // ファイル内容の読み取り
  async readFile(path: string): Promise<string | null> {
    if (!this.directoryHandle || !(await this.checkDirectoryAccess())) {
      return this.getMockFileContent(path);
    }

    try {
      const fileHandle = await this.getFileHandle(path);
      if (!fileHandle) return null;

      const file = await fileHandle.getFile();
      return await file.text();
    } catch (error) {
      console.error(`Failed to read file ${path}:`, error);
      return this.getMockFileContent(path);
    }
  }

  // ファイルへの書き込み
  async writeFile(path: string, content: string): Promise<boolean> {
    if (!this.directoryHandle || !(await this.checkDirectoryAccess())) {
      console.warn('Cannot write file: no directory access');
      return false;
    }

    try {
      const fileHandle = await this.getFileHandle(path, true);
      if (!fileHandle) return false;

      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      console.log(`📝 File written: ${path}`);
      this.notifyFileChange('modified', path);
      return true;
    } catch (error) {
      console.error(`Failed to write file ${path}:`, error);
      return false;
    }
  }

  // ファイルハンドルの取得
  private async getFileHandle(
    path: string, 
    create: boolean = false
  ): Promise<FileSystemFileHandle | null> {
    if (!this.directoryHandle) return null;

    try {
      const parts = path.split('/').filter(Boolean);
      let currentHandle: FileSystemDirectoryHandle = this.directoryHandle;

      // ディレクトリ部分を辿る
      for (let i = 0; i < parts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(parts[i], { create });
      }

      // ファイルハンドルを取得
      const fileName = parts[parts.length - 1];
      return await currentHandle.getFileHandle(fileName, { create });
    } catch (error) {
      if (!create) {
        console.warn(`File not found: ${path}`);
      } else {
        console.error(`Failed to get file handle for ${path}:`, error);
      }
      return null;
    }
  }

  // ファイル監視（ポーリング方式）
  startWatching(interval: number = 5000): void {
    if (!this.directoryHandle) {
      console.warn('Cannot start watching: no directory selected');
      return;
    }

    // 既存の監視を停止
    this.stopWatching();

    // ポーリングによる変更検出
    const watcherId = window.setInterval(async () => {
      await this.checkForChanges();
    }, interval);

    this.fileWatchers.set('main', watcherId);
    console.log(`👁️ Started watching files (polling every ${interval}ms)`);
  }

  // ファイル監視の停止
  stopWatching(): void {
    this.fileWatchers.forEach((watcherId) => {
      clearInterval(watcherId);
    });
    this.fileWatchers.clear();
    console.log('👁️ Stopped watching files');
  }

  // 変更検出（簡易実装）
  private async checkForChanges(): Promise<void> {
    // 実際の実装では、前回のスキャン結果と比較して変更を検出
    // 現在は簡易的な実装
    console.log('🔍 Checking for file changes...');
  }

  // ファイル変更通知
  private notifyFileChange(type: FileChangeEvent['type'], path: string): void {
    const event: FileChangeEvent = {
      type,
      path,
      timestamp: Date.now(),
    };

    this.changeListeners.forEach(listener => listener(event));
  }

  // 変更イベントリスナーの追加
  addChangeListener(listener: (event: FileChangeEvent) => void): void {
    this.changeListeners.push(listener);
  }

  // 変更イベントリスナーの削除
  removeChangeListener(listener: (event: FileChangeEvent) => void): void {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  // プロジェクト統計の計算
  calculateProjectStats(files: ProjectFile[]): {
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
  } {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      fileTypes: {} as Record<string, number>,
    };

    files.forEach(file => {
      if (file.type === 'file') {
        stats.totalFiles++;
        stats.totalSize += file.size || 0;

        if (file.extension) {
          stats.fileTypes[file.extension] = (stats.fileTypes[file.extension] || 0) + 1;
        }
      }
    });

    return stats;
  }

  // フォールバック実装
  private getFallbackStructure(): ProjectFile[] {
    return [
      { path: 'src/', type: 'directory', lastModified: Date.now() },
      { path: 'src/App.tsx', type: 'file', extension: 'tsx', size: 2048, lastModified: Date.now() },
      { path: 'src/components/', type: 'directory', lastModified: Date.now() },
      { path: 'package.json', type: 'file', extension: 'json', size: 1024, lastModified: Date.now() },
      { path: 'tsconfig.json', type: 'file', extension: 'json', size: 512, lastModified: Date.now() },
    ];
  }

  private getMockFileContent(path: string): string {
    if (path.endsWith('.tsx') || path.endsWith('.ts')) {
      return `// ${path}
import React from 'react';

export function Component() {
  return (
    <div>
      {/* Mock content for ${path} */}
    </div>
  );
}

export default Component;`;
    }

    if (path.endsWith('.json')) {
      return `{
  "name": "mock-file",
  "version": "1.0.0",
  "description": "Mock content for ${path}"
}`;
    }

    return `Mock content for file: ${path}`;
  }

  // 初期化
  private initializeCapabilities(): void {
    const caps = this.getCapabilities();
    console.log('📋 File System capabilities:', caps);

    if (!caps.canAccessFileSystem) {
      console.warn('⚠️ File System Access API not supported. Using fallback mode.');
    }
  }

  // 現在の状態を取得
  getStatus() {
    return {
      hasDirectoryAccess: !!this.directoryHandle,
      isWatching: this.fileWatchers.size > 0,
      capabilities: this.getCapabilities(),
    };
  }
}

// シングルトンインスタンス
export const fileSystemService = new FileSystemService(); 