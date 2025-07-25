# Vibe AI Template に転用可能なコード

## 設定ファイル

### 1. tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
```

### 2. postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 3. 改善された .env.example
```bash
# ===================================
# Application Configuration
# ===================================
VITE_APP_NAME="Vibe AI Template"
VITE_APP_VERSION="2.0.0"
VITE_APP_ENV="development"

# ===================================
# API Configuration
# ===================================
VITE_API_BASE_URL="http://localhost:3001"
VITE_API_TIMEOUT="30000"
VITE_API_RETRY_COUNT="3"

# ===================================
# AI Services Configuration
# ===================================
# Claude API
VITE_CLAUDE_API_KEY=""
VITE_CLAUDE_MODEL="claude-3-opus-20240229"
VITE_CLAUDE_MAX_TOKENS="4000"

# OpenAI API (Optional)
VITE_OPENAI_API_KEY=""
VITE_OPENAI_MODEL="gpt-4"

# AI Service Selection
VITE_AI_PROVIDER="claude" # claude | openai | hybrid

# ===================================
# Feature Flags
# ===================================
VITE_FEATURE_AI_CHAT="true"
VITE_FEATURE_CODE_EXECUTION="true"
VITE_FEATURE_FILE_UPLOAD="true"
VITE_FEATURE_ANALYTICS="false"
VITE_FEATURE_DEBUG_MODE="false"

# ===================================
# Development Configuration
# ===================================
VITE_DEV_MOCK_API="false"
VITE_DEV_LOG_LEVEL="debug" # debug | info | warn | error
VITE_DEV_SHOW_ERROR_DETAILS="true"

# ===================================
# Security
# ===================================
VITE_ENABLE_CORS="true"
VITE_ALLOWED_ORIGINS="http://localhost:8080,http://localhost:3000"
```

## ユーティリティ関数

### 1. エラーハンドリング (src/utils/errorHandler.ts)
```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = {
  handle: (error: unknown): AppError => {
    if (error instanceof AppError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new AppError(
        error.message,
        'UNKNOWN_ERROR',
        500,
        { originalError: error.stack }
      );
    }
    
    return new AppError(
      'An unknown error occurred',
      'UNKNOWN_ERROR',
      500,
      { error }
    );
  },
  
  log: (error: AppError, context?: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${context || 'ERROR'} [${error.code}]: ${error.message}`;
    
    if (import.meta.env.DEV) {
      console.error(logMessage, error.details);
    } else {
      console.error(logMessage);
    }
  },
  
  isNetworkError: (error: unknown): boolean => {
    return error instanceof Error && 
           (error.message.includes('fetch') || 
            error.message.includes('network') ||
            error.message.includes('ERR_NETWORK'));
  },
  
  isAuthError: (error: unknown): boolean => {
    return error instanceof AppError && 
           (error.statusCode === 401 || error.statusCode === 403);
  }
};
```

### 2. ローカルストレージ管理 (src/utils/storage.ts)
```typescript
interface StorageOptions {
  prefix?: string;
  encrypt?: boolean;
}

class LocalStorageManager {
  private prefix: string;
  
  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix || 'app_';
  }
  
  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.prefix + key, serialized);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }
  
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return defaultValue || null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return defaultValue || null;
    }
  }
  
  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }
  
  clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}

export const storage = new LocalStorageManager({ prefix: 'vibe_ai_' });
```

### 3. API クライアント (src/utils/apiClient.ts)
```typescript
import { errorHandler, AppError } from './errorHandler';

interface RequestConfig extends RequestInit {
  timeout?: number;
  retry?: number;
}

class APIClient {
  private baseURL: string;
  private defaultTimeout: number;
  
  constructor(baseURL: string, timeout: number = 30000) {
    this.baseURL = baseURL;
    this.defaultTimeout = timeout;
  }
  
  private async fetchWithTimeout(
    url: string, 
    config: RequestConfig = {}
  ): Promise<Response> {
    const { timeout = this.defaultTimeout, ...fetchConfig } = config;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...fetchConfig,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AppError('Request timeout', 'TIMEOUT_ERROR', 408);
      }
      
      throw error;
    }
  }
  
  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const { retry = 3, ...requestConfig } = config;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < retry; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, {
          ...requestConfig,
          headers: {
            'Content-Type': 'application/json',
            ...requestConfig.headers,
          },
        });
        
        if (!response.ok) {
          throw new AppError(
            `HTTP error! status: ${response.status}`,
            'HTTP_ERROR',
            response.status
          );
        }
        
        return await response.json();
      } catch (error) {
        lastError = error as Error;
        
        if (!errorHandler.isNetworkError(error) || attempt === retry - 1) {
          throw errorHandler.handle(error);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
    
    throw errorHandler.handle(lastError);
  }
  
  get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }
  
  post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

export const apiClient = new APIClient(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
);
```

## カスタムフック

### 1. useDebounce (src/hooks/useDebounce.ts)
```typescript
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}
```

### 2. useLocalStorage (src/hooks/useLocalStorage.ts)
```typescript
import { useState, useEffect } from 'react';
import { storage } from '@/utils/storage';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      return storage.get(key) || initialValue;
    } catch {
      return initialValue;
    }
  });
  
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      storage.set(key, valueToStore);
    } catch (error) {
      console.error(`Error saving to localStorage:`, error);
    }
  };
  
  return [storedValue, setValue];
}
```

## コンポーネント

### 1. ErrorBoundary (src/components/ErrorBoundary.tsx)
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };
  
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }
  
  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-8 p-8">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                エラーが発生しました
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                申し訳ございません。予期しないエラーが発生しました。
              </p>
              <button
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => window.location.reload()}
              >
                ページを再読み込み
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## GitHub Actions

### .github/workflows/ci.yml
```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run type check
      run: npm run type-check
    
    - name: Run linter
      run: npm run lint
    
    - name: Run tests
      run: npm run test
    
    - name: Build
      run: npm run build
```

これらのコードは、Vibe AI Templateに直接転用できる汎用的な実装です。