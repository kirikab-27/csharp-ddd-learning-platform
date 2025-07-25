import type { Lesson } from '../../../../features/learning/types';

export const controlFlowIfLesson: Lesson = {
  id: 'control-flow-if',
  title: '条件分岐（if文）',
  description: 'if-else文を使った条件分岐を学び、プログラムの流れを制御する方法を習得します',
  order: 5,
  content: `# 条件分岐（if文）

プログラムでは、特定の条件に基づいて異なる処理を実行する必要があります。C#のif文を使用すると、条件に応じてプログラムの流れを制御できます。

## if文の基本構文

最も基本的なif文の構文です：

\`\`\`csharp
if (条件式)
{
    // 条件が真（true）の場合に実行される処理
}
\`\`\`

### 例：
\`\`\`csharp
int age = 20;
if (age >= 18)
{
    Console.WriteLine("成人です");
}
\`\`\`

## if-else文

条件が偽（false）の場合の処理も指定できます：

\`\`\`csharp
if (条件式)
{
    // 条件が真の場合の処理
}
else
{
    // 条件が偽の場合の処理
}
\`\`\`

### 例：
\`\`\`csharp
int score = 75;
if (score >= 60)
{
    Console.WriteLine("合格です");
}
else
{
    Console.WriteLine("不合格です");
}
\`\`\`

## else if を使った複数条件

複数の条件を順番にチェックする場合：

\`\`\`csharp
if (条件1)
{
    // 条件1が真の場合
}
else if (条件2)
{
    // 条件1が偽で、条件2が真の場合
}
else if (条件3)
{
    // 条件1,2が偽で、条件3が真の場合
}
else
{
    // すべての条件が偽の場合
}
\`\`\`

## 比較演算子

if文でよく使用される比較演算子：
- \`==\` : 等しい
- \`!=\` : 等しくない
- \`>\` : より大きい
- \`<\` : より小さい
- \`>=\` : 以上
- \`<=\` : 以下

## 論理演算子

複数の条件を組み合わせる場合：
- \`&&\` : AND（両方が真）
- \`||\` : OR（どちらかが真）
- \`!\` : NOT（否定）

### 例：
\`\`\`csharp
int age = 25;
bool hasLicense = true;

if (age >= 18 && hasLicense)
{
    Console.WriteLine("車を運転できます");
}
\`\`\`

## ネストしたif文

if文の中に別のif文を入れることができます：

\`\`\`csharp
if (外側の条件)
{
    if (内側の条件)
    {
        // 両方の条件が真の場合
    }
}
\`\`\`

## 単一行のif文

処理が1行だけの場合、波括弧を省略できます（推奨されません）：

\`\`\`csharp
if (x > 0) Console.WriteLine("正の数");
\`\`\``,
  codeExamples: [
    {
      id: 'basic-if-else',
      title: '基本的なif-else文',
      code: `using System;

namespace BasicIfElse
{
    class Program
    {
        static void Main(string[] args)
        {
            // 年齢による判定
            int age = 17;
            
            Console.WriteLine($"年齢: {age}歳");
            
            if (age >= 20)
            {
                Console.WriteLine("成人です。お酒を飲むことができます。");
            }
            else if (age >= 18)
            {
                Console.WriteLine("18歳以上です。選挙権があります。");
            }
            else
            {
                Console.WriteLine("未成年です。");
            }
            
            // 時間による挨拶
            int hour = 14;  // 14時（午後2時）
            string greeting;
            
            if (hour < 12)
            {
                greeting = "おはようございます";
            }
            else if (hour < 18)
            {
                greeting = "こんにちは";
            }
            else
            {
                greeting = "こんばんは";
            }
            
            Console.WriteLine($"\n現在{hour}時です。{greeting}！");
        }
    }
}`,
      language: 'csharp',
      description: '年齢による判定と時間による挨拶の例。if-else if-elseの基本的な使い方を示しています。'
    },
    {
      id: 'logical-operators',
      title: '論理演算子を使った複合条件',
      code: `using System;

namespace LogicalOperators
{
    class Program
    {
        static void Main(string[] args)
        {
            // 遊園地のアトラクション利用条件
            int height = 145;  // 身長（cm）
            int age = 10;      // 年齢
            bool hasParent = true;  // 保護者同伴
            
            Console.WriteLine("=== 遊園地アトラクション利用判定 ===");
            Console.WriteLine($"身長: {height}cm");
            Console.WriteLine($"年齢: {age}歳");
            Console.WriteLine($"保護者同伴: {(hasParent ? "あり" : "なし")}");
            
            // ジェットコースターの利用条件
            // 身長140cm以上 かつ （8歳以上 または 保護者同伴）
            if (height >= 140 && (age >= 8 || hasParent))
            {
                Console.WriteLine("\n✅ ジェットコースターに乗れます！");
            }
            else
            {
                Console.WriteLine("\n❌ ジェットコースターには乗れません。");
                
                // 詳細な理由を表示
                if (height < 140)
                {
                    Console.WriteLine("  理由: 身長が140cm未満です。");
                }
                if (age < 8 && !hasParent)
                {
                    Console.WriteLine("  理由: 8歳未満で保護者同伴がありません。");
                }
            }
            
            // 観覧車の利用条件（誰でも乗れるが、条件により料金が変わる）
            Console.WriteLine("\n=== 観覧車料金 ===");
            int price;
            
            if (age < 3)
            {
                price = 0;  // 3歳未満無料
                Console.WriteLine("3歳未満: 無料");
            }
            else if (age < 12 || height < 120)
            {
                price = 300;  // 子供料金
                Console.WriteLine("子供料金: 300円");
            }
            else
            {
                price = 500;  // 大人料金
                Console.WriteLine("大人料金: 500円");
            }
        }
    }
}`,
      language: 'csharp',
      description: 'AND（&&）とOR（||）演算子を使った複合条件の例。遊園地のアトラクション利用判定を通じて実践的な使い方を示しています。'
    },
    {
      id: 'nested-if',
      title: 'ネストしたif文と成績評価',
      code: `using System;

namespace NestedIf
{
    class Program
    {
        static void Main(string[] args)
        {
            // テストの点数と出席率による総合評価
            int testScore = 85;
            int attendanceRate = 92;  // 出席率（%）
            
            Console.WriteLine("=== 成績評価システム ===");
            Console.WriteLine($"テスト点数: {testScore}点");
            Console.WriteLine($"出席率: {attendanceRate}%");
            
            string grade;
            string comment;
            
            // まず出席率をチェック
            if (attendanceRate >= 80)
            {
                // 出席率が基準を満たしている場合、点数で評価
                if (testScore >= 90)
                {
                    grade = "A";
                    comment = "素晴らしい成績です！";
                }
                else if (testScore >= 80)
                {
                    grade = "B";
                    comment = "良い成績です。";
                }
                else if (testScore >= 70)
                {
                    grade = "C";
                    comment = "合格です。";
                }
                else if (testScore >= 60)
                {
                    grade = "D";
                    comment = "ギリギリ合格です。もう少し頑張りましょう。";
                }
                else
                {
                    grade = "F";
                    comment = "不合格です。再試験を受けてください。";
                }
            }
            else
            {
                // 出席率が80%未満の場合
                if (testScore >= 95)
                {
                    // 特別に優秀な場合は救済
                    grade = "C";
                    comment = "テストは優秀ですが、出席率が低いため評価が下がりました。";
                }
                else
                {
                    grade = "F";
                    comment = "出席率不足のため不合格です。";
                }
            }
            
            Console.WriteLine($"\n最終評価: {grade}");
            Console.WriteLine($"コメント: {comment}");
            
            // 追加アドバイス
            if (grade == "F")
            {
                Console.WriteLine("\n【アドバイス】");
                if (attendanceRate < 80)
                {
                    Console.WriteLine("- 授業への出席を心がけてください");
                }
                if (testScore < 60)
                {
                    Console.WriteLine("- 基礎からしっかり復習しましょう");
                }
            }
            else if (grade == "A" || grade == "B")
            {
                Console.WriteLine("\n【次のステップ】");
                Console.WriteLine("- 発展的な内容にも挑戦してみましょう");
            }
        }
    }
}`,
      language: 'csharp',
      description: 'ネストしたif文を使った複雑な条件判定の例。出席率とテスト点数による総合的な成績評価システムを実装しています。'
    }
  ],
  exercises: [
    {
      id: 'age-category-exercise',
      title: '年齢カテゴリー判定',
      description: '入力された年齢に基づいて、適切なカテゴリー（幼児、小学生、中高生、成人、高齢者）を判定し、それぞれに応じたメッセージを表示するプログラムを作成してください。',
      starterCode: `using System;

namespace AgeCategory
{
    class Program
    {
        static void Main(string[] args)
        {
            int age = 15;  // この値を変更してテストしてください
            
            Console.WriteLine($"年齢: {age}歳");
            
            // ここに年齢カテゴリーを判定するif文を書いてください
            // カテゴリー:
            // - 0-5歳: 幼児
            // - 6-12歳: 小学生
            // - 13-18歳: 中高生
            // - 19-64歳: 成人
            // - 65歳以上: 高齢者
            
            // 各カテゴリーに応じたメッセージも表示してください
        }
    }
}`,
      hints: [
        'if-else if-elseの連鎖を使用',
        '年齢の範囲は上から順にチェック',
        '各カテゴリーで異なるメッセージを表示',
        '負の年齢もチェックすると良い'
      ],
      solution: `string category;
string message;

if (age < 0)
{
    category = "エラー";
    message = "年齢は0以上である必要があります。";
}
else if (age <= 5)
{
    category = "幼児";
    message = "健やかな成長を願っています！";
}
else if (age <= 12)
{
    category = "小学生";
    message = "たくさん学んで、たくさん遊んでください！";
}
else if (age <= 18)
{
    category = "中高生";
    message = "勉強に部活に充実した学生生活を！";
}
else if (age <= 64)
{
    category = "成人";
    message = "お仕事お疲れ様です！";
}
else
{
    category = "高齢者";
    message = "いつまでもお元気でいてください！";
}

Console.WriteLine($"カテゴリー: {category}");
Console.WriteLine($"メッセージ: {message}");`,
      difficulty: 'easy',
      estimatedTime: 15
    },
    {
      id: 'bmi-calculator-exercise',
      title: 'BMI計算と健康判定',
      description: '身長と体重からBMI（体格指数）を計算し、健康状態を判定するプログラムを作成してください。BMI = 体重(kg) ÷ (身長(m) × 身長(m))',
      starterCode: `using System;

namespace BMICalculator
{
    class Program
    {
        static void Main(string[] args)
        {
            double height = 170.0;  // 身長（cm）
            double weight = 65.0;   // 体重（kg）
            
            // BMIを計算（身長をメートルに変換することを忘れずに）
            // BMI = 体重(kg) ÷ (身長(m) × 身長(m))
            
            // BMIによる判定基準:
            // - 18.5未満: 低体重
            // - 18.5以上25.0未満: 普通体重
            // - 25.0以上30.0未満: 肥満（1度）
            // - 30.0以上35.0未満: 肥満（2度）
            // - 35.0以上: 肥満（3度）
            
            // 健康アドバイスも表示してください
        }
    }
}`,
      hints: [
        '身長をセンチメートルからメートルに変換（÷100）',
        'BMIは小数点第1位まで表示',
        '各判定に応じた健康アドバイスを追加',
        'Math.Pow()を使うか、height * heightで二乗を計算'
      ],
      solution: `// BMIを計算
double heightInMeters = height / 100.0;
double bmi = weight / (heightInMeters * heightInMeters);

Console.WriteLine($"身長: {height}cm");
Console.WriteLine($"体重: {weight}kg");
Console.WriteLine($"BMI: {bmi:F1}");

// BMIによる判定
string category;
string advice;

if (bmi < 18.5)
{
    category = "低体重";
    advice = "もう少し体重を増やした方が健康的です。バランスの良い食事を心がけましょう。";
}
else if (bmi < 25.0)
{
    category = "普通体重";
    advice = "理想的な体重です。現在の生活習慣を維持しましょう。";
}
else if (bmi < 30.0)
{
    category = "肥満（1度）";
    advice = "少し体重が多めです。適度な運動と食事の見直しをおすすめします。";
}
else if (bmi < 35.0)
{
    category = "肥満（2度）";
    advice = "健康リスクが高まっています。医師に相談し、生活習慣の改善を始めましょう。";
}
else
{
    category = "肥満（3度）";
    advice = "深刻な健康リスクがあります。すぐに医師の診察を受けてください。";
}

Console.WriteLine($"\n判定: {category}");
Console.WriteLine($"アドバイス: {advice}");

// 理想体重も計算して表示
double idealWeight = 22.0 * heightInMeters * heightInMeters;
Console.WriteLine($"\nあなたの理想体重（BMI 22）: {idealWeight:F1}kg");

if (Math.Abs(weight - idealWeight) < 5.0)
{
    Console.WriteLine("理想体重に近い状態です！");
}`,
      difficulty: 'medium',
      estimatedTime: 20
    },
    {
      id: 'password-validator-exercise',
      title: 'パスワード強度チェッカー',
      description: 'パスワードの強度を判定するプログラムを作成してください。長さ、大文字・小文字・数字・特殊文字の有無をチェックし、強度を「弱い」「普通」「強い」で評価します。',
      starterCode: `using System;

namespace PasswordValidator
{
    class Program
    {
        static void Main(string[] args)
        {
            string password = "MyPass123!";  // テスト用パスワード
            
            Console.WriteLine($"パスワード: {new string('*', password.Length)}");
            Console.WriteLine($"文字数: {password.Length}");
            
            // パスワードの強度をチェック
            // チェック項目:
            // 1. 長さが8文字以上
            // 2. 大文字を含む
            // 3. 小文字を含む
            // 4. 数字を含む
            // 5. 特殊文字（!@#$%^&*）を含む
            
            // ヒント: 文字列のチェックには以下のメソッドが使えます
            // - password.Length で長さを取得
            // - char.IsUpper(c) で大文字判定
            // - char.IsLower(c) で小文字判定
            // - char.IsDigit(c) で数字判定
            // - 特殊文字は文字列に含まれるかチェック
            
            // 強度判定:
            // - 2項目以下: 弱い
            // - 3-4項目: 普通
            // - 5項目すべて: 強い
        }
    }
}`,
      hints: [
        'foreach文で各文字をチェック',
        'bool変数で各条件を記録',
        '満たした条件数をカウント',
        'Contains()メソッドで特殊文字をチェック'
      ],
      solution: `// チェック項目の初期化
bool hasMinLength = password.Length >= 8;
bool hasUpperCase = false;
bool hasLowerCase = false;
bool hasDigit = false;
bool hasSpecialChar = false;

// 各文字をチェック
foreach (char c in password)
{
    if (char.IsUpper(c))
        hasUpperCase = true;
    if (char.IsLower(c))
        hasLowerCase = true;
    if (char.IsDigit(c))
        hasDigit = true;
}

// 特殊文字のチェック
string specialChars = "!@#$%^&*";
foreach (char c in password)
{
    if (specialChars.Contains(c))
    {
        hasSpecialChar = true;
        break;
    }
}

// 条件を満たした数をカウント
int strengthScore = 0;
if (hasMinLength) strengthScore++;
if (hasUpperCase) strengthScore++;
if (hasLowerCase) strengthScore++;
if (hasDigit) strengthScore++;
if (hasSpecialChar) strengthScore++;

// チェック結果を表示
Console.WriteLine("\n=== パスワード強度チェック ===");
Console.WriteLine($"✓ 8文字以上: {(hasMinLength ? "○" : "×")}");
Console.WriteLine($"✓ 大文字を含む: {(hasUpperCase ? "○" : "×")}");
Console.WriteLine($"✓ 小文字を含む: {(hasLowerCase ? "○" : "×")}");
Console.WriteLine($"✓ 数字を含む: {(hasDigit ? "○" : "×")}");
Console.WriteLine($"✓ 特殊文字を含む: {(hasSpecialChar ? "○" : "×")}");

// 強度判定
string strength;
string recommendation;

if (strengthScore <= 2)
{
    strength = "弱い";
    recommendation = "もっと複雑なパスワードを使用してください。";
}
else if (strengthScore <= 4)
{
    strength = "普通";
    recommendation = "良いパスワードですが、さらに強化できます。";
}
else
{
    strength = "強い";
    recommendation = "素晴らしい！安全なパスワードです。";
}

Console.WriteLine($"\n強度: {strength} ({strengthScore}/5)");
Console.WriteLine($"推奨事項: {recommendation}");

// 具体的なアドバイス
if (!hasMinLength)
    Console.WriteLine("- 8文字以上にしてください");
if (!hasUpperCase)
    Console.WriteLine("- 大文字を追加してください");
if (!hasLowerCase)
    Console.WriteLine("- 小文字を追加してください");
if (!hasDigit)
    Console.WriteLine("- 数字を追加してください");
if (!hasSpecialChar)
    Console.WriteLine("- 特殊文字(!@#$%^&*)を追加してください");`,
      difficulty: 'hard',
      estimatedTime: 30
    }
  ],
  estimatedTime: 45,
  difficulty: 'beginner',
  prerequisites: ['hello-world', 'variables-and-types', 'operators-and-expressions', 'arrays-and-collections'],
  nextLesson: 'control-flow-switch'
};