import type { Lesson } from '../../../../features/learning/types';

export const operatorsLesson: Lesson = {
  id: 'operators-and-expressions',
  title: '演算子と式',
  description: 'C#の様々な演算子と式の評価について学び、計算や条件判定の基礎を習得します',
  order: 3,
  content: `# 演算子と式

演算子は、値に対して特定の操作を行うための記号です。C#には様々な種類の演算子があり、それぞれ異なる目的で使用されます。

## 算術演算子

基本的な数学的計算を行う演算子です。

### 基本算術演算子
- + : 加算（足し算）
- - : 減算（引き算）
- * : 乗算（掛け算）
- / : 除算（割り算）
- % : 剰余（余り）

## 比較演算子

2つの値を比較し、真偽値（bool）を返します。

- == : 等しい
- != : 等しくない
- > : より大きい
- < : より小さい
- >= : 以上
- <= : 以下`,
  codeExamples: [
    {
      id: 'arithmetic-basic',
      title: '基本的な演算子',
      code: `using System;

namespace BasicOperators
{
    class Program
    {
        static void Main(string[] args)
        {
            int a = 10;
            int b = 3;
            
            Console.WriteLine($"{a} + {b} = {a + b}");
            Console.WriteLine($"{a} - {b} = {a - b}");
            Console.WriteLine($"{a} * {b} = {a * b}");
            Console.WriteLine($"{a} / {b} = {a / b}");
        }
    }
}`,
      language: 'csharp',
      description: 'C#の基本的な算術演算子の例です。'
    }
  ],
  exercises: [
    {
      id: 'simple-calculator',
      title: '簡単な計算プログラム',
      description: '2つの数値を使って四則演算を行うプログラムを作成してください。',
      starterCode: `using System;

namespace SimpleCalculator
{
    class Program
    {
        static void Main(string[] args)
        {
            int num1 = 15;
            int num2 = 4;
            
            // ここに計算結果を表示するコードを書いてください
        }
    }
}`,
      hints: [
        '四則演算の結果を表示してください',
        'Console.WriteLineを使用します'
      ],
      solution: `Console.WriteLine($"{num1} + {num2} = {num1 + num2}");
Console.WriteLine($"{num1} - {num2} = {num1 - num2}");
Console.WriteLine($"{num1} * {num2} = {num1 * num2}");
Console.WriteLine($"{num1} / {num2} = {num1 / num2}");`,
      difficulty: 'easy',
      estimatedTime: 10
    }
  ],
  estimatedTime: 30,
  difficulty: 'beginner',
  prerequisites: ['hello-world', 'variables-and-types'],
  nextLesson: 'control-flow'
};

