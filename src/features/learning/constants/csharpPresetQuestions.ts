/**
 * C#学習に特化したプリセット質問集
 * 他のプログラミング言語の例は一切含まれません
 */

export interface CSharpPresetQuestion {
  category: string;
  questions: {
    text: string;
    prompt: string;
  }[];
}

export const CSHARP_PRESET_QUESTIONS: CSharpPresetQuestion[] = [
  {
    category: 'C#基礎',
    questions: [
      {
        text: 'C#の変数宣言方法を教えて',
        prompt: 'C#における変数の宣言方法について、型指定と初期化を含めて詳しく説明してください。int、string、varキーワードの使い方も教えてください。'
      },
      {
        text: 'stringとStringの違いは？',
        prompt: 'C#におけるstringとStringの違いについて、エイリアス関係と使い分けを詳しく説明してください。'
      },
      {
        text: 'C#のnull許容型とは？',
        prompt: 'C#のnull許容型（nullable types）について、?演算子の使い方と、null安全性について説明してください。'
      },
      {
        text: 'using文の役割は？',
        prompt: 'C#のusing文について、名前空間のインポートとリソース管理の両方の用法を詳しく説明してください。'
      },
      {
        text: 'C#のプロパティとは？',
        prompt: 'C#におけるプロパティの概念と、get/setアクセサー、自動プロパティの書き方を教えてください。'
      }
    ]
  },
  {
    category: 'C#オブジェクト指向',
    questions: [
      {
        text: 'C#のclassとstructの違い',
        prompt: 'C#におけるclassとstructの違いについて、値型と参照型の観点から詳しく説明してください。使い分けのガイドラインも教えてください。'
      },
      {
        text: 'C#のinterfaceの使い方',
        prompt: 'C#におけるinterfaceの定義方法と実装方法について、具体的なコード例とともに説明してください。'
      },
      {
        text: 'abstractクラスとは？',
        prompt: 'C#のabstractクラスについて、interfaceとの違いと、継承における役割を詳しく説明してください。'
      },
      {
        text: 'C#の継承とは？',
        prompt: 'C#における継承の概念と、base、virtual、overrideキーワードの使い方を教えてください。'
      },
      {
        text: 'C#のコンストラクタとは？',
        prompt: 'C#におけるコンストラクタの役割と、パラメータありコンストラクタ、コンストラクタチェーンについて説明してください。'
      }
    ]
  },
  {
    category: 'C#名前空間・アセンブリ',
    questions: [
      {
        text: 'C#のnamespaceとは？',
        prompt: 'C#におけるnamespace（名前空間）の役割と使い方について、大規模プロジェクトでの名前空間設計も含めて説明してください。'
      },
      {
        text: 'C#のアセンブリとは？',
        prompt: 'C#におけるアセンブリの概念と、.exeと.dllの違い、アセンブリ参照について説明してください。'
      },
      {
        text: 'C#のアクセス修飾子',
        prompt: 'C#のpublic、private、protected、internal、protected internalの違いと使い分けを説明してください。'
      }
    ]
  },
  {
    category: 'C#例外処理',
    questions: [
      {
        text: 'C#のtry-catch文',
        prompt: 'C#における例外処理のtry-catch-finallyブロックについて、具体的な使用例とベストプラクティスを教えてください。'
      },
      {
        text: 'C#の独自例外クラス',
        prompt: 'C#で独自の例外クラスを作成する方法と、Exceptionクラスからの継承について説明してください。'
      }
    ]
  },
  {
    category: 'C#コレクション',
    questions: [
      {
        text: 'C#のList<T>の使い方',
        prompt: 'C#のList<T>について、要素の追加・削除・検索方法と、配列との違いを詳しく説明してください。'
      },
      {
        text: 'C#のDictionary<K,V>',
        prompt: 'C#のDictionary<TKey, TValue>について、キーと値のペアの管理方法と使用例を教えてください。'
      },
      {
        text: 'C#のLINQとは？',
        prompt: 'C#のLINQ（Language Integrated Query）について、基本的な使い方とメソッドチェーンの書き方を説明してください。'
      }
    ]
  },
  {
    category: 'C# DDD応用',
    questions: [
      {
        text: 'C#でValueObjectを実装するには？',
        prompt: 'C#でドメイン駆動設計のValueObject（値オブジェクト）を実装する方法について、equalsメソッドとimmutabilityを含めて説明してください。'
      },
      {
        text: 'C#でEntityの実装方法',
        prompt: 'C#でDDDのEntity（エンティティ）を実装する方法について、IDによる同一性の管理を含めて説明してください。'
      },
      {
        text: 'C#でRepositoryパターン',
        prompt: 'C#でRepositoryパターンを実装する方法について、インターフェースの定義と具体的な実装例を教えてください。'
      },
      {
        text: 'C#でドメインサービス',
        prompt: 'C#でドメインサービスを実装する方法について、どのような場合に使用すべきかと実装例を説明してください。'
      }
    ]
  },
  {
    category: 'C#モダン機能',
    questions: [
      {
        text: 'C#のrecord型とは？',
        prompt: 'C# 9.0以降のrecord型について、classとの違いと不変オブジェクトの作成方法を説明してください。'
      },
      {
        text: 'C#のpattern matching',
        prompt: 'C#のパターンマッチング機能について、switchステートメントとswitch式の使い方を教えてください。'
      },
      {
        text: 'C#のasync/await',
        prompt: 'C#の非同期プログラミングにおけるasync/awaitキーワードの使い方と、Taskの扱い方を説明してください。'
      }
    ]
  }
];

/**
 * カテゴリ別にC#質問を取得
 */
export const getCSharpQuestionsByCategory = (category: string) => {
  const found = CSHARP_PRESET_QUESTIONS.find(q => q.category === category);
  return found ? found.questions : [];
};

/**
 * 全カテゴリ名を取得
 */
export const getCSharpCategories = (): string[] => {
  return CSHARP_PRESET_QUESTIONS.map(q => q.category);
};

/**
 * ランダムにC#質問を取得
 */
export const getRandomCSharpQuestions = (count: number = 5) => {
  const allQuestions = CSHARP_PRESET_QUESTIONS.flatMap(category => 
    category.questions.map(q => ({ ...q, category: category.category }))
  );
  
  const shuffled = allQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

/**
 * 初心者向けC#質問を取得
 */
export const getBeginnerCSharpQuestions = () => {
  return getCSharpQuestionsByCategory('C#基礎');
};

/**
 * DDD関連のC#質問を取得
 */
export const getDDDCSharpQuestions = () => {
  return getCSharpQuestionsByCategory('C# DDD応用');
};