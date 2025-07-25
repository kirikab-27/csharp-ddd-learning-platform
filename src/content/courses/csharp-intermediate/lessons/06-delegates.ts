import type { Lesson } from '../../../../features/learning/types';

export const delegatesLesson: Lesson = {
  id: 'delegates',
  moduleId: 'delegates-events',
  title: 'デリゲート - 関数ポインタとコールバック',
  description: 'デリゲートを使用した関数の参照と呼び出し、コールバック機能、DDDでの活用方法を学習します',
  content: `
# デリゲート (Delegates)

デリゲートは、メソッドへの参照を格納する型で、関数ポインタのような役割を果たします。DDDでは、ドメインイベントやコールバック処理で重要な役割を担います。

## デリゲートとは？

デリゲートを使用することで以下が可能になります：

- **メソッドの動的な呼び出し**: 実行時にどのメソッドを呼び出すかを決定
- **コールバック機能**: 処理完了時に特定のメソッドを実行
- **関数を引数として渡す**: 高階関数の実装
- **イベント駆動アーキテクチャ**: ドメインイベントの実装基盤

## デリゲートの基本構文

### デリゲート型の宣言

\`\`\`csharp
// デリゲート型の宣言
public delegate void NotificationHandler(string message);
public delegate decimal CalculationDelegate(decimal amount);
public delegate bool ValidationDelegate<T>(T item);

// 使用例
public class NotificationService
{
    public void SendNotification(string message, NotificationHandler handler)
    {
        // 何らかの前処理
        Console.WriteLine("通知を準備中...");
        
        // デリゲートを呼び出し
        handler(message);
    }
}

// メソッドの定義
public static void EmailNotification(string message)
{
    Console.WriteLine($"メール送信: {message}");
}

public static void SmsNotification(string message)
{
    Console.WriteLine($"SMS送信: {message}");
}

// 使用
var service = new NotificationService();
service.SendNotification("Hello", EmailNotification);
service.SendNotification("Hello", SmsNotification);
\`\`\`

### ビルトインデリゲート

C#には便利なビルトインデリゲートが用意されています：

\`\`\`csharp
// Action - 戻り値がvoidのメソッド
Action<string> logger = message => Console.WriteLine($"[LOG] {message}");
Action<int, string> userAction = (id, name) => Console.WriteLine($"User {id}: {name}");

// Func - 戻り値があるメソッド
Func<int, int, int> add = (a, b) => a + b;
Func<string, bool> isValid = text => !string.IsNullOrEmpty(text);

// Predicate - boolを返すメソッド（主にコレクションで使用）
Predicate<int> isEven = number => number % 2 == 0;

// 使用例
logger("アプリケーション開始");
var result = add(5, 3);
var valid = isValid("test");
\`\`\`

## DDDでのデリゲート活用

### ドメインサービスでのコールバック

\`\`\`csharp
public class OrderProcessingService
{
    // デリゲート型の定義
    public delegate void OrderProcessedHandler(Order order, bool success, string message);
    public delegate bool OrderValidationHandler(Order order);
    
    private readonly List<OrderValidationHandler> _validators;
    
    public OrderProcessingService()
    {
        _validators = new List<OrderValidationHandler>();
    }
    
    // バリデーターを追加
    public void AddValidator(OrderValidationHandler validator)
    {
        _validators.Add(validator);
    }
    
    // 注文処理（コールバック付き）
    public void ProcessOrder(Order order, OrderProcessedHandler callback)
    {
        try
        {
            // 全てのバリデーターを実行
            foreach (var validator in _validators)
            {
                if (!validator(order))
                {
                    callback(order, false, "バリデーションエラー");
                    return;
                }
            }
            
            // 注文処理の実行
            order.Confirm();
            
            // 成功コールバック
            callback(order, true, "注文処理が完了しました");
        }
        catch (Exception ex)
        {
            // エラーコールバック
            callback(order, false, $"処理エラー: {ex.Message}");
        }
    }
}

// バリデーター関数の例
public static class OrderValidators
{
    public static bool ValidateMinimumAmount(Order order)
    {
        return order.CalculateTotal() >= 1000; // 最小注文金額
    }
    
    public static bool ValidateItemAvailability(Order order)
    {
        return order.Items.All(item => item.IsAvailable);
    }
    
    public static bool ValidateCustomerCredit(Order order)
    {
        // 顧客の信用度チェック
        return true; // 簡略化
    }
}
\`\`\`

### 関数型プログラミングスタイル

\`\`\`csharp
public class ProductService
{
    private readonly List<Product> _products;
    
    public ProductService(List<Product> products)
    {
        _products = products;
    }
    
    // 高階関数：フィルター条件を受け取る
    public List<Product> FilterProducts(Func<Product, bool> predicate)
    {
        return _products.Where(predicate).ToList();
    }
    
    // 高階関数：変換処理を受け取る
    public List<TResult> TransformProducts<TResult>(Func<Product, TResult> transformer)
    {
        return _products.Select(transformer).ToList();
    }
    
    // 高階関数：集約処理を受け取る
    public TResult AggregateProducts<TResult>(TResult seed, Func<TResult, Product, TResult> aggregator)
    {
        return _products.Aggregate(seed, aggregator);
    }
}

// 使用例
var service = new ProductService(products);

// フィルタリング
var expensiveProducts = service.FilterProducts(p => p.Price > 10000);
var electronicsProducts = service.FilterProducts(p => p.Category == "電子機器");

// 変換
var productNames = service.TransformProducts(p => p.Name);
var productSummaries = service.TransformProducts(p => new { p.Name, p.Price });

// 集約
var totalValue = service.AggregateProducts(0m, (sum, product) => sum + product.Price);
var categoryCount = service.AggregateProducts(
    new Dictionary<string, int>(),
    (dict, product) =>
    {
        dict[product.Category] = dict.ContainsKey(product.Category) 
            ? dict[product.Category] + 1 
            : 1;
        return dict;
    });
\`\`\`

## マルチキャストデリゲート

複数のメソッドを一度に呼び出すことができます：

\`\`\`csharp
public class OrderNotificationService
{
    // マルチキャストデリゲート
    public Action<Order> OrderConfirmed;
    
    public void ConfirmOrder(Order order)
    {
        order.Confirm();
        
        // 登録されたすべてのハンドラーを呼び出し
        OrderConfirmed?.Invoke(order);
    }
    
    public void AddNotificationHandler(Action<Order> handler)
    {
        OrderConfirmed += handler;
    }
    
    public void RemoveNotificationHandler(Action<Order> handler)
    {
        OrderConfirmed -= handler;
    }
}

// 通知ハンドラーの例
public static class NotificationHandlers
{
    public static void SendEmailNotification(Order order)
    {
        Console.WriteLine($"メール送信: 注文 {order.Id} が確定されました");
    }
    
    public static void UpdateInventory(Order order)
    {
        Console.WriteLine($"在庫更新: 注文 {order.Id} の商品を在庫から減らします");
    }
    
    public static void LogOrderConfirmation(Order order)
    {
        Console.WriteLine($"ログ記録: 注文 {order.Id} が {DateTime.Now} に確定されました");
    }
}

// 使用例
var notificationService = new OrderNotificationService();
notificationService.AddNotificationHandler(NotificationHandlers.SendEmailNotification);
notificationService.AddNotificationHandler(NotificationHandlers.UpdateInventory);
notificationService.AddNotificationHandler(NotificationHandlers.LogOrderConfirmation);

// 注文確定時に全てのハンドラーが呼び出される
notificationService.ConfirmOrder(order);
\`\`\`

## ドメインイベントパターン

DDDにおけるドメインイベントの実装基盤としてデリゲートを活用：

\`\`\`csharp
// ドメインイベントの基底クラス
public abstract class DomainEvent
{
    public DateTime OccurredOn { get; }
    public Guid EventId { get; }
    
    protected DomainEvent()
    {
        EventId = Guid.NewGuid();
        OccurredOn = DateTime.UtcNow;
    }
}

// 具体的なドメインイベント
public class OrderConfirmedEvent : DomainEvent
{
    public int OrderId { get; }
    public int CustomerId { get; }
    public decimal TotalAmount { get; }
    
    public OrderConfirmedEvent(int orderId, int customerId, decimal totalAmount)
    {
        OrderId = orderId;
        CustomerId = customerId;
        TotalAmount = totalAmount;
    }
}

public class ProductPurchasedEvent : DomainEvent
{
    public int ProductId { get; }
    public int Quantity { get; }
    public int CustomerId { get; }
    
    public ProductPurchasedEvent(int productId, int quantity, int customerId)
    {
        ProductId = productId;
        Quantity = quantity;
        CustomerId = customerId;
    }
}

// ドメインイベントハンドラー
public delegate void DomainEventHandler<T>(T domainEvent) where T : DomainEvent;

// ドメインイベントディスパッチャー
public class DomainEventDispatcher
{
    private readonly Dictionary<Type, List<Delegate>> _handlers;
    
    public DomainEventDispatcher()
    {
        _handlers = new Dictionary<Type, List<Delegate>>();
    }
    
    public void Subscribe<T>(DomainEventHandler<T> handler) where T : DomainEvent
    {
        var eventType = typeof(T);
        
        if (!_handlers.ContainsKey(eventType))
        {
            _handlers[eventType] = new List<Delegate>();
        }
        
        _handlers[eventType].Add(handler);
    }
    
    public void Unsubscribe<T>(DomainEventHandler<T> handler) where T : DomainEvent
    {
        var eventType = typeof(T);
        
        if (_handlers.ContainsKey(eventType))
        {
            _handlers[eventType].Remove(handler);
        }
    }
    
    public void Publish<T>(T domainEvent) where T : DomainEvent
    {
        var eventType = typeof(T);
        
        if (_handlers.ContainsKey(eventType))
        {
            foreach (var handler in _handlers[eventType])
            {
                if (handler is DomainEventHandler<T> typedHandler)
                {
                    typedHandler(domainEvent);
                }
            }
        }
    }
}

// ドメインイベントハンドラーの実装例
public class OrderEventHandlers
{
    public static void HandleOrderConfirmed(OrderConfirmedEvent eventArgs)
    {
        Console.WriteLine($"注文確定イベント処理: 注文ID {eventArgs.OrderId}, 金額 {eventArgs.TotalAmount:C}");
        
        // 実際の処理（メール送信、在庫更新など）
        SendConfirmationEmail(eventArgs.CustomerId, eventArgs.OrderId);
        UpdateCustomerStatistics(eventArgs.CustomerId, eventArgs.TotalAmount);
    }
    
    public static void HandleProductPurchased(ProductPurchasedEvent eventArgs)
    {
        Console.WriteLine($"商品購入イベント処理: 商品ID {eventArgs.ProductId}, 数量 {eventArgs.Quantity}");
        
        // 実際の処理（在庫減少、人気商品統計更新など）
        UpdateProductInventory(eventArgs.ProductId, eventArgs.Quantity);
        UpdateProductPopularity(eventArgs.ProductId);
    }
    
    private static void SendConfirmationEmail(int customerId, int orderId)
    {
        // メール送信処理
        Console.WriteLine($"確認メールを顧客 {customerId} に送信しました（注文 {orderId}）");
    }
    
    private static void UpdateCustomerStatistics(int customerId, decimal amount)
    {
        // 顧客統計更新処理
        Console.WriteLine($"顧客 {customerId} の購入統計を更新しました（+{amount:C}）");
    }
    
    private static void UpdateProductInventory(int productId, int quantity)
    {
        // 在庫更新処理
        Console.WriteLine($"商品 {productId} の在庫を {quantity} 減らしました");
    }
    
    private static void UpdateProductPopularity(int productId)
    {
        // 人気度更新処理
        Console.WriteLine($"商品 {productId} の人気度を更新しました");
    }
}
\`\`\`

## パフォーマンスとベストプラクティス

### デリゲートの最適化

\`\`\`csharp
public class OptimizedEventSystem
{
    // 頻繁に呼び出されるデリゲートはフィールドに保存
    private static readonly Action<string> _logger = message => Console.WriteLine(message);
    
    // デリゲートのキャッシュ
    private readonly Dictionary<string, Func<object, bool>> _validatorCache;
    
    public OptimizedEventSystem()
    {
        _validatorCache = new Dictionary<string, Func<object, bool>>();
    }
    
    // パフォーマンス重視のイベント処理
    public void ProcessEvent<T>(T eventData, string validatorKey) where T : class
    {
        // キャッシュされたバリデーターを取得
        if (_validatorCache.TryGetValue(validatorKey, out var validator))
        {
            if (validator(eventData))
            {
                // 高速ログ出力
                _logger($"イベント処理: {typeof(T).Name}");
            }
        }
    }
    
    // バリデーターの事前コンパイル
    public void RegisterValidator<T>(string key, Func<T, bool> validator) where T : class
    {
        _validatorCache[key] = obj => validator((T)obj);
    }
}
\`\`\`

### メモリリーク対策

\`\`\`csharp
public class SafeEventManager : IDisposable
{
    private event Action<string> _messageReceived;
    private bool _disposed;
    
    public void Subscribe(Action<string> handler)
    {
        if (_disposed) return;
        _messageReceived += handler;
    }
    
    public void Unsubscribe(Action<string> handler)
    {
        if (_disposed) return;
        _messageReceived -= handler;
    }
    
    public void PublishMessage(string message)
    {
        if (_disposed) return;
        _messageReceived?.Invoke(message);
    }
    
    public void Dispose()
    {
        if (!_disposed)
        {
            // 全てのイベントハンドラーをクリア
            _messageReceived = null;
            _disposed = true;
        }
    }
}
\`\`\`

## まとめ

デリゲートはC#における強力な機能です：

- **柔軟性**: 実行時にメソッドを選択可能
- **疎結合**: コンポーネント間の依存関係を削減
- **関数型プログラミング**: 高階関数の実装が可能
- **イベント駆動**: ドメインイベントパターンの基盤

DDDにおいては、ドメインイベントの実装やコールバック処理で重要な役割を果たします。

次のレッスンでは、イベントについて詳しく学習し、より高度なイベント駆動アーキテクチャを理解します。
`,
  codeExamples: [
    {
      id: 'domain-event-system-implementation',
      title: 'ドメインイベントシステムの実装',
      description: 'デリゲートを使用したドメインイベントパターンの完全実装',
      language: 'csharp',
      code: `using System;
using System.Collections.Generic;
using System.Linq;

// ドメインイベントの基底クラス
public abstract class DomainEvent
{
    public DateTime OccurredOn { get; }
    public Guid EventId { get; }
    
    protected DomainEvent()
    {
        EventId = Guid.NewGuid();
        OccurredOn = DateTime.UtcNow;
    }
}

// 具体的なドメインイベント
public class CustomerRegisteredEvent : DomainEvent
{
    public int CustomerId { get; }
    public string CustomerName { get; }
    public string Email { get; }
    
    public CustomerRegisteredEvent(int customerId, string customerName, string email)
    {
        CustomerId = customerId;
        CustomerName = customerName;
        Email = email;
    }
}

public class OrderPlacedEvent : DomainEvent
{
    public int OrderId { get; }
    public int CustomerId { get; }
    public decimal TotalAmount { get; }
    public List<OrderItemData> Items { get; }
    
    public OrderPlacedEvent(int orderId, int customerId, decimal totalAmount, List<OrderItemData> items)
    {
        OrderId = orderId;
        CustomerId = customerId;
        TotalAmount = totalAmount;
        Items = items ?? new List<OrderItemData>();
    }
}

public class OrderItemData
{
    public int ProductId { get; set; }
    public string ProductName { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class PaymentProcessedEvent : DomainEvent
{
    public int OrderId { get; }
    public decimal Amount { get; }
    public PaymentMethod Method { get; }
    public bool Success { get; }
    
    public PaymentProcessedEvent(int orderId, decimal amount, PaymentMethod method, bool success)
    {
        OrderId = orderId;
        Amount = amount;
        Method = method;
        Success = success;
    }
}

public enum PaymentMethod
{
    CreditCard,
    BankTransfer,
    PayPal,
    Cash
}

// デリゲート型の定義
public delegate void DomainEventHandler<in T>(T domainEvent) where T : DomainEvent;

// ドメインイベントディスパッチャー
public class DomainEventDispatcher
{
    private readonly Dictionary<Type, List<Delegate>> _handlers;
    private readonly List<(DateTime, string)> _eventLog;
    
    public DomainEventDispatcher()
    {
        _handlers = new Dictionary<Type, List<Delegate>>();
        _eventLog = new List<(DateTime, string)>();
    }
    
    // イベントハンドラーの登録
    public void Subscribe<T>(DomainEventHandler<T> handler) where T : DomainEvent
    {
        var eventType = typeof(T);
        
        if (!_handlers.ContainsKey(eventType))
        {
            _handlers[eventType] = new List<Delegate>();
        }
        
        _handlers[eventType].Add(handler);
        Console.WriteLine($"イベントハンドラーを登録しました: {eventType.Name}");
    }
    
    // イベントハンドラーの登録解除
    public void Unsubscribe<T>(DomainEventHandler<T> handler) where T : DomainEvent
    {
        var eventType = typeof(T);
        
        if (_handlers.ContainsKey(eventType))
        {
            _handlers[eventType].Remove(handler);
            Console.WriteLine($"イベントハンドラーを登録解除しました: {eventType.Name}");
        }
    }
    
    // イベントの発行
    public void Publish<T>(T domainEvent) where T : DomainEvent
    {
        var eventType = typeof(T);
        var eventName = eventType.Name;
        
        // イベントログに記録
        _eventLog.Add((domainEvent.OccurredOn, eventName));
        Console.WriteLine($"\\n[{domainEvent.OccurredOn:HH:mm:ss}] ドメインイベント発行: {eventName} (ID: {domainEvent.EventId})");
        
        // 登録されたハンドラーを呼び出し
        if (_handlers.ContainsKey(eventType))
        {
            var handlerCount = _handlers[eventType].Count;
            Console.WriteLine($"  → {handlerCount}個のハンドラーを実行中...");
            
            foreach (var handler in _handlers[eventType])
            {
                try
                {
                    if (handler is DomainEventHandler<T> typedHandler)
                    {
                        typedHandler(domainEvent);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"  ❌ ハンドラー実行エラー: {ex.Message}");
                }
            }
        }
        else
        {
            Console.WriteLine($"  ⚠️ 登録されたハンドラーがありません");
        }
    }
    
    // イベントログの表示
    public void ShowEventLog()
    {
        Console.WriteLine("\\n=== イベントログ ===");
        foreach (var (timestamp, eventName) in _eventLog)
        {
            Console.WriteLine($"[{timestamp:HH:mm:ss}] {eventName}");
        }
    }
    
    // 統計情報の表示
    public void ShowStatistics()
    {
        Console.WriteLine("\\n=== イベント統計 ===");
        Console.WriteLine($"総イベント数: {_eventLog.Count}");
        
        var eventCounts = _eventLog
            .GroupBy(log => log.Item2)
            .ToDictionary(g => g.Key, g => g.Count());
            
        foreach (var (eventName, count) in eventCounts)
        {
            Console.WriteLine($"  {eventName}: {count}回");
        }
        
        Console.WriteLine($"登録済みハンドラー数: {_handlers.Values.Sum(list => list.Count)}");
    }
}

// ドメインイベントハンドラーの実装
public static class CustomerEventHandlers
{
    public static void HandleCustomerRegistered(CustomerRegisteredEvent eventArgs)
    {
        Console.WriteLine($"    📧 顧客登録イベント処理: {eventArgs.CustomerName} ({eventArgs.Email})");
        
        // ウェルカムメールの送信
        SendWelcomeEmail(eventArgs.Email, eventArgs.CustomerName);
        
        // CRMシステムへの登録
        RegisterInCRM(eventArgs.CustomerId, eventArgs.CustomerName, eventArgs.Email);
        
        // マーケティングリストへの追加
        AddToMarketingList(eventArgs.Email);
    }
    
    private static void SendWelcomeEmail(string email, string name)
    {
        Console.WriteLine($"      ✉️ ウェルカムメールを送信: {email}");
    }
    
    private static void RegisterInCRM(int customerId, string name, string email)
    {
        Console.WriteLine($"      📋 CRMに顧客情報を登録: ID={customerId}");
    }
    
    private static void AddToMarketingList(string email)
    {
        Console.WriteLine($"      📈 マーケティングリストに追加: {email}");
    }
}

public static class OrderEventHandlers
{
    public static void HandleOrderPlaced(OrderPlacedEvent eventArgs)
    {
        Console.WriteLine($"    🛒 注文作成イベント処理: 注文ID={eventArgs.OrderId}, 金額={eventArgs.TotalAmount:C}");
        
        // 在庫の確保
        ReserveInventory(eventArgs.Items);
        
        // 注文確認メールの送信
        SendOrderConfirmationEmail(eventArgs.CustomerId, eventArgs.OrderId);
        
        // 支払い処理の開始
        InitiatePaymentProcess(eventArgs.OrderId, eventArgs.TotalAmount);
    }
    
    public static void HandleOrderPlacedForAnalytics(OrderPlacedEvent eventArgs)
    {
        Console.WriteLine($"    📊 注文分析イベント処理: 注文ID={eventArgs.OrderId}");
        
        // 販売分析データの更新
        UpdateSalesAnalytics(eventArgs);
        
        // 顧客行動分析
        AnalyzeCustomerBehavior(eventArgs.CustomerId, eventArgs.Items);
    }
    
    private static void ReserveInventory(List<OrderItemData> items)
    {
        foreach (var item in items)
        {
            Console.WriteLine($"      📦 在庫確保: {item.ProductName} x{item.Quantity}");
        }
    }
    
    private static void SendOrderConfirmationEmail(int customerId, int orderId)
    {
        Console.WriteLine($"      📧 注文確認メール送信: 顧客ID={customerId}, 注文ID={orderId}");
    }
    
    private static void InitiatePaymentProcess(int orderId, decimal amount)
    {
        Console.WriteLine($"      💳 支払い処理開始: 注文ID={orderId}, 金額={amount:C}");
    }
    
    private static void UpdateSalesAnalytics(OrderPlacedEvent eventArgs)
    {
        Console.WriteLine($"      📈 売上分析データ更新: {eventArgs.TotalAmount:C}");
    }
    
    private static void AnalyzeCustomerBehavior(int customerId, List<OrderItemData> items)
    {
        Console.WriteLine($"      🔍 顧客行動分析: 顧客ID={customerId}, 商品数={items.Count}");
    }
}

public static class PaymentEventHandlers
{
    public static void HandlePaymentProcessed(PaymentProcessedEvent eventArgs)
    {
        if (eventArgs.Success)
        {
            Console.WriteLine($"    💰 支払い成功イベント処理: 注文ID={eventArgs.OrderId}, 金額={eventArgs.Amount:C}");
            
            // 注文ステータスの更新
            UpdateOrderStatus(eventArgs.OrderId, "Paid");
            
            // 出荷処理の開始
            InitiateShipping(eventArgs.OrderId);
            
            // 売上レポートの更新
            UpdateRevenueReport(eventArgs.Amount, eventArgs.Method);
        }
        else
        {
            Console.WriteLine($"    ❌ 支払い失敗イベント処理: 注文ID={eventArgs.OrderId}");
            
            // 注文ステータスの更新
            UpdateOrderStatus(eventArgs.OrderId, "PaymentFailed");
            
            // 在庫の解放
            ReleaseInventory(eventArgs.OrderId);
            
            // 失敗通知の送信
            SendPaymentFailureNotification(eventArgs.OrderId);
        }
    }
    
    private static void UpdateOrderStatus(int orderId, string status)
    {
        Console.WriteLine($"      📋 注文ステータス更新: 注文ID={orderId}, ステータス={status}");
    }
    
    private static void InitiateShipping(int orderId)
    {
        Console.WriteLine($"      🚚 出荷処理開始: 注文ID={orderId}");
    }
    
    private static void UpdateRevenueReport(decimal amount, PaymentMethod method)
    {
        Console.WriteLine($"      💹 売上レポート更新: {amount:C} ({method})");
    }
    
    private static void ReleaseInventory(int orderId)
    {
        Console.WriteLine($"      📦 在庫解放: 注文ID={orderId}");
    }
    
    private static void SendPaymentFailureNotification(int orderId)
    {
        Console.WriteLine($"      📧 支払い失敗通知送信: 注文ID={orderId}");
    }
}

// デモプログラム
public class Program
{
    public static void Main()
    {
        Console.WriteLine("=== ドメインイベントシステムデモ ===");
        
        // イベントディスパッチャーの作成
        var eventDispatcher = new DomainEventDispatcher();
        
        // イベントハンドラーの登録
        Console.WriteLine("\\nイベントハンドラーを登録中...");
        
        // 顧客登録イベント
        eventDispatcher.Subscribe<CustomerRegisteredEvent>(CustomerEventHandlers.HandleCustomerRegistered);
        
        // 注文作成イベント（複数のハンドラー）
        eventDispatcher.Subscribe<OrderPlacedEvent>(OrderEventHandlers.HandleOrderPlaced);
        eventDispatcher.Subscribe<OrderPlacedEvent>(OrderEventHandlers.HandleOrderPlacedForAnalytics);
        
        // 支払い処理イベント
        eventDispatcher.Subscribe<PaymentProcessedEvent>(PaymentEventHandlers.HandlePaymentProcessed);
        
        Console.WriteLine("\\n=== ビジネスシナリオの実行 ===");
        
        // シナリオ1: 新規顧客登録
        Console.WriteLine("\\n--- シナリオ1: 新規顧客登録 ---");
        var customerRegisteredEvent = new CustomerRegisteredEvent(1, "田中太郎", "tanaka@example.com");
        eventDispatcher.Publish(customerRegisteredEvent);
        
        // シナリオ2: 注文作成
        Console.WriteLine("\\n--- シナリオ2: 注文作成 ---");
        var orderItems = new List<OrderItemData>
        {
            new OrderItemData { ProductId = 1, ProductName = "ノートPC", Quantity = 1, UnitPrice = 120000 },
            new OrderItemData { ProductId = 2, ProductName = "マウス", Quantity = 2, UnitPrice = 3000 }
        };
        var orderPlacedEvent = new OrderPlacedEvent(1001, 1, 126000, orderItems);
        eventDispatcher.Publish(orderPlacedEvent);
        
        // シナリオ3: 支払い成功
        Console.WriteLine("\\n--- シナリオ3: 支払い成功 ---");
        var paymentSuccessEvent = new PaymentProcessedEvent(1001, 126000, PaymentMethod.CreditCard, true);
        eventDispatcher.Publish(paymentSuccessEvent);
        
        // シナリオ4: 支払い失敗（別の注文）
        Console.WriteLine("\\n--- シナリオ4: 支払い失敗 ---");
        var paymentFailureEvent = new PaymentProcessedEvent(1002, 50000, PaymentMethod.CreditCard, false);
        eventDispatcher.Publish(paymentFailureEvent);
        
        // 統計情報の表示
        eventDispatcher.ShowEventLog();
        eventDispatcher.ShowStatistics();
        
        Console.WriteLine("\\n=== デモ完了 ===");
    }
}`
    },
    {
      id: 'functional-programming-business-logic',
      title: '関数型プログラミングスタイルのビジネスロジック',
      description: 'デリゲートを活用した関数型アプローチによるビジネスルールの実装',
      language: 'csharp',
      code: `using System;
using System.Collections.Generic;
using System.Linq;

// ビジネスルールを表現するためのデリゲート型
public delegate bool BusinessRule<T>(T item);
public delegate decimal PricingRule(Product product, Customer customer);
public delegate TResult BusinessLogic<T, TResult>(T input);

// 商品とカスタマー
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal BasePrice { get; set; }
    public string Category { get; set; }
    public bool IsOnSale { get; set; }
    public DateTime CreatedDate { get; set; }
    public int StockQuantity { get; set; }
}

public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; }
    public CustomerType Type { get; set; }
    public decimal TotalPurchases { get; set; }
    public DateTime RegistrationDate { get; set; }
    public string Region { get; set; }
}

public enum CustomerType
{
    Regular,
    Premium,
    VIP,
    Corporate
}

// 関数型ビジネスロジックサービス
public class FunctionalBusinessService
{
    // 価格計算ルールのコンポジション
    public static decimal CalculatePrice(Product product, Customer customer, params PricingRule[] rules)
    {
        return rules.Aggregate(product.BasePrice, (currentPrice, rule) => 
        {
            var adjustedPrice = rule(product, customer);
            Console.WriteLine($"    価格調整: {currentPrice:C} → {adjustedPrice:C} ({rule.Method.Name})");
            return adjustedPrice;
        });
    }
    
    // 複数のビジネスルールをAND条件で結合
    public static BusinessRule<T> And<T>(params BusinessRule<T>[] rules)
    {
        return item => rules.All(rule => rule(item));
    }
    
    // 複数のビジネスルールをOR条件で結合
    public static BusinessRule<T> Or<T>(params BusinessRule<T>[] rules)
    {
        return item => rules.Any(rule => rule(item));
    }
    
    // ビジネスルールを否定
    public static BusinessRule<T> Not<T>(BusinessRule<T> rule)
    {
        return item => !rule(item);
    }
    
    // 条件付きルール適用
    public static BusinessRule<T> When<T>(BusinessRule<T> condition, BusinessRule<T> thenRule)
    {
        return item => !condition(item) || thenRule(item);
    }
}

// 価格計算ルール集
public static class PricingRules
{
    // 顧客タイプ別割引
    public static PricingRule CustomerTypeDiscount => (product, customer) =>
    {
        var discount = customer.Type switch
        {
            CustomerType.Premium => 0.05m,  // 5%割引
            CustomerType.VIP => 0.10m,      // 10%割引
            CustomerType.Corporate => 0.15m, // 15%割引
            _ => 0m
        };
        
        return product.BasePrice * (1 - discount);
    };
    
    // 大量購入割引
    public static PricingRule VolumeDiscount => (product, customer) =>
    {
        var discount = customer.TotalPurchases switch
        {
            >= 1000000 => 0.20m,  // 100万円以上で20%割引
            >= 500000 => 0.15m,   // 50万円以上で15%割引
            >= 100000 => 0.10m,   // 10万円以上で10%割引
            _ => 0m
        };
        
        return product.BasePrice * (1 - discount);
    };
    
    // セール価格適用
    public static PricingRule SalePrice => (product, customer) =>
    {
        return product.IsOnSale ? product.BasePrice * 0.8m : product.BasePrice;
    };
    
    // 地域別価格調整
    public static PricingRule RegionalPricing => (product, customer) =>
    {
        var adjustment = customer.Region switch
        {
            "東京" => 1.05m,    // 5%増
            "大阪" => 1.02m,    // 2%増
            "地方" => 0.95m,    // 5%減
            _ => 1.0m
        };
        
        return product.BasePrice * adjustment;
    };
    
    // 新商品プレミアム価格
    public static PricingRule NewProductPremium => (product, customer) =>
    {
        var isNewProduct = (DateTime.Now - product.CreatedDate).TotalDays <= 30;
        return isNewProduct ? product.BasePrice * 1.1m : product.BasePrice;
    };
}

// 商品フィルタリングルール集
public static class ProductRules
{
    public static BusinessRule<Product> IsAvailable => product => product.StockQuantity > 0;
    
    public static BusinessRule<Product> IsOnSale => product => product.IsOnSale;
    
    public static BusinessRule<Product> IsExpensive => product => product.BasePrice >= 50000;
    
    public static BusinessRule<Product> IsNewProduct => product => 
        (DateTime.Now - product.CreatedDate).TotalDays <= 30;
    
    public static BusinessRule<Product> IsElectronics => product => 
        product.Category.Equals("電子機器", StringComparison.OrdinalIgnoreCase);
    
    public static BusinessRule<Product> PriceRange(decimal min, decimal max) => product =>
        product.BasePrice >= min && product.BasePrice <= max;
        
    public static BusinessRule<Product> CategoryEquals(string category) => product =>
        product.Category.Equals(category, StringComparison.OrdinalIgnoreCase);
}

// 顧客フィルタリングルール集
public static class CustomerRules
{
    public static BusinessRule<Customer> IsVIP => customer => customer.Type == CustomerType.VIP;
    
    public static BusinessRule<Customer> IsPremium => customer => 
        customer.Type == CustomerType.Premium || customer.Type == CustomerType.VIP;
    
    public static BusinessRule<Customer> IsHighValue => customer => customer.TotalPurchases >= 500000;
    
    public static BusinessRule<Customer> IsLongTerm => customer => 
        (DateTime.Now - customer.RegistrationDate).TotalDays >= 365;
    
    public static BusinessRule<Customer> IsFromRegion(string region) => customer =>
        customer.Region.Equals(region, StringComparison.OrdinalIgnoreCase);
}

// 高階関数を使用したビジネスロジック処理
public class BusinessLogicProcessor
{
    public static List<TResult> ProcessItems<TItem, TResult>(
        IEnumerable<TItem> items,
        BusinessRule<TItem> filter,
        Func<TItem, TResult> transformer)
    {
        return items
            .Where(item => filter(item))
            .Select(transformer)
            .ToList();
    }
    
    public static TResult ProcessWithFallback<TInput, TResult>(
        TInput input,
        BusinessLogic<TInput, TResult> primaryLogic,
        BusinessLogic<TInput, TResult> fallbackLogic)
    {
        try
        {
            return primaryLogic(input);
        }
        catch
        {
            return fallbackLogic(input);
        }
    }
    
    public static List<T> ApplyBusinessRules<T>(List<T> items, params BusinessRule<T>[] rules)
    {
        var combinedRule = FunctionalBusinessService.And(rules);
        return items.Where(item => combinedRule(item)).ToList();
    }
}

// デモプログラム
public class Program
{
    public static void Main()
    {
        Console.WriteLine("=== 関数型ビジネスロジックデモ ===\\n");
        
        // テストデータの準備
        var products = new List<Product>
        {
            new Product { Id = 1, Name = "ノートPC", BasePrice = 120000, Category = "電子機器", IsOnSale = true, CreatedDate = DateTime.Now.AddDays(-10), StockQuantity = 5 },
            new Product { Id = 2, Name = "マウス", BasePrice = 3000, Category = "周辺機器", IsOnSale = false, CreatedDate = DateTime.Now.AddDays(-60), StockQuantity = 50 },
            new Product { Id = 3, Name = "モニター", BasePrice = 45000, Category = "電子機器", IsOnSale = false, CreatedDate = DateTime.Now.AddDays(-5), StockQuantity = 0 },
            new Product { Id = 4, Name = "キーボード", BasePrice = 8000, Category = "周辺機器", IsOnSale = true, CreatedDate = DateTime.Now.AddDays(-90), StockQuantity = 20 }
        };
        
        var customers = new List<Customer>
        {
            new Customer { Id = 1, Name = "田中太郎", Type = CustomerType.VIP, TotalPurchases = 800000, RegistrationDate = DateTime.Now.AddYears(-2), Region = "東京" },
            new Customer { Id = 2, Name = "鈴木花子", Type = CustomerType.Premium, TotalPurchases = 200000, RegistrationDate = DateTime.Now.AddMonths(-6), Region = "大阪" },
            new Customer { Id = 3, Name = "佐藤次郎", Type = CustomerType.Regular, TotalPurchases = 50000, RegistrationDate = DateTime.Now.AddMonths(-3), Region = "地方" }
        };
        
        // シナリオ1: 複合ビジネスルールによる商品フィルタリング
        Console.WriteLine("=== シナリオ1: 複合商品フィルタリング ===");
        
        // 在庫があり、かつ（セール中または新商品）の商品を検索
        var availableAndPromotionalRule = FunctionalBusinessService.And(
            ProductRules.IsAvailable,
            FunctionalBusinessService.Or(ProductRules.IsOnSale, ProductRules.IsNewProduct)
        );
        
        var promotionalProducts = products.Where(p => availableAndPromotionalRule(p));
        
        Console.WriteLine("在庫があり、セール中または新商品:");
        foreach (var product in promotionalProducts)
        {
            Console.WriteLine($"  {product.Name} - {product.BasePrice:C} (在庫: {product.StockQuantity}, セール: {product.IsOnSale})");
        }
        
        // シナリオ2: 関数型価格計算
        Console.WriteLine("\\n=== シナリオ2: 関数型価格計算 ===");
        
        var targetProduct = products.First(p => p.Name == "ノートPC");
        var targetCustomer = customers.First(c => c.Name == "田中太郎");
        
        Console.WriteLine($"商品: {targetProduct.Name}, 基本価格: {targetProduct.BasePrice:C}");
        Console.WriteLine($"顧客: {targetCustomer.Name} ({targetCustomer.Type}, 累計購入: {targetCustomer.TotalPurchases:C})");
        Console.WriteLine("\\n価格計算プロセス:");
        
        var finalPrice = FunctionalBusinessService.CalculatePrice(
            targetProduct,
            targetCustomer,
            PricingRules.SalePrice,
            PricingRules.CustomerTypeDiscount,
            PricingRules.VolumeDiscount,
            PricingRules.RegionalPricing
        );
        
        Console.WriteLine($"\\n最終価格: {finalPrice:C}");
        
        // シナリオ3: 高階関数による顧客分析
        Console.WriteLine("\\n=== シナリオ3: 顧客分析 ===");
        
        // VIPかつ高価値顧客
        var vipHighValueCustomers = BusinessLogicProcessor.ApplyBusinessRules(
            customers,
            CustomerRules.IsVIP,
            CustomerRules.IsHighValue
        );
        
        Console.WriteLine("VIP かつ 高価値顧客:");
        foreach (var customer in vipHighValueCustomers)
        {
            Console.WriteLine($"  {customer.Name} - {customer.TotalPurchases:C}");
        }
        
        // シナリオ4: 商品推薦ロジック
        Console.WriteLine("\\n=== シナリオ4: 商品推薦ロジック ===");
        
        foreach (var customer in customers)
        {
            Console.WriteLine($"\\n{customer.Name} への推薦商品:");
            
            // 顧客タイプに基づく推薦ロジック
            BusinessRule<Product> recommendationRule = customer.Type switch
            {
                CustomerType.VIP => FunctionalBusinessService.Or(ProductRules.IsExpensive, ProductRules.IsNewProduct),
                CustomerType.Premium => FunctionalBusinessService.And(ProductRules.IsAvailable, ProductRules.IsOnSale),
                _ => FunctionalBusinessService.And(ProductRules.IsAvailable, ProductRules.PriceRange(0, 10000))
            };
            
            var recommendedProducts = products.Where(p => recommendationRule(p));
            
            foreach (var product in recommendedProducts)
            {
                var price = FunctionalBusinessService.CalculatePrice(product, customer, PricingRules.CustomerTypeDiscount);
                Console.WriteLine($"  {product.Name} - {price:C} (元価格: {product.BasePrice:C})");
            }
        }
        
        // シナリオ5: エラーハンドリング付きロジック
        Console.WriteLine("\\n=== シナリオ5: フォールバック付きロジック ===");
        
        BusinessLogic<Product, decimal> primaryPricingLogic = product =>
        {
            if (product.Category == "特殊商品") // 存在しないカテゴリ
                throw new InvalidOperationException("特殊商品の価格計算エラー");
            return product.BasePrice * 1.1m;
        };
        
        BusinessLogic<Product, decimal> fallbackPricingLogic = product => product.BasePrice;
        
        foreach (var product in products.Take(2))
        {
            var safePrice = BusinessLogicProcessor.ProcessWithFallback(
                product,
                primaryPricingLogic,
                fallbackPricingLogic
            );
            
            Console.WriteLine($"{product.Name}: {safePrice:C} (フォールバック処理適用)");
        }
        
        Console.WriteLine("\\n=== デモ完了 ===");
    }
}`
    }
  ],
  exercises: [
    {
      id: 'delegates-1',
      title: 'イベント通知システムの実装',
      description: 'デリゲートを使用して、注文処理の各段階で異なる通知を送信するシステムを実装してください。',
      difficulty: 'medium',
      starterCode: `using System;
using System.Collections.Generic;

// デリゲート型の定義
public delegate void OrderEventHandler(Order order);

public class Order
{
    public int Id { get; set; }
    public string CustomerName { get; set; }
    public decimal Amount { get; set; }
    public OrderStatus Status { get; set; }
}

public enum OrderStatus
{
    Created,
    Confirmed,
    Shipped,
    Delivered
}

public class OrderProcessor
{
    // イベントハンドラーを格納するフィールド
    public OrderEventHandler OrderConfirmed;
    public OrderEventHandler OrderShipped;
    public OrderEventHandler OrderDelivered;
    
    public void ProcessOrder(Order order)
    {
        // TODO: 注文を確定し、OrderConfirmedイベントを発火
        
        // TODO: 注文を出荷し、OrderShippedイベントを発火
        
        // TODO: 注文を配送完了し、OrderDeliveredイベントを発火
    }
    
    public void AddConfirmationHandler(OrderEventHandler handler)
    {
        // TODO: 確定イベントハンドラーを追加
    }
    
    public void AddShippingHandler(OrderEventHandler handler)
    {
        // TODO: 出荷イベントハンドラーを追加
    }
    
    public void AddDeliveryHandler(OrderEventHandler handler)
    {
        // TODO: 配送イベントハンドラーを追加
    }
}

// 通知ハンドラーの実装例
public static class NotificationHandlers
{
    public static void SendEmailNotification(Order order)
    {
        Console.WriteLine($"メール送信: 注文{order.Id}が{order.Status}になりました");
    }
    
    public static void SendSmsNotification(Order order)
    {
        Console.WriteLine($"SMS送信: 注文{order.Id}が{order.Status}になりました");
    }
    
    public static void UpdateInventory(Order order)
    {
        Console.WriteLine($"在庫更新: 注文{order.Id}の商品を在庫から減らします");
    }
}`,
      solution: `public void ProcessOrder(Order order)
{
    // 注文確定
    order.Status = OrderStatus.Confirmed;
    OrderConfirmed?.Invoke(order);
    
    // 注文出荷
    order.Status = OrderStatus.Shipped;
    OrderShipped?.Invoke(order);
    
    // 注文配送完了
    order.Status = OrderStatus.Delivered;
    OrderDelivered?.Invoke(order);
}

public void AddConfirmationHandler(OrderEventHandler handler)
{
    OrderConfirmed += handler;
}

public void AddShippingHandler(OrderEventHandler handler)
{
    OrderShipped += handler;
}

public void AddDeliveryHandler(OrderEventHandler handler)
{
    OrderDelivered += handler;
}`,
      hints: [
        'マルチキャストデリゲートの += 演算子を使用してハンドラーを追加',
        '?. 演算子を使用してnullチェック付きでデリゲートを呼び出し',
        '各段階で注文のStatusを更新してからイベントを発火',
        'Invoke()メソッドまたは直接呼び出しでデリゲートを実行'
      ],
      testCases: [
        {
          input: 'AddConfirmationHandler(SendEmailNotification), ProcessOrder(order)',
          expectedOutput: '注文確定時にメール通知が送信される'
        },
        {
          input: '複数のハンドラーを追加して ProcessOrder を実行',
          expectedOutput: '各段階で登録されたすべてのハンドラーが実行される'
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'delegates-quiz-1',
      question: 'デリゲートのマルチキャスト機能について正しい説明はどれですか？',
      options: [
        '一つのデリゲートに複数のメソッドを登録し、一度に呼び出すことができる',
        'デリゲートを複数のスレッドで同時に実行することができる',
        'デリゲートの戻り値を複数の変数に代入することができる',
        'デリゲートを継承して新しいデリゲート型を作成することができる'
      ],
      correctAnswer: 0,
      explanation: 'マルチキャストデリゲートは += 演算子で複数のメソッドを登録し、Invoke()または直接呼び出しで全てのメソッドを順次実行する機能です。'
    },
    {
      id: 'delegates-quiz-2',
      question: 'DDDにおけるドメインイベントパターンでデリゲートを使用する主な利点は？',
      options: [
        'パフォーマンスの向上',
        '疎結合な設計とイベント駆動アーキテクチャの実現',
        'メモリ使用量の削減',
        'デバッグの簡略化'
      ],
      correctAnswer: 1,
      explanation: 'デリゲートを使用することで、ドメインイベントの発行者と受信者を疎結合にし、イベント駆動型の柔軟なアーキテクチャを構築できます。'
    }
  ],
  nextLesson: 'events',
  estimatedTime: 55
};