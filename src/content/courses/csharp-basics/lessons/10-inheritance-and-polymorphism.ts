import type { Lesson } from '../../../../features/learning/types';

export const inheritanceAndPolymorphismLesson: Lesson = {
  id: 'inheritance-and-polymorphism',
  title: '継承とポリモーフィズム',
  description: '継承によるクラスの拡張、virtual/overrideキーワード、抽象クラス、ポリモーフィズムについて学び、オブジェクト指向プログラミングを深く理解します',
  order: 10,
  content: `# 継承とポリモーフィズム

継承は、既存のクラス（基底クラス）を拡張して新しいクラス（派生クラス）を作成する仕組みです。コードの再利用と拡張を可能にし、オブジェクト指向プログラミングの重要な概念の一つです。

## 継承の基本構文

\`\`\`csharp
// 基底クラス
public class Animal
{
    public string Name { get; set; }
    public void Eat() { /* 実装 */ }
}

// 派生クラス
public class Dog : Animal
{
    public void Bark() { /* 実装 */ }
}
\`\`\`

## 継承の特徴

1. **コードの再利用**: 基底クラスのメンバーを自動的に継承
2. **機能の拡張**: 新しいメンバーを追加できる
3. **単一継承**: C#では1つのクラスからのみ継承可能
4. **is-a関係**: "派生クラス is-a 基底クラス"の関係

## アクセス修飾子と継承

- \`public\`: どこからでもアクセス可能
- \`protected\`: 同じクラスと派生クラスからアクセス可能
- \`private\`: 同じクラス内からのみアクセス可能（継承されない）
- \`internal\`: 同じアセンブリ内からアクセス可能

## base キーワード

派生クラスから基底クラスのメンバーにアクセス：

\`\`\`csharp
public class Animal
{
    protected string name;
    
    public Animal(string name)
    {
        this.name = name;
    }
}

public class Dog : Animal
{
    public Dog(string name) : base(name) // 基底クラスのコンストラクタを呼び出し
    {
    }
    
    public void Introduce()
    {
        Console.WriteLine($"I am {base.name}"); // 基底クラスのフィールドにアクセス
    }
}
\`\`\`

## メソッドのオーバーライド

### virtual と override

基底クラスで\`virtual\`を指定したメソッドは、派生クラスで\`override\`して再定義できます：

\`\`\`csharp
public class Animal
{
    public virtual void MakeSound()
    {
        Console.WriteLine("動物が鳴いています");
    }
}

public class Dog : Animal
{
    public override void MakeSound()
    {
        Console.WriteLine("ワンワン！");
    }
}
\`\`\`

### new キーワード

\`virtual\`でないメソッドを隠蔽する場合：

\`\`\`csharp
public class Dog : Animal
{
    public new void MakeSound() // 基底クラスのメソッドを隠蔽
    {
        Console.WriteLine("ワンワン！");
    }
}
\`\`\`

## 抽象クラス（abstract）

インスタンス化できないクラス。抽象メソッドを含むことができます：

\`\`\`csharp
public abstract class Shape
{
    public string Color { get; set; }
    
    // 抽象メソッド（派生クラスで必ず実装）
    public abstract double CalculateArea();
    
    // 通常のメソッド
    public void DisplayInfo()
    {
        Console.WriteLine($"Color: {Color}, Area: {CalculateArea()}");
    }
}

public class Circle : Shape
{
    public double Radius { get; set; }
    
    public override double CalculateArea()
    {
        return Math.PI * Radius * Radius;
    }
}
\`\`\`

## ポリモーフィズム

同じインターフェースを通じて、異なる型のオブジェクトを統一的に扱える仕組み：

\`\`\`csharp
Shape[] shapes = {
    new Circle { Radius = 5 },
    new Rectangle { Width = 4, Height = 6 }
};

foreach (Shape shape in shapes)
{
    shape.DisplayInfo(); // 各クラスのCalculateAreaが呼ばれる
}
\`\`\`

## sealed キーワード

継承を禁止するクラスやメソッド：

\`\`\`csharp
public sealed class FinalClass
{
    // このクラスは継承できない
}

public class BaseClass
{
    public virtual void Method() { }
}

public class DerivedClass : BaseClass
{
    public sealed override void Method() 
    { 
        // このメソッドはさらにオーバーライドできない
    }
}
\`\`\`

## 型のチェックとキャスト

### is 演算子
\`\`\`csharp
if (animal is Dog)
{
    Console.WriteLine("これは犬です");
}
\`\`\`

### as 演算子
\`\`\`csharp
Dog dog = animal as Dog;
if (dog != null)
{
    dog.Bark();
}
\`\`\`

### パターンマッチング（C# 7.0以降）
\`\`\`csharp
if (animal is Dog dog)
{
    dog.Bark(); // dogは自動的にDog型
}
\`\`\`

## Object クラス

すべてのクラスは暗黙的にObjectクラスから継承：

\`\`\`csharp
public class MyClass // : Object（暗黙的）
{
    public override string ToString()
    {
        return "MyClass instance";
    }
    
    public override bool Equals(object obj)
    {
        // 等価性の判定
    }
    
    public override int GetHashCode()
    {
        // ハッシュコードの生成
    }
}
\`\`\`

## 継承の設計原則

1. **Liskov置換原則**: 派生クラスは基底クラスの代わりに使えるべき
2. **依存関係逆転の原則**: 抽象に依存し、具象に依存しない
3. **開放閉鎖原則**: 拡張に開いて、修正に閉じる`,
  codeExamples: [
    {
      id: 'basic-inheritance',
      title: '基本的な継承とメソッドオーバーライド',
      code: `using System;

namespace BasicInheritance
{
    // 基底クラス：動物
    public class Animal
    {
        protected string name;
        protected int age;
        
        public string Name 
        { 
            get { return name; }
            protected set { name = value; }
        }
        
        public int Age 
        { 
            get { return age; }
            protected set { age = Math.Max(0, value); }
        }
        
        // コンストラクタ
        public Animal(string name, int age)
        {
            this.name = name;
            this.age = age;
            Console.WriteLine($"動物 '{name}' が誕生しました（{age}歳）");
        }
        
        // 仮想メソッド（オーバーライド可能）
        public virtual void MakeSound()
        {
            Console.WriteLine($"{name}が何かの音を出しています");
        }
        
        public virtual void Move()
        {
            Console.WriteLine($"{name}が移動しています");
        }
        
        // 通常のメソッド
        public void Sleep()
        {
            Console.WriteLine($"{name}が眠っています");
        }
        
        public void Eat(string food)
        {
            Console.WriteLine($"{name}が{food}を食べています");
        }
        
        // 仮想プロパティ
        public virtual string Species => "不明な動物";
        
        public virtual void Introduce()
        {
            Console.WriteLine($"こんにちは、私は{age}歳の{Species}の{name}です");
        }
    }
    
    // 派生クラス：犬
    public class Dog : Animal
    {
        private string breed;
        
        public string Breed 
        { 
            get { return breed; }
            set { breed = value; }
        }
        
        // コンストラクタ（baseで基底クラスのコンストラクタを呼び出し）
        public Dog(string name, int age, string breed) : base(name, age)
        {
            this.breed = breed;
            Console.WriteLine($"犬種: {breed}");
        }
        
        // メソッドのオーバーライド
        public override void MakeSound()
        {
            Console.WriteLine($"{name}が「ワンワン！」と鳴いています");
        }
        
        public override void Move()
        {
            Console.WriteLine($"{name}が四つ足で駆け回っています");
        }
        
        public override string Species => "犬";
        
        // 犬特有のメソッド
        public void Fetch(string item)
        {
            Console.WriteLine($"{name}が{item}を取ってきました");
        }
        
        public void WagTail()
        {
            Console.WriteLine($"{name}が嬉しそうに尻尾を振っています");
        }
        
        // baseキーワードを使って基底クラスのメソッドを呼び出し
        public override void Introduce()
        {
            base.Introduce(); // 基底クラスの実装を呼び出し
            Console.WriteLine($"犬種は{breed}です。よろしくお願いします！");
        }
    }
    
    // 派生クラス：猫
    public class Cat : Animal
    {
        private bool isIndoor;
        
        public bool IsIndoor 
        { 
            get { return isIndoor; }
            set { isIndoor = value; }
        }
        
        public Cat(string name, int age, bool isIndoor = true) : base(name, age)
        {
            this.isIndoor = isIndoor;
            Console.WriteLine($"室内飼い: {(isIndoor ? "はい" : "いいえ")}");
        }
        
        public override void MakeSound()
        {
            Console.WriteLine($"{name}が「ニャーニャー」と鳴いています");
        }
        
        public override void Move()
        {
            Console.WriteLine($"{name}がしなやかに歩いています");
        }
        
        public override string Species => "猫";
        
        // 猫特有のメソッド
        public void Purr()
        {
            Console.WriteLine($"{name}が喉を鳴らしています「ゴロゴロ...」");
        }
        
        public void ClimbTree()
        {
            if (!isIndoor)
            {
                Console.WriteLine($"{name}が木に登っています");
            }
            else
            {
                Console.WriteLine($"{name}は室内飼いなので木に登れません");
            }
        }
        
        public override void Introduce()
        {
            base.Introduce();
            Console.WriteLine($"{(isIndoor ? "室内" : "外")}で暮らしています");
        }
    }
    
    // 派生クラス：鳥
    public class Bird : Animal
    {
        private bool canFly;
        
        public bool CanFly 
        { 
            get { return canFly; }
            set { canFly = value; }
        }
        
        public Bird(string name, int age, bool canFly = true) : base(name, age)
        {
            this.canFly = canFly;
            Console.WriteLine($"飛行能力: {(canFly ? "あり" : "なし")}");
        }
        
        public override void MakeSound()
        {
            Console.WriteLine($"{name}が「チュンチュン」とさえずっています");
        }
        
        public override void Move()
        {
            if (canFly)
            {
                Console.WriteLine($"{name}が空を飛んでいます");
            }
            else
            {
                Console.WriteLine($"{name}が地面を歩いています");
            }
        }
        
        public override string Species => "鳥";
        
        public void Fly()
        {
            if (canFly)
            {
                Console.WriteLine($"{name}が羽ばたいて飛び立ちました");
            }
            else
            {
                Console.WriteLine($"{name}は飛ぶことができません");
            }
        }
    }
    
    class Program
    {
        static void Main(string[] args)
        {
            // 様々な動物のインスタンスを作成
            Console.WriteLine("=== 動物園へようこそ ===\n");
            
            Dog dog = new Dog("ポチ", 3, "柴犬");
            Cat cat = new Cat("ミケ", 2, true);
            Bird bird = new Bird("ピヨ", 1, true);
            
            Console.WriteLine("\n=== 自己紹介タイム ===");
            dog.Introduce();
            Console.WriteLine();
            cat.Introduce();
            Console.WriteLine();
            bird.Introduce();
            
            Console.WriteLine("\n=== 鳴き声タイム ===");
            dog.MakeSound();
            cat.MakeSound();
            bird.MakeSound();
            
            Console.WriteLine("\n=== 移動タイム ===");
            dog.Move();
            cat.Move();
            bird.Move();
            
            Console.WriteLine("\n=== 特技タイム ===");
            dog.Fetch("ボール");
            dog.WagTail();
            
            cat.Purr();
            cat.ClimbTree();
            
            bird.Fly();
            
            Console.WriteLine("\n=== お食事タイム ===");
            dog.Eat("ドッグフード");
            cat.Eat("キャットフード");
            bird.Eat("鳥の餌");
            
            Console.WriteLine("\n=== お昼寝タイム ===");
            dog.Sleep();
            cat.Sleep();
            bird.Sleep();
        }
    }
}`,
      language: 'csharp',
      description: '基本的な継承の実装例。Animal基底クラスから Dog、Cat、Bird クラスを派生させ、メソッドのオーバーライドと base キーワードの使用方法を示しています。'
    },
    {
      id: 'abstract-classes-polymorphism',
      title: '抽象クラスとポリモーフィズム',
      code: `using System;
using System.Collections.Generic;

namespace AbstractClassesPolymorphism
{
    // 抽象基底クラス：図形
    public abstract class Shape
    {
        protected string color;
        protected DateTime createdTime;
        
        public string Color 
        { 
            get { return color; }
            set { color = value; }
        }
        
        public DateTime CreatedTime 
        { 
            get { return createdTime; }
        }
        
        // コンストラクタ
        protected Shape(string color)
        {
            this.color = color;
            this.createdTime = DateTime.Now;
        }
        
        // 抽象メソッド（派生クラスで必ず実装）
        public abstract double CalculateArea();
        public abstract double CalculatePerimeter();
        public abstract void Draw();
        
        // 仮想メソッド（オーバーライド可能）
        public virtual void DisplayInfo()
        {
            Console.WriteLine($"図形: {GetType().Name}");
            Console.WriteLine($"色: {color}");
            Console.WriteLine($"面積: {CalculateArea():F2}");
            Console.WriteLine($"周囲: {CalculatePerimeter():F2}");
            Console.WriteLine($"作成時刻: {createdTime:yyyy/MM/dd HH:mm:ss}");
        }
        
        // 通常のメソッド
        public void ChangeColor(string newColor)
        {
            string oldColor = color;
            color = newColor;
            Console.WriteLine($"色を{oldColor}から{newColor}に変更しました");
        }
        
        // 静的メソッド
        public static void CompareAreas(Shape shape1, Shape shape2)
        {
            double area1 = shape1.CalculateArea();
            double area2 = shape2.CalculateArea();
            
            if (area1 > area2)
            {
                Console.WriteLine($"{shape1.GetType().Name}の方が{shape2.GetType().Name}より大きいです");
            }
            else if (area1 < area2)
            {
                Console.WriteLine($"{shape2.GetType().Name}の方が{shape1.GetType().Name}より大きいです");
            }
            else
            {
                Console.WriteLine("両方の図形は同じ大きさです");
            }
        }
    }
    
    // 派生クラス：円
    public class Circle : Shape
    {
        private double radius;
        
        public double Radius 
        { 
            get { return radius; }
            set { radius = Math.Max(0, value); }
        }
        
        public Circle(string color, double radius) : base(color)
        {
            this.radius = radius;
        }
        
        public override double CalculateArea()
        {
            return Math.PI * radius * radius;
        }
        
        public override double CalculatePerimeter()
        {
            return 2 * Math.PI * radius;
        }
        
        public override void Draw()
        {
            Console.WriteLine($"半径{radius}の{color}の円を描きました ○");
        }
        
        // 円特有のメソッド
        public double GetDiameter()
        {
            return radius * 2;
        }
    }
    
    // 派生クラス：長方形
    public class Rectangle : Shape
    {
        private double width;
        private double height;
        
        public double Width 
        { 
            get { return width; }
            set { width = Math.Max(0, value); }
        }
        
        public double Height 
        { 
            get { return height; }
            set { height = Math.Max(0, value); }
        }
        
        public Rectangle(string color, double width, double height) : base(color)
        {
            this.width = width;
            this.height = height;
        }
        
        public override double CalculateArea()
        {
            return width * height;
        }
        
        public override double CalculatePerimeter()
        {
            return 2 * (width + height);
        }
        
        public override void Draw()
        {
            Console.WriteLine($"{width}×{height}の{color}の長方形を描きました ▭");
        }
        
        // 長方形特有のメソッド
        public bool IsSquare()
        {
            return Math.Abs(width - height) < 0.001;
        }
        
        public override void DisplayInfo()
        {
            base.DisplayInfo();
            Console.WriteLine($"幅: {width}, 高さ: {height}");
            Console.WriteLine($"正方形: {(IsSquare() ? "はい" : "いいえ")}");
        }
    }
    
    // 派生クラス：三角形
    public class Triangle : Shape
    {
        private double baseLength;
        private double height;
        private double side1, side2;
        
        public double BaseLength 
        { 
            get { return baseLength; }
            set { baseLength = Math.Max(0, value); }
        }
        
        public double Height 
        { 
            get { return height; }
            set { height = Math.Max(0, value); }
        }
        
        public Triangle(string color, double baseLength, double height, double side1, double side2) : base(color)
        {
            this.baseLength = baseLength;
            this.height = height;
            this.side1 = side1;
            this.side2 = side2;
        }
        
        public override double CalculateArea()
        {
            return 0.5 * baseLength * height;
        }
        
        public override double CalculatePerimeter()
        {
            return baseLength + side1 + side2;
        }
        
        public override void Draw()
        {
            Console.WriteLine($"底辺{baseLength}、高さ{height}の{color}の三角形を描きました △");
        }
        
        public string GetTriangleType()
        {
            if (Math.Abs(baseLength - side1) < 0.001 && Math.Abs(side1 - side2) < 0.001)
                return "正三角形";
            else if (Math.Abs(baseLength - side1) < 0.001 || Math.Abs(side1 - side2) < 0.001 || Math.Abs(baseLength - side2) < 0.001)
                return "二等辺三角形";
            else
                return "不等辺三角形";
        }
        
        public override void DisplayInfo()
        {
            base.DisplayInfo();
            Console.WriteLine($"底辺: {baseLength}, 高さ: {height}");
            Console.WriteLine($"種類: {GetTriangleType()}");
        }
    }
    
    // 図形管理クラス
    public class ShapeManager
    {
        private List<Shape> shapes;
        
        public ShapeManager()
        {
            shapes = new List<Shape>();
        }
        
        public void AddShape(Shape shape)
        {
            shapes.Add(shape);
            Console.WriteLine($"{shape.GetType().Name}を追加しました");
        }
        
        public void DrawAllShapes()
        {
            Console.WriteLine("\n=== 全ての図形を描画 ===");
            foreach (Shape shape in shapes)
            {
                shape.Draw(); // ポリモーフィズム
            }
        }
        
        public void DisplayAllInfo()
        {
            Console.WriteLine("\n=== 全ての図形の情報 ===");
            for (int i = 0; i < shapes.Count; i++)
            {
                Console.WriteLine($"\n[図形 {i + 1}]");
                shapes[i].DisplayInfo(); // ポリモーフィズム
            }
        }
        
        public void CalculateTotalArea()
        {
            double totalArea = 0;
            foreach (Shape shape in shapes)
            {
                totalArea += shape.CalculateArea(); // ポリモーフィズム
            }
            Console.WriteLine($"\n全図形の合計面積: {totalArea:F2}");
        }
        
        public void FindLargestShape()
        {
            if (shapes.Count == 0) return;
            
            Shape largest = shapes[0];
            foreach (Shape shape in shapes)
            {
                if (shape.CalculateArea() > largest.CalculateArea())
                {
                    largest = shape;
                }
            }
            
            Console.WriteLine($"\n最大の図形: {largest.GetType().Name} (面積: {largest.CalculateArea():F2})");
        }
    }
    
    class Program
    {
        static void Main(string[] args)
        {
            // 図形管理システムのデモ
            ShapeManager manager = new ShapeManager();
            
            // 様々な図形を作成
            Circle circle = new Circle("赤", 5.0);
            Rectangle rectangle = new Rectangle("青", 4.0, 6.0);
            Rectangle square = new Rectangle("緑", 5.0, 5.0);
            Triangle triangle = new Triangle("黄", 6.0, 4.0, 5.0, 5.0);
            
            // 図形を管理システムに追加
            manager.AddShape(circle);
            manager.AddShape(rectangle);
            manager.AddShape(square);
            manager.AddShape(triangle);
            
            // ポリモーフィズムのデモ
            manager.DrawAllShapes();
            manager.DisplayAllInfo();
            manager.CalculateTotalArea();
            manager.FindLargestShape();
            
            // 図形の比較
            Console.WriteLine("\n=== 図形の比較 ===");
            Shape.CompareAreas(circle, rectangle);
            Shape.CompareAreas(rectangle, square);
            
            // 型チェックとキャスト
            Console.WriteLine("\n=== 型チェックとキャスト ===");
            Shape[] shapes = { circle, rectangle, triangle };
            
            foreach (Shape shape in shapes)
            {
                // is演算子でのチェック
                if (shape is Circle c)
                {
                    Console.WriteLine($"円の直径: {c.GetDiameter()}");
                }
                else if (shape is Rectangle r)
                {
                    Console.WriteLine($"長方形は正方形？ {r.IsSquare()}");
                }
                else if (shape is Triangle t)
                {
                    Console.WriteLine($"三角形の種類: {t.GetTriangleType()}");
                }
            }
        }
    }
}`,
      language: 'csharp',
      description: '抽象クラスとポリモーフィズムの実践例。Shape抽象クラスから様々な図形クラスを派生させ、ポリモーフィズムを活用した図形管理システムを実装しています。'
    },
    {
      id: 'employee-hierarchy-system',
      title: '従業員階層システム',
      code: `using System;
using System.Collections.Generic;

namespace EmployeeHierarchySystem
{
    // 抽象基底クラス：従業員
    public abstract class Employee
    {
        protected int employeeId;
        protected string name;
        protected DateTime hireDate;
        protected decimal baseSalary;
        
        public int EmployeeId { get { return employeeId; } }
        public string Name { get { return name; } }
        public DateTime HireDate { get { return hireDate; } }
        public decimal BaseSalary { get { return baseSalary; } }
        
        // 勤続年数の計算
        public int YearsOfService 
        { 
            get { return DateTime.Now.Year - hireDate.Year; } 
        }
        
        protected Employee(int id, string name, DateTime hireDate, decimal baseSalary)
        {
            this.employeeId = id;
            this.name = name;
            this.hireDate = hireDate;
            this.baseSalary = baseSalary;
        }
        
        // 抽象メソッド（各職種で異なる実装）
        public abstract decimal CalculateSalary();
        public abstract string GetJobTitle();
        public abstract void PerformWork();
        
        // 仮想メソッド（オーバーライド可能）
        public virtual void DisplayInfo()
        {
            Console.WriteLine($"ID: {employeeId}");
            Console.WriteLine($"名前: {name}");
            Console.WriteLine($"職種: {GetJobTitle()}");
            Console.WriteLine($"入社日: {hireDate:yyyy/MM/dd}");
            Console.WriteLine($"勤続年数: {YearsOfService}年");
            Console.WriteLine($"基本給: {baseSalary:C}");
            Console.WriteLine($"総給与: {CalculateSalary():C}");
        }
        
        // 通常のメソッド
        public void TakeBreak()
        {
            Console.WriteLine($"{name}が休憩を取っています");
        }
        
        public void AttendMeeting(string meetingTitle)
        {
            Console.WriteLine($"{name}が「{meetingTitle}」会議に参加しています");
        }
    }
    
    // 派生クラス：正社員
    public class FullTimeEmployee : Employee
    {
        private decimal bonus;
        private int vacationDays;
        
        public decimal Bonus 
        { 
            get { return bonus; }
            set { bonus = Math.Max(0, value); }
        }
        
        public int VacationDays 
        { 
            get { return vacationDays; }
            set { vacationDays = Math.Max(0, value); }
        }
        
        public FullTimeEmployee(int id, string name, DateTime hireDate, decimal baseSalary, decimal bonus) 
            : base(id, name, hireDate, baseSalary)
        {
            this.bonus = bonus;
            this.vacationDays = 20; // デフォルト20日
        }
        
        public override decimal CalculateSalary()
        {
            // 基本給 + ボーナス + 勤続年数ボーナス
            decimal serviceBonus = YearsOfService * 5000;
            return baseSalary + bonus + serviceBonus;
        }
        
        public override string GetJobTitle()
        {
            return "正社員";
        }
        
        public override void PerformWork()
        {
            Console.WriteLine($"{name}が正社員として通常業務を行っています");
        }
        
        public void TakeVacation(int days)
        {
            if (days <= vacationDays)
            {
                vacationDays -= days;
                Console.WriteLine($"{name}が{days}日間の有給休暇を取得しました（残り{vacationDays}日）");
            }
            else
            {
                Console.WriteLine($"有給休暇が不足しています（残り{vacationDays}日）");
            }
        }
        
        public override void DisplayInfo()
        {
            base.DisplayInfo();
            Console.WriteLine($"ボーナス: {bonus:C}");
            Console.WriteLine($"有給残日数: {vacationDays}日");
        }
    }
    
    // 派生クラス：契約社員
    public class ContractEmployee : Employee
    {
        private DateTime contractEndDate;
        private decimal hourlyRate;
        private int hoursWorked;
        
        public DateTime ContractEndDate { get { return contractEndDate; } }
        public decimal HourlyRate { get { return hourlyRate; } }
        public int HoursWorked 
        { 
            get { return hoursWorked; }
            set { hoursWorked = Math.Max(0, value); }
        }
        
        public ContractEmployee(int id, string name, DateTime hireDate, decimal hourlyRate, DateTime contractEndDate) 
            : base(id, name, hireDate, 0) // 基本給は0
        {
            this.hourlyRate = hourlyRate;
            this.contractEndDate = contractEndDate;
            this.hoursWorked = 0;
        }
        
        public override decimal CalculateSalary()
        {
            return hourlyRate * hoursWorked;
        }
        
        public override string GetJobTitle()
        {
            return "契約社員";
        }
        
        public override void PerformWork()
        {
            Console.WriteLine($"{name}が契約社員として時間給業務を行っています");
        }
        
        public void LogWorkHours(int hours)
        {
            hoursWorked += hours;
            Console.WriteLine($"{name}の労働時間を{hours}時間追加しました（合計: {hoursWorked}時間）");
        }
        
        public bool IsContractActive()
        {
            return DateTime.Now <= contractEndDate;
        }
        
        public void ExtendContract(DateTime newEndDate)
        {
            if (newEndDate > contractEndDate)
            {
                contractEndDate = newEndDate;
                Console.WriteLine($"{name}の契約を{newEndDate:yyyy/MM/dd}まで延長しました");
            }
        }
        
        public override void DisplayInfo()
        {
            base.DisplayInfo();
            Console.WriteLine($"時給: {hourlyRate:C}");
            Console.WriteLine($"労働時間: {hoursWorked}時間");
            Console.WriteLine($"契約終了日: {contractEndDate:yyyy/MM/dd}");
            Console.WriteLine($"契約状態: {(IsContractActive() ? "有効" : "期限切れ")}");
        }
    }
    
    // 派生クラス：管理職
    public class Manager : FullTimeEmployee
    {
        private List<Employee> subordinates;
        private decimal managementAllowance;
        
        public decimal ManagementAllowance 
        { 
            get { return managementAllowance; }
            set { managementAllowance = Math.Max(0, value); }
        }
        
        public int TeamSize { get { return subordinates.Count; } }
        
        public Manager(int id, string name, DateTime hireDate, decimal baseSalary, decimal bonus, decimal managementAllowance) 
            : base(id, name, hireDate, baseSalary, bonus)
        {
            this.managementAllowance = managementAllowance;
            this.subordinates = new List<Employee>();
        }
        
        public override decimal CalculateSalary()
        {
            // 正社員の給与 + 管理職手当 + チーム人数ボーナス
            decimal teamBonus = subordinates.Count * 2000;
            return base.CalculateSalary() + managementAllowance + teamBonus;
        }
        
        public override string GetJobTitle()
        {
            return "管理職";
        }
        
        public override void PerformWork()
        {
            Console.WriteLine($"{name}が管理職としてチーム運営を行っています");
        }
        
        public void AddSubordinate(Employee employee)
        {
            if (!subordinates.Contains(employee))
            {
                subordinates.Add(employee);
                Console.WriteLine($"{employee.Name}を{name}のチームに追加しました");
            }
        }
        
        public void RemoveSubordinate(Employee employee)
        {
            if (subordinates.Remove(employee))
            {
                Console.WriteLine($"{employee.Name}を{name}のチームから削除しました");
            }
        }
        
        public void ConductTeamMeeting()
        {
            Console.WriteLine($"{name}がチーム会議を開催しています");
            foreach (Employee subordinate in subordinates)
            {
                subordinate.AttendMeeting("チーム会議");
            }
        }
        
        public void EvaluateTeam()
        {
            Console.WriteLine($"\n{name}によるチーム評価:");
            foreach (Employee subordinate in subordinates)
            {
                Console.WriteLine($"- {subordinate.Name}（{subordinate.GetJobTitle()}）: 勤続{subordinate.YearsOfService}年");
            }
        }
        
        public override void DisplayInfo()
        {
            base.DisplayInfo();
            Console.WriteLine($"管理職手当: {managementAllowance:C}");
            Console.WriteLine($"チーム人数: {TeamSize}人");
        }
    }
    
    // 人事管理システム
    public class HRSystem
    {
        private List<Employee> employees;
        
        public HRSystem()
        {
            employees = new List<Employee>();
        }
        
        public void HireEmployee(Employee employee)
        {
            employees.Add(employee);
            Console.WriteLine($"{employee.Name}を{employee.GetJobTitle()}として採用しました");
        }
        
        public void DisplayAllEmployees()
        {
            Console.WriteLine("\n=== 全従業員一覧 ===");
            foreach (Employee employee in employees)
            {
                Console.WriteLine($"\n[従業員ID: {employee.EmployeeId}]");
                employee.DisplayInfo();
                Console.WriteLine(new string('-', 40));
            }
        }
        
        public void CalculatePayroll()
        {
            Console.WriteLine("\n=== 給与計算 ===");
            decimal totalPayroll = 0;
            
            foreach (Employee employee in employees)
            {
                decimal salary = employee.CalculateSalary();
                totalPayroll += salary;
                Console.WriteLine($"{employee.Name}（{employee.GetJobTitle()}）: {salary:C}");
            }
            
            Console.WriteLine($"\n総給与支払額: {totalPayroll:C}");
        }
        
        public void SimulateWorkDay()
        {
            Console.WriteLine("\n=== 業務シミュレーション ===");
            foreach (Employee employee in employees)
            {
                employee.PerformWork(); // ポリモーフィズム
            }
        }
    }
    
    class Program
    {
        static void Main(string[] args)
        {
            // HR システムの作成
            HRSystem hr = new HRSystem();
            
            // 従業員の作成
            FullTimeEmployee alice = new FullTimeEmployee(1, "田中愛子", new DateTime(2020, 4, 1), 300000, 50000);
            ContractEmployee bob = new ContractEmployee(2, "鈴木太郎", new DateTime(2023, 1, 15), 2500, new DateTime(2024, 12, 31));
            Manager charlie = new Manager(3, "山田部長", new DateTime(2015, 4, 1), 400000, 100000, 80000);
            FullTimeEmployee diana = new FullTimeEmployee(4, "佐藤花子", new DateTime(2021, 7, 1), 280000, 40000);
            
            // 従業員を雇用
            hr.HireEmployee(alice);
            hr.HireEmployee(bob);
            hr.HireEmployee(charlie);
            hr.HireEmployee(diana);
            
            // マネージャーのチーム編成
            charlie.AddSubordinate(alice);
            charlie.AddSubordinate(bob);
            charlie.AddSubordinate(diana);
            
            // 契約社員の労働時間記録
            bob.LogWorkHours(160); // 月160時間
            
            // 全従業員情報表示
            hr.DisplayAllEmployees();
            
            // 給与計算
            hr.CalculatePayroll();
            
            // 業務シミュレーション
            hr.SimulateWorkDay();
            
            // 管理職特有の業務
            Console.WriteLine("\n=== 管理職業務 ===");
            charlie.ConductTeamMeeting();
            charlie.EvaluateTeam();
            
            // 有給取得
            Console.WriteLine("\n=== 有給休暇 ===");
            alice.TakeVacation(5);
        }
    }
}`,
      language: 'csharp',
      description: '従業員管理システムを通じた継承とポリモーフィズムの実践例。Employee抽象クラスから様々な職種のクラスを派生させ、人事システムを実装しています。'
    }
  ],
  exercises: [
    {
      id: 'vehicle-inheritance-exercise',
      title: '乗り物の継承システム',
      description: 'Vehicle基底クラスから Car、Motorcycle、Truck の派生クラスを作成してください。各乗り物の特有の機能（燃費計算、積載量チェックなど）を実装し、ポリモーフィズムを活用したガレージ管理システムを作成してください。',
      starterCode: `using System;
using System.Collections.Generic;

namespace VehicleInheritance
{
    // Vehicle基底クラスを作成してください
    // 必要なメンバー:
    // - 製造年、メーカー、モデル、燃料タンク容量
    // - 抽象メソッド: CalculateFuelEfficiency(), Start(), Stop()
    // - 仮想メソッド: DisplayInfo()
    
    // Car派生クラス
    // - ドア数、エアコンの有無
    // - 燃費計算（都市部/高速道路）
    
    // Motorcycle派生クラス
    // - エンジン排気量
    // - 高い燃費性能
    
    // Truck派生クラス
    // - 最大積載量
    // - 現在の積載重量
    // - 燃費は積載量に依存
    
    class Program
    {
        static void Main(string[] args)
        {
            // ガレージ管理システムのテスト
            // List<Vehicle>を使ってポリモーフィズムを実証
        }
    }
}`,
      hints: [
        'Vehicle抽象クラスで共通の燃料管理機能を実装',
        '各派生クラスで異なる燃費計算ロジック',
        'Truck クラスでは積載量が燃費に影響',
        'List<Vehicle>でポリモーフィズムを活用'
      ],
      solution: `// Vehicle 抽象基底クラス
public abstract class Vehicle
{
    protected string manufacturer;
    protected string model;
    protected int year;
    protected double fuelCapacity;
    protected double currentFuel;
    protected bool isRunning;
    
    public string Manufacturer { get { return manufacturer; } }
    public string Model { get { return model; } }
    public int Year { get { return year; } }
    public double FuelCapacity { get { return fuelCapacity; } }
    public double CurrentFuel { get { return currentFuel; } }
    public bool IsRunning { get { return isRunning; } }
    
    protected Vehicle(string manufacturer, string model, int year, double fuelCapacity)
    {
        this.manufacturer = manufacturer;
        this.model = model;
        this.year = year;
        this.fuelCapacity = fuelCapacity;
        this.currentFuel = fuelCapacity; // 満タンでスタート
        this.isRunning = false;
    }
    
    // 抽象メソッド
    public abstract double CalculateFuelEfficiency();
    public abstract void Start();
    public abstract void Stop();
    
    // 仮想メソッド
    public virtual void DisplayInfo()
    {
        Console.WriteLine($"メーカー: {manufacturer}");
        Console.WriteLine($"モデル: {model}");
        Console.WriteLine($"年式: {year}");
        Console.WriteLine($"燃料: {currentFuel:F1}L / {fuelCapacity}L");
        Console.WriteLine($"燃費: {CalculateFuelEfficiency():F1}km/L");
        Console.WriteLine($"エンジン: {(isRunning ? "稼働中" : "停止中")}");
    }
    
    // 共通メソッド
    public void Refuel(double amount)
    {
        double maxRefuel = fuelCapacity - currentFuel;
        double actualRefuel = Math.Min(amount, maxRefuel);
        currentFuel += actualRefuel;
        Console.WriteLine($"{actualRefuel:F1}L給油しました（残り{currentFuel:F1}L）");
    }
    
    public bool Drive(double distance)
    {
        if (!isRunning)
        {
            Console.WriteLine("エンジンを始動してください");
            return false;
        }
        
        double fuelNeeded = distance / CalculateFuelEfficiency();
        if (fuelNeeded > currentFuel)
        {
            Console.WriteLine($"燃料不足です（必要: {fuelNeeded:F1}L, 残り: {currentFuel:F1}L）");
            return false;
        }
        
        currentFuel -= fuelNeeded;
        Console.WriteLine($"{distance}km走行しました（燃料残り: {currentFuel:F1}L）");
        return true;
    }
}

// Car 派生クラス
public class Car : Vehicle
{
    private int doors;
    private bool hasAirConditioning;
    
    public int Doors { get { return doors; } }
    public bool HasAirConditioning { get { return hasAirConditioning; } }
    
    public Car(string manufacturer, string model, int year, double fuelCapacity, int doors, bool hasAirConditioning)
        : base(manufacturer, model, year, fuelCapacity)
    {
        this.doors = doors;
        this.hasAirConditioning = hasAirConditioning;
    }
    
    public override double CalculateFuelEfficiency()
    {
        // 基本燃費15km/L、エアコン使用で10%減
        double efficiency = 15.0;
        if (hasAirConditioning)
        {
            efficiency *= 0.9;
        }
        return efficiency;
    }
    
    public override void Start()
    {
        if (!isRunning)
        {
            isRunning = true;
            Console.WriteLine($"{manufacturer} {model}のエンジンを始動しました");
            if (hasAirConditioning)
            {
                Console.WriteLine("エアコンが利用可能です");
            }
        }
        else
        {
            Console.WriteLine("エンジンは既に稼働中です");
        }
    }
    
    public override void Stop()
    {
        if (isRunning)
        {
            isRunning = false;
            Console.WriteLine($"{manufacturer} {model}のエンジンを停止しました");
        }
        else
        {
            Console.WriteLine("エンジンは既に停止中です");
        }
    }
    
    public void UseAirConditioning()
    {
        if (hasAirConditioning && isRunning)
        {
            Console.WriteLine("エアコンを作動させました");
        }
        else if (!hasAirConditioning)
        {
            Console.WriteLine("この車にはエアコンがありません");
        }
        else
        {
            Console.WriteLine("エンジンを始動してください");
        }
    }
    
    public override void DisplayInfo()
    {
        Console.WriteLine($"=== 乗用車: {manufacturer} {model} ===");
        base.DisplayInfo();
        Console.WriteLine($"ドア数: {doors}");
        Console.WriteLine($"エアコン: {(hasAirConditioning ? "あり" : "なし")}");
    }
}

// Motorcycle 派生クラス
public class Motorcycle : Vehicle
{
    private int engineDisplacement;
    
    public int EngineDisplacement { get { return engineDisplacement; } }
    
    public Motorcycle(string manufacturer, string model, int year, double fuelCapacity, int engineDisplacement)
        : base(manufacturer, model, year, fuelCapacity)
    {
        this.engineDisplacement = engineDisplacement;
    }
    
    public override double CalculateFuelEfficiency()
    {
        // 排気量に基づく燃費計算（小排気量ほど高燃費）
        if (engineDisplacement <= 125)
            return 45.0;
        else if (engineDisplacement <= 250)
            return 35.0;
        else if (engineDisplacement <= 400)
            return 25.0;
        else
            return 20.0;
    }
    
    public override void Start()
    {
        if (!isRunning)
        {
            isRunning = true;
            Console.WriteLine($"{manufacturer} {model}（{engineDisplacement}cc）のエンジンを始動しました");
            Console.WriteLine("ライディングギアの着用を確認してください");
        }
        else
        {
            Console.WriteLine("エンジンは既に稼働中です");
        }
    }
    
    public override void Stop()
    {
        if (isRunning)
        {
            isRunning = false;
            Console.WriteLine($"{manufacturer} {model}のエンジンを停止しました");
            Console.WriteLine("サイドスタンドを確認してください");
        }
        else
        {
            Console.WriteLine("エンジンは既に停止中です");
        }
    }
    
    public void PerformWheelieCheck()
    {
        if (isRunning && engineDisplacement >= 250)
        {
            Console.WriteLine("⚠️ このバイクはウィリー可能です。安全運転を心がけてください");
        }
        else if (engineDisplacement < 250)
        {
            Console.WriteLine("このバイクは初心者向けです");
        }
    }
    
    public override void DisplayInfo()
    {
        Console.WriteLine($"=== バイク: {manufacturer} {model} ===");
        base.DisplayInfo();
        Console.WriteLine($"排気量: {engineDisplacement}cc");
    }
}

// Truck 派生クラス
public class Truck : Vehicle
{
    private double maxLoadCapacity;
    private double currentLoad;
    
    public double MaxLoadCapacity { get { return maxLoadCapacity; } }
    public double CurrentLoad { get { return currentLoad; } }
    public double AvailableCapacity { get { return maxLoadCapacity - currentLoad; } }
    
    public Truck(string manufacturer, string model, int year, double fuelCapacity, double maxLoadCapacity)
        : base(manufacturer, model, year, fuelCapacity)
    {
        this.maxLoadCapacity = maxLoadCapacity;
        this.currentLoad = 0;
    }
    
    public override double CalculateFuelEfficiency()
    {
        // 基本燃費8km/L、積載率に応じて燃費が悪化
        double baseEfficiency = 8.0;
        double loadRatio = currentLoad / maxLoadCapacity;
        return baseEfficiency * (1.0 - loadRatio * 0.4); // 最大40%燃費悪化
    }
    
    public override void Start()
    {
        if (!isRunning)
        {
            isRunning = true;
            Console.WriteLine($"{manufacturer} {model}トラックのエンジンを始動しました");
            Console.WriteLine($"積載量: {currentLoad:F1}t / {maxLoadCapacity:F1}t");
            
            if (currentLoad > maxLoadCapacity * 0.8)
            {
                Console.WriteLine("⚠️ 重量積載時のため、慎重な運転をお願いします");
            }
        }
        else
        {
            Console.WriteLine("エンジンは既に稼働中です");
        }
    }
    
    public override void Stop()
    {
        if (isRunning)
        {
            isRunning = false;
            Console.WriteLine($"{manufacturer} {model}トラックのエンジンを停止しました");
        }
        else
        {
            Console.WriteLine("エンジンは既に停止中です");
        }
    }
    
    public bool LoadCargo(double weight)
    {
        if (weight <= 0)
        {
            Console.WriteLine("積載重量は正の値である必要があります");
            return false;
        }
        
        if (currentLoad + weight > maxLoadCapacity)
        {
            Console.WriteLine($"積載容量を超過します（利用可能: {AvailableCapacity:F1}t）");
            return false;
        }
        
        currentLoad += weight;
        Console.WriteLine($"{weight:F1}tを積載しました（合計: {currentLoad:F1}t）");
        return true;
    }
    
    public bool UnloadCargo(double weight)
    {
        if (weight <= 0)
        {
            Console.WriteLine("降ろす重量は正の値である必要があります");
            return false;
        }
        
        if (weight > currentLoad)
        {
            Console.WriteLine($"現在の積載量（{currentLoad:F1}t）を超える重量は降ろせません");
            return false;
        }
        
        currentLoad -= weight;
        Console.WriteLine($"{weight:F1}tを降ろしました（残り: {currentLoad:F1}t）");
        return true;
    }
    
    public override void DisplayInfo()
    {
        Console.WriteLine($"=== トラック: {manufacturer} {model} ===");
        base.DisplayInfo();
        Console.WriteLine($"最大積載量: {maxLoadCapacity:F1}t");
        Console.WriteLine($"現在積載量: {currentLoad:F1}t");
        Console.WriteLine($"利用可能容量: {AvailableCapacity:F1}t");
        Console.WriteLine($"積載率: {(currentLoad / maxLoadCapacity * 100):F1}%");
    }
}

// ガレージ管理システム
public class Garage
{
    private List<Vehicle> vehicles;
    
    public Garage()
    {
        vehicles = new List<Vehicle>();
    }
    
    public void AddVehicle(Vehicle vehicle)
    {
        vehicles.Add(vehicle);
        Console.WriteLine($"{vehicle.Manufacturer} {vehicle.Model}をガレージに追加しました");
    }
    
    public void DisplayAllVehicles()
    {
        Console.WriteLine("\n=== ガレージ内の全車両 ===");
        for (int i = 0; i < vehicles.Count; i++)
        {
            Console.WriteLine($"\n[車両 {i + 1}]");
            vehicles[i].DisplayInfo(); // ポリモーフィズム
        }
    }
    
    public void StartAllVehicles()
    {
        Console.WriteLine("\n=== 全車両エンジン始動 ===");
        foreach (Vehicle vehicle in vehicles)
        {
            vehicle.Start(); // ポリモーフィズム
        }
    }
    
    public void CalculateFleetFuelEfficiency()
    {
        Console.WriteLine("\n=== 車隊燃費レポート ===");
        double totalEfficiency = 0;
        
        foreach (Vehicle vehicle in vehicles)
        {
            double efficiency = vehicle.CalculateFuelEfficiency(); // ポリモーフィズム
            totalEfficiency += efficiency;
            Console.WriteLine($"{vehicle.Manufacturer} {vehicle.Model}: {efficiency:F1}km/L");
        }
        
        double averageEfficiency = totalEfficiency / vehicles.Count;
        Console.WriteLine($"\n平均燃費: {averageEfficiency:F1}km/L");
    }
    
    public void RefuelAllVehicles()
    {
        Console.WriteLine("\n=== 全車両給油 ===");
        foreach (Vehicle vehicle in vehicles)
        {
            double needed = vehicle.FuelCapacity - vehicle.CurrentFuel;
            if (needed > 0)
            {
                vehicle.Refuel(needed);
            }
            else
            {
                Console.WriteLine($"{vehicle.Manufacturer} {vehicle.Model}は満タンです");
            }
        }
    }
}

// Main メソッド内のテストコード
Garage garage = new Garage();

// 車両の作成
Car sedan = new Car("トヨタ", "カムリ", 2022, 60, 4, true);
Motorcycle sportBike = new Motorcycle("ホンダ", "CBR600RR", 2023, 18, 600);
Truck deliveryTruck = new Truck("いすゞ", "エルフ", 2021, 100, 3.0);

// ガレージに追加
garage.AddVehicle(sedan);
garage.AddVehicle(sportBike);
garage.AddVehicle(deliveryTruck);

// 車両情報表示
garage.DisplayAllVehicles();

// エンジン始動
garage.StartAllVehicles();

// トラックに荷物を積載
Console.WriteLine("\n=== 荷物の積載 ===");
deliveryTruck.LoadCargo(1.5);
deliveryTruck.LoadCargo(1.0);

// 燃費レポート
garage.CalculateFleetFuelEfficiency();

// 走行テスト
Console.WriteLine("\n=== 走行テスト ===");
sedan.Drive(100);
sportBike.Drive(150);
deliveryTruck.Drive(80);

// 特有機能のテスト
Console.WriteLine("\n=== 特有機能テスト ===");
sedan.UseAirConditioning();
sportBike.PerformWheelieCheck();
deliveryTruck.UnloadCargo(0.5);

// 給油
garage.RefuelAllVehicles();`,
      difficulty: 'medium',
      estimatedTime: 30
    },
    {
      id: 'media-player-exercise',
      title: 'メディアプレイヤーシステム',
      description: 'Media抽象クラスから AudioFile、VideoFile、ImageFile の派生クラスを作成し、MediaPlayerクラスでポリモーフィズムを活用した統一的なメディア処理システムを実装してください。',
      starterCode: `using System;
using System.Collections.Generic;

namespace MediaPlayerSystem
{
    // Media抽象クラスを作成してください
    // 共通プロパティ: ファイル名、ファイルサイズ、作成日時
    // 抽象メソッド: Play(), GetDuration(), GetInfo()
    
    // AudioFile派生クラス
    // - アーティスト名、アルバム名、ビットレート
    // - 音声再生機能
    
    // VideoFile派生クラス  
    // - 解像度（幅×高さ）、フレームレート
    // - 動画再生機能
    
    // ImageFile派生クラス
    // - 解像度、色深度
    // - 画像表示機能
    
    // MediaPlayerクラス
    // - プレイリスト管理
    // - ランダム再生、順次再生
    
    class Program
    {
        static void Main(string[] args)
        {
            // メディアプレイヤーのテスト
        }
    }
}`,
      hints: [
        'Media抽象クラスで共通のファイル操作を実装',
        '各メディアタイプで異なる再生ロジック',
        'TimeSpanを使って再生時間を管理',
        'MediaPlayerでList<Media>を使用'
      ],
      solution: `// Media 抽象基底クラス
public abstract class Media
{
    protected string fileName;
    protected long fileSize;
    protected DateTime createdDate;
    protected bool isPlaying;
    
    public string FileName { get { return fileName; } }
    public long FileSize { get { return fileSize; } }
    public DateTime CreatedDate { get { return createdDate; } }
    public bool IsPlaying { get { return isPlaying; } }
    
    protected Media(string fileName, long fileSize)
    {
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.createdDate = DateTime.Now;
        this.isPlaying = false;
    }
    
    // 抽象メソッド
    public abstract void Play();
    public abstract void Stop();
    public abstract TimeSpan GetDuration();
    public abstract string GetMediaType();
    
    // 仮想メソッド
    public virtual void GetInfo()
    {
        Console.WriteLine($"ファイル名: {fileName}");
        Console.WriteLine($"ファイルサイズ: {fileSize / 1024.0 / 1024.0:F2} MB");
        Console.WriteLine($"メディアタイプ: {GetMediaType()}");
        Console.WriteLine($"再生時間: {GetDuration()}");
        Console.WriteLine($"作成日時: {createdDate:yyyy/MM/dd HH:mm:ss}");
        Console.WriteLine($"状態: {(isPlaying ? "再生中" : "停止中")}");
    }
    
    // 共通メソッド
    public void Pause()
    {
        if (isPlaying)
        {
            isPlaying = false;
            Console.WriteLine($"{fileName}を一時停止しました");
        }
        else
        {
            Console.WriteLine($"{fileName}は既に停止中です");
        }
    }
    
    public void Resume()
    {
        if (!isPlaying)
        {
            isPlaying = true;
            Console.WriteLine($"{fileName}の再生を再開しました");
        }
        else
        {
            Console.WriteLine($"{fileName}は既に再生中です");
        }
    }
}

// AudioFile 派生クラス
public class AudioFile : Media
{
    private string artist;
    private string album;
    private int bitrate;
    private TimeSpan duration;
    
    public string Artist { get { return artist; } }
    public string Album { get { return album; } }
    public int Bitrate { get { return bitrate; } }
    
    public AudioFile(string fileName, long fileSize, string artist, string album, int bitrate, TimeSpan duration)
        : base(fileName, fileSize)
    {
        this.artist = artist;
        this.album = album;
        this.bitrate = bitrate;
        this.duration = duration;
    }
    
    public override void Play()
    {
        if (!isPlaying)
        {
            isPlaying = true;
            Console.WriteLine($"🎵 音楽再生開始: {fileName}");
            Console.WriteLine($"   アーティスト: {artist}");
            Console.WriteLine($"   アルバム: {album}");
            Console.WriteLine($"   ♪♪♪ 音楽が流れています ♪♪♪");
        }
        else
        {
            Console.WriteLine($"{fileName}は既に再生中です");
        }
    }
    
    public override void Stop()
    {
        if (isPlaying)
        {
            isPlaying = false;
            Console.WriteLine($"🔇 音楽停止: {fileName}");
        }
        else
        {
            Console.WriteLine($"{fileName}は既に停止中です");
        }
    }
    
    public override TimeSpan GetDuration()
    {
        return duration;
    }
    
    public override string GetMediaType()
    {
        return "音楽ファイル";
    }
    
    public void ShowLyrics()
    {
        Console.WriteLine($"🎤 {fileName}の歌詞を表示しています...");
        Console.WriteLine("（歌詞データがロードされました）");
    }
    
    public void AdjustEqualizer(string preset)
    {
        Console.WriteLine($"🎛️ イコライザーを'{preset}'に設定しました");
    }
    
    public override void GetInfo()
    {
        base.GetInfo();
        Console.WriteLine($"アーティスト: {artist}");
        Console.WriteLine($"アルバム: {album}");
        Console.WriteLine($"ビットレート: {bitrate} kbps");
    }
}

// VideoFile 派生クラス
public class VideoFile : Media
{
    private int width;
    private int height;
    private double frameRate;
    private TimeSpan duration;
    private bool hasSubtitles;
    
    public int Width { get { return width; } }
    public int Height { get { return height; } }
    public double FrameRate { get { return frameRate; } }
    public bool HasSubtitles { get { return hasSubtitles; } }
    
    public VideoFile(string fileName, long fileSize, int width, int height, double frameRate, TimeSpan duration, bool hasSubtitles = false)
        : base(fileName, fileSize)
    {
        this.width = width;
        this.height = height;
        this.frameRate = frameRate;
        this.duration = duration;
        this.hasSubtitles = hasSubtitles;
    }
    
    public override void Play()
    {
        if (!isPlaying)
        {
            isPlaying = true;
            Console.WriteLine($"🎬 動画再生開始: {fileName}");
            Console.WriteLine($"   解像度: {width}×{height}");
            Console.WriteLine($"   フレームレート: {frameRate}fps");
            Console.WriteLine($"   📺 動画が再生されています 📺");
            
            if (hasSubtitles)
            {
                Console.WriteLine($"   📝 字幕が利用可能です");
            }
        }
        else
        {
            Console.WriteLine($"{fileName}は既に再生中です");
        }
    }
    
    public override void Stop()
    {
        if (isPlaying)
        {
            isPlaying = false;
            Console.WriteLine($"⏹️ 動画停止: {fileName}");
        }
        else
        {
            Console.WriteLine($"{fileName}は既に停止中です");
        }
    }
    
    public override TimeSpan GetDuration()
    {
        return duration;
    }
    
    public override string GetMediaType()
    {
        return "動画ファイル";
    }
    
    public void ToggleSubtitles()
    {
        if (hasSubtitles)
        {
            Console.WriteLine("📝 字幕の表示/非表示を切り替えました");
        }
        else
        {
            Console.WriteLine("このファイルには字幕がありません");
        }
    }
    
    public void ChangeQuality(string quality)
    {
        Console.WriteLine($"🔧 動画品質を'{quality}'に変更しました");
    }
    
    public override void GetInfo()
    {
        base.GetInfo();
        Console.WriteLine($"解像度: {width}×{height}");
        Console.WriteLine($"フレームレート: {frameRate}fps");
        Console.WriteLine($"字幕: {(hasSubtitles ? "あり" : "なし")}");
    }
}

// ImageFile 派生クラス
public class ImageFile : Media
{
    private int width;
    private int height;
    private int colorDepth;
    private TimeSpan displayDuration;
    
    public int Width { get { return width; } }
    public int Height { get { return height; } }
    public int ColorDepth { get { return colorDepth; } }
    
    public ImageFile(string fileName, long fileSize, int width, int height, int colorDepth, int displaySeconds = 3)
        : base(fileName, fileSize)
    {
        this.width = width;
        this.height = height;
        this.colorDepth = colorDepth;
        this.displayDuration = TimeSpan.FromSeconds(displaySeconds);
    }
    
    public override void Play()
    {
        if (!isPlaying)
        {
            isPlaying = true;
            Console.WriteLine($"🖼️ 画像表示開始: {fileName}");
            Console.WriteLine($"   解像度: {width}×{height}");
            Console.WriteLine($"   🌈 美しい画像が表示されています 🌈");
            
            // 自動的に指定時間後に停止
            System.Threading.Tasks.Task.Delay((int)displayDuration.TotalMilliseconds).ContinueWith(t => Stop());
        }
        else
        {
            Console.WriteLine($"{fileName}は既に表示中です");
        }
    }
    
    public override void Stop()
    {
        if (isPlaying)
        {
            isPlaying = false;
            Console.WriteLine($"🚫 画像表示終了: {fileName}");
        }
        else
        {
            Console.WriteLine($"{fileName}は既に非表示です");
        }
    }
    
    public override TimeSpan GetDuration()
    {
        return displayDuration;
    }
    
    public override string GetMediaType()
    {
        return "画像ファイル";
    }
    
    public void ZoomIn()
    {
        Console.WriteLine("🔍 画像をズームインしました");
    }
    
    public void ZoomOut()
    {
        Console.WriteLine("🔍 画像をズームアウトしました");
    }
    
    public void Rotate(int degrees)
    {
        Console.WriteLine($"🔄 画像を{degrees}度回転させました");
    }
    
    public override void GetInfo()
    {
        base.GetInfo();
        Console.WriteLine($"解像度: {width}×{height}");
        Console.WriteLine($"色深度: {colorDepth}bit");
        Console.WriteLine($"表示時間: {displayDuration.TotalSeconds}秒");
    }
}

// MediaPlayer クラス
public class MediaPlayer
{
    private List<Media> playlist;
    private int currentIndex;
    private bool isShuffleMode;
    private bool isRepeatMode;
    
    public int PlaylistCount { get { return playlist.Count; } }
    public bool IsShuffleMode { get { return isShuffleMode; } }
    public bool IsRepeatMode { get { return isRepeatMode; } }
    
    public MediaPlayer()
    {
        playlist = new List<Media>();
        currentIndex = -1;
        isShuffleMode = false;
        isRepeatMode = false;
    }
    
    public void AddMedia(Media media)
    {
        playlist.Add(media);
        Console.WriteLine($"プレイリストに追加: {media.FileName}");
        
        if (currentIndex == -1)
        {
            currentIndex = 0;
        }
    }
    
    public void RemoveMedia(int index)
    {
        if (index >= 0 && index < playlist.Count)
        {
            string fileName = playlist[index].FileName;
            playlist.RemoveAt(index);
            Console.WriteLine($"プレイリストから削除: {fileName}");
            
            if (currentIndex >= playlist.Count)
            {
                currentIndex = playlist.Count - 1;
            }
        }
    }
    
    public void PlayCurrent()
    {
        if (playlist.Count == 0)
        {
            Console.WriteLine("プレイリストが空です");
            return;
        }
        
        if (currentIndex >= 0 && currentIndex < playlist.Count)
        {
            playlist[currentIndex].Play(); // ポリモーフィズム
        }
    }
    
    public void StopCurrent()
    {
        if (currentIndex >= 0 && currentIndex < playlist.Count)
        {
            playlist[currentIndex].Stop(); // ポリモーフィズム
        }
    }
    
    public void NextTrack()
    {
        if (playlist.Count == 0) return;
        
        StopCurrent();
        
        if (isShuffleMode)
        {
            Random rand = new Random();
            currentIndex = rand.Next(playlist.Count);
        }
        else
        {
            currentIndex++;
            if (currentIndex >= playlist.Count)
            {
                if (isRepeatMode)
                {
                    currentIndex = 0;
                }
                else
                {
                    currentIndex = playlist.Count - 1;
                    Console.WriteLine("プレイリストの最後に到達しました");
                    return;
                }
            }
        }
        
        Console.WriteLine($"次のメディア: {playlist[currentIndex].FileName}");
        PlayCurrent();
    }
    
    public void PreviousTrack()
    {
        if (playlist.Count == 0) return;
        
        StopCurrent();
        
        if (isShuffleMode)
        {
            Random rand = new Random();
            currentIndex = rand.Next(playlist.Count);
        }
        else
        {
            currentIndex--;
            if (currentIndex < 0)
            {
                if (isRepeatMode)
                {
                    currentIndex = playlist.Count - 1;
                }
                else
                {
                    currentIndex = 0;
                    Console.WriteLine("プレイリストの最初に到達しました");
                    return;
                }
            }
        }
        
        Console.WriteLine($"前のメディア: {playlist[currentIndex].FileName}");
        PlayCurrent();
    }
    
    public void ToggleShuffle()
    {
        isShuffleMode = !isShuffleMode;
        Console.WriteLine($"シャッフルモード: {(isShuffleMode ? "ON" : "OFF")}");
    }
    
    public void ToggleRepeat()
    {
        isRepeatMode = !isRepeatMode;
        Console.WriteLine($"リピートモード: {(isRepeatMode ? "ON" : "OFF")}");
    }
    
    public void ShowPlaylist()
    {
        Console.WriteLine("\n=== プレイリスト ===");
        if (playlist.Count == 0)
        {
            Console.WriteLine("プレイリストが空です");
            return;
        }
        
        for (int i = 0; i < playlist.Count; i++)
        {
            string marker = (i == currentIndex) ? "► " : "  ";
            Media media = playlist[i];
            Console.WriteLine($"{marker}{i + 1}. {media.FileName} ({media.GetMediaType()}) - {media.GetDuration()}");
        }
        
        Console.WriteLine($"\nモード: シャッフル{(isShuffleMode ? "ON" : "OFF")}, リピート{(isRepeatMode ? "ON" : "OFF")}");
    }
    
    public void ShowCurrentMediaInfo()
    {
        if (currentIndex >= 0 && currentIndex < playlist.Count)
        {
            Console.WriteLine("\n=== 現在のメディア情報 ===");
            playlist[currentIndex].GetInfo(); // ポリモーフィズム
        }
        else
        {
            Console.WriteLine("再生中のメディアがありません");
        }
    }
    
    public void PlayAll()
    {
        Console.WriteLine("\n=== 全メディア連続再生 ===");
        foreach (Media media in playlist)
        {
            Console.WriteLine($"\n再生中: {media.FileName}");
            media.Play(); // ポリモーフィズム
            System.Threading.Thread.Sleep(1000); // 1秒待機（デモ用）
            media.Stop();
        }
        Console.WriteLine("全メディアの再生が完了しました");
    }
}

// Main メソッド内のテストコード
MediaPlayer player = new MediaPlayer();

// 様々なメディアファイルを作成
AudioFile song1 = new AudioFile("夏の思い出.mp3", 8 * 1024 * 1024, "山田太郎", "青春アルバム", 320, TimeSpan.FromMinutes(4.5));
AudioFile song2 = new AudioFile("雨の日の歌.mp3", 6 * 1024 * 1024, "鈴木花子", "季節の詩", 256, TimeSpan.FromMinutes(3.2));

VideoFile movie1 = new VideoFile("アクション映画.mp4", 2000 * 1024 * 1024, 1920, 1080, 24.0, TimeSpan.FromMinutes(120), true);
VideoFile movie2 = new VideoFile("ドキュメンタリー.mp4", 1500 * 1024 * 1024, 1280, 720, 30.0, TimeSpan.FromMinutes(90), false);

ImageFile photo1 = new ImageFile("風景写真.jpg", 2 * 1024 * 1024, 4000, 3000, 24, 5);
ImageFile photo2 = new ImageFile("ポートレート.jpg", 1.5 * 1024 * 1024, 3000, 4500, 24, 3);

// プレイリストに追加
player.AddMedia(song1);
player.AddMedia(movie1);
player.AddMedia(photo1);
player.AddMedia(song2);
player.AddMedia(movie2);
player.AddMedia(photo2);

// プレイリスト表示
player.ShowPlaylist();

// 音楽の特有機能テスト
Console.WriteLine("\n=== 音楽特有機能 ===");
player.PlayCurrent();
song1.ShowLyrics();
song1.AdjustEqualizer("ロック");
player.StopCurrent();

// 動画の特有機能テスト
Console.WriteLine("\n=== 動画特有機能 ===");
player.NextTrack(); // 動画に移動
movie1.ToggleSubtitles();
movie1.ChangeQuality("1080p");
player.StopCurrent();

// 画像の特有機能テスト
Console.WriteLine("\n=== 画像特有機能 ===");
player.NextTrack(); // 画像に移動
photo1.ZoomIn();
photo1.Rotate(90);
player.StopCurrent();

// プレイヤー機能テスト
Console.WriteLine("\n=== プレイヤー機能テスト ===");
player.ToggleShuffle();
player.ToggleRepeat();
player.ShowCurrentMediaInfo();

// 連続再生テスト
player.PlayAll();`,
      difficulty: 'hard',
      estimatedTime: 40
    },
    {
      id: 'banking-system-exercise',
      title: '銀行システムの継承設計',
      description: 'Account基底クラスから SavingsAccount（普通預金）、CheckingAccount（当座預金）、CreditAccount（クレジット口座）を派生させ、各口座タイプの特有の機能を実装してください。また、Bankクラスで複数口座を管理するシステムを作成してください。',
      starterCode: `using System;
using System.Collections.Generic;

namespace BankingSystem
{
    // Account抽象基底クラス
    // 共通機能: 口座番号、名義人、残高、取引履歴
    // 抽象メソッド: CalculateInterest(), GetAccountType()
    // 仮想メソッド: Withdraw(), Deposit()
    
    // SavingsAccount（普通預金）
    // - 利息計算（年利）
    // - 最低残高制限
    // - 月間取引回数制限
    
    // CheckingAccount（当座預金）
    // - 小切手発行機能
    // - 当座貸越機能
    // - 月額手数料
    
    // CreditAccount（クレジット口座）
    // - 与信限度額
    // - 利用残高と利用可能額
    // - 月次請求書生成
    
    // Bank（銀行管理）
    // - 口座開設、解約
    // - 送金処理
    // - レポート生成
    
    class Program
    {
        static void Main(string[] args)
        {
            // 銀行システムのテスト
        }
    }
}`,
      hints: [
        'Account基底クラスで共通の取引履歴を管理',
        '各口座タイプで異なる手数料や制限を実装',
        'CreditAccountは残高がマイナスになる特殊な処理',
        'Bankクラスで口座間送金のロジックを実装'
      ],
      solution: `// 取引記録クラス
public class Transaction
{
    public DateTime Date { get; }
    public string Type { get; }
    public decimal Amount { get; }
    public decimal BalanceAfter { get; }
    public string Description { get; }
    
    public Transaction(string type, decimal amount, decimal balanceAfter, string description)
    {
        Date = DateTime.Now;
        Type = type;
        Amount = amount;
        BalanceAfter = balanceAfter;
        Description = description;
    }
    
    public override string ToString()
    {
        return $"{Date:yyyy/MM/dd HH:mm:ss} | {Type} | {Amount:C} | 残高: {BalanceAfter:C} | {Description}";
    }
}

// Account 抽象基底クラス
public abstract class Account
{
    protected string accountNumber;
    protected string accountHolder;
    protected decimal balance;
    protected List<Transaction> transactions;
    protected DateTime openDate;
    
    public string AccountNumber { get { return accountNumber; } }
    public string AccountHolder { get { return accountHolder; } }
    public decimal Balance { get { return balance; } }
    public DateTime OpenDate { get { return openDate; } }
    public List<Transaction> Transactions { get { return transactions; } }
    
    protected Account(string accountNumber, string accountHolder, decimal initialBalance = 0)
    {
        this.accountNumber = accountNumber;
        this.accountHolder = accountHolder;
        this.balance = initialBalance;
        this.openDate = DateTime.Now;
        this.transactions = new List<Transaction>();
        
        if (initialBalance > 0)
        {
            AddTransaction("開設", initialBalance, "口座開設時の初期入金");
        }
    }
    
    // 抽象メソッド
    public abstract decimal CalculateInterest();
    public abstract string GetAccountType();
    public abstract decimal GetMonthlyFee();
    
    // 仮想メソッド
    public virtual bool Deposit(decimal amount, string description = "入金")
    {
        if (amount <= 0)
        {
            Console.WriteLine("入金額は0より大きい必要があります");
            return false;
        }
        
        balance += amount;
        AddTransaction("入金", amount, description);
        Console.WriteLine($"{amount:C}を入金しました（残高: {balance:C}）");
        return true;
    }
    
    public virtual bool Withdraw(decimal amount, string description = "出金")
    {
        if (amount <= 0)
        {
            Console.WriteLine("出金額は0より大きい必要があります");
            return false;
        }
        
        if (amount > balance)
        {
            Console.WriteLine("残高不足です");
            return false;
        }
        
        balance -= amount;
        AddTransaction("出金", -amount, description);
        Console.WriteLine($"{amount:C}を出金しました（残高: {balance:C}）");
        return true;
    }
    
    // 共通メソッド
    protected void AddTransaction(string type, decimal amount, string description)
    {
        transactions.Add(new Transaction(type, amount, balance, description));
    }
    
    public virtual void DisplayAccountInfo()
    {
        Console.WriteLine($"=== {GetAccountType()} ===");
        Console.WriteLine($"口座番号: {accountNumber}");
        Console.WriteLine($"名義人: {accountHolder}");
        Console.WriteLine($"残高: {balance:C}");
        Console.WriteLine($"開設日: {openDate:yyyy/MM/dd}");
        Console.WriteLine($"取引件数: {transactions.Count}件");
    }
    
    public void DisplayTransactionHistory(int count = 10)
    {
        Console.WriteLine($"\n=== 取引履歴（最新{count}件） ===");
        var recentTransactions = transactions.Skip(Math.Max(0, transactions.Count - count)).Reverse();
        
        foreach (var transaction in recentTransactions)
        {
            Console.WriteLine(transaction);
        }
    }
    
    public void ApplyInterest()
    {
        decimal interest = CalculateInterest();
        if (interest > 0)
        {
            balance += interest;
            AddTransaction("利息", interest, "月次利息付与");
            Console.WriteLine($"利息{interest:C}が付与されました");
        }
    }
    
    public void ApplyMonthlyFee()
    {
        decimal fee = GetMonthlyFee();
        if (fee > 0 && balance >= fee)
        {
            balance -= fee;
            AddTransaction("手数料", -fee, "月額手数料");
            Console.WriteLine($"月額手数料{fee:C}が引き落とされました");
        }
        else if (fee > 0)
        {
            Console.WriteLine($"残高不足のため月額手数料{fee:C}を引き落とせませんでした");
        }
    }
}

// SavingsAccount（普通預金）
public class SavingsAccount : Account
{
    private decimal interestRate;
    private decimal minimumBalance;
    private int monthlyTransactionLimit;
    private int monthlyTransactionCount;
    
    public decimal InterestRate { get { return interestRate; } }
    public decimal MinimumBalance { get { return minimumBalance; } }
    public int RemainingTransactions { get { return monthlyTransactionLimit - monthlyTransactionCount; } }
    
    public SavingsAccount(string accountNumber, string accountHolder, decimal initialBalance, 
                         decimal interestRate = 0.001m, decimal minimumBalance = 1000m)
        : base(accountNumber, accountHolder, initialBalance)
    {
        this.interestRate = interestRate;
        this.minimumBalance = minimumBalance;
        this.monthlyTransactionLimit = 6; // 月6回まで
        this.monthlyTransactionCount = 0;
    }
    
    public override decimal CalculateInterest()
    {
        return balance * interestRate / 12; // 月利
    }
    
    public override string GetAccountType()
    {
        return "普通預金";
    }
    
    public override decimal GetMonthlyFee()
    {
        return balance < minimumBalance ? 200m : 0m; // 最低残高を下回ると手数料
    }
    
    public override bool Withdraw(decimal amount, string description = "出金")
    {
        if (monthlyTransactionCount >= monthlyTransactionLimit)
        {
            Console.WriteLine("月間取引回数制限に達しています");
            return false;
        }
        
        if (balance - amount < minimumBalance)
        {
            Console.WriteLine($"最低残高{minimumBalance:C}を下回るため出金できません");
            return false;
        }
        
        if (base.Withdraw(amount, description))
        {
            monthlyTransactionCount++;
            return true;
        }
        
        return false;
    }
    
    public override bool Deposit(decimal amount, string description = "入金")
    {
        if (monthlyTransactionCount >= monthlyTransactionLimit)
        {
            Console.WriteLine("月間取引回数制限に達しています");
            return false;
        }
        
        if (base.Deposit(amount, description))
        {
            monthlyTransactionCount++;
            return true;
        }
        
        return false;
    }
    
    public void ResetMonthlyTransactionCount()
    {
        monthlyTransactionCount = 0;
        Console.WriteLine("月間取引回数をリセットしました");
    }
    
    public override void DisplayAccountInfo()
    {
        base.DisplayAccountInfo();
        Console.WriteLine($"年利: {interestRate * 100:F2}%");
        Console.WriteLine($"最低残高: {minimumBalance:C}");
        Console.WriteLine($"残り取引回数: {RemainingTransactions}/{monthlyTransactionLimit}");
    }
}

// CheckingAccount（当座預金）
public class CheckingAccount : Account
{
    private decimal overdraftLimit;
    private decimal monthlyFee;
    private int checksIssued;
    
    public decimal OverdraftLimit { get { return overdraftLimit; } }
    public decimal AvailableBalance { get { return balance + overdraftLimit; } }
    public int ChecksIssued { get { return checksIssued; } }
    
    public CheckingAccount(string accountNumber, string accountHolder, decimal initialBalance,
                          decimal overdraftLimit = 50000m, decimal monthlyFee = 500m)
        : base(accountNumber, accountHolder, initialBalance)
    {
        this.overdraftLimit = overdraftLimit;
        this.monthlyFee = monthlyFee;
        this.checksIssued = 0;
    }
    
    public override decimal CalculateInterest()
    {
        return 0; // 当座預金には利息なし
    }
    
    public override string GetAccountType()
    {
        return "当座預金";
    }
    
    public override decimal GetMonthlyFee()
    {
        return monthlyFee;
    }
    
    public override bool Withdraw(decimal amount, string description = "出金")
    {
        if (amount <= 0)
        {
            Console.WriteLine("出金額は0より大きい必要があります");
            return false;
        }
        
        if (amount > AvailableBalance)
        {
            Console.WriteLine($"当座貸越限度額を超過します（利用可能額: {AvailableBalance:C}）");
            return false;
        }
        
        balance -= amount;
        AddTransaction("出金", -amount, description);
        
        if (balance < 0)
        {
            Console.WriteLine($"{amount:C}を出金しました（当座貸越: {Math.Abs(balance):C}）");
        }
        else
        {
            Console.WriteLine($"{amount:C}を出金しました（残高: {balance:C}）");
        }
        
        return true;
    }
    
    public bool IssueCheck(decimal amount, string payee)
    {
        if (Withdraw(amount, $"小切手発行 - {payee}"))
        {
            checksIssued++;
            Console.WriteLine($"小切手#{checksIssued:D6}を発行しました（受取人: {payee}）");
            return true;
        }
        
        return false;
    }
    
    public decimal GetOverdraftAmount()
    {
        return balance < 0 ? Math.Abs(balance) : 0;
    }
    
    public override void DisplayAccountInfo()
    {
        base.DisplayAccountInfo();
        Console.WriteLine($"当座貸越限度額: {overdraftLimit:C}");
        Console.WriteLine($"利用可能残高: {AvailableBalance:C}");
        Console.WriteLine($"当座貸越額: {GetOverdraftAmount():C}");
        Console.WriteLine($"発行済み小切手数: {checksIssued}");
        Console.WriteLine($"月額手数料: {monthlyFee:C}");
    }
}

// CreditAccount（クレジット口座）
public class CreditAccount : Account
{
    private decimal creditLimit;
    private decimal interestRate;
    private decimal minimumPayment;
    
    public decimal CreditLimit { get { return creditLimit; } }
    public decimal UsedCredit { get { return Math.Abs(balance); } } // 残高は負の値
    public decimal AvailableCredit { get { return creditLimit - UsedCredit; } }
    public decimal InterestRate { get { return interestRate; } }
    
    public CreditAccount(string accountNumber, string accountHolder, decimal creditLimit,
                        decimal interestRate = 0.18m)
        : base(accountNumber, accountHolder, 0)
    {
        this.creditLimit = creditLimit;
        this.interestRate = interestRate;
        this.minimumPayment = 0;
    }
    
    public override decimal CalculateInterest()
    {
        return balance < 0 ? Math.Abs(balance) * interestRate / 12 : 0; // 利用残高に対する月利
    }
    
    public override string GetAccountType()
    {
        return "クレジット口座";
    }
    
    public override decimal GetMonthlyFee()
    {
        return balance < 0 ? 100m : 0m; // 利用がある場合のみ年会費
    }
    
    public bool Purchase(decimal amount, string description)
    {
        if (amount <= 0)
        {
            Console.WriteLine("購入金額は0より大きい必要があります");
            return false;
        }
        
        if (amount > AvailableCredit)
        {
            Console.WriteLine($"与信限度額を超過します（利用可能額: {AvailableCredit:C}）");
            return false;
        }
        
        balance -= amount; // クレジットは残高がマイナスになる
        AddTransaction("利用", -amount, description);
        Console.WriteLine($"{amount:C}を利用しました（利用残高: {UsedCredit:C}）");
        return true;
    }
    
    public override bool Deposit(decimal amount, string description = "返済")
    {
        if (amount <= 0)
        {
            Console.WriteLine("返済額は0より大きい必要があります");
            return false;
        }
        
        decimal paymentAmount = Math.Min(amount, UsedCredit);
        balance += paymentAmount;
        AddTransaction("返済", paymentAmount, description);
        
        if (balance > 0)
        {
            // 過払いの場合は口座に残る
            Console.WriteLine($"{paymentAmount:C}を返済しました（残高: {balance:C}）");
        }
        else
        {
            Console.WriteLine($"{paymentAmount:C}を返済しました（利用残高: {UsedCredit:C}）");
        }
        
        return true;
    }
    
    public override bool Withdraw(decimal amount, string description = "出金")
    {
        return Purchase(amount, description);
    }
    
    public decimal CalculateMinimumPayment()
    {
        if (balance >= 0) return 0;
        
        decimal usedAmount = Math.Abs(balance);
        return Math.Max(usedAmount * 0.05m, 1000m); // 利用残高の5%または1000円のいずれか大きい方
    }
    
    public void GenerateMonthlyStatement()
    {
        Console.WriteLine($"\n=== 月次請求書 - {accountNumber} ===");
        Console.WriteLine($"名義人: {accountHolder}");
        Console.WriteLine($"請求日: {DateTime.Now:yyyy/MM/dd}");
        Console.WriteLine($"与信限度額: {creditLimit:C}");
        Console.WriteLine($"利用残高: {UsedCredit:C}");
        Console.WriteLine($"利用可能額: {AvailableCredit:C}");
        Console.WriteLine($"最低返済額: {CalculateMinimumPayment():C}");
        Console.WriteLine($"月利息: {CalculateInterest():C}");
        
        Console.WriteLine("\n--- 当月利用明細 ---");
        var thisMonthTransactions = transactions.Where(t => t.Date.Month == DateTime.Now.Month).ToList();
        foreach (var transaction in thisMonthTransactions)
        {
            Console.WriteLine($"{transaction.Date:MM/dd} {transaction.Description} {transaction.Amount:C}");
        }
    }
    
    public override void DisplayAccountInfo()
    {
        base.DisplayAccountInfo();
        Console.WriteLine($"与信限度額: {creditLimit:C}");
        Console.WriteLine($"利用残高: {UsedCredit:C}");
        Console.WriteLine($"利用可能額: {AvailableCredit:C}");
        Console.WriteLine($"年利: {interestRate * 100:F1}%");
        Console.WriteLine($"最低返済額: {CalculateMinimumPayment():C}");
    }
}

// Bank（銀行管理）
public class Bank
{
    private string bankName;
    private List<Account> accounts;
    private int nextAccountNumber;
    
    public string BankName { get { return bankName; } }
    public int AccountCount { get { return accounts.Count; } }
    
    public Bank(string bankName)
    {
        this.bankName = bankName;
        this.accounts = new List<Account>();
        this.nextAccountNumber = 1001;
    }
    
    public SavingsAccount OpenSavingsAccount(string accountHolder, decimal initialBalance)
    {
        string accountNumber = $"SAV{nextAccountNumber++:D6}";
        var account = new SavingsAccount(accountNumber, accountHolder, initialBalance);
        accounts.Add(account);
        Console.WriteLine($"普通預金口座を開設しました: {accountNumber}");
        return account;
    }
    
    public CheckingAccount OpenCheckingAccount(string accountHolder, decimal initialBalance)
    {
        string accountNumber = $"CHK{nextAccountNumber++:D6}";
        var account = new CheckingAccount(accountNumber, accountHolder, initialBalance);
        accounts.Add(account);
        Console.WriteLine($"当座預金口座を開設しました: {accountNumber}");
        return account;
    }
    
    public CreditAccount OpenCreditAccount(string accountHolder, decimal creditLimit)
    {
        string accountNumber = $"CRD{nextAccountNumber++:D6}";
        var account = new CreditAccount(accountNumber, accountHolder, creditLimit);
        accounts.Add(account);
        Console.WriteLine($"クレジット口座を開設しました: {accountNumber}");
        return account;
    }
    
    public Account FindAccount(string accountNumber)
    {
        return accounts.FirstOrDefault(a => a.AccountNumber == accountNumber);
    }
    
    public bool Transfer(string fromAccountNumber, string toAccountNumber, decimal amount)
    {
        var fromAccount = FindAccount(fromAccountNumber);
        var toAccount = FindAccount(toAccountNumber);
        
        if (fromAccount == null)
        {
            Console.WriteLine("送金元口座が見つかりません");
            return false;
        }
        
        if (toAccount == null)
        {
            Console.WriteLine("送金先口座が見つかりません");
            return false;
        }
        
        if (fromAccount.Withdraw(amount, $"送金 → {toAccountNumber}"))
        {
            toAccount.Deposit(amount, $"送金 ← {fromAccountNumber}");
            Console.WriteLine($"{amount:C}の送金が完了しました");
            return true;
        }
        
        return false;
    }
    
    public void ProcessMonthlyTasks()
    {
        Console.WriteLine($"\n=== {bankName} 月次処理 ===");
        foreach (var account in accounts)
        {
            Console.WriteLine($"\n口座: {account.AccountNumber}");
            account.ApplyInterest();
            account.ApplyMonthlyFee();
            
            if (account is SavingsAccount savings)
            {
                savings.ResetMonthlyTransactionCount();
            }
            
            if (account is CreditAccount credit)
            {
                credit.GenerateMonthlyStatement();
            }
        }
    }
    
    public void GenerateBankReport()
    {
        Console.WriteLine($"\n=== {bankName} 銀行レポート ===");
        Console.WriteLine($"総口座数: {accounts.Count}");
        
        var accountsByType = accounts.GroupBy(a => a.GetAccountType());
        foreach (var group in accountsByType)
        {
            Console.WriteLine($"{group.Key}: {group.Count()}口座");
        }
        
        decimal totalBalance = accounts.Sum(a => a.Balance);
        Console.WriteLine($"総預金残高: {totalBalance:C}");
        
        var creditAccounts = accounts.OfType<CreditAccount>();
        decimal totalCreditUsed = creditAccounts.Sum(c => c.UsedCredit);
        Console.WriteLine($"総クレジット利用額: {totalCreditUsed:C}");
    }
    
    public void DisplayAllAccounts()
    {
        Console.WriteLine($"\n=== {bankName} 全口座一覧 ===");
        foreach (var account in accounts)
        {
            Console.WriteLine();
            account.DisplayAccountInfo();
        }
    }
}

// Main メソッド内のテストコード
Bank myBank = new Bank("さくら銀行");

// 口座開設
var savings = myBank.OpenSavingsAccount("田中太郎", 100000);
var checking = myBank.OpenCheckingAccount("鈴木花子", 50000);
var credit = myBank.OpenCreditAccount("山田次郎", 200000);

// 取引テスト
Console.WriteLine("\n=== 取引テスト ===");

// 普通預金の取引
savings.Deposit(20000, "給与振込");
savings.Withdraw(5000, "ATM出金");

// 当座預金の取引
checking.IssueCheck(15000, "家賃支払い");
checking.Withdraw(60000, "大口出金"); // 当座貸越を使用

// クレジット口座の取引
credit.Purchase(50000, "ショッピング");
credit.Purchase(30000, "旅行代金");
credit.Deposit(20000, "一部返済");

// 送金テスト
Console.WriteLine("\n=== 送金テスト ===");
myBank.Transfer(savings.AccountNumber, checking.AccountNumber, 25000);

// 口座情報表示
myBank.DisplayAllAccounts();

// 月次処理
myBank.ProcessMonthlyTasks();

// 銀行レポート
myBank.GenerateBankReport();`,
      difficulty: 'hard',
      estimatedTime: 50
    }
  ],
  estimatedTime: 80,
  difficulty: 'intermediate',
  prerequisites: ['hello-world', 'variables-and-types', 'operators-and-expressions', 'arrays-and-collections', 'control-flow-if', 'control-flow-switch', 'loops-for-while', 'methods', 'classes-and-objects'],
  nextLesson: 'interfaces'
};