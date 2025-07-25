import type { Lesson } from '../../../../features/learning/types';

export const collectionsLesson: Lesson = {
  id: 'collections',
  moduleId: 'generics-collections',
  title: 'コレクション - 効率的なデータ管理',
  description: '様々なコレクション型を理解し、DDDでの効果的なデータ管理とドメインロジックの実装方法を学習します',
  content: `
# コレクション (Collections)

C#には様々な用途に最適化されたコレクション型が用意されており、DDDでもドメインオブジェクトのデータ管理に重要な役割を果たします。

## コレクションの種類と特徴

### List<T> - 順序付きリスト

最も一般的に使用されるコレクションです：

\`\`\`csharp
// 基本的な使用法
var products = new List<Product>();
products.Add(new Product("ノートPC", 80000));
products.AddRange(newProducts);

// 要素へのアクセス
var firstProduct = products[0];
var productCount = products.Count;

// 検索と操作
var expensiveProducts = products.Where(p => p.Price > 50000).ToList();
products.RemoveAt(0);
\`\`\`

### Dictionary<TKey, TValue> - キー・値ペア

高速な検索が必要な場合に使用：

\`\`\`csharp
// 製品IDをキーとした辞書
var productCatalog = new Dictionary<int, Product>();
productCatalog[1] = new Product("マウス", 3000);
productCatalog[2] = new Product("キーボード", 5000);

// 安全な取得
if (productCatalog.TryGetValue(1, out Product product))
{
    Console.WriteLine($"商品: {product.Name}");
}
\`\`\`

### HashSet<T> - 一意な要素の集合

重複を許さないコレクション：

\`\`\`csharp
// カテゴリの管理
var categories = new HashSet<string> { "電子機器", "書籍", "衣服" };
categories.Add("電子機器"); // 重複は追加されない

// 集合演算
var techCategories = new HashSet<string> { "電子機器", "ソフトウェア" };
var intersection = categories.Intersect(techCategories);
\`\`\`

## DDDでのコレクション活用

### エンティティでのコレクション管理

\`\`\`csharp
public class Order : Entity<int>
{
    private readonly List<OrderItem> _items;
    
    public Order(int id, int customerId) : base(id)
    {
        CustomerId = customerId;
        _items = new List<OrderItem>();
        Status = OrderStatus.Draft;
        OrderDate = DateTime.UtcNow;
    }
    
    public int CustomerId { get; private set; }
    public DateTime OrderDate { get; private set; }
    public OrderStatus Status { get; private set; }
    
    // 読み取り専用コレクションとして公開
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();
    
    // ビジネスロジックを含むアイテム追加
    public void AddItem(Product product, int quantity)
    {
        if (Status != OrderStatus.Draft)
            throw new InvalidOperationException("確定済みの注文は変更できません");
            
        if (quantity <= 0)
            throw new ArgumentException("数量は1以上である必要があります");
            
        var existingItem = _items.FirstOrDefault(i => i.ProductId == product.Id);
        if (existingItem != null)
        {
            existingItem.UpdateQuantity(existingItem.Quantity + quantity);
        }
        else
        {
            _items.Add(new OrderItem(product.Id, product.Name, product.Price, quantity));
        }
    }
    
    public void RemoveItem(int productId)
    {
        if (Status != OrderStatus.Draft)
            throw new InvalidOperationException("確定済みの注文は変更できません");
            
        var item = _items.FirstOrDefault(i => i.ProductId == productId);
        if (item != null)
        {
            _items.Remove(item);
        }
    }
    
    // ドメインロジック：合計金額計算
    public decimal CalculateTotal()
    {
        return _items.Sum(item => item.TotalPrice);
    }
    
    // ドメインロジック：注文確定
    public void Confirm()
    {
        if (!_items.Any())
            throw new InvalidOperationException("アイテムが空の注文は確定できません");
            
        Status = OrderStatus.Confirmed;
    }
}

public class OrderItem : ValueObject<OrderItem>
{
    public int ProductId { get; }
    public string ProductName { get; }
    public decimal UnitPrice { get; }
    public int Quantity { get; private set; }
    public decimal TotalPrice => UnitPrice * Quantity;
    
    public OrderItem(int productId, string productName, decimal unitPrice, int quantity)
    {
        if (quantity <= 0)
            throw new ArgumentException("数量は1以上である必要があります");
            
        ProductId = productId;
        ProductName = productName ?? throw new ArgumentNullException(nameof(productName));
        UnitPrice = unitPrice;
        Quantity = quantity;
    }
    
    public void UpdateQuantity(int newQuantity)
    {
        if (newQuantity <= 0)
            throw new ArgumentException("数量は1以上である必要があります");
            
        Quantity = newQuantity;
    }
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return ProductId;
        yield return UnitPrice;
        yield return Quantity;
    }
}

public enum OrderStatus
{
    Draft,
    Confirmed,
    Shipped,
    Delivered,
    Cancelled
}
\`\`\`

### ドメインサービスでのコレクション操作

\`\`\`csharp
public class ProductCatalogService
{
    private readonly Dictionary<string, List<Product>> _productsByCategory;
    private readonly HashSet<string> _validCategories;
    
    public ProductCatalogService()
    {
        _productsByCategory = new Dictionary<string, List<Product>>();
        _validCategories = new HashSet<string>
        {
            "電子機器", "書籍", "衣服", "食品", "スポーツ用品"
        };
    }
    
    public void AddProduct(Product product)
    {
        if (!_validCategories.Contains(product.Category))
            throw new ArgumentException($"無効なカテゴリ: {product.Category}");
            
        if (!_productsByCategory.ContainsKey(product.Category))
        {
            _productsByCategory[product.Category] = new List<Product>();
        }
        
        _productsByCategory[product.Category].Add(product);
    }
    
    public IReadOnlyList<Product> GetProductsByCategory(string category)
    {
        return _productsByCategory.TryGetValue(category, out var products) 
            ? products.AsReadOnly() 
            : new List<Product>().AsReadOnly();
    }
    
    public IReadOnlyList<string> GetAvailableCategories()
    {
        return _productsByCategory.Keys
            .Where(category => _productsByCategory[category].Any())
            .OrderBy(category => category)
            .ToList()
            .AsReadOnly();
    }
    
    public ProductCatalogStatistics GetStatistics()
    {
        var stats = new Dictionary<string, CategoryStatistics>();
        
        foreach (var category in _productsByCategory.Keys)
        {
            var products = _productsByCategory[category];
            stats[category] = new CategoryStatistics
            {
                ProductCount = products.Count,
                AveragePrice = products.Average(p => p.Price),
                MinPrice = products.Min(p => p.Price),
                MaxPrice = products.Max(p => p.Price)
            };
        }
        
        return new ProductCatalogStatistics(stats);
    }
}

public class CategoryStatistics
{
    public int ProductCount { get; set; }
    public decimal AveragePrice { get; set; }
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
}

public class ProductCatalogStatistics
{
    private readonly Dictionary<string, CategoryStatistics> _statistics;
    
    public ProductCatalogStatistics(Dictionary<string, CategoryStatistics> statistics)
    {
        _statistics = statistics ?? throw new ArgumentNullException(nameof(statistics));
    }
    
    public IReadOnlyDictionary<string, CategoryStatistics> Statistics => 
        new ReadOnlyDictionary<string, CategoryStatistics>(_statistics);
    
    public int TotalProducts => _statistics.Values.Sum(s => s.ProductCount);
    public decimal OverallAveragePrice => _statistics.Values.Average(s => s.AveragePrice);
}
\`\`\`

## 並行処理とコレクション

### ConcurrentCollection

マルチスレッド環境で安全に使用できるコレクション：

\`\`\`csharp
public class OrderProcessingService
{
    private readonly ConcurrentQueue<Order> _pendingOrders;
    private readonly ConcurrentDictionary<int, OrderStatus> _orderStatuses;
    
    public OrderProcessingService()
    {
        _pendingOrders = new ConcurrentQueue<Order>();
        _orderStatuses = new ConcurrentDictionary<int, OrderStatus>();
    }
    
    public void EnqueueOrder(Order order)
    {
        _pendingOrders.Enqueue(order);
        _orderStatuses.TryAdd(order.Id, OrderStatus.Queued);
    }
    
    public async Task ProcessOrdersAsync()
    {
        var tasks = new List<Task>();
        
        for (int i = 0; i < Environment.ProcessorCount; i++)
        {
            tasks.Add(Task.Run(ProcessOrderWorker));
        }
        
        await Task.WhenAll(tasks);
    }
    
    private async Task ProcessOrderWorker()
    {
        while (_pendingOrders.TryDequeue(out Order order))
        {
            try
            {
                _orderStatuses.TryUpdate(order.Id, OrderStatus.Processing, OrderStatus.Queued);
                
                // 注文処理のシミュレーション
                await Task.Delay(1000);
                
                _orderStatuses.TryUpdate(order.Id, OrderStatus.Completed, OrderStatus.Processing);
            }
            catch (Exception ex)
            {
                _orderStatuses.TryUpdate(order.Id, OrderStatus.Failed, OrderStatus.Processing);
                Console.WriteLine($"注文 {order.Id} の処理中にエラーが発生: {ex.Message}");
            }
        }
    }
    
    public OrderStatus GetOrderStatus(int orderId)
    {
        return _orderStatuses.TryGetValue(orderId, out var status) ? status : OrderStatus.NotFound;
    }
}

public enum OrderStatus
{
    Queued,
    Processing,
    Completed,
    Failed,
    NotFound
}
\`\`\`

## カスタムコレクション

ドメイン固有のコレクションクラスの作成：

\`\`\`csharp
public class CustomerCollection : IEnumerable<Customer>
{
    private readonly List<Customer> _customers;
    private readonly Dictionary<string, Customer> _customersByEmail;
    
    public CustomerCollection()
    {
        _customers = new List<Customer>();
        _customersByEmail = new Dictionary<string, Customer>();
    }
    
    public int Count => _customers.Count;
    
    public void Add(Customer customer)
    {
        if (customer == null)
            throw new ArgumentNullException(nameof(customer));
            
        if (_customersByEmail.ContainsKey(customer.Email.Value))
            throw new ArgumentException($"メールアドレス {customer.Email.Value} は既に登録されています");
            
        _customers.Add(customer);
        _customersByEmail[customer.Email.Value] = customer;
    }
    
    public Customer GetByEmail(string email)
    {
        return _customersByEmail.TryGetValue(email, out var customer) ? customer : null;
    }
    
    public bool Remove(Customer customer)
    {
        if (customer == null) return false;
        
        var removed = _customers.Remove(customer);
        if (removed)
        {
            _customersByEmail.Remove(customer.Email.Value);
        }
        return removed;
    }
    
    public IEnumerable<Customer> GetVipCustomers()
    {
        return _customers.Where(c => c.IsVip());
    }
    
    public IEnumerable<Customer> GetCustomersByRegion(string region)
    {
        return _customers.Where(c => c.Address.Region == region);
    }
    
    public IEnumerator<Customer> GetEnumerator()
    {
        return _customers.GetEnumerator();
    }
    
    IEnumerator IEnumerable.GetEnumerator()
    {
        return GetEnumerator();
    }
}
\`\`\`

## パフォーマンスとベストプラクティス

### コレクション選択の指針

1. **List<T>**: 順序付きデータ、インデックスアクセスが必要
2. **Dictionary<TKey, TValue>**: 高速な検索、キーベースアクセス
3. **HashSet<T>**: 一意性の保証、集合演算
4. **Queue<T>**: FIFO（先入先出）処理
5. **Stack<T>**: LIFO（後入先出）処理

### パフォーマンス最適化

\`\`\`csharp
public class OptimizedProductService
{
    // 容量を事前に指定して再配置を最小化
    private readonly List<Product> _products = new List<Product>(1000);
    
    // StringComparer.OrdinalIgnoreCaseで高速な文字列比較
    private readonly Dictionary<string, Product> _productsByName = 
        new Dictionary<string, Product>(StringComparer.OrdinalIgnoreCase);
    
    public void AddProducts(IEnumerable<Product> products)
    {
        // ToListで複数回の列挙を避ける
        var productList = products.ToList();
        
        // 容量を事前に拡張
        _products.Capacity = Math.Max(_products.Capacity, _products.Count + productList.Count);
        
        foreach (var product in productList)
        {
            _products.Add(product);
            _productsByName[product.Name] = product;
        }
    }
    
    // LINQ to Objectsの最適化
    public IEnumerable<Product> GetExpensiveProducts(decimal threshold)
    {
        // Where -> OrderBy -> Take の順序で効率化
        return _products
            .Where(p => p.Price > threshold)
            .OrderByDescending(p => p.Price)
            .Take(10);
    }
}
\`\`\`

## まとめ

コレクションはDDDにおけるデータ管理の基盤です：

- **適切なコレクション選択**: 用途に応じた最適なコレクション型の使用
- **カプセル化**: 読み取り専用コレクションによる不変性の保証
- **ドメインロジック**: コレクション操作にビジネスルールを組み込み
- **パフォーマンス**: 適切な容量設定と効率的な操作

次のレッスンでは、デリゲートとイベントについて学習し、より高度なオブジェクト間通信を理解します。
`,
  codeExamples: [
    {
      id: 'ddd-entity-collection-management',
      title: 'DDDエンティティでのコレクション管理',
      description: '注文エンティティでの注文アイテム管理の実装例',
      language: 'csharp',
      code: `using System;
using System.Collections.Generic;
using System.Linq;

// 抽象基底エンティティ
public abstract class Entity<TId> : IEquatable<Entity<TId>>
{
    public TId Id { get; protected set; }
    
    protected Entity(TId id)
    {
        Id = id;
    }
    
    public bool Equals(Entity<TId> other)
    {
        if (other == null) return false;
        return Id.Equals(other.Id);
    }
    
    public override bool Equals(object obj) => Equals(obj as Entity<TId>);
    public override int GetHashCode() => Id.GetHashCode();
}

// 値オブジェクト基底クラス
public abstract class ValueObject<T> : IEquatable<T> where T : ValueObject<T>
{
    protected abstract IEnumerable<object> GetEqualityComponents();
    
    public bool Equals(T other)
    {
        if (other == null) return false;
        return GetEqualityComponents().SequenceEqual(other.GetEqualityComponents());
    }
    
    public override bool Equals(object obj) => Equals(obj as T);
    
    public override int GetHashCode()
    {
        return GetEqualityComponents()
            .Where(x => x != null)
            .Select(x => x.GetHashCode())
            .Aggregate((x, y) => x ^ y);
    }
}

// 商品エンティティ
public class Product : Entity<int>
{
    public string Name { get; private set; }
    public decimal Price { get; private set; }
    public string Category { get; private set; }
    public bool IsAvailable { get; private set; }
    
    public Product(int id, string name, decimal price, string category) : base(id)
    {
        if (string.IsNullOrEmpty(name))
            throw new ArgumentException("商品名は必須です");
        if (price < 0)
            throw new ArgumentException("価格は0以上である必要があります");
            
        Name = name;
        Price = price;
        Category = category ?? throw new ArgumentNullException(nameof(category));
        IsAvailable = true;
    }
    
    public void UpdatePrice(decimal newPrice)
    {
        if (newPrice < 0)
            throw new ArgumentException("価格は0以上である必要があります");
        Price = newPrice;
    }
    
    public void Discontinue() => IsAvailable = false;
    public void Restock() => IsAvailable = true;
}

// 注文アイテム値オブジェクト
public class OrderItem : ValueObject<OrderItem>
{
    public int ProductId { get; }
    public string ProductName { get; }
    public decimal UnitPrice { get; }
    public int Quantity { get; private set; }
    public decimal TotalPrice => UnitPrice * Quantity;
    
    public OrderItem(int productId, string productName, decimal unitPrice, int quantity)
    {
        if (quantity <= 0)
            throw new ArgumentException("数量は1以上である必要があります");
        if (unitPrice < 0)
            throw new ArgumentException("単価は0以上である必要があります");
            
        ProductId = productId;
        ProductName = productName ?? throw new ArgumentNullException(nameof(productName));
        UnitPrice = unitPrice;
        Quantity = quantity;
    }
    
    public void UpdateQuantity(int newQuantity)
    {
        if (newQuantity <= 0)
            throw new ArgumentException("数量は1以上である必要があります");
        Quantity = newQuantity;
    }
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return ProductId;
        yield return UnitPrice;
        yield return Quantity;
    }
    
    public override string ToString()
    {
        return $"{ProductName} x{Quantity} = {TotalPrice:C}";
    }
}

// 注文エンティティ
public class Order : Entity<int>
{
    private readonly List<OrderItem> _items;
    
    public int CustomerId { get; private set; }
    public DateTime OrderDate { get; private set; }
    public OrderStatus Status { get; private set; }
    
    // 読み取り専用でアイテムを公開
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();
    
    public Order(int id, int customerId) : base(id)
    {
        CustomerId = customerId;
        _items = new List<OrderItem>();
        Status = OrderStatus.Draft;
        OrderDate = DateTime.UtcNow;
    }
    
    // ビジネスロジックを含むアイテム追加
    public void AddItem(Product product, int quantity)
    {
        ValidateOrderCanBeModified();
        
        if (!product.IsAvailable)
            throw new InvalidOperationException($"商品 '{product.Name}' は現在利用できません");
            
        var existingItem = _items.FirstOrDefault(i => i.ProductId == product.Id);
        if (existingItem != null)
        {
            // 既存アイテムの数量を更新
            existingItem.UpdateQuantity(existingItem.Quantity + quantity);
        }
        else
        {
            // 新しいアイテムを追加
            _items.Add(new OrderItem(product.Id, product.Name, product.Price, quantity));
        }
    }
    
    public void RemoveItem(int productId)
    {
        ValidateOrderCanBeModified();
        
        var item = _items.FirstOrDefault(i => i.ProductId == productId);
        if (item != null)
        {
            _items.Remove(item);
        }
    }
    
    public void UpdateItemQuantity(int productId, int newQuantity)
    {
        ValidateOrderCanBeModified();
        
        var item = _items.FirstOrDefault(i => i.ProductId == productId);
        if (item == null)
            throw new ArgumentException($"商品ID {productId} は注文に含まれていません");
            
        if (newQuantity <= 0)
        {
            _items.Remove(item);
        }
        else
        {
            item.UpdateQuantity(newQuantity);
        }
    }
    
    // ドメインロジック：合計金額計算
    public decimal CalculateSubtotal()
    {
        return _items.Sum(item => item.TotalPrice);
    }
    
    public decimal CalculateTax(decimal taxRate = 0.10m)
    {
        return CalculateSubtotal() * taxRate;
    }
    
    public decimal CalculateTotal(decimal taxRate = 0.10m)
    {
        return CalculateSubtotal() + CalculateTax(taxRate);
    }
    
    // ドメインロジック：注文確定
    public void Confirm()
    {
        if (!_items.Any())
            throw new InvalidOperationException("アイテムが空の注文は確定できません");
        if (Status != OrderStatus.Draft)
            throw new InvalidOperationException("既に確定済みの注文です");
            
        Status = OrderStatus.Confirmed;
    }
    
    public void Ship()
    {
        if (Status != OrderStatus.Confirmed)
            throw new InvalidOperationException("確定済みの注文のみ出荷できます");
            
        Status = OrderStatus.Shipped;
    }
    
    public void Deliver()
    {
        if (Status != OrderStatus.Shipped)
            throw new InvalidOperationException("出荷済みの注文のみ配達できます");
            
        Status = OrderStatus.Delivered;
    }
    
    public void Cancel()
    {
        if (Status == OrderStatus.Delivered)
            throw new InvalidOperationException("配達済みの注文はキャンセルできません");
            
        Status = OrderStatus.Cancelled;
    }
    
    // ドメインロジック：注文統計
    public OrderStatistics GetStatistics()
    {
        return new OrderStatistics
        {
            TotalItems = _items.Count,
            TotalQuantity = _items.Sum(i => i.Quantity),
            UniqueProducts = _items.Select(i => i.ProductId).Distinct().Count(),
            AverageItemPrice = _items.Any() ? _items.Average(i => i.UnitPrice) : 0,
            MostExpensiveItem = _items.OrderByDescending(i => i.UnitPrice).FirstOrDefault()?.ProductName,
            LeastExpensiveItem = _items.OrderBy(i => i.UnitPrice).FirstOrDefault()?.ProductName
        };
    }
    
    private void ValidateOrderCanBeModified()
    {
        if (Status != OrderStatus.Draft)
            throw new InvalidOperationException("確定済みの注文は変更できません");
    }
    
    public override string ToString()
    {
        return $"注文 #{Id} (顧客: {CustomerId}, 状態: {Status}, アイテム数: {_items.Count}, 合計: {CalculateTotal():C})";
    }
}

public enum OrderStatus
{
    Draft,      // 下書き
    Confirmed,  // 確定
    Shipped,    // 出荷済み
    Delivered,  // 配達済み
    Cancelled   // キャンセル済み
}

public class OrderStatistics
{
    public int TotalItems { get; set; }
    public int TotalQuantity { get; set; }
    public int UniqueProducts { get; set; }
    public decimal AverageItemPrice { get; set; }
    public string MostExpensiveItem { get; set; }
    public string LeastExpensiveItem { get; set; }
}

// 使用例
public class Program
{
    public static void Main()
    {
        // 商品の作成
        var laptop = new Product(1, "ノートPC", 120000, "電子機器");
        var mouse = new Product(2, "ワイヤレスマウス", 3000, "周辺機器");
        var keyboard = new Product(3, "メカニカルキーボード", 8000, "周辺機器");
        
        // 注文の作成
        var order = new Order(1001, 123);
        
        Console.WriteLine("=== 注文処理デモ ===");
        
        // アイテムの追加
        order.AddItem(laptop, 1);
        order.AddItem(mouse, 2);
        order.AddItem(keyboard, 1);
        
        Console.WriteLine("アイテム追加後:");
        foreach (var item in order.Items)
        {
            Console.WriteLine($"  {item}");
        }
        
        // 注文統計の表示
        var stats = order.GetStatistics();
        Console.WriteLine($"\\n注文統計:");
        Console.WriteLine($"  総アイテム数: {stats.TotalItems}");
        Console.WriteLine($"  総数量: {stats.TotalQuantity}");
        Console.WriteLine($"  ユニーク商品数: {stats.UniqueProducts}");
        Console.WriteLine($"  平均単価: {stats.AverageItemPrice:C}");
        Console.WriteLine($"  最高価格商品: {stats.MostExpensiveItem}");
        Console.WriteLine($"  最低価格商品: {stats.LeastExpensiveItem}");
        
        // 合計金額の計算
        Console.WriteLine($"\\n金額詳細:");
        Console.WriteLine($"  小計: {order.CalculateSubtotal():C}");
        Console.WriteLine($"  税額: {order.CalculateTax():C}");
        Console.WriteLine($"  総額: {order.CalculateTotal():C}");
        
        // 注文の確定
        order.Confirm();
        Console.WriteLine($"\\n注文状態: {order.Status}");
        
        // 数量の更新を試みる（エラーになる）
        try
        {
            order.UpdateItemQuantity(1, 2);
        }
        catch (InvalidOperationException ex)
        {
            Console.WriteLine($"\\nエラー: {ex.Message}");
        }
        
        Console.WriteLine($"\\n最終的な注文情報: {order}");
    }
}`
    },
    {
      id: 'custom-collections-concurrent-processing',
      title: 'カスタムコレクションと並行処理',
      description: '顧客コレクションと注文処理サービスの実装例',
      language: 'csharp',
      code: `using System;
using System.Collections;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;

// カスタム顧客コレクション
public class CustomerCollection : IEnumerable<Customer>
{
    private readonly List<Customer> _customers;
    private readonly Dictionary<string, Customer> _customersByEmail;
    private readonly Dictionary<int, Customer> _customersById;
    
    public CustomerCollection()
    {
        _customers = new List<Customer>();
        _customersByEmail = new Dictionary<string, Customer>(StringComparer.OrdinalIgnoreCase);
        _customersById = new Dictionary<int, Customer>();
    }
    
    public int Count => _customers.Count;
    
    public void Add(Customer customer)
    {
        if (customer == null)
            throw new ArgumentNullException(nameof(customer));
            
        if (_customersById.ContainsKey(customer.Id))
            throw new ArgumentException($"顧客ID {customer.Id} は既に存在します");
            
        if (_customersByEmail.ContainsKey(customer.Email))
            throw new ArgumentException($"メールアドレス {customer.Email} は既に登録されています");
            
        _customers.Add(customer);
        _customersByEmail[customer.Email] = customer;
        _customersById[customer.Id] = customer;
    }
    
    public Customer GetById(int id)
    {
        return _customersById.TryGetValue(id, out var customer) ? customer : null;
    }
    
    public Customer GetByEmail(string email)
    {
        return _customersByEmail.TryGetValue(email, out var customer) ? customer : null;
    }
    
    public bool Remove(Customer customer)
    {
        if (customer == null) return false;
        
        var removed = _customers.Remove(customer);
        if (removed)
        {
            _customersByEmail.Remove(customer.Email);
            _customersById.Remove(customer.Id);
        }
        return removed;
    }
    
    public IEnumerable<Customer> GetVipCustomers()
    {
        return _customers.Where(c => c.IsVip);
    }
    
    public IEnumerable<Customer> GetCustomersByCity(string city)
    {
        return _customers.Where(c => c.City.Equals(city, StringComparison.OrdinalIgnoreCase));
    }
    
    public IEnumerable<Customer> GetCustomersRegisteredAfter(DateTime date)
    {
        return _customers.Where(c => c.RegistrationDate > date);
    }
    
    public CustomerStatistics GetStatistics()
    {
        if (!_customers.Any())
        {
            return new CustomerStatistics();
        }
        
        return new CustomerStatistics
        {
            TotalCustomers = _customers.Count,
            VipCustomers = _customers.Count(c => c.IsVip),
            AveragePurchaseAmount = _customers.Average(c => c.TotalPurchaseAmount),
            CitiesRepresented = _customers.Select(c => c.City).Distinct().Count(),
            MostCommonCity = _customers
                .GroupBy(c => c.City)
                .OrderByDescending(g => g.Count())
                .First().Key,
            NewestRegistration = _customers.Max(c => c.RegistrationDate),
            OldestRegistration = _customers.Min(c => c.RegistrationDate)
        };
    }
    
    public IEnumerator<Customer> GetEnumerator()
    {
        return _customers.GetEnumerator();
    }
    
    IEnumerator IEnumerable.GetEnumerator()
    {
        return GetEnumerator();
    }
}

public class Customer
{
    public int Id { get; }
    public string Name { get; }
    public string Email { get; }
    public string City { get; }
    public DateTime RegistrationDate { get; }
    public decimal TotalPurchaseAmount { get; private set; }
    public bool IsVip => TotalPurchaseAmount >= 100000;
    
    public Customer(int id, string name, string email, string city)
    {
        Id = id;
        Name = name ?? throw new ArgumentNullException(nameof(name));
        Email = email ?? throw new ArgumentNullException(nameof(email));
        City = city ?? throw new ArgumentNullException(nameof(city));
        RegistrationDate = DateTime.UtcNow;
        TotalPurchaseAmount = 0;
    }
    
    public void AddPurchase(decimal amount)
    {
        if (amount < 0)
            throw new ArgumentException("購入金額は0以上である必要があります");
        TotalPurchaseAmount += amount;
    }
    
    public override string ToString()
    {
        return $"{Name} ({Email}) - {City} - {TotalPurchaseAmount:C}" + (IsVip ? " [VIP]" : "");
    }
}

public class CustomerStatistics
{
    public int TotalCustomers { get; set; }
    public int VipCustomers { get; set; }
    public decimal AveragePurchaseAmount { get; set; }
    public int CitiesRepresented { get; set; }
    public string MostCommonCity { get; set; }
    public DateTime NewestRegistration { get; set; }
    public DateTime OldestRegistration { get; set; }
}

// 並行処理対応の注文処理サービス
public class OrderProcessingService
{
    private readonly ConcurrentQueue<OrderProcessingRequest> _pendingOrders;
    private readonly ConcurrentDictionary<int, OrderProcessingStatus> _orderStatuses;
    private readonly ConcurrentDictionary<int, string> _processingResults;
    
    public OrderProcessingService()
    {
        _pendingOrders = new ConcurrentQueue<OrderProcessingRequest>();
        _orderStatuses = new ConcurrentDictionary<int, OrderProcessingStatus>();
        _processingResults = new ConcurrentDictionary<int, string>();
    }
    
    public void EnqueueOrder(int orderId, string customerName, decimal amount)
    {
        var request = new OrderProcessingRequest
        {
            OrderId = orderId,
            CustomerName = customerName,
            Amount = amount,
            SubmittedAt = DateTime.UtcNow
        };
        
        _pendingOrders.Enqueue(request);
        _orderStatuses.TryAdd(orderId, OrderProcessingStatus.Queued);
        
        Console.WriteLine($"注文 {orderId} をキューに追加しました");
    }
    
    public async Task ProcessOrdersAsync(int workerCount = 4)
    {
        Console.WriteLine($"{workerCount}個のワーカーで注文処理を開始します...");
        
        var tasks = new List<Task>();
        
        for (int i = 0; i < workerCount; i++)
        {
            int workerId = i + 1;
            tasks.Add(Task.Run(() => ProcessOrderWorker(workerId)));
        }
        
        await Task.WhenAll(tasks);
        Console.WriteLine("すべての注文処理が完了しました");
    }
    
    private async Task ProcessOrderWorker(int workerId)
    {
        while (_pendingOrders.TryDequeue(out OrderProcessingRequest request))
        {
            try
            {
                Console.WriteLine($"ワーカー {workerId}: 注文 {request.OrderId} の処理を開始");
                
                // ステータスを処理中に更新
                _orderStatuses.TryUpdate(request.OrderId, OrderProcessingStatus.Processing, OrderProcessingStatus.Queued);
                
                // 処理時間のシミュレーション（実際の処理時間を模擬）
                var processingTime = new Random().Next(1000, 3000);
                await Task.Delay(processingTime);
                
                // 処理結果の生成
                var result = $"注文 {request.OrderId} (顧客: {request.CustomerName}, 金額: {request.Amount:C}) を {processingTime}ms で処理完了";
                _processingResults.TryAdd(request.OrderId, result);
                
                // ステータスを完了に更新
                _orderStatuses.TryUpdate(request.OrderId, OrderProcessingStatus.Completed, OrderProcessingStatus.Processing);
                
                Console.WriteLine($"ワーカー {workerId}: {result}");
            }
            catch (Exception ex)
            {
                // エラー時の処理
                _orderStatuses.TryUpdate(request.OrderId, OrderProcessingStatus.Failed, OrderProcessingStatus.Processing);
                _processingResults.TryAdd(request.OrderId, $"エラー: {ex.Message}");
                
                Console.WriteLine($"ワーカー {workerId}: 注文 {request.OrderId} の処理中にエラーが発生: {ex.Message}");
            }
        }
        
        Console.WriteLine($"ワーカー {workerId}: 処理可能な注文がなくなりました");
    }
    
    public OrderProcessingStatus GetOrderStatus(int orderId)
    {
        return _orderStatuses.TryGetValue(orderId, out var status) ? status : OrderProcessingStatus.NotFound;
    }
    
    public string GetProcessingResult(int orderId)
    {
        return _processingResults.TryGetValue(orderId, out var result) ? result : "結果が見つかりません";
    }
    
    public ProcessingStatistics GetStatistics()
    {
        var statuses = _orderStatuses.Values.ToList();
        
        return new ProcessingStatistics
        {
            TotalOrders = statuses.Count,
            QueuedOrders = statuses.Count(s => s == OrderProcessingStatus.Queued),
            ProcessingOrders = statuses.Count(s => s == OrderProcessingStatus.Processing),
            CompletedOrders = statuses.Count(s => s == OrderProcessingStatus.Completed),
            FailedOrders = statuses.Count(s => s == OrderProcessingStatus.Failed),
            PendingInQueue = _pendingOrders.Count
        };
    }
}

public class OrderProcessingRequest
{
    public int OrderId { get; set; }
    public string CustomerName { get; set; }
    public decimal Amount { get; set; }
    public DateTime SubmittedAt { get; set; }
}

public enum OrderProcessingStatus
{
    NotFound,
    Queued,
    Processing,
    Completed,
    Failed
}

public class ProcessingStatistics
{
    public int TotalOrders { get; set; }
    public int QueuedOrders { get; set; }
    public int ProcessingOrders { get; set; }
    public int CompletedOrders { get; set; }
    public int FailedOrders { get; set; }
    public int PendingInQueue { get; set; }
    
    public override string ToString()
    {
        return $"処理統計: 総数:{TotalOrders}, 待機:{QueuedOrders}, 処理中:{ProcessingOrders}, 完了:{CompletedOrders}, 失敗:{FailedOrders}, キュー残:{PendingInQueue}";
    }
}

// デモプログラム
public class Program
{
    public static async Task Main()
    {
        Console.WriteLine("=== カスタムコレクションと並行処理のデモ ===\\n");
        
        // 顧客コレクションのデモ
        await DemonstrateCustomerCollection();
        
        Console.WriteLine("\\n" + new string('=', 50) + "\\n");
        
        // 並行処理のデモ
        await DemonstrateConcurrentProcessing();
    }
    
    private static async Task DemonstrateCustomerCollection()
    {
        Console.WriteLine("=== 顧客コレクションデモ ===");
        
        var customers = new CustomerCollection();
        
        // 顧客データの追加
        customers.Add(new Customer(1, "田中太郎", "tanaka@example.com", "東京"));
        customers.Add(new Customer(2, "鈴木花子", "suzuki@example.com", "大阪"));
        customers.Add(new Customer(3, "佐藤次郎", "sato@example.com", "東京"));
        customers.Add(new Customer(4, "高橋美咲", "takahashi@example.com", "名古屋"));
        
        // 購入履歴の追加
        customers.GetById(1)?.AddPurchase(150000);
        customers.GetById(2)?.AddPurchase(75000);
        customers.GetById(3)?.AddPurchase(200000);
        customers.GetById(4)?.AddPurchase(50000);
        
        Console.WriteLine("全顧客:");
        foreach (var customer in customers)
        {
            Console.WriteLine($"  {customer}");
        }
        
        Console.WriteLine("\\nVIP顧客:");
        foreach (var vip in customers.GetVipCustomers())
        {
            Console.WriteLine($"  {vip}");
        }
        
        Console.WriteLine("\\n東京の顧客:");
        foreach (var tokyo in customers.GetCustomersByCity("東京"))
        {
            Console.WriteLine($"  {tokyo}");
        }
        
        var stats = customers.GetStatistics();
        Console.WriteLine($"\\n顧客統計:");
        Console.WriteLine($"  総顧客数: {stats.TotalCustomers}");
        Console.WriteLine($"  VIP顧客数: {stats.VipCustomers}");
        Console.WriteLine($"  平均購入額: {stats.AveragePurchaseAmount:C}");
        Console.WriteLine($"  代表都市数: {stats.CitiesRepresented}");
        Console.WriteLine($"  最多都市: {stats.MostCommonCity}");
    }
    
    private static async Task DemonstrateConcurrentProcessing()
    {
        Console.WriteLine("=== 並行注文処理デモ ===");
        
        var processor = new OrderProcessingService();
        
        // 複数の注文をキューに追加
        var orders = new[]
        {
            (1001, "田中太郎", 15000m),
            (1002, "鈴木花子", 25000m),
            (1003, "佐藤次郎", 35000m),
            (1004, "高橋美咲", 45000m),
            (1005, "渡辺健一", 55000m),
            (1006, "山田愛子", 65000m),
            (1007, "中村洋介", 75000m),
            (1008, "小林真理", 85000m)
        };
        
        Console.WriteLine("注文をキューに追加中...");
        foreach (var (orderId, customerName, amount) in orders)
        {
            processor.EnqueueOrder(orderId, customerName, amount);
        }
        
        Console.WriteLine($"\\n{orders.Length}件の注文をキューに追加しました");
        Console.WriteLine($"処理開始前の統計: {processor.GetStatistics()}");
        
        // 並行処理の実行
        await processor.ProcessOrdersAsync(3); // 3つのワーカーで処理
        
        Console.WriteLine($"\\n処理完了後の統計: {processor.GetStatistics()}");
        
        // 処理結果の確認
        Console.WriteLine("\\n処理結果:");
        foreach (var (orderId, _, _) in orders)
        {
            var status = processor.GetOrderStatus(orderId);
            var result = processor.GetProcessingResult(orderId);
            Console.WriteLine($"  注文 {orderId}: {status} - {result}");
        }
    }
}`
    }
  ],
  exercises: [
    {
      id: 'collections-1',
      title: 'ショッピングカートの実装',
      description: 'ショッピングカートをコレクションを使用して実装してください。商品の追加、削除、数量変更、合計金額計算の機能を含めてください。',
      difficulty: 'medium',
      starterCode: `using System;
using System.Collections.Generic;
using System.Linq;

public class ShoppingCart
{
    private List<CartItem> _items;
    
    public ShoppingCart()
    {
        _items = new List<CartItem>();
    }
    
    public IReadOnlyList<CartItem> Items => _items.AsReadOnly();
    
    // 商品を追加（既存の場合は数量を増加）
    public void AddItem(int productId, string productName, decimal price, int quantity)
    {
        // TODO: 実装してください
        // 1. 既存アイテムがあるかチェック
        // 2. あれば数量を追加、なければ新規作成
    }
    
    // 商品を削除
    public void RemoveItem(int productId)
    {
        // TODO: 実装してください
    }
    
    // 数量を更新（0の場合は削除）
    public void UpdateQuantity(int productId, int newQuantity)
    {
        // TODO: 実装してください
    }
    
    // 合計金額を計算
    public decimal CalculateTotal()
    {
        // TODO: 実装してください
        return 0;
    }
    
    // カート内のアイテム数を返す
    public int GetTotalItemCount()
    {
        // TODO: 実装してください
        return 0;
    }
    
    // カートをクリア
    public void Clear()
    {
        // TODO: 実装してください
    }
}

public class CartItem
{
    public int ProductId { get; set; }
    public string ProductName { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice => Price * Quantity;
}`,
      solution: `public void AddItem(int productId, string productName, decimal price, int quantity)
{
    if (quantity <= 0)
        throw new ArgumentException("数量は1以上である必要があります");
        
    var existingItem = _items.FirstOrDefault(i => i.ProductId == productId);
    if (existingItem != null)
    {
        existingItem.Quantity += quantity;
    }
    else
    {
        _items.Add(new CartItem
        {
            ProductId = productId,
            ProductName = productName,
            Price = price,
            Quantity = quantity
        });
    }
}

public void RemoveItem(int productId)
{
    var item = _items.FirstOrDefault(i => i.ProductId == productId);
    if (item != null)
    {
        _items.Remove(item);
    }
}

public void UpdateQuantity(int productId, int newQuantity)
{
    if (newQuantity < 0)
        throw new ArgumentException("数量は0以上である必要があります");
        
    var item = _items.FirstOrDefault(i => i.ProductId == productId);
    if (item != null)
    {
        if (newQuantity == 0)
        {
            _items.Remove(item);
        }
        else
        {
            item.Quantity = newQuantity;
        }
    }
}

public decimal CalculateTotal()
{
    return _items.Sum(item => item.TotalPrice);
}

public int GetTotalItemCount()
{
    return _items.Sum(item => item.Quantity);
}

public void Clear()
{
    _items.Clear();
}`,
      hints: [
        'FirstOrDefault()メソッドを使用して既存アイテムを検索',
        'LINQのSum()メソッドで合計を計算',
        '数量が0の場合はアイテムを削除',
        '引数の妥当性をチェックしてArgumentExceptionを投げる'
      ],
      testCases: [
        {
          input: 'AddItem(1, "商品A", 1000, 2)',
          expectedOutput: 'カートに商品が追加され、合計金額が2000になる'
        },
        {
          input: '同じ商品をもう一度AddItem',
          expectedOutput: '数量が4になり、合計金額が4000になる'
        },
        {
          input: 'UpdateQuantity(1, 0)',
          expectedOutput: 'アイテムが削除され、カートが空になる'
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'collections-quiz-1',
      question: 'DDDにおいてエンティティ内のコレクションを外部に公開する際のベストプラクティスは？',
      options: [
        'Listをそのまま公開する',
        'IReadOnlyListとして公開する',
        'ArrayとしてToArray()で公開する',
        '公開しない'
      ],
      correctAnswer: 1,
      explanation: 'IReadOnlyListとして公開することで、外部からコレクションの変更を防ぎながら読み取りアクセスを提供できます。これによりカプセル化が保たれます。'
    },
    {
      id: 'collections-quiz-2',
      question: '高速な検索が必要で、重複を許さないデータの管理に最適なコレクションは？',
      options: [
        'List<T>',
        'Dictionary<TKey, TValue>',
        'HashSet<T>',
        'Queue<T>'
      ],
      correctAnswer: 2,
      explanation: 'HashSet<T>は重複を許さず、O(1)の平均的な検索性能を提供するため、一意な要素の集合管理に最適です。'
    }
  ],
  nextLesson: 'delegates',
  estimatedTime: 50
};