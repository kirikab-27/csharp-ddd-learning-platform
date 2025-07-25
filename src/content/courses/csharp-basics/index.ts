import type { Course } from '../../../features/learning/types';
import { helloWorldLesson } from './lessons/01-hello-world';
import { variablesLesson } from './lessons/02-variables';
import { operatorsLesson } from './lessons/03-operators';
import { arraysCollectionsLesson } from './lessons/04-arrays-collections';
import { controlFlowIfLesson } from './lessons/05-control-flow-if';
import { controlFlowSwitchLesson } from './lessons/06-control-flow-switch';
import { loopsForWhileLesson } from './lessons/07-loops-for-while';
import { methodsLesson } from './lessons/08-methods';
import { classesAndObjectsLesson } from './lessons/09-classes-and-objects';
import { inheritanceAndPolymorphismLesson } from './lessons/10-inheritance-and-polymorphism';
import { interfacesLesson } from './lessons/11-interfaces';

export const csharpBasicsCourse: Course = {
  id: 'csharp-basics',
  title: 'C# 基礎',
  description: 'C#プログラミングの基本概念から実践的なコーディングまでを学びます',
  level: 'beginner',
  estimatedHours: 20,
  icon: '📚',
  modules: [
    {
      id: 'getting-started',
      title: 'はじめに',
      order: 1,
      lessons: [
        helloWorldLesson,
        variablesLesson,
        operatorsLesson,
        arraysCollectionsLesson,
      ]
    },
    {
      id: 'control-flow',
      title: '制御構造',
      order: 2,
      lessons: [
        controlFlowIfLesson,
        controlFlowSwitchLesson,
        loopsForWhileLesson,
      ]
    },
    {
      id: 'functions-and-methods',
      title: '関数とメソッド',
      order: 3,
      lessons: [
        methodsLesson,
      ]
    },
    {
      id: 'object-oriented',
      title: 'オブジェクト指向プログラミング',
      order: 4,
      lessons: [
        classesAndObjectsLesson,
        inheritanceAndPolymorphismLesson,
        interfacesLesson,
      ]
    }
  ]
};

// タイムスタンプを追加して強制的に再読み込み
const timestamp = new Date().toISOString();
console.log('🔄 Course loaded at:', timestamp);
console.log('🔍 Interfaces lesson check:', interfacesLesson ? '✅ ' + interfacesLesson.title : '❌ Not found');
console.log('🔍 OOP module lessons:', csharpBasicsCourse.modules.find(m => m.id === 'object-oriented')?.lessons.length || 0);

// 開発環境でのデバッグログとキャッシュ管理
if (import.meta.env.DEV) {
  console.log('📚 Loading course with:', {
    modules: csharpBasicsCourse.modules.length,
    lessons: csharpBasicsCourse.modules.reduce((sum, m) => sum + m.lessons.length, 0),
    interfaceLesson: interfacesLesson ? '✅ Loaded' : '❌ Not found'
  });
  
  // インターフェースレッスンの確認
  const oopModule = csharpBasicsCourse.modules.find(m => m.id === 'object-oriented');
  console.log('🔍 OOP Module lessons:', oopModule?.lessons.map(l => l.title));
  console.log('🔍 Interface lesson object:', interfacesLesson);
  console.log('🔍 Interface content type:', typeof interfacesLesson.content);
  console.log('🔍 Interface content length:', interfacesLesson.content?.length);
}

export default csharpBasicsCourse;