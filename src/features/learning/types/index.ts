// Core learning types
export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  icon?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  prerequisites?: string[];
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  order: number;
}

export interface Lesson {
  id: string;
  moduleId?: string;
  title: string;
  description?: string;
  content: string;
  codeExamples?: CodeExample[];
  exercises?: Exercise[];
  quiz?: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>;
  order?: number;
  estimatedTime?: number;
  duration?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  nextLesson?: string;
}

export interface CodeExample {
  id: string;
  language: string;
  code: string;
  description?: string;
  title?: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  solution?: string;
  hints?: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'intermediate' | 'advanced';
  estimatedTime?: number;
  requirements?: string[];
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    description?: string;
  }>;
}

// Learning progress tracking
export interface LearnerProgress {
  userId: string;
  courseProgress: Map<string, CourseProgress>;
  lastAccessedAt: Date;
  preferences: LearnerPreferences;
}

export interface CourseProgress {
  courseId: string;
  completedLessons: Set<string>;
  currentModule: string;
  currentLesson: string;
  exerciseScores: Map<string, number>;
  timeSpent: number;
  startedAt: Date;
  lastAccessedAt: Date;
}

export interface LearnerPreferences {
  theme: 'light' | 'dark';
  fontSize: number;
  autoSave: boolean;
  notifications: boolean;
  language: string;
}

// AI integration types
export interface LearningContext {
  currentCourse: Course | null;
  currentLesson: Lesson | null;
  userCode?: string;
  executionResult?: CodeExecutionResult;
  previousQuestions: ChatHistory[];
}

export interface CodeExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
  memoryUsage?: number;
  isSuccess: boolean;
}

export interface ChatHistory {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
  context: LearningContext;
}

// Learning paths
export interface LearningPath {
  id: string;
  name: string;
  description: string;
  courses: string[]; // コースIDの順序付き配列
  prerequisites?: string[];
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// UI component types
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  children?: NavigationItem[];
}

export interface ProgressStats {
  totalLessons: number;
  completedLessons: number;
  currentStreak: number;
  totalTimeSpent: number;
  averageScore: number;
}