import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, ArrowRight, Lightbulb, Star } from 'lucide-react';
import { knowledgeService, type SearchResult, type KnowledgeEntry, type ContextualSuggestion } from '../../services/knowledgeService';
import { useFileContext } from '../../hooks/ai/useFileContext';

interface KnowledgeBaseProps {
  isOnline: boolean;
  context?: {
    mode?: 'learning' | 'general';
    currentLesson?: any;
  };
}

export function KnowledgeBase({ isOnline: _isOnline, context: _context }: KnowledgeBaseProps) {
  // _isOnline, _context は将来の機能拡張用
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [contextualSuggestions, setContextualSuggestions] = useState<ContextualSuggestion[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { fileContext } = useFileContext();

  // 検索実行
  const handleSearch = (query: string) => {
    if (query.trim()) {
      const results = knowledgeService.search(query.trim());
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  // コンテキスト提案の取得
  useEffect(() => {
    const suggestions = knowledgeService.getContextualSuggestions(fileContext);
    setContextualSuggestions(suggestions);
  }, [fileContext]);

  // カテゴリフィルター
  const categories = [
    { id: 'all', label: 'すべて' },
    { id: 'pattern', label: 'パターン' },
    { id: 'solution', label: '解決策' },
    { id: 'example', label: '例' },
    { id: 'note', label: 'ノート' }
  ];

  const filteredEntries = activeCategory === 'all' 
    ? knowledgeService.getAllEntries()
    : knowledgeService.getEntriesByCategory(activeCategory as KnowledgeEntry['category']);

  const getCategoryIcon = (category: KnowledgeEntry['category']) => {
    switch (category) {
      case 'pattern': return '🏗️';
      case 'solution': return '💡';
      case 'example': return '📝';
      case 'note': return '📋';
      default: return '📚';
    }
  };

  const getPriorityColor = (priority: ContextualSuggestion['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 検索バー */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="知識を検索..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="flex-1 overflow-hidden">
        {selectedEntry ? (
          /* 詳細表示 */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-full flex flex-col"
          >
            {/* ヘッダー */}
            <div className="p-4 border-b">
              <button
                onClick={() => setSelectedEntry(null)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm mb-2"
              >
                ← 戻る
              </button>
              <h3 className="font-semibold text-gray-900">{selectedEntry.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg">{getCategoryIcon(selectedEntry.category)}</span>
                <span className="text-xs text-gray-500 capitalize">{selectedEntry.category}</span>
                <div className="flex gap-1">
                  {selectedEntry.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* コンテンツ */}
            <div className="flex-1 overflow-y-auto p-4">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: selectedEntry.content.replace(/```(\w+)?\n([\s\S]*?)```/g, 
                    '<pre class="bg-gray-100 p-3 rounded-lg overflow-x-auto"><code>$2</code></pre>'
                  )
                }}
              />

              {/* 関連エントリー */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-3">関連する知識</h4>
                <div className="space-y-2">
                  {knowledgeService.getRelatedEntries(selectedEntry.id).map((entry, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedEntry(entry)}
                      className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(entry.category)}</span>
                        <span className="font-medium text-sm">{entry.title}</span>
                        <ArrowRight size={12} className="text-gray-400 ml-auto" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* 一覧表示 */
          <div className="h-full flex flex-col">
            {/* コンテキスト提案 */}
            {contextualSuggestions.length > 0 && (
              <div className="p-4 border-b bg-blue-50">
                <h4 className="flex items-center gap-2 font-medium text-gray-900 mb-3">
                  <Lightbulb size={16} className="text-blue-600" />
                  現在のコンテキストに基づく提案
                </h4>
                <div className="space-y-2">
                  {contextualSuggestions.slice(0, 3).map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-lg ${getPriorityColor(suggestion.priority)}`}
                    >
                      <div className="flex items-start gap-2">
                        <Star size={14} className="mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{suggestion.title}</div>
                          <div className="text-xs mt-1">{suggestion.description}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* カテゴリフィルター */}
            <div className="p-4 border-b">
              <div className="flex gap-2 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                      activeCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* エントリー一覧 */}
            <div className="flex-1 overflow-y-auto">
              {searchResults.length > 0 ? (
                /* 検索結果 */
                <div className="p-4">
                  <div className="text-sm text-gray-600 mb-3">
                    {searchResults.length}件の検索結果
                  </div>
                  <div className="space-y-3">
                    {searchResults.map((result, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setSelectedEntry(result.entry)}
                        className="w-full p-3 text-left bg-white border border-gray-200 hover:border-blue-300 rounded-lg transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg flex-shrink-0">
                            {getCategoryIcon(result.entry.category)}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              {result.entry.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {result.entry.tags.join(' • ')}
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              スコア: {result.score} • {result.matchType}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                /* 全エントリー */
                <div className="p-4">
                  <div className="space-y-3">
                    {filteredEntries.map((entry, index) => (
                      <motion.button
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedEntry(entry)}
                        className="w-full p-3 text-left bg-white border border-gray-200 hover:border-blue-300 rounded-lg transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg flex-shrink-0">
                            {getCategoryIcon(entry.category)}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              {entry.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {entry.tags.join(' • ')}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(entry.lastUpdated).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="p-3 border-t bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {knowledgeService.getAllEntries().length}個の知識エントリー
          </span>
          {fileContext.currentFile && (
            <span>
              📁 {fileContext.currentFile}
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 