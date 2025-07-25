import type { Lesson } from '../../../../features/learning/types';

export const exceptionHandlingLesson: Lesson = {
  id: 'exception-handling',
  moduleId: 'error-resource-management',
  title: '例外処理 - 堅牢なエラーハンドリング',
  description: '例外処理の基本から高度なパターンまで、DDDでの適切なエラーハンドリング戦略を学習します',
  content: `
# 例外処理 (Exception Handling)

例外処理は、アプリケーションの堅牢性を確保するための重要な機能です。DDDでは、ドメインルールの違反やビジネス例外の適切な処理が特に重要となります。

## 例外処理の基本

### try-catch-finally構文

\`\`\`csharp
public class BasicExceptionHandling
{
    public void ProcessOrder(Order order)
    {
        try
        {
            // 危険な処理
            ValidateOrder(order);
            ProcessPayment(order);
            UpdateInventory(order);
        }
        catch (InvalidOrderException ex)
        {
            // 特定の例外の処理
            Console.WriteLine($"注文エラー: {ex.Message}");
            throw; // 再スロー
        }
        catch (PaymentException ex)
        {
            // 支払い例外の処理
            Console.WriteLine($"支払いエラー: {ex.Message}");
            order.MarkAsFailed();
        }
        catch (Exception ex)
        {
            // その他の例外
            Console.WriteLine($"予期しないエラー: {ex.Message}");
            LogError(ex);
            throw; // 通常は再スローして上位で処理
        }
        finally
        {
            // 必ず実行される処理
            CleanupResources();
        }
    }
}
\`\`\`

### カスタム例外クラス

\`\`\`csharp
// ビジネス例外の基底クラス
public abstract class BusinessException : Exception
{
    public string ErrorCode { get; }
    public DateTime OccurredAt { get; }
    
    protected BusinessException(string errorCode, string message) : base(message)
    {
        ErrorCode = errorCode;
        OccurredAt = DateTime.UtcNow;
    }
    
    protected BusinessException(string errorCode, string message, Exception innerException) 
        : base(message, innerException)
    {
        ErrorCode = errorCode;
        OccurredAt = DateTime.UtcNow;
    }
}

// ドメイン固有の例外
public class InvalidOrderException : BusinessException
{
    public int OrderId { get; }
    
    public InvalidOrderException(int orderId, string message) 
        : base("INVALID_ORDER", message)
    {
        OrderId = orderId;
    }
}

public class InsufficientInventoryException : BusinessException
{
    public int ProductId { get; }
    public int RequestedQuantity { get; }
    public int AvailableQuantity { get; }
    
    public InsufficientInventoryException(int productId, int requestedQuantity, int availableQuantity)
        : base("INSUFFICIENT_INVENTORY", 
               $"商品ID {productId}: 要求数量 {requestedQuantity}、利用可能数量 {availableQuantity}")
    {
        ProductId = productId;
        RequestedQuantity = requestedQuantity;
        AvailableQuantity = availableQuantity;
    }
}

public class PaymentException : BusinessException
{
    public string PaymentMethod { get; }
    public decimal Amount { get; }
    
    public PaymentException(string paymentMethod, decimal amount, string message)
        : base("PAYMENT_FAILED", message)
    {
        PaymentMethod = paymentMethod;
        Amount = amount;
    }
}
\`\`\`

## DDDでの例外処理パターン

### ドメイン層での例外処理

\`\`\`csharp
// ドメインエンティティでの例外処理
public class Order : Entity<int>
{
    private readonly List<OrderItem> _items;
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();
    public decimal TotalAmount => _items.Sum(item => item.TotalPrice);
    public OrderStatus Status { get; private set; }
    
    public Order(int id) : base(id)
    {
        _items = new List<OrderItem>();
        Status = OrderStatus.Draft;
    }
    
    public void AddItem(Product product, int quantity)
    {
        // ビジネスルールの検証と例外
        if (Status != OrderStatus.Draft)
            throw new InvalidOperationException("確定済みの注文には商品を追加できません");
            
        if (product == null)
            throw new ArgumentNullException(nameof(product));
            
        if (quantity <= 0)
            throw new ArgumentException("数量は1以上である必要があります", nameof(quantity));
            
        if (product.Stock < quantity)
            throw new InsufficientInventoryException(product.Id, quantity, product.Stock);
        
        // 重複チェック
        var existingItem = _items.FirstOrDefault(i => i.ProductId == product.Id);
        if (existingItem != null)
        {
            if (product.Stock < existingItem.Quantity + quantity)
                throw new InsufficientInventoryException(product.Id, existingItem.Quantity + quantity, product.Stock);
                
            existingItem.UpdateQuantity(existingItem.Quantity + quantity);
        }
        else
        {
            _items.Add(new OrderItem(product.Id, product.Name, product.Price, quantity));
        }
    }
    
    public void Confirm()
    {
        if (Status != OrderStatus.Draft)
            throw new InvalidOrderException(Id, "下書き状態の注文のみ確定できます");
            
        if (!_items.Any())
            throw new InvalidOrderException(Id, "空の注文は確定できません");
            
        // 最終的な在庫チェック
        foreach (var item in _items)
        {
            if (!IsStockAvailable(item.ProductId, item.Quantity))
                throw new InsufficientInventoryException(item.ProductId, item.Quantity, GetAvailableStock(item.ProductId));
        }
        
        Status = OrderStatus.Confirmed;
    }
    
    private bool IsStockAvailable(int productId, int quantity) => true; // 実装省略
    private int GetAvailableStock(int productId) => 0; // 実装省略
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

### アプリケーション層での例外処理

\`\`\`csharp
// 結果パターンによる例外処理の代替
public class Result<T>
{
    public bool IsSuccess { get; private set; }
    public T Value { get; private set; }
    public string Error { get; private set; }
    public Exception Exception { get; private set; }
    
    private Result(bool isSuccess, T value, string error, Exception exception = null)
    {
        IsSuccess = isSuccess;
        Value = value;
        Error = error;
        Exception = exception;
    }
    
    public static Result<T> Success(T value) => new Result<T>(true, value, null);
    public static Result<T> Failure(string error) => new Result<T>(false, default(T), error);
    public static Result<T> Failure(Exception exception) => new Result<T>(false, default(T), exception.Message, exception);
}

// アプリケーションサービスでの結果パターン使用
public class OrderApplicationService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IProductRepository _productRepository;
    private readonly IPaymentService _paymentService;
    
    public OrderApplicationService(IOrderRepository orderRepository, 
        IProductRepository productRepository, IPaymentService paymentService)
    {
        _orderRepository = orderRepository;
        _productRepository = productRepository;
        _paymentService = paymentService;
    }
    
    public async Task<Result<Order>> CreateOrderAsync(int customerId, List<OrderItemRequest> items)
    {
        try
        {
            var order = new Order(GenerateOrderId());
            
            foreach (var itemRequest in items)
            {
                var product = await _productRepository.GetByIdAsync(itemRequest.ProductId);
                if (product == null)
                    return Result<Order>.Failure($"商品ID {itemRequest.ProductId} が見つかりません");
                
                order.AddItem(product, itemRequest.Quantity);
            }
            
            order.Confirm();
            await _orderRepository.SaveAsync(order);
            
            return Result<Order>.Success(order);
        }
        catch (BusinessException ex)
        {
            return Result<Order>.Failure(ex);
        }
        catch (Exception ex)
        {
            // ログ記録
            LogError(ex, $"注文作成エラー: CustomerId={customerId}");
            return Result<Order>.Failure("注文作成中に予期しないエラーが発生しました");
        }
    }
    
    public async Task<Result<bool>> ProcessPaymentAsync(int orderId, PaymentInfo paymentInfo)
    {
        try
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
                return Result<bool>.Failure($"注文ID {orderId} が見つかりません");
            
            if (order.Status != OrderStatus.Confirmed)
                return Result<bool>.Failure("確定済みの注文のみ支払い処理できます");
            
            var paymentResult = await _paymentService.ProcessPaymentAsync(order.TotalAmount, paymentInfo);
            if (!paymentResult.IsSuccess)
                return Result<bool>.Failure($"支払い処理失敗: {paymentResult.Error}");
            
            order.MarkAsPaid();
            await _orderRepository.SaveAsync(order);
            
            return Result<bool>.Success(true);
        }
        catch (PaymentException ex)
        {
            return Result<bool>.Failure(ex);
        }
        catch (Exception ex)
        {
            LogError(ex, $"支払い処理エラー: OrderId={orderId}");
            return Result<bool>.Failure("支払い処理中に予期しないエラーが発生しました");
        }
    }
    
    private void LogError(Exception ex, string context)
    {
        // ログ記録の実装
        Console.WriteLine($"ERROR [{DateTime.UtcNow}] {context}: {ex}");
    }
    
    private int GenerateOrderId() => new Random().Next(1000, 9999);
}

public class OrderItemRequest
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
}

public class PaymentInfo
{
    public string CardNumber { get; set; }
    public string ExpiryDate { get; set; }
    public string CVV { get; set; }
}
\`\`\`

## 高度な例外処理パターン

### リトライパターン

\`\`\`csharp
public class RetryPolicy
{
    public static async Task<T> ExecuteWithRetryAsync<T>(
        Func<Task<T>> operation,
        int maxRetries = 3,
        TimeSpan delay = default,
        Predicate<Exception> shouldRetry = null)
    {
        if (delay == default) delay = TimeSpan.FromSeconds(1);
        shouldRetry ??= ex => ex is not BusinessException; // ビジネス例外はリトライしない
        
        Exception lastException = null;
        
        for (int attempt = 0; attempt <= maxRetries; attempt++)
        {
            try
            {
                return await operation();
            }
            catch (Exception ex)
            {
                lastException = ex;
                
                if (attempt == maxRetries || !shouldRetry(ex))
                {
                    throw;
                }
                
                Console.WriteLine($"リトライ {attempt + 1}/{maxRetries}: {ex.Message}");
                await Task.Delay(delay);
                delay = TimeSpan.FromMilliseconds(delay.TotalMilliseconds * 2); // 指数バックオフ
            }
        }
        
        throw lastException;
    }
}

// 使用例
public class ExternalPaymentService
{
    public async Task<PaymentResult> ProcessPaymentAsync(decimal amount, PaymentInfo paymentInfo)
    {
        return await RetryPolicy.ExecuteWithRetryAsync(
            async () =>
            {
                // 外部APIへの支払い処理
                var result = await CallExternalPaymentAPI(amount, paymentInfo);
                
                if (!result.Success)
                    throw new PaymentException(paymentInfo.PaymentMethod, amount, result.ErrorMessage);
                
                return result;
            },
            maxRetries: 3,
            delay: TimeSpan.FromSeconds(2),
            shouldRetry: ex => ex is HttpRequestException || ex is TimeoutException
        );
    }
    
    private async Task<PaymentResult> CallExternalPaymentAPI(decimal amount, PaymentInfo paymentInfo)
    {
        // 外部API呼び出しの実装
        await Task.Delay(100); // 模擬
        return new PaymentResult { Success = true };
    }
}

public class PaymentResult
{
    public bool Success { get; set; }
    public string ErrorMessage { get; set; }
    public string TransactionId { get; set; }
}
\`\`\`

### サーキットブレーカーパターン

\`\`\`csharp
public class CircuitBreaker
{
    private readonly int _failureThreshold;
    private readonly TimeSpan _timeout;
    private int _failureCount;
    private DateTime _lastFailureTime;
    private CircuitBreakerState _state = CircuitBreakerState.Closed;
    
    public CircuitBreaker(int failureThreshold = 5, TimeSpan timeout = default)
    {
        _failureThreshold = failureThreshold;
        _timeout = timeout == default ? TimeSpan.FromMinutes(1) : timeout;
    }
    
    public async Task<T> ExecuteAsync<T>(Func<Task<T>> operation)
    {
        if (_state == CircuitBreakerState.Open)
        {
            if (DateTime.UtcNow - _lastFailureTime < _timeout)
            {
                throw new CircuitBreakerOpenException("サーキットブレーカーが開いています");
            }
            
            _state = CircuitBreakerState.HalfOpen;
        }
        
        try
        {
            var result = await operation();
            OnSuccess();
            return result;
        }
        catch (Exception ex)
        {
            OnFailure();
            throw;
        }
    }
    
    private void OnSuccess()
    {
        _failureCount = 0;
        _state = CircuitBreakerState.Closed;
    }
    
    private void OnFailure()
    {
        _failureCount++;
        _lastFailureTime = DateTime.UtcNow;
        
        if (_failureCount >= _failureThreshold)
        {
            _state = CircuitBreakerState.Open;
        }
    }
}

public enum CircuitBreakerState
{
    Closed,
    Open,
    HalfOpen
}

public class CircuitBreakerOpenException : Exception
{
    public CircuitBreakerOpenException(string message) : base(message) { }
}
\`\`\`

## 非同期例外処理

### async/awaitでの例外処理

\`\`\`csharp
public class AsyncExceptionHandling
{
    public async Task<Result<List<Product>>> GetProductsAsync(List<int> productIds)
    {
        try
        {
            var tasks = productIds.Select(async id =>
            {
                try
                {
                    return await GetProductByIdAsync(id);
                }
                catch (ProductNotFoundException)
                {
                    // 個別の商品が見つからない場合はnullを返す
                    return null;
                }
            });
            
            var products = await Task.WhenAll(tasks);
            var validProducts = products.Where(p => p != null).ToList();
            
            return Result<List<Product>>.Success(validProducts);
        }
        catch (Exception ex)
        {
            return Result<List<Product>>.Failure(ex);
        }
    }
    
    public async Task ProcessOrdersAsync(List<Order> orders)
    {
        var semaphore = new SemaphoreSlim(5); // 並行度制限
        var tasks = orders.Select(async order =>
        {
            await semaphore.WaitAsync();
            try
            {
                await ProcessSingleOrderAsync(order);
            }
            catch (Exception ex)
            {
                // 個別注文のエラーは記録するが、全体の処理は続行
                LogError(ex, $"注文処理エラー: OrderId={order.Id}");
            }
            finally
            {
                semaphore.Release();
            }
        });
        
        await Task.WhenAll(tasks);
    }
    
    private async Task<Product> GetProductByIdAsync(int id)
    {
        await Task.Delay(100); // 模擬
        if (id <= 0) throw new ProductNotFoundException(id);
        return new Product { Id = id, Name = $"Product {id}" };
    }
    
    private async Task ProcessSingleOrderAsync(Order order)
    {
        await Task.Delay(200); // 模擬
    }
    
    private void LogError(Exception ex, string context)
    {
        Console.WriteLine($"ERROR: {context} - {ex.Message}");
    }
}

public class ProductNotFoundException : BusinessException
{
    public int ProductId { get; }
    
    public ProductNotFoundException(int productId) 
        : base("PRODUCT_NOT_FOUND", $"商品ID {productId} が見つかりません")
    {
        ProductId = productId;
    }
}
\`\`\`

## グローバル例外処理

### 未処理例外の処理

\`\`\`csharp
public class GlobalExceptionHandler
{
    public static void Initialize()
    {
        // 未処理例外の処理
        AppDomain.CurrentDomain.UnhandledException += (sender, e) =>
        {
            var ex = (Exception)e.ExceptionObject;
            LogCriticalError(ex, "未処理例外が発生しました");
            
            // 必要に応じてアプリケーションを適切に終了
            if (e.IsTerminating)
            {
                Console.WriteLine("アプリケーションが異常終了します");
            }
        };
        
        // Task内の未処理例外の処理
        TaskScheduler.UnobservedTaskException += (sender, e) =>
        {
            LogCriticalError(e.Exception, "Taskで未処理例外が発生しました");
            e.SetObserved(); // 例外を処理済みとしてマーク
        };
    }
    
    private static void LogCriticalError(Exception ex, string message)
    {
        // 重要なエラーログ記録
        Console.WriteLine($"CRITICAL ERROR [{DateTime.UtcNow}]: {message}");
        Console.WriteLine($"Exception: {ex}");
        
        // 外部監視システムへの通知など
        NotifyMonitoringSystem(ex, message);
    }
    
    private static void NotifyMonitoringSystem(Exception ex, string message)
    {
        // 監視システムへの通知実装
    }
}
\`\`\`

## ベストプラクティス

### 例外処理のガイドライン

1. **適切な例外型の使用**
   - システム例外：ArgumentException, InvalidOperationException等
   - ビジネス例外：カスタム例外クラス

2. **例外メッセージの品質**
   - 明確で具体的なメッセージ
   - 問題の原因と対処法の提示

3. **例外の再スロー**
   - 情報を追加しない場合は\`throw;\`を使用
   - 新しい情報を追加する場合は\`throw new Exception(..., innerException)\`

\`\`\`csharp
public class ExceptionBestPractices
{
    public void ProcessData(string data)
    {
        // 良い例：具体的な検証とメッセージ
        if (string.IsNullOrWhiteSpace(data))
            throw new ArgumentException("データが空または空白文字のみです。有効なデータを提供してください。", nameof(data));
        
        try
        {
            var result = ExpensiveOperation(data);
            SaveResult(result);
        }
        catch (DatabaseException ex)
        {
            // コンテキスト情報を追加して再スロー
            throw new DataProcessingException($"データ '{data}' の処理中にデータベースエラーが発生しました", ex);
        }
        catch (Exception ex)
        {
            // ログ記録後に再スロー
            LogError(ex, $"データ処理エラー: {data}");
            throw; // 元の例外情報を保持
        }
    }
    
    // リソース管理と例外安全性
    public async Task<string> ProcessFileAsync(string filePath)
    {
        using var fileStream = new FileStream(filePath, FileMode.Open);
        using var reader = new StreamReader(fileStream);
        
        try
        {
            var content = await reader.ReadToEndAsync();
            return ProcessContent(content);
        }
        catch (Exception ex)
        {
            throw new FileProcessingException($"ファイル '{filePath}' の処理に失敗しました", ex);
        }
        // usingによりリソースは自動的に解放される
    }
}

public class DataProcessingException : BusinessException
{
    public DataProcessingException(string message, Exception innerException) 
        : base("DATA_PROCESSING_FAILED", message, innerException) { }
}

public class FileProcessingException : BusinessException
{
    public FileProcessingException(string message, Exception innerException) 
        : base("FILE_PROCESSING_FAILED", message, innerException) { }
}
\`\`\`

## まとめ

効果的な例外処理は堅牢なアプリケーション構築の基盤です：

- **階層化**: ドメイン、アプリケーション、インフラ層での適切な例外処理
- **カスタム例外**: ビジネス固有の例外クラスによる明確な問題の表現
- **結果パターン**: 例外に代わる安全な戻り値パターン
- **復旧パターン**: リトライやサーキットブレーカーによる障害耐性

DDDにおいては、ドメインルールの違反を適切に表現し、アプリケーション全体の整合性を保つことが重要です。

次のレッスンでは、リソース管理について詳しく学習し、メモリとリソースの効率的な使用方法を理解します。
`,
  codeExamples: [
    {
      id: 'ddd-business-exception-system',
      title: 'DDDビジネス例外システムの実装',
      description: 'ドメイン駆動設計に適したカスタム例外と結果パターンの包括的な実装',
      language: 'csharp',
      code: `using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

// === 基盤例外クラス ===

// ビジネス例外の基底クラス
public abstract class BusinessException : Exception
{
    public string ErrorCode { get; }
    public DateTime OccurredAt { get; }
    public Dictionary<string, object> Context { get; }
    
    protected BusinessException(string errorCode, string message, Dictionary<string, object> context = null) 
        : base(message)
    {
        ErrorCode = errorCode;
        OccurredAt = DateTime.UtcNow;
        Context = context ?? new Dictionary<string, object>();
    }
    
    protected BusinessException(string errorCode, string message, Exception innerException, Dictionary<string, object> context = null) 
        : base(message, innerException)
    {
        ErrorCode = errorCode;
        OccurredAt = DateTime.UtcNow;
        Context = context ?? new Dictionary<string, object>();
    }
    
    public virtual string GetDetailedMessage()
    {
        var details = string.Join(", ", Context.Select(kvp => $"{kvp.Key}: {kvp.Value}"));
        return string.IsNullOrEmpty(details) ? Message : $"{Message} [{details}]";
    }
}

// ドメイン例外
public abstract class DomainException : BusinessException
{
    protected DomainException(string errorCode, string message, Dictionary<string, object> context = null)
        : base(errorCode, message, context) { }
}

// アプリケーション例外
public abstract class ApplicationException : BusinessException
{
    protected ApplicationException(string errorCode, string message, Dictionary<string, object> context = null)
        : base(errorCode, message, context) { }
        
    protected ApplicationException(string errorCode, string message, Exception innerException, Dictionary<string, object> context = null)
        : base(errorCode, message, innerException, context) { }
}

// インフラストラクチャ例外
public abstract class InfrastructureException : BusinessException
{
    protected InfrastructureException(string errorCode, string message, Dictionary<string, object> context = null)
        : base(errorCode, message, context) { }
        
    protected InfrastructureException(string errorCode, string message, Exception innerException, Dictionary<string, object> context = null)
        : base(errorCode, message, innerException, context) { }
}

// === 具体的な例外クラス ===

// ドメイン例外
public class InvalidOrderStateException : DomainException
{
    public int OrderId { get; }
    public OrderStatus CurrentStatus { get; }
    public OrderStatus RequiredStatus { get; }
    
    public InvalidOrderStateException(int orderId, OrderStatus currentStatus, OrderStatus requiredStatus)
        : base("INVALID_ORDER_STATE", 
               $"注文ID {orderId} の状態が不正です。現在: {currentStatus}, 必要: {requiredStatus}",
               new Dictionary<string, object>
               {
                   ["OrderId"] = orderId,
                   ["CurrentStatus"] = currentStatus,
                   ["RequiredStatus"] = requiredStatus
               })
    {
        OrderId = orderId;
        CurrentStatus = currentStatus;
        RequiredStatus = requiredStatus;
    }
}

public class InsufficientStockException : DomainException
{
    public int ProductId { get; }
    public string ProductName { get; }
    public int RequestedQuantity { get; }
    public int AvailableQuantity { get; }
    
    public InsufficientStockException(int productId, string productName, int requestedQuantity, int availableQuantity)
        : base("INSUFFICIENT_STOCK",
               $"商品 '{productName}' の在庫が不足しています。要求: {requestedQuantity}, 利用可能: {availableQuantity}",
               new Dictionary<string, object>
               {
                   ["ProductId"] = productId,
                   ["ProductName"] = productName,
                   ["RequestedQuantity"] = requestedQuantity,
                   ["AvailableQuantity"] = availableQuantity
               })
    {
        ProductId = productId;
        ProductName = productName;
        RequestedQuantity = requestedQuantity;
        AvailableQuantity = availableQuantity;
    }
}

public class CustomerCreditLimitExceededException : DomainException
{
    public int CustomerId { get; }
    public decimal RequestedAmount { get; }
    public decimal CreditLimit { get; }
    public decimal CurrentDebt { get; }
    
    public CustomerCreditLimitExceededException(int customerId, decimal requestedAmount, decimal creditLimit, decimal currentDebt)
        : base("CREDIT_LIMIT_EXCEEDED",
               $"顧客ID {customerId} の与信限度額を超過します。要求額: {requestedAmount:C}, 限度額: {creditLimit:C}, 現在の債務: {currentDebt:C}",
               new Dictionary<string, object>
               {
                   ["CustomerId"] = customerId,
                   ["RequestedAmount"] = requestedAmount,
                   ["CreditLimit"] = creditLimit,
                   ["CurrentDebt"] = currentDebt
               })
    {
        CustomerId = customerId;
        RequestedAmount = requestedAmount;
        CreditLimit = creditLimit;
        CurrentDebt = currentDebt;
    }
}

// アプリケーション例外
public class EntityNotFoundException : ApplicationException
{
    public Type EntityType { get; }
    public object EntityId { get; }
    
    public EntityNotFoundException(Type entityType, object entityId)
        : base("ENTITY_NOT_FOUND",
               $"{entityType.Name} with ID '{entityId}' was not found",
               new Dictionary<string, object>
               {
                   ["EntityType"] = entityType.Name,
                   ["EntityId"] = entityId
               })
    {
        EntityType = entityType;
        EntityId = entityId;
    }
}

public class ValidationException : ApplicationException
{
    public List<ValidationError> ValidationErrors { get; }
    
    public ValidationException(List<ValidationError> validationErrors)
        : base("VALIDATION_FAILED",
               $"Validation failed with {validationErrors.Count} error(s)",
               new Dictionary<string, object>
               {
                   ["ErrorCount"] = validationErrors.Count,
                   ["Errors"] = validationErrors.Select(e => e.Message).ToList()
               })
    {
        ValidationErrors = validationErrors;
    }
}

public class ValidationError
{
    public string PropertyName { get; set; }
    public string Message { get; set; }
    public object AttemptedValue { get; set; }
}

// インフラストラクチャ例外
public class DatabaseConnectionException : InfrastructureException
{
    public string ConnectionString { get; }
    
    public DatabaseConnectionException(string connectionString, Exception innerException)
        : base("DATABASE_CONNECTION_FAILED",
               "データベースへの接続に失敗しました",
               innerException,
               new Dictionary<string, object>
               {
                   ["ConnectionString"] = MaskConnectionString(connectionString)
               })
    {
        ConnectionString = connectionString;
    }
    
    private static string MaskConnectionString(string connectionString)
    {
        // パスワード等をマスク
        return string.IsNullOrEmpty(connectionString) ? "" : "***MASKED***";
    }
}

public class ExternalServiceException : InfrastructureException
{
    public string ServiceName { get; }
    public string Endpoint { get; }
    public int? StatusCode { get; }
    
    public ExternalServiceException(string serviceName, string endpoint, int? statusCode, string message, Exception innerException = null)
        : base("EXTERNAL_SERVICE_FAILED",
               $"External service '{serviceName}' failed: {message}",
               innerException,
               new Dictionary<string, object>
               {
                   ["ServiceName"] = serviceName,
                   ["Endpoint"] = endpoint,
                   ["StatusCode"] = statusCode
               })
    {
        ServiceName = serviceName;
        Endpoint = endpoint;
        StatusCode = statusCode;
    }
}

// === 結果パターンの実装 ===

public class Result<T>
{
    public bool IsSuccess { get; private set; }
    public bool IsFailure => !IsSuccess;
    public T Value { get; private set; }
    public string ErrorMessage { get; private set; }
    public string ErrorCode { get; private set; }
    public Exception Exception { get; private set; }
    public Dictionary<string, object> Context { get; private set; }
    
    private Result(bool isSuccess, T value, string errorMessage, string errorCode, Exception exception, Dictionary<string, object> context)
    {
        IsSuccess = isSuccess;
        Value = value;
        ErrorMessage = errorMessage;
        ErrorCode = errorCode;
        Exception = exception;
        Context = context ?? new Dictionary<string, object>();
    }
    
    public static Result<T> Success(T value)
    {
        return new Result<T>(true, value, null, null, null, null);
    }
    
    public static Result<T> Failure(string errorMessage, string errorCode = null)
    {
        return new Result<T>(false, default(T), errorMessage, errorCode, null, null);
    }
    
    public static Result<T> Failure(BusinessException exception)
    {
        return new Result<T>(false, default(T), exception.GetDetailedMessage(), exception.ErrorCode, exception, exception.Context);
    }
    
    public static Result<T> Failure(Exception exception, string errorCode = "UNEXPECTED_ERROR")
    {
        return new Result<T>(false, default(T), exception.Message, errorCode, exception, null);
    }
    
    public TResult Match<TResult>(Func<T, TResult> onSuccess, Func<string, string, Exception, TResult> onFailure)
    {
        return IsSuccess ? onSuccess(Value) : onFailure(ErrorMessage, ErrorCode, Exception);
    }
    
    public async Task<TResult> MatchAsync<TResult>(Func<T, Task<TResult>> onSuccess, Func<string, string, Exception, Task<TResult>> onFailure)
    {
        return IsSuccess ? await onSuccess(Value) : await onFailure(ErrorMessage, ErrorCode, Exception);
    }
}

// === ドメインモデル ===

public enum OrderStatus
{
    Draft,
    Confirmed,
    Paid,
    Shipped,
    Delivered,
    Cancelled
}

public class Order
{
    public int Id { get; private set; }
    public int CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public decimal TotalAmount => Items.Sum(i => i.TotalPrice);
    
    private readonly List<OrderItem> _items = new List<OrderItem>();
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();
    
    public Order(int id, int customerId)
    {
        Id = id;
        CustomerId = customerId;
        Status = OrderStatus.Draft;
        CreatedAt = DateTime.UtcNow;
    }
    
    public void AddItem(Product product, int quantity, Customer customer)
    {
        if (Status != OrderStatus.Draft)
            throw new InvalidOrderStateException(Id, Status, OrderStatus.Draft);
            
        if (product.Stock < quantity)
            throw new InsufficientStockException(product.Id, product.Name, quantity, product.Stock);
        
        // 与信チェック
        var newTotalAmount = TotalAmount + (product.Price * quantity);
        if (customer.CurrentDebt + newTotalAmount > customer.CreditLimit)
            throw new CustomerCreditLimitExceededException(
                customer.Id, newTotalAmount, customer.CreditLimit, customer.CurrentDebt);
        
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
    
    public void Confirm()
    {
        if (Status != OrderStatus.Draft)
            throw new InvalidOrderStateException(Id, Status, OrderStatus.Draft);
            
        if (!_items.Any())
            throw new InvalidOperationException("Empty order cannot be confirmed");
            
        Status = OrderStatus.Confirmed;
    }
    
    public void MarkAsPaid()
    {
        if (Status != OrderStatus.Confirmed)
            throw new InvalidOrderStateException(Id, Status, OrderStatus.Confirmed);
            
        Status = OrderStatus.Paid;
    }
}

public class OrderItem
{
    public int ProductId { get; private set; }
    public string ProductName { get; private set; }
    public decimal UnitPrice { get; private set; }
    public int Quantity { get; private set; }
    public decimal TotalPrice => UnitPrice * Quantity;
    
    public OrderItem(int productId, string productName, decimal unitPrice, int quantity)
    {
        ProductId = productId;
        ProductName = productName;
        UnitPrice = unitPrice;
        Quantity = quantity;
    }
    
    public void UpdateQuantity(int newQuantity)
    {
        if (newQuantity <= 0)
            throw new ArgumentException("Quantity must be positive");
        Quantity = newQuantity;
    }
}

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    public int Stock { get; set; }
}

public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal CreditLimit { get; set; }
    public decimal CurrentDebt { get; set; }
}

// === アプリケーションサービス ===

public class OrderService
{
    private readonly List<Product> _products;
    private readonly List<Customer> _customers;
    private readonly List<Order> _orders;
    
    public OrderService()
    {
        _products = new List<Product>();
        _customers = new List<Customer>();
        _orders = new List<Order>();
        
        // テストデータの初期化
        InitializeTestData();
    }
    
    public async Task<Result<Order>> CreateOrderAsync(int customerId, List<(int productId, int quantity)> items)
    {
        try
        {
            var customer = _customers.FirstOrDefault(c => c.Id == customerId);
            if (customer == null)
                return Result<Order>.Failure(new EntityNotFoundException(typeof(Customer), customerId));
            
            var order = new Order(GenerateOrderId(), customerId);
            
            foreach (var (productId, quantity) in items)
            {
                var product = _products.FirstOrDefault(p => p.Id == productId);
                if (product == null)
                    return Result<Order>.Failure(new EntityNotFoundException(typeof(Product), productId));
                
                order.AddItem(product, quantity, customer);
            }
            
            order.Confirm();
            _orders.Add(order);
            
            Console.WriteLine($"✅ 注文が正常に作成されました: OrderId={order.Id}, Total={order.TotalAmount:C}");
            return Result<Order>.Success(order);
        }
        catch (BusinessException ex)
        {
            Console.WriteLine($"❌ ビジネス例外: {ex.GetDetailedMessage()}");
            return Result<Order>.Failure(ex);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ 予期しないエラー: {ex.Message}");
            return Result<Order>.Failure(ex);
        }
    }
    
    public async Task<Result<bool>> ProcessPaymentAsync(int orderId, decimal amount)
    {
        try
        {
            var order = _orders.FirstOrDefault(o => o.Id == orderId);
            if (order == null)
                return Result<bool>.Failure(new EntityNotFoundException(typeof(Order), orderId));
            
            if (Math.Abs(order.TotalAmount - amount) > 0.01m)
                return Result<bool>.Failure("支払い金額が注文金額と一致しません", "PAYMENT_AMOUNT_MISMATCH");
            
            // 外部決済サービスの呼び出しをシミュレート
            var paymentResult = await SimulatePaymentProcessing(amount);
            if (!paymentResult)
                throw new ExternalServiceException("PaymentService", "/api/process", null, "Payment processing failed");
            
            order.MarkAsPaid();
            
            Console.WriteLine($"✅ 支払いが正常に処理されました: OrderId={orderId}, Amount={amount:C}");
            return Result<bool>.Success(true);
        }
        catch (BusinessException ex)
        {
            Console.WriteLine($"❌ ビジネス例外: {ex.GetDetailedMessage()}");
            return Result<bool>.Failure(ex);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ 予期しないエラー: {ex.Message}");
            return Result<bool>.Failure(ex);
        }
    }
    
    public Result<List<Order>> GetOrdersByCustomer(int customerId)
    {
        try
        {
            var customer = _customers.FirstOrDefault(c => c.Id == customerId);
            if (customer == null)
                return Result<List<Order>>.Failure(new EntityNotFoundException(typeof(Customer), customerId));
            
            var orders = _orders.Where(o => o.CustomerId == customerId).ToList();
            return Result<List<Order>>.Success(orders);
        }
        catch (Exception ex)
        {
            return Result<List<Order>>.Failure(ex);
        }
    }
    
    private async Task<bool> SimulatePaymentProcessing(decimal amount)
    {
        await Task.Delay(200); // 外部サービス呼び出しの模擬
        
        // 10%の確率で失敗させる
        return new Random().NextDouble() > 0.1;
    }
    
    private int GenerateOrderId()
    {
        return _orders.Count + 1000;
    }
    
    private void InitializeTestData()
    {
        _products.AddRange(new[]
        {
            new Product { Id = 1, Name = "ノートPC", Price = 120000, Stock = 10 },
            new Product { Id = 2, Name = "マウス", Price = 3000, Stock = 50 },
            new Product { Id = 3, Name = "キーボード", Price = 8000, Stock = 30 },
            new Product { Id = 4, Name = "モニター", Price = 45000, Stock = 5 }
        });
        
        _customers.AddRange(new[]
        {
            new Customer { Id = 1, Name = "田中太郎", CreditLimit = 200000, CurrentDebt = 50000 },
            new Customer { Id = 2, Name = "鈴木花子", CreditLimit = 100000, CurrentDebt = 20000 },
            new Customer { Id = 3, Name = "佐藤次郎", CreditLimit = 300000, CurrentDebt = 0 }
        });
    }
}

// === デモプログラム ===

public class Program
{
    public static async Task Main()
    {
        Console.WriteLine("=== DDDビジネス例外システムデモ ===\\n");
        
        var orderService = new OrderService();
        
        // シナリオ1: 正常な注文作成
        Console.WriteLine("--- シナリオ1: 正常な注文作成 ---");
        var result1 = await orderService.CreateOrderAsync(1, new[] { (1, 1), (2, 2) });
        result1.Match(
            onSuccess: order => Console.WriteLine($"注文作成成功: {order.Id}"),
            onFailure: (message, code, ex) => Console.WriteLine($"注文作成失敗: {message}")
        );
        
        // シナリオ2: 在庫不足エラー
        Console.WriteLine("\\n--- シナリオ2: 在庫不足エラー ---");
        var result2 = await orderService.CreateOrderAsync(1, new[] { (4, 10) }); // モニター在庫は5個のみ
        result2.Match(
            onSuccess: order => Console.WriteLine($"注文作成成功: {order.Id}"),
            onFailure: (message, code, ex) =>
            {
                Console.WriteLine($"エラーコード: {code}");
                Console.WriteLine($"エラーメッセージ: {message}");
                if (ex is InsufficientStockException stockEx)
                {
                    Console.WriteLine($"詳細情報: 商品ID={stockEx.ProductId}, 要求={stockEx.RequestedQuantity}, 利用可能={stockEx.AvailableQuantity}");
                }
            }
        );
        
        // シナリオ3: 与信限度額超過
        Console.WriteLine("\\n--- シナリオ3: 与信限度額超過 ---");
        var result3 = await orderService.CreateOrderAsync(2, new[] { (1, 2) }); // 鈴木花子の与信限度額は10万円
        result3.Match(
            onSuccess: order => Console.WriteLine($"注文作成成功: {order.Id}"),
            onFailure: (message, code, ex) =>
            {
                Console.WriteLine($"エラーコード: {code}");
                Console.WriteLine($"エラーメッセージ: {message}");
                if (ex is CustomerCreditLimitExceededException creditEx)
                {
                    Console.WriteLine($"詳細情報: 顧客ID={creditEx.CustomerId}, 限度額={creditEx.CreditLimit:C}, 現在債務={creditEx.CurrentDebt:C}");
                }
            }
        );
        
        // シナリオ4: 存在しない顧客
        Console.WriteLine("\\n--- シナリオ4: 存在しない顧客 ---");
        var result4 = await orderService.CreateOrderAsync(999, new[] { (1, 1) });
        result4.Match(
            onSuccess: order => Console.WriteLine($"注文作成成功: {order.Id}"),
            onFailure: (message, code, ex) => Console.WriteLine($"エラー [{code}]: {message}")
        );
        
        // シナリオ5: 支払い処理（成功・失敗）
        if (result1.IsSuccess)
        {
            Console.WriteLine("\\n--- シナリオ5: 支払い処理 ---");
            var paymentResult = await orderService.ProcessPaymentAsync(result1.Value.Id, result1.Value.TotalAmount);
            paymentResult.Match(
                onSuccess: success => Console.WriteLine("支払い処理成功"),
                onFailure: (message, code, ex) => Console.WriteLine($"支払い処理失敗 [{code}]: {message}")
            );
        }
        
        // シナリオ6: 顧客注文履歴の取得
        Console.WriteLine("\\n--- シナリオ6: 顧客注文履歴 ---");
        var historyResult = orderService.GetOrdersByCustomer(1);
        historyResult.Match(
            onSuccess: orders =>
            {
                Console.WriteLine($"顧客1の注文履歴: {orders.Count}件");
                foreach (var order in orders)
                {
                    Console.WriteLine($"  注文ID: {order.Id}, ステータス: {order.Status}, 金額: {order.TotalAmount:C}");
                }
            },
            onFailure: (message, code, ex) => Console.WriteLine($"履歴取得失敗: {message}")
        );
        
        Console.WriteLine("\\n=== デモ完了 ===");
    }
}`
    },
    {
      id: 'retry-circuit-breaker-pattern',
      title: 'リトライとサーキットブレーカーパターン',
      description: '例外処理を活用した復旧力のあるアプリケーション設計',
      language: 'csharp',
      code: `using System;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

// === リトライポリシー ===

public class RetryPolicy
{
    public int MaxRetries { get; }
    public TimeSpan InitialDelay { get; }
    public TimeSpan MaxDelay { get; }
    public double BackoffMultiplier { get; }
    public Func<Exception, bool> ShouldRetryPredicate { get; }
    
    public RetryPolicy(int maxRetries = 3, TimeSpan initialDelay = default, TimeSpan maxDelay = default,
        double backoffMultiplier = 2.0, Func<Exception, bool> shouldRetryPredicate = null)
    {
        MaxRetries = maxRetries;
        InitialDelay = initialDelay == default ? TimeSpan.FromSeconds(1) : initialDelay;
        MaxDelay = maxDelay == default ? TimeSpan.FromMinutes(1) : maxDelay;
        BackoffMultiplier = backoffMultiplier;
        ShouldRetryPredicate = shouldRetryPredicate ?? DefaultShouldRetryPredicate;
    }
    
    private static bool DefaultShouldRetryPredicate(Exception ex)
    {
        // ビジネス例外はリトライしない
        if (ex is BusinessException) return false;
        
        // 一時的な例外のみリトライ
        return ex is TimeoutException ||
               ex is TaskCanceledException ||
               ex.Message.Contains("timeout") ||
               ex.Message.Contains("connection");
    }
    
    public async Task<T> ExecuteAsync<T>(Func<Task<T>> operation, CancellationToken cancellationToken = default)
    {
        Exception lastException = null;
        var delay = InitialDelay;
        
        for (int attempt = 0; attempt <= MaxRetries; attempt++)
        {
            try
            {
                var result = await operation();
                
                if (attempt > 0)
                {
                    Console.WriteLine($"✅ 操作成功 (試行回数: {attempt + 1})");
                }
                
                return result;
            }
            catch (Exception ex)
            {
                lastException = ex;
                
                if (attempt == MaxRetries || !ShouldRetryPredicate(ex))
                {
                    Console.WriteLine($"❌ リトライ終了: {ex.Message}");
                    throw;
                }
                
                Console.WriteLine($"⚠️ リトライ {attempt + 1}/{MaxRetries}: {ex.Message}");
                Console.WriteLine($"   {delay.TotalSeconds}秒後に再試行...");
                
                await Task.Delay(delay, cancellationToken);
                
                // 指数バックオフ
                delay = TimeSpan.FromMilliseconds(Math.Min(
                    delay.TotalMilliseconds * BackoffMultiplier,
                    MaxDelay.TotalMilliseconds));
            }
        }
        
        throw lastException ?? new InvalidOperationException("Unexpected retry completion");
    }
    
    public async Task ExecuteAsync(Func<Task> operation, CancellationToken cancellationToken = default)
    {
        await ExecuteAsync(async () =>
        {
            await operation();
            return true; // ダミーの戻り値
        }, cancellationToken);
    }
}

// === サーキットブレーカー ===

public enum CircuitState
{
    Closed,   // 正常状態
    Open,     // 障害状態
    HalfOpen  // 回復テスト状態
}

public class CircuitBreaker
{
    private readonly int _failureThreshold;
    private readonly TimeSpan _timeout;
    private readonly TimeSpan _successThreshold;
    
    private int _failureCount;
    private int _successCount;
    private DateTime _lastFailureTime;
    private CircuitState _state = CircuitState.Closed;
    private readonly object _lock = new object();
    
    public CircuitState State
    {
        get
        {
            lock (_lock)
            {
                return _state;
            }
        }
    }
    
    public int FailureCount => _failureCount;
    public DateTime LastFailureTime => _lastFailureTime;
    
    public event EventHandler<CircuitStateChangedEventArgs> StateChanged;
    
    public CircuitBreaker(int failureThreshold = 5, TimeSpan timeout = default, TimeSpan successThreshold = default)
    {
        _failureThreshold = failureThreshold;
        _timeout = timeout == default ? TimeSpan.FromMinutes(1) : timeout;
        _successThreshold = successThreshold == default ? TimeSpan.FromSeconds(30) : successThreshold;
    }
    
    public async Task<T> ExecuteAsync<T>(Func<Task<T>> operation)
    {
        lock (_lock)
        {
            if (_state == CircuitState.Open)
            {
                if (DateTime.UtcNow - _lastFailureTime < _timeout)
                {
                    throw new CircuitBreakerOpenException(
                        $"サーキットブレーカーが開いています。次回試行可能時刻: {_lastFailureTime.Add(_timeout):HH:mm:ss}");
                }
                
                _state = CircuitState.HalfOpen;
                _successCount = 0;
                Console.WriteLine("🟡 サーキットブレーカーがHalf-Open状態に移行しました");
                OnStateChanged(CircuitState.HalfOpen);
            }
        }
        
        try
        {
            var result = await operation();
            await OnSuccess();
            return result;
        }
        catch (Exception ex)
        {
            await OnFailure(ex);
            throw;
        }
    }
    
    public async Task ExecuteAsync(Func<Task> operation)
    {
        await ExecuteAsync(async () =>
        {
            await operation();
            return true;
        });
    }
    
    private async Task OnSuccess()
    {
        lock (_lock)
        {
            _successCount++;
            
            if (_state == CircuitState.HalfOpen)
            {
                if (_successCount >= 3) // 3回連続成功で回復
                {
                    _state = CircuitState.Closed;
                    _failureCount = 0;
                    _successCount = 0;
                    Console.WriteLine("🟢 サーキットブレーカーがClosed状態に回復しました");
                    OnStateChanged(CircuitState.Closed);
                }
            }
            else if (_state == CircuitState.Closed)
            {
                // 成功時は失敗カウントをリセット
                _failureCount = Math.Max(0, _failureCount - 1);
            }
        }
    }
    
    private async Task OnFailure(Exception exception)
    {
        lock (_lock)
        {
            _failureCount++;
            _lastFailureTime = DateTime.UtcNow;
            
            if (_state == CircuitState.HalfOpen)
            {
                _state = CircuitState.Open;
                Console.WriteLine($"🔴 サーキットブレーカーがOpen状態に戻りました (失敗: {exception.Message})");
                OnStateChanged(CircuitState.Open);
            }
            else if (_state == CircuitState.Closed && _failureCount >= _failureThreshold)
            {
                _state = CircuitState.Open;
                Console.WriteLine($"🔴 サーキットブレーカーがOpen状態になりました (失敗回数: {_failureCount})");
                OnStateChanged(CircuitState.Open);
            }
        }
    }
    
    private void OnStateChanged(CircuitState newState)
    {
        StateChanged?.Invoke(this, new CircuitStateChangedEventArgs(newState, DateTime.UtcNow));
    }
}

public class CircuitStateChangedEventArgs : EventArgs
{
    public CircuitState NewState { get; }
    public DateTime ChangedAt { get; }
    
    public CircuitStateChangedEventArgs(CircuitState newState, DateTime changedAt)
    {
        NewState = newState;
        ChangedAt = changedAt;
    }
}

public class CircuitBreakerOpenException : Exception
{
    public CircuitBreakerOpenException(string message) : base(message) { }
}

// === 回復力のあるサービス ===

public class ResilientExternalService
{
    private readonly RetryPolicy _retryPolicy;
    private readonly CircuitBreaker _circuitBreaker;
    private readonly Random _random = new Random();
    
    public ResilientExternalService()
    {
        _retryPolicy = new RetryPolicy(
            maxRetries: 3,
            initialDelay: TimeSpan.FromSeconds(1),
            backoffMultiplier: 2.0
        );
        
        _circuitBreaker = new CircuitBreaker(
            failureThreshold: 3,
            timeout: TimeSpan.FromSeconds(10)
        );
        
        _circuitBreaker.StateChanged += (sender, e) =>
        {
            Console.WriteLine($"🔄 サーキットブレーカー状態変更: {e.NewState} at {e.ChangedAt:HH:mm:ss}");
        };
    }
    
    public async Task<string> CallExternalApiAsync(string endpoint, bool simulateFailure = false)
    {
        return await _circuitBreaker.ExecuteAsync(async () =>
        {
            return await _retryPolicy.ExecuteAsync(async () =>
            {
                return await SimulateApiCall(endpoint, simulateFailure);
            });
        });
    }
    
    private async Task<string> SimulateApiCall(string endpoint, bool simulateFailure)
    {
        await Task.Delay(100); // ネットワーク遅延の模擬
        
        if (simulateFailure || _random.NextDouble() < 0.3) // 30%の確率で失敗
        {
            var errorType = _random.Next(1, 4);
            throw errorType switch
            {
                1 => new TimeoutException("Request timeout"),
                2 => new InvalidOperationException("Service temporarily unavailable"),
                _ => new Exception("Network connection failed")
            };
        }
        
        return $"Success response from {endpoint} at {DateTime.Now:HH:mm:ss.fff}";
    }
    
    public CircuitState GetCircuitState() => _circuitBreaker.State;
    public int GetFailureCount() => _circuitBreaker.FailureCount;
}

// === 複合的な回復力パターン ===

public class ResilientOrderService
{
    private readonly ResilientExternalService _paymentService;
    private readonly ResilientExternalService _inventoryService;
    private readonly ResilientExternalService _notificationService;
    
    public ResilientOrderService()
    {
        _paymentService = new ResilientExternalService();
        _inventoryService = new ResilientExternalService();
        _notificationService = new ResilientExternalService();
    }
    
    public async Task<bool> ProcessOrderAsync(int orderId, bool simulatePaymentFailure = false)
    {
        Console.WriteLine($"\\n🛒 注文処理開始: OrderId={orderId}");
        
        try
        {
            // ステップ1: 在庫確認
            Console.WriteLine("📦 在庫確認中...");
            await _inventoryService.CallExternalApiAsync($"/inventory/check/{orderId}");
            Console.WriteLine("✅ 在庫確認完了");
            
            // ステップ2: 支払い処理
            Console.WriteLine("💳 支払い処理中...");
            await _paymentService.CallExternalApiAsync($"/payment/process/{orderId}", simulatePaymentFailure);
            Console.WriteLine("✅ 支払い処理完了");
            
            // ステップ3: 通知送信（失敗しても全体の処理は続行）
            await SendNotificationSafely(orderId);
            
            Console.WriteLine($"✅ 注文処理完了: OrderId={orderId}");
            return true;
        }
        catch (CircuitBreakerOpenException ex)
        {
            Console.WriteLine($"🔴 サーキットブレーカーエラー: {ex.Message}");
            throw;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ 注文処理失敗: {ex.Message}");
            
            // 失敗時は補償トランザクションを実行
            await ExecuteCompensationAsync(orderId);
            throw;
        }
    }
    
    private async Task SendNotificationSafely(int orderId)
    {
        try
        {
            Console.WriteLine("📧 通知送信中...");
            await _notificationService.CallExternalApiAsync($"/notification/send/{orderId}");
            Console.WriteLine("✅ 通知送信完了");
        }
        catch (Exception ex)
        {
            // 通知の失敗は処理全体の失敗にはしない
            Console.WriteLine($"⚠️ 通知送信失敗 (続行): {ex.Message}");
        }
    }
    
    private async Task ExecuteCompensationAsync(int orderId)
    {
        Console.WriteLine($"🔄 補償トランザクション実行: OrderId={orderId}");
        
        try
        {
            // 在庫ロールバック
            await _inventoryService.CallExternalApiAsync($"/inventory/rollback/{orderId}");
            Console.WriteLine("✅ 在庫ロールバック完了");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ 補償トランザクション失敗: {ex.Message}");
        }
    }
    
    public void ShowServiceStatus()
    {
        Console.WriteLine("\\n📊 サービス状態:");
        Console.WriteLine($"  支払いサービス: {_paymentService.GetCircuitState()} (失敗数: {_paymentService.GetFailureCount()})");
        Console.WriteLine($"  在庫サービス: {_inventoryService.GetCircuitState()} (失敗数: {_inventoryService.GetFailureCount()})");
        Console.WriteLine($"  通知サービス: {_notificationService.GetCircuitState()} (失敗数: {_notificationService.GetFailureCount()})");
    }
}

// === デモプログラム ===

public class Program
{
    public static async Task Main()
    {
        Console.WriteLine("=== リトライ＆サーキットブレーカーデモ ===");
        
        var orderService = new ResilientOrderService();
        
        // シナリオ1: 正常な注文処理
        Console.WriteLine("\\n=== シナリオ1: 正常な注文処理 ===");
        try
        {
            await orderService.ProcessOrderAsync(1001);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"注文処理失敗: {ex.Message}");
        }
        
        orderService.ShowServiceStatus();
        
        // シナリオ2: 支払い失敗とリトライ
        Console.WriteLine("\\n=== シナリオ2: 支払い失敗とリトライ ===");
        try
        {
            await orderService.ProcessOrderAsync(1002, simulatePaymentFailure: true);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"注文処理失敗: {ex.Message}");
        }
        
        orderService.ShowServiceStatus();
        
        // シナリオ3: 連続失敗によるサーキットブレーカー作動
        Console.WriteLine("\\n=== シナリオ3: 連続失敗でサーキットブレーカー作動 ===");
        for (int i = 1003; i <= 1006; i++)
        {
            try
            {
                await orderService.ProcessOrderAsync(i, simulatePaymentFailure: true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"注文{i}失敗: {ex.GetType().Name}");
            }
            
            await Task.Delay(500); // 少し間隔を空ける
        }
        
        orderService.ShowServiceStatus();
        
        // シナリオ4: サーキットブレーカー開放中の処理試行
        Console.WriteLine("\\n=== シナリオ4: サーキットブレーカー開放中の処理 ===");
        try
        {
            await orderService.ProcessOrderAsync(1007);
        }
        catch (CircuitBreakerOpenException ex)
        {
            Console.WriteLine($"予期された失敗: {ex.Message}");
        }
        
        // シナリオ5: 回復待ちと再試行
        Console.WriteLine("\\n=== シナリオ5: 回復待ちと再試行 ===");
        Console.WriteLine("12秒待機してサーキットブレーカーの回復を待ちます...");
        await Task.Delay(TimeSpan.FromSeconds(12));
        
        try
        {
            await orderService.ProcessOrderAsync(1008);
            Console.WriteLine("🎉 サーキットブレーカーが回復し、処理が成功しました！");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"回復後の処理失敗: {ex.Message}");
        }
        
        orderService.ShowServiceStatus();
        
        Console.WriteLine("\\n=== デモ完了 ===");
    }
}`
    }
  ],
  exercises: [
    {
      id: 'exception-1',
      title: 'DDDドメイン例外の設計',
      description: 'Eコマースドメインに特化したカスタム例外クラスと例外処理戦略を実装してください。',
      difficulty: 'hard',
      starterCode: `using System;
using System.Collections.Generic;

// ビジネス例外の基底クラス
public abstract class BusinessException : Exception
{
    public string ErrorCode { get; }
    public Dictionary<string, object> Context { get; }
    
    // TODO: コンストラクタを実装
    
    // TODO: GetDetailedMessage()メソッドを実装
}

// TODO: 以下のドメイン例外クラスを実装
// 1. InvalidPriceException - 無効な価格（負の値、0など）
// 2. ProductOutOfStockException - 商品在庫切れ
// 3. InvalidDiscountException - 無効な割引（100%超、負の値など）
// 4. CustomerNotEligibleException - 顧客が特定の操作に適格でない

// ドメインモデル
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; private set; }
    public int Stock { get; private set; }
    
    public void UpdatePrice(decimal newPrice)
    {
        // TODO: 価格バリデーションと例外処理
        Price = newPrice;
    }
    
    public void ReduceStock(int quantity)
    {
        // TODO: 在庫チェックと例外処理
        Stock -= quantity;
    }
}

public class Discount
{
    public decimal Percentage { get; private set; }
    
    public Discount(decimal percentage)
    {
        // TODO: 割引率バリデーションと例外処理
        Percentage = percentage;
    }
}

public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; }
    public bool IsPremium { get; set; }
    public decimal TotalPurchases { get; set; }
    
    public void ApplyPremiumDiscount(Discount discount)
    {
        // TODO: プレミアム顧客チェックと例外処理
    }
}`,
      solution: `// ビジネス例外の基底クラス
protected BusinessException(string errorCode, string message, Dictionary<string, object> context = null) 
    : base(message)
{
    ErrorCode = errorCode;
    Context = context ?? new Dictionary<string, object>();
}

public virtual string GetDetailedMessage()
{
    if (!Context.Any()) return Message;
    var details = string.Join(", ", Context.Select(kvp => $"{kvp.Key}: {kvp.Value}"));
    return $"{Message} [{details}]";
}

// ドメイン例外の実装
public class InvalidPriceException : BusinessException
{
    public decimal AttemptedPrice { get; }
    
    public InvalidPriceException(decimal attemptedPrice) 
        : base("INVALID_PRICE", 
               $"無効な価格が設定されました: {attemptedPrice:C}",
               new Dictionary<string, object> { ["AttemptedPrice"] = attemptedPrice })
    {
        AttemptedPrice = attemptedPrice;
    }
}

public class ProductOutOfStockException : BusinessException
{
    public int ProductId { get; }
    public int RequestedQuantity { get; }
    public int AvailableStock { get; }
    
    public ProductOutOfStockException(int productId, int requestedQuantity, int availableStock)
        : base("PRODUCT_OUT_OF_STOCK",
               $"商品ID {productId} の在庫が不足しています",
               new Dictionary<string, object>
               {
                   ["ProductId"] = productId,
                   ["RequestedQuantity"] = requestedQuantity,
                   ["AvailableStock"] = availableStock
               })
    {
        ProductId = productId;
        RequestedQuantity = requestedQuantity;
        AvailableStock = availableStock;
    }
}

public class InvalidDiscountException : BusinessException
{
    public decimal AttemptedPercentage { get; }
    
    public InvalidDiscountException(decimal attemptedPercentage)
        : base("INVALID_DISCOUNT",
               $"無効な割引率です: {attemptedPercentage}%",
               new Dictionary<string, object> { ["AttemptedPercentage"] = attemptedPercentage })
    {
        AttemptedPercentage = attemptedPercentage;
    }
}

public class CustomerNotEligibleException : BusinessException
{
    public int CustomerId { get; }
    public string Operation { get; }
    
    public CustomerNotEligibleException(int customerId, string operation)
        : base("CUSTOMER_NOT_ELIGIBLE",
               $"顧客ID {customerId} は操作 '{operation}' を実行する資格がありません",
               new Dictionary<string, object>
               {
                   ["CustomerId"] = customerId,
                   ["Operation"] = operation
               })
    {
        CustomerId = customerId;
        Operation = operation;
    }
}

// ドメインモデルの実装
public void UpdatePrice(decimal newPrice)
{
    if (newPrice <= 0)
        throw new InvalidPriceException(newPrice);
    Price = newPrice;
}

public void ReduceStock(int quantity)
{
    if (Stock < quantity)
        throw new ProductOutOfStockException(Id, quantity, Stock);
    Stock -= quantity;
}

public Discount(decimal percentage)
{
    if (percentage < 0 || percentage > 100)
        throw new InvalidDiscountException(percentage);
    Percentage = percentage;
}

public void ApplyPremiumDiscount(Discount discount)
{
    if (!IsPremium)
        throw new CustomerNotEligibleException(Id, "Premium Discount");
}`,
      hints: [
        'BusinessExceptionのコンストラクタでerrorCode、message、contextを受け取る',
        'GetDetailedMessage()でContextの内容を含めた詳細メッセージを生成',
        '各例外クラスで具体的なプロパティと意味のあるエラーメッセージを提供',
        'ドメインロジックでの検証と適切なタイミングでの例外スロー'
      ],
      testCases: [
        {
          input: 'UpdatePrice(-100)',
          expectedOutput: 'InvalidPriceExceptionがスローされる'
        },
        {
          input: 'ReduceStock(在庫以上の数量)',
          expectedOutput: 'ProductOutOfStockExceptionがスローされる'
        },
        {
          input: 'new Discount(150)',
          expectedOutput: 'InvalidDiscountExceptionがスローされる'
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'exception-quiz-1',
      question: 'DDDにおいてビジネス例外を設計する際の最も重要な原則は？',
      options: [
        'パフォーマンスを最優先する',
        'ドメインルールの違反を明確に表現する',
        '例外を可能な限り使わない',
        'すべての例外を一つのクラスで表現する'
      ],
      correctAnswer: 1,
      explanation: 'DDDでは、ビジネス例外はドメインルールの違反を明確に表現し、ビジネス上の意味を持つ情報を提供することが重要です。'
    },
    {
      id: 'exception-quiz-2',
      question: '結果パターン（Result Pattern）を使用する主な利点は？',
      options: [
        'パフォーマンスの向上',
        '例外の代わりに戻り値で成功・失敗を表現できる',
        'メモリ使用量の削減',
        'コード量の削減'
      ],
      correctAnswer: 1,
      explanation: '結果パターンにより、例外をスローせずに戻り値で成功・失敗の状態を表現でき、より明示的で制御しやすいエラーハンドリングが可能になります。'
    }
  ],
  nextLesson: 'resource-management',
  estimatedTime: 65
};