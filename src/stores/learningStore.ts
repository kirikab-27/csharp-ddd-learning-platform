import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Course, 
  Lesson, 
  LearnerProgress, 
  LearningContext,
  CodeExecutionResult 
} from '../features/learning/types';

interface LearningStore {
  // Current state
  currentCourse: Course | null;
  currentLesson: Lesson | null;
  userCode: string;
  executionResult: CodeExecutionResult | null;
  
  // Progress tracking
  progress: LearnerProgress | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentCourse: (course: Course | null) => void;
  setCurrentLesson: (lesson: Lesson | null) => void;
  setUserCode: (code: string) => void;
  setExecutionResult: (result: CodeExecutionResult | null) => void;
  updateProgress: (courseId: string, lessonId: string) => void;
  initializeProgress: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getLearningContext: () => LearningContext;
  getProgressStats: () => {
    totalLessons: number;
    completedLessons: number;
    completionRate: number;
  };
}

export const useLearningStore = create<LearningStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentCourse: null,
      currentLesson: null,
      userCode: '',
      executionResult: null,
      progress: null,
      isLoading: false,
      error: null,

      // Actions
      setCurrentCourse: (course) => set({ currentCourse: course }),
      
      setCurrentLesson: (lesson) => set({ currentLesson: lesson }),
      
      setUserCode: (code) => set({ userCode: code }),
      
      setExecutionResult: (result) => set({ executionResult: result }),
      
      updateProgress: (courseId, lessonId) => {
        const { progress } = get();
        if (!progress) return;
        
        const courseProgress = progress.courseProgress.get(courseId);
        if (courseProgress) {
          courseProgress.completedLessons.add(lessonId);
          courseProgress.lastAccessedAt = new Date();
          
          // Update progress map
          const newProgressMap = new Map(progress.courseProgress);
          newProgressMap.set(courseId, courseProgress);
          
          set({
            progress: {
              ...progress,
              courseProgress: newProgressMap,
              lastAccessedAt: new Date(),
            }
          });
        }
      },

      initializeProgress: () => {
        const { progress } = get();
        if (!progress) {
          const initialProgress: LearnerProgress = {
            userId: 'default-user',
            courseProgress: new Map(),
            lastAccessedAt: new Date(),
            preferences: {
              theme: 'light',
              fontSize: 14,
              autoSave: true,
              notifications: true,
              language: 'ja'
            }
          };
          set({ progress: initialProgress });
        }
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      // Computed values
      getLearningContext: () => {
        const { currentCourse, currentLesson, userCode, executionResult } = get();
        return {
          currentCourse,
          currentLesson,
          userCode,
          executionResult: executionResult || undefined,
          previousQuestions: [], // TODO: implement chat history
        };
      },
      
      getProgressStats: () => {
        const { currentCourse, progress } = get();
        if (!currentCourse || !progress) {
          return { totalLessons: 0, completedLessons: 0, completionRate: 0 };
        }
        
        const courseProgress = progress.courseProgress.get(currentCourse.id);
        if (!courseProgress) {
          return { totalLessons: 0, completedLessons: 0, completionRate: 0 };
        }
        
        const totalLessons = currentCourse.modules.reduce(
          (total, module) => total + module.lessons.length,
          0
        );
        const completedLessons = courseProgress.completedLessons.size;
        const completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
        
        return { totalLessons, completedLessons, completionRate };
      },
    }),
    {
      name: 'learning-store',
      version: 7, // バージョンを追加（変更時に自動的にストアをリセット）
      // カスタムシリアライザー（Map, Setを正しく保存するため）
      storage: {
        getItem: (name) => {
          const item = localStorage.getItem(name);
          if (!item) return null;
          
          const parsed = JSON.parse(item);
          // Map, Set を復元
          if (parsed.state.progress?.courseProgress) {
            const progressMap = new Map();
            Object.entries(parsed.state.progress.courseProgress).forEach(([key, value]: [string, any]) => {
              progressMap.set(key, {
                ...value,
                completedLessons: new Set(value.completedLessons),
                exerciseScores: new Map(Object.entries(value.exerciseScores || {})),
              });
            });
            parsed.state.progress.courseProgress = progressMap;
          }
          
          return parsed;
        },
        setItem: (name, value) => {
          // Map, Set を JSON に変換
          const serialized = {
            ...value,
            state: {
              ...value.state,
              progress: value.state.progress ? {
                ...value.state.progress,
                courseProgress: Object.fromEntries(
                  Array.from(value.state.progress.courseProgress.entries()).map(([key, progress]: [string, any]) => [
                    key,
                    {
                      ...progress,
                      completedLessons: Array.from(progress.completedLessons),
                      exerciseScores: Object.fromEntries(progress.exerciseScores),
                    },
                  ])
                ),
              } : null,
            },
          };
          
          localStorage.setItem(name, JSON.stringify(serialized));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);