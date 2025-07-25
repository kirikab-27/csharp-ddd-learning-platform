import type { Lesson } from '../../../../features/learning/types';

export const arraysCollectionsLesson: Lesson = {
  id: 'arrays-and-collections',
  title: '配列とコレクション',
  description: 'C#の配列とコレクション（List<T>）を学び、複数のデータを効率的に扱う方法を習得します',
  order: 4,
  content: `# 配列とコレクション

プログラミングでは、同じ種類の複数のデータをまとめて扱うことがよくあります。C#では、配列やコレクションを使用して効率的にデータを管理できます。

## 配列（Array）

配列は、同じ型の複数の値を連続したメモリ領域に格納するデータ構造です。

### 配列の宣言と初期化

\`\`\`csharp
// 方法1: サイズを指定して宣言
int[] numbers = new int[5];  // 5個の整数を格納できる配列

// 方法2: 初期値を指定して宣言
string[] fruits = { "りんご", "みかん", "ぶどう" };

// 方法3: newキーワードと初期値
int[] scores = new int[] { 85, 90, 78, 92, 88 };
\`\`\`

### 配列の要素へのアクセス

配列の要素には、0から始まるインデックス（添字）を使ってアクセスします。

\`\`\`csharp
string[] days = { "月", "火", "水", "木", "金", "土", "日" };
Console.WriteLine(days[0]);  // "月" （最初の要素）
Console.WriteLine(days[6]);  // "日" （最後の要素）

// 要素の変更
days[0] = "月曜日";
\`\`\`

### 配列の長さ

配列の要素数は Length プロパティで取得できます。

\`\`\`csharp
int[] numbers = { 10, 20, 30, 40, 50 };
Console.WriteLine($"配列の長さ: {numbers.Length}");  // 5
\`\`\`

## List<T>（ジェネリックリスト）

List<T>は、動的にサイズを変更できる配列のようなコレクションです。

### List<T>の宣言と初期化

\`\`\`csharp
// 空のリストを作成
List<string> names = new List<string>();

// 初期値を指定して作成
List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };
\`\`\`

### List<T>の基本操作

\`\`\`csharp
List<string> todoList = new List<string>();

// 要素の追加
todoList.Add("買い物");
todoList.Add("勉強");
todoList.Add("運動");

// 要素の削除
todoList.Remove("買い物");  // 値を指定して削除
todoList.RemoveAt(0);        // インデックスで削除

// 要素数の取得
int count = todoList.Count;

// すべての要素をクリア
todoList.Clear();
\`\`\`

## 配列 vs List<T>

### 配列を使う場合
- 要素数が固定で変わらない場合
- パフォーマンスが重要な場合
- 多次元データを扱う場合

### List<T>を使う場合
- 要素数が動的に変化する場合
- 要素の追加・削除が頻繁な場合
- より豊富なメソッドが必要な場合

## foreach文による反復処理

配列やList<T>の全要素を処理する場合、foreach文が便利です。

\`\`\`csharp
string[] colors = { "赤", "青", "緑", "黄" };

foreach (string color in colors)
{
    Console.WriteLine($"色: {color}");
}
\`\`\``,
  codeExamples: [
    {
      id: 'array-basics',
      title: '配列の基本操作',
      code: `using System;

namespace ArrayBasics
{
    class Program
    {
        static void Main(string[] args)
        {
            // 配列の宣言と初期化
            string[] weekDays = { "月", "火", "水", "木", "金" };
            
            // 配列の要素を表示
            Console.WriteLine("平日の一覧:");
            for (int i = 0; i < weekDays.Length; i++)
            {
                Console.WriteLine($"{i + 1}日目: {weekDays[i]}曜日");
            }
            
            // 特定の要素にアクセス
            Console.WriteLine($"\n3日目は{weekDays[2]}曜日です");
            
            // 配列の要素を変更
            weekDays[0] = "月（げつ）";
            Console.WriteLine($"変更後の1日目: {weekDays[0]}曜日");
            
            // 配列の長さを取得
            Console.WriteLine($"\n配列の要素数: {weekDays.Length}");
        }
    }
}`,
      language: 'csharp',
      description: '配列の宣言、要素へのアクセス、変更、長さの取得など、基本的な配列操作を示しています。'
    },
    {
      id: 'list-operations',
      title: 'List<T>の操作',
      code: `using System;
using System.Collections.Generic;

namespace ListOperations
{
    class Program
    {
        static void Main(string[] args)
        {
            // List<T>の作成
            List<string> shoppingList = new List<string>();
            
            // 要素の追加
            shoppingList.Add("パン");
            shoppingList.Add("牛乳");
            shoppingList.Add("卵");
            Console.WriteLine("買い物リスト:");
            PrintList(shoppingList);
            
            // 要素の挿入（インデックスを指定）
            shoppingList.Insert(1, "バター");
            Console.WriteLine("\nバターを2番目に挿入:");
            PrintList(shoppingList);
            
            // 要素の削除
            shoppingList.Remove("牛乳");
            Console.WriteLine("\n牛乳を削除:");
            PrintList(shoppingList);
            
            // 要素の検索
            bool hasEgg = shoppingList.Contains("卵");
            Console.WriteLine($"\n卵はリストにある？: {hasEgg}");
            
            // リストのクリア
            Console.WriteLine($"\n現在のアイテム数: {shoppingList.Count}");
            shoppingList.Clear();
            Console.WriteLine($"クリア後のアイテム数: {shoppingList.Count}");
        }
        
        static void PrintList(List<string> list)
        {
            for (int i = 0; i < list.Count; i++)
            {
                Console.WriteLine($"  {i + 1}. {list[i]}");
            }
        }
    }
}`,
      language: 'csharp',
      description: 'List<T>の作成、要素の追加・挿入・削除、検索など、動的なリスト操作を示しています。'
    },
    {
      id: 'foreach-example',
      title: 'foreachによる反復処理',
      code: `using System;
using System.Collections.Generic;

namespace ForeachExample
{
    class Program
    {
        static void Main(string[] args)
        {
            // 配列でのforeach
            int[] scores = { 85, 92, 78, 95, 88 };
            int total = 0;
            
            Console.WriteLine("テストの点数:");
            foreach (int score in scores)
            {
                Console.WriteLine($"  {score}点");
                total += score;
            }
            
            double average = (double)total / scores.Length;
            Console.WriteLine($"平均点: {average:F1}点");
            
            // List<T>でのforeach
            List<string> tasks = new List<string> 
            { 
                "メール確認", 
                "会議準備", 
                "報告書作成", 
                "コードレビュー" 
            };
            
            Console.WriteLine("\n今日のタスク:");
            int taskNumber = 1;
            foreach (string task in tasks)
            {
                Console.WriteLine($"  □ {taskNumber}. {task}");
                taskNumber++;
            }
            
            // 条件付き処理
            Console.WriteLine("\n80点以上の点数:");
            foreach (int score in scores)
            {
                if (score >= 80)
                {
                    Console.WriteLine($"  {score}点 - 合格！");
                }
            }
        }
    }
}`,
      language: 'csharp',
      description: 'foreach文を使った配列とList<T>の反復処理、合計・平均の計算、条件付き処理の例です。'
    }
  ],
  exercises: [
    {
      id: 'student-scores-exercise',
      title: '成績管理プログラム',
      description: '5人の学生の点数を配列に格納し、最高点、最低点、平均点を計算して表示するプログラムを作成してください。',
      starterCode: `using System;

namespace StudentScores
{
    class Program
    {
        static void Main(string[] args)
        {
            // 5人の学生の点数を格納する配列
            int[] scores = { 85, 92, 78, 95, 88 };
            string[] names = { "田中", "鈴木", "佐藤", "山田", "伊藤" };
            
            // ここに最高点、最低点、平均点を計算するコードを書いてください
            // ヒント: 
            // - 最高点と最低点は初期値をscores[0]にする
            // - foreachまたはforループで全要素を確認
            // - 平均点は合計を要素数で割る（小数点を出すためdoubleにキャスト）
            
            // 結果を表示
            // 例: 最高点: 山田さん 95点
        }
    }
}`,
      hints: [
        '最高点と最低点の初期値はscores[0]に設定',
        'forループでインデックスを使い、点数と名前を同時に扱う',
        '最高点・最低点を更新する際は、インデックスも記録',
        '平均点の計算では(double)でキャストして小数点を表示'
      ],
      solution: `int maxScore = scores[0];
int minScore = scores[0];
int maxIndex = 0;
int minIndex = 0;
int total = 0;

// 最高点、最低点、合計を計算
for (int i = 0; i < scores.Length; i++)
{
    total += scores[i];
    
    if (scores[i] > maxScore)
    {
        maxScore = scores[i];
        maxIndex = i;
    }
    
    if (scores[i] < minScore)
    {
        minScore = scores[i];
        minIndex = i;
    }
}

// 平均点を計算
double average = (double)total / scores.Length;

// 結果を表示
Console.WriteLine("=== 成績分析結果 ===");
Console.WriteLine($"最高点: {names[maxIndex]}さん {maxScore}点");
Console.WriteLine($"最低点: {names[minIndex]}さん {minScore}点");
Console.WriteLine($"平均点: {average:F1}点");

// 全員の成績も表示
Console.WriteLine("\n全員の成績:");
for (int i = 0; i < scores.Length; i++)
{
    Console.WriteLine($"{names[i]}さん: {scores[i]}点");
}`,
      difficulty: 'medium',
      estimatedTime: 20
    },
    {
      id: 'todo-list-exercise',
      title: 'ToDoリスト管理',
      description: 'List<string>を使って簡単なToDoリストを管理するプログラムを作成してください。タスクの追加、完了したタスクの削除、リストの表示機能を実装します。',
      starterCode: `using System;
using System.Collections.Generic;

namespace TodoListManager
{
    class Program
    {
        static void Main(string[] args)
        {
            List<string> todoList = new List<string>();
            
            // 初期タスクを追加
            todoList.Add("朝食を食べる");
            todoList.Add("メールをチェック");
            todoList.Add("運動する");
            
            // 1. 現在のToDoリストを表示
            Console.WriteLine("現在のToDoリスト:");
            // ここにリストを表示するコードを書いてください
            
            // 2. 新しいタスクを2つ追加
            // "買い物に行く" と "本を読む" を追加してください
            
            // 3. 追加後のリストを表示
            
            // 4. "メールをチェック" を完了として削除
            
            // 5. 最終的なリストと残りのタスク数を表示
        }
    }
}`,
      hints: [
        'リスト表示にはforeachまたはforループを使用',
        'Add()メソッドでタスクを追加',
        'Remove()メソッドで特定のタスクを削除',
        'Count プロパティで要素数を取得'
      ],
      solution: `// 1. 現在のToDoリストを表示
Console.WriteLine("現在のToDoリスト:");
foreach (string task in todoList)
{
    Console.WriteLine($"□ {task}");
}

// 2. 新しいタスクを追加
todoList.Add("買い物に行く");
todoList.Add("本を読む");

// 3. 追加後のリストを表示
Console.WriteLine("\n新しいタスクを追加しました:");
for (int i = 0; i < todoList.Count; i++)
{
    Console.WriteLine($"{i + 1}. {todoList[i]}");
}

// 4. "メールをチェック" を完了として削除
todoList.Remove("メールをチェック");
Console.WriteLine("\n「メールをチェック」を完了しました！");

// 5. 最終的なリストと残りのタスク数を表示
Console.WriteLine("\n残りのタスク:");
foreach (string task in todoList)
{
    Console.WriteLine($"□ {task}");
}
Console.WriteLine($"\n残りタスク数: {todoList.Count}個");`,
      difficulty: 'easy',
      estimatedTime: 15
    },
    {
      id: 'duplicate-finder-exercise',
      title: '重複要素の検出',
      description: '整数の配列から重複している要素を見つけて、List<int>に格納し表示するプログラムを作成してください。',
      starterCode: `using System;
using System.Collections.Generic;

namespace DuplicateFinder
{
    class Program
    {
        static void Main(string[] args)
        {
            // 重複を含む数値の配列
            int[] numbers = { 3, 7, 3, 2, 8, 2, 9, 7, 1, 3 };
            
            // 重複した数値を格納するリスト
            List<int> duplicates = new List<int>();
            
            // ここに重複を検出するコードを書いてください
            // ヒント:
            // - 二重ループを使用
            // - 既に重複リストに追加済みかチェック
            // - Contains()メソッドで存在確認
            
            // 結果を表示
            // 例: 重複している数値: 3, 7, 2
        }
    }
}`,
      hints: [
        '外側のループで各要素を選択',
        '内側のループで同じ値を探す（i+1から開始）',
        'duplicates.Contains()で既に追加済みかチェック',
        '重複が見つかったらList.Add()で追加'
      ],
      solution: `// 重複を検出
for (int i = 0; i < numbers.Length; i++)
{
    for (int j = i + 1; j < numbers.Length; j++)
    {
        if (numbers[i] == numbers[j])
        {
            // 既に重複リストに含まれていない場合のみ追加
            if (!duplicates.Contains(numbers[i]))
            {
                duplicates.Add(numbers[i]);
            }
            break; // この数値の重複は見つかったので内側のループを抜ける
        }
    }
}

// 結果を表示
Console.WriteLine("元の配列:");
foreach (int num in numbers)
{
    Console.Write($"{num} ");
}
Console.WriteLine();

if (duplicates.Count > 0)
{
    Console.WriteLine("\n重複している数値:");
    foreach (int dup in duplicates)
    {
        Console.Write($"{dup} ");
    }
    Console.WriteLine();
    
    // 各数値の出現回数も表示
    Console.WriteLine("\n詳細（出現回数）:");
    foreach (int dup in duplicates)
    {
        int count = 0;
        foreach (int num in numbers)
        {
            if (num == dup) count++;
        }
        Console.WriteLine($"{dup}: {count}回");
    }
}
else
{
    Console.WriteLine("\n重複する要素はありません。");
}`,
      difficulty: 'hard',
      estimatedTime: 25
    }
  ],
  estimatedTime: 45,
  difficulty: 'beginner',
  prerequisites: ['hello-world', 'variables-and-types', 'operators-and-expressions'],
  nextLesson: 'control-flow-if'
};