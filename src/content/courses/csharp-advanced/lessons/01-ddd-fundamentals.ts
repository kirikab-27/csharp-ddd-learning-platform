import type { Lesson } from '../../../../features/learning/types';

export const dddFundamentalsLesson: Lesson = {
  id: 'ddd-fundamentals',
  moduleId: 'ddd-basics',
  title: 'DDD基礎 - ドメイン駆動設計の概念と理念',
  description: 'ドメイン駆動設計の核となる概念、戦略的設計と戦術的設計の違い、そしてDDDがソフトウェア開発に与える価値を学習します',
  content: `
# ドメイン駆動設計 (Domain-Driven Design) 基礎

ドメイン駆動設計（DDD）は、複雑なソフトウェアシステムを設計・開発するための体系的なアプローチです。エリック・エヴァンスによって提唱され、ビジネスの本質（ドメイン）を中心にソフトウェアを設計する手法として広く採用されています。

## DDDとは何か？

### DDDの核となる理念

**「ソフトウェアの心臓部分は、ユーザーのためにドメインに関連した問題を解決することである」**

この理念に基づき、DDDは以下の原則を重視します：

1. **ドメインとモデルを中心に据える**: 技術的な関心事よりもビジネス問題の解決を優先
2. **チーム間の共通言語**: 開発者とドメインエキスパート間でのコミュニケーション向上
3. **複雑性の管理**: 大規模システムを理解可能な単位に分割
4. **継続的な学習**: ドメインへの理解を深め続ける

### 従来のアプローチとの違い

\`\`\`csharp
// 従来のデータ中心アプローチ
public class User
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UserService
{
    public void CreateUser(string name, string email)
    {
        var user = new User 
        { 
            Name = name, 
            Email = email, 
            CreatedAt = DateTime.Now 
        };
        _repository.Save(user);
    }
}
\`\`\`

\`\`\`csharp
// DDD アプローチ
public class Customer
{
    private Customer(CustomerId id, CustomerName name, EmailAddress email)
    {
        Id = id ?? throw new ArgumentNullException(nameof(id));
        Name = name ?? throw new ArgumentNullException(nameof(name));
        Email = email ?? throw new ArgumentNullException(nameof(email));
        RegisteredAt = DateTime.UtcNow;
        Status = CustomerStatus.Active;
    }
    
    public CustomerId Id { get; private set; }
    public CustomerName Name { get; private set; }
    public EmailAddress Email { get; private set; }
    public DateTime RegisteredAt { get; private set; }
    public CustomerStatus Status { get; private set; }
    
    public static Customer Register(CustomerName name, EmailAddress email)
    {
        // ビジネスルールの検証
        if (string.IsNullOrWhiteSpace(name.Value))
            throw new DomainException("顧客名は必須です");
            
        return new Customer(CustomerId.NewId(), name, email);
    }
    
    public void ChangeEmail(EmailAddress newEmail)
    {
        if (Status == CustomerStatus.Suspended)
            throw new DomainException("停止中の顧客はメールアドレスを変更できません");
            
        Email = newEmail;
        // ドメインイベントを発行
        DomainEvents.Raise(new CustomerEmailChangedEvent(Id, newEmail));
    }
}
\`\`\`

## DDDの構成要素

### 戦略的設計 (Strategic Design)

大きな視点からシステム全体を捉える設計アプローチ：

#### 1. ドメイン (Domain)
組織が解決しようとする問題領域全体

\`\`\`csharp
// ECサイトドメインの例
namespace ECommerce.Domain
{
    // 注文管理サブドメイン
    namespace OrderManagement { }
    
    // 顧客管理サブドメイン  
    namespace CustomerManagement { }
    
    // 商品カタログサブドメイン
    namespace ProductCatalog { }
    
    // 支払いサブドメイン
    namespace Payment { }
}
\`\`\`

#### 2. サブドメイン (Subdomain)
ドメインをより小さな問題領域に分割したもの

- **コアドメイン**: 競合優位性の源泉となる最重要領域
- **支援サブドメイン**: コアドメインを支える重要な領域  
- **汎用サブドメイン**: 一般的で差別化要因にならない領域

#### 3. 境界づけられたコンテキスト (Bounded Context)
モデルが有効な境界線

\`\`\`csharp
// 販売コンテキスト内の商品
namespace Sales.Domain
{
    public class Product
    {
        public ProductId Id { get; private set; }
        public string Name { get; private set; }
        public Money Price { get; private set; }
        public int StockQuantity { get; private set; }
        
        public bool IsAvailableForSale() => StockQuantity > 0;
    }
}

// 在庫管理コンテキスト内の商品
namespace Inventory.Domain  
{
    public class Product
    {
        public ProductId Id { get; private set; }
        public string SKU { get; private set; }
        public int CurrentStock { get; private set; }
        public int ReorderPoint { get; private set; }
        public SupplierInfo Supplier { get; private set; }
        
        public bool RequiresReorder() => CurrentStock <= ReorderPoint;
    }
}
\`\`\`

### 戦術的設計 (Tactical Design)

境界づけられたコンテキスト内でのモデル実装に関する設計パターン：

#### 主要な構成要素

1. **エンティティ (Entity)**: アイデンティティを持つオブジェクト
2. **バリューオブジェクト (Value Object)**: 値そのものを表現するオブジェクト
3. **集約 (Aggregate)**: データ整合性の境界
4. **ドメインサービス (Domain Service)**: エンティティやバリューオブジェクトに属さないビジネスロジック
5. **リポジトリ (Repository)**: データ永続化の抽象化
6. **ファクトリー (Factory)**: 複雑なオブジェクト生成の抽象化

## ユビキタス言語 (Ubiquitous Language)

開発チームとドメインエキスパートが共有する共通言語

### 悪い例
\`\`\`csharp
public class UserManager
{
    public void ProcessUserAction(int userId, string action)
    {
        var user = GetUser(userId);
        if (action == "buy")
        {
            // 購入処理
            user.Balance -= GetItemPrice();
            user.Items.Add(new Item());
        }
    }
}
\`\`\`

### 良い例
\`\`\`csharp
public class Customer
{
    public void PlaceOrder(Product product, Quantity quantity)
    {
        if (!CanAfford(product.Price.Multiply(quantity)))
            throw new InsufficientFundsException();
            
        var order = Order.CreateNew(Id, product, quantity);
        _orders.Add(order);
        
        DomainEvents.Raise(new OrderPlacedEvent(order));
    }
    
    private bool CanAfford(Money amount)
    {
        return AccountBalance.IsGreaterThanOrEqual(amount);
    }
}
\`\`\`

## DDDの利点

### 1. ビジネス価値の向上
- **要求と実装の一致**: ビジネス要求がコードに直接反映される
- **変更への対応**: ビジネス変更が局所化され、影響範囲が限定される
- **知識の蓄積**: ドメイン知識がコードとして蓄積される

### 2. 開発効率の向上
- **コミュニケーション改善**: ユビキタス言語による円滑な意思疎通
- **コードの可読性**: ビジネス用語がそのままコードに現れる
- **保守性の向上**: 責務が明確で、変更箇所が予測しやすい

### 3. システム品質の向上
- **整合性の確保**: 集約による不変性の保証
- **テスタビリティ**: ドメインロジックの独立性によるテストしやすさ
- **拡張性**: 境界づけられたコンテキストによる柔軟な拡張

## DDDを適用すべき場面

### 適用に適したプロジェクト
- **複雑なビジネスロジック**: 単純なCRUD操作を超える複雑な業務処理
- **長期間の開発**: 継続的な機能追加や変更が予想される
- **大規模チーム**: 複数チームでの開発
- **ドメインエキスパートとの協業**: ビジネス知識の深いステークホルダーの存在

### 適用を避けるべき場面
- **単純なアプリケーション**: 基本的なCRUD操作のみ
- **短期間プロジェクト**: 数週間程度の小規模開発
- **データ中心の処理**: レポート生成やバッチ処理中心
- **技術的制約が強い**: 既存システムとの統合制約が多い

## 実践的なDDD実装例

### ECサイトの注文処理

\`\`\`csharp
// 注文集約
public class Order : AggregateRoot<OrderId>
{
    private readonly List<OrderItem> _items = new();
    private OrderStatus _status;
    
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();
    public OrderStatus Status => _status;
    public Money TotalAmount { get; private set; }
    public CustomerId CustomerId { get; private set; }
    public DateTime OrderDate { get; private set; }
    
    private Order() { } // for ORM
    
    internal Order(OrderId id, CustomerId customerId)
    {
        Id = id;
        CustomerId = customerId;
        OrderDate = DateTime.UtcNow;
        _status = OrderStatus.Draft;
        TotalAmount = Money.Zero;
    }
    
    public void AddItem(Product product, Quantity quantity)
    {
        if (_status != OrderStatus.Draft)
            throw new DomainException("確定済みの注文には商品を追加できません");
            
        if (!product.IsAvailableInQuantity(quantity))
            throw new DomainException($"商品 {product.Name} の在庫が不足しています");
            
        var existingItem = _items.FirstOrDefault(item => item.ProductId == product.Id);
        if (existingItem != null)
        {
            existingItem.IncreaseQuantity(quantity);
        }
        else
        {
            var newItem = new OrderItem(product.Id, product.Name, product.Price, quantity);
            _items.Add(newItem);
        }
        
        RecalculateTotalAmount();
        
        AddDomainEvent(new ItemAddedToOrderEvent(Id, product.Id, quantity));
    }
    
    public void Confirm()
    {
        if (_items.Count == 0)
            throw new DomainException("商品が選択されていない注文は確定できません");
            
        if (_status != OrderStatus.Draft)
            throw new DomainException("下書き状態の注文のみ確定できます");
            
        _status = OrderStatus.Confirmed;
        
        AddDomainEvent(new OrderConfirmedEvent(Id, CustomerId, TotalAmount));
    }
    
    private void RecalculateTotalAmount()
    {
        TotalAmount = _items.Aggregate(Money.Zero, (sum, item) => sum.Add(item.SubTotal));
    }
}

// 注文ドメインサービス
public class OrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IProductRepository _productRepository;
    
    public OrderService(
        IOrderRepository orderRepository,
        ICustomerRepository customerRepository,
        IProductRepository productRepository)
    {
        _orderRepository = orderRepository;
        _customerRepository = customerRepository;
        _productRepository = productRepository;
    }
    
    public async Task<Order> CreateOrderForCustomer(CustomerId customerId)
    {
        var customer = await _customerRepository.FindByIdAsync(customerId);
        if (customer == null)
            throw new DomainException("指定された顧客が見つかりません");
            
        if (!customer.CanPlaceOrder())
            throw new DomainException("この顧客は注文を行うことができません");
            
        var order = Order.CreateNew(customerId);
        await _orderRepository.SaveAsync(order);
        
        return order;
    }
    
    public async Task ProcessOrderPayment(OrderId orderId, PaymentMethod paymentMethod)
    {
        var order = await _orderRepository.FindByIdAsync(orderId);
        if (order == null)
            throw new DomainException("指定された注文が見つかりません");
            
        var customer = await _customerRepository.FindByIdAsync(order.CustomerId);
        
        // 支払い能力のチェック
        if (!customer.CanAffordAmount(order.TotalAmount))
            throw new DomainException("支払い能力が不足しています");
            
        // 支払い処理（外部サービス連携はインフラストラクチャ層で実装）
        var paymentResult = await ProcessPaymentExternally(order.TotalAmount, paymentMethod);
        
        if (paymentResult.IsSuccessful)
        {
            order.MarkAsPaid(paymentResult.TransactionId);
            await _orderRepository.SaveAsync(order);
        }
        else
        {
            order.MarkAsPaymentFailed(paymentResult.FailureReason);
            throw new PaymentFailedException(paymentResult.FailureReason);
        }
    }
}
\`\`\`

## まとめ

ドメイン駆動設計は、複雑なビジネス問題を解決するための強力な手法です：

### 重要なポイント
1. **ドメイン中心**: 技術よりもビジネス問題の解決を優先
2. **共通言語**: ステークホルダー間の効果的なコミュニケーション
3. **戦略的設計**: システム全体の構造を俯瞰的に設計
4. **戦術的設計**: 具体的な実装パターンの適用
5. **継続的改善**: ドメイン理解の深化に伴うモデルの進化

### 次のステップ
1. エンティティとバリューオブジェクトの実装
2. 集約とドメインサービスの設計
3. リポジトリパターンの実装
4. ドメインイベントの活用

DDDは一朝一夕で習得できるものではありませんが、段階的に学習することで、より良いソフトウェアを構築できるようになります。次のレッスンでは、具体的な実装パターンについて詳しく学習します。
`,
  codeExamples: [
    {
      id: 'ddd-vs-traditional-comparison',
      title: 'DDD vs 従来アプローチの比較',
      description: 'データ中心設計とドメイン中心設計の具体的な違いを示す例',
      language: 'csharp',
      code: `using System;
using System.Collections.Generic;
using System.Linq;

// === 従来のデータ中心アプローチ ===
namespace TraditionalApproach
{
    // 貧血モデル（Anemic Model）
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public decimal Balance { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<Order> Orders { get; set; } = new();
    }
    
    public class Order
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public decimal Amount { get; set; }
        public DateTime OrderDate { get; set; }
        public string Status { get; set; }
    }
    
    // サービスにすべてのロジックが集約
    public class UserService
    {
        private readonly IUserRepository _userRepository;
        
        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }
        
        public void CreateOrder(int userId, decimal amount)
        {
            var user = _userRepository.GetById(userId);
            if (user == null)
                throw new Exception("User not found");
                
            // ビジネスルールがサービスに散在
            if (user.Balance < amount)
                throw new Exception("Insufficient balance");
                
            if (amount <= 0)
                throw new Exception("Invalid amount");
                
            var order = new Order
            {
                UserId = userId,
                Amount = amount,
                OrderDate = DateTime.Now,
                Status = "Pending"
            };
            
            user.Balance -= amount;
            user.Orders.Add(order);
            
            _userRepository.Save(user);
        }
    }
}

// === DDD アプローチ ===
namespace DDDApproach
{
    // バリューオブジェクト
    public class Money
    {
        public decimal Amount { get; private set; }
        public string Currency { get; private set; }
        
        public Money(decimal amount, string currency = "JPY")
        {
            if (amount < 0)
                throw new ArgumentException("金額は0以上である必要があります");
                
            Amount = amount;
            Currency = currency;
        }
        
        public Money Add(Money other)
        {
            if (Currency != other.Currency)
                throw new InvalidOperationException("異なる通貨同士は加算できません");
                
            return new Money(Amount + other.Amount, Currency);
        }
        
        public Money Subtract(Money other)
        {
            if (Currency != other.Currency)
                throw new InvalidOperationException("異なる通貨同士は減算できません");
                
            return new Money(Amount - other.Amount, Currency);
        }
        
        public bool IsGreaterThanOrEqual(Money other)
        {
            return Amount >= other.Amount && Currency == other.Currency;
        }
        
        public static Money Zero => new Money(0);
    }
    
    public class CustomerId
    {
        public Guid Value { get; private set; }
        
        public CustomerId(Guid value)
        {
            if (value == Guid.Empty)
                throw new ArgumentException("顧客IDは空にできません");
                
            Value = value;
        }
        
        public static CustomerId NewId() => new CustomerId(Guid.NewGuid());
        
        public override bool Equals(object obj) => obj is CustomerId other && Value.Equals(other.Value);
        public override int GetHashCode() => Value.GetHashCode();
    }
    
    public class EmailAddress
    {
        public string Value { get; private set; }
        
        public EmailAddress(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("メールアドレスは必須です");
                
            if (!IsValidEmail(value))
                throw new ArgumentException("有効なメールアドレス形式ではありません");
                
            Value = value.ToLowerInvariant();
        }
        
        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
        
        public override string ToString() => Value;
    }
    
    // エンティティ（リッチモデル）
    public class Customer : AggregateRoot<CustomerId>
    {
        private readonly List<Order> _orders = new();
        
        public string Name { get; private set; }
        public EmailAddress Email { get; private set; }
        public Money AccountBalance { get; private set; }
        public DateTime RegisteredAt { get; private set; }
        public CustomerStatus Status { get; private set; }
        
        public IReadOnlyList<Order> Orders => _orders.AsReadOnly();
        
        private Customer() { } // for ORM
        
        private Customer(CustomerId id, string name, EmailAddress email, Money initialBalance)
        {
            Id = id;
            Name = name ?? throw new ArgumentNullException(nameof(name));
            Email = email ?? throw new ArgumentNullException(nameof(email));
            AccountBalance = initialBalance ?? Money.Zero;
            RegisteredAt = DateTime.UtcNow;
            Status = CustomerStatus.Active;
        }
        
        public static Customer Register(string name, EmailAddress email, Money initialBalance = null)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new DomainException("顧客名は必須です");
                
            return new Customer(CustomerId.NewId(), name, email, initialBalance ?? Money.Zero);
        }
        
        public Order PlaceOrder(Money amount)
        {
            // ビジネスルールの検証
            if (Status != CustomerStatus.Active)
                throw new DomainException("アクティブでない顧客は注文できません");
                
            if (!CanAfford(amount))
                throw new DomainException("残高が不足しています");
                
            if (amount.Amount <= 0)
                throw new DomainException("注文金額は0より大きい必要があります");
            
            // 残高から差し引き
            AccountBalance = AccountBalance.Subtract(amount);
            
            // 注文作成
            var order = Order.CreateNew(Id, amount);
            _orders.Add(order);
            
            // ドメインイベント発行
            AddDomainEvent(new OrderPlacedEvent(Id, order.Id, amount));
            
            return order;
        }
        
        public void AddFunds(Money amount)
        {
            if (Status == CustomerStatus.Suspended)
                throw new DomainException("停止中の顧客は入金できません");
                
            AccountBalance = AccountBalance.Add(amount);
            
            AddDomainEvent(new FundsAddedEvent(Id, amount));
        }
        
        public bool CanAfford(Money amount)
        {
            return AccountBalance.IsGreaterThanOrEqual(amount);
        }
        
        public void Suspend(string reason)
        {
            if (Status == CustomerStatus.Suspended)
                return;
                
            Status = CustomerStatus.Suspended;
            
            AddDomainEvent(new CustomerSuspendedEvent(Id, reason));
        }
    }
    
    public class Order : Entity<OrderId>
    {
        public CustomerId CustomerId { get; private set; }
        public Money Amount { get; private set; }
        public DateTime OrderDate { get; private set; }
        public OrderStatus Status { get; private set; }
        
        private Order() { } // for ORM
        
        internal Order(OrderId id, CustomerId customerId, Money amount)
        {
            Id = id;
            CustomerId = customerId;
            Amount = amount;
            OrderDate = DateTime.UtcNow;
            Status = OrderStatus.Pending;
        }
        
        internal static Order CreateNew(CustomerId customerId, Money amount)
        {
            return new Order(OrderId.NewId(), customerId, amount);
        }
        
        public void Confirm()
        {
            if (Status != OrderStatus.Pending)
                throw new DomainException("ペンディング状態の注文のみ確定できます");
                
            Status = OrderStatus.Confirmed;
        }
        
        public void Cancel()
        {
            if (Status == OrderStatus.Completed)
                throw new DomainException("完了済みの注文はキャンセルできません");
                
            Status = OrderStatus.Cancelled;
        }
    }
    
    public enum CustomerStatus
    {
        Active,
        Suspended,
        Closed
    }
    
    public enum OrderStatus
    {
        Pending,
        Confirmed,
        Completed,
        Cancelled
    }
    
    // ドメインサービス
    public class CustomerDomainService
    {
        public bool CanCustomerPlaceOrder(Customer customer, Money orderAmount)
        {
            // 複雑なビジネスルールの判定
            if (customer.Status != CustomerStatus.Active)
                return false;
                
            // 大口注文の場合は追加チェック
            if (orderAmount.Amount > 100000)
            {
                // 過去30日の注文履歴をチェック
                var recentOrders = customer.Orders
                    .Where(o => o.OrderDate > DateTime.UtcNow.AddDays(-30))
                    .ToList();
                    
                var totalRecentAmount = recentOrders
                    .Aggregate(Money.Zero, (sum, order) => sum.Add(order.Amount));
                    
                // 月間注文上限をチェック
                if (totalRecentAmount.Add(orderAmount).Amount > 500000)
                    return false;
            }
            
            return customer.CanAfford(orderAmount);
        }
    }
}

public class Program
{
    public static void Main()
    {
        // === DDD アプローチの使用例 ===
        
        // 顧客登録
        var email = new EmailAddress("customer@example.com");
        var customer = Customer.Register("田中太郎", email, new Money(50000));
        
        Console.WriteLine($"顧客登録: {customer.Name}");
        Console.WriteLine($"初期残高: ¥\{customer.AccountBalance.Amount:N0\}");
        
        // 注文作成
        try
        {
            var orderAmount = new Money(25000);
            var order = customer.PlaceOrder(orderAmount);
            
            Console.WriteLine($"\\n注文作成成功:");
            Console.WriteLine($"注文ID: {order.Id.Value}");
            Console.WriteLine($"注文金額: ¥\{order.Amount.Amount:N0\}");
            Console.WriteLine($"残り残高: ¥\{customer.AccountBalance.Amount:N0\}");
        }
        catch (DomainException ex)
        {
            Console.WriteLine($"注文失敗: {ex.Message}");
        }
        
        // 残高不足での注文試行
        try
        {
            var largeOrderAmount = new Money(50000);
            customer.PlaceOrder(largeOrderAmount);
        }
        catch (DomainException ex)
        {
            Console.WriteLine($"\\n大口注文失敗: {ex.Message}");
        }
        
        // 入金
        customer.AddFunds(new Money(30000));
        Console.WriteLine($"\\n入金後残高: ¥\{customer.AccountBalance.Amount:N0\}");
        
        // ドメインサービスの使用
        var domainService = new CustomerDomainService();
        var canPlaceOrder = domainService.CanCustomerPlaceOrder(customer, new Money(40000));
        Console.WriteLine($"大口注文可能: {canPlaceOrder}");
    }
}

// 基底クラスとイベント関連（簡略化版）
public abstract class Entity<TId>
{
    public TId Id { get; protected set; }
    
    public override bool Equals(object obj)
    {
        if (obj is not Entity<TId> other) return false;
        return Id.Equals(other.Id);
    }
    
    public override int GetHashCode() => Id.GetHashCode();
}

public abstract class AggregateRoot<TId> : Entity<TId>
{
    private readonly List<IDomainEvent> _domainEvents = new();
    
    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    
    protected void AddDomainEvent(IDomainEvent eventItem)
    {
        _domainEvents.Add(eventItem);
    }
    
    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}

public interface IDomainEvent
{
    DateTime OccurredOn { get; }
}

public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
}

// ID用バリューオブジェクト
public class OrderId
{
    public Guid Value { get; private set; }
    
    public OrderId(Guid value)
    {
        Value = value == Guid.Empty ? throw new ArgumentException("OrderId cannot be empty") : value;
    }
    
    public static OrderId NewId() => new OrderId(Guid.NewGuid());
    public override bool Equals(object obj) => obj is OrderId other && Value.Equals(other.Value);
    public override int GetHashCode() => Value.GetHashCode();
}

// ドメインイベント例
public class OrderPlacedEvent : IDomainEvent
{
    public CustomerId CustomerId { get; }
    public OrderId OrderId { get; }
    public Money Amount { get; }
    public DateTime OccurredOn { get; }
    
    public OrderPlacedEvent(CustomerId customerId, OrderId orderId, Money amount)
    {
        CustomerId = customerId;
        OrderId = orderId;
        Amount = amount;
        OccurredOn = DateTime.UtcNow;
    }
}

public class FundsAddedEvent : IDomainEvent
{
    public CustomerId CustomerId { get; }
    public Money Amount { get; }
    public DateTime OccurredOn { get; }
    
    public FundsAddedEvent(CustomerId customerId, Money amount)
    {
        CustomerId = customerId;
        Amount = amount;
        OccurredOn = DateTime.UtcNow;
    }
}

public class CustomerSuspendedEvent : IDomainEvent
{
    public CustomerId CustomerId { get; }
    public string Reason { get; }
    public DateTime OccurredOn { get; }
    
    public CustomerSuspendedEvent(CustomerId customerId, string reason)
    {
        CustomerId = customerId;
        Reason = reason;
        OccurredOn = DateTime.UtcNow;
    }
}`
    },
    {
      id: 'ubiquitous-language-example',
      title: 'ユビキタス言語の実践例',
      description: 'ビジネス用語がそのままコードに反映されたDDD実装例',
      language: 'csharp',
      code: `using System;
using System.Collections.Generic;
using System.Linq;

// === 保険ドメインの例 ===
namespace Insurance.Domain
{
    // ユビキタス言語に基づく概念のモデリング
    
    /// <summary>
    /// 保険契約 - ドメインの中核概念
    /// </summary>
    public class InsurancePolicy : AggregateRoot<PolicyNumber>
    {
        private readonly List<Claim> _claims = new();
        private readonly List<Premium> _premiums = new();
        
        public PolicyHolder PolicyHolder { get; private set; }
        public Coverage Coverage { get; private set; }
        public PolicyPeriod Period { get; private set; }
        public PolicyStatus Status { get; private set; }
        public DateTime EffectiveDate { get; private set; }
        public DateTime? ExpirationDate { get; private set; }
        
        public IReadOnlyList<Claim> Claims => _claims.AsReadOnly();
        public IReadOnlyList<Premium> Premiums => _premiums.AsReadOnly();
        
        private InsurancePolicy() { } // for ORM
        
        public static InsurancePolicy Issue(
            PolicyNumber policyNumber,
            PolicyHolder policyHolder, 
            Coverage coverage, 
            PolicyPeriod period)
        {
            // 引受審査のビジネスルール
            if (policyHolder.Age < coverage.MinimumAge)
                throw new UnderwritingException($"年齢{policyHolder.Age}歳は最低年齢{coverage.MinimumAge}歳を下回っています");
                
            if (policyHolder.HasHighRiskOccupation() && !coverage.CoversHighRiskOccupation)
                throw new UnderwritingException("高リスク職業は対象外です");
            
            return new InsurancePolicy
            {
                Id = policyNumber,
                PolicyHolder = policyHolder,
                Coverage = coverage,
                Period = period,
                Status = PolicyStatus.Active,
                EffectiveDate = period.StartDate,
                ExpirationDate = period.EndDate
            };
        }
        
        /// <summary>
        /// 保険金請求を受理する
        /// </summary>
        public Claim ReceiveClaim(ClaimAmount claimAmount, AccidentDetails accidentDetails)
        {
            // ビジネスルール: 有効な契約のみ請求可能
            if (Status != PolicyStatus.Active)
                throw new PolicyException("無効な契約では保険金請求できません");
                
            // ビジネスルール: 契約期間内の事故のみ対象
            if (!Period.Contains(accidentDetails.AccidentDate))
                throw new PolicyException("契約期間外の事故は保険金請求の対象外です");
                
            // ビジネスルール: 保険金額上限チェック
            if (claimAmount.Amount > Coverage.MaximumBenefit.Amount)
                throw new PolicyException($"請求額が保険金額上限{Coverage.MaximumBenefit.Amount:C}を超えています");
            
            var claim = Claim.Create(
                ClaimNumber.Generate(),
                Id,
                claimAmount,
                accidentDetails);
                
            _claims.Add(claim);
            
            // ドメインイベント発行
            AddDomainEvent(new ClaimReceivedEvent(Id, claim.ClaimNumber, claimAmount));
            
            return claim;
        }
        
        /// <summary>
        /// 保険料支払いを記録する
        /// </summary>
        public void RecordPremiumPayment(Money amount, DateTime paymentDate)
        {
            var dueDate = CalculateNextPremiumDueDate();
            
            // 支払期限チェック
            if (paymentDate > dueDate.AddDays(30)) // 30日の猶予期間
            {
                // 契約失効処理
                Lapse("保険料未払いによる失効");
                throw new PolicyException("支払期限を過ぎているため、契約が失効しました");
            }
            
            var premium = Premium.CreatePayment(amount, paymentDate, dueDate);
            _premiums.Add(premium);
            
            // 失効状態からの復活
            if (Status == PolicyStatus.Lapsed)
            {
                Reinstate();
            }
            
            AddDomainEvent(new PremiumPaidEvent(Id, amount, paymentDate));
        }
        
        /// <summary>
        /// 契約を失効させる
        /// </summary>
        public void Lapse(string reason)
        {
            if (Status == PolicyStatus.Terminated)
                throw new PolicyException("既に解約済みの契約は失効できません");
                
            Status = PolicyStatus.Lapsed;
            
            AddDomainEvent(new PolicyLapsedEvent(Id, reason, DateTime.UtcNow));
        }
        
        /// <summary>
        /// 契約を復活させる
        /// </summary>
        public void Reinstate()
        {
            if (Status != PolicyStatus.Lapsed)
                throw new PolicyException("失効状態の契約のみ復活できます");
                
            // 復活条件の確認
            var outstandingPremiums = CalculateOutstandingPremiums();
            if (outstandingPremiums.Amount > 0)
                throw new PolicyException("未払い保険料がある間は復活できません");
                
            Status = PolicyStatus.Active;
            
            AddDomainEvent(new PolicyReinstatedEvent(Id, DateTime.UtcNow));
        }
        
        /// <summary>
        /// 次回保険料支払期日を計算
        /// </summary>
        private DateTime CalculateNextPremiumDueDate()
        {
            var lastPayment = _premiums.OrderByDescending(p => p.PaymentDate).FirstOrDefault();
            if (lastPayment == null)
                return EffectiveDate.AddMonths(1); // 初回は契約日の1ヶ月後
                
            return lastPayment.DueDate.AddMonths(1);
        }
        
        /// <summary>
        /// 未払い保険料を計算
        /// </summary>
        private Money CalculateOutstandingPremiums()
        {
            var totalDue = Period.CalculateTotalPremiumDue(Coverage.MonthlyPremium);
            var totalPaid = _premiums.Sum(p => p.Amount.Amount);
            
            return new Money(Math.Max(0, totalDue.Amount - totalPaid));
        }
    }
    
    /// <summary>
    /// 契約者
    /// </summary>
    public class PolicyHolder : ValueObject
    {
        public PersonName Name { get; private set; }
        public int Age { get; private set; }
        public Gender Gender { get; private set; }
        public Occupation Occupation { get; private set; }
        public Address Address { get; private set; }
        public ContactInformation Contact { get; private set; }
        
        public PolicyHolder(PersonName name, int age, Gender gender, 
                           Occupation occupation, Address address, ContactInformation contact)
        {
            Name = name ?? throw new ArgumentNullException(nameof(name));
            Age = age > 0 ? age : throw new ArgumentException("年齢は1以上である必要があります");
            Gender = gender;
            Occupation = occupation ?? throw new ArgumentNullException(nameof(occupation));
            Address = address ?? throw new ArgumentNullException(nameof(address));
            Contact = contact ?? throw new ArgumentNullException(nameof(contact));
        }
        
        /// <summary>
        /// 高リスク職業かどうか判定
        /// </summary>
        public bool HasHighRiskOccupation()
        {
            return Occupation.RiskLevel == OccupationRiskLevel.High;
        }
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Name;
            yield return Age;
            yield return Gender;
            yield return Occupation;
            yield return Address;
            yield return Contact;
        }
    }
    
    /// <summary>
    /// 補償内容
    /// </summary>
    public class Coverage : ValueObject
    {
        public CoverageType Type { get; private set; }
        public Money MaximumBenefit { get; private set; }
        public Money MonthlyPremium { get; private set; }
        public int MinimumAge { get; private set; }
        public int MaximumAge { get; private set; }
        public bool CoversHighRiskOccupation { get; private set; }
        public List<CoveredRisk> CoveredRisks { get; private set; }
        
        public Coverage(CoverageType type, Money maximumBenefit, Money monthlyPremium,
                       int minimumAge, int maximumAge, bool coversHighRiskOccupation,
                       List<CoveredRisk> coveredRisks)
        {
            Type = type;
            MaximumBenefit = maximumBenefit ?? throw new ArgumentNullException(nameof(maximumBenefit));
            MonthlyPremium = monthlyPremium ?? throw new ArgumentNullException(nameof(monthlyPremium));
            MinimumAge = minimumAge;
            MaximumAge = maximumAge;
            CoversHighRiskOccupation = coversHighRiskOccupation;
            CoveredRisks = coveredRisks ?? new List<CoveredRisk>();
            
            if (minimumAge >= maximumAge)
                throw new ArgumentException("最低年齢は最高年齢未満である必要があります");
        }
        
        /// <summary>
        /// 指定されたリスクが補償対象かどうか
        /// </summary>
        public bool CoversRisk(RiskType riskType)
        {
            return CoveredRisks.Any(risk => risk.Type == riskType);
        }
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Type;
            yield return MaximumBenefit;
            yield return MonthlyPremium;
            yield return MinimumAge;
            yield return MaximumAge;
            yield return CoversHighRiskOccupation;
            foreach (var risk in CoveredRisks)
                yield return risk;
        }
    }
    
    /// <summary>
    /// 保険金請求
    /// </summary>
    public class Claim : Entity<ClaimNumber>
    {
        public PolicyNumber PolicyNumber { get; private set; }
        public ClaimAmount ClaimAmount { get; private set; }
        public AccidentDetails AccidentDetails { get; private set; }
        public ClaimStatus Status { get; private set; }
        public DateTime ReceivedDate { get; private set; }
        public DateTime? ProcessedDate { get; private set; }
        public Money? ApprovedAmount { get; private set; }
        public string DecisionReason { get; private set; }
        
        private Claim() { } // for ORM
        
        internal static Claim Create(ClaimNumber claimNumber, PolicyNumber policyNumber,
                                   ClaimAmount claimAmount, AccidentDetails accidentDetails)
        {
            return new Claim
            {
                Id = claimNumber,
                PolicyNumber = policyNumber,
                ClaimAmount = claimAmount,
                AccidentDetails = accidentDetails,
                Status = ClaimStatus.UnderReview,
                ReceivedDate = DateTime.UtcNow
            };
        }
        
        /// <summary>
        /// 保険金請求を承認する
        /// </summary>
        public void Approve(Money approvedAmount, string reason)
        {
            if (Status != ClaimStatus.UnderReview)
                throw new ClaimException("審査中以外の請求は承認できません");
                
            if (approvedAmount.Amount > ClaimAmount.Amount)
                throw new ClaimException("承認金額は請求金額を超えることはできません");
            
            Status = ClaimStatus.Approved;
            ApprovedAmount = approvedAmount;
            DecisionReason = reason;
            ProcessedDate = DateTime.UtcNow;
        }
        
        /// <summary>
        /// 保険金請求を拒否する
        /// </summary>
        public void Reject(string reason)
        {
            if (Status != ClaimStatus.UnderReview)
                throw new ClaimException("審査中以外の請求は拒否できません");
                
            if (string.IsNullOrWhiteSpace(reason))
                throw new ArgumentException("拒否理由は必須です");
            
            Status = ClaimStatus.Rejected;
            DecisionReason = reason;
            ProcessedDate = DateTime.UtcNow;
        }
    }
    
    // ドメインサービス
    /// <summary>
    /// 保険料計算サービス
    /// </summary>
    public class PremiumCalculationService
    {
        /// <summary>
        /// リスク要因に基づいて保険料を計算する
        /// </summary>
        public Money CalculatePremium(PolicyHolder policyHolder, Coverage coverage)
        {
            var basePremium = coverage.MonthlyPremium;
            var riskMultiplier = 1.0m;
            
            // 年齢による調整
            if (policyHolder.Age < 30)
                riskMultiplier *= 0.9m; // 若年割引
            else if (policyHolder.Age > 60)
                riskMultiplier *= 1.5m; // 高齢割増
                
            // 職業による調整
            switch (policyHolder.Occupation.RiskLevel)
            {
                case OccupationRiskLevel.Low:
                    riskMultiplier *= 0.8m;
                    break;
                case OccupationRiskLevel.Medium:
                    riskMultiplier *= 1.0m;
                    break;
                case OccupationRiskLevel.High:
                    riskMultiplier *= 2.0m;
                    break;
            }
            
            // 性別による調整（統計的データに基づく）
            if (policyHolder.Gender == Gender.Female)
                riskMultiplier *= 0.95m;
            
            var adjustedAmount = basePremium.Amount * riskMultiplier;
            return new Money(Math.Round(adjustedAmount, 0)); // 円単位で丸め
        }
    }
    
    /// <summary>
    /// 引受審査サービス
    /// </summary>
    public class UnderwritingService
    {
        /// <summary>
        /// 引受可能性を判定する
        /// </summary>
        public UnderwritingDecision Evaluate(PolicyHolder policyHolder, Coverage coverage)
        {
            var risks = new List<UnderwritingRisk>();
            
            // 年齢チェック
            if (policyHolder.Age < coverage.MinimumAge || policyHolder.Age > coverage.MaximumAge)
            {
                return UnderwritingDecision.Decline("年齢が引受範囲外です");
            }
            
            // 職業リスクチェック
            if (policyHolder.HasHighRiskOccupation() && !coverage.CoversHighRiskOccupation)
            {
                return UnderwritingDecision.Decline("高リスク職業は引受対象外です");
            }
            
            // 既往症チェック（簡略化）
            if (policyHolder.Age > 50)
            {
                risks.Add(new UnderwritingRisk("高年齢", RiskSeverity.Medium, "健康診断書要求"));
            }
            
            if (policyHolder.HasHighRiskOccupation())
            {
                risks.Add(new UnderwritingRisk("高リスク職業", RiskSeverity.High, "職業証明書要求"));
            }
            
            // 総合判定
            if (risks.Any(r => r.Severity == RiskSeverity.High))
            {
                return UnderwritingDecision.ConditionalAccept("条件付引受", risks);
            }
            
            return risks.Any() 
                ? UnderwritingDecision.ConditionalAccept("条件付引受", risks)
                : UnderwritingDecision.Accept("標準引受");
        }
    }
}

// 列挙型とその他の型
public enum PolicyStatus { Active, Lapsed, Terminated }
public enum ClaimStatus { UnderReview, Approved, Rejected, Paid }
public enum CoverageType { Life, Health, Accident, Disability }
public enum Gender { Male, Female, Other }
public enum OccupationRiskLevel { Low, Medium, High }
public enum RiskType { Death, Injury, Illness, Disability }
public enum RiskSeverity { Low, Medium, High, Critical }

// バリューオブジェクト例
public class PolicyNumber : ValueObject
{
    public string Value { get; private set; }
    
    public PolicyNumber(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("契約番号は必須です");
        if (value.Length != 10)
            throw new ArgumentException("契約番号は10桁である必要があります");
            
        Value = value;
    }
    
    public static PolicyNumber Generate()
    {
        var timestamp = DateTime.Now.ToString("yyyyMMdd");
        var random = new Random().Next(10, 99);
        return new PolicyNumber($"{timestamp}{random}");
    }
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}

public class ClaimNumber : ValueObject
{
    public string Value { get; private set; }
    
    public ClaimNumber(string value)
    {
        Value = value ?? throw new ArgumentNullException(nameof(value));
    }
    
    public static ClaimNumber Generate()
    {
        return new ClaimNumber($"CLM{DateTime.Now:yyyyMMddHHmmss}");
    }
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}

public class ClaimAmount : ValueObject
{
    public decimal Amount { get; private set; }
    
    public ClaimAmount(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("請求金額は0より大きい必要があります");
        Amount = amount;
    }
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Amount;
    }
}

// 例外クラス
public class PolicyException : DomainException
{
    public PolicyException(string message) : base(message) { }
}

public class ClaimException : DomainException  
{
    public ClaimException(string message) : base(message) { }
}

public class UnderwritingException : DomainException
{
    public UnderwritingException(string message) : base(message) { }
}

public class Program
{
    public static void Main()
    {
        Console.WriteLine("=== 保険ドメインの例 ===\\n");
        
        // 契約者情報の作成
        var policyHolder = new PolicyHolder(
            new PersonName("山田", "太郎"),
            35,
            Gender.Male,
            new Occupation("エンジニア", OccupationRiskLevel.Low),
            new Address("東京都渋谷区", "150-0001"),
            new ContactInformation("03-1234-5678", "yamada@example.com")
        );
        
        // 補償内容の設定
        var coverage = new Coverage(
            CoverageType.Life,
            new Money(10000000), // 1000万円
            new Money(15000),    // 月額1.5万円
            20, 70, false,
            new List<CoveredRisk> 
            { 
                new CoveredRisk(RiskType.Death),
                new CoveredRisk(RiskType.Disability)
            });
        
        try
        {
            // 保険契約の発行
            var policy = InsurancePolicy.Issue(
                PolicyNumber.Generate(),
                policyHolder,
                coverage,
                new PolicyPeriod(DateTime.Today, DateTime.Today.AddYears(10))
            );
            
            Console.WriteLine($"保険契約発行成功:");
            Console.WriteLine($"契約番号: {policy.Id.Value}");
            Console.WriteLine($"契約者: {policy.PolicyHolder.Name}");
            Console.WriteLine($"月額保険料: ¥\{policy.Coverage.MonthlyPremium.Amount:N0\}");
            
            // 保険金請求の作成
            var accidentDetails = new AccidentDetails(
                DateTime.Today.AddDays(-10),
                "交通事故による入院",
                "病院での治療費");
                
            var claim = policy.ReceiveClaim(
                new ClaimAmount(500000),
                accidentDetails);
                
            Console.WriteLine($"\\n保険金請求受理:");
            Console.WriteLine($"請求番号: {claim.Id.Value}");
            Console.WriteLine($"請求金額: ¥\{claim.ClaimAmount.Amount:N0\}");
            Console.WriteLine($"事故日: {claim.AccidentDetails.AccidentDate:yyyy/MM/dd}");
            
            // 保険金請求の承認
            claim.Approve(new Money(450000), "治療費として妥当な金額");
            Console.WriteLine($"\\n請求承認:");
            Console.WriteLine($"承認金額: ¥\{claim.ApprovedAmount.Amount:N0\}");
            Console.WriteLine($"ステータス: {claim.Status}");
            
        }
        catch (Exception ex)
        {
            Console.WriteLine($"エラー: {ex.Message}");
        }
    }
}`
    }
  ],
  exercises: [
    {
      id: 'ddd-exercise-1',
      title: 'ドメインモデリング演習',
      description: '銀行ドメインの基本的な概念をDDDの原則に従ってモデリングしてください。',
      difficulty: 'medium',
      starterCode: `using System;
using System.Collections.Generic;

// 銀行ドメインをDDDの原則に従ってモデリングしてください
// 要件:
// 1. 銀行口座（BankAccount）エンティティを作成
// 2. 口座番号（AccountNumber）バリューオブジェクトを作成
// 3. 金額（Money）バリューオブジェクトを作成
// 4. 預金・引き出し・残高照会の機能を実装
// 5. 適切なビジネスルール（残高不足チェックなど）を実装

public class BankAccount : AggregateRoot<AccountNumber>
{
    // TODO: プロパティとメソッドを実装してください
}

public class AccountNumber : ValueObject
{
    // TODO: 口座番号のバリューオブジェクトを実装してください
}

public class Money : ValueObject  
{
    // TODO: 金額のバリューオブジェクトを実装してください
}`,
      solution: `public class BankAccount : AggregateRoot<AccountNumber>
{
    public string AccountHolderName { get; private set; }
    public Money Balance { get; private set; }
    public AccountType Type { get; private set; }
    public DateTime OpenedDate { get; private set; }
    public AccountStatus Status { get; private set; }
    
    private BankAccount() { } // for ORM
    
    public static BankAccount Open(AccountNumber accountNumber, string accountHolderName, AccountType type, Money initialDeposit = null)
    {
        if (string.IsNullOrWhiteSpace(accountHolderName))
            throw new DomainException("口座名義人は必須です");
            
        return new BankAccount
        {
            Id = accountNumber,
            AccountHolderName = accountHolderName,
            Balance = initialDeposit ?? Money.Zero,
            Type = type,
            OpenedDate = DateTime.UtcNow,
            Status = AccountStatus.Active
        };
    }
    
    public void Deposit(Money amount)
    {
        if (Status != AccountStatus.Active)
            throw new DomainException("アクティブでない口座には入金できません");
            
        Balance = Balance.Add(amount);
        AddDomainEvent(new MoneyDepositedEvent(Id, amount));
    }
    
    public void Withdraw(Money amount)
    {
        if (Status != AccountStatus.Active)
            throw new DomainException("アクティブでない口座から出金はできません");
            
        if (Balance.Amount < amount.Amount)
            throw new DomainException("残高が不足しています");
            
        Balance = Balance.Subtract(amount);
        AddDomainEvent(new MoneyWithdrawnEvent(Id, amount));
    }
}

public class AccountNumber : ValueObject
{
    public string Value { get; private set; }
    
    public AccountNumber(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length != 10)
            throw new ArgumentException("口座番号は10桁である必要があります");
        Value = value;
    }
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}

public class Money : ValueObject
{
    public decimal Amount { get; private set; }
    public string Currency { get; private set; }
    
    public Money(decimal amount, string currency = "JPY")
    {
        if (amount < 0)
            throw new ArgumentException("金額は0以上である必要があります");
        Amount = amount;
        Currency = currency;
    }
    
    public Money Add(Money other) => new Money(Amount + other.Amount, Currency);
    public Money Subtract(Money other) => new Money(Amount - other.Amount, Currency);
    
    public static Money Zero => new Money(0);
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Amount;
        yield return Currency;
    }
}`,
      hints: [
        'エンティティは一意の識別子を持ち、ライフサイクルを通じて追跡される',
        'バリューオブジェクトは不変で、値による等価性を持つ',
        'ビジネスルールはドメインオブジェクト内に実装する',
        'ドメインイベントを使って重要な業務イベントを表現する'
      ],
      testCases: [
        {
          input: '口座開設、入金100円、出金50円',
          expectedOutput: '残高50円の口座が作成される'
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'ddd-quiz-1',
      question: 'DDDにおける「ユビキタス言語」の主な目的は何ですか？',
      options: [
        'プログラミング言語を統一すること',
        '開発者とドメインエキスパートの共通言語を作ること',
        'データベース設計を標準化すること',
        'テストコードを書きやすくすること'
      ],
      correctAnswer: 1,
      explanation: 'ユビキタス言語は、開発者とドメインエキスパート（業務の専門家）が共有する共通の言語です。この言語を使うことで、要件の誤解を減らし、より正確にビジネスロジックをコードに反映できます。'
    },
    {
      id: 'ddd-quiz-2', 
      question: 'エンティティとバリューオブジェクトの主な違いは何ですか？',
      options: [
        'エンティティは不変、バリューオブジェクトは可変',
        'エンティティは識別子を持つ、バリューオブジェクトは値による等価性',
        'エンティティはデータベースに保存、バリューオブジェクトはメモリのみ',
        'エンティティは複雑、バリューオブジェクトは単純'
      ],
      correctAnswer: 1,
      explanation: 'エンティティは一意の識別子（ID）を持ち、ライフサイクルを通じて同じものとして追跡されます。バリューオブジェクトは識別子を持たず、含まれる値によって等価性が判断されます。'
    },
    {
      id: 'ddd-quiz-3',
      question: '境界づけられたコンテキストの目的は何ですか？',
      options: [
        'データベースのテーブル設計を明確にする',
        'モデルが有効な境界を定義し、異なるコンテキスト間での概念の混乱を防ぐ',
        'マイクロサービスのAPI設計を標準化する',
        'チーム間の責任分担を決める'
      ],
      correctAnswer: 1,
      explanation: '境界づけられたコンテキストは、特定のドメインモデルが有効な境界を定義します。これにより、同じ概念でも異なるコンテキストでは異なる意味を持つことを許可し、モデルの一貫性を保ちます。'
    }
  ],
  nextLesson: 'entities-and-value-objects',
  estimatedTime: 60
};