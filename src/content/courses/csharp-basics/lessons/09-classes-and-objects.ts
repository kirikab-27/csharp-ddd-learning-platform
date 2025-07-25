import type { Lesson } from '../../../../features/learning/types';

export const classesAndObjectsLesson: Lesson = {
  id: 'classes-and-objects',
  title: 'クラスとオブジェクト',
  description: 'オブジェクト指向プログラミングの基礎、クラスの定義、オブジェクトの生成、コンストラクタ、プロパティ、フィールドについて学びます',
  order: 9,
  content: `# クラスとオブジェクト

クラスは、オブジェクトの設計図です。関連するデータ（フィールド）と機能（メソッド）をまとめて、再利用可能な単位として定義します。

## クラスの基本構文

\`\`\`csharp
public class クラス名
{
    // フィールド（データ）
    private string fieldName;
    
    // プロパティ
    public string PropertyName { get; set; }
    
    // コンストラクタ
    public クラス名()
    {
        // 初期化処理
    }
    
    // メソッド
    public void MethodName()
    {
        // 処理
    }
}
\`\`\`

## オブジェクトの生成

\`\`\`csharp
// インスタンスの作成
クラス名 変数名 = new クラス名();

// 例
Person person = new Person();
person.Name = "田中太郎";
person.Introduce();
\`\`\`

## フィールドとプロパティ

### フィールド
- クラス内のデータを保持する変数
- 通常はprivateで宣言（カプセル化）

\`\`\`csharp
private string name;
private int age;
\`\`\`

### プロパティ
- フィールドへの安全なアクセスを提供
- get/setアクセサーで読み書きを制御

\`\`\`csharp
public string Name 
{ 
    get { return name; }
    set { name = value; }
}

// 自動実装プロパティ
public int Age { get; set; }
\`\`\`

## コンストラクタ

オブジェクト生成時に呼ばれる特別なメソッド：

\`\`\`csharp
public class Person
{
    public string Name { get; set; }
    public int Age { get; set; }
    
    // デフォルトコンストラクタ
    public Person()
    {
        Name = "名無し";
        Age = 0;
    }
    
    // パラメータ付きコンストラクタ
    public Person(string name, int age)
    {
        Name = name;
        Age = age;
    }
}
\`\`\`

## アクセス修飾子

- \`public\`: どこからでもアクセス可能
- \`private\`: 同じクラス内からのみアクセス可能
- \`protected\`: 同じクラスと派生クラスからアクセス可能
- \`internal\`: 同じアセンブリ内からアクセス可能

## thisキーワード

現在のインスタンスを参照：

\`\`\`csharp
public class Person
{
    private string name;
    
    public Person(string name)
    {
        this.name = name; // フィールドとパラメータを区別
    }
    
    public void CallOtherMethod()
    {
        this.PrintName(); // 同じクラスのメソッドを呼び出し
    }
}
\`\`\`

## 静的メンバー（static）

インスタンスではなくクラスに属するメンバー：

\`\`\`csharp
public class MathHelper
{
    public static double Pi = 3.14159;
    
    public static double CalculateArea(double radius)
    {
        return Pi * radius * radius;
    }
}

// 使用例（インスタンス化不要）
double area = MathHelper.CalculateArea(5);
\`\`\`

## カプセル化

内部実装を隠蔽し、必要な部分のみを公開：

\`\`\`csharp
public class BankAccount
{
    private decimal balance; // privateで隠蔽
    
    public decimal Balance 
    { 
        get { return balance; }
    }
    
    public void Deposit(decimal amount)
    {
        if (amount > 0)
        {
            balance += amount;
        }
    }
}
\`\`\`

## オブジェクト指向の利点

1. **再利用性**: 一度定義したクラスを何度でも使える
2. **保守性**: 関連する機能がまとまっている
3. **拡張性**: 既存のクラスを基に新しい機能を追加
4. **抽象化**: 複雑な実装を隠して使いやすくする`,
  codeExamples: [
    {
      id: 'basic-class-definition',
      title: '基本的なクラスの定義と使用',
      code: `using System;

namespace BasicClassExample
{
    // Personクラスの定義
    public class Person
    {
        // フィールド（プライベート）
        private string name;
        private int age;
        
        // プロパティ
        public string Name
        {
            get { return name; }
            set 
            { 
                if (!string.IsNullOrEmpty(value))
                {
                    name = value;
                }
            }
        }
        
        public int Age
        {
            get { return age; }
            set 
            { 
                if (value >= 0 && value <= 150)
                {
                    age = value;
                }
            }
        }
        
        // 自動実装プロパティ
        public string Email { get; set; }
        public DateTime BirthDate { get; private set; } // 読み取り専用
        
        // デフォルトコンストラクタ
        public Person()
        {
            name = "名無し";
            age = 0;
            Email = "未設定";
            BirthDate = DateTime.Now;
        }
        
        // パラメータ付きコンストラクタ
        public Person(string name, int age)
        {
            this.name = name;
            this.age = age;
            Email = "未設定";
            BirthDate = DateTime.Now.AddYears(-age);
        }
        
        // メソッド
        public void Introduce()
        {
            Console.WriteLine($"こんにちは、私は{Name}です。{Age}歳です。");
            if (Email != "未設定")
            {
                Console.WriteLine($"メールアドレス: {Email}");
            }
        }
        
        public void HaveBirthday()
        {
            Age++;
            Console.WriteLine($"{Name}さん、{Age}歳の誕生日おめでとう！");
        }
        
        // 年齢を計算するメソッド
        public int CalculateAge(DateTime targetDate)
        {
            int years = targetDate.Year - BirthDate.Year;
            if (targetDate.Date < BirthDate.Date.AddYears(years))
            {
                years--;
            }
            return years;
        }
    }
    
    class Program
    {
        static void Main(string[] args)
        {
            // デフォルトコンストラクタを使用
            Person person1 = new Person();
            person1.Name = "山田太郎";
            person1.Age = 25;
            person1.Email = "yamada@example.com";
            person1.Introduce();
            
            Console.WriteLine();
            
            // パラメータ付きコンストラクタを使用
            Person person2 = new Person("鈴木花子", 30);
            person2.Email = "suzuki@example.com";
            person2.Introduce();
            
            Console.WriteLine();
            
            // メソッドの呼び出し
            person2.HaveBirthday();
            
            // 10年後の年齢を計算
            DateTime futureDate = DateTime.Now.AddYears(10);
            int futureAge = person2.CalculateAge(futureDate);
            Console.WriteLine($"10年後の{person2.Name}さんの年齢: {futureAge}歳");
            
            // 無効な値の設定（プロパティで検証）
            Console.WriteLine("\n無効な値のテスト:");
            person1.Age = -5; // 無視される
            Console.WriteLine($"年齢: {person1.Age}"); // 25のまま
            
            person1.Name = ""; // 無視される
            Console.WriteLine($"名前: {person1.Name}"); // 山田太郎のまま
        }
    }
}`,
      language: 'csharp',
      description: 'クラスの基本的な構成要素（フィールド、プロパティ、コンストラクタ、メソッド）の定義と使用例。データの検証も含まれています。'
    },
    {
      id: 'encapsulation-example',
      title: 'カプセル化と銀行口座クラス',
      code: `using System;
using System.Collections.Generic;

namespace EncapsulationExample
{
    // 銀行口座クラス
    public class BankAccount
    {
        // プライベートフィールド（カプセル化）
        private string accountNumber;
        private string accountHolder;
        private decimal balance;
        private List<string> transactionHistory;
        private readonly DateTime createdDate;
        
        // 読み取り専用プロパティ
        public string AccountNumber 
        { 
            get { return accountNumber; } 
        }
        
        public string AccountHolder 
        { 
            get { return accountHolder; } 
        }
        
        public decimal Balance 
        { 
            get { return balance; } 
        }
        
        public DateTime CreatedDate 
        { 
            get { return createdDate; } 
        }
        
        // コンストラクタ
        public BankAccount(string holder, string number, decimal initialDeposit = 0)
        {
            if (string.IsNullOrWhiteSpace(holder))
            {
                throw new ArgumentException("口座名義人は必須です");
            }
            
            if (initialDeposit < 0)
            {
                throw new ArgumentException("初期入金額は0以上である必要があります");
            }
            
            accountHolder = holder;
            accountNumber = number;
            balance = initialDeposit;
            createdDate = DateTime.Now;
            transactionHistory = new List<string>();
            
            if (initialDeposit > 0)
            {
                AddTransaction($"口座開設 - 初期入金: {initialDeposit:C}");
            }
        }
        
        // 入金メソッド
        public bool Deposit(decimal amount)
        {
            if (amount <= 0)
            {
                Console.WriteLine("入金額は0より大きい必要があります");
                return false;
            }
            
            balance += amount;
            AddTransaction($"入金: {amount:C}, 残高: {balance:C}");
            Console.WriteLine($"入金成功: {amount:C}");
            return true;
        }
        
        // 出金メソッド
        public bool Withdraw(decimal amount)
        {
            if (amount <= 0)
            {
                Console.WriteLine("出金額は0より大きい必要があります");
                return false;
            }
            
            if (amount > balance)
            {
                Console.WriteLine("残高不足です");
                AddTransaction($"出金失敗（残高不足）: {amount:C}");
                return false;
            }
            
            balance -= amount;
            AddTransaction($"出金: {amount:C}, 残高: {balance:C}");
            Console.WriteLine($"出金成功: {amount:C}");
            return true;
        }
        
        // 送金メソッド
        public bool Transfer(BankAccount recipient, decimal amount)
        {
            if (recipient == null)
            {
                Console.WriteLine("送金先が無効です");
                return false;
            }
            
            if (this.Withdraw(amount))
            {
                recipient.Deposit(amount);
                AddTransaction($"送金: {amount:C} → {recipient.AccountNumber}");
                recipient.AddTransaction($"着金: {amount:C} ← {this.AccountNumber}");
                return true;
            }
            
            return false;
        }
        
        // 取引履歴の追加（プライベート）
        private void AddTransaction(string description)
        {
            string timestamp = DateTime.Now.ToString("yyyy/MM/dd HH:mm:ss");
            transactionHistory.Add($"{timestamp}: {description}");
        }
        
        // 取引履歴の表示
        public void PrintTransactionHistory()
        {
            Console.WriteLine($"\n=== 取引履歴 - 口座番号: {AccountNumber} ===");
            Console.WriteLine($"口座名義: {AccountHolder}");
            Console.WriteLine($"開設日: {CreatedDate:yyyy/MM/dd}");
            Console.WriteLine("------------------------");
            
            foreach (string transaction in transactionHistory)
            {
                Console.WriteLine(transaction);
            }
            
            Console.WriteLine("------------------------");
            Console.WriteLine($"現在の残高: {Balance:C}");
        }
        
        // 口座情報の表示
        public override string ToString()
        {
            return $"口座番号: {AccountNumber}, 名義: {AccountHolder}, 残高: {Balance:C}";
        }
    }
    
    class Program
    {
        static void Main(string[] args)
        {
            // 口座の作成
            BankAccount account1 = new BankAccount("田中太郎", "ACC-001", 10000);
            BankAccount account2 = new BankAccount("鈴木花子", "ACC-002");
            
            Console.WriteLine("口座を作成しました:");
            Console.WriteLine(account1);
            Console.WriteLine(account2);
            
            // 取引の実行
            Console.WriteLine("\n=== 取引開始 ===");
            
            // 入金
            account1.Deposit(5000);
            account2.Deposit(20000);
            
            // 出金
            account1.Withdraw(3000);
            account2.Withdraw(50000); // 残高不足
            
            // 送金
            Console.WriteLine("\n送金処理:");
            account1.Transfer(account2, 2000);
            
            // 取引履歴の表示
            account1.PrintTransactionHistory();
            account2.PrintTransactionHistory();
            
            // プライベートフィールドへの直接アクセスは不可
            // account1.balance = 1000000; // コンパイルエラー
            
            // プロパティ経由でのみアクセス可能
            Console.WriteLine($"\n最終残高確認:");
            Console.WriteLine($"{account1.AccountHolder}: {account1.Balance:C}");
            Console.WriteLine($"{account2.AccountHolder}: {account2.Balance:C}");
        }
    }
}`,
      language: 'csharp',
      description: 'カプセル化の実践例。銀行口座クラスで、内部データを隠蔽し、メソッドを通じてのみ操作できるようにしています。'
    },
    {
      id: 'static-members-utility',
      title: '静的メンバーとユーティリティクラス',
      code: `using System;

namespace StaticMembersExample
{
    // 数学ユーティリティクラス（静的クラス）
    public static class MathUtility
    {
        // 静的フィールド
        public static readonly double Pi = 3.14159265359;
        public static readonly double E = 2.71828182846;
        
        // 静的メソッド
        public static double CircleArea(double radius)
        {
            return Pi * radius * radius;
        }
        
        public static double CircleCircumference(double radius)
        {
            return 2 * Pi * radius;
        }
        
        public static double Power(double baseNum, int exponent)
        {
            double result = 1;
            for (int i = 0; i < Math.Abs(exponent); i++)
            {
                result *= baseNum;
            }
            return exponent < 0 ? 1 / result : result;
        }
        
        public static long Factorial(int n)
        {
            if (n < 0)
                throw new ArgumentException("負の数の階乗は定義されていません");
            
            long result = 1;
            for (int i = 2; i <= n; i++)
            {
                result *= i;
            }
            return result;
        }
    }
    
    // カウンタークラス（静的メンバーと通常メンバーの混在）
    public class Counter
    {
        // 静的フィールド（全インスタンスで共有）
        private static int totalCount = 0;
        private static int instanceCount = 0;
        
        // インスタンスフィールド
        private int count = 0;
        private string name;
        
        // 静的プロパティ
        public static int TotalCount 
        { 
            get { return totalCount; } 
        }
        
        public static int InstanceCount 
        { 
            get { return instanceCount; } 
        }
        
        // インスタンスプロパティ
        public int Count 
        { 
            get { return count; } 
        }
        
        public string Name 
        { 
            get { return name; } 
        }
        
        // コンストラクタ
        public Counter(string name)
        {
            this.name = name;
            instanceCount++; // 静的フィールドをインクリメント
            Console.WriteLine($"カウンター '{name}' を作成しました（総インスタンス数: {instanceCount}）");
        }
        
        // インスタンスメソッド
        public void Increment()
        {
            count++;
            totalCount++; // 静的フィールドもインクリメント
            Console.WriteLine($"{name}: {count} (全体: {totalCount})");
        }
        
        // 静的メソッド
        public static void ResetTotal()
        {
            totalCount = 0;
            Console.WriteLine("全体カウントをリセットしました");
        }
        
        public static void PrintStatistics()
        {
            Console.WriteLine($"\n=== カウンター統計 ===");
            Console.WriteLine($"作成されたインスタンス数: {instanceCount}");
            Console.WriteLine($"全体のカウント数: {totalCount}");
            Console.WriteLine($"平均カウント: {(instanceCount > 0 ? (double)totalCount / instanceCount : 0):F2}");
        }
    }
    
    // 設定管理クラス（シングルトンパターンの簡易版）
    public class AppSettings
    {
        private static AppSettings instance;
        private string appName;
        private string version;
        
        // プライベートコンストラクタ
        private AppSettings()
        {
            appName = "サンプルアプリケーション";
            version = "1.0.0";
        }
        
        // 静的プロパティでインスタンスを取得
        public static AppSettings Instance
        {
            get
            {
                if (instance == null)
                {
                    instance = new AppSettings();
                }
                return instance;
            }
        }
        
        public string AppName 
        { 
            get { return appName; }
            set { appName = value; }
        }
        
        public string Version 
        { 
            get { return version; }
            set { version = value; }
        }
    }
    
    class Program
    {
        static void Main(string[] args)
        {
            // 静的クラスの使用（インスタンス化不要）
            Console.WriteLine("=== 数学ユーティリティ ===");
            double radius = 5.0;
            Console.WriteLine($"半径 {radius} の円:");
            Console.WriteLine($"面積: {MathUtility.CircleArea(radius):F2}");
            Console.WriteLine($"円周: {MathUtility.CircleCircumference(radius):F2}");
            
            Console.WriteLine($"\n2の10乗: {MathUtility.Power(2, 10)}");
            Console.WriteLine($"5の階乗: {MathUtility.Factorial(5)}");
            
            // カウンタークラスの使用
            Console.WriteLine("\n=== カウンターの例 ===");
            Counter counter1 = new Counter("カウンター1");
            Counter counter2 = new Counter("カウンター2");
            Counter counter3 = new Counter("カウンター3");
            
            // 各カウンターを操作
            counter1.Increment();
            counter1.Increment();
            counter2.Increment();
            counter3.Increment();
            counter3.Increment();
            counter3.Increment();
            
            // 統計情報を表示
            Counter.PrintStatistics();
            
            // 全体カウントをリセット
            Counter.ResetTotal();
            counter1.Increment();
            Counter.PrintStatistics();
            
            // シングルトンパターンの使用
            Console.WriteLine("\n=== アプリケーション設定 ===");
            AppSettings settings1 = AppSettings.Instance;
            AppSettings settings2 = AppSettings.Instance;
            
            // 同じインスタンスであることを確認
            Console.WriteLine($"settings1 == settings2: {ReferenceEquals(settings1, settings2)}");
            
            settings1.AppName = "新しいアプリ名";
            Console.WriteLine($"アプリ名: {settings2.AppName}"); // settings1の変更が反映される
            Console.WriteLine($"バージョン: {settings2.Version}");
        }
    }
}`,
      language: 'csharp',
      description: '静的メンバー（フィールド、プロパティ、メソッド）の使い方。ユーティリティクラス、共有カウンター、シングルトンパターンの実装例を示しています。'
    }
  ],
  exercises: [
    {
      id: 'student-class-exercise',
      title: '学生管理クラス',
      description: '学生の情報（名前、学籍番号、成績）を管理するStudentクラスを作成してください。成績の追加、平均点の計算、成績判定などの機能を実装してください。',
      starterCode: `using System;
using System.Collections.Generic;

namespace StudentManagement
{
    class Program
    {
        static void Main(string[] args)
        {
            // Studentクラスを作成してください
            // 必要な機能:
            // - 名前、学籍番号のプロパティ
            // - 成績を管理するリスト（科目名と点数）
            // - 成績を追加するメソッド
            // - 平均点を計算するメソッド
            // - 成績を表示するメソッド
            // - 成績判定（A, B, C, D, F）を返すメソッド
            
            // テストケース
            // Student student = new Student("山田太郎", "S001");
            // student.AddGrade("数学", 85);
            // student.AddGrade("英語", 92);
            // student.AddGrade("科学", 78);
            // student.PrintGrades();
        }
    }
    
    // ここにStudentクラスを実装してください
}`,
      hints: [
        'Dictionary<string, int>で科目名と点数を管理',
        'AddGradeメソッドで重複チェック',
        '平均点はLINQのAverage()メソッドが便利',
        '成績判定は平均点に基づいて行う'
      ],
      solution: `public class Student
{
    // プライベートフィールド
    private string name;
    private string studentId;
    private Dictionary<string, int> grades;
    
    // プロパティ
    public string Name 
    { 
        get { return name; }
        private set 
        { 
            if (!string.IsNullOrWhiteSpace(value))
                name = value;
            else
                throw new ArgumentException("名前は必須です");
        }
    }
    
    public string StudentId 
    { 
        get { return studentId; }
        private set 
        { 
            if (!string.IsNullOrWhiteSpace(value))
                studentId = value;
            else
                throw new ArgumentException("学籍番号は必須です");
        }
    }
    
    public int SubjectCount 
    { 
        get { return grades.Count; } 
    }
    
    // コンストラクタ
    public Student(string name, string studentId)
    {
        Name = name;
        StudentId = studentId;
        grades = new Dictionary<string, int>();
    }
    
    // 成績を追加
    public void AddGrade(string subject, int score)
    {
        if (string.IsNullOrWhiteSpace(subject))
        {
            Console.WriteLine("科目名は必須です");
            return;
        }
        
        if (score < 0 || score > 100)
        {
            Console.WriteLine("点数は0～100の範囲で入力してください");
            return;
        }
        
        if (grades.ContainsKey(subject))
        {
            Console.WriteLine($"{subject}の成績を更新します: {grades[subject]} → {score}");
            grades[subject] = score;
        }
        else
        {
            grades.Add(subject, score);
            Console.WriteLine($"{subject}の成績を追加しました: {score}点");
        }
    }
    
    // 成績を削除
    public bool RemoveGrade(string subject)
    {
        if (grades.Remove(subject))
        {
            Console.WriteLine($"{subject}の成績を削除しました");
            return true;
        }
        else
        {
            Console.WriteLine($"{subject}の成績が見つかりません");
            return false;
        }
    }
    
    // 平均点を計算
    public double CalculateAverage()
    {
        if (grades.Count == 0)
            return 0;
            
        int total = 0;
        foreach (var grade in grades.Values)
        {
            total += grade;
        }
        
        return (double)total / grades.Count;
    }
    
    // 成績判定
    public char GetGrade()
    {
        double average = CalculateAverage();
        
        if (average >= 90)
            return 'A';
        else if (average >= 80)
            return 'B';
        else if (average >= 70)
            return 'C';
        else if (average >= 60)
            return 'D';
        else
            return 'F';
    }
    
    // 特定の科目の成績を取得
    public int? GetSubjectGrade(string subject)
    {
        if (grades.TryGetValue(subject, out int score))
        {
            return score;
        }
        return null;
    }
    
    // 成績を表示
    public void PrintGrades()
    {
        Console.WriteLine($"\n=== 成績表 ===");
        Console.WriteLine($"氏名: {Name}");
        Console.WriteLine($"学籍番号: {StudentId}");
        Console.WriteLine("----------------");
        
        if (grades.Count == 0)
        {
            Console.WriteLine("成績データがありません");
        }
        else
        {
            foreach (var grade in grades)
            {
                Console.WriteLine($"{grade.Key}: {grade.Value}点");
            }
            
            Console.WriteLine("----------------");
            Console.WriteLine($"科目数: {SubjectCount}");
            Console.WriteLine($"平均点: {CalculateAverage():F1}");
            Console.WriteLine($"成績評価: {GetGrade()}");
        }
    }
    
    // 成績優秀者判定
    public bool IsHonorStudent()
    {
        return CalculateAverage() >= 85 && grades.Count >= 3;
    }
}

// Main メソッド内のテストコード
Student student1 = new Student("山田太郎", "S001");
student1.AddGrade("数学", 85);
student1.AddGrade("英語", 92);
student1.AddGrade("科学", 78);
student1.AddGrade("国語", 88);
student1.PrintGrades();

Console.WriteLine($"\n優等生？: {(student1.IsHonorStudent() ? "はい" : "いいえ")}");

// 成績の更新
student1.AddGrade("数学", 95);
student1.RemoveGrade("科学");
student1.PrintGrades();

// 別の学生
Console.WriteLine("\n");
Student student2 = new Student("鈴木花子", "S002");
student2.AddGrade("数学", 98);
student2.AddGrade("英語", 95);
student2.AddGrade("科学", 97);
student2.PrintGrades();

Console.WriteLine($"\n{student2.Name}は優等生？: {(student2.IsHonorStudent() ? "はい" : "いいえ")}");`,
      difficulty: 'medium',
      estimatedTime: 25
    },
    {
      id: 'inventory-system-exercise',
      title: '在庫管理システム',
      description: '商品の在庫を管理するProductクラスとInventoryクラスを作成してください。商品の追加、在庫の更新、在庫不足の警告などの機能を実装してください。',
      starterCode: `using System;
using System.Collections.Generic;

namespace InventorySystem
{
    class Program
    {
        static void Main(string[] args)
        {
            // Productクラス: 個々の商品情報
            // - ID、名前、価格、在庫数
            // - 在庫の追加・減少メソッド
            
            // Inventoryクラス: 在庫全体を管理
            // - 商品の追加・削除
            // - 在庫確認
            // - 在庫不足商品のリスト
            // - 在庫の総価値計算
            
            // テストケース例:
            // Inventory inventory = new Inventory();
            // inventory.AddProduct(new Product("P001", "ノートPC", 80000, 5));
            // inventory.AddProduct(new Product("P002", "マウス", 3000, 20));
            // inventory.SellProduct("P001", 3);
            // inventory.PrintInventory();
        }
    }
    
    // ここにProductクラスとInventoryクラスを実装してください
}`,
      hints: [
        'ProductクラスはIDを主キーとして一意に識別',
        'InventoryクラスはDictionary<string, Product>で商品を管理',
        '在庫数が特定の閾値以下になったら警告',
        '売上記録も保持すると良い'
      ],
      solution: `public class Product
{
    // フィールドとプロパティ
    public string Id { get; private set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    public int Stock { get; private set; }
    public int MinimumStock { get; set; }
    
    // コンストラクタ
    public Product(string id, string name, decimal price, int initialStock, int minimumStock = 5)
    {
        if (string.IsNullOrWhiteSpace(id))
            throw new ArgumentException("商品IDは必須です");
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("商品名は必須です");
        if (price < 0)
            throw new ArgumentException("価格は0以上である必要があります");
        if (initialStock < 0)
            throw new ArgumentException("在庫数は0以上である必要があります");
            
        Id = id;
        Name = name;
        Price = price;
        Stock = initialStock;
        MinimumStock = minimumStock;
    }
    
    // 在庫を追加
    public void AddStock(int quantity)
    {
        if (quantity <= 0)
        {
            Console.WriteLine("追加数量は1以上である必要があります");
            return;
        }
        
        Stock += quantity;
        Console.WriteLine($"{Name}の在庫を{quantity}個追加しました。現在の在庫: {Stock}");
    }
    
    // 在庫を減らす
    public bool ReduceStock(int quantity)
    {
        if (quantity <= 0)
        {
            Console.WriteLine("減少数量は1以上である必要があります");
            return false;
        }
        
        if (quantity > Stock)
        {
            Console.WriteLine($"在庫不足: {Name}の在庫は{Stock}個しかありません");
            return false;
        }
        
        Stock -= quantity;
        Console.WriteLine($"{Name}を{quantity}個販売しました。残り在庫: {Stock}");
        
        if (Stock <= MinimumStock)
        {
            Console.WriteLine($"⚠️ 警告: {Name}の在庫が少なくなっています（残り{Stock}個）");
        }
        
        return true;
    }
    
    // 在庫価値を計算
    public decimal GetTotalValue()
    {
        return Price * Stock;
    }
    
    // 在庫が少ないか判定
    public bool IsLowStock()
    {
        return Stock <= MinimumStock;
    }
    
    public override string ToString()
    {
        return $"[{Id}] {Name} - 価格: {Price:C}, 在庫: {Stock}個";
    }
}

public class Inventory
{
    private Dictionary<string, Product> products;
    private List<string> salesHistory;
    private decimal totalSales;
    
    public int ProductCount { get { return products.Count; } }
    public decimal TotalSales { get { return totalSales; } }
    
    public Inventory()
    {
        products = new Dictionary<string, Product>();
        salesHistory = new List<string>();
        totalSales = 0;
    }
    
    // 商品を追加
    public bool AddProduct(Product product)
    {
        if (product == null)
        {
            Console.WriteLine("商品がnullです");
            return false;
        }
        
        if (products.ContainsKey(product.Id))
        {
            Console.WriteLine($"商品ID {product.Id} は既に存在します");
            return false;
        }
        
        products.Add(product.Id, product);
        Console.WriteLine($"商品を追加しました: {product}");
        return true;
    }
    
    // 商品を削除
    public bool RemoveProduct(string productId)
    {
        if (products.Remove(productId))
        {
            Console.WriteLine($"商品ID {productId} を削除しました");
            return true;
        }
        else
        {
            Console.WriteLine($"商品ID {productId} が見つかりません");
            return false;
        }
    }
    
    // 商品を取得
    public Product GetProduct(string productId)
    {
        products.TryGetValue(productId, out Product product);
        return product;
    }
    
    // 商品を販売
    public bool SellProduct(string productId, int quantity)
    {
        if (!products.TryGetValue(productId, out Product product))
        {
            Console.WriteLine($"商品ID {productId} が見つかりません");
            return false;
        }
        
        if (product.ReduceStock(quantity))
        {
            decimal saleAmount = product.Price * quantity;
            totalSales += saleAmount;
            
            string saleRecord = $"{DateTime.Now:yyyy/MM/dd HH:mm:ss} - {product.Name} x{quantity} = {saleAmount:C}";
            salesHistory.Add(saleRecord);
            
            Console.WriteLine($"売上: {saleAmount:C}");
            return true;
        }
        
        return false;
    }
    
    // 在庫を補充
    public bool RestockProduct(string productId, int quantity)
    {
        if (!products.TryGetValue(productId, out Product product))
        {
            Console.WriteLine($"商品ID {productId} が見つかりません");
            return false;
        }
        
        product.AddStock(quantity);
        return true;
    }
    
    // 在庫不足の商品リスト
    public List<Product> GetLowStockProducts()
    {
        List<Product> lowStockProducts = new List<Product>();
        
        foreach (var product in products.Values)
        {
            if (product.IsLowStock())
            {
                lowStockProducts.Add(product);
            }
        }
        
        return lowStockProducts;
    }
    
    // 在庫の総価値
    public decimal GetTotalInventoryValue()
    {
        decimal total = 0;
        foreach (var product in products.Values)
        {
            total += product.GetTotalValue();
        }
        return total;
    }
    
    // 在庫一覧を表示
    public void PrintInventory()
    {
        Console.WriteLine("\n=== 在庫一覧 ===");
        Console.WriteLine($"商品数: {ProductCount}");
        Console.WriteLine("------------------------");
        
        foreach (var product in products.Values)
        {
            Console.WriteLine(product);
            if (product.IsLowStock())
            {
                Console.WriteLine("  ⚠️ 在庫補充が必要です");
            }
        }
        
        Console.WriteLine("------------------------");
        Console.WriteLine($"在庫総額: {GetTotalInventoryValue():C}");
        Console.WriteLine($"総売上: {TotalSales:C}");
    }
    
    // 売上履歴を表示
    public void PrintSalesHistory()
    {
        Console.WriteLine("\n=== 売上履歴 ===");
        if (salesHistory.Count == 0)
        {
            Console.WriteLine("売上履歴がありません");
        }
        else
        {
            foreach (string record in salesHistory)
            {
                Console.WriteLine(record);
            }
            Console.WriteLine($"合計売上: {TotalSales:C}");
        }
    }
}

// Main メソッド内のテストコード
Inventory inventory = new Inventory();

// 商品を追加
inventory.AddProduct(new Product("P001", "ノートPC", 80000, 5, 3));
inventory.AddProduct(new Product("P002", "マウス", 3000, 20, 10));
inventory.AddProduct(new Product("P003", "キーボード", 5000, 15, 5));
inventory.AddProduct(new Product("P004", "モニター", 30000, 2, 5));

// 在庫状況を表示
inventory.PrintInventory();

// 販売処理
Console.WriteLine("\n=== 販売処理 ===");
inventory.SellProduct("P001", 3);
inventory.SellProduct("P002", 15);
inventory.SellProduct("P004", 1);

// 在庫不足商品の確認
Console.WriteLine("\n=== 在庫不足商品 ===");
var lowStockProducts = inventory.GetLowStockProducts();
foreach (var product in lowStockProducts)
{
    Console.WriteLine($"- {product.Name}: 残り{product.Stock}個");
}

// 在庫補充
Console.WriteLine("\n=== 在庫補充 ===");
inventory.RestockProduct("P001", 10);
inventory.RestockProduct("P004", 8);

// 最終的な在庫状況
inventory.PrintInventory();
inventory.PrintSalesHistory();`,
      difficulty: 'hard',
      estimatedTime: 35
    },
    {
      id: 'game-character-exercise',
      title: 'ゲームキャラクタークラス',
      description: 'RPGゲームのキャラクターを表すCharacterクラスを作成してください。HP、攻撃力、防御力などの基本ステータスと、攻撃、回復、レベルアップなどの機能を実装してください。',
      starterCode: `using System;

namespace GameCharacter
{
    class Program
    {
        static void Main(string[] args)
        {
            // Characterクラスを作成してください
            // 必要な要素:
            // - 名前、レベル、経験値
            // - HP（現在値/最大値）、攻撃力、防御力
            // - 攻撃メソッド（相手にダメージを与える）
            // - ダメージを受けるメソッド
            // - 回復メソッド
            // - 経験値取得とレベルアップ
            // - 生存判定
            
            // バトルシミュレーション例:
            // Character hero = new Character("勇者", 10, 8, 5);
            // Character enemy = new Character("スライム", 5, 3, 2);
            // 
            // hero.Attack(enemy);
            // enemy.Attack(hero);
        }
    }
    
    // ここにCharacterクラスを実装してください
}`,
      hints: [
        'レベルアップ時にステータスを自動的に上昇',
        'ダメージ計算は攻撃力-防御力（最小1ダメージ）',
        '経験値はレベル×100で次のレベルに',
        'HPが0以下になったら戦闘不能'
      ],
      solution: `public class Character
{
    // 基本情報
    private string name;
    private int level;
    private int experience;
    private int experienceToNextLevel;
    
    // ステータス
    private int maxHp;
    private int currentHp;
    private int baseAttack;
    private int baseDefense;
    
    // プロパティ
    public string Name { get { return name; } }
    public int Level { get { return level; } }
    public int Experience { get { return experience; } }
    public int ExperienceToNextLevel { get { return experienceToNextLevel; } }
    public int MaxHp { get { return maxHp; } }
    public int CurrentHp { get { return currentHp; } }
    public int Attack { get { return baseAttack + (level - 1) * 2; } }
    public int Defense { get { return baseDefense + (level - 1); } }
    public bool IsAlive { get { return currentHp > 0; } }
    
    // コンストラクタ
    public Character(string name, int initialHp, int initialAttack, int initialDefense)
    {
        this.name = name;
        this.level = 1;
        this.experience = 0;
        this.experienceToNextLevel = 100;
        
        this.maxHp = initialHp;
        this.currentHp = initialHp;
        this.baseAttack = initialAttack;
        this.baseDefense = initialDefense;
        
        Console.WriteLine($"{name}が誕生しました！");
        PrintStatus();
    }
    
    // 攻撃メソッド
    public void Attack(Character target)
    {
        if (!IsAlive)
        {
            Console.WriteLine($"{name}は戦闘不能で攻撃できません");
            return;
        }
        
        if (!target.IsAlive)
        {
            Console.WriteLine($"{target.Name}は既に倒れています");
            return;
        }
        
        Console.WriteLine($"\n{name}の攻撃！");
        int damage = Math.Max(1, this.Attack - target.Defense);
        target.TakeDamage(damage);
        
        // 敵を倒した場合、経験値を獲得
        if (!target.IsAlive)
        {
            int expGained = target.Level * 50;
            Console.WriteLine($"{target.Name}を倒した！");
            GainExperience(expGained);
        }
    }
    
    // ダメージを受ける
    private void TakeDamage(int damage)
    {
        currentHp -= damage;
        if (currentHp < 0) currentHp = 0;
        
        Console.WriteLine($"{name}は{damage}のダメージを受けた！");
        Console.WriteLine($"{name}のHP: {currentHp}/{maxHp}");
        
        if (!IsAlive)
        {
            Console.WriteLine($"{name}は倒れた...");
        }
    }
    
    // 回復メソッド
    public void Heal(int amount)
    {
        if (!IsAlive)
        {
            Console.WriteLine($"{name}は戦闘不能で回復できません");
            return;
        }
        
        int oldHp = currentHp;
        currentHp = Math.Min(currentHp + amount, maxHp);
        int actualHeal = currentHp - oldHp;
        
        Console.WriteLine($"{name}は{actualHeal}回復した！");
        Console.WriteLine($"{name}のHP: {currentHp}/{maxHp}");
    }
    
    // 完全回復
    public void FullHeal()
    {
        currentHp = maxHp;
        Console.WriteLine($"{name}のHPが完全回復した！");
    }
    
    // 経験値を獲得
    private void GainExperience(int exp)
    {
        experience += exp;
        Console.WriteLine($"{name}は{exp}の経験値を獲得！");
        
        // レベルアップチェック
        while (experience >= experienceToNextLevel)
        {
            LevelUp();
        }
    }
    
    // レベルアップ
    private void LevelUp()
    {
        experience -= experienceToNextLevel;
        level++;
        experienceToNextLevel = level * 100;
        
        // ステータス上昇
        int hpIncrease = 5 + level;
        maxHp += hpIncrease;
        currentHp += hpIncrease; // 現在HPも増加
        
        Console.WriteLine($"\n🎉 {name}はレベル{level}になった！");
        Console.WriteLine($"最大HP +{hpIncrease}");
        Console.WriteLine($"攻撃力: {Attack - 2} → {Attack}");
        Console.WriteLine($"防御力: {Defense - 1} → {Defense}");
    }
    
    // ステータス表示
    public void PrintStatus()
    {
        Console.WriteLine($"\n=== {name}のステータス ===");
        Console.WriteLine($"レベル: {level}");
        Console.WriteLine($"HP: {currentHp}/{maxHp}");
        Console.WriteLine($"攻撃力: {Attack}");
        Console.WriteLine($"防御力: {Defense}");
        Console.WriteLine($"経験値: {experience}/{experienceToNextLevel}");
        Console.WriteLine($"状態: {(IsAlive ? "戦闘可能" : "戦闘不能")}");
    }
    
    // 簡易バトル（自動戦闘）
    public static void Battle(Character char1, Character char2)
    {
        Console.WriteLine($"\n⚔️ {char1.Name} VS {char2.Name} ⚔️");
        
        int turn = 1;
        while (char1.IsAlive && char2.IsAlive)
        {
            Console.WriteLine($"\n--- ターン{turn} ---");
            
            // char1の攻撃
            if (char1.IsAlive)
            {
                char1.Attack(char2);
            }
            
            // char2の反撃
            if (char2.IsAlive)
            {
                char2.Attack(char1);
            }
            
            turn++;
            
            // 無限ループ防止
            if (turn > 50)
            {
                Console.WriteLine("バトルが長引いたため引き分け！");
                break;
            }
        }
        
        // 勝者の発表
        if (char1.IsAlive && !char2.IsAlive)
        {
            Console.WriteLine($"\n🏆 {char1.Name}の勝利！");
        }
        else if (!char1.IsAlive && char2.IsAlive)
        {
            Console.WriteLine($"\n🏆 {char2.Name}の勝利！");
        }
    }
}

// Main メソッド内のテストコード
// キャラクター作成
Character hero = new Character("勇者", 30, 12, 8);
Character slime = new Character("スライム", 20, 8, 3);
Character dragon = new Character("ドラゴン", 50, 15, 10);

// バトルシミュレーション
Character.Battle(hero, slime);

// 回復
hero.Heal(10);
hero.PrintStatus();

// 強敵とのバトル
hero.FullHeal();
Character.Battle(hero, dragon);

// 最終ステータス
if (hero.IsAlive)
{
    hero.PrintStatus();
}`,
      difficulty: 'hard',
      estimatedTime: 40
    }
  ],
  estimatedTime: 75,
  difficulty: 'intermediate',
  prerequisites: ['hello-world', 'variables-and-types', 'operators-and-expressions', 'arrays-and-collections', 'control-flow-if', 'control-flow-switch', 'loops-for-while', 'methods'],
  nextLesson: 'inheritance-and-polymorphism'
};