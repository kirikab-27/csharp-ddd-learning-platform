import type { Course } from '../../../features/learning/types';
import { linqBasicsLesson } from './lessons/01-linq-basics';
import { linqAdvancedLesson } from './lessons/02-linq-advanced';
import { asyncAwaitLesson } from './lessons/03-async-await';
import { genericsLesson } from './lessons/04-generics';
import { collectionsLesson } from './lessons/05-collections';
import { delegatesLesson } from './lessons/06-delegates';
import { eventsLesson } from './lessons/07-events';
import { exceptionHandlingLesson } from './lessons/08-exception-handling';
import { resourceManagementLesson } from './lessons/09-resource-management';

const csharpIntermediateCourse: Course = {
  id: 'csharp-intermediate',
  title: 'C# 中級',
  description: 'LINQ、非同期プログラミング、ジェネリクスなど、C#の高度な機能を習得します',
  level: 'intermediate',
  estimatedHours: 30,
  icon: '🚀',
  prerequisites: ['csharp-basics'],
  modules: [
    {
      id: 'linq-mastery',
      title: 'LINQ マスター',
      order: 1,
      lessons: [
        linqBasicsLesson,
        linqAdvancedLesson
      ]
    },
    {
      id: 'async-programming',
      title: '非同期プログラミング',
      order: 2,
      lessons: [
        asyncAwaitLesson
      ]
    },
    {
      id: 'generics-collections',
      title: 'ジェネリクスとコレクション',
      order: 3,
      lessons: [
        genericsLesson,
        collectionsLesson
      ]
    },
    {
      id: 'delegates-events',
      title: 'デリゲートとイベント',
      order: 4,
      lessons: [
        delegatesLesson,
        eventsLesson
      ]
    },
    {
      id: 'error-resource-management',
      title: 'エラー処理とリソース管理',
      order: 5,
      lessons: [
        exceptionHandlingLesson,
        resourceManagementLesson
      ]
    }
  ]
};

export default csharpIntermediateCourse;