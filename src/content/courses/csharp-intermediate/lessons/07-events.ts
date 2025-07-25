import type { Lesson } from '../../../../features/learning/types';

export const eventsLesson: Lesson = {
  id: 'events',
  moduleId: 'delegates-events',
  title: 'イベント - パブリッシャー・サブスクライバーパターン',
  description: 'C#のイベント機能を理解し、DDDでのドメインイベントや通知システムの実装方法を学習します',
  content: `
# イベント (Events)

イベントは、デリゲートをベースとした特殊な仕組みで、パブリッシャー・サブスクライバーパターンを実装するためのC#の言語機能です。DDDでは、ドメインイベントの実装に不可欠な要素です。

## イベントとデリゲートの違い

イベントはデリゲートの特殊な形式で、以下の制約があります：

- **カプセル化**: クラス外部から直接 = による代入ができない
- **安全性**: 外部からはイベントの発火（直接呼び出し）ができない
- **購読管理**: += と -= による購読の追加・削除のみ可能

\`\`\`csharp
public class Publisher
{
    // デリゲート（制約なし）
    public Action<string> OnMessageDelegate;
    
    // イベント（制約あり）
    public event Action<string> OnMessageEvent;
    
    public void TriggerBoth(string message)
    {
        // 両方とも内部から呼び出し可能
        OnMessageDelegate?.Invoke(message);
        OnMessageEvent?.Invoke(message);
    }
}

public class Subscriber
{
    public void TestAccess(Publisher pub)
    {
        // デリゲートは自由にアクセス可能
        pub.OnMessageDelegate = msg => Console.WriteLine(msg);  // OK
        pub.OnMessageDelegate += msg => Console.WriteLine(msg); // OK
        pub.OnMessageDelegate("test");                          // OK
        
        // イベントは制限されたアクセスのみ
        // pub.OnMessageEvent = msg => Console.WriteLine(msg);  // コンパイルエラー
        pub.OnMessageEvent += msg => Console.WriteLine(msg);   // OK
        // pub.OnMessageEvent("test");                          // コンパイルエラー
    }
}
\`\`\`

## イベントの基本実装

### 標準的なイベントパターン

\`\`\`csharp
// EventArgsを継承したイベント引数クラス
public class OrderEventArgs : EventArgs
{
    public int OrderId { get; }
    public string CustomerName { get; }
    public decimal Amount { get; }
    public DateTime Timestamp { get; }
    
    public OrderEventArgs(int orderId, string customerName, decimal amount)
    {
        OrderId = orderId;
        CustomerName = customerName;
        Amount = amount;
        Timestamp = DateTime.UtcNow;
    }
}

// イベントを発行するクラス
public class OrderService
{
    // 標準的なイベント宣言パターン
    public event EventHandler<OrderEventArgs> OrderCreated;
    public event EventHandler<OrderEventArgs> OrderConfirmed;
    public event EventHandler<OrderEventArgs> OrderCancelled;
    
    public void CreateOrder(int orderId, string customerName, decimal amount)
    {
        // ビジネスロジック
        Console.WriteLine($"注文を作成中: ID={orderId}, 顧客={customerName}, 金額={amount:C}");
        
        // イベントの発火
        OnOrderCreated(new OrderEventArgs(orderId, customerName, amount));
    }
    
    public void ConfirmOrder(int orderId, string customerName, decimal amount)
    {
        Console.WriteLine($"注文を確定中: ID={orderId}");
        OnOrderConfirmed(new OrderEventArgs(orderId, customerName, amount));
    }
    
    public void CancelOrder(int orderId, string customerName, decimal amount)
    {
        Console.WriteLine($"注文をキャンセル中: ID={orderId}");
        OnOrderCancelled(new OrderEventArgs(orderId, customerName, amount));
    }
    
    // イベント発火用のprotectedメソッド（仮想メソッドパターン）
    protected virtual void OnOrderCreated(OrderEventArgs e)
    {
        OrderCreated?.Invoke(this, e);
    }
    
    protected virtual void OnOrderConfirmed(OrderEventArgs e)
    {
        OrderConfirmed?.Invoke(this, e);
    }
    
    protected virtual void OnOrderCancelled(OrderEventArgs e)
    {
        OrderCancelled?.Invoke(this, e);
    }
}
\`\`\`

## DDDでのドメインイベント実装

### ドメインイベントの設計

\`\`\`csharp
// ドメインイベントの基底インターフェース
public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredOn { get; }
}

// ドメインイベントの基底クラス
public abstract class DomainEventBase : IDomainEvent
{
    public Guid EventId { get; }
    public DateTime OccurredOn { get; }
    
    protected DomainEventBase()
    {
        EventId = Guid.NewGuid();
        OccurredOn = DateTime.UtcNow;
    }
}

// 具体的なドメインイベント
public class CustomerRegisteredEvent : DomainEventBase
{
    public int CustomerId { get; }
    public string CustomerName { get; }
    public string Email { get; }
    public CustomerType CustomerType { get; }
    
    public CustomerRegisteredEvent(int customerId, string customerName, string email, CustomerType customerType)
    {
        CustomerId = customerId;
        CustomerName = customerName;
        Email = email;
        CustomerType = customerType;
    }
}

public class OrderPlacedEvent : DomainEventBase
{
    public int OrderId { get; }
    public int CustomerId { get; }
    public List<OrderItem> Items { get; }
    public decimal TotalAmount { get; }
    
    public OrderPlacedEvent(int orderId, int customerId, List<OrderItem> items, decimal totalAmount)
    {
        OrderId = orderId;
        CustomerId = customerId;
        Items = items ?? new List<OrderItem>();
        TotalAmount = totalAmount;
    }
}

public class PaymentProcessedEvent : DomainEventBase
{
    public int OrderId { get; }
    public int CustomerId { get; }
    public decimal Amount { get; }
    public bool IsSuccessful { get; }
    public string PaymentMethod { get; }
    
    public PaymentProcessedEvent(int orderId, int customerId, decimal amount, bool isSuccessful, string paymentMethod)
    {
        OrderId = orderId;
        CustomerId = customerId;
        Amount = amount;
        IsSuccessful = isSuccessful;
        PaymentMethod = paymentMethod;
    }
}

public enum CustomerType
{
    Individual,
    Corporate,
    Premium
}

public class OrderItem
{
    public int ProductId { get; set; }
    public string ProductName { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice => Quantity * UnitPrice;
}
\`\`\`

### ドメインイベントディスパッチャー

\`\`\`csharp
// ドメインイベントハンドラーのインターフェース
public interface IDomainEventHandler<in T> where T : IDomainEvent
{
    Task HandleAsync(T domainEvent);
}

// ドメインイベントディスパッチャー
public class DomainEventDispatcher
{
    private readonly Dictionary<Type, List<object>> _handlers;
    private readonly List<IDomainEvent> _eventHistory;
    
    public DomainEventDispatcher()
    {
        _handlers = new Dictionary<Type, List<object>>();
        _eventHistory = new List<IDomainEvent>();
    }
    
    // ハンドラーの登録
    public void RegisterHandler<T>(IDomainEventHandler<T> handler) where T : IDomainEvent
    {
        var eventType = typeof(T);
        
        if (!_handlers.ContainsKey(eventType))
        {
            _handlers[eventType] = new List<object>();
        }
        
        _handlers[eventType].Add(handler);
        Console.WriteLine($"ハンドラーを登録しました: {eventType.Name} -> {handler.GetType().Name}");
    }
    
    // イベントの発行
    public async Task PublishAsync<T>(T domainEvent) where T : IDomainEvent
    {
        var eventType = typeof(T);
        
        // イベント履歴に追加
        _eventHistory.Add(domainEvent);
        
        Console.WriteLine($"\\n[{domainEvent.OccurredOn:HH:mm:ss}] ドメインイベント発行: {eventType.Name}");
        Console.WriteLine($"  EventId: {domainEvent.EventId}");
        
        // 登録されたハンドラーを実行
        if (_handlers.ContainsKey(eventType))
        {
            var handlers = _handlers[eventType].Cast<IDomainEventHandler<T>>();
            var tasks = handlers.Select(handler => 
            {
                Console.WriteLine($"  → {handler.GetType().Name} を実行中...");
                return handler.HandleAsync(domainEvent);
            });
            
            await Task.WhenAll(tasks);
        }
        else
        {
            Console.WriteLine($"  ⚠️ 登録されたハンドラーがありません");
        }
    }
    
    // イベント履歴の取得
    public IReadOnlyList<IDomainEvent> GetEventHistory()
    {
        return _eventHistory.AsReadOnly();
    }
    
    // 特定の型のイベント履歴を取得
    public IEnumerable<T> GetEventHistory<T>() where T : IDomainEvent
    {
        return _eventHistory.OfType<T>();
    }
}
\`\`\`

### ドメインイベントハンドラーの実装

\`\`\`csharp
// 顧客登録イベントハンドラー
public class WelcomeEmailHandler : IDomainEventHandler<CustomerRegisteredEvent>
{
    public async Task HandleAsync(CustomerRegisteredEvent domainEvent)
    {
        await Task.Delay(100); // メール送信の模擬
        Console.WriteLine($"    📧 ウェルカムメールを送信: {domainEvent.Email}");
    }
}

public class CustomerAnalyticsHandler : IDomainEventHandler<CustomerRegisteredEvent>
{
    public async Task HandleAsync(CustomerRegisteredEvent domainEvent)
    {
        await Task.Delay(50); // 分析処理の模擬
        Console.WriteLine($"    📊 顧客分析データを更新: 顧客ID={domainEvent.CustomerId}");
    }
}

// 注文作成イベントハンドラー
public class InventoryReservationHandler : IDomainEventHandler<OrderPlacedEvent>
{
    public async Task HandleAsync(OrderPlacedEvent domainEvent)
    {
        await Task.Delay(200); // 在庫処理の模擬
        Console.WriteLine($"    📦 在庫を確保: 注文ID={domainEvent.OrderId}");
        
        foreach (var item in domainEvent.Items)
        {
            Console.WriteLine($"      - {item.ProductName} x{item.Quantity}");
        }
    }
}

public class OrderNotificationHandler : IDomainEventHandler<OrderPlacedEvent>
{
    public async Task HandleAsync(OrderPlacedEvent domainEvent)
    {
        await Task.Delay(150); // 通知送信の模擬
        Console.WriteLine($"    🔔 注文確認通知を送信: 注文ID={domainEvent.OrderId}, 金額={domainEvent.TotalAmount:C}");
    }
}

// 支払い処理イベントハンドラー
public class PaymentSuccessHandler : IDomainEventHandler<PaymentProcessedEvent>
{
    public async Task HandleAsync(PaymentProcessedEvent domainEvent)
    {
        if (domainEvent.IsSuccessful)
        {
            await Task.Delay(100);
            Console.WriteLine($"    💰 支払い成功処理: 注文ID={domainEvent.OrderId}, 方法={domainEvent.PaymentMethod}");
            Console.WriteLine($"    🚚 出荷処理を開始: 注文ID={domainEvent.OrderId}");
        }
        else
        {
            await Task.Delay(50);
            Console.WriteLine($"    ❌ 支払い失敗処理: 注文ID={domainEvent.OrderId}");
            Console.WriteLine($"    📧 支払い失敗通知を送信");
        }
    }
}

public class SalesAnalyticsHandler : IDomainEventHandler<PaymentProcessedEvent>
{
    public async Task HandleAsync(PaymentProcessedEvent domainEvent)
    {
        if (domainEvent.IsSuccessful)
        {
            await Task.Delay(75);
            Console.WriteLine($"    📈 売上分析データを更新: +{domainEvent.Amount:C}");
        }
    }
}
\`\`\`

## リアルタイム通知システム

### 観察者パターンの実装

\`\`\`csharp
// 通知の種類
public enum NotificationType
{
    Info,
    Warning,
    Error,
    Success
}

// 通知イベント引数
public class NotificationEventArgs : EventArgs
{
    public string Message { get; }
    public NotificationType Type { get; }
    public DateTime Timestamp { get; }
    public string Source { get; }
    
    public NotificationEventArgs(string message, NotificationType type, string source)
    {
        Message = message;
        Type = type;
        Source = source;
        Timestamp = DateTime.UtcNow;
    }
}

// 通知サービス
public class NotificationService
{
    // 各種通知イベント
    public event EventHandler<NotificationEventArgs> NotificationSent;
    public event EventHandler<NotificationEventArgs> InfoNotification;
    public event EventHandler<NotificationEventArgs> WarningNotification;
    public event EventHandler<NotificationEventArgs> ErrorNotification;
    public event EventHandler<NotificationEventArgs> SuccessNotification;
    
    public void SendNotification(string message, NotificationType type, string source = "System")
    {
        var args = new NotificationEventArgs(message, type, source);
        
        // 全通知イベント
        OnNotificationSent(args);
        
        // 種類別イベント
        switch (type)
        {
            case NotificationType.Info:
                OnInfoNotification(args);
                break;
            case NotificationType.Warning:
                OnWarningNotification(args);
                break;
            case NotificationType.Error:
                OnErrorNotification(args);
                break;
            case NotificationType.Success:
                OnSuccessNotification(args);
                break;
        }
    }
    
    protected virtual void OnNotificationSent(NotificationEventArgs e)
    {
        NotificationSent?.Invoke(this, e);
    }
    
    protected virtual void OnInfoNotification(NotificationEventArgs e)
    {
        InfoNotification?.Invoke(this, e);
    }
    
    protected virtual void OnWarningNotification(NotificationEventArgs e)
    {
        WarningNotification?.Invoke(this, e);
    }
    
    protected virtual void OnErrorNotification(NotificationEventArgs e)
    {
        ErrorNotification?.Invoke(this, e);
    }
    
    protected virtual void OnSuccessNotification(NotificationEventArgs e)
    {
        SuccessNotification?.Invoke(this, e);
    }
}

// 通知リスナーの実装例
public class ConsoleNotificationListener
{
    private readonly string _name;
    
    public ConsoleNotificationListener(string name)
    {
        _name = name;
    }
    
    public void Subscribe(NotificationService service)
    {
        service.NotificationSent += OnNotificationReceived;
        service.ErrorNotification += OnErrorReceived;
        service.WarningNotification += OnWarningReceived;
    }
    
    public void Unsubscribe(NotificationService service)
    {
        service.NotificationSent -= OnNotificationReceived;
        service.ErrorNotification -= OnErrorReceived;
        service.WarningNotification -= OnWarningReceived;
    }
    
    private void OnNotificationReceived(object sender, NotificationEventArgs e)
    {
        var emoji = e.Type switch
        {
            NotificationType.Info => "ℹ️",
            NotificationType.Warning => "⚠️",
            NotificationType.Error => "❌",
            NotificationType.Success => "✅",
            _ => "📢"
        };
        
        Console.WriteLine($"[{_name}] {emoji} [{e.Timestamp:HH:mm:ss}] {e.Source}: {e.Message}");
    }
    
    private void OnErrorReceived(object sender, NotificationEventArgs e)
    {
        Console.WriteLine($"[{_name}] 🚨 重要エラー通知: {e.Message}");
    }
    
    private void OnWarningReceived(object sender, NotificationEventArgs e)
    {
        Console.WriteLine($"[{_name}] ⚠️ 警告通知: {e.Message}");
    }
}
\`\`\`

## イベントのベストプラクティス

### メモリリーク対策

\`\`\`csharp
public class SafeEventPublisher : IDisposable
{
    public event EventHandler<string> MessagePublished;
    private bool _disposed;
    
    public void PublishMessage(string message)
    {
        if (_disposed) return;
        MessagePublished?.Invoke(this, message);
    }
    
    // WeakReferenceを使用したリークセーフなイベント実装例
    private readonly List<WeakReference> _weakHandlers = new List<WeakReference>();
    
    public void AddWeakHandler(EventHandler<string> handler)
    {
        _weakHandlers.Add(new WeakReference(handler));
    }
    
    public void PublishMessageSafely(string message)
    {
        var aliveHandlers = new List<EventHandler<string>>();
        
        foreach (var weakRef in _weakHandlers.ToList())
        {
            if (weakRef.Target is EventHandler<string> handler)
            {
                aliveHandlers.Add(handler);
            }
            else
            {
                _weakHandlers.Remove(weakRef);
            }
        }
        
        foreach (var handler in aliveHandlers)
        {
            handler(this, message);
        }
    }
    
    public void Dispose()
    {
        if (!_disposed)
        {
            MessagePublished = null;
            _weakHandlers.Clear();
            _disposed = true;
        }
    }
}
\`\`\`

## まとめ

C#のイベントシステムは強力な機能です：

- **カプセル化**: デリゲートよりも安全なイベント管理
- **疎結合**: パブリッシャー・サブスクライバーパターンの実現
- **拡張性**: 新しいハンドラーの追加が容易
- **DDDでの活用**: ドメインイベントパターンの基盤

DDDにおいては、ビジネスイベントの通知や副作用の処理に欠かせない要素です。

次のレッスンでは、例外処理について詳しく学習し、堅牢なアプリケーション設計を理解します。
`,
  codeExamples: [
    {
      id: 'ddd-domain-event-system-complete',
      title: 'DDDドメインイベントシステムの完全実装',
      description: 'イベントを使用したドメインイベントシステムの包括的な実装例',
      language: 'csharp',
      code: `using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

// ドメインイベントの基底インターフェース
public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredOn { get; }
    string EventType { get; }
}

// ドメインイベントの基底クラス
public abstract class DomainEvent : IDomainEvent
{
    public Guid EventId { get; }
    public DateTime OccurredOn { get; }
    public string EventType => GetType().Name;
    
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
    public CustomerTier Tier { get; }
    public decimal InitialCreditLimit { get; }
    
    public CustomerRegisteredEvent(int customerId, string customerName, string email, CustomerTier tier, decimal initialCreditLimit)
    {
        CustomerId = customerId;
        CustomerName = customerName;
        Email = email;
        Tier = tier;
        InitialCreditLimit = initialCreditLimit;
    }
}

public class OrderCreatedEvent : DomainEvent
{
    public int OrderId { get; }
    public int CustomerId { get; }
    public List<OrderLineItem> LineItems { get; }
    public decimal TotalAmount { get; }
    public string ShippingAddress { get; }
    
    public OrderCreatedEvent(int orderId, int customerId, List<OrderLineItem> lineItems, decimal totalAmount, string shippingAddress)
    {
        OrderId = orderId;
        CustomerId = customerId;
        LineItems = lineItems ?? new List<OrderLineItem>();
        TotalAmount = totalAmount;
        ShippingAddress = shippingAddress;
    }
}

public class PaymentProcessedEvent : DomainEvent
{
    public int PaymentId { get; }
    public int OrderId { get; }
    public int CustomerId { get; }
    public decimal Amount { get; }
    public PaymentMethod Method { get; }
    public PaymentStatus Status { get; }
    public string TransactionId { get; }
    
    public PaymentProcessedEvent(int paymentId, int orderId, int customerId, decimal amount, PaymentMethod method, PaymentStatus status, string transactionId)
    {
        PaymentId = paymentId;
        OrderId = orderId;
        CustomerId = customerId;
        Amount = amount;
        Method = method;
        Status = status;
        TransactionId = transactionId;
    }
}

public class InventoryUpdatedEvent : DomainEvent
{
    public int ProductId { get; }
    public string ProductName { get; }
    public int OldQuantity { get; }
    public int NewQuantity { get; }
    public string Reason { get; }
    
    public InventoryUpdatedEvent(int productId, string productName, int oldQuantity, int newQuantity, string reason)
    {
        ProductId = productId;
        ProductName = productName;
        OldQuantity = oldQuantity;
        NewQuantity = newQuantity;
        Reason = reason;
    }
}

// 補助クラス
public enum CustomerTier
{
    Bronze,
    Silver,
    Gold,
    Platinum
}

public enum PaymentMethod
{
    CreditCard,
    DebitCard,
    BankTransfer,
    PayPal,
    Cash
}

public enum PaymentStatus
{
    Pending,
    Completed,
    Failed,
    Refunded
}

public class OrderLineItem
{
    public int ProductId { get; set; }
    public string ProductName { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice => Quantity * UnitPrice;
}

// ドメインイベントハンドラーのインターフェース
public interface IDomainEventHandler<in T> where T : IDomainEvent
{
    string HandlerName { get; }
    Task HandleAsync(T domainEvent);
}

// 高度なドメインイベントディスパッチャー
public class AdvancedDomainEventDispatcher
{
    private readonly Dictionary<Type, List<object>> _handlers;
    private readonly List<IDomainEvent> _eventHistory;
    private readonly Dictionary<string, int> _handlerExecutionCount;
    private readonly Dictionary<Type, int> _eventPublishCount;
    
    public event EventHandler<DomainEventProcessedEventArgs> EventProcessed;
    public event EventHandler<DomainEventErrorEventArgs> EventProcessingError;
    
    public AdvancedDomainEventDispatcher()
    {
        _handlers = new Dictionary<Type, List<object>>();
        _eventHistory = new List<IDomainEvent>();
        _handlerExecutionCount = new Dictionary<string, int>();
        _eventPublishCount = new Dictionary<Type, int>();
    }
    
    // ハンドラーの登録
    public void RegisterHandler<T>(IDomainEventHandler<T> handler) where T : IDomainEvent
    {
        var eventType = typeof(T);
        
        if (!_handlers.ContainsKey(eventType))
        {
            _handlers[eventType] = new List<object>();
        }
        
        _handlers[eventType].Add(handler);
        Console.WriteLine($"🔧 ハンドラー登録: {eventType.Name} -> {handler.HandlerName}");
    }
    
    // 複数ハンドラーの一括登録
    public void RegisterHandlers(params object[] handlers)
    {
        foreach (var handler in handlers)
        {
            var handlerType = handler.GetType();
            var interfaces = handlerType.GetInterfaces()
                .Where(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IDomainEventHandler<>));
            
            foreach (var interfaceType in interfaces)
            {
                var eventType = interfaceType.GetGenericArguments()[0];
                
                if (!_handlers.ContainsKey(eventType))
                {
                    _handlers[eventType] = new List<object>();
                }
                
                _handlers[eventType].Add(handler);
                Console.WriteLine($"🔧 ハンドラー登録: {eventType.Name} -> {handlerType.Name}");
            }
        }
    }
    
    // イベントの発行
    public async Task PublishAsync<T>(T domainEvent) where T : IDomainEvent
    {
        var eventType = typeof(T);
        
        // 統計情報の更新
        _eventHistory.Add(domainEvent);
        _eventPublishCount[eventType] = _eventPublishCount.GetValueOrDefault(eventType, 0) + 1;
        
        Console.WriteLine($"\\n🚀 [{domainEvent.OccurredOn:HH:mm:ss.fff}] ドメインイベント発行: {domainEvent.EventType}");
        Console.WriteLine($"   EventId: {domainEvent.EventId}");
        
        // 登録されたハンドラーを実行
        if (_handlers.ContainsKey(eventType))
        {
            var handlers = _handlers[eventType].Cast<IDomainEventHandler<T>>().ToList();
            Console.WriteLine($"   📋 {handlers.Count}個のハンドラーを実行します");
            
            var tasks = new List<Task>();
            
            foreach (var handler in handlers)
            {
                var handlerName = handler.HandlerName;
                tasks.Add(ExecuteHandlerSafely(handler, domainEvent, handlerName));
            }
            
            await Task.WhenAll(tasks);
            
            // イベント処理完了の通知
            OnEventProcessed(new DomainEventProcessedEventArgs(domainEvent, handlers.Count));
        }
        else
        {
            Console.WriteLine($"   ⚠️ 登録されたハンドラーがありません");
        }
    }
    
    // ハンドラーの安全な実行
    private async Task ExecuteHandlerSafely<T>(IDomainEventHandler<T> handler, T domainEvent, string handlerName) where T : IDomainEvent
    {
        try
        {
            var startTime = DateTime.UtcNow;
            Console.WriteLine($"     ▶️ {handlerName} 実行開始");
            
            await handler.HandleAsync(domainEvent);
            
            var duration = DateTime.UtcNow - startTime;
            _handlerExecutionCount[handlerName] = _handlerExecutionCount.GetValueOrDefault(handlerName, 0) + 1;
            
            Console.WriteLine($"     ✅ {handlerName} 実行完了 ({duration.TotalMilliseconds:F0}ms)");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"     ❌ {handlerName} 実行エラー: {ex.Message}");
            OnEventProcessingError(new DomainEventErrorEventArgs(domainEvent, handlerName, ex));
        }
    }
    
    // 統計情報の取得
    public EventDispatcherStatistics GetStatistics()
    {
        return new EventDispatcherStatistics
        {
            TotalEventsPublished = _eventHistory.Count,
            EventTypeBreakdown = _eventPublishCount.ToDictionary(kvp => kvp.Key.Name, kvp => kvp.Value),
            HandlerExecutionCounts = new Dictionary<string, int>(_handlerExecutionCount),
            RegisteredHandlerCount = _handlers.Values.Sum(list => list.Count),
            UniqueEventTypes = _eventPublishCount.Keys.Count
        };
    }
    
    // イベント履歴の取得
    public IReadOnlyList<IDomainEvent> GetEventHistory() => _eventHistory.AsReadOnly();
    
    public IEnumerable<T> GetEventHistory<T>() where T : IDomainEvent => _eventHistory.OfType<T>();
    
    // イベント処理完了の通知
    protected virtual void OnEventProcessed(DomainEventProcessedEventArgs e)
    {
        EventProcessed?.Invoke(this, e);
    }
    
    // イベント処理エラーの通知
    protected virtual void OnEventProcessingError(DomainEventErrorEventArgs e)
    {
        EventProcessingError?.Invoke(this, e);
    }
}

// イベント引数クラス
public class DomainEventProcessedEventArgs : EventArgs
{
    public IDomainEvent DomainEvent { get; }
    public int HandlerCount { get; }
    public DateTime ProcessedAt { get; }
    
    public DomainEventProcessedEventArgs(IDomainEvent domainEvent, int handlerCount)
    {
        DomainEvent = domainEvent;
        HandlerCount = handlerCount;
        ProcessedAt = DateTime.UtcNow;
    }
}

public class DomainEventErrorEventArgs : EventArgs
{
    public IDomainEvent DomainEvent { get; }
    public string HandlerName { get; }
    public Exception Exception { get; }
    public DateTime ErrorOccurredAt { get; }
    
    public DomainEventErrorEventArgs(IDomainEvent domainEvent, string handlerName, Exception exception)
    {
        DomainEvent = domainEvent;
        HandlerName = handlerName;
        Exception = exception;
        ErrorOccurredAt = DateTime.UtcNow;
    }
}

// 統計情報クラス
public class EventDispatcherStatistics
{
    public int TotalEventsPublished { get; set; }
    public Dictionary<string, int> EventTypeBreakdown { get; set; }
    public Dictionary<string, int> HandlerExecutionCounts { get; set; }
    public int RegisteredHandlerCount { get; set; }
    public int UniqueEventTypes { get; set; }
}

// ドメインイベントハンドラーの実装例
public class WelcomeEmailHandler : IDomainEventHandler<CustomerRegisteredEvent>
{
    public string HandlerName => "ウェルカムメールハンドラー";
    
    public async Task HandleAsync(CustomerRegisteredEvent domainEvent)
    {
        await Task.Delay(150); // メール送信の模擬
        Console.WriteLine($"       📧 ウェルカムメールを送信: {domainEvent.Email}");
        Console.WriteLine($"          顧客ティア: {domainEvent.Tier}, 初期与信限度額: {domainEvent.InitialCreditLimit:C}");
    }
}

public class CustomerCrmRegistrationHandler : IDomainEventHandler<CustomerRegisteredEvent>
{
    public string HandlerName => "CRM登録ハンドラー";
    
    public async Task HandleAsync(CustomerRegisteredEvent domainEvent)
    {
        await Task.Delay(200); // CRM連携の模擬
        Console.WriteLine($"       💼 CRMシステムに顧客情報を登録: ID={domainEvent.CustomerId}");
        Console.WriteLine($"          名前: {domainEvent.CustomerName}, ティア: {domainEvent.Tier}");
    }
}

public class LoyaltyProgramHandler : IDomainEventHandler<CustomerRegisteredEvent>
{
    public string HandlerName => "ロイヤルティプログラムハンドラー";
    
    public async Task HandleAsync(CustomerRegisteredEvent domainEvent)
    {
        await Task.Delay(100);
        var bonusPoints = domainEvent.Tier switch
        {
            CustomerTier.Bronze => 100,
            CustomerTier.Silver => 250,
            CustomerTier.Gold => 500,
            CustomerTier.Platinum => 1000,
            _ => 50
        };
        
        Console.WriteLine($"       🎁 ロイヤルティプログラムに登録: {bonusPoints}ポイント付与");
    }
}

public class InventoryReservationHandler : IDomainEventHandler<OrderCreatedEvent>
{
    public string HandlerName => "在庫確保ハンドラー";
    
    public async Task HandleAsync(OrderCreatedEvent domainEvent)
    {
        await Task.Delay(300);
        Console.WriteLine($"       📦 在庫確保処理: 注文ID={domainEvent.OrderId}");
        
        foreach (var item in domainEvent.LineItems)
        {
            Console.WriteLine($"          {item.ProductName} x{item.Quantity} = {item.TotalPrice:C}");
        }
        
        Console.WriteLine($"       📍 配送先: {domainEvent.ShippingAddress}");
    }
}

public class OrderNotificationHandler : IDomainEventHandler<OrderCreatedEvent>
{
    public string HandlerName => "注文通知ハンドラー";
    
    public async Task HandleAsync(OrderCreatedEvent domainEvent)
    {
        await Task.Delay(100);
        Console.WriteLine($"       🔔 注文確認通知を送信");
        Console.WriteLine($"          注文ID: {domainEvent.OrderId}, 合計: {domainEvent.TotalAmount:C}");
    }
}

public class PaymentNotificationHandler : IDomainEventHandler<PaymentProcessedEvent>
{
    public string HandlerName => "支払い通知ハンドラー";
    
    public async Task HandleAsync(PaymentProcessedEvent domainEvent)
    {
        await Task.Delay(120);
        
        if (domainEvent.Status == PaymentStatus.Completed)
        {
            Console.WriteLine($"       💰 支払い完了通知: 金額={domainEvent.Amount:C}, 方法={domainEvent.Method}");
            Console.WriteLine($"          取引ID: {domainEvent.TransactionId}");
        }
        else
        {
            Console.WriteLine($"       ❌ 支払い失敗通知: 注文ID={domainEvent.OrderId}");
        }
    }
}

public class FinancialRecordHandler : IDomainEventHandler<PaymentProcessedEvent>
{
    public string HandlerName => "財務記録ハンドラー";
    
    public async Task HandleAsync(PaymentProcessedEvent domainEvent)
    {
        await Task.Delay(80);
        
        if (domainEvent.Status == PaymentStatus.Completed)
        {
            Console.WriteLine($"       💹 財務記録を更新: +{domainEvent.Amount:C}");
            Console.WriteLine($"          支払い方法別統計に反映: {domainEvent.Method}");
        }
    }
}

public class InventoryAlertHandler : IDomainEventHandler<InventoryUpdatedEvent>
{
    public string HandlerName => "在庫アラートハンドラー";
    
    public async Task HandleAsync(InventoryUpdatedEvent domainEvent)
    {
        await Task.Delay(50);
        
        Console.WriteLine($"       📊 在庫更新: {domainEvent.ProductName}");
        Console.WriteLine($"          {domainEvent.OldQuantity} → {domainEvent.NewQuantity} (理由: {domainEvent.Reason})");
        
        if (domainEvent.NewQuantity <= 10)
        {
            Console.WriteLine($"       ⚠️ 在庫不足アラート: {domainEvent.ProductName} (残り{domainEvent.NewQuantity}個)");
        }
    }
}

// デモプログラム
public class Program
{
    public static async Task Main()
    {
        Console.WriteLine("=== 高度なドメインイベントシステムデモ ===\\n");
        
        // イベントディスパッチャーの作成
        var dispatcher = new AdvancedDomainEventDispatcher();
        
        // ディスパッチャーのイベントを購読
        dispatcher.EventProcessed += (sender, e) =>
        {
            Console.WriteLine($"   ✨ イベント処理完了: {e.DomainEvent.EventType} ({e.HandlerCount}個のハンドラー実行)");
        };
        
        dispatcher.EventProcessingError += (sender, e) =>
        {
            Console.WriteLine($"   🚨 ハンドラーエラー: {e.HandlerName} - {e.Exception.Message}");
        };
        
        // ハンドラーの登録
        Console.WriteLine("🔧 イベントハンドラーを登録中...\\n");
        dispatcher.RegisterHandlers(
            new WelcomeEmailHandler(),
            new CustomerCrmRegistrationHandler(),
            new LoyaltyProgramHandler(),
            new InventoryReservationHandler(),
            new OrderNotificationHandler(),
            new PaymentNotificationHandler(),
            new FinancialRecordHandler(),
            new InventoryAlertHandler()
        );
        
        Console.WriteLine("\\n=== ビジネスシナリオの実行 ===");
        
        // シナリオ1: 新規顧客登録
        Console.WriteLine("\\n--- シナリオ1: 新規顧客登録 ---");
        var customerEvent = new CustomerRegisteredEvent(
            customerId: 1001,
            customerName: "田中太郎",
            email: "tanaka@example.com",
            tier: CustomerTier.Gold,
            initialCreditLimit: 500000
        );
        await dispatcher.PublishAsync(customerEvent);
        
        // シナリオ2: 注文作成
        Console.WriteLine("\\n--- シナリオ2: 注文作成 ---");
        var orderLineItems = new List<OrderLineItem>
        {
            new OrderLineItem { ProductId = 1, ProductName = "ハイエンドノートPC", Quantity = 1, UnitPrice = 180000 },
            new OrderLineItem { ProductId = 2, ProductName = "ワイヤレスマウス", Quantity = 2, UnitPrice = 8000 },
            new OrderLineItem { ProductId = 3, ProductName = "外付けモニター", Quantity = 1, UnitPrice = 35000 }
        };
        
        var orderEvent = new OrderCreatedEvent(
            orderId: 2001,
            customerId: 1001,
            lineItems: orderLineItems,
            totalAmount: orderLineItems.Sum(item => item.TotalPrice),
            shippingAddress: "東京都渋谷区1-1-1"
        );
        await dispatcher.PublishAsync(orderEvent);
        
        // シナリオ3: 支払い処理
        Console.WriteLine("\\n--- シナリオ3: 支払い処理 ---");
        var paymentEvent = new PaymentProcessedEvent(
            paymentId: 3001,
            orderId: 2001,
            customerId: 1001,
            amount: 231000,
            method: PaymentMethod.CreditCard,
            status: PaymentStatus.Completed,
            transactionId: "TXN-2025-001234"
        );
        await dispatcher.PublishAsync(paymentEvent);
        
        // シナリオ4: 在庫更新
        Console.WriteLine("\\n--- シナリオ4: 在庫更新 ---");
        var inventoryEvent = new InventoryUpdatedEvent(
            productId: 1,
            productName: "ハイエンドノートPC",
            oldQuantity: 15,
            newQuantity: 5,
            reason: "注文による減少"
        );
        await dispatcher.PublishAsync(inventoryEvent);
        
        // 統計情報の表示
        Console.WriteLine("\\n=== 統計情報 ===");
        var stats = dispatcher.GetStatistics();
        Console.WriteLine($"📊 総イベント発行数: {stats.TotalEventsPublished}");
        Console.WriteLine($"🔧 登録ハンドラー数: {stats.RegisteredHandlerCount}");
        Console.WriteLine($"📋 ユニークイベント型数: {stats.UniqueEventTypes}");
        
        Console.WriteLine("\\n📈 イベント型別統計:");
        foreach (var (eventType, count) in stats.EventTypeBreakdown)
        {
            Console.WriteLine($"   {eventType}: {count}回");
        }
        
        Console.WriteLine("\\n⚡ ハンドラー実行統計:");
        foreach (var (handlerName, count) in stats.HandlerExecutionCounts)
        {
            Console.WriteLine($"   {handlerName}: {count}回実行");
        }
        
        Console.WriteLine("\\n=== デモ完了 ===");
    }
}`
    },
    {
      id: 'realtime-notification-system',
      title: 'リアルタイム通知システム',
      description: 'イベントを使用したリアルタイム通知とオブザーバーパターンの実装',
      language: 'csharp',
      code: `using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

// 通知の重要度
public enum NotificationPriority
{
    Low,
    Normal,
    High,
    Critical
}

// 通知チャンネル
public enum NotificationChannel
{
    Email,
    SMS,
    Push,
    InApp,
    Slack,
    Teams
}

// 通知の状態
public enum NotificationStatus
{
    Pending,
    Sent,
    Delivered,
    Failed,
    Cancelled
}

// 通知イベント引数
public class NotificationEventArgs : EventArgs
{
    public Guid NotificationId { get; }
    public string Title { get; }
    public string Message { get; }
    public NotificationPriority Priority { get; }
    public NotificationChannel Channel { get; }
    public string Recipient { get; }
    public DateTime CreatedAt { get; }
    public Dictionary<string, object> Metadata { get; }
    
    public NotificationEventArgs(string title, string message, NotificationPriority priority, 
        NotificationChannel channel, string recipient, Dictionary<string, object> metadata = null)
    {
        NotificationId = Guid.NewGuid();
        Title = title;
        Message = message;
        Priority = priority;
        Channel = channel;
        Recipient = recipient;
        CreatedAt = DateTime.UtcNow;
        Metadata = metadata ?? new Dictionary<string, object>();
    }
}

// 通知状態変更イベント引数
public class NotificationStatusChangedEventArgs : EventArgs
{
    public Guid NotificationId { get; }
    public NotificationStatus OldStatus { get; }
    public NotificationStatus NewStatus { get; }
    public DateTime ChangedAt { get; }
    public string Reason { get; }
    
    public NotificationStatusChangedEventArgs(Guid notificationId, NotificationStatus oldStatus, 
        NotificationStatus newStatus, string reason = null)
    {
        NotificationId = notificationId;
        OldStatus = oldStatus;
        NewStatus = newStatus;
        ChangedAt = DateTime.UtcNow;
        Reason = reason;
    }
}

// バッチ通知イベント引数
public class BatchNotificationEventArgs : EventArgs
{
    public List<NotificationEventArgs> Notifications { get; }
    public DateTime BatchCreatedAt { get; }
    public string BatchId { get; }
    
    public BatchNotificationEventArgs(List<NotificationEventArgs> notifications)
    {
        Notifications = notifications ?? new List<NotificationEventArgs>();
        BatchCreatedAt = DateTime.UtcNow;
        BatchId = Guid.NewGuid().ToString("N")[..8];
    }
}

// 高度な通知サービス
public class AdvancedNotificationService
{
    // 個別通知イベント
    public event EventHandler<NotificationEventArgs> NotificationCreated;
    public event EventHandler<NotificationEventArgs> NotificationSending;
    public event EventHandler<NotificationEventArgs> NotificationSent;
    public event EventHandler<NotificationEventArgs> NotificationFailed;
    
    // ステータス変更イベント
    public event EventHandler<NotificationStatusChangedEventArgs> NotificationStatusChanged;
    
    // バッチ通知イベント
    public event EventHandler<BatchNotificationEventArgs> BatchNotificationCreated;
    public event EventHandler<BatchNotificationEventArgs> BatchNotificationProcessed;
    
    // 優先度別イベント
    public event EventHandler<NotificationEventArgs> CriticalNotification;
    public event EventHandler<NotificationEventArgs> HighPriorityNotification;
    
    // チャンネル別イベント
    public event EventHandler<NotificationEventArgs> EmailNotification;
    public event EventHandler<NotificationEventArgs> SmsNotification;
    public event EventHandler<NotificationEventArgs> PushNotification;
    
    private readonly Dictionary<Guid, NotificationStatus> _notificationStatuses;
    private readonly List<NotificationEventArgs> _notificationHistory;
    private readonly SemaphoreSlim _batchSemaphore;
    
    public AdvancedNotificationService()
    {
        _notificationStatuses = new Dictionary<Guid, NotificationStatus>();
        _notificationHistory = new List<NotificationEventArgs>();
        _batchSemaphore = new SemaphoreSlim(1, 1);
    }
    
    // 単一通知の送信
    public async Task<Guid> SendNotificationAsync(string title, string message, 
        NotificationPriority priority, NotificationChannel channel, string recipient,
        Dictionary<string, object> metadata = null)
    {
        var notification = new NotificationEventArgs(title, message, priority, channel, recipient, metadata);
        
        // 通知作成イベント
        OnNotificationCreated(notification);
        
        // 優先度別イベント
        if (priority == NotificationPriority.Critical)
            OnCriticalNotification(notification);
        else if (priority == NotificationPriority.High)
            OnHighPriorityNotification(notification);
        
        // チャンネル別イベント
        switch (channel)
        {
            case NotificationChannel.Email:
                OnEmailNotification(notification);
                break;
            case NotificationChannel.SMS:
                OnSmsNotification(notification);
                break;
            case NotificationChannel.Push:
                OnPushNotification(notification);
                break;
        }
        
        // 通知の処理
        await ProcessNotificationAsync(notification);
        
        return notification.NotificationId;
    }
    
    // バッチ通知の送信
    public async Task<List<Guid>> SendBatchNotificationAsync(List<(string title, string message, 
        NotificationPriority priority, NotificationChannel channel, string recipient)> notifications)
    {
        await _batchSemaphore.WaitAsync();
        
        try
        {
            var notificationArgs = notifications.Select(n => 
                new NotificationEventArgs(n.title, n.message, n.priority, n.channel, n.recipient))
                .ToList();
            
            var batchArgs = new BatchNotificationEventArgs(notificationArgs);
            
            // バッチ作成イベント
            OnBatchNotificationCreated(batchArgs);
            
            // 個別通知の処理
            var tasks = notificationArgs.Select(ProcessNotificationAsync);
            await Task.WhenAll(tasks);
            
            // バッチ処理完了イベント
            OnBatchNotificationProcessed(batchArgs);
            
            return notificationArgs.Select(n => n.NotificationId).ToList();
        }
        finally
        {
            _batchSemaphore.Release();
        }
    }
    
    // 通知の処理
    private async Task ProcessNotificationAsync(NotificationEventArgs notification)
    {
        // ステータスを送信中に変更
        UpdateNotificationStatus(notification.NotificationId, NotificationStatus.Pending, NotificationStatus.Sending);
        
        // 送信開始イベント
        OnNotificationSending(notification);
        
        try
        {
            // 送信処理のシミュレーション
            var delay = notification.Priority switch
            {
                NotificationPriority.Critical => 100,
                NotificationPriority.High => 200,
                NotificationPriority.Normal => 500,
                NotificationPriority.Low => 1000,
                _ => 500
            };
            
            await Task.Delay(delay);
            
            // 送信成功
            UpdateNotificationStatus(notification.NotificationId, NotificationStatus.Sending, NotificationStatus.Sent);
            OnNotificationSent(notification);
            
            // 配信確認のシミュレーション（一部チャンネルのみ）
            if (notification.Channel == NotificationChannel.Email || notification.Channel == NotificationChannel.SMS)
            {
                await Task.Delay(200);
                UpdateNotificationStatus(notification.NotificationId, NotificationStatus.Sent, NotificationStatus.Delivered);
            }
        }
        catch (Exception ex)
        {
            // 送信失敗
            UpdateNotificationStatus(notification.NotificationId, NotificationStatus.Sending, NotificationStatus.Failed, ex.Message);
            OnNotificationFailed(notification);
        }
        
        // 履歴に追加
        _notificationHistory.Add(notification);
    }
    
    // 通知ステータスの更新
    private void UpdateNotificationStatus(Guid notificationId, NotificationStatus oldStatus, 
        NotificationStatus newStatus, string reason = null)
    {
        _notificationStatuses[notificationId] = newStatus;
        OnNotificationStatusChanged(new NotificationStatusChangedEventArgs(notificationId, oldStatus, newStatus, reason));
    }
    
    // 通知ステータスの取得
    public NotificationStatus GetNotificationStatus(Guid notificationId)
    {
        return _notificationStatuses.TryGetValue(notificationId, out var status) ? status : NotificationStatus.Pending;
    }
    
    // 統計情報の取得
    public NotificationStatistics GetStatistics()
    {
        var statusCounts = _notificationStatuses.Values
            .GroupBy(s => s)
            .ToDictionary(g => g.Key, g => g.Count());
        
        var channelCounts = _notificationHistory
            .GroupBy(n => n.Channel)
            .ToDictionary(g => g.Key, g => g.Count());
        
        var priorityCounts = _notificationHistory
            .GroupBy(n => n.Priority)
            .ToDictionary(g => g.Key, g => g.Count());
        
        return new NotificationStatistics
        {
            TotalNotifications = _notificationHistory.Count,
            StatusBreakdown = statusCounts,
            ChannelBreakdown = channelCounts,
            PriorityBreakdown = priorityCounts,
            SuccessRate = statusCounts.GetValueOrDefault(NotificationStatus.Sent, 0) + 
                         statusCounts.GetValueOrDefault(NotificationStatus.Delivered, 0),
            FailureRate = statusCounts.GetValueOrDefault(NotificationStatus.Failed, 0)
        };
    }
    
    // イベント発火メソッド
    protected virtual void OnNotificationCreated(NotificationEventArgs e) => NotificationCreated?.Invoke(this, e);
    protected virtual void OnNotificationSending(NotificationEventArgs e) => NotificationSending?.Invoke(this, e);
    protected virtual void OnNotificationSent(NotificationEventArgs e) => NotificationSent?.Invoke(this, e);
    protected virtual void OnNotificationFailed(NotificationEventArgs e) => NotificationFailed?.Invoke(this, e);
    protected virtual void OnNotificationStatusChanged(NotificationStatusChangedEventArgs e) => NotificationStatusChanged?.Invoke(this, e);
    protected virtual void OnBatchNotificationCreated(BatchNotificationEventArgs e) => BatchNotificationCreated?.Invoke(this, e);
    protected virtual void OnBatchNotificationProcessed(BatchNotificationEventArgs e) => BatchNotificationProcessed?.Invoke(this, e);
    protected virtual void OnCriticalNotification(NotificationEventArgs e) => CriticalNotification?.Invoke(this, e);
    protected virtual void OnHighPriorityNotification(NotificationEventArgs e) => HighPriorityNotification?.Invoke(this, e);
    protected virtual void OnEmailNotification(NotificationEventArgs e) => EmailNotification?.Invoke(this, e);
    protected virtual void OnSmsNotification(NotificationEventArgs e) => SmsNotification?.Invoke(this, e);
    protected virtual void OnPushNotification(NotificationEventArgs e) => PushNotification?.Invoke(this, e);
}

// 統計情報クラス
public class NotificationStatistics
{
    public int TotalNotifications { get; set; }
    public Dictionary<NotificationStatus, int> StatusBreakdown { get; set; }
    public Dictionary<NotificationChannel, int> ChannelBreakdown { get; set; }
    public Dictionary<NotificationPriority, int> PriorityBreakdown { get; set; }
    public int SuccessRate { get; set; }
    public int FailureRate { get; set; }
    
    public double SuccessPercentage => TotalNotifications > 0 ? (double)SuccessRate / TotalNotifications * 100 : 0;
    public double FailurePercentage => TotalNotifications > 0 ? (double)FailureRate / TotalNotifications * 100 : 0;
}

// 通知リスナーの実装例
public class SystemAdminNotificationListener
{
    private readonly string _adminName;
    
    public SystemAdminNotificationListener(string adminName)
    {
        _adminName = adminName;
    }
    
    public void Subscribe(AdvancedNotificationService service)
    {
        service.CriticalNotification += OnCriticalNotification;
        service.NotificationFailed += OnNotificationFailed;
        service.BatchNotificationProcessed += OnBatchProcessed;
    }
    
    private void OnCriticalNotification(object sender, NotificationEventArgs e)
    {
        Console.WriteLine($"🚨 [{_adminName}] 緊急通知検出: {e.Title}");
        Console.WriteLine($"    受信者: {e.Recipient}, チャンネル: {e.Channel}");
    }
    
    private void OnNotificationFailed(object sender, NotificationEventArgs e)
    {
        Console.WriteLine($"❌ [{_adminName}] 通知失敗アラート: {e.NotificationId}");
        Console.WriteLine($"    タイトル: {e.Title}, 受信者: {e.Recipient}");
    }
    
    private void OnBatchProcessed(object sender, BatchNotificationEventArgs e)
    {
        Console.WriteLine($"📊 [{_adminName}] バッチ処理完了: {e.Notifications.Count}件 (BatchID: {e.BatchId})");
    }
}

public class UserNotificationListener
{
    private readonly string _userId;
    
    public UserNotificationListener(string userId)
    {
        _userId = userId;
    }
    
    public void Subscribe(AdvancedNotificationService service)
    {
        service.NotificationSent += OnNotificationSent;
        service.NotificationStatusChanged += OnStatusChanged;
    }
    
    private void OnNotificationSent(object sender, NotificationEventArgs e)
    {
        if (e.Recipient == _userId)
        {
            Console.WriteLine($"📱 [{_userId}] 通知を受信: {e.Title}");
            Console.WriteLine($"    メッセージ: {e.Message}");
        }
    }
    
    private void OnStatusChanged(object sender, NotificationStatusChangedEventArgs e)
    {
        var emoji = e.NewStatus switch
        {
            NotificationStatus.Sending => "📤",
            NotificationStatus.Sent => "✅",
            NotificationStatus.Delivered => "📬",
            NotificationStatus.Failed => "❌",
            _ => "ℹ️"
        };
        
        Console.WriteLine($"    {emoji} 通知ステータス変更: {e.OldStatus} → {e.NewStatus}");
    }
}

public class AnalyticsListener
{
    public void Subscribe(AdvancedNotificationService service)
    {
        service.NotificationCreated += OnNotificationCreated;
        service.NotificationSent += OnNotificationSent;
        service.NotificationFailed += OnNotificationFailed;
    }
    
    private void OnNotificationCreated(object sender, NotificationEventArgs e)
    {
        Console.WriteLine($"📈 [Analytics] 通知作成を記録: {e.Channel}/{e.Priority}");
    }
    
    private void OnNotificationSent(object sender, NotificationEventArgs e)
    {
        Console.WriteLine($"📈 [Analytics] 送信成功を記録: {e.NotificationId}");
    }
    
    private void OnNotificationFailed(object sender, NotificationEventArgs e)
    {
        Console.WriteLine($"📈 [Analytics] 送信失敗を記録: {e.NotificationId}");
    }
}

// デモプログラム
public class Program
{
    public static async Task Main()
    {
        Console.WriteLine("=== リアルタイム通知システムデモ ===\\n");
        
        // 通知サービスの作成
        var notificationService = new AdvancedNotificationService();
        
        // リスナーの作成と購読
        var adminListener = new SystemAdminNotificationListener("管理者");
        var userListener1 = new UserNotificationListener("user001");
        var userListener2 = new UserNotificationListener("user002");
        var analyticsListener = new AnalyticsListener();
        
        adminListener.Subscribe(notificationService);
        userListener1.Subscribe(notificationService);
        userListener2.Subscribe(notificationService);
        analyticsListener.Subscribe(notificationService);
        
        Console.WriteLine("🔔 通知リスナーを設定しました\\n");
        
        // シナリオ1: 個別通知の送信
        Console.WriteLine("=== シナリオ1: 個別通知の送信 ===");
        
        await notificationService.SendNotificationAsync(
            "新規注文確認",
            "ご注文が正常に受付けられました。注文番号: ORD-2025-001",
            NotificationPriority.Normal,
            NotificationChannel.Email,
            "user001"
        );
        
        await notificationService.SendNotificationAsync(
            "緊急メンテナンス通知",
            "システムメンテナンスのため、30分後にサービスを停止します。",
            NotificationPriority.Critical,
            NotificationChannel.Push,
            "user002"
        );
        
        // シナリオ2: バッチ通知の送信
        Console.WriteLine("\\n=== シナリオ2: バッチ通知の送信 ===");
        
        var batchNotifications = new List<(string, string, NotificationPriority, NotificationChannel, string)>
        {
            ("セール開始", "特別セールが開始されました！", NotificationPriority.Normal, NotificationChannel.Email, "user001"),
            ("パスワード変更", "パスワードが変更されました", NotificationPriority.High, NotificationChannel.SMS, "user001"),
            ("新機能追加", "新しい機能が追加されました", NotificationPriority.Low, NotificationChannel.InApp, "user002")
        };
        
        await notificationService.SendBatchNotificationAsync(batchNotifications);
        
        // シナリオ3: 複数チャンネルでの同時送信
        Console.WriteLine("\\n=== シナリオ3: 複数チャンネルでの同時送信 ===");
        
        var tasks = new[]
        {
            notificationService.SendNotificationAsync("重要な更新", "アカウント情報が更新されました", NotificationPriority.High, NotificationChannel.Email, "user001"),
            notificationService.SendNotificationAsync("重要な更新", "アカウント情報が更新されました", NotificationPriority.High, NotificationChannel.SMS, "user001"),
            notificationService.SendNotificationAsync("重要な更新", "アカウント情報が更新されました", NotificationPriority.High, NotificationChannel.Push, "user001")
        };
        
        await Task.WhenAll(tasks);
        
        // 統計情報の表示
        Console.WriteLine("\\n=== 統計情報 ===");
        var stats = notificationService.GetStatistics();
        
        Console.WriteLine($"📊 総通知数: {stats.TotalNotifications}");
        Console.WriteLine($"✅ 成功率: {stats.SuccessPercentage:F1}%");
        Console.WriteLine($"❌ 失敗率: {stats.FailurePercentage:F1}%");
        
        Console.WriteLine("\\n📋 ステータス別内訳:");
        foreach (var (status, count) in stats.StatusBreakdown)
        {
            Console.WriteLine($"   {status}: {count}件");
        }
        
        Console.WriteLine("\\n📱 チャンネル別内訳:");
        foreach (var (channel, count) in stats.ChannelBreakdown)
        {
            Console.WriteLine($"   {channel}: {count}件");
        }
        
        Console.WriteLine("\\n⚡ 優先度別内訳:");
        foreach (var (priority, count) in stats.PriorityBreakdown)
        {
            Console.WriteLine($"   {priority}: {count}件");
        }
        
        Console.WriteLine("\\n=== デモ完了 ===");
    }
}`
    }
  ],
  exercises: [
    {
      id: 'events-1',
      title: 'システム監視イベントシステム',
      description: 'システムのパフォーマンス監視とアラート機能をイベントを使用して実装してください。',
      difficulty: 'hard',
      starterCode: `using System;

// システムメトリクスの種類
public enum MetricType
{
    CPU,
    Memory,
    Disk,
    Network
}

// アラートレベル
public enum AlertLevel
{
    Info,
    Warning,
    Critical
}

// メトリクスイベント引数
public class SystemMetricEventArgs : EventArgs
{
    public MetricType Type { get; set; }
    public double Value { get; set; }
    public DateTime Timestamp { get; set; }
    public string Source { get; set; }
    
    // TODO: コンストラクタを実装
}

// アラートイベント引数
public class SystemAlertEventArgs : EventArgs
{
    public AlertLevel Level { get; set; }
    public string Message { get; set; }
    public MetricType MetricType { get; set; }
    public double MetricValue { get; set; }
    public DateTime Timestamp { get; set; }
    
    // TODO: コンストラクタを実装
}

// システム監視サービス
public class SystemMonitoringService
{
    // TODO: 以下のイベントを宣言
    // - MetricUpdated (SystemMetricEventArgs)
    // - AlertTriggered (SystemAlertEventArgs)
    // - CriticalAlert (SystemAlertEventArgs)
    
    // 閾値設定
    private readonly double _cpuWarningThreshold = 70.0;
    private readonly double _cpuCriticalThreshold = 90.0;
    private readonly double _memoryWarningThreshold = 80.0;
    private readonly double _memoryCriticalThreshold = 95.0;
    
    public void UpdateMetric(MetricType type, double value, string source)
    {
        // TODO: メトリクス更新イベントを発火
        
        // TODO: 閾値チェックとアラート生成
        // CPUとメモリの閾値をチェックしてアラートを生成
    }
    
    // TODO: イベント発火用のprotectedメソッドを実装
    // - OnMetricUpdated
    // - OnAlertTriggered  
    // - OnCriticalAlert
}

// アラートハンドラーの例
public class AlertHandler
{
    public void Subscribe(SystemMonitoringService monitor)
    {
        // TODO: イベントハンドラーを登録
    }
    
    private void OnMetricUpdated(object sender, SystemMetricEventArgs e)
    {
        // TODO: メトリクス更新の処理
        Console.WriteLine($"メトリクス更新: {e.Type} = {e.Value}% ({e.Source})");
    }
    
    private void OnAlertTriggered(object sender, SystemAlertEventArgs e)
    {
        // TODO: アラート処理
    }
    
    private void OnCriticalAlert(object sender, SystemAlertEventArgs e)
    {
        // TODO: 緊急アラート処理
    }
}`,
      solution: `// コンストラクタの実装
public SystemMetricEventArgs(MetricType type, double value, string source)
{
    Type = type;
    Value = value;
    Timestamp = DateTime.UtcNow;
    Source = source;
}

public SystemAlertEventArgs(AlertLevel level, string message, MetricType metricType, double metricValue)
{
    Level = level;
    Message = message;
    MetricType = metricType;
    MetricValue = metricValue;
    Timestamp = DateTime.UtcNow;
}

// SystemMonitoringServiceのイベント宣言
public event EventHandler<SystemMetricEventArgs> MetricUpdated;
public event EventHandler<SystemAlertEventArgs> AlertTriggered;
public event EventHandler<SystemAlertEventArgs> CriticalAlert;

// UpdateMetricメソッドの実装
public void UpdateMetric(MetricType type, double value, string source)
{
    var metricArgs = new SystemMetricEventArgs(type, value, source);
    OnMetricUpdated(metricArgs);
    
    // 閾値チェック
    AlertLevel? alertLevel = type switch
    {
        MetricType.CPU => value >= _cpuCriticalThreshold ? AlertLevel.Critical :
                         value >= _cpuWarningThreshold ? AlertLevel.Warning : null,
        MetricType.Memory => value >= _memoryCriticalThreshold ? AlertLevel.Critical :
                            value >= _memoryWarningThreshold ? AlertLevel.Warning : null,
        _ => null
    };
    
    if (alertLevel.HasValue)
    {
        var alertArgs = new SystemAlertEventArgs(alertLevel.Value, 
            $"{type}使用率が{value}%に達しました", type, value);
        OnAlertTriggered(alertArgs);
        
        if (alertLevel.Value == AlertLevel.Critical)
        {
            OnCriticalAlert(alertArgs);
        }
    }
}

// イベント発火メソッド
protected virtual void OnMetricUpdated(SystemMetricEventArgs e)
{
    MetricUpdated?.Invoke(this, e);
}

protected virtual void OnAlertTriggered(SystemAlertEventArgs e)
{
    AlertTriggered?.Invoke(this, e);
}

protected virtual void OnCriticalAlert(SystemAlertEventArgs e)
{
    CriticalAlert?.Invoke(this, e);
}

// AlertHandlerのSubscribeメソッド
public void Subscribe(SystemMonitoringService monitor)
{
    monitor.MetricUpdated += OnMetricUpdated;
    monitor.AlertTriggered += OnAlertTriggered;
    monitor.CriticalAlert += OnCriticalAlert;
}

private void OnAlertTriggered(object sender, SystemAlertEventArgs e)
{
    var emoji = e.Level == AlertLevel.Critical ? "🚨" : "⚠️";
    Console.WriteLine($"{emoji} アラート: {e.Message}");
}

private void OnCriticalAlert(object sender, SystemAlertEventArgs e)
{
    Console.WriteLine($"🚨 緊急アラート: {e.Message} - 即座に対応が必要です！");
}`,
      hints: [
        'EventArgsを継承したクラスでイベント引数を定義',
        'EventHandler<T>デリゲートを使用してイベントを宣言',
        '閾値チェックでswitch式を使用して可読性を向上',
        'イベント発火にはprotectedな仮想メソッドパターンを使用'
      ],
      testCases: [
        {
          input: 'UpdateMetric(MetricType.CPU, 75.0, "Server1")',
          expectedOutput: 'メトリクス更新と警告アラートが発火される'
        },
        {
          input: 'UpdateMetric(MetricType.CPU, 95.0, "Server1")',
          expectedOutput: 'メトリクス更新、警告アラート、緊急アラートが発火される'
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'events-quiz-1',
      question: 'C#のイベントとデリゲートの最も重要な違いは何ですか？',
      options: [
        'イベントは非同期で実行される',
        'イベントはクラス外部からの直接代入や呼び出しができない',
        'イベントはパフォーマンスが優れている',
        'イベントは複数の戻り値を処理できる'
      ],
      correctAnswer: 1,
      explanation: 'イベントはデリゲートよりもカプセル化されており、外部からの直接代入（=）や呼び出しができません。これにより安全性が向上します。'
    },
    {
      id: 'events-quiz-2',
      question: 'DDDでドメインイベントを実装する際の主な利点は何ですか？',
      options: [
        'パフォーマンスの向上',
        '副作用の分離と疎結合な設計の実現',
        'メモリ使用量の削減',
        'デバッグの簡略化'
      ],
      correctAnswer: 1,
      explanation: 'ドメインイベントにより、ビジネスロジックの副作用（メール送信、ログ記録など）を本体のロジックから分離し、疎結合な設計を実現できます。'
    }
  ],
  nextLesson: 'exception-handling',
  estimatedTime: 60
};