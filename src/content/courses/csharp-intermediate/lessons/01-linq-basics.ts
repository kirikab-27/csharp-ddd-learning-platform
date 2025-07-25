import type { Lesson } from '../../../../features/learning/types';

export const linqBasicsLesson: Lesson = {
  id: 'linq-basics',
  moduleId: 'linq-mastery',
  title: 'LINQ基礎 - Language Integrated Query',
  description: 'LINQを使用したデータクエリの基本を学び、コレクション操作を効率化する方法を習得します',
  content: `
# LINQ (Language Integrated Query) 基礎

LINQは、C#に統合されたクエリ言語機能で、様々なデータソースに対して統一的な方法でクエリを実行できます。

## LINQとは？

LINQを使用することで、SQLのような宣言的な構文でデータを操作できます：

- **統一的なクエリ構文**: 配列、リスト、データベース、XMLなど様々なデータソースに対応
- **型安全**: コンパイル時に型チェックが行われる
- **IntelliSenseサポート**: IDEによる自動補完が利用可能
- **遅延実行**: クエリは実際に結果が必要になるまで実行されない

## LINQの2つの構文

### 1. メソッド構文（ラムダ式）

最も一般的に使用される構文です：

\`\`\`csharp
var numbers = new[] { 1, 2, 3, 4, 5 };
var evenNumbers = numbers.Where(n => n % 2 == 0);
\`\`\`

### 2. クエリ構文（SQLライク）

SQLに似た構文でクエリを記述できます：

\`\`\`csharp
var evenNumbers = from n in numbers
                  where n % 2 == 0
                  select n;
\`\`\`

## 基本的なLINQメソッド

### Where - フィルタリング

条件に合致する要素のみを抽出します：

\`\`\`csharp
var products = GetProducts();
var expensiveProducts = products.Where(p => p.Price > 1000);
\`\`\`

### Select - 射影（変換）

各要素を新しい形式に変換します：

\`\`\`csharp
var productNames = products.Select(p => p.Name);
var productInfo = products.Select(p => new { p.Name, p.Price });
\`\`\`

### OrderBy / OrderByDescending - 並び替え

要素を昇順または降順に並び替えます：

\`\`\`csharp
var sortedByPrice = products.OrderBy(p => p.Price);
var sortedByPriceDesc = products.OrderByDescending(p => p.Price);
\`\`\`

### Take / Skip - ページング

指定した数の要素を取得またはスキップします：

\`\`\`csharp
var firstFive = products.Take(5);
var skipFirstTen = products.Skip(10);
var page2 = products.Skip(10).Take(10); // 11-20番目を取得
\`\`\`

## 実践的な例

### 商品検索システム

\`\`\`csharp
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    public string Category { get; set; }
    public int Stock { get; set; }
}

// 在庫があり、価格が500円以上1000円以下の商品を価格順に取得
var availableProducts = products
    .Where(p => p.Stock > 0)
    .Where(p => p.Price >= 500 && p.Price <= 1000)
    .OrderBy(p => p.Price)
    .Select(p => new 
    {
        p.Name,
        p.Price,
        p.Category
    });
\`\`\`

## 遅延実行の理解

LINQクエリは定義時には実行されず、結果が必要になった時点で実行されます：

\`\`\`csharp
var query = numbers.Where(n => n > 3); // まだ実行されない

// 実際の実行タイミング
foreach (var num in query) // ここで実行される
{
    Console.WriteLine(num);
}

// ToList()などで即座に実行することも可能
var results = query.ToList(); // ここで実行される
\`\`\`

## パフォーマンスのベストプラクティス

1. **必要なデータのみ取得**: Select()で必要なプロパティのみを選択
2. **早期フィルタリング**: Where()は他の操作の前に実行
3. **適切な実行タイミング**: ToList()やToArray()の使用は慎重に
4. **インデックスの活用**: データベースクエリではインデックスを考慮

## DDD（ドメイン駆動設計）への橋渡し

LINQは将来学習するDDDでも重要な役割を果たします：

### リポジトリパターンでの活用
\`\`\`csharp
// DDDで使用されるリポジトリパターンの例
public interface ICustomerRepository
{
    IEnumerable<Customer> FindByCity(string city);
    IEnumerable<Customer> FindActiveCustomers();
}

public class CustomerRepository : ICustomerRepository
{
    private readonly List<Customer> _customers;
    
    public IEnumerable<Customer> FindByCity(string city)
    {
        return _customers.Where(c => c.Address.City == city);
    }
    
    public IEnumerable<Customer> FindActiveCustomers()
    {
        return _customers.Where(c => c.IsActive && c.LastOrderDate > DateTime.Now.AddMonths(-6));
    }
}
\`\`\`

### 仕様パターンでの活用
\`\`\`csharp
// 複雑なビジネスルールをLINQで表現
public class CustomerSpecifications
{
    public static Expression<Func<Customer, bool>> IsVip()
    {
        return customer => customer.TotalPurchaseAmount > 100000;
    }
    
    public static Expression<Func<Customer, bool>> IsInRegion(string region)
    {
        return customer => customer.Address.Region == region;
    }
}

// 使用例
var vipCustomersInTokyo = customers
    .Where(CustomerSpecifications.IsVip().Compile())
    .Where(CustomerSpecifications.IsInRegion("東京").Compile());
\`\`\`

### ドメインロジックでの活用
\`\`\`csharp
public class Order
{
    public IEnumerable<OrderItem> Items { get; set; }
    
    // LINQを使ったドメインロジック
    public decimal CalculateTotal()
    {
        return Items.Sum(item => item.Price * item.Quantity);
    }
    
    public bool HasDiscountEligibleItems()
    {
        return Items.Any(item => item.Category == "Electronics" && item.Price > 10000);
    }
    
    public IEnumerable<OrderItem> GetExpensiveItems()
    {
        return Items.Where(item => item.Price > 5000).OrderByDescending(item => item.Price);
    }
}
\`\`\`

## まとめ

LINQは強力なデータ操作ツールです：
- **読みやすく保守しやすいコード**: 宣言的な記述で意図が明確
- **型安全性による信頼性の向上**: コンパイル時エラーチェック
- **様々なデータソースへの統一的なアプローチ**: 配列からデータベースまで
- **DDDでの重要な役割**: リポジトリパターンや仕様パターンでの活用

### 次のステップ
1. より高度なLINQ操作（結合、グループ化、集約）
2. Entity Frameworkでのデータベースクエリ
3. DDDでのリポジトリパターン実装

次のレッスンでは、より高度なLINQ操作について学習します。
`,
  codeExamples: [
    {
      id: 'basic-linq-operations',
      title: '基本的なLINQ操作',
      description: 'フィルタリング、変換、並び替えの組み合わせ',
      language: 'csharp',
      code: `using System;
using System.Linq;
using System.Collections.Generic;

public class Program
{
    public static void Main()
    {
        // サンプルデータ
        var students = new List<Student>
        {
            new Student { Id = 1, Name = "田中太郎", Age = 20, Grade = 85 },
            new Student { Id = 2, Name = "鈴木花子", Age = 19, Grade = 92 },
            new Student { Id = 3, Name = "佐藤次郎", Age = 21, Grade = 78 },
            new Student { Id = 4, Name = "高橋美咲", Age = 20, Grade = 95 },
            new Student { Id = 5, Name = "渡辺健一", Age = 22, Grade = 88 }
        };
        
        // 成績が80点以上の学生を成績順に取得
        var topStudents = students
            .Where(s => s.Grade >= 80)
            .OrderByDescending(s => s.Grade)
            .Select(s => new 
            {
                s.Name,
                s.Grade,
                Rank = s.Grade >= 90 ? "優秀" : "良好"
            });
        
        Console.WriteLine("成績優秀者リスト:");
        foreach (var student in topStudents)
        {
            Console.WriteLine($"{student.Name}: {student.Grade}点 ({student.Rank})");
        }
        
        // 平均年齢の計算
        var averageAge = students.Average(s => s.Age);
        Console.WriteLine($"\\n平均年齢: {averageAge:F1}歳");
        
        // 年齢でグループ化
        var ageGroups = students
            .GroupBy(s => s.Age)
            .Select(g => new 
            {
                Age = g.Key,
                Count = g.Count(),
                Students = g.Select(s => s.Name)
            });
        
        Console.WriteLine("\\n年齢別学生数:");
        foreach (var group in ageGroups)
        {
            Console.WriteLine($"{group.Age}歳: {group.Count}名");
            foreach (var name in group.Students)
            {
                Console.WriteLine($"  - {name}");
            }
        }
    }
}

public class Student
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int Age { get; set; }
    public int Grade { get; set; }
}`
    },
    {
      id: 'method-vs-query-syntax',
      title: 'メソッド構文とクエリ構文の比較',
      description: '同じ結果を得る2つの異なる構文',
      language: 'csharp',
      code: `using System;
using System.Linq;

public class LinqSyntaxComparison
{
    public static void Main()
    {
        var numbers = new[] { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
        
        // メソッド構文
        var methodSyntax = numbers
            .Where(n => n % 2 == 0)
            .Select(n => n * n)
            .OrderByDescending(n => n);
        
        Console.WriteLine("メソッド構文の結果:");
        foreach (var num in methodSyntax)
        {
            Console.WriteLine(num);
        }
        
        // クエリ構文
        var querySyntax = from n in numbers
                          where n % 2 == 0
                          orderby n * n descending
                          select n * n;
        
        Console.WriteLine("\\nクエリ構文の結果:");
        foreach (var num in querySyntax)
        {
            Console.WriteLine(num);
        }
        
        // 複雑なクエリの例
        var products = new[]
        {
            new { Name = "ノートPC", Category = "電子機器", Price = 80000 },
            new { Name = "マウス", Category = "周辺機器", Price = 3000 },
            new { Name = "キーボード", Category = "周辺機器", Price = 5000 },
            new { Name = "モニター", Category = "電子機器", Price = 30000 },
            new { Name = "USBケーブル", Category = "周辺機器", Price = 1000 }
        };
        
        // カテゴリ別の平均価格
        var categoryAverages = from p in products
                               group p by p.Category into g
                               select new
                               {
                                   Category = g.Key,
                                   AveragePrice = g.Average(p => p.Price),
                                   ProductCount = g.Count()
                               };
        
        Console.WriteLine("\\nカテゴリ別統計:");
        foreach (var cat in categoryAverages)
        {
            Console.WriteLine($"{cat.Category}: 平均価格 {cat.AveragePrice:C}, 商品数 {cat.ProductCount}");
        }
    }
}`
    },
    {
      id: 'ddd-customer-management',
      title: 'DDD指向の顧客管理システム',
      description: 'ドメインロジックとLINQを組み合わせた実践的な例',
      language: 'csharp',
      code: `using System;
using System.Linq;
using System.Collections.Generic;

// ドメインエンティティの例
public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public Address Address { get; set; }
    public DateTime RegistrationDate { get; set; }
    public decimal TotalPurchaseAmount { get; set; }
    public bool IsActive { get; set; }
    public CustomerType Type { get; set; }
    
    // ドメインロジック：VIP顧客かどうか
    public bool IsVip() => TotalPurchaseAmount >= 100000;
    
    // ドメインロジック：長期顧客かどうか
    public bool IsLongTermCustomer() => 
        DateTime.Now.Subtract(RegistrationDate).TotalDays >= 365;
}

public class Address
{
    public string City { get; set; }
    public string Prefecture { get; set; }
    public string PostalCode { get; set; }
}

public enum CustomerType
{
    Individual,
    Corporate,
    Government
}

// リポジトリパターンの例
public interface ICustomerRepository
{
    IEnumerable<Customer> FindVipCustomers();
    IEnumerable<Customer> FindCustomersByRegion(string prefecture);
    IEnumerable<Customer> FindInactiveCustomers();
    decimal GetAveragePurchaseAmount();
}

public class CustomerRepository : ICustomerRepository
{
    private readonly List<Customer> _customers;
    
    public CustomerRepository(List<Customer> customers)
    {
        _customers = customers;
    }
    
    public IEnumerable<Customer> FindVipCustomers()
    {
        return _customers
            .Where(c => c.IsVip())
            .OrderByDescending(c => c.TotalPurchaseAmount);
    }
    
    public IEnumerable<Customer> FindCustomersByRegion(string prefecture)
    {
        return _customers
            .Where(c => c.Address.Prefecture == prefecture)
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name);
    }
    
    public IEnumerable<Customer> FindInactiveCustomers()
    {
        return _customers
            .Where(c => !c.IsActive)
            .Where(c => c.IsLongTermCustomer())
            .Select(c => c); // 再アクティブ化候補
    }
    
    public decimal GetAveragePurchaseAmount()
    {
        return _customers
            .Where(c => c.IsActive)
            .Average(c => c.TotalPurchaseAmount);
    }
}

// ドメインサービスの例
public class CustomerAnalyticsService
{
    private readonly ICustomerRepository _repository;
    
    public CustomerAnalyticsService(ICustomerRepository repository)
    {
        _repository = repository;
    }
    
    public CustomerSegmentReport GenerateSegmentReport()
    {
        var customers = _repository.FindVipCustomers().ToList();
        
        var segments = customers
            .GroupBy(c => c.Type)
            .Select(g => new CustomerSegment
            {
                Type = g.Key,
                Count = g.Count(),
                TotalPurchaseAmount = g.Sum(c => c.TotalPurchaseAmount),
                AveragePurchaseAmount = g.Average(c => c.TotalPurchaseAmount)
            })
            .OrderByDescending(s => s.TotalPurchaseAmount);
        
        return new CustomerSegmentReport
        {
            Segments = segments.ToList(),
            GeneratedAt = DateTime.Now
        };
    }
}

public class CustomerSegment
{
    public CustomerType Type { get; set; }
    public int Count { get; set; }
    public decimal TotalPurchaseAmount { get; set; }
    public decimal AveragePurchaseAmount { get; set; }
}

public class CustomerSegmentReport
{
    public List<CustomerSegment> Segments { get; set; }
    public DateTime GeneratedAt { get; set; }
}

public class Program
{
    public static void Main()
    {
        // テストデータの作成
        var customers = new List<Customer>
        {
            new Customer 
            { 
                Id = 1, Name = "田中商事", Email = "tanaka@example.com",
                Address = new Address { City = "東京", Prefecture = "東京都" },
                RegistrationDate = DateTime.Now.AddYears(-2),
                TotalPurchaseAmount = 150000,
                IsActive = true,
                Type = CustomerType.Corporate
            },
            new Customer 
            { 
                Id = 2, Name = "鈴木太郎", Email = "suzuki@example.com",
                Address = new Address { City = "横浜", Prefecture = "神奈川県" },
                RegistrationDate = DateTime.Now.AddMonths(-6),
                TotalPurchaseAmount = 45000,
                IsActive = true,
                Type = CustomerType.Individual
            }
        };
        
        var repository = new CustomerRepository(customers);
        var analyticsService = new CustomerAnalyticsService(repository);
        
        // VIP顧客の取得
        Console.WriteLine("=== VIP顧客リスト ===");
        var vipCustomers = repository.FindVipCustomers();
        foreach (var customer in vipCustomers)
        {
            Console.WriteLine($"{customer.Name}: {customer.TotalPurchaseAmount:C}");
        }
        
        // セグメントレポートの生成
        var report = analyticsService.GenerateSegmentReport();
        Console.WriteLine("\\n=== 顧客セグメント分析 ===");
        foreach (var segment in report.Segments)
        {
            Console.WriteLine($"{segment.Type}: {segment.Count}件, 平均購入額: {segment.AveragePurchaseAmount:C}");
        }
    }
}`
    }
  ],
  exercises: [
    {
      id: 'linq-basic-1',
      title: '商品フィルタリング',
      description: '指定された条件に基づいて商品をフィルタリングし、適切な形式で返すメソッドを実装してください。',
      difficulty: 'medium',
      starterCode: `using System;
using System.Linq;
using System.Collections.Generic;

public class ProductFilter
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal Price { get; set; }
        public string Category { get; set; }
        public bool IsInStock { get; set; }
    }
    
    // 在庫があり、指定された価格範囲内の商品を
    // 価格の安い順に並べて返すメソッドを実装してください
    public static List<Product> GetAvailableProductsInPriceRange(
        List<Product> products, 
        decimal minPrice, 
        decimal maxPrice)
    {
        // TODO: LINQを使用して実装
        return new List<Product>();
    }
    
    // カテゴリごとの商品数と平均価格を返すメソッドを実装してください
    public static Dictionary<string, (int Count, decimal AveragePrice)> GetCategoryStatistics(
        List<Product> products)
    {
        // TODO: LINQのGroupByを使用して実装
        return new Dictionary<string, (int, decimal)>();
    }
}`,
      solution: `public static List<Product> GetAvailableProductsInPriceRange(
    List<Product> products, 
    decimal minPrice, 
    decimal maxPrice)
{
    return products
        .Where(p => p.IsInStock)
        .Where(p => p.Price >= minPrice && p.Price <= maxPrice)
        .OrderBy(p => p.Price)
        .ToList();
}

public static Dictionary<string, (int Count, decimal AveragePrice)> GetCategoryStatistics(
    List<Product> products)
{
    return products
        .GroupBy(p => p.Category)
        .ToDictionary(
            g => g.Key,
            g => (Count: g.Count(), AveragePrice: g.Average(p => p.Price))
        );
}`,
      hints: [
        'Where()メソッドを使用して在庫と価格の条件でフィルタリングします',
        'OrderBy()で価格順に並び替えます',
        'GroupBy()でカテゴリ別にグループ化し、ToDictionary()で辞書に変換します'
      ],
      testCases: [
        {
          input: '商品リスト、最小価格1000、最大価格5000',
          expectedOutput: '在庫があり価格範囲内の商品が価格順に返される'
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'linq-quiz-1',
      question: 'LINQの遅延実行について、正しい説明はどれですか？',
      options: [
        'クエリは定義時に即座に実行される',
        'クエリは結果が必要になるまで実行されない',
        'クエリは常に非同期で実行される',
        'クエリは手動で実行する必要がある'
      ],
      correctAnswer: 1,
      explanation: 'LINQクエリは遅延実行されるため、foreach文やToList()などで結果が必要になるまで実行されません。'
    },
    {
      id: 'linq-quiz-2',
      question: 'numbers.Where(n => n > 5).Select(n => n * 2)の実行順序として正しいのは？',
      options: [
        '全要素を2倍してから5より大きいものを選択',
        '5より大きい要素を選択してから2倍する',
        '実行順序は保証されない',
        'SelectとWhereは同時に実行される'
      ],
      correctAnswer: 1,
      explanation: 'LINQメソッドは記述順に実行されるため、Whereで絞り込んでからSelectで変換されます。'
    }
  ],
  nextLesson: 'linq-advanced',
  estimatedTime: 45
};