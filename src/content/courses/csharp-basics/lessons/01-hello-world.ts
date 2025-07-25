import type { Lesson } from '../../../../features/learning/types';

export const helloWorldLesson: Lesson = {
  id: 'hello-world',
  title: 'Hello, World!',
  description: 'C#プログラミングの最初の一歩。基本的なプログラム構造を理解し、実際にコードを実行してみます',
  order: 1,
  content: '# Hello, World!\n\n「Hello, World!」は、プログラミングを学ぶ際の伝統的な最初のプログラムです。この簡単なプログラムを通して、C#の基本的な構造を理解していきましょう。\n\n## C#プログラムの基本構造\n\nC#のプログラムは以下の要素から構成されています：\n\n### 1. using ディレクティブ\n使用するライブラリを指定します。Systemは.NETの基本的な機能を含むライブラリです。\n\n### 2. namespace（名前空間）\n関連するクラスやメソッドをグループ化し、名前の衝突を防ぐ役割があります。\n\n### 3. class（クラス）\nC#のすべてのコードはクラス内に記述する必要があります。\n\n### 4. Main メソッド\nプログラムのエントリーポイント（開始地点）です。プログラムが起動すると、最初にMainメソッドが実行されます。\n\n## Console.WriteLine()\n\nConsole.WriteLine()は、コンソール（画面）に文字を出力するためのメソッドです。\n\n### 重要なポイント：\n- 文字列はダブルクォート（"）で囲みます\n- 行の最後にはセミコロン（;）が必要です\n- 大文字・小文字を区別します',
  codeExamples: [
    {
      id: 'hello-world-basic',
      title: '基本的なHello, World!プログラム',
      code: `using System;

namespace HelloWorld
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello, World!");
        }
    }
}`,
      language: 'csharp',
      description: 'C#の最も基本的なプログラムです。コンソールに"Hello, World!"を出力します。'
    },
    {
      id: 'multiple-output',
      title: '複数行の出力',
      code: `using System;

namespace MultipleOutput
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("こんにちは！");
            Console.WriteLine("C#プログラミングを始めましょう。");
            Console.WriteLine("よろしくお願いします！");
        }
    }
}`,
      language: 'csharp',
      description: 'Console.WriteLine()を複数回使用して、複数行のメッセージを表示します。'
    }
  ],
  exercises: [
    {
      id: 'name-output-exercise',
      title: 'あなたの名前を表示しよう',
      description: 'Console.WriteLineを使って、あなたの名前を表示するプログラムを作成してください。',
      difficulty: 'easy',
      estimatedTime: 5,
      starterCode: `using System;

namespace HelloWorld
{
    class Program
    {
        static void Main(string[] args)
        {
            // ここにコードを書いてください
            
        }
    }
}`,
      solution: `Console.WriteLine("私の名前は田中太郎です");`,
      hints: [
        'Console.WriteLine()を使用します',
        '文字列は""で囲みます',
        'セミコロン(;)を忘れずに',
        '例: Console.WriteLine("私の名前は[あなたの名前]です");'
      ]
    },
    {
      id: 'multiple-lines-exercise',
      title: '複数行の出力に挑戦',
      description: '3行の異なるメッセージを出力するプログラムを作成してください。好きな内容で構いません。',
      difficulty: 'easy',
      estimatedTime: 10,
      starterCode: `using System;

namespace MultipleLines
{
    class Program
    {
        static void Main(string[] args)
        {
            // 3行のメッセージを出力してください
            
        }
    }
}`,
      solution: `Console.WriteLine("こんにちは！");
Console.WriteLine("C#の学習を始めました。");
Console.WriteLine("よろしくお願いします！");`,
      hints: [
        'Console.WriteLine()を3回使用します',
        '各行に異なるメッセージを入力してください',
        '文字列は""で囲むことを忘れずに',
        '各文の最後にセミコロン(;)を付けてください'
      ]
    }
  ],
  estimatedTime: 20,
  difficulty: 'beginner',
  nextLesson: 'variables-and-types'
};