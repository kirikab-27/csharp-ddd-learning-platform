import type { Lesson } from '../../../../features/learning/types';

export const linqAdvancedLesson: Lesson = {
  id: 'linq-advanced',
  moduleId: 'linq-mastery',
  title: 'LINQ応用 - 高度なクエリテクニック',
  description: 'GroupBy、Join、集計関数など、LINQの高度な機能を学び、複雑なデータ操作を効率的に行う方法を習得します',
  content: `
# LINQ応用 - 高度なクエリテクニック

前回学んだ基本的なLINQ操作を基に、より複雑で実践的なデータ操作テクニックを学びます。

## GroupBy - グループ化

データを特定のキーでグループ化し、集計や分析を行います。

### 基本的なグループ化

\`\`\`csharp
var salesByCategory = products
    .GroupBy(p => p.Category)
    .Select(g => new 
    {
        Category = g.Key,
        TotalSales = g.Sum(p => p.Price * p.Quantity),
        ProductCount = g.Count()
    });
\`\`\`

### 複数キーでのグループ化

\`\`\`csharp
var salesByRegionAndCategory = sales
    .GroupBy(s => new { s.Region, s.Category })
    .Select(g => new 
    {
        g.Key.Region,
        g.Key.Category,
        TotalAmount = g.Sum(s => s.Amount)
    });
\`\`\`

## Join - 結合操作

複数のデータソースを関連付けて結合します。

### 内部結合 (Inner Join)

\`\`\`csharp
var productWithCategory = products
    .Join(categories,
        p => p.CategoryId,      // 外部キー
        c => c.Id,              // 主キー
        (p, c) => new           // 結果セレクター
        {
            ProductName = p.Name,
            CategoryName = c.Name,
            Price = p.Price
        });
\`\`\`

### グループ結合 (Group Join)

\`\`\`csharp
var categoriesWithProducts = categories
    .GroupJoin(products,
        c => c.Id,
        p => p.CategoryId,
        (c, prods) => new
        {
            CategoryName = c.Name,
            Products = prods.ToList(),
            ProductCount = prods.Count()
        });
\`\`\`

### 左外部結合 (Left Outer Join)

\`\`\`csharp
var allCustomersWithOrders = customers
    .GroupJoin(orders,
        c => c.Id,
        o => o.CustomerId,
        (c, orderGroup) => new { Customer = c, Orders = orderGroup })
    .SelectMany(
        co => co.Orders.DefaultIfEmpty(),
        (co, o) => new
        {
            CustomerName = co.Customer.Name,
            OrderId = o?.Id ?? 0,
            OrderDate = o?.Date ?? DateTime.MinValue
        });
\`\`\`

## 集計関数

### 基本的な集計

\`\`\`csharp
var statistics = new
{
    Total = numbers.Sum(),
    Average = numbers.Average(),
    Min = numbers.Min(),
    Max = numbers.Max(),
    Count = numbers.Count()
};
\`\`\`

### カスタム集計 (Aggregate)

\`\`\`csharp
// 文字列の連結
var concatenated = words.Aggregate((current, next) => current + ", " + next);

// 複雑な集計
var result = numbers.Aggregate(
    new { Sum = 0, Product = 1 },  // 初期値
    (acc, n) => new { Sum = acc.Sum + n, Product = acc.Product * n }
);
\`\`\`

## Set操作

### Distinct - 重複除去

\`\`\`csharp
var uniqueCategories = products
    .Select(p => p.Category)
    .Distinct();
\`\`\`

### Union / Intersect / Except

\`\`\`csharp
var allProducts = onlineProducts.Union(storeProducts);
var commonProducts = onlineProducts.Intersect(storeProducts);
var onlineOnly = onlineProducts.Except(storeProducts);
\`\`\`

## パーティション操作

### TakeWhile / SkipWhile

\`\`\`csharp
// 条件を満たす間だけ取得
var firstPositives = numbers.TakeWhile(n => n > 0);

// 条件を満たす間スキップ
var afterNegatives = numbers.SkipWhile(n => n < 0);
\`\`\`

## 実践的な例：売上分析システム

\`\`\`csharp
public class SalesAnalysis
{
    public class Sale
    {
        public DateTime Date { get; set; }
        public string ProductId { get; set; }
        public string Region { get; set; }
        public decimal Amount { get; set; }
        public int Quantity { get; set; }
    }
    
    public class Product
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Category { get; set; }
    }
    
    public static void AnalyzeSales(List<Sale> sales, List<Product> products)
    {
        // 月別・地域別の売上集計
        var monthlySalesByRegion = sales
            .GroupBy(s => new 
            { 
                Year = s.Date.Year,
                Month = s.Date.Month,
                Region = s.Region 
            })
            .Select(g => new
            {
                Period = $"{g.Key.Year}/{g.Key.Month:00}",
                g.Key.Region,
                TotalSales = g.Sum(s => s.Amount),
                TotalQuantity = g.Sum(s => s.Quantity),
                AverageOrderValue = g.Average(s => s.Amount)
            })
            .OrderBy(x => x.Period)
            .ThenBy(x => x.Region);
        
        // トップ10商品の分析
        var topProducts = sales
            .Join(products,
                s => s.ProductId,
                p => p.Id,
                (s, p) => new { Sale = s, Product = p })
            .GroupBy(x => new { x.Product.Id, x.Product.Name, x.Product.Category })
            .Select(g => new
            {
                ProductName = g.Key.Name,
                Category = g.Key.Category,
                TotalRevenue = g.Sum(x => x.Sale.Amount),
                TotalQuantity = g.Sum(x => x.Sale.Quantity),
                SalesCount = g.Count()
            })
            .OrderByDescending(x => x.TotalRevenue)
            .Take(10);
        
        // カテゴリ別の成長率分析
        var categoryGrowth = sales
            .Join(products, s => s.ProductId, p => p.Id, (s, p) => new { s, p })
            .GroupBy(x => new 
            { 
                x.p.Category, 
                Year = x.s.Date.Year 
            })
            .Select(g => new 
            { 
                g.Key.Category, 
                g.Key.Year, 
                Total = g.Sum(x => x.s.Amount) 
            })
            .GroupBy(x => x.Category)
            .Select(g =>
            {
                var years = g.OrderBy(x => x.Year).ToList();
                var growth = years.Count > 1 
                    ? (years.Last().Total - years.First().Total) / years.First().Total * 100 
                    : 0;
                return new
                {
                    Category = g.Key,
                    GrowthRate = growth,
                    LatestYearSales = years.Last().Total
                };
            })
            .OrderByDescending(x => x.GrowthRate);
    }
}
\`\`\`

## パフォーマンスの最適化

### 1. 適切なデータ構造の選択

\`\`\`csharp
// ToLookup()を使用した高速検索
var productLookup = products.ToLookup(p => p.CategoryId);
var electronicsProducts = productLookup[electronicsCategoryId];
\`\`\`

### 2. 不要な反復の回避

\`\`\`csharp
// 悪い例：複数回の列挙
var count = query.Count();      // 1回目の実行
var items = query.ToList();     // 2回目の実行

// 良い例：一度だけ実行
var items = query.ToList();
var count = items.Count;
\`\`\`

### 3. 並列LINQ (PLINQ)

\`\`\`csharp
var results = largeDataSet
    .AsParallel()
    .Where(x => ExpensiveOperation(x))
    .Select(x => Transform(x))
    .ToList();
\`\`\`

## まとめ

高度なLINQ操作により：
- 複雑なデータ分析が簡潔に記述可能
- SQLのような強力なクエリ機能をC#で実現
- 型安全性を保ちながら柔軟なデータ操作

次のレッスンでは、非同期プログラミングについて学習します。
`,
  codeExamples: [
    {
      id: 'sales-data-analysis',
      title: '売上データの複雑な分析',
      description: 'GroupBy、Join、集計を組み合わせた実践的な例',
      language: 'csharp',
      code: `using System;
using System.Linq;
using System.Collections.Generic;

public class AdvancedSalesAnalysis
{
    public static void Main()
    {
        // サンプルデータの準備
        var orders = new List<Order>
        {
            new Order { Id = 1, CustomerId = 101, Date = new DateTime(2024, 1, 15), Total = 15000 },
            new Order { Id = 2, CustomerId = 102, Date = new DateTime(2024, 1, 20), Total = 8000 },
            new Order { Id = 3, CustomerId = 101, Date = new DateTime(2024, 2, 10), Total = 12000 },
            new Order { Id = 4, CustomerId = 103, Date = new DateTime(2024, 2, 15), Total = 25000 },
            new Order { Id = 5, CustomerId = 102, Date = new DateTime(2024, 3, 5), Total = 18000 }
        };
        
        var orderDetails = new List<OrderDetail>
        {
            new OrderDetail { OrderId = 1, ProductId = "P001", Quantity = 2, UnitPrice = 5000 },
            new OrderDetail { OrderId = 1, ProductId = "P002", Quantity = 1, UnitPrice = 5000 },
            new OrderDetail { OrderId = 2, ProductId = "P001", Quantity = 1, UnitPrice = 5000 },
            new OrderDetail { OrderId = 2, ProductId = "P003", Quantity = 3, UnitPrice = 1000 },
            new OrderDetail { OrderId = 3, ProductId = "P002", Quantity = 2, UnitPrice = 6000 },
            new OrderDetail { OrderId = 4, ProductId = "P001", Quantity = 5, UnitPrice = 5000 },
            new OrderDetail { OrderId = 5, ProductId = "P003", Quantity = 6, UnitPrice = 3000 }
        };
        
        var products = new List<Product>
        {
            new Product { Id = "P001", Name = "ノートPC", Category = "電子機器" },
            new Product { Id = "P002", Name = "タブレット", Category = "電子機器" },
            new Product { Id = "P003", Name = "マウス", Category = "周辺機器" }
        };
        
        var customers = new List<Customer>
        {
            new Customer { Id = 101, Name = "株式会社ABC", Type = "法人" },
            new Customer { Id = 102, Name = "田中太郎", Type = "個人" },
            new Customer { Id = 103, Name = "株式会社XYZ", Type = "法人" }
        };
        
        // 1. 顧客タイプ別の月間売上分析
        Console.WriteLine("=== 顧客タイプ別月間売上 ===");
        var monthlyTypeAnalysis = orders
            .Join(customers,
                o => o.CustomerId,
                c => c.Id,
                (o, c) => new { Order = o, Customer = c })
            .GroupBy(x => new 
            { 
                Year = x.Order.Date.Year,
                Month = x.Order.Date.Month,
                CustomerType = x.Customer.Type 
            })
            .Select(g => new
            {
                Period = $"{g.Key.Year}年{g.Key.Month}月",
                g.Key.CustomerType,
                TotalSales = g.Sum(x => x.Order.Total),
                OrderCount = g.Count(),
                AverageOrderValue = g.Average(x => x.Order.Total)
            })
            .OrderBy(x => x.Period)
            .ThenBy(x => x.CustomerType);
        
        foreach (var item in monthlyTypeAnalysis)
        {
            Console.WriteLine($"{item.Period} - {item.CustomerType}: " +
                $"売上 {item.TotalSales:C}, 注文数 {item.OrderCount}, " +
                $"平均単価 {item.AverageOrderValue:C}");
        }
        
        // 2. 商品カテゴリ別売上ランキング
        Console.WriteLine("\\n=== カテゴリ別売上ランキング ===");
        var categoryRanking = orderDetails
            .Join(products,
                od => od.ProductId,
                p => p.Id,
                (od, p) => new 
                { 
                    Detail = od, 
                    Product = p,
                    LineTotal = od.Quantity * od.UnitPrice
                })
            .GroupBy(x => x.Product.Category)
            .Select(g => new
            {
                Category = g.Key,
                TotalRevenue = g.Sum(x => x.LineTotal),
                TotalQuantity = g.Sum(x => x.Detail.Quantity),
                ProductsSold = g.Select(x => x.Product.Name).Distinct().Count()
            })
            .OrderByDescending(x => x.TotalRevenue);
        
        foreach (var cat in categoryRanking)
        {
            Console.WriteLine($"{cat.Category}: 売上 {cat.TotalRevenue:C}, " +
                $"販売数 {cat.TotalQuantity}, 商品種類 {cat.ProductsSold}");
        }
        
        // 3. 顧客別購買パターン分析
        Console.WriteLine("\\n=== 顧客別購買パターン ===");
        var customerPatterns = orders
            .Join(customers, o => o.CustomerId, c => c.Id, (o, c) => new { o, c })
            .GroupJoin(orderDetails,
                oc => oc.o.Id,
                od => od.OrderId,
                (oc, details) => new { oc.o, oc.c, Details = details })
            .SelectMany(x => x.Details.DefaultIfEmpty(),
                (x, detail) => new { x.o, x.c, detail })
            .Where(x => x.detail != null)
            .Join(products,
                x => x.detail.ProductId,
                p => p.Id,
                (x, p) => new { x.o, x.c, x.detail, Product = p })
            .GroupBy(x => new { x.c.Name, x.c.Type })
            .Select(g => new
            {
                CustomerName = g.Key.Name,
                CustomerType = g.Key.Type,
                TotalPurchases = g.Sum(x => x.detail.Quantity * x.detail.UnitPrice),
                FavoriteCategory = g.GroupBy(x => x.Product.Category)
                    .OrderByDescending(cat => cat.Sum(x => x.detail.Quantity * x.detail.UnitPrice))
                    .First().Key,
                UniqueProducts = g.Select(x => x.Product.Id).Distinct().Count()
            });
        
        foreach (var pattern in customerPatterns)
        {
            Console.WriteLine($"{pattern.CustomerName} ({pattern.CustomerType}): " +
                $"総購入額 {pattern.TotalPurchases:C}, " +
                $"お気に入りカテゴリ '{pattern.FavoriteCategory}', " +
                $"購入商品種類 {pattern.UniqueProducts}");
        }
    }
    
    // データモデル
    public class Order
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public DateTime Date { get; set; }
        public decimal Total { get; set; }
    }
    
    public class OrderDetail
    {
        public int OrderId { get; set; }
        public string ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
    
    public class Product
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Category { get; set; }
    }
    
    public class Customer
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
    }
}`
    }
  ],
  exercises: [
    {
      id: 'linq-advanced-1',
      title: '販売データ分析システム',
      description: '複数のデータソースを結合し、高度な分析を行うメソッドを実装してください。',
      difficulty: 'hard',
      starterCode: `using System;
using System.Linq;
using System.Collections.Generic;

public class SalesAnalyzer
{
    public class Sale
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public int ProductId { get; set; }
        public int CustomerId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
    
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Category { get; set; }
        public decimal Cost { get; set; }
    }
    
    public class Customer
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Region { get; set; }
    }
    
    // 地域別・カテゴリ別の売上と利益率を分析するメソッドを実装してください
    // 結果には以下を含めること：
    // - 地域名、カテゴリ名
    // - 総売上、総利益
    // - 利益率（(売上-原価)/売上 * 100）
    // - 販売数量
    public static object AnalyzeRegionalProfitability(
        List<Sale> sales,
        List<Product> products,
        List<Customer> customers)
    {
        // TODO: Join、GroupBy、集計関数を使用して実装
        return null;
    }
    
    // 顧客の購買行動を分析し、以下の情報を返すメソッドを実装してください：
    // - 各顧客の総購入額
    // - 最も頻繁に購入するカテゴリ
    // - 最後の購入日
    // - 購入頻度（日数/購入回数）
    public static object AnalyzeCustomerBehavior(
        List<Sale> sales,
        List<Product> products,
        List<Customer> customers)
    {
        // TODO: 複数のJoinとGroupByを組み合わせて実装
        return null;
    }
}`,
      solution: `public static object AnalyzeRegionalProfitability(
    List<Sale> sales,
    List<Product> products,
    List<Customer> customers)
{
    return sales
        .Join(products, s => s.ProductId, p => p.Id,
            (s, p) => new { Sale = s, Product = p })
        .Join(customers, sp => sp.Sale.CustomerId, c => c.Id,
            (sp, c) => new 
            { 
                sp.Sale, 
                sp.Product, 
                Customer = c,
                Revenue = sp.Sale.Quantity * sp.Sale.UnitPrice,
                Cost = sp.Sale.Quantity * sp.Product.Cost
            })
        .GroupBy(x => new { x.Customer.Region, x.Product.Category })
        .Select(g => new
        {
            Region = g.Key.Region,
            Category = g.Key.Category,
            TotalRevenue = g.Sum(x => x.Revenue),
            TotalProfit = g.Sum(x => x.Revenue - x.Cost),
            ProfitMargin = Math.Round(
                (g.Sum(x => x.Revenue - x.Cost) / g.Sum(x => x.Revenue)) * 100, 2),
            TotalQuantity = g.Sum(x => x.Sale.Quantity)
        })
        .OrderBy(x => x.Region)
        .ThenByDescending(x => x.TotalRevenue)
        .ToList();
}

public static object AnalyzeCustomerBehavior(
    List<Sale> sales,
    List<Product> products,
    List<Customer> customers)
{
    return customers
        .GroupJoin(sales, c => c.Id, s => s.CustomerId,
            (c, customerSales) => new { Customer = c, Sales = customerSales })
        .Where(x => x.Sales.Any())
        .Select(x => new
        {
            CustomerId = x.Customer.Id,
            CustomerName = x.Customer.Name,
            TotalPurchases = x.Sales.Sum(s => s.Quantity * s.UnitPrice),
            FavoriteCategory = x.Sales
                .Join(products, s => s.ProductId, p => p.Id, (s, p) => new { s, p })
                .GroupBy(sp => sp.p.Category)
                .OrderByDescending(g => g.Count())
                .First().Key,
            LastPurchaseDate = x.Sales.Max(s => s.Date),
            PurchaseFrequency = x.Sales.Any() 
                ? (x.Sales.Max(s => s.Date) - x.Sales.Min(s => s.Date)).Days / 
                  (double)x.Sales.Select(s => s.Date.Date).Distinct().Count()
                : 0
        })
        .OrderByDescending(x => x.TotalPurchases)
        .ToList();
}`,
      hints: [
        '複数のJoinを使用してsales、products、customersを結合します',
        'GroupByで地域とカテゴリでグループ化し、集計を行います',
        '利益率は (売上 - 原価) / 売上 * 100 で計算します',
        '購入頻度は期間を購入回数で割って計算します'
      ],
      testCases: [
        {
          input: '売上データ、商品マスタ、顧客マスタ',
          expectedOutput: '地域別・カテゴリ別の詳細な売上分析結果'
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'linq-advanced-quiz-1',
      question: 'GroupJoinとJoinの主な違いは何ですか？',
      options: [
        'GroupJoinは遅い、Joinは速い',
        'GroupJoinは階層構造を作り、Joinはフラットな結果を返す',
        'GroupJoinは内部結合のみ、Joinは外部結合も可能',
        '違いはない'
      ],
      correctAnswer: 1,
      explanation: 'GroupJoinは1対多の関係を階層構造として表現し、Joinは1対1のフラットな結果を返します。'
    },
    {
      id: 'linq-advanced-quiz-2',
      question: 'AsParallel()を使用する際の注意点として正しくないものは？',
      options: [
        'スレッドセーフでない操作は避ける',
        '小さなデータセットでは逆に遅くなる可能性がある',
        '順序が保証されなくなる場合がある',
        '常にパフォーマンスが向上する'
      ],
      correctAnswer: 3,
      explanation: 'AsParallel()は並列化のオーバーヘッドがあるため、小さなデータセットでは逆に遅くなることがあります。'
    }
  ],
  nextLesson: 'async-await',
  estimatedTime: 60
};