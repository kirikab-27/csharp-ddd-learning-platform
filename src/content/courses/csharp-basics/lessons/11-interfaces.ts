import type { Lesson } from '../../../../features/learning/types';

export const interfacesLesson: Lesson = {
  id: 'interfaces',
  title: 'インターフェース',
  description: 'インターフェースの定義と実装方法を学び、契約プログラミングの概念を理解します',
  order: 11,
  moduleId: 'object-oriented',
  content: `# インターフェース

インターフェースは、クラスが実装すべきメソッドやプロパティの契約（コントラクト）を定義する仕組みです。抽象的な型を定義し、複数のクラスで共通の振る舞いを保証します。

## インターフェースとは？

インターフェースは以下の特徴を持ちます：

- **契約の定義**: メソッドやプロパティのシグネチャを定義
- **多重実装**: 1つのクラスが複数のインターフェースを実装可能
- **実装の強制**: インターフェースのすべてのメンバーを実装する必要がある
- **ポリモーフィズム**: インターフェース型として扱える

## 基本的な定義と実装

\`\`\`csharp
// インターフェースの定義
public interface IVehicle
{
    // プロパティ（自動実装プロパティは使用不可）
    string Brand { get; set; }
    int MaxSpeed { get; }
    
    // メソッド（実装なし）
    void Start();
    void Stop();
    double CalculateFuelEfficiency(double distance);
}

// インターフェースの実装
public class Car : IVehicle
{
    // プロパティの実装
    public string Brand { get; set; }
    public int MaxSpeed { get; private set; }
    
    // コンストラクタ
    public Car(string brand, int maxSpeed)
    {
        Brand = brand;
        MaxSpeed = maxSpeed;
    }
    
    // メソッドの実装
    public void Start()
    {
        Console.WriteLine($"{Brand}のエンジンを始動します");
    }
    
    public void Stop()
    {
        Console.WriteLine($"{Brand}を停止します");
    }
    
    public double CalculateFuelEfficiency(double distance)
    {
        // 簡単な燃費計算のロジック
        return distance / 15.0; // 15km/L と仮定
    }
}
\`\`\`

## 複数のインターフェースの実装

C#では、クラスは複数のインターフェースを実装できます。これにより、より柔軟な設計が可能になります。

\`\`\`csharp
// 複数のインターフェース定義
public interface IMovable
{
    void Move(int x, int y);
    int X { get; }
    int Y { get; }
}

public interface IDrawable
{
    void Draw();
    ConsoleColor Color { get; set; }
}

// 複数のインターフェースを実装
public class GameObject : IMovable, IDrawable
{
    // IMovableの実装
    public int X { get; private set; }
    public int Y { get; private set; }
    
    public void Move(int x, int y)
    {
        X = x;
        Y = y;
        Console.WriteLine($"位置を ({X}, {Y}) に移動しました");
    }
    
    // IDrawableの実装
    public ConsoleColor Color { get; set; }
    
    public void Draw()
    {
        Console.ForegroundColor = Color;
        Console.SetCursorPosition(X, Y);
        Console.Write("●");
        Console.ResetColor();
    }
}

// 使用例
var gameObject = new GameObject();
gameObject.Color = ConsoleColor.Red;
gameObject.Move(10, 5);
gameObject.Draw();
\`\`\`

## インターフェースの継承

インターフェースは他のインターフェースを継承できます。これにより、インターフェースの階層構造を作ることができます。

\`\`\`csharp
// 基本インターフェース
public interface IShape
{
    double CalculateArea();
    double CalculatePerimeter();
}

// 拡張インターフェース
public interface IColoredShape : IShape
{
    ConsoleColor FillColor { get; set; }
    ConsoleColor BorderColor { get; set; }
    void Display();
}

// 実装クラス
public class ColoredRectangle : IColoredShape
{
    public double Width { get; set; }
    public double Height { get; set; }
    public ConsoleColor FillColor { get; set; }
    public ConsoleColor BorderColor { get; set; }
    
    public ColoredRectangle(double width, double height)
    {
        Width = width;
        Height = height;
        FillColor = ConsoleColor.White;
        BorderColor = ConsoleColor.Black;
    }
    
    public double CalculateArea()
    {
        return Width * Height;
    }
    
    public double CalculatePerimeter()
    {
        return 2 * (Width + Height);
    }
    
    public void Display()
    {
        Console.ForegroundColor = FillColor;
        Console.WriteLine($"■ 長方形: {Width} x {Height}");
        Console.WriteLine($"  面積: {CalculateArea()}");
        Console.WriteLine($"  周囲: {CalculatePerimeter()}");
        Console.ResetColor();
    }
}
\`\`\`

## 明示的なインターフェース実装

同じシグネチャのメソッドを持つ複数のインターフェースを実装する場合、明示的な実装を使用します。

\`\`\`csharp
public interface IEnglishSpeaker
{
    void Speak();
}

public interface IJapaneseSpeaker
{
    void Speak();
}

public class Translator : IEnglishSpeaker, IJapaneseSpeaker
{
    // 暗黙的な実装（デフォルトの動作）
    public void Speak()
    {
        Console.WriteLine("Hello! こんにちは！");
    }
    
    // 明示的な実装（IEnglishSpeaker用）
    void IEnglishSpeaker.Speak()
    {
        Console.WriteLine("Hello! How are you?");
    }
    
    // 明示的な実装（IJapaneseSpeaker用）
    void IJapaneseSpeaker.Speak()
    {
        Console.WriteLine("こんにちは！元気ですか？");
    }
}

// 使用例
var translator = new Translator();
translator.Speak(); // デフォルトの実装が呼ばれる

IEnglishSpeaker englishSpeaker = translator;
englishSpeaker.Speak(); // 英語版が呼ばれる

IJapaneseSpeaker japaneseSpeaker = translator;
japaneseSpeaker.Speak(); // 日本語版が呼ばれる
\`\`\`

## インターフェースとポリモーフィズム

インターフェースを使用することで、異なるクラスのオブジェクトを同じ型として扱うことができます。

\`\`\`csharp
public interface IAnimal
{
    string Name { get; set; }
    void MakeSound();
    void Move();
}

public class Dog : IAnimal
{
    public string Name { get; set; }
    
    public Dog(string name)
    {
        Name = name;
    }
    
    public void MakeSound()
    {
        Console.WriteLine($"{Name}: ワンワン！");
    }
    
    public void Move()
    {
        Console.WriteLine($"{Name}が走っています");
    }
}

public class Cat : IAnimal
{
    public string Name { get; set; }
    
    public Cat(string name)
    {
        Name = name;
    }
    
    public void MakeSound()
    {
        Console.WriteLine($"{Name}: ニャー！");
    }
    
    public void Move()
    {
        Console.WriteLine($"{Name}がそっと歩いています");
    }
}

// ポリモーフィズムの活用
class Zoo
{
    private List<IAnimal> animals = new List<IAnimal>();
    
    public void AddAnimal(IAnimal animal)
    {
        animals.Add(animal);
    }
    
    public void MakeAllAnimalsSound()
    {
        Console.WriteLine("=== 動物園の朝 ===");
        foreach (var animal in animals)
        {
            animal.MakeSound();
        }
    }
    
    public void ExerciseTime()
    {
        Console.WriteLine("\\n=== 運動の時間 ===");
        foreach (var animal in animals)
        {
            animal.Move();
        }
    }
}

// 使用例
var zoo = new Zoo();
zoo.AddAnimal(new Dog("ポチ"));
zoo.AddAnimal(new Cat("タマ"));

zoo.MakeAllAnimalsSound();
zoo.ExerciseTime();
\`\`\`

## デフォルト実装（C# 8.0以降）

C# 8.0からは、インターフェースにデフォルト実装を含めることができるようになりました。

\`\`\`csharp
public interface ILogger
{
    void Log(string message);
    
    // デフォルト実装を持つメソッド
    void LogError(string message)
    {
        Log($"[ERROR] {message}");
    }
    
    void LogWarning(string message)
    {
        Log($"[WARNING] {message}");
    }
    
    void LogInfo(string message)
    {
        Log($"[INFO] {message}");
    }
}

public class ConsoleLogger : ILogger
{
    // Logメソッドのみ実装が必要
    public void Log(string message)
    {
        Console.WriteLine($"{DateTime.Now:yyyy-MM-dd HH:mm:ss} {message}");
    }
    
    // デフォルト実装をオーバーライドすることも可能
    public void LogError(string message)
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Log($"[ERROR] {message}");
        Console.ResetColor();
    }
}

// 使用例
ILogger logger = new ConsoleLogger();
logger.LogInfo("アプリケーションを開始しました");
logger.LogWarning("設定ファイルが見つかりません");
logger.LogError("データベース接続に失敗しました");
\`\`\`

## 実践的な例：リポジトリパターン

インターフェースは、データアクセス層の抽象化によく使用されます。

\`\`\`csharp
// エンティティクラス
public class User
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
}

// リポジトリインターフェース
public interface IUserRepository
{
    User GetById(int id);
    List<User> GetAll();
    void Add(User user);
    void Update(User user);
    void Delete(int id);
}

// メモリ上での実装（テスト用）
public class InMemoryUserRepository : IUserRepository
{
    private List<User> users = new List<User>();
    private int nextId = 1;
    
    public User GetById(int id)
    {
        return users.FirstOrDefault(u => u.Id == id);
    }
    
    public List<User> GetAll()
    {
        return new List<User>(users);
    }
    
    public void Add(User user)
    {
        user.Id = nextId++;
        users.Add(user);
    }
    
    public void Update(User user)
    {
        var existingUser = GetById(user.Id);
        if (existingUser != null)
        {
            existingUser.Name = user.Name;
            existingUser.Email = user.Email;
        }
    }
    
    public void Delete(int id)
    {
        users.RemoveAll(u => u.Id == id);
    }
}

// ビジネスロジック層
public class UserService
{
    private readonly IUserRepository repository;
    
    // 依存性注入
    public UserService(IUserRepository repository)
    {
        this.repository = repository;
    }
    
    public void RegisterUser(string name, string email)
    {
        // バリデーション
        if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(email))
        {
            throw new ArgumentException("名前とメールアドレスは必須です");
        }
        
        var user = new User { Name = name, Email = email };
        repository.Add(user);
        Console.WriteLine($"ユーザー '{name}' を登録しました");
    }
    
    public void DisplayAllUsers()
    {
        var users = repository.GetAll();
        Console.WriteLine("\\n=== 登録ユーザー一覧 ===");
        foreach (var user in users)
        {
            Console.WriteLine($"ID: {user.Id}, 名前: {user.Name}, Email: {user.Email}");
        }
    }
}

// 使用例
var repository = new InMemoryUserRepository();
var userService = new UserService(repository);

userService.RegisterUser("田中太郎", "tanaka@example.com");
userService.RegisterUser("佐藤花子", "sato@example.com");
userService.DisplayAllUsers();
\`\`\`

## まとめ

インターフェースは、C#における重要な抽象化の仕組みです：

1. **契約の定義**: 実装すべきメンバーを定義
2. **多重実装**: 複数のインターフェースを実装可能
3. **ポリモーフィズム**: 異なる実装を同じ型として扱える
4. **疎結合**: 依存性注入で柔軟な設計が可能
5. **テスタビリティ**: モックやスタブの作成が容易

インターフェースを活用することで、より保守性の高い、拡張可能なコードを作成できます。`,
  codeExamples: [
    {
      id: 'basic-interface-example',
      title: '基本的なインターフェースの定義と実装',
      code: `using System;

namespace BasicInterfaceExample
{
    // インターフェースの定義
    public interface IVehicle
    {
        string Brand { get; set; }
        int MaxSpeed { get; }
        
        void Start();
        void Stop();
        double CalculateFuelEfficiency(double distance);
    }

    // インターフェースの実装
    public class Car : IVehicle
    {
        public string Brand { get; set; }
        public int MaxSpeed { get; private set; }
        
        public Car(string brand, int maxSpeed)
        {
            Brand = brand;
            MaxSpeed = maxSpeed;
        }
        
        public void Start()
        {
            Console.WriteLine($"{Brand}のエンジンを始動します");
        }
        
        public void Stop()
        {
            Console.WriteLine($"{Brand}を停止します");
        }
        
        public double CalculateFuelEfficiency(double distance)
        {
            return distance / 15.0; // 15km/L と仮定
        }
    }

    class Program
    {
        static void Main()
        {
            // インターフェース型として使用
            IVehicle vehicle = new Car("トヨタ", 180);
            
            vehicle.Start();
            Console.WriteLine($"最高速度: {vehicle.MaxSpeed} km/h");
            Console.WriteLine($"燃費: {vehicle.CalculateFuelEfficiency(100):F2} L/100km");
            vehicle.Stop();
        }
    }
}`,
      language: 'csharp',
      description: 'インターフェースの基本的な定義と実装例。車クラスでIVehicleインターフェースを実装しています。'
    },
    {
      id: 'multiple-interfaces-example',
      title: '複数インターフェースの実装',
      code: `using System;

namespace MultipleInterfacesExample
{
    public interface IMovable
    {
        void Move(int x, int y);
        int X { get; }
        int Y { get; }
    }

    public interface IDrawable
    {
        void Draw();
        ConsoleColor Color { get; set; }
    }

    // 複数のインターフェースを実装
    public class GameObject : IMovable, IDrawable
    {
        public int X { get; private set; }
        public int Y { get; private set; }
        public ConsoleColor Color { get; set; }
        
        public GameObject()
        {
            Color = ConsoleColor.White;
        }
        
        public void Move(int x, int y)
        {
            X = x;
            Y = y;
            Console.WriteLine($"位置を ({X}, {Y}) に移動しました");
        }
        
        public void Draw()
        {
            Console.ForegroundColor = Color;
            Console.WriteLine($"({X}, {Y}) に●を描画");
            Console.ResetColor();
        }
    }

    class Program
    {
        static void Main()
        {
            var gameObject = new GameObject();
            gameObject.Color = ConsoleColor.Red;
            
            // IMovableとして使用
            IMovable movable = gameObject;
            movable.Move(10, 5);
            
            // IDrawableとして使用
            IDrawable drawable = gameObject;
            drawable.Draw();
        }
    }
}`,
      language: 'csharp',
      description: '1つのクラスが複数のインターフェースを実装する例。ゲームオブジェクトが移動と描画の両方の機能を持ちます。'
    },
    {
      id: 'polymorphism-example',
      title: 'インターフェースとポリモーフィズム',
      code: `using System;
using System.Collections.Generic;

namespace PolymorphismExample
{
    public interface IAnimal
    {
        string Name { get; set; }
        void MakeSound();
        void Move();
    }

    public class Dog : IAnimal
    {
        public string Name { get; set; }
        
        public Dog(string name)
        {
            Name = name;
        }
        
        public void MakeSound()
        {
            Console.WriteLine($"{Name}: ワンワン！");
        }
        
        public void Move()
        {
            Console.WriteLine($"{Name}が走っています");
        }
    }

    public class Cat : IAnimal
    {
        public string Name { get; set; }
        
        public Cat(string name)
        {
            Name = name;
        }
        
        public void MakeSound()
        {
            Console.WriteLine($"{Name}: ニャー！");
        }
        
        public void Move()
        {
            Console.WriteLine($"{Name}がそっと歩いています");
        }
    }

    public class Zoo
    {
        private List<IAnimal> animals = new List<IAnimal>();
        
        public void AddAnimal(IAnimal animal)
        {
            animals.Add(animal);
        }
        
        public void MakeAllAnimalsSound()
        {
            Console.WriteLine("=== 動物園の朝 ===");
            foreach (var animal in animals)
            {
                animal.MakeSound();
            }
        }
        
        public void ExerciseTime()
        {
            Console.WriteLine("\\n=== 運動の時間 ===");
            foreach (var animal in animals)
            {
                animal.Move();
            }
        }
    }

    class Program
    {
        static void Main()
        {
            var zoo = new Zoo();
            zoo.AddAnimal(new Dog("ポチ"));
            zoo.AddAnimal(new Cat("タマ"));
            zoo.AddAnimal(new Dog("シロ"));
            
            zoo.MakeAllAnimalsSound();
            zoo.ExerciseTime();
        }
    }
}`,
      language: 'csharp',
      description: 'インターフェースを使ったポリモーフィズムの実例。異なる動物クラスを同じインターフェース型として扱い、統一的に操作しています。'
    }
  ],
  exercises: [
    {
      id: 'shape-interface-exercise',
      title: '図形インターフェースの実装',
      description: 'IShapeインターフェースを定義し、Circle（円）とRectangle（長方形）クラスで実装してください。面積と周囲を計算するメソッドを含めてください。',
      starterCode: `using System;

namespace ShapeInterface
{
    class Program
    {
        static void Main(string[] args)
        {
            // IShapeインターフェースを定義してください
            // 必要なメンバー:
            // - double CalculateArea() メソッド
            // - double CalculatePerimeter() メソッド
            // - string GetShapeType() メソッド
            
            // Circleクラスを実装してください
            // - コンストラクタで半径を受け取る
            // - 円の面積 = π × 半径²
            // - 円の周囲 = 2 × π × 半径
            
            // Rectangleクラスを実装してください
            // - コンストラクタで幅と高さを受け取る
            // - 長方形の面積 = 幅 × 高さ
            // - 長方形の周囲 = 2 × (幅 + 高さ)
            
            // テストケース
            // IShape[] shapes = new IShape[]
            // {
            //     new Circle(5),
            //     new Rectangle(4, 6),
            //     new Circle(3)
            // };
            
            // foreach (var shape in shapes)
            // {
            //     Console.WriteLine($"{shape.GetShapeType()}:");
            //     Console.WriteLine($"  面積: {shape.CalculateArea():F2}");
            //     Console.WriteLine($"  周囲: {shape.CalculatePerimeter():F2}");
            // }
        }
    }
    
    // ここにインターフェースとクラスを実装してください
}`,
      hints: [
        'インターフェースのメソッドは実装を持たず、シグネチャのみを定義',
        'Math.PIを使用して円周率を取得',
        'インターフェース型の配列で異なるクラスのインスタンスを格納可能',
        'F2フォーマットで小数点以下2桁まで表示'
      ],
      solution: `public interface IShape
{
    double CalculateArea();
    double CalculatePerimeter();
    string GetShapeType();
}

public class Circle : IShape
{
    private double radius;
    
    public Circle(double radius)
    {
        if (radius <= 0)
            throw new ArgumentException("半径は正の値である必要があります");
        this.radius = radius;
    }
    
    public double CalculateArea()
    {
        return Math.PI * radius * radius;
    }
    
    public double CalculatePerimeter()
    {
        return 2 * Math.PI * radius;
    }
    
    public string GetShapeType()
    {
        return "円";
    }
}

public class Rectangle : IShape
{
    private double width;
    private double height;
    
    public Rectangle(double width, double height)
    {
        if (width <= 0 || height <= 0)
            throw new ArgumentException("幅と高さは正の値である必要があります");
        this.width = width;
        this.height = height;
    }
    
    public double CalculateArea()
    {
        return width * height;
    }
    
    public double CalculatePerimeter()
    {
        return 2 * (width + height);
    }
    
    public string GetShapeType()
    {
        return "長方形";
    }
}`,
      difficulty: 'medium',
      estimatedTime: 15
    },
    {
      id: 'payment-system-exercise',
      title: '支払いシステムの実装',
      description: '異なる支払い方法を表すIPaymentMethodインターフェースを定義し、CreditCard、Cash、DigitalWalletクラスで実装してください。',
      starterCode: `using System;

namespace PaymentSystem
{
    class Program
    {
        static void Main(string[] args)
        {
            // IPaymentMethodインターフェースを定義してください
            // 必要なメンバー:
            // - bool ProcessPayment(decimal amount) メソッド
            // - string GetPaymentType() メソッド
            // - bool IsAvailable() メソッド
            
            // CreditCardクラスを実装してください
            // - カード番号（下4桁のみ保存）と所有者名を管理
            // - 利用限度額のチェック
            
            // Cashクラスを実装してください
            // - 受け取った金額を管理
            // - おつりの計算
            
            // DigitalWalletクラスを実装してください
            // - 残高を管理
            // - 残高不足のチェック
            
            // PaymentProcessorクラスを作成してください
            // - 複数の支払い方法を管理
            // - 利用可能な支払い方法で決済を試行
        }
    }
    
    // ここにインターフェースとクラスを実装してください
}`,
      hints: [
        '支払い方法ごとに異なる検証ロジックを実装',
        'ProcessPaymentメソッドは成功/失敗をboolで返す',
        'カード番号はセキュリティのため部分的にマスク',
        'PaymentProcessorでポリモーフィズムを活用'
      ],
      solution: `public interface IPaymentMethod
{
    bool ProcessPayment(decimal amount);
    string GetPaymentType();
    bool IsAvailable();
}

public class CreditCard : IPaymentMethod
{
    private string lastFourDigits;
    private string ownerName;
    private decimal creditLimit;
    private decimal currentBalance;
    
    public CreditCard(string cardNumber, string ownerName, decimal creditLimit)
    {
        if (cardNumber.Length < 4)
            throw new ArgumentException("無効なカード番号です");
            
        this.lastFourDigits = cardNumber.Substring(cardNumber.Length - 4);
        this.ownerName = ownerName;
        this.creditLimit = creditLimit;
        this.currentBalance = 0;
    }
    
    public bool ProcessPayment(decimal amount)
    {
        if (amount <= 0)
        {
            Console.WriteLine("無効な金額です");
            return false;
        }
        
        if (currentBalance + amount > creditLimit)
        {
            Console.WriteLine($"クレジットカード（****{lastFourDigits}）: 利用限度額を超えています");
            return false;
        }
        
        currentBalance += amount;
        Console.WriteLine($"クレジットカード（****{lastFourDigits}）で {amount:C} を決済しました");
        Console.WriteLine($"利用可能残高: {creditLimit - currentBalance:C}");
        return true;
    }
    
    public string GetPaymentType()
    {
        return "クレジットカード";
    }
    
    public bool IsAvailable()
    {
        return currentBalance < creditLimit;
    }
}

public class Cash : IPaymentMethod
{
    private decimal cashOnHand;
    
    public Cash(decimal cashOnHand)
    {
        this.cashOnHand = cashOnHand;
    }
    
    public bool ProcessPayment(decimal amount)
    {
        if (amount <= 0)
        {
            Console.WriteLine("無効な金額です");
            return false;
        }
        
        if (cashOnHand < amount)
        {
            Console.WriteLine($"現金が不足しています。不足額: {amount - cashOnHand:C}");
            return false;
        }
        
        decimal change = cashOnHand - amount;
        Console.WriteLine($"現金で {amount:C} を支払いました");
        if (change > 0)
        {
            Console.WriteLine($"おつり: {change:C}");
        }
        cashOnHand = 0; // 支払い後は現金がなくなる
        return true;
    }
    
    public string GetPaymentType()
    {
        return "現金";
    }
    
    public bool IsAvailable()
    {
        return cashOnHand > 0;
    }
}

public class DigitalWallet : IPaymentMethod
{
    private string walletName;
    private decimal balance;
    
    public DigitalWallet(string walletName, decimal initialBalance)
    {
        this.walletName = walletName;
        this.balance = initialBalance;
    }
    
    public bool ProcessPayment(decimal amount)
    {
        if (amount <= 0)
        {
            Console.WriteLine("無効な金額です");
            return false;
        }
        
        if (balance < amount)
        {
            Console.WriteLine($"{walletName}の残高が不足しています。現在の残高: {balance:C}");
            return false;
        }
        
        balance -= amount;
        Console.WriteLine($"{walletName}で {amount:C} を決済しました");
        Console.WriteLine($"残高: {balance:C}");
        return true;
    }
    
    public string GetPaymentType()
    {
        return walletName;
    }
    
    public bool IsAvailable()
    {
        return balance > 0;
    }
}

public class PaymentProcessor
{
    private List<IPaymentMethod> paymentMethods;
    
    public PaymentProcessor()
    {
        paymentMethods = new List<IPaymentMethod>();
    }
    
    public void AddPaymentMethod(IPaymentMethod method)
    {
        paymentMethods.Add(method);
    }
    
    public bool ProcessOrder(decimal amount)
    {
        Console.WriteLine($"\\n注文金額: {amount:C}");
        Console.WriteLine("利用可能な支払い方法を確認中...");
        
        foreach (var method in paymentMethods)
        {
            if (method.IsAvailable())
            {
                Console.WriteLine($"\\n{method.GetPaymentType()}で決済を試行中...");
                if (method.ProcessPayment(amount))
                {
                    Console.WriteLine("決済が完了しました！");
                    return true;
                }
            }
        }
        
        Console.WriteLine("\\n利用可能な支払い方法がありません");
        return false;
    }
}`,
      difficulty: 'hard',
      estimatedTime: 20
    },
    {
      id: 'file-system-interface-exercise',
      title: 'ファイルシステムインターフェース',
      description: 'ファイル操作を抽象化するIFileSystemインターフェースを定義し、LocalFileSystemとMemoryFileSystemクラスで実装してください。',
      starterCode: `using System;
using System.Collections.Generic;

namespace FileSystemInterface
{
    class Program
    {
        static void Main(string[] args)
        {
            // IFileSystemインターフェースを定義してください
            // 必要なメンバー:
            // - void CreateFile(string path, string content)
            // - string ReadFile(string path)
            // - void DeleteFile(string path)
            // - bool FileExists(string path)
            // - List<string> ListFiles()
            
            // LocalFileSystemクラスを実装してください（シミュレーション）
            // - Dictionary<string, string>でファイルを管理
            
            // MemoryFileSystemクラスを実装してください
            // - メモリ上でファイルを管理
            // - ファイルサイズの制限（各ファイル最大1000文字）
            
            // テストケース
            // void TestFileSystem(IFileSystem fs)
            // {
            //     fs.CreateFile("test.txt", "Hello, World!");
            //     fs.CreateFile("data.txt", "Sample data");
            //     
            //     Console.WriteLine("Files: " + string.Join(", ", fs.ListFiles()));
            //     Console.WriteLine("test.txt: " + fs.ReadFile("test.txt"));
            //     
            //     fs.DeleteFile("data.txt");
            //     Console.WriteLine("After deletion: " + string.Join(", ", fs.ListFiles()));
            // }
        }
    }
    
    // ここにインターフェースとクラスを実装してください
}`,
      hints: [
        'Dictionary<string, string>でパスとコンテンツを管理',
        'FileExistsメソッドでファイルの存在を確認してから操作',
        '例外処理を適切に実装（ファイルが見つからない場合など）',
        'MemoryFileSystemではファイルサイズの制限をチェック'
      ],
      solution: `public interface IFileSystem
{
    void CreateFile(string path, string content);
    string ReadFile(string path);
    void DeleteFile(string path);
    bool FileExists(string path);
    List<string> ListFiles();
}

public class LocalFileSystem : IFileSystem
{
    private Dictionary<string, string> files;
    
    public LocalFileSystem()
    {
        files = new Dictionary<string, string>();
    }
    
    public void CreateFile(string path, string content)
    {
        if (string.IsNullOrWhiteSpace(path))
            throw new ArgumentException("ファイルパスが無効です");
            
        if (files.ContainsKey(path))
            throw new InvalidOperationException($"ファイル '{path}' は既に存在します");
            
        files[path] = content;
        Console.WriteLine($"ファイル '{path}' を作成しました");
    }
    
    public string ReadFile(string path)
    {
        if (!files.ContainsKey(path))
            throw new FileNotFoundException($"ファイル '{path}' が見つかりません");
            
        return files[path];
    }
    
    public void DeleteFile(string path)
    {
        if (!files.ContainsKey(path))
            throw new FileNotFoundException($"ファイル '{path}' が見つかりません");
            
        files.Remove(path);
        Console.WriteLine($"ファイル '{path}' を削除しました");
    }
    
    public bool FileExists(string path)
    {
        return files.ContainsKey(path);
    }
    
    public List<string> ListFiles()
    {
        return new List<string>(files.Keys);
    }
}

public class MemoryFileSystem : IFileSystem
{
    private Dictionary<string, string> memory;
    private const int MaxFileSize = 1000;
    
    public MemoryFileSystem()
    {
        memory = new Dictionary<string, string>();
    }
    
    public void CreateFile(string path, string content)
    {
        if (string.IsNullOrWhiteSpace(path))
            throw new ArgumentException("ファイルパスが無効です");
            
        if (memory.ContainsKey(path))
            throw new InvalidOperationException($"ファイル '{path}' は既に存在します");
            
        if (content.Length > MaxFileSize)
            throw new InvalidOperationException($"ファイルサイズが制限（{MaxFileSize}文字）を超えています");
            
        memory[path] = content;
        Console.WriteLine($"メモリ上にファイル '{path}' を作成しました（{content.Length}文字）");
    }
    
    public string ReadFile(string path)
    {
        if (!memory.ContainsKey(path))
            throw new FileNotFoundException($"ファイル '{path}' が見つかりません");
            
        return memory[path];
    }
    
    public void DeleteFile(string path)
    {
        if (!memory.ContainsKey(path))
            throw new FileNotFoundException($"ファイル '{path}' が見つかりません");
            
        memory.Remove(path);
        Console.WriteLine($"メモリからファイル '{path}' を削除しました");
    }
    
    public bool FileExists(string path)
    {
        return memory.ContainsKey(path);
    }
    
    public List<string> ListFiles()
    {
        var files = new List<string>();
        foreach (var kvp in memory)
        {
            files.Add($"{kvp.Key} ({kvp.Value.Length}文字)");
        }
        return files;
    }
}

// FileNotFoundExceptionのシンプルな実装
public class FileNotFoundException : Exception
{
    public FileNotFoundException(string message) : base(message) { }
}`,
      difficulty: 'hard',
      estimatedTime: 25
    }
  ]
};