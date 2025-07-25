import type { Course } from '../../../features/learning/types';
import { dddFundamentalsLesson } from './lessons/01-ddd-fundamentals';
import { entitiesAndValueObjectsLesson } from './lessons/02-entities-and-value-objects';
import { aggregatesLesson } from './lessons/03-aggregates';
import { repositoryFactoryLesson } from './lessons/04-repository-factory';
import { domainEventsLesson } from './lessons/05-domain-events';
import { boundedContextsLesson } from './lessons/06-bounded-contexts';
import { cqrsLesson } from './lessons/07-cqrs';
import { eventSourcingLesson } from './lessons/08-event-sourcing';
import { dddArchitectureLesson } from './lessons/09-ddd-architecture';
import { testingStrategiesLesson } from './lessons/10-testing-strategies';
import { practicalProjectLesson } from './lessons/11-practical-project';

const csharpAdvancedCourse: Course = {
  id: 'csharp-advanced',
  title: 'C# 上級 (DDD実践編)',
  description: 'ドメイン駆動設計の本格的な実装を学び、複雑なビジネス要件を表現力豊かなコードで解決する手法を習得します',
  level: 'advanced',
  estimatedHours: 50,
  icon: '🏗️',
  prerequisites: ['csharp-basics', 'csharp-intermediate'],
  modules: [
    {
      id: 'ddd-basics',
      title: 'DDD基礎理論',
      order: 1,
      lessons: [
        dddFundamentalsLesson,
        entitiesAndValueObjectsLesson
      ]
    },
    {
      id: 'ddd-tactical-patterns',
      title: 'DDD戦術パターン',
      order: 2,
      lessons: [
        aggregatesLesson,
        repositoryFactoryLesson,
        domainEventsLesson
      ]
    },
    {
      id: 'ddd-strategic-patterns',
      title: 'DDD戦略パターン',
      order: 3,
      lessons: [
        boundedContextsLesson,
        cqrsLesson,
        eventSourcingLesson
      ]
    },
    {
      id: 'ddd-implementation',
      title: 'DDD実装プラクティス',
      order: 4,
      lessons: [
        dddArchitectureLesson,
        testingStrategiesLesson,
        practicalProjectLesson
      ]
    }
  ]
};

export default csharpAdvancedCourse;