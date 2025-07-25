import type { Lesson } from '../../../../features/learning/types';

export const loopsForWhileLesson: Lesson = {
  id: 'loops-for-while',
  title: '繰り返し処理（for/while）',
  description: 'forループ、whileループ、do-whileループを学び、効率的な繰り返し処理を習得します',
  order: 7,
  content: `# 繰り返し処理（for/while）

プログラミングでは、同じ処理を繰り返し実行することがよくあります。C#には、様々な繰り返し処理（ループ）の構文があり、状況に応じて使い分けます。

## forループ

最も一般的なループ構文で、回数が決まっている繰り返し処理に適しています。

### 基本構文
\`\`\`csharp
for (初期化; 条件式; 更新式)
{
    // 繰り返す処理
}
\`\`\`

### 例：
\`\`\`csharp
for (int i = 0; i < 5; i++)
{
    Console.WriteLine($"カウント: {i}");
}
\`\`\`

### forループの要素
1. **初期化**: ループ開始時に1回だけ実行（通常はカウンタ変数の初期化）
2. **条件式**: 各繰り返しの前にチェック（trueの間ループ継続）
3. **更新式**: 各繰り返しの最後に実行（通常はカウンタの増減）

## whileループ

条件が真である限り繰り返すループです。回数が不定の場合に適しています。

### 基本構文
\`\`\`csharp
while (条件式)
{
    // 繰り返す処理
}
\`\`\`

### 例：
\`\`\`csharp
int count = 0;
while (count < 5)
{
    Console.WriteLine($"カウント: {count}");
    count++;
}
\`\`\`

### 注意点
- 条件式が最初からfalseの場合、一度も実行されない
- 条件が常にtrueになる無限ループに注意

## do-whileループ

少なくとも1回は処理を実行してから条件をチェックするループです。

### 基本構文
\`\`\`csharp
do
{
    // 繰り返す処理
} while (条件式);
\`\`\`

### 例：
\`\`\`csharp
int num;
do
{
    Console.WriteLine("1以上の数を入力してください:");
    num = int.Parse(Console.ReadLine());
} while (num < 1);
\`\`\`

## ループ制御文

### break文
ループを途中で終了します。
\`\`\`csharp
for (int i = 0; i < 10; i++)
{
    if (i == 5) break;  // i が 5 になったらループ終了
    Console.WriteLine(i);
}
\`\`\`

### continue文
現在の繰り返しをスキップして次の繰り返しに進みます。
\`\`\`csharp
for (int i = 0; i < 10; i++)
{
    if (i % 2 == 0) continue;  // 偶数をスキップ
    Console.WriteLine(i);  // 奇数のみ表示
}
\`\`\`

## ネストしたループ

ループの中に別のループを入れることができます。
\`\`\`csharp
for (int i = 1; i <= 3; i++)
{
    for (int j = 1; j <= 3; j++)
    {
        Console.Write($"{i}x{j}={i*j} ");
    }
    Console.WriteLine();
}
\`\`\`

## ループの使い分け

- **for**: 回数が決まっている場合
- **while**: 条件によって回数が変わる場合
- **do-while**: 最低1回は実行したい場合
- **foreach**: 配列やコレクションの全要素を処理する場合（次のレッスンで学習）`,
  codeExamples: [
    {
      id: 'for-loop-basics',
      title: 'forループの基本と応用',
      code: `using System;

namespace ForLoopBasics
{
    class Program
    {
        static void Main(string[] args)
        {
            // 基本的なforループ
            Console.WriteLine("=== 基本的なカウントアップ ===");
            for (int i = 1; i <= 5; i++)
            {
                Console.WriteLine($"{i}回目の処理");
            }
            
            // カウントダウン
            Console.WriteLine("\n=== カウントダウン ===");
            for (int i = 10; i >= 0; i--)
            {
                if (i > 0)
                {
                    Console.WriteLine($"{i}...");
                }
                else
                {
                    Console.WriteLine("発射！🚀");
                }
            }
            
            // 2ずつ増加
            Console.WriteLine("\n=== 偶数の表示 ===");
            for (int i = 0; i <= 10; i += 2)
            {
                Console.Write($"{i} ");
            }
            Console.WriteLine();
            
            // 累計計算
            Console.WriteLine("\n=== 1から10までの合計 ===");
            int sum = 0;
            for (int i = 1; i <= 10; i++)
            {
                sum += i;
                Console.WriteLine($"i = {i}, 累計 = {sum}");
            }
            Console.WriteLine($"最終合計: {sum}");
            
            // 文字列の各文字を処理
            Console.WriteLine("\n=== 文字列の処理 ===");
            string word = "HELLO";
            for (int i = 0; i < word.Length; i++)
            {
                Console.WriteLine($"文字[{i}]: {word[i]}");
            }
        }
    }
}`,
      language: 'csharp',
      description: 'forループの様々な使い方。カウントアップ、カウントダウン、ステップ変更、累計計算、文字列処理の例を示しています。'
    },
    {
      id: 'while-loop-examples',
      title: 'whileループとdo-whileループ',
      code: `using System;

namespace WhileLoopExamples
{
    class Program
    {
        static void Main(string[] args)
        {
            // whileループの例：ランダムな数が特定の値になるまで繰り返す
            Console.WriteLine("=== サイコロで6が出るまで ===");
            Random rand = new Random();
            int dice = 0;
            int attempts = 0;
            
            while (dice != 6)
            {
                dice = rand.Next(1, 7);  // 1-6のランダムな数
                attempts++;
                Console.WriteLine($"試行{attempts}: {dice}が出ました");
            }
            Console.WriteLine($"6が出るまで{attempts}回かかりました！\n");
            
            // whileループで数値の桁数を数える
            Console.WriteLine("=== 数値の桁数を数える ===");
            int number = 12345;
            int originalNumber = number;
            int digitCount = 0;
            
            while (number > 0)
            {
                number /= 10;  // 10で割って桁を減らす
                digitCount++;
            }
            Console.WriteLine($"{originalNumber}は{digitCount}桁の数です\n");
            
            // do-whileループの例：メニュー選択
            Console.WriteLine("=== メニュー選択（シミュレーション） ===");
            int choice;
            int simulatedInput = 0;  // シミュレート用
            
            do
            {
                Console.WriteLine("\nメニュー:");
                Console.WriteLine("1. 開始");
                Console.WriteLine("2. 設定");
                Console.WriteLine("3. 終了");
                
                // 実際の入力の代わりにシミュレート
                simulatedInput++;
                choice = simulatedInput;
                Console.WriteLine($"選択: {choice}");
                
                switch (choice)
                {
                    case 1:
                        Console.WriteLine("ゲームを開始します！");
                        break;
                    case 2:
                        Console.WriteLine("設定画面を開きます");
                        break;
                    case 3:
                        Console.WriteLine("終了します");
                        break;
                    default:
                        Console.WriteLine("無効な選択です");
                        break;
                }
            } while (choice != 3 && simulatedInput < 5);  // 終了または5回まで
            
            // コラッツの予想
            Console.WriteLine("\n=== コラッツの予想 ===");
            int n = 27;
            int steps = 0;
            Console.WriteLine($"開始値: {n}");
            
            while (n != 1)
            {
                if (n % 2 == 0)
                {
                    n = n / 2;
                    Console.WriteLine($"偶数なので2で割る: {n}");
                }
                else
                {
                    n = n * 3 + 1;
                    Console.WriteLine($"奇数なので3倍+1: {n}");
                }
                steps++;
                
                if (steps > 20)  // 安全のため上限を設定
                {
                    Console.WriteLine("計算を中断します...");
                    break;
                }
            }
            
            if (n == 1)
            {
                Console.WriteLine($"1に到達しました！ ステップ数: {steps}");
            }
        }
    }
}`,
      language: 'csharp',
      description: 'whileループとdo-whileループの実践的な使用例。条件が不確定な繰り返し処理、メニューシステム、数学的アルゴリズムの実装を示しています。'
    },
    {
      id: 'nested-loops-patterns',
      title: 'ネストしたループとパターン生成',
      code: `using System;

namespace NestedLoopsPatterns
{
    class Program
    {
        static void Main(string[] args)
        {
            // 九九の表
            Console.WriteLine("=== 九九の表 ===");
            Console.Write("   ");
            for (int i = 1; i <= 9; i++)
            {
                Console.Write($"{i,3}");
            }
            Console.WriteLine("\n   " + new string('-', 27));
            
            for (int i = 1; i <= 9; i++)
            {
                Console.Write($"{i} |");
                for (int j = 1; j <= 9; j++)
                {
                    Console.Write($"{i * j,3}");
                }
                Console.WriteLine();
            }
            
            // 三角形のパターン
            Console.WriteLine("\n=== 三角形パターン ===");
            int height = 5;
            for (int i = 1; i <= height; i++)
            {
                // スペースを出力
                for (int j = 0; j < height - i; j++)
                {
                    Console.Write(" ");
                }
                // 星を出力
                for (int j = 0; j < 2 * i - 1; j++)
                {
                    Console.Write("*");
                }
                Console.WriteLine();
            }
            
            // 四角形の枠
            Console.WriteLine("\n=== 四角形の枠 ===");
            int width = 8;
            int boxHeight = 5;
            
            for (int i = 0; i < boxHeight; i++)
            {
                for (int j = 0; j < width; j++)
                {
                    // 上下の辺または左右の辺の場合は*を出力
                    if (i == 0 || i == boxHeight - 1 || j == 0 || j == width - 1)
                    {
                        Console.Write("*");
                    }
                    else
                    {
                        Console.Write(" ");
                    }
                }
                Console.WriteLine();
            }
            
            // breakとcontinueの使用例
            Console.WriteLine("\n=== 素数の検出（1-20） ===");
            for (int num = 2; num <= 20; num++)
            {
                bool isPrime = true;
                
                // 素数判定
                for (int divisor = 2; divisor < num; divisor++)
                {
                    if (num % divisor == 0)
                    {
                        isPrime = false;
                        break;  // 割り切れたら素数ではないので終了
                    }
                }
                
                if (isPrime)
                {
                    Console.Write($"{num} ");
                }
            }
            Console.WriteLine();
            
            // continueの使用例
            Console.WriteLine("\n=== 3の倍数以外を表示 ===");
            for (int i = 1; i <= 15; i++)
            {
                if (i % 3 == 0)
                {
                    continue;  // 3の倍数はスキップ
                }
                Console.Write($"{i} ");
            }
            Console.WriteLine();
        }
    }
}`,
      language: 'csharp',
      description: 'ネストしたループを使った実践例。九九の表、図形パターンの生成、素数判定、break/continueの使い方を示しています。'
    }
  ],
  exercises: [
    {
      id: 'factorial-exercise',
      title: '階乗計算プログラム',
      description: 'forループを使って、入力された数値の階乗を計算するプログラムを作成してください。階乗とは、1からその数までの全ての整数の積です（例：5! = 5×4×3×2×1 = 120）。',
      starterCode: `using System;

namespace Factorial
{
    class Program
    {
        static void Main(string[] args)
        {
            int number = 5;  // 階乗を計算する数
            
            // ここにforループを使って階乗を計算するコードを書いてください
            // 階乗の計算過程も表示してください
            // 例: 5! = 5 × 4 × 3 × 2 × 1 = 120
            
            // 注意: 0! = 1 として扱ってください
        }
    }
}`,
      hints: [
        '結果を格納する変数を1で初期化',
        'forループで1からnumberまで繰り返す',
        '各ステップで現在の数を掛ける',
        '計算過程を文字列で組み立てると良い'
      ],
      solution: `long factorial = 1;
string process = "";

if (number == 0)
{
    Console.WriteLine("0! = 1");
}
else if (number < 0)
{
    Console.WriteLine("負の数の階乗は定義されていません");
}
else
{
    Console.Write($"{number}! = ");
    
    // 階乗の計算
    for (int i = number; i >= 1; i--)
    {
        factorial *= i;
        
        // 計算過程の文字列を作成
        if (i == number)
        {
            process = i.ToString();
        }
        else
        {
            process += $" × {i}";
        }
    }
    
    Console.WriteLine($"{process} = {factorial}");
    
    // 追加情報
    Console.WriteLine($"\n{number}の階乗は{factorial}です");
    
    // 大きな数値の警告
    if (number > 20)
    {
        Console.WriteLine("注意: 20を超える階乗は非常に大きな数になります");
    }
}

// 1から10までの階乗を表示（おまけ）
Console.WriteLine("\n=== 階乗の一覧（1-10） ===");
for (int n = 1; n <= 10; n++)
{
    long result = 1;
    for (int i = 1; i <= n; i++)
    {
        result *= i;
    }
    Console.WriteLine($"{n,2}! = {result,10}");
}`,
      difficulty: 'easy',
      estimatedTime: 15
    },
    {
      id: 'guessing-game-exercise',
      title: '数当てゲーム',
      description: 'whileループを使って、1から100までのランダムな数を当てるゲームを作成してください。プレイヤーの入力に対して「もっと大きい」「もっと小さい」のヒントを出し、正解するまで繰り返します。',
      starterCode: `using System;

namespace GuessingGame
{
    class Program
    {
        static void Main(string[] args)
        {
            Random rand = new Random();
            int secretNumber = rand.Next(1, 101);  // 1-100のランダムな数
            int attempts = 0;
            bool isCorrect = false;
            
            Console.WriteLine("=== 数当てゲーム ===");
            Console.WriteLine("1から100までの数を当ててください！");
            
            // ここにwhileループを使ってゲームロジックを実装してください
            // - プレイヤーの推測を受け取る（シミュレート）
            // - 正解より大きいか小さいかヒントを出す
            // - 正解したらループを終了
            // - 試行回数をカウント
            
            // シミュレーション用の推測値配列（実際のゲームではConsole.ReadLine()を使用）
            int[] guesses = { 50, 25, 37, 43, 40, 42 };  // テスト用の推測値
            int guessIndex = 0;
        }
    }
}`,
      hints: [
        'while (!isCorrect) でループ',
        '推測値と秘密の数を比較',
        'if-else if-elseで3つの場合分け',
        'break文またはisCorrectフラグでループ終了'
      ],
      solution: `Console.WriteLine($"(デバッグ: 正解は{secretNumber}です)");

while (!isCorrect && guessIndex < guesses.Length)
{
    // シミュレーション用（実際はConsole.ReadLine()で入力）
    int guess = guesses[guessIndex];
    guessIndex++;
    attempts++;
    
    Console.WriteLine($"\n推測{attempts}: {guess}");
    
    if (guess == secretNumber)
    {
        isCorrect = true;
        Console.WriteLine($"🎉 正解です！ {attempts}回目で当たりました！");
        
        // 評価メッセージ
        if (attempts <= 3)
        {
            Console.WriteLine("素晴らしい！とても勘が良いですね！");
        }
        else if (attempts <= 6)
        {
            Console.WriteLine("良いペースです！");
        }
        else
        {
            Console.WriteLine("よく頑張りました！");
        }
    }
    else if (guess < secretNumber)
    {
        Console.WriteLine("もっと大きい数です ↑");
        
        // 追加ヒント
        if (secretNumber - guess > 20)
        {
            Console.WriteLine("(かなり離れています)");
        }
        else if (secretNumber - guess <= 5)
        {
            Console.WriteLine("(もう少しです！)");
        }
    }
    else
    {
        Console.WriteLine("もっと小さい数です ↓");
        
        // 追加ヒント
        if (guess - secretNumber > 20)
        {
            Console.WriteLine("(かなり離れています)");
        }
        else if (guess - secretNumber <= 5)
        {
            Console.WriteLine("(もう少しです！)");
        }
    }
}

if (!isCorrect)
{
    Console.WriteLine($"\n残念！正解は{secretNumber}でした。");
}

// ゲーム統計
Console.WriteLine("\n=== ゲーム統計 ===");
Console.WriteLine($"試行回数: {attempts}");
Console.WriteLine($"正解: {secretNumber}");

// 最適戦略の説明
Console.WriteLine("\n💡 ヒント: 二分探索を使えば最大7回で必ず当てられます！");`,
      difficulty: 'medium',
      estimatedTime: 20
    },
    {
      id: 'fibonacci-exercise',
      title: 'フィボナッチ数列生成',
      description: 'フィボナッチ数列の最初のn個の項を生成して表示するプログラムを作成してください。フィボナッチ数列は、最初の2つが1で、3番目以降は直前の2つの数の和となる数列です。',
      starterCode: `using System;

namespace Fibonacci
{
    class Program
    {
        static void Main(string[] args)
        {
            int n = 15;  // 表示する項数
            
            Console.WriteLine($"フィボナッチ数列の最初の{n}項:");
            
            // ここにフィボナッチ数列を生成するコードを書いてください
            // 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, ...
            
            // ボーナス課題:
            // 1. 各項の値が1000を超えたら警告を表示
            // 2. 黄金比（隣り合う項の比）も計算して表示
        }
    }
}`,
      hints: [
        '最初の2項は特別に処理',
        '3項目以降はループで計算',
        '直前の2つの値を保持する変数が必要',
        'long型を使うと大きな値も扱える'
      ],
      solution: `if (n <= 0)
{
    Console.WriteLine("項数は1以上である必要があります");
    return;
}

// 最初の2つの項
long prev1 = 1;  // F(n-2)
long prev2 = 1;  // F(n-1)

// 1項目
if (n >= 1)
{
    Console.WriteLine($"F(1) = {prev1}");
}

// 2項目
if (n >= 2)
{
    Console.WriteLine($"F(2) = {prev2}");
}

// 3項目以降
for (int i = 3; i <= n; i++)
{
    long current = prev1 + prev2;
    Console.WriteLine($"F({i}) = {current}");
    
    // 警告チェック
    if (current > 1000 && prev2 <= 1000)
    {
        Console.WriteLine("  ⚠️ 1000を超えました！");
    }
    
    // 次の計算のために値を更新
    prev1 = prev2;
    prev2 = current;
}

// 黄金比の計算（ボーナス）
Console.WriteLine("\n=== 黄金比への収束 ===");
Console.WriteLine("隣り合う項の比（F(n)/F(n-1)）:");

prev1 = 1;
prev2 = 1;

for (int i = 3; i <= Math.Min(n, 20); i++)
{
    long current = prev1 + prev2;
    double ratio = (double)current / prev2;
    Console.WriteLine($"F({i})/F({i-1}) = {ratio:F6}");
    
    prev1 = prev2;
    prev2 = current;
}

Console.WriteLine($"\n黄金比 φ = {(1 + Math.Sqrt(5)) / 2:F6}");

// フィボナッチ数列の性質
Console.WriteLine("\n=== フィボナッチ数列の性質 ===");

// 最初のn項の和
prev1 = 1;
prev2 = 1;
long sum = 2;  // 最初の2項の和

for (int i = 3; i <= n; i++)
{
    long current = prev1 + prev2;
    sum += current;
    prev1 = prev2;
    prev2 = current;
}

Console.WriteLine($"最初の{n}項の和: {sum}");

// 偶数番目の項の和
long evenSum = 0;
prev1 = 1;
prev2 = 1;

if (n >= 2) evenSum = 1;  // F(2) = 1

for (int i = 3; i <= n; i++)
{
    long current = prev1 + prev2;
    if (i % 2 == 0)
    {
        evenSum += current;
    }
    prev1 = prev2;
    prev2 = current;
}

Console.WriteLine($"偶数番目の項の和: {evenSum}");`,
      difficulty: 'hard',
      estimatedTime: 25
    }
  ],
  estimatedTime: 50,
  difficulty: 'beginner',
  prerequisites: ['hello-world', 'variables-and-types', 'operators-and-expressions', 'arrays-and-collections', 'control-flow-if', 'control-flow-switch'],
  nextLesson: 'loops-foreach'
};