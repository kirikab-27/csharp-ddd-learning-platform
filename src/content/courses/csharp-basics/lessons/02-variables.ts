import type { Lesson } from '../../../../features/learning/types';

export const variablesLesson: Lesson = {
  id: 'variables-and-types',
  title: '変数とデータ型',
  description: 'C#の変数宣言とデータ型について学び、実際にコードを書いて理解を深めます',
  order: 2,
  content: '# 変数とデータ型\n\n変数は、プログラムでデータを一時的に保存する「箱」のようなものです。C#では型安全性を重視し、変数を宣言する際にデータの型を指定します。\n\n## 基本的なデータ型\n\n### 整数型\n- int: 32ビット整数 (-2,147,483,648 〜 2,147,483,647)\n- long: 64ビット整数 (より大きな範囲)\n- short: 16ビット整数 (-32,768 〜 32,767)\n\n### 浮動小数点型\n- double: 倍精度浮動小数点 (15-17桁の精度)\n- float: 単精度浮動小数点 (6-9桁の精度) - 末尾にfが必要\n- decimal: 高精度10進数 (金額計算に最適) - 末尾にmが必要\n\n### 文字と文字列型\n- char: 1文字 (シングルクォートで囲む)\n- string: 文字列 (ダブルクォートで囲む)\n\n### 真偽値型\n- bool: true または false のみ\n\n## var キーワード (型推論)\n\nC#では var キーワードを使って、コンパイラに型を推論させることができます。\n\n## 型変換\n\n### 暗黙的な型変換\n小さい型から大きい型への変換は自動的に行われます。\n\n### 明示的な型変換（キャスト）\n大きい型から小さい型への変換は明示的に指定する必要があります。\n\n## 文字列補間\n\n変数の値を文字列に埋め込む便利な方法として、$"文字列{変数名}"の形式を使用します。',
  codeExamples: [
    {
      id: 'variables-basic-example',
      title: '基本的な変数の宣言と使用',
      code: `using System;

namespace BasicVariables
{
    class Program
    {
        static void Main(string[] args)
        {
            // 各データ型の変数宣言
            int age = 20;
            double height = 165.5;
            string name = "Alice";
            bool isStudent = true;
            char grade = 'A';
            
            // 文字列補間を使った出力
            Console.WriteLine($"名前: {name}");
            Console.WriteLine($"年齢: {age}歳");
            Console.WriteLine($"身長: {height}cm");
            Console.WriteLine($"学生: {isStudent}");
            Console.WriteLine($"成績: {grade}");
        }
    }
}`,
      language: 'csharp'
    },
    {
      id: 'type-inference-example',
      title: 'var キーワードによる型推論',
      code: `using System;

namespace TypeInference
{
    class Program
    {
        static void Main(string[] args)
        {
            // 型推論を使った変数宣言
            var city = "Tokyo";        // string型
            var temperature = 25.5;    // double型
            var population = 1000000;  // int型
            var isCapital = true;      // bool型
            
            // 型を確認（実際の開発では使わない）
            Console.WriteLine($"city: {city.GetType()}");
            Console.WriteLine($"temperature: {temperature.GetType()}");
            Console.WriteLine($"population: {population.GetType()}");
            Console.WriteLine($"isCapital: {isCapital.GetType()}");
        }
    }
}`,
      language: 'csharp'
    },
    {
      id: 'type-conversion-example',
      title: '型変換の例',
      code: `using System;

namespace TypeConversion
{
    class Program
    {
        static void Main(string[] args)
        {
            // 暗黙的な型変換
            int wholeNumber = 42;
            double decimalNumber = wholeNumber;
            Console.WriteLine($"int → double: {wholeNumber} → {decimalNumber}");
            
            // 明示的な型変換（キャスト）
            double pi = 3.14159;
            int intPi = (int)pi;
            Console.WriteLine($"double → int: {pi} → {intPi}");
            
            // 文字列から数値への変換
            string numberText = "123";
            int number = int.Parse(numberText);
            Console.WriteLine($"string → int: \"{numberText}\" → {number}");
            
            // 計算での型変換
            int a = 7;
            int b = 2;
            double result = (double)a / b;  // 正確な除算
            Console.WriteLine($"7 ÷ 2 = {result}");
        }
    }
}`,
      language: 'csharp'
    }
  ],
  exercises: [
    {
      id: 'self-introduction-exercise',
      title: '自己紹介プログラム',
      description: '変数を使って自己紹介を表示するプログラムを作成してください。名前、年齢、身長、好きな科目を変数に格納し、文字列補間を使って美しく表示します。',
      starterCode: `using System;

namespace SelfIntroduction
{
    class Program
    {
        static void Main(string[] args)
        {
            // ここに変数を宣言してください
            // string name = ...
            // int age = ...
            // double height = ...
            // string favoriteSubject = ...
            
            // 文字列補間を使って自己紹介を表示してください
            // Console.WriteLine($"...");
        }
    }
}`,
      hints: [
        '4つの変数が必要です: string name, int age, double height, string favoriteSubject',
        '文字列補間の書式: $"文字列{変数名}文字列"',
        '例: Console.WriteLine($"私の名前は{name}です。");',
        '複数行の出力にはConsole.WriteLineを複数回使用します'
      ],
      solution: `string name = "田中太郎";
int age = 20;
double height = 170.5;
string favoriteSubject = "数学";

Console.WriteLine("=== 自己紹介 ===");
Console.WriteLine($"名前: {name}");
Console.WriteLine($"年齢: {age}歳");
Console.WriteLine($"身長: {height}cm");
Console.WriteLine($"好きな科目: {favoriteSubject}");
Console.WriteLine("よろしくお願いします！");`,
      difficulty: 'easy',
      estimatedTime: 10
    },
    {
      id: 'type-conversion-exercise',
      title: '型変換と計算練習',
      description: '2つの整数を使って、正確な除算を行うプログラムを作成してください。整数同士の除算では小数点以下が切り捨てられるため、型変換を使って正確な結果を得る必要があります。',
      starterCode: `using System;

namespace TypeConversion
{
    class Program
    {
        static void Main(string[] args)
        {
            int dividend = 10;  // 被除数
            int divisor = 3;    // 除数
            
            // 整数除算の結果
            int integerResult = dividend / divisor;
            
            // 正確な除算の結果（型変換を使用）
            // ヒント: (double)を使ってキャストします
            
            // 結果を表示
            Console.WriteLine($"{dividend} ÷ {divisor} = {integerResult} (整数除算)");
            // Console.WriteLine($"{dividend} ÷ {divisor} = {正確な結果} (正確な除算)");
        }
    }
}`,
      hints: [
        '整数同士の除算は整数結果になります（10 / 3 = 3）',
        '正確な除算には型変換が必要: (double)dividend / divisor',
        '結果をdouble型の変数に保存しましょう',
        '小数点以下の表示には :F2 フォーマットが使えます'
      ],
      solution: `double accurateResult = (double)dividend / divisor;

Console.WriteLine($"{dividend} ÷ {divisor} = {integerResult} (整数除算)");
Console.WriteLine($"{dividend} ÷ {divisor} = {accurateResult:F3} (正確な除算)");`,
      difficulty: 'medium',
      estimatedTime: 15
    }
  ],
  estimatedTime: 30,
  difficulty: 'beginner',
  prerequisites: ['hello-world'],
  nextLesson: 'operators-and-expressions'
};