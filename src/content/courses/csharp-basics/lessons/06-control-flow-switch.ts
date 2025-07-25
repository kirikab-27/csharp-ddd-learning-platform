import type { Lesson } from '../../../../features/learning/types';

export const controlFlowSwitchLesson: Lesson = {
  id: 'control-flow-switch',
  title: '条件分岐（switch文）',
  description: 'switch文とswitch式を使った効率的な条件分岐を学び、パターンマッチングの基礎を習得します',
  order: 6,
  content: `# 条件分岐（switch文）

switch文は、一つの変数や式の値に基づいて、複数の選択肢から処理を選ぶための制御構造です。多くの条件分岐がある場合、if-else文よりも読みやすく効率的です。

## switch文の基本構文

\`\`\`csharp
switch (式)
{
    case 値1:
        // 値1の場合の処理
        break;
    case 値2:
        // 値2の場合の処理
        break;
    default:
        // どのcaseにも一致しない場合の処理
        break;
}
\`\`\`

### 重要なポイント
- 各caseの最後には\`break;\`が必要（フォールスルーを防ぐ）
- \`default\`は省略可能だが、推奨される
- caseの値は定数でなければならない

## 複数のcaseをまとめる

同じ処理を行う複数のcaseをまとめることができます：

\`\`\`csharp
switch (dayOfWeek)
{
    case "土曜日":
    case "日曜日":
        Console.WriteLine("週末です");
        break;
    default:
        Console.WriteLine("平日です");
        break;
}
\`\`\`

## switch式（C# 8.0以降）

より簡潔に書けるswitch式が導入されました：

\`\`\`csharp
string result = dayNumber switch
{
    1 => "月曜日",
    2 => "火曜日",
    3 => "水曜日",
    4 => "木曜日",
    5 => "金曜日",
    6 => "土曜日",
    7 => "日曜日",
    _ => "無効な日"
};
\`\`\`

### switch式の特徴
- より簡潔な構文
- 式として値を返せる
- \`_\`はdefaultに相当

## パターンマッチング

C#の新しいバージョンでは、より高度なパターンマッチングが可能です：

### 型パターン
\`\`\`csharp
switch (obj)
{
    case int n:
        Console.WriteLine($"整数: {n}");
        break;
    case string s:
        Console.WriteLine($"文字列: {s}");
        break;
    case null:
        Console.WriteLine("null値");
        break;
}
\`\`\`

### 条件付きパターン（when句）
\`\`\`csharp
switch (score)
{
    case int n when n >= 90:
        return "A";
    case int n when n >= 80:
        return "B";
    case int n when n >= 70:
        return "C";
    default:
        return "F";
}
\`\`\`

## switch vs if-else

### switchを使うべき場合
- 一つの変数の値で分岐する場合
- 分岐が3つ以上ある場合
- 各条件が明確に区別される場合

### if-elseを使うべき場合
- 複雑な条件式が必要な場合
- 範囲での判定が必要な場合
- 複数の変数を組み合わせた条件の場合`,
  codeExamples: [
    {
      id: 'basic-switch',
      title: '基本的なswitch文',
      code: `using System;

namespace BasicSwitch
{
    class Program
    {
        static void Main(string[] args)
        {
            // 曜日による処理の分岐
            int dayNumber = 3;  // 1=月曜日, 2=火曜日, ...
            string dayName;
            string dayType;
            
            // switch文で曜日名を取得
            switch (dayNumber)
            {
                case 1:
                    dayName = "月曜日";
                    break;
                case 2:
                    dayName = "火曜日";
                    break;
                case 3:
                    dayName = "水曜日";
                    break;
                case 4:
                    dayName = "木曜日";
                    break;
                case 5:
                    dayName = "金曜日";
                    break;
                case 6:
                    dayName = "土曜日";
                    break;
                case 7:
                    dayName = "日曜日";
                    break;
                default:
                    dayName = "無効な日";
                    break;
            }
            
            // 複数のcaseをまとめる例
            switch (dayNumber)
            {
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                    dayType = "平日";
                    break;
                case 6:
                case 7:
                    dayType = "週末";
                    break;
                default:
                    dayType = "不明";
                    break;
            }
            
            Console.WriteLine($"日番号 {dayNumber} は {dayName} ({dayType})です。");
            
            // 月による季節の判定
            int month = 7;
            string season;
            
            switch (month)
            {
                case 3:
                case 4:
                case 5:
                    season = "春";
                    break;
                case 6:
                case 7:
                case 8:
                    season = "夏";
                    break;
                case 9:
                case 10:
                case 11:
                    season = "秋";
                    break;
                case 12:
                case 1:
                case 2:
                    season = "冬";
                    break;
                default:
                    season = "無効な月";
                    break;
            }
            
            Console.WriteLine($"\n{month}月は{season}です。");
        }
    }
}`,
      language: 'csharp',
      description: '基本的なswitch文の使い方。曜日と季節の判定を通じて、単一caseと複数caseをまとめる方法を示しています。'
    },
    {
      id: 'switch-expression',
      title: 'switch式の使用例',
      code: `using System;

namespace SwitchExpression
{
    class Program
    {
        static void Main(string[] args)
        {
            // 成績評価システム（switch式を使用）
            int score = 85;
            
            // 従来のswitch文での実装
            string gradeOld;
            switch (score / 10)
            {
                case 10:
                case 9:
                    gradeOld = "A";
                    break;
                case 8:
                    gradeOld = "B";
                    break;
                case 7:
                    gradeOld = "C";
                    break;
                case 6:
                    gradeOld = "D";
                    break;
                default:
                    gradeOld = "F";
                    break;
            }
            
            // switch式での実装（C# 8.0以降）
            string gradeNew = (score / 10) switch
            {
                10 => "A",
                9 => "A",
                8 => "B",
                7 => "C",
                6 => "D",
                _ => "F"
            };
            
            Console.WriteLine($"点数: {score}");
            Console.WriteLine($"評価（従来）: {gradeOld}");
            Console.WriteLine($"評価（新式）: {gradeNew}");
            
            // より複雑なswitch式の例
            string performance = score switch
            {
                >= 95 => "優秀！素晴らしい成績です",
                >= 90 => "とても良い成績です",
                >= 80 => "良い成績です",
                >= 70 => "合格です",
                >= 60 => "もう少し頑張りましょう",
                _ => "追試が必要です"
            };
            
            Console.WriteLine($"コメント: {performance}");
            
            // 曜日の種類を判定するswitch式
            DayOfWeek today = DayOfWeek.Wednesday;
            string dayType = today switch
            {
                DayOfWeek.Saturday or DayOfWeek.Sunday => "週末",
                DayOfWeek.Monday => "週の始まり",
                DayOfWeek.Friday => "花金！",
                _ => "平日"
            };
            
            Console.WriteLine($"\n今日（{today}）は: {dayType}");
            
            // タプルパターンを使った例
            var time = (hour: 14, minute: 30);
            string period = time switch
            {
                (< 6, _) => "深夜",
                (< 12, _) => "午前",
                (12, 0) => "正午",
                (< 18, _) => "午後",
                (< 21, _) => "夕方",
                _ => "夜"
            };
            
            Console.WriteLine($"\n{time.hour}:{time.minute:D2} は {period}です");
        }
    }
}`,
      language: 'csharp',
      description: 'C# 8.0以降で導入されたswitch式の使い方。従来のswitch文との比較、パターンマッチング、タプルパターンなど高度な使用例を示しています。'
    },
    {
      id: 'menu-system',
      title: 'メニューシステムの実装',
      code: `using System;

namespace MenuSystem
{
    class Program
    {
        static void Main(string[] args)
        {
            // レストランの注文システム
            Console.WriteLine("=== レストランメニュー ===");
            Console.WriteLine("1. ハンバーガーセット (800円)");
            Console.WriteLine("2. パスタセット (900円)");
            Console.WriteLine("3. カレーライス (700円)");
            Console.WriteLine("4. サラダセット (600円)");
            Console.WriteLine("5. 本日のスペシャル (1200円)");
            
            int menuChoice = 3;  // ユーザーの選択（実際はConsole.ReadLineで取得）
            int quantity = 2;    // 注文数量
            
            string itemName;
            int unitPrice;
            string category;
            bool includesDrink;
            
            // メニューの詳細をswitch文で処理
            switch (menuChoice)
            {
                case 1:
                    itemName = "ハンバーガーセット";
                    unitPrice = 800;
                    category = "ファストフード";
                    includesDrink = true;
                    break;
                case 2:
                    itemName = "パスタセット";
                    unitPrice = 900;
                    category = "イタリアン";
                    includesDrink = true;
                    break;
                case 3:
                    itemName = "カレーライス";
                    unitPrice = 700;
                    category = "和洋食";
                    includesDrink = false;
                    break;
                case 4:
                    itemName = "サラダセット";
                    unitPrice = 600;
                    category = "ヘルシー";
                    includesDrink = true;
                    break;
                case 5:
                    itemName = "本日のスペシャル";
                    unitPrice = 1200;
                    category = "シェフのおすすめ";
                    includesDrink = true;
                    break;
                default:
                    itemName = "無効な選択";
                    unitPrice = 0;
                    category = "エラー";
                    includesDrink = false;
                    break;
            }
            
            // 注文内容の表示
            if (unitPrice > 0)
            {
                Console.WriteLine($"\n=== ご注文内容 ===");
                Console.WriteLine($"商品: {itemName}");
                Console.WriteLine($"カテゴリー: {category}");
                Console.WriteLine($"単価: {unitPrice}円");
                Console.WriteLine($"数量: {quantity}個");
                Console.WriteLine($"ドリンク付き: {(includesDrink ? "はい" : "いいえ")}");
                
                int subtotal = unitPrice * quantity;
                Console.WriteLine($"\n小計: {subtotal}円");
                
                // 割引の適用（switch式を使用）
                double discountRate = (quantity, category) switch
                {
                    (>= 5, _) => 0.15,              // 5個以上で15%割引
                    (>= 3, "ヘルシー") => 0.10,     // ヘルシー商品3個以上で10%割引
                    (>= 3, _) => 0.05,              // 3個以上で5%割引
                    _ => 0.0                         // 割引なし
                };
                
                if (discountRate > 0)
                {
                    int discountAmount = (int)(subtotal * discountRate);
                    Console.WriteLine($"割引率: {discountRate:P0}");
                    Console.WriteLine($"割引額: -{discountAmount}円");
                    Console.WriteLine($"合計: {subtotal - discountAmount}円");
                }
                else
                {
                    Console.WriteLine("割引: なし");
                    Console.WriteLine($"合計: {subtotal}円");
                }
                
                // 支払い方法の選択
                char paymentMethod = 'C';  // C=現金, R=クレジット, E=電子マネー
                
                string paymentMessage = paymentMethod switch
                {
                    'C' => "現金でのお支払いです。お釣りをお忘れなく！",
                    'R' => "クレジットカードでのお支払いです。サインをお願いします。",
                    'E' => "電子マネーでのお支払いです。タッチしてください。",
                    _ => "無効な支払い方法です。"
                };
                
                Console.WriteLine($"\n{paymentMessage}");
            }
            else
            {
                Console.WriteLine("\n無効なメニュー番号です。もう一度お選びください。");
            }
        }
    }
}`,
      language: 'csharp',
      description: '実践的なメニューシステムの実装例。switch文とswitch式を組み合わせて、注文処理、割引計算、支払い方法の選択を実装しています。'
    }
  ],
  exercises: [
    {
      id: 'calculator-switch-exercise',
      title: '電卓プログラム（switch版）',
      description: 'switch文を使って、2つの数値と演算子（+, -, *, /）を受け取り、計算結果を表示する電卓プログラムを作成してください。',
      starterCode: `using System;

namespace CalculatorSwitch
{
    class Program
    {
        static void Main(string[] args)
        {
            double num1 = 10;
            double num2 = 3;
            char operation = '+';  // +, -, *, / のいずれか
            
            Console.WriteLine($"計算: {num1} {operation} {num2}");
            
            // ここにswitch文を使って計算を実装してください
            // 各演算子に対応する計算を行い、結果を表示
            // 0での除算もチェックしてください
            // 無効な演算子の場合はエラーメッセージを表示
        }
    }
}`,
      hints: [
        'switch (operation) で演算子を判定',
        '各caseで対応する計算を実行',
        '除算の場合は num2 == 0 をチェック',
        'defaultで無効な演算子を処理'
      ],
      solution: `double result = 0;
bool validOperation = true;
string errorMessage = "";

switch (operation)
{
    case '+':
        result = num1 + num2;
        break;
    case '-':
        result = num1 - num2;
        break;
    case '*':
        result = num1 * num2;
        break;
    case '/':
        if (num2 == 0)
        {
            validOperation = false;
            errorMessage = "エラー: 0で除算することはできません";
        }
        else
        {
            result = num1 / num2;
        }
        break;
    default:
        validOperation = false;
        errorMessage = $"エラー: '{operation}' は無効な演算子です";
        break;
}

// 結果を表示
if (validOperation)
{
    Console.WriteLine($"結果: {result}");
    
    // 結果を整数か小数で適切に表示
    if (result == Math.Floor(result))
    {
        Console.WriteLine($"答え: {(int)result}");
    }
    else
    {
        Console.WriteLine($"答え: {result:F2}");
    }
}
else
{
    Console.WriteLine(errorMessage);
    Console.WriteLine("有効な演算子: +, -, *, /");
}`,
      difficulty: 'easy',
      estimatedTime: 15
    },
    {
      id: 'month-info-exercise',
      title: '月の情報表示システム',
      description: '月番号（1-12）を受け取り、その月の名前、季節、日数を表示するプログラムをswitch文で作成してください。うるう年の判定も含めてください。',
      starterCode: `using System;

namespace MonthInfo
{
    class Program
    {
        static void Main(string[] args)
        {
            int month = 2;
            int year = 2024;  // うるう年の判定用
            
            Console.WriteLine($"{year}年{month}月の情報:");
            
            // ここにswitch文を使って実装してください
            // 1. 月の名前（1月、2月...）
            // 2. 季節（春：3-5月、夏：6-8月、秋：9-11月、冬：12,1,2月）
            // 3. 日数（2月はうるう年判定が必要）
            
            // うるう年の判定:
            // - 4で割り切れる年はうるう年
            // - ただし100で割り切れる年は平年
            // - ただし400で割り切れる年はうるう年
        }
    }
}`,
      hints: [
        '月の名前は単純にcase 1: "1月" のように',
        '季節は複数のcaseをまとめて処理',
        '日数は30日の月と31日の月で分ける',
        'うるう年判定は別途if文で計算してからswitchで使用'
      ],
      solution: `// うるう年の判定
bool isLeapYear = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);

string monthName;
string season;
int days;

// 月の名前を取得
switch (month)
{
    case 1: monthName = "1月"; break;
    case 2: monthName = "2月"; break;
    case 3: monthName = "3月"; break;
    case 4: monthName = "4月"; break;
    case 5: monthName = "5月"; break;
    case 6: monthName = "6月"; break;
    case 7: monthName = "7月"; break;
    case 8: monthName = "8月"; break;
    case 9: monthName = "9月"; break;
    case 10: monthName = "10月"; break;
    case 11: monthName = "11月"; break;
    case 12: monthName = "12月"; break;
    default: monthName = "無効な月"; break;
}

// 季節を判定
switch (month)
{
    case 3:
    case 4:
    case 5:
        season = "春";
        break;
    case 6:
    case 7:
    case 8:
        season = "夏";
        break;
    case 9:
    case 10:
    case 11:
        season = "秋";
        break;
    case 12:
    case 1:
    case 2:
        season = "冬";
        break;
    default:
        season = "不明";
        break;
}

// 日数を判定
switch (month)
{
    case 2:
        days = isLeapYear ? 29 : 28;
        break;
    case 4:
    case 6:
    case 9:
    case 11:
        days = 30;
        break;
    case 1:
    case 3:
    case 5:
    case 7:
    case 8:
    case 10:
    case 12:
        days = 31;
        break;
    default:
        days = 0;
        break;
}

// 結果を表示
if (month >= 1 && month <= 12)
{
    Console.WriteLine($"月名: {monthName}");
    Console.WriteLine($"季節: {season}");
    Console.WriteLine($"日数: {days}日");
    
    if (month == 2)
    {
        Console.WriteLine($"うるう年: {(isLeapYear ? "はい" : "いいえ")}");
    }
    
    // 追加情報
    Console.WriteLine($"\nその他の情報:");
    switch (season)
    {
        case "春":
            Console.WriteLine("- 桜の季節です");
            break;
        case "夏":
            Console.WriteLine("- 暑い日が続きます");
            break;
        case "秋":
            Console.WriteLine("- 紅葉が美しい季節です");
            break;
        case "冬":
            Console.WriteLine("- 寒さ対策を忘れずに");
            break;
    }
}
else
{
    Console.WriteLine("エラー: 1-12の数値を入力してください");
}`,
      difficulty: 'medium',
      estimatedTime: 20
    },
    {
      id: 'game-command-exercise',
      title: 'ゲームコマンドシステム',
      description: 'テキストベースのゲームのコマンドシステムを実装してください。プレイヤーの入力に応じて、移動、アイテム使用、ステータス表示などの処理を行います。',
      starterCode: `using System;

namespace GameCommand
{
    class Program
    {
        static void Main(string[] args)
        {
            // プレイヤーの状態
            int playerHP = 100;
            int playerMP = 50;
            string currentLocation = "村";
            int gold = 100;
            bool hasPotion = true;
            bool hasSword = false;
            
            // コマンド入力（実際はConsole.ReadLine()で取得）
            string command = "status";  // move, attack, use, status, help など
            
            Console.WriteLine("=== ゲームコマンドシステム ===");
            Console.WriteLine($"現在地: {currentLocation}");
            Console.WriteLine($"コマンド: {command}");
            Console.WriteLine();
            
            // ここにswitch文でコマンド処理を実装してください
            // コマンド:
            // - "move": 移動（北、南、東、西をランダムに選択）
            // - "attack": 攻撃（剣があれば強い攻撃、なければ弱い攻撃）
            // - "use": アイテム使用（ポーションでHP回復）
            // - "status": ステータス表示
            // - "shop": ショップ（剣を購入可能）
            // - "help": コマンド一覧表示
            // - その他: 無効なコマンド
        }
    }
}`,
      hints: [
        '各コマンドで適切な処理を実装',
        'use コマンドではアイテムの所持をチェック',
        'shop コマンドでは所持金をチェック',
        'Random クラスで移動方向を決定'
      ],
      solution: `bool commandExecuted = true;

switch (command.ToLower())
{
    case "move":
        // ランダムな方向に移動
        Random rand = new Random();
        string[] directions = { "北", "南", "東", "西" };
        string[] locations = { "森", "洞窟", "城", "村", "平原" };
        string direction = directions[rand.Next(directions.Length)];
        currentLocation = locations[rand.Next(locations.Length)];
        
        Console.WriteLine($"💨 {direction}へ移動しました");
        Console.WriteLine($"📍 新しい場所: {currentLocation}");
        
        // ランダムイベント
        if (rand.Next(100) < 30)
        {
            Console.WriteLine("⚠️ モンスターが現れた！");
        }
        break;
        
    case "attack":
        if (hasSword)
        {
            Console.WriteLine("⚔️ 剣で攻撃！");
            Console.WriteLine("💥 30ダメージを与えた！");
            playerMP -= 5;
            Console.WriteLine($"MP: {playerMP} (-5)");
        }
        else
        {
            Console.WriteLine("👊 素手で攻撃！");
            Console.WriteLine("💢 10ダメージを与えた！");
        }
        break;
        
    case "use":
        if (hasPotion)
        {
            int healAmount = 50;
            int oldHP = playerHP;
            playerHP = Math.Min(playerHP + healAmount, 100);
            hasPotion = false;
            
            Console.WriteLine("🧪 ポーションを使用しました");
            Console.WriteLine($"❤️ HP: {oldHP} → {playerHP} (+{playerHP - oldHP})");
            
            if (playerHP == 100)
            {
                Console.WriteLine("✨ HPが全回復しました！");
            }
        }
        else
        {
            Console.WriteLine("❌ ポーションを持っていません");
        }
        break;
        
    case "status":
        Console.WriteLine("=== プレイヤーステータス ===");
        Console.WriteLine($"❤️  HP: {playerHP}/100");
        Console.WriteLine($"💙 MP: {playerMP}/50");
        Console.WriteLine($"💰 所持金: {gold}G");
        Console.WriteLine($"📍 現在地: {currentLocation}");
        Console.WriteLine("\n=== 所持品 ===");
        Console.WriteLine($"🧪 ポーション: {(hasPotion ? "あり" : "なし")}");
        Console.WriteLine($"⚔️  剣: {(hasSword ? "装備中" : "なし")}");
        break;
        
    case "shop":
        Console.WriteLine("=== ショップ ===");
        Console.WriteLine("🛒 アイテムリスト:");
        Console.WriteLine("1. ⚔️ 剣 - 80G");
        Console.WriteLine("2. 🧪 ポーション - 30G");
        Console.WriteLine($"\n💰 所持金: {gold}G");
        
        // 剣の購入判定（例）
        if (!hasSword && gold >= 80)
        {
            Console.WriteLine("\n剣を購入しますか？ (実装例)");
            // 実際の購入処理
            // hasSword = true;
            // gold -= 80;
        }
        else if (hasSword)
        {
            Console.WriteLine("\n⚔️ 剣は既に持っています");
        }
        else
        {
            Console.WriteLine("\n❌ 所持金が足りません");
        }
        break;
        
    case "help":
        Console.WriteLine("=== コマンド一覧 ===");
        Console.WriteLine("move   - 別の場所へ移動");
        Console.WriteLine("attack - 敵を攻撃");
        Console.WriteLine("use    - アイテムを使用");
        Console.WriteLine("status - ステータス確認");
        Console.WriteLine("shop   - ショップを開く");
        Console.WriteLine("help   - このヘルプを表示");
        break;
        
    default:
        commandExecuted = false;
        Console.WriteLine($"❓ '{command}' は無効なコマンドです");
        Console.WriteLine("💡 'help' でコマンド一覧を確認できます");
        break;
}

if (commandExecuted)
{
    Console.WriteLine($"\n✅ コマンド '{command}' を実行しました");
}

// HP/MPチェック
if (playerHP <= 0)
{
    Console.WriteLine("\n💀 ゲームオーバー！");
}
else if (playerHP <= 20)
{
    Console.WriteLine("\n⚠️ HPが少なくなっています！");
}`,
      difficulty: 'hard',
      estimatedTime: 30
    }
  ],
  estimatedTime: 45,
  difficulty: 'beginner',
  prerequisites: ['hello-world', 'variables-and-types', 'operators-and-expressions', 'arrays-and-collections', 'control-flow-if'],
  nextLesson: 'loops-for-while'
};