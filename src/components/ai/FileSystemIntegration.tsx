import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FolderOpen, 
  Eye, 
  EyeOff, 
  FileText, 
  Folder, 
  AlertCircle, 
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { fileSystemService } from '../../services/fileSystemService';
import type { FileChangeEvent } from '../../services/fileSystemService';

// 一時的なProjectFile型定義（TODO: fileSystemServiceから適切にエクスポートする）
interface ProjectFile {
  path: string;
  name: string;
  size: number;
  type: string;
  lastModified: Date;
}

const FileSystemIntegration: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [capabilities] = useState(fileSystemService.getCapabilities());
  // setCapabilities は将来のcapabilities更新機能用
  const [recentChanges, setRecentChanges] = useState<FileChangeEvent[]>([]);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    fileTypes: {} as Record<string, number>
  });

  useEffect(() => {
    // 初期状態の取得
    const status = fileSystemService.getStatus();
    setIsConnected(status.hasDirectoryAccess);
    setIsWatching(status.isWatching);

    // ファイル変更リスナーの設定
    const handleFileChange = (event: FileChangeEvent) => {
      setRecentChanges(prev => [event, ...prev.slice(0, 9)]); // 最新10件まで保持
    };

    fileSystemService.addChangeListener(handleFileChange);

    return () => {
      fileSystemService.removeChangeListener(handleFileChange);
    };
  }, []);

  const handleSelectDirectory = async () => {
    setIsLoading(true);
    try {
      const success = await fileSystemService.selectProjectDirectory();
      if (success) {
        setIsConnected(true);
        await refreshProjectStructure();
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProjectStructure = async () => {
    setIsLoading(true);
    try {
      const files = await fileSystemService.scanProjectStructure();
      setProjectFiles(files as unknown as ProjectFile[]); // TODO: fileSystemServiceの型定義を修正
      
      const newStats = fileSystemService.calculateProjectStats(files);
      setStats(newStats);
    } catch (error) {
      console.error('Failed to refresh project structure:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWatching = () => {
    if (isWatching) {
      fileSystemService.stopWatching();
      setIsWatching(false);
    } else {
      fileSystemService.startWatching();
      setIsWatching(true);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: ProjectFile) => {
    if (file.type === 'directory') {
      return <Folder className="w-4 h-4 text-blue-500" />;
    }
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">ファイルシステム統合</h3>
          <p className="text-sm text-gray-600">プロジェクトディレクトリの管理と監視</p>
        </div>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          )}
        </div>
      </div>

      {/* 対応状況 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">ブラウザサポート状況</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span>ディレクトリアクセス</span>
            <span className={capabilities.canAccessFileSystem ? 'text-green-600' : 'text-red-600'}>
              {capabilities.canAccessFileSystem ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>ファイル読み取り</span>
            <span className={capabilities.canReadFiles ? 'text-green-600' : 'text-red-600'}>
              {capabilities.canReadFiles ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>ファイル書き込み</span>
            <span className={capabilities.canWriteFiles ? 'text-green-600' : 'text-red-600'}>
              {capabilities.canWriteFiles ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>リアルタイム監視</span>
            <span className="text-yellow-600">ポーリング</span>
          </div>
        </div>
      </div>

      {/* プロジェクト接続 */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">プロジェクト接続</h4>
        
        {!isConnected ? (
          <div className="text-center py-8">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              プロジェクトディレクトリを選択してAI機能を強化しましょう
            </p>
            <button
              onClick={handleSelectDirectory}
              disabled={isLoading || !capabilities.canAccessFileSystem}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'アクセス中...' : 'ディレクトリを選択'}
            </button>
            {!capabilities.canAccessFileSystem && (
              <p className="text-sm text-red-600 mt-2">
                お使いのブラウザはFile System Access APIに対応していません
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* プロジェクト統計 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalFiles}</div>
                  <div className="text-sm text-gray-600">ファイル</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{formatFileSize(stats.totalSize)}</div>
                  <div className="text-sm text-gray-600">総サイズ</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{Object.keys(stats.fileTypes).length}</div>
                  <div className="text-sm text-gray-600">ファイル形式</div>
                </div>
              </div>
            </div>

            {/* ファイル監視コントロール */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {isWatching ? (
                  <Eye className="w-5 h-5 text-green-500" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <div className="font-medium">ファイル監視</div>
                  <div className="text-sm text-gray-600">
                    {isWatching ? 'ファイル変更を監視中' : 'ファイル監視が停止中'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshProjectStructure}
                  disabled={isLoading}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="構造を更新"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={toggleWatching}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isWatching
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {isWatching ? '監視停止' : '監視開始'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ファイル構造表示 */}
      {isConnected && projectFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">プロジェクト構造</h4>
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            {projectFiles.slice(0, 20).map((file, index) => (
              <motion.div
                key={file.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center space-x-2 py-1 text-sm"
              >
                {getFileIcon(file)}
                <span className="flex-1 truncate">{file.path}</span>
                {file.size && (
                  <span className="text-gray-500 text-xs">
                    {formatFileSize(file.size)}
                  </span>
                )}
              </motion.div>
            ))}
            {projectFiles.length > 20 && (
              <div className="text-center text-gray-500 text-sm mt-2">
                ...他{projectFiles.length - 20}ファイル
              </div>
            )}
          </div>
        </div>
      )}

      {/* ファイル形式分布 */}
      {isConnected && Object.keys(stats.fileTypes).length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">ファイル形式分布</h4>
          <div className="space-y-2">
            {Object.entries(stats.fileTypes)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 8)
              .map(([ext, count]) => (
              <div key={ext} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">.{ext}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${(count / Math.max(...Object.values(stats.fileTypes))) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-gray-500 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最近の変更 */}
      {recentChanges.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">最近の変更</h4>
          <div className="space-y-2">
            {recentChanges.slice(0, 5).map((change) => (
              <div key={`${change.path}-${change.timestamp}`} className="flex items-center space-x-3 text-sm p-2 bg-gray-50 rounded">
                <div className={`w-2 h-2 rounded-full ${
                  change.type === 'added' ? 'bg-green-500' :
                  change.type === 'modified' ? 'bg-blue-500' : 'bg-red-500'
                }`} />
                <span className="flex-1 truncate">{change.path}</span>
                <span className="text-gray-500">
                  {new Date(change.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileSystemIntegration; 