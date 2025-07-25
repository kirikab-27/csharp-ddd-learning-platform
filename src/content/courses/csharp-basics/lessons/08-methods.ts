import type { Lesson } from '../../../../features/learning/types';

export const methodsLesson: Lesson = {
  id: 'methods',
  title: 'メソッド（関数）',
  description: 'メソッドの定義と呼び出し、パラメータと戻り値、スコープなど、再利用可能なコードブロックの作成方法を学びます',
  order: 8,
  content: `# メソッド（関数）

メソッドは、特定のタスクを実行する再利用可能なコードブロックです。C#では、すべてのコードはメソッドの中に記述されます。

## メソッドの基本構文

\`\`\`csharp
アクセス修飾子 戻り値の型 メソッド名(パラメータリスト)
{
    // メソッドの本体
    return 戻り値; // 戻り値がある場合
}
\`\`\`

### 例：
\`\`\`csharp
public static int Add(int a, int b)
{
    return a + b;
}
\`\`\`

## メソッドの構成要素

### 1. アクセス修飾子
- \`public\`: どこからでもアクセス可能
- \`private\`: 同じクラス内からのみアクセス可能
- \`protected\`: 同じクラスと派生クラスからアクセス可能
- \`internal\`: 同じアセンブリ内からアクセス可能

### 2. 戻り値の型
- \`void\`: 戻り値なし
- \`int\`, \`string\`, \`bool\` など: 指定した型の値を返す
- カスタム型も指定可能

### 3. パラメータ
- 入力値をメソッドに渡す
- 複数のパラメータをカンマで区切る
- デフォルト値を設定可能

## voidメソッド

戻り値を持たないメソッド：

\`\`\`csharp
public static void PrintMessage(string message)
{
    Console.WriteLine(message);
    // returnは不要（または単にreturn;）
}
\`\`\`

## 値を返すメソッド

\`\`\`csharp
public static double CalculateArea(double radius)
{
    return Math.PI * radius * radius;
}
\`\`\`

## パラメータの種類

### 1. 値渡し（デフォルト）
\`\`\`csharp
void ModifyValue(int x)
{
    x = 10; // 呼び出し元の変数は変更されない
}
\`\`\`

### 2. 参照渡し（ref）
\`\`\`csharp
void ModifyRef(ref int x)
{
    x = 10; // 呼び出し元の変数が変更される
}
\`\`\`

### 3. 出力パラメータ（out）
\`\`\`csharp
void GetValues(out int x, out int y)
{
    x = 10;
    y = 20;
}
\`\`\`

### 4. オプションパラメータ
\`\`\`csharp
void PrintInfo(string name, int age = 0)
{
    Console.WriteLine($"{name}, {age}歳");
}
\`\`\`

## メソッドのオーバーロード

同じ名前で異なるパラメータを持つメソッドを定義できます：

\`\`\`csharp
public static int Add(int a, int b) => a + b;
public static double Add(double a, double b) => a + b;
public static int Add(int a, int b, int c) => a + b + c;
\`\`\`

## ローカル関数

メソッド内で定義される関数：

\`\`\`csharp
public static void ProcessData()
{
    int LocalFunction(int x)
    {
        return x * 2;
    }
    
    int result = LocalFunction(5);
}
\`\`\`

## ベストプラクティス

1. **単一責任の原則**: 1つのメソッドは1つのタスクを実行
2. **適切な名前付け**: 動詞で始まる分かりやすい名前
3. **パラメータ数の制限**: 3-4個以下が理想的
4. **適切な戻り値**: 必要な情報のみを返す`,
  codeExamples: [
    {
      id: 'basic-methods',
      title: '基本的なメソッドの定義と使用',
      code: `using System;

namespace BasicMethods
{
    class Program
    {
        static void Main(string[] args)
        {
            // メソッドの呼び出し
            Greet("田中");
            Greet("佐藤", "こんばんは");
            
            // 戻り値のあるメソッド
            int sum = Add(5, 3);
            Console.WriteLine($"5 + 3 = {sum}");
            
            double area = CalculateCircleArea(5.0);
            Console.WriteLine($"半径5の円の面積: {area:F2}");
            
            // 複数の戻り値（タプル）
            var (min, max) = GetMinMax(10, 5, 8, 3, 15);
            Console.WriteLine($"最小値: {min}, 最大値: {max}");
            
            // bool型を返すメソッド
            if (IsEven(10))
            {
                Console.WriteLine("10は偶数です");
            }
            
            // 文字列操作メソッド
            string reversed = ReverseString("Hello");
            Console.WriteLine($"Helloを逆順にすると: {reversed}");
        }
        
        // voidメソッド（戻り値なし）
        static void Greet(string name, string greeting = "こんにちは")
        {
            Console.WriteLine($"{greeting}、{name}さん！");
        }
        
        // int型を返すメソッド
        static int Add(int a, int b)
        {
            return a + b;
        }
        
        // double型を返すメソッド
        static double CalculateCircleArea(double radius)
        {
            return Math.PI * radius * radius;
        }
        
        // タプルを返すメソッド
        static (int min, int max) GetMinMax(params int[] numbers)
        {
            int min = int.MaxValue;
            int max = int.MinValue;
            
            foreach (int num in numbers)
            {
                if (num < min) min = num;
                if (num > max) max = num;
            }
            
            return (min, max);
        }
        
        // bool型を返すメソッド
        static bool IsEven(int number)
        {
            return number % 2 == 0;
        }
        
        // 文字列を逆順にするメソッド
        static string ReverseString(string text)
        {
            char[] chars = text.ToCharArray();
            Array.Reverse(chars);
            return new string(chars);
        }
    }
}`,
      language: 'csharp',
      description: '様々な型の戻り値を持つメソッドの定義と使用例。void、int、double、bool、タプル、文字列を返すメソッドを示しています。'
    },
    {
      id: 'parameters-types',
      title: 'パラメータの種類と使い分け',
      code: `using System;

namespace ParameterTypes
{
    class Program
    {
        static void Main(string[] args)
        {
            // 1. 値渡し（通常のパラメータ）
            int originalValue = 10;
            Console.WriteLine($"元の値: {originalValue}");
            ModifyValue(originalValue);
            Console.WriteLine($"ModifyValue後: {originalValue}"); // 変更されない
            
            Console.WriteLine();
            
            // 2. ref（参照渡し）
            int refValue = 10;
            Console.WriteLine($"ref - 元の値: {refValue}");
            ModifyWithRef(ref refValue);
            Console.WriteLine($"ModifyWithRef後: {refValue}"); // 変更される
            
            Console.WriteLine();
            
            // 3. out（出力パラメータ）
            int quotient, remainder;
            Divide(17, 5, out quotient, out remainder);
            Console.WriteLine($"17 ÷ 5 = {quotient} 余り {remainder}");
            
            // outの宣言と同時使用
            if (TryParseInt("123", out int parsed))
            {
                Console.WriteLine($"パース成功: {parsed}");
            }
            
            Console.WriteLine();
            
            // 4. params（可変長引数）
            int total = Sum(1, 2, 3, 4, 5);
            Console.WriteLine($"1+2+3+4+5 = {total}");
            
            int[] numbers = { 10, 20, 30 };
            total = Sum(numbers);
            Console.WriteLine($"配列の合計: {total}");
            
            Console.WriteLine();
            
            // 5. オプションパラメータ
            CreateUser("山田太郎");
            CreateUser("鈴木花子", 25);
            CreateUser("田中一郎", 30, "東京");
            
            Console.WriteLine();
            
            // 6. 名前付き引数
            SendEmail(
                subject: "会議の連絡",
                to: "user@example.com",
                body: "明日の会議は10時からです。"
            );
        }
        
        // 値渡し（元の値は変更されない）
        static void ModifyValue(int x)
        {
            x = 100;
            Console.WriteLine($"メソッド内: {x}");
        }
        
        // ref（参照渡し - 元の値が変更される）
        static void ModifyWithRef(ref int x)
        {
            x = 100;
            Console.WriteLine($"メソッド内: {x}");
        }
        
        // out（出力パラメータ - 複数の値を返す）
        static void Divide(int dividend, int divisor, out int quotient, out int remainder)
        {
            quotient = dividend / divisor;
            remainder = dividend % divisor;
        }
        
        // outパラメータを使った典型的なパターン
        static bool TryParseInt(string input, out int result)
        {
            return int.TryParse(input, out result);
        }
        
        // params（可変長引数）
        static int Sum(params int[] numbers)
        {
            int total = 0;
            foreach (int num in numbers)
            {
                total += num;
            }
            return total;
        }
        
        // オプションパラメータ（デフォルト値）
        static void CreateUser(string name, int age = 0, string city = "未設定")
        {
            Console.WriteLine($"ユーザー作成: {name}, {age}歳, {city}在住");
        }
        
        // 名前付き引数での呼び出し例
        static void SendEmail(string to, string subject, string body, bool isHtml = false)
        {
            Console.WriteLine($"宛先: {to}");
            Console.WriteLine($"件名: {subject}");
            Console.WriteLine($"本文: {body}");
            Console.WriteLine($"HTML形式: {isHtml}");
        }
    }
}`,
      language: 'csharp',
      description: '値渡し、ref、out、params、オプションパラメータ、名前付き引数など、様々なパラメータの種類と使い方を示しています。'
    },
    {
      id: 'method-overloading-recursion',
      title: 'メソッドオーバーロードと再帰',
      code: `using System;

namespace MethodOverloadingRecursion
{
    class Program
    {
        static void Main(string[] args)
        {
            // メソッドオーバーロードの例
            Console.WriteLine("=== メソッドオーバーロード ===");
            
            // 異なる型での計算
            Console.WriteLine($"整数の加算: {Calculate(5, 3)}");
            Console.WriteLine($"小数の加算: {Calculate(5.5, 3.2)}");
            Console.WriteLine($"3つの整数の加算: {Calculate(5, 3, 2)}");
            Console.WriteLine($"文字列の結合: {Calculate("Hello", "World")}");
            
            // 面積計算のオーバーロード
            Console.WriteLine($"\n正方形の面積（辺=4）: {CalculateArea(4)}");
            Console.WriteLine($"長方形の面積（幅=4, 高さ=6）: {CalculateArea(4, 6)}");
            Console.WriteLine($"円の面積（半径=3）: {CalculateArea(3.0):F2}");
            
            // 再帰の例
            Console.WriteLine("\n=== 再帰メソッド ===");
            
            // 階乗
            int n = 5;
            Console.WriteLine($"{n}! = {Factorial(n)}");
            
            // フィボナッチ数列
            Console.Write("フィボナッチ数列（最初の10項）: ");
            for (int i = 0; i < 10; i++)
            {
                Console.Write($"{Fibonacci(i)} ");
            }
            Console.WriteLine();
            
            // 回文チェック
            string[] words = { "level", "hello", "radar", "world" };
            foreach (string word in words)
            {
                bool isPalindrome = IsPalindrome(word, 0, word.Length - 1);
                Console.WriteLine($"{word} は回文{(isPalindrome ? "です" : "ではありません")}");
            }
            
            // ローカル関数を使った例
            Console.WriteLine("\n=== ローカル関数 ===");
            PrintPattern(5);
        }
        
        // メソッドオーバーロード - 整数の加算
        static int Calculate(int a, int b)
        {
            return a + b;
        }
        
        // メソッドオーバーロード - 小数の加算
        static double Calculate(double a, double b)
        {
            return a + b;
        }
        
        // メソッドオーバーロード - 3つの整数の加算
        static int Calculate(int a, int b, int c)
        {
            return a + b + c;
        }
        
        // メソッドオーバーロード - 文字列の結合
        static string Calculate(string a, string b)
        {
            return a + " " + b;
        }
        
        // 面積計算 - 正方形
        static int CalculateArea(int side)
        {
            return side * side;
        }
        
        // 面積計算 - 長方形
        static int CalculateArea(int width, int height)
        {
            return width * height;
        }
        
        // 面積計算 - 円
        static double CalculateArea(double radius)
        {
            return Math.PI * radius * radius;
        }
        
        // 再帰 - 階乗計算
        static long Factorial(int n)
        {
            if (n <= 1)
                return 1;
            return n * Factorial(n - 1);
        }
        
        // 再帰 - フィボナッチ数
        static int Fibonacci(int n)
        {
            if (n <= 1)
                return n;
            return Fibonacci(n - 1) + Fibonacci(n - 2);
        }
        
        // 再帰 - 回文チェック
        static bool IsPalindrome(string text, int start, int end)
        {
            if (start >= end)
                return true;
            
            if (text[start] != text[end])
                return false;
                
            return IsPalindrome(text, start + 1, end - 1);
        }
        
        // ローカル関数の使用例
        static void PrintPattern(int rows)
        {
            // ローカル関数の定義
            void PrintStars(int count)
            {
                for (int i = 0; i < count; i++)
                {
                    Console.Write("* ");
                }
                Console.WriteLine();
            }
            
            void PrintSpaces(int count)
            {
                for (int i = 0; i < count; i++)
                {
                    Console.Write(" ");
                }
            }
            
            // ピラミッドパターンの出力
            for (int i = 1; i <= rows; i++)
            {
                PrintSpaces(rows - i);
                PrintStars(i);
            }
        }
    }
}`,
      language: 'csharp',
      description: 'メソッドオーバーロード（同名メソッドの異なる実装）、再帰メソッド（階乗、フィボナッチ、回文）、ローカル関数の実装例を示しています。'
    }
  ],
  exercises: [
    {
      id: 'temperature-converter-exercise',
      title: '温度変換メソッド',
      description: '摂氏温度を華氏温度に変換するメソッドと、その逆の変換を行うメソッドを作成してください。変換式：華氏 = 摂氏 × 9/5 + 32',
      starterCode: `using System;

namespace TemperatureConverter
{
    class Program
    {
        static void Main(string[] args)
        {
            double celsius = 25.0;
            double fahrenheit = 77.0;
            
            // ここで変換メソッドを呼び出してください
            // CelsiusToFahrenheit メソッドを実装
            // FahrenheitToCelsius メソッドを実装
            
            // 結果を表示
            // 例: 25°C = 77°F
            // 例: 77°F = 25°C
        }
        
        // ここにメソッドを実装してください
        // 摂氏から華氏への変換
        
        // 華氏から摂氏への変換
    }
}`,
      hints: [
        '摂氏から華氏: F = C × 9/5 + 32',
        '華氏から摂氏: C = (F - 32) × 5/9',
        'double型を返すメソッドとして実装',
        '結果は小数点第1位まで表示'
      ],
      solution: `// 摂氏から華氏への変換
static double CelsiusToFahrenheit(double celsius)
{
    return celsius * 9.0 / 5.0 + 32.0;
}

// 華氏から摂氏への変換
static double FahrenheitToCelsius(double fahrenheit)
{
    return (fahrenheit - 32.0) * 5.0 / 9.0;
}

// Main メソッド内
double convertedF = CelsiusToFahrenheit(celsius);
double convertedC = FahrenheitToCelsius(fahrenheit);

Console.WriteLine($"{celsius}°C = {convertedF:F1}°F");
Console.WriteLine($"{fahrenheit}°F = {convertedC:F1}°C");

// 追加のテストケース
Console.WriteLine("\n=== 温度変換表 ===");
Console.WriteLine("摂氏  →  華氏");
for (int c = 0; c <= 40; c += 10)
{
    double f = CelsiusToFahrenheit(c);
    Console.WriteLine($"{c,3}°C = {f,5:F1}°F");
}

Console.WriteLine("\n華氏  →  摂氏");
for (int f = 32; f <= 212; f += 45)
{
    double c = FahrenheitToCelsius(f);
    Console.WriteLine($"{f,3}°F = {c,5:F1}°C");
}`,
      difficulty: 'easy',
      estimatedTime: 15
    },
    {
      id: 'array-statistics-exercise',
      title: '配列の統計メソッド',
      description: '整数配列を受け取り、最大値、最小値、平均値、合計値を計算する複数のメソッドを作成してください。また、これらの値をすべて返す統合メソッドも作成してください。',
      starterCode: `using System;

namespace ArrayStatistics
{
    class Program
    {
        static void Main(string[] args)
        {
            int[] numbers = { 15, 23, 8, 42, 16, 4, 33, 27 };
            
            Console.WriteLine("配列: " + string.Join(", ", numbers));
            
            // 個別のメソッドを呼び出して結果を表示
            // GetMax, GetMin, GetAverage, GetSum を実装
            
            // 統合メソッドを呼び出して結果を表示
            // GetStatistics を実装（タプルで複数の値を返す）
            
            // ボーナス: 中央値を求めるメソッドも実装
        }
        
        // ここにメソッドを実装してください
        // 最大値を取得
        
        // 最小値を取得
        
        // 平均値を取得
        
        // 合計値を取得
        
        // すべての統計情報を取得（タプルを使用）
        
        // ボーナス: 中央値を取得
    }
}`,
      hints: [
        '最大値・最小値: ループで比較するかArray.Max/Minを使用',
        '平均値: 合計を要素数で割る',
        'タプルで複数の値を返す: (int max, int min, double avg, int sum)',
        '中央値: 配列をソートして中央の値を取得'
      ],
      solution: `// 最大値を取得
static int GetMax(int[] array)
{
    if (array.Length == 0)
        throw new ArgumentException("配列が空です");
        
    int max = array[0];
    foreach (int num in array)
    {
        if (num > max)
            max = num;
    }
    return max;
}

// 最小値を取得
static int GetMin(int[] array)
{
    if (array.Length == 0)
        throw new ArgumentException("配列が空です");
        
    int min = array[0];
    foreach (int num in array)
    {
        if (num < min)
            min = num;
    }
    return min;
}

// 平均値を取得
static double GetAverage(int[] array)
{
    if (array.Length == 0)
        throw new ArgumentException("配列が空です");
        
    return (double)GetSum(array) / array.Length;
}

// 合計値を取得
static int GetSum(int[] array)
{
    int sum = 0;
    foreach (int num in array)
    {
        sum += num;
    }
    return sum;
}

// すべての統計情報を取得
static (int max, int min, double average, int sum) GetStatistics(int[] array)
{
    if (array.Length == 0)
        throw new ArgumentException("配列が空です");
        
    int max = array[0];
    int min = array[0];
    int sum = 0;
    
    foreach (int num in array)
    {
        if (num > max) max = num;
        if (num < min) min = num;
        sum += num;
    }
    
    double average = (double)sum / array.Length;
    
    return (max, min, average, sum);
}

// 中央値を取得
static double GetMedian(int[] array)
{
    if (array.Length == 0)
        throw new ArgumentException("配列が空です");
        
    int[] sorted = (int[])array.Clone();
    Array.Sort(sorted);
    
    int middle = sorted.Length / 2;
    
    if (sorted.Length % 2 == 0)
    {
        // 偶数個の場合は中央2つの平均
        return (sorted[middle - 1] + sorted[middle]) / 2.0;
    }
    else
    {
        // 奇数個の場合は中央の値
        return sorted[middle];
    }
}

// Main メソッド内
// 個別のメソッドを呼び出し
Console.WriteLine($"\n最大値: {GetMax(numbers)}");
Console.WriteLine($"最小値: {GetMin(numbers)}");
Console.WriteLine($"平均値: {GetAverage(numbers):F2}");
Console.WriteLine($"合計値: {GetSum(numbers)}");

// 統合メソッドを呼び出し
var stats = GetStatistics(numbers);
Console.WriteLine($"\n=== 統計情報（統合メソッド） ===");
Console.WriteLine($"最大値: {stats.max}");
Console.WriteLine($"最小値: {stats.min}");
Console.WriteLine($"平均値: {stats.average:F2}");
Console.WriteLine($"合計値: {stats.sum}");

// 中央値
Console.WriteLine($"\n中央値: {GetMedian(numbers)}");

// 追加の情報
Console.WriteLine($"\n要素数: {numbers.Length}");
Console.WriteLine($"範囲: {stats.max - stats.min}");`,
      difficulty: 'medium',
      estimatedTime: 25
    },
    {
      id: 'string-manipulation-exercise',
      title: '文字列操作メソッド集',
      description: '文字列を操作する様々なメソッドを作成してください。回文判定、単語数カウント、大文字小文字の変換、文字列の暗号化（シーザー暗号）などを実装します。',
      starterCode: `using System;

namespace StringManipulation
{
    class Program
    {
        static void Main(string[] args)
        {
            // テスト用の文字列
            string text1 = "level";
            string text2 = "Hello World";
            string text3 = "The quick brown fox jumps over the lazy dog";
            
            // 各メソッドを実装してテスト
            // 1. IsPalindrome - 回文判定
            // 2. CountWords - 単語数カウント
            // 3. SwapCase - 大文字小文字を反転
            // 4. CaesarCipher - シーザー暗号（文字をn文字ずらす）
            // 5. RemoveVowels - 母音を削除
            
            // ボーナス: CountCharacterFrequency - 文字の出現頻度を計算
        }
        
        // ここにメソッドを実装してください
    }
}`,
      hints: [
        '回文判定: 文字列を逆順にして比較',
        '単語数: スペースで分割してカウント',
        '大文字小文字反転: char.IsUpper/IsLowerとchar.ToUpper/ToLowerを使用',
        'シーザー暗号: 文字コードを操作（A-Z, a-zの範囲に注意）'
      ],
      solution: `// 回文判定
static bool IsPalindrome(string text)
{
    // 空白と大文字小文字を無視
    string cleaned = text.Replace(" ", "").ToLower();
    
    int left = 0;
    int right = cleaned.Length - 1;
    
    while (left < right)
    {
        if (cleaned[left] != cleaned[right])
            return false;
        left++;
        right--;
    }
    
    return true;
}

// 単語数カウント
static int CountWords(string text)
{
    if (string.IsNullOrWhiteSpace(text))
        return 0;
        
    // 複数のスペースを考慮
    string[] words = text.Split(new[] { ' ', '\t', '\n' }, 
                               StringSplitOptions.RemoveEmptyEntries);
    return words.Length;
}

// 大文字小文字を反転
static string SwapCase(string text)
{
    char[] result = new char[text.Length];
    
    for (int i = 0; i < text.Length; i++)
    {
        char c = text[i];
        if (char.IsUpper(c))
            result[i] = char.ToLower(c);
        else if (char.IsLower(c))
            result[i] = char.ToUpper(c);
        else
            result[i] = c;
    }
    
    return new string(result);
}

// シーザー暗号
static string CaesarCipher(string text, int shift)
{
    char[] result = new char[text.Length];
    
    for (int i = 0; i < text.Length; i++)
    {
        char c = text[i];
        
        if (char.IsUpper(c))
        {
            // 大文字の処理
            int shifted = ((c - 'A' + shift) % 26 + 26) % 26;
            result[i] = (char)('A' + shifted);
        }
        else if (char.IsLower(c))
        {
            // 小文字の処理
            int shifted = ((c - 'a' + shift) % 26 + 26) % 26;
            result[i] = (char)('a' + shifted);
        }
        else
        {
            // アルファベット以外はそのまま
            result[i] = c;
        }
    }
    
    return new string(result);
}

// 母音を削除
static string RemoveVowels(string text)
{
    string vowels = "aeiouAEIOU";
    string result = "";
    
    foreach (char c in text)
    {
        if (!vowels.Contains(c))
        {
            result += c;
        }
    }
    
    return result;
}

// 文字の出現頻度を計算
static void CountCharacterFrequency(string text)
{
    int[] frequency = new int[256]; // ASCII文字用
    
    foreach (char c in text)
    {
        frequency[c]++;
    }
    
    Console.WriteLine("文字の出現頻度:");
    for (int i = 0; i < 256; i++)
    {
        if (frequency[i] > 0 && !char.IsControl((char)i))
        {
            Console.WriteLine($"'{(char)i}': {frequency[i]}回");
        }
    }
}

// Main メソッド内
Console.WriteLine($"'{text1}' は回文？ {IsPalindrome(text1)}");
Console.WriteLine($"'{text2}' は回文？ {IsPalindrome(text2)}");

Console.WriteLine($"\n'{text3}' の単語数: {CountWords(text3)}");

string swapped = SwapCase(text2);
Console.WriteLine($"\n'{text2}' の大文字小文字反転: '{swapped}'");

string encrypted = CaesarCipher(text2, 3);
string decrypted = CaesarCipher(encrypted, -3);
Console.WriteLine($"\n'{text2}' のシーザー暗号（+3）: '{encrypted}'");
Console.WriteLine($"復号化: '{decrypted}'");

string noVowels = RemoveVowels(text2);
Console.WriteLine($"\n'{text2}' の母音削除: '{noVowels}'");

Console.WriteLine($"\n'{text2}' の文字頻度:");
CountCharacterFrequency(text2);`,
      difficulty: 'hard',
      estimatedTime: 35
    }
  ],
  estimatedTime: 60,
  difficulty: 'beginner',
  prerequisites: ['hello-world', 'variables-and-types', 'operators-and-expressions', 'arrays-and-collections', 'control-flow-if', 'control-flow-switch', 'loops-for-while'],
  nextLesson: 'classes-and-objects'
};