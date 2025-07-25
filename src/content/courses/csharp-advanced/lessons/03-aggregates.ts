import type { Lesson } from '../../../../features/learning/types';

export const aggregatesLesson: Lesson = {
  id: 'aggregates',
  moduleId: 'ddd-tactical-patterns',
  title: '集約とドメインサービス - データ整合性とビジネスロジックの境界',
  description: 'DDDの核となる集約パターンの設計と実装、ドメインサービスを使った複雑なビジネスロジックの表現方法を詳しく学習します',
  content: `
# 集約（Aggregate）とドメインサービス

集約は、DDDにおいてデータの一貫性境界を定義する最も重要な戦術パターンです。関連するエンティティとバリューオブジェクトを一つの単位としてまとめ、ビジネス不変性を保護します。

## 集約とは何か？

### 集約の定義と特徴

**集約（Aggregate）**は、**データ変更の一貫性境界**を定義するエンティティとバリューオブジェクトのクラスターです：

1. **一貫性境界**: トランザクション境界と一致する
2. **集約ルート**: 外部からのアクセスポイント（エンティティ）
3. **不変性の保護**: ビジネスルールの強制
4. **ライフサイクル管理**: 作成から削除までの管理

### 集約ルート（Aggregate Root）

集約ルートは集約への唯一のエントリーポイントです：

\`\`\`csharp
public abstract class AggregateRoot<TId> : Entity<TId>
{
    private readonly List<IDomainEvent> _domainEvents = new();
    private int _version = 0;
    
    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    public int Version { get; protected set; }
    
    protected void AddDomainEvent(IDomainEvent eventItem)
    {
        _domainEvents.Add(eventItem);
    }
    
    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
    
    public void MarkEventsAsCommitted()
    {
        _domainEvents.Clear();
        _version++;
    }
    
    // 楽観的並行性制御用
    protected void CheckVersion(int expectedVersion)
    {
        if (_version != expectedVersion)
            throw new ConcurrencyException($"Expected version \\{expectedVersion\\}, but was \\{_version\\}");
    }
}
\`\`\`

## 実践的な集約の設計

### 注文集約の完全な実装

\`\`\`csharp
public class Order : AggregateRoot<OrderId>
{
    private readonly List<OrderItem> _items = new();
    private OrderStatus _status;
    private Money _totalAmount;
    
    public CustomerId CustomerId { get; private set; }
    public OrderNumber OrderNumber { get; private set; }
    public OrderStatus Status => _status;
    public Money TotalAmount => _totalAmount;
    public Address DeliveryAddress { get; private set; }
    public DateTime OrderDate { get; private set; }
    public DateTime? ConfirmationDate { get; private set; }
    public DateTime? ShipmentDate { get; private set; }
    public PaymentInformation PaymentInfo { get; private set; }
    
    // ビジネスルール
    public bool CanBeModified => _status == OrderStatus.Draft;
    public bool CanBeCancelled => _status == OrderStatus.Draft || _status == OrderStatus.Confirmed;
    public bool IsReadyForShipment => _status == OrderStatus.Paid;
    
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();
    
    private Order() { } // for ORM
    
    // ファクトリーメソッド
    public static Order Create(CustomerId customerId, Address deliveryAddress)
    {
        var order = new Order
        {
            Id = OrderId.NewId(),
            CustomerId = customerId ?? throw new ArgumentNullException(nameof(customerId)),
            OrderNumber = OrderNumber.Generate(),
            DeliveryAddress = deliveryAddress ?? throw new ArgumentNullException(nameof(deliveryAddress)),
            OrderDate = DateTime.UtcNow,
            _status = OrderStatus.Draft,
            _totalAmount = Money.Zero
        };
        
        order.AddDomainEvent(new OrderCreatedEvent(order.Id, customerId));
        return order;
    }
    
    // 集約内でのビジネスロジック
    public void AddItem(Product product, Quantity quantity, Money unitPrice)
    {
        if (!CanBeModified)
            throw new OrderException($"Status \\{_status\\} の注文は変更できません");
            
        if (product == null)
            throw new ArgumentNullException(nameof(product));
            
        if (quantity.Value <= 0)
            throw new ArgumentException("数量は1以上である必要があります");
            
        // 同じ商品が既に存在するかチェック
        var existingItem = _items.FirstOrDefault(item => item.ProductId.Equals(product.Id));
        
        if (existingItem != null)
        {
            // 既存アイテムの数量を増加
            existingItem.IncreaseQuantity(quantity);
            AddDomainEvent(new OrderItemQuantityIncreasedEvent(Id, product.Id, quantity));
        }
        else
        {
            // 新しいアイテムを追加
            var newItem = OrderItem.Create(
                OrderItemId.NewId(),
                product.Id,
                product.Name,
                quantity,
                unitPrice
            );
            
            _items.Add(newItem);
            AddDomainEvent(new OrderItemAddedEvent(Id, product.Id, quantity, unitPrice));
        }
        
        RecalculateTotal();
    }
    
    public void RemoveItem(ProductId productId)
    {
        if (!CanBeModified)
            throw new OrderException($"Status \\{_status\\} の注文は変更できません");
            
        var item = _items.FirstOrDefault(i => i.ProductId.Equals(productId));
        if (item == null)
            throw new OrderException("指定された商品は注文に含まれていません");
            
        _items.Remove(item);
        RecalculateTotal();
        
        AddDomainEvent(new OrderItemRemovedEvent(Id, productId));
    }
    
    public void ChangeItemQuantity(ProductId productId, Quantity newQuantity)
    {
        if (!CanBeModified)
            throw new OrderException($"Status \\{_status\\} の注文は変更できません");
            
        var item = _items.FirstOrDefault(i => i.ProductId.Equals(productId));
        if (item == null)
            throw new OrderException("指定された商品は注文に含まれていません");
            
        var oldQuantity = item.Quantity;
        item.ChangeQuantity(newQuantity);
        RecalculateTotal();
        
        AddDomainEvent(new OrderItemQuantityChangedEvent(Id, productId, oldQuantity, newQuantity));
    }
    
    public void UpdateDeliveryAddress(Address newAddress)
    {
        if (_status != OrderStatus.Draft && _status != OrderStatus.Confirmed)
            throw new OrderException($"Status \\{_status\\} の注文は配送先を変更できません");
            
        var oldAddress = DeliveryAddress;
        DeliveryAddress = newAddress ?? throw new ArgumentNullException(nameof(newAddress));
        
        AddDomainEvent(new OrderDeliveryAddressChangedEvent(Id, oldAddress, newAddress));
    }
    
    // 状態遷移メソッド
    public void Confirm()
    {
        if (_status != OrderStatus.Draft)
            throw new OrderException($"Status \\{_status\\} の注文は確定できません");
            
        if (!_items.Any())
            throw new OrderException("空の注文は確定できません");
            
        if (_totalAmount.Amount <= 0)
            throw new OrderException("合計金額が0以下の注文は確定できません");
            
        _status = OrderStatus.Confirmed;
        ConfirmationDate = DateTime.UtcNow;
        
        AddDomainEvent(new OrderConfirmedEvent(Id, CustomerId, _totalAmount));
    }
    
    public void MarkAsPaid(PaymentInformation paymentInfo)
    {
        if (_status != OrderStatus.Confirmed)
            throw new OrderException($"Status \\{_status\\} の注文は支払い完了にできません");
            
        PaymentInfo = paymentInfo ?? throw new ArgumentNullException(nameof(paymentInfo));
        _status = OrderStatus.Paid;
        
        AddDomainEvent(new OrderPaidEvent(Id, paymentInfo.TransactionId, _totalAmount));
    }
    
    public void Ship(DateTime shipmentDate, TrackingNumber trackingNumber)
    {
        if (_status != OrderStatus.Paid)
            throw new OrderException($"Status \\{_status\\} の注文は出荷できません");
            
        _status = OrderStatus.Shipped;
        ShipmentDate = shipmentDate;
        
        AddDomainEvent(new OrderShippedEvent(Id, shipmentDate, trackingNumber));
    }
    
    public void Complete()
    {
        if (_status != OrderStatus.Shipped)
            throw new OrderException($"Status \\{_status\\} の注文は完了にできません");
            
        _status = OrderStatus.Completed;
        
        AddDomainEvent(new OrderCompletedEvent(Id, DateTime.UtcNow));
    }
    
    public void Cancel(string reason)
    {
        if (!CanBeCancelled)
            throw new OrderException($"Status \\{_status\\} の注文はキャンセルできません");
            
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("キャンセル理由は必須です", nameof(reason));
            
        _status = OrderStatus.Cancelled;
        
        AddDomainEvent(new OrderCancelledEvent(Id, reason, DateTime.UtcNow));
    }
    
    // 集約内での一貫性保証
    private void RecalculateTotal()
    {
        _totalAmount = _items.Aggregate(
            Money.Zero,
            (sum, item) => sum.Add(item.SubTotal)
        );
    }
    
    // ビジネスルール検証
    public ValidationResult ValidateForConfirmation()
    {
        var errors = new List<string>();
        
        if (!_items.Any())
            errors.Add("注文に商品が含まれていません");
            
        if (_totalAmount.Amount <= 0)
            errors.Add("注文金額が不正です");
            
        if (DeliveryAddress == null)
            errors.Add("配送先住所が設定されていません");
            
        // 在庫チェックなど、外部リソースが必要な検証は
        // ドメインサービスで実装
        
        return new ValidationResult(errors);
    }
    
    // 集約レベルでのビジネスクエリ
    public Money CalculateShippingCost(ShippingPolicy shippingPolicy)
    {
        return shippingPolicy.CalculateShippingCost(_totalAmount, DeliveryAddress, _items.Count);
    }
    
    public bool IsEligibleForFreeShipping(Money freeShippingThreshold)
    {
        return _totalAmount.IsGreaterThanOrEqual(freeShippingThreshold);
    }
    
    public bool ContainsFragileItems()
    {
        return _items.Any(item => item.IsFragile);
    }
}

// 集約内のエンティティ
public class OrderItem : Entity<OrderItemId>
{
    public ProductId ProductId { get; private set; }
    public string ProductName { get; private set; }
    public Quantity Quantity { get; private set; }
    public Money UnitPrice { get; private set; }
    public Money SubTotal { get; private set; }
    public bool IsFragile { get; private set; }
    public ProductCategory Category { get; private set; }
    
    private OrderItem() { } // for ORM
    
    internal static OrderItem Create(OrderItemId id, ProductId productId, string productName, 
                                   Quantity quantity, Money unitPrice)
    {
        var item = new OrderItem
        {
            Id = id,
            ProductId = productId,
            ProductName = productName,
            Quantity = quantity,
            UnitPrice = unitPrice
        };
        
        item.RecalculateSubTotal();
        return item;
    }
    
    internal void IncreaseQuantity(Quantity additionalQuantity)
    {
        Quantity = new Quantity(Quantity.Value + additionalQuantity.Value);
        RecalculateSubTotal();
    }
    
    internal void ChangeQuantity(Quantity newQuantity)
    {
        if (newQuantity.Value <= 0)
            throw new ArgumentException("数量は1以上である必要があります");
            
        Quantity = newQuantity;
        RecalculateSubTotal();
    }
    
    private void RecalculateSubTotal()
    {
        SubTotal = UnitPrice.Multiply(Quantity.Value);
    }
}
\`\`\`

## ドメインサービス（Domain Service）

### ドメインサービスが必要な場面

ドメインサービスは、**単一のエンティティやバリューオブジェクトに属さない**ビジネスロジックを実装します：

1. **複数の集約にまたがる処理**
2. **外部リソースとの連携**
3. **複雑な計算ロジック**
4. **ポリシーの実装**

### 注文ドメインサービスの実装

\`\`\`csharp
public class OrderDomainService
{
    private readonly IProductRepository _productRepository;
    private readonly IInventoryService _inventoryService;
    private readonly IPricingService _pricingService;
    
    public OrderDomainService(
        IProductRepository productRepository,
        IInventoryService inventoryService,
        IPricingService pricingService)
    {
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _inventoryService = inventoryService ?? throw new ArgumentNullException(nameof(inventoryService));
        _pricingService = pricingService ?? throw new ArgumentNullException(nameof(pricingService));
    }
    
    /// <summary>
    /// 注文確定前の総合検証
    /// </summary>
    public async Task<OrderValidationResult> ValidateOrderForConfirmation(Order order)
    {
        var validationErrors = new List<string>();
        var warnings = new List<string>();
        
        // 基本的な検証（集約内で実行）
        var basicValidation = order.ValidateForConfirmation();
        validationErrors.AddRange(basicValidation.Errors);
        
        // 在庫確認（外部サービスとの連携）
        foreach (var item in order.Items)
        {
            var availableStock = await _inventoryService.GetAvailableStockAsync(item.ProductId);
            if (availableStock < item.Quantity.Value)
            {
                validationErrors.Add($"商品 '\\{item.ProductName\\}' の在庫が不足しています (必要: \\{item.Quantity.Value\\}, 在庫: \\{availableStock\\})");
            }
            else if (availableStock < item.Quantity.Value * 2)
            {
                warnings.Add($"商品 '\\{item.ProductName\\}' の在庫が少なくなっています");
            }
        }
        
        // 価格整合性チェック
        foreach (var item in order.Items)
        {
            var currentPrice = await _pricingService.GetCurrentPriceAsync(item.ProductId);
            var priceDifference = Math.Abs(currentPrice.Amount - item.UnitPrice.Amount);
            var priceChangeThreshold = item.UnitPrice.Amount * 0.05m; // 5%の変動まで許容
            
            if (priceDifference > priceChangeThreshold)
            {
                validationErrors.Add($"商品 '\\{item.ProductName\\}' の価格が大きく変更されています (注文時: \\{item.UnitPrice\\}, 現在: \\{currentPrice\\})");
            }
        }
        
        return new OrderValidationResult(validationErrors, warnings);
    }
    
    /// <summary>
    /// 最適な配送方法の決定
    /// </summary>
    public ShippingOption DetermineOptimalShipping(Order order, List<ShippingOption> availableOptions)
    {
        // 商品の特性に基づく制約チェック
        var hasFragileItems = order.ContainsFragileItems();
        var totalWeight = CalculateTotalWeight(order);
        var totalVolume = CalculateTotalVolume(order);
        
        var eligibleOptions = availableOptions.Where(option =>
            option.MaxWeight >= totalWeight &&
            option.MaxVolume >= totalVolume &&
            (!hasFragileItems || option.SupportsFragileItems)
        ).ToList();
        
        if (!eligibleOptions.Any())
            throw new DomainException("利用可能な配送方法がありません");
        
        // 無料配送の閾値チェック
        if (order.IsEligibleForFreeShipping(Money.Yen(5000)))
        {
            var freeOption = eligibleOptions.FirstOrDefault(o => o.IsFreeShipping);
            if (freeOption != null)
                return freeOption;
        }
        
        // コストと速度のバランスで最適化
        return eligibleOptions.OrderBy(o => o.Cost.Amount).ThenBy(o => o.EstimatedDays).First();
    }
    
    /// <summary>
    /// 複数注文の統合可能性チェック
    /// </summary>
    public bool CanCombineOrders(Order order1, Order order2)
    {
        // 同じ顧客でなければ統合不可
        if (!order1.CustomerId.Equals(order2.CustomerId))
            return false;
        
        // 同じ配送先でなければ統合不可
        if (!order1.DeliveryAddress.Equals(order2.DeliveryAddress))
            return false;
        
        // 両方が未確定状態でなければ統合不可
        if (order1.Status != OrderStatus.Draft || order2.Status != OrderStatus.Draft)
            return false;
        
        // 統合後の総量制限チェック
        var combinedItemCount = order1.Items.Count + order2.Items.Count;
        var maxItemsPerOrder = 50; // ビジネスルール
        
        return combinedItemCount <= maxItemsPerOrder;
    }
    
    /// <summary>
    /// 顧客の注文履歴に基づく推奨商品
    /// </summary>
    public async Task<List<ProductId>> GetRecommendedProducts(Order currentOrder, CustomerId customerId)
    {
        // 現在の注文に含まれる商品カテゴリーを分析
        var currentCategories = currentOrder.Items
            .Select(item => item.Category)
            .Distinct()
            .ToList();
        
        // 関連商品を取得（外部サービス連携）
        var recommendations = new List<ProductId>();
        
        foreach (var category in currentCategories)
        {
            var relatedProducts = await _productRepository.GetRelatedProductsAsync(category);
            recommendations.AddRange(relatedProducts.Select(p => p.Id));
        }
        
        // 既に注文に含まれている商品は除外
        var currentProductIds = currentOrder.Items.Select(item => item.ProductId).ToHashSet();
        
        return recommendations
            .Where(productId => !currentProductIds.Contains(productId))
            .Take(10)
            .ToList();
    }
    
    /// <summary>
    /// 注文の自動分割（大きすぎる注文の処理）
    /// </summary>
    public List<Order> SplitLargeOrder(Order largeOrder, int maxItemsPerOrder = 20)
    {
        if (largeOrder.Items.Count <= maxItemsPerOrder)
            return new List<Order> { largeOrder };
        
        var splitOrders = new List<Order>();
        var items = largeOrder.Items.ToList();
        
        for (int i = 0; i < items.Count; i += maxItemsPerOrder)
        {
            var splitOrder = Order.Create(largeOrder.CustomerId, largeOrder.DeliveryAddress);
            
            var itemsForThisSplit = items.Skip(i).Take(maxItemsPerOrder);
            foreach (var item in itemsForThisSplit)
            {
                var product = new Product(item.ProductId, item.ProductName, item.UnitPrice);
                splitOrder.AddItem(product, item.Quantity, item.UnitPrice);
            }
            
            splitOrders.Add(splitOrder);
        }
        
        return splitOrders;
    }
    
    private decimal CalculateTotalWeight(Order order)
    {
        // 実装では商品マスタから重量情報を取得
        return order.Items.Sum(item => item.Quantity.Value * 1.0m); // 仮の実装
    }
    
    private decimal CalculateTotalVolume(Order order)
    {
        // 実装では商品マスタから体積情報を取得
        return order.Items.Sum(item => item.Quantity.Value * 0.1m); // 仮の実装
    }
}

// 検証結果のバリューオブジェクト
public class OrderValidationResult : ValueObject
{
    public IReadOnlyList<string> Errors { get; private set; }
    public IReadOnlyList<string> Warnings { get; private set; }
    public bool IsValid => !Errors.Any();
    
    public OrderValidationResult(List<string> errors, List<string> warnings = null)
    {
        Errors = errors?.AsReadOnly() ?? new List<string>().AsReadOnly();
        Warnings = warnings?.AsReadOnly() ?? new List<string>().AsReadOnly();
    }
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        foreach (var error in Errors)
            yield return error;
        foreach (var warning in Warnings ?? new List<string>())
            yield return warning;
    }
}

// 配送オプション
public class ShippingOption : ValueObject
{
    public string Name { get; private set; }
    public Money Cost { get; private set; }
    public int EstimatedDays { get; private set; }
    public decimal MaxWeight { get; private set; }
    public decimal MaxVolume { get; private set; }
    public bool SupportsFragileItems { get; private set; }
    public bool IsFreeShipping { get; private set; }
    
    public ShippingOption(string name, Money cost, int estimatedDays, 
                         decimal maxWeight, decimal maxVolume, 
                         bool supportsFragileItems, bool isFreeShipping = false)
    {
        Name = name ?? throw new ArgumentNullException(nameof(name));
        Cost = cost ?? throw new ArgumentNullException(nameof(cost));
        EstimatedDays = estimatedDays;
        MaxWeight = maxWeight;
        MaxVolume = maxVolume;
        SupportsFragileItems = supportsFragileItems;
        IsFreeShipping = isFreeShipping;
    }
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Name;
        yield return Cost;
        yield return EstimatedDays;
        yield return MaxWeight;
        yield return MaxVolume;
        yield return SupportsFragileItems;
        yield return IsFreeShipping;
    }
}
\`\`\`

## 集約設計のガイドライン

### 集約の境界を決める基準

1. **不変性**: 同じトランザクションで保護すべきビジネスルール
2. **一貫性**: 常に一貫した状態を保つ必要のあるデータ
3. **結合度**: 密接に関連し、一緒に変更されるデータ
4. **ライフサイクル**: 同じタイミングで作成・更新・削除されるデータ

### 集約の設計原則

#### 1. 小さな集約を優先する

\`\`\`csharp
// 良い例：適切な境界
public class Account : AggregateRoot<AccountId>
{
    public Money Balance { get; private set; }
    public AccountStatus Status { get; private set; }
    
    public void Deposit(Money amount) { /* ... */ }
    public void Withdraw(Money amount) { /* ... */ }
}

// 避けるべき例：境界が大きすぎる
public class Customer : AggregateRoot<CustomerId>
{
    // 顧客情報
    public string Name { get; private set; }
    
    // 注文情報（別の集約であるべき）
    private List<Order> _orders = new();
    
    // 口座情報（別の集約であるべき）
    private List<Account> _accounts = new();
    
    // 境界が大きすぎて管理が困難
}
\`\`\`

#### 2. IDによる参照を使用する

\`\`\`csharp
public class Order : AggregateRoot<OrderId>
{
    // 直接参照ではなくIDで参照
    public CustomerId CustomerId { get; private set; }
    
    // Customer オブジェクト自体は含めない
    // Customer customer; // ❌ これは避ける
}
\`\`\`

#### 3. 一つのトランザクションで一つの集約のみ変更

\`\`\`csharp
// 良い例：単一集約の変更
public async Task ProcessPayment(OrderId orderId, PaymentInfo paymentInfo)
{
    var order = await _orderRepository.GetByIdAsync(orderId);
    order.MarkAsPaid(paymentInfo);
    await _orderRepository.SaveAsync(order);
    
    // 他の集約への影響はドメインイベントで非同期処理
}

// 避けるべき例：複数集約の同時変更
public async Task ProcessPaymentBad(OrderId orderId, PaymentInfo paymentInfo)
{
    var order = await _orderRepository.GetByIdAsync(orderId);
    var customer = await _customerRepository.GetByIdAsync(order.CustomerId);
    
    order.MarkAsPaid(paymentInfo); // 複数の集約を
    customer.AddLoyaltyPoints(100); // 同じトランザクションで変更
    
    await _orderRepository.SaveAsync(order);
    await _customerRepository.SaveAsync(customer); // リスクが高い
}
\`\`\`

## 実践的な集約設計例

### ECサイトでの集約境界

\`\`\`csharp
// 顧客集約 - 顧客の基本情報と認証情報
public class Customer : AggregateRoot<CustomerId>
{
    public PersonName Name { get; private set; }
    public EmailAddress Email { get; private set; }
    public CustomerStatus Status { get; private set; }
    public DateTime RegisteredAt { get; private set; }
    
    // 注文履歴は含めない（OrderはIDでのみ参照）
}

// 商品集約 - 商品情報と価格
public class Product : AggregateRoot<ProductId>
{
    public string Name { get; private set; }
    public string Description { get; private set; }
    public Money Price { get; private set; }
    public ProductCategory Category { get; private set; }
    public ProductStatus Status { get; private set; }
}

// 在庫集約 - 在庫数量の管理
public class Inventory : AggregateRoot<InventoryId>
{
    public ProductId ProductId { get; private set; }
    public int AvailableQuantity { get; private set; }
    public int ReservedQuantity { get; private set; }
    public int ReorderPoint { get; private set; }
    
    public void Reserve(int quantity)
    {
        if (AvailableQuantity < quantity)
            throw new InsufficientInventoryException();
            
        AvailableQuantity -= quantity;
        ReservedQuantity += quantity;
        
        AddDomainEvent(new InventoryReservedEvent(ProductId, quantity));
    }
    
    public void Release(int quantity)
    {
        ReservedQuantity -= quantity;
        AvailableQuantity += quantity;
        
        AddDomainEvent(new InventoryReleasedEvent(ProductId, quantity));
    }
}

// 注文集約 - 注文の状態管理
public class Order : AggregateRoot<OrderId>
{
    // CustomerId で顧客を参照（直接参照しない）
    public CustomerId CustomerId { get; private set; }
    
    // 注文アイテム（集約内エンティティ）
    private readonly List<OrderItem> _items = new();
    
    // ... 注文に関するビジネスロジック
}
\`\`\`

### 銀行システムでの集約境界

\`\`\`csharp
// 口座集約 - 残高と取引の一貫性
public class BankAccount : AggregateRoot<AccountId>
{
    public AccountNumber AccountNumber { get; private set; }
    public CustomerId CustomerId { get; private set; }
    public Money Balance { get; private set; }
    public AccountStatus Status { get; private set; }
    
    private readonly List<Transaction> _recentTransactions = new();
    
    public void Deposit(Money amount, string description)
    {
        if (Status != AccountStatus.Active)
            throw new AccountException("非アクティブな口座には入金できません");
            
        Balance = Balance.Add(amount);
        
        var transaction = Transaction.CreateDeposit(
            TransactionId.NewId(),
            amount,
            description,
            Balance
        );
        
        _recentTransactions.Add(transaction);
        
        AddDomainEvent(new MoneyDepositedEvent(AccountNumber, amount, Balance));
    }
    
    public void Withdraw(Money amount, string description)
    {
        if (Status != AccountStatus.Active)
            throw new AccountException("非アクティブな口座からは出金できません");
            
        if (Balance.IsLessThan(amount))
            throw new InsufficientFundsException();
            
        Balance = Balance.Subtract(amount);
        
        var transaction = Transaction.CreateWithdrawal(
            TransactionId.NewId(),
            amount,
            description,
            Balance
        );
        
        _recentTransactions.Add(transaction);
        
        AddDomainEvent(new MoneyWithdrawnEvent(AccountNumber, amount, Balance));
    }
}

// 顧客集約 - 顧客情報
public class BankCustomer : AggregateRoot<CustomerId>
{
    public PersonName Name { get; private set; }
    public Address Address { get; private set; }
    public ContactInformation Contact { get; private set; }
    public CustomerStatus Status { get; private set; }
    
    // 口座リストは含めない（AccountIdのリストのみ）
    private readonly List<AccountId> _accountIds = new();
    
    public IReadOnlyList<AccountId> AccountIds => _accountIds.AsReadOnly();
    
    public void AddAccount(AccountId accountId)
    {
        if (!_accountIds.Contains(accountId))
        {
            _accountIds.Add(accountId);
            AddDomainEvent(new AccountAddedToCustomerEvent(Id, accountId));
        }
    }
}
\`\`\`

## まとめ

集約とドメインサービスは、複雑なビジネスロジックを適切に管理するための重要なパターンです：

### 集約の重要ポイント
1. **一貫性境界**: トランザクション境界と一致させる
2. **小さく保つ**: 管理しやすいサイズに制限する
3. **ID参照**: 他の集約は直接参照せず、IDで参照する
4. **不変性保護**: ビジネスルールを強制的に守る

### ドメインサービスの重要ポイント
1. **複雑なロジック**: 単一エンティティに属さない処理を実装
2. **外部連携**: リポジトリや外部サービスとの協調
3. **ポリシー実装**: ビジネスポリシーの具体的な実装
4. **状態を持たない**: ステートレスな設計を維持

次のレッスンでは、リポジトリパターンとファクトリーパターンについて学習し、集約の永続化と複雑なオブジェクト生成について詳しく学びます。
`,
  codeExamples: [
    {
      id: 'bank-account-aggregate-implementation',
      title: '銀行口座集約の完全実装',
      description: '残高管理と取引履歴を含む銀行口座集約の実践的な実装例',
      language: 'csharp',
      code: `using System;
using System.Collections.Generic;
using System.Linq;

// === 銀行口座集約の完全実装 ===

namespace BankingDomain
{
    /// <summary>
    /// 銀行口座集約 - 残高と取引の一貫性を保証
    /// </summary>
    public class BankAccount : AggregateRoot<AccountId>
    {
        private readonly List<Transaction> _transactions = new();
        private readonly List<AccountLimit> _limits = new();
        
        public AccountNumber AccountNumber { get; private set; }
        public CustomerId CustomerId { get; private set; }
        public Money Balance { get; private set; }
        public AccountType Type { get; private set; }
        public AccountStatus Status { get; private set; }
        public DateTime OpenedAt { get; private set; }
        public DateTime? ClosedAt { get; private set; }
        public InterestRate InterestRate { get; private set; }
        
        // 読み取り専用ビュー
        public IReadOnlyList<Transaction> RecentTransactions => 
            _transactions.OrderByDescending(t => t.ProcessedAt).Take(100).ToList().AsReadOnly();
        public IReadOnlyList<AccountLimit> Limits => _limits.AsReadOnly();
        
        // 計算プロパティ
        public bool IsActive => Status == AccountStatus.Active;
        public bool IsClosed => Status == AccountStatus.Closed;
        public bool IsFrozen => Status == AccountStatus.Frozen;
        public Money AvailableBalance => CalculateAvailableBalance();
        
        private BankAccount() { } // for ORM
        
        /// <summary>
        /// 新しい銀行口座を開設
        /// </summary>
        public static BankAccount Open(CustomerId customerId, AccountType accountType, 
                                     Money initialDeposit, InterestRate interestRate = null)
        {
            if (initialDeposit.IsLessThan(GetMinimumOpeningBalance(accountType)))
                throw new DomainException($"最小開設残高 \\{GetMinimumOpeningBalance(accountType)\\} を下回っています");
            
            var account = new BankAccount
            {
                Id = AccountId.NewId(),
                AccountNumber = AccountNumber.Generate(),
                CustomerId = customerId,
                Balance = initialDeposit,
                Type = accountType,
                Status = AccountStatus.Active,
                OpenedAt = DateTime.UtcNow,
                InterestRate = interestRate ?? InterestRate.GetDefault(accountType)
            };
            
            // 初期取引を記録
            var openingTransaction = Transaction.CreateOpening(
                TransactionId.NewId(),
                initialDeposit,
                "口座開設",
                initialDeposit
            );
            
            account._transactions.Add(openingTransaction);
            
            // デフォルト制限の設定
            account.SetDefaultLimits(accountType);
            
            account.AddDomainEvent(new BankAccountOpenedEvent(
                account.Id, customerId, account.AccountNumber, initialDeposit));
            
            return account;
        }
        
        /// <summary>
        /// 入金処理
        /// </summary>
        public void Deposit(Money amount, string description = null, TransactionChannel channel = TransactionChannel.Branch)
        {
            ValidateAccountForTransaction();
            ValidateAmount(amount);
            
            // 入金限度額チェック
            var dailyDepositLimit = GetLimit(LimitType.DailyDeposit);
            if (dailyDepositLimit != null)
            {
                var todayDeposits = GetTodayTransactions(TransactionType.Deposit).Sum(t => t.Amount.Amount);
                if (todayDeposits + amount.Amount > dailyDepositLimit.Amount.Amount)
                    throw new DomainException($"1日の入金限度額 \\{dailyDepositLimit.Amount\\} を超えています");
            }
            
            // 残高更新
            var previousBalance = Balance;
            Balance = Balance.Add(amount);
            
            // 取引記録
            var transaction = Transaction.CreateDeposit(
                TransactionId.NewId(),
                amount,
                description ?? "入金",
                Balance,
                channel
            );
            
            _transactions.Add(transaction);
            
            // 利息計算の更新
            UpdateInterestAccrual();
            
            AddDomainEvent(new MoneyDepositedEvent(Id, AccountNumber, amount, previousBalance, Balance, channel));
        }
        
        /// <summary>
        /// 出金処理
        /// </summary>
        public void Withdraw(Money amount, string description = null, TransactionChannel channel = TransactionChannel.ATM)
        {
            ValidateAccountForTransaction();
            ValidateAmount(amount);
            
            // 残高不足チェック
            if (AvailableBalance.IsLessThan(amount))
                throw new InsufficientFundsException($"利用可能残高が不足しています (利用可能: \\{AvailableBalance\\}, 要求: \\{amount\\})");
            
            // 出金限度額チェック
            ValidateWithdrawalLimits(amount, channel);
            
            // 残高更新
            var previousBalance = Balance;
            Balance = Balance.Subtract(amount);
            
            // 取引記録
            var transaction = Transaction.CreateWithdrawal(
                TransactionId.NewId(),
                amount,
                description ?? "出金",
                Balance,
                channel
            );
            
            _transactions.Add(transaction);
            
            // 残高不足警告のチェック
            CheckLowBalanceWarning();
            
            AddDomainEvent(new MoneyWithdrawnEvent(Id, AccountNumber, amount, previousBalance, Balance, channel));
        }
        
        /// <summary>
        /// 振替処理（出金側）
        /// </summary>
        public void Transfer(Money amount, AccountNumber toAccountNumber, string description = null)
        {
            ValidateAccountForTransaction();
            ValidateAmount(amount);
            
            if (AvailableBalance.IsLessThan(amount))
                throw new InsufficientFundsException();
            
            // 振替限度額チェック
            var dailyTransferLimit = GetLimit(LimitType.DailyTransfer);
            if (dailyTransferLimit != null)
            {
                var todayTransfers = GetTodayTransactions(TransactionType.Transfer).Sum(t => t.Amount.Amount);
                if (todayTransfers + amount.Amount > dailyTransferLimit.Amount.Amount)
                    throw new DomainException($"1日の振替限度額を超えています");
            }
            
            var previousBalance = Balance;
            Balance = Balance.Subtract(amount);
            
            var transaction = Transaction.CreateTransfer(
                TransactionId.NewId(),
                amount,
                toAccountNumber,
                description ?? $"振替 to \\{toAccountNumber\\}",
                Balance
            );
            
            _transactions.Add(transaction);
            
            AddDomainEvent(new MoneyTransferredEvent(Id, AccountNumber, toAccountNumber, amount, 
                previousBalance, Balance, description));
        }
        
        /// <summary>
        /// 振替処理（入金側）
        /// </summary>
        public void ReceiveTransfer(Money amount, AccountNumber fromAccountNumber, string description = null)
        {
            ValidateAccountForTransaction();
            ValidateAmount(amount);
            
            var previousBalance = Balance;
            Balance = Balance.Add(amount);
            
            var transaction = Transaction.CreateTransferReceipt(
                TransactionId.NewId(),
                amount,
                fromAccountNumber,
                description ?? $"振替受取 from \\{fromAccountNumber\\}",
                Balance
            );
            
            _transactions.Add(transaction);
            
            AddDomainEvent(new MoneyReceivedEvent(Id, AccountNumber, fromAccountNumber, amount, 
                previousBalance, Balance, description));
        }
        
        /// <summary>
        /// 利息の支払い
        /// </summary>
        public Money PayInterest()
        {
            if (Type != AccountType.Savings)
                throw new DomainException("利息は普通預金口座のみ対象です");
                
            if (!IsActive)
                throw new DomainException("非アクティブな口座には利息を支払えません");
            
            var interestAmount = CalculateAccruedInterest();
            if (interestAmount.Amount <= 0)
                return Money.Zero;
            
            var previousBalance = Balance;
            Balance = Balance.Add(interestAmount);
            
            var transaction = Transaction.CreateInterestPayment(
                TransactionId.NewId(),
                interestAmount,
                $"利息支払い (年率 \\{InterestRate.Rate * 100\\:F2\\}%)",
                Balance
            );
            
            _transactions.Add(transaction);
            
            AddDomainEvent(new InterestPaidEvent(Id, AccountNumber, interestAmount, InterestRate, Balance));
            
            return interestAmount;
        }
        
        /// <summary>
        /// 口座凍結
        /// </summary>
        public void Freeze(string reason)
        {
            if (Status == AccountStatus.Closed)
                throw new DomainException("閉鎖済みの口座は凍結できません");
                
            if (Status == AccountStatus.Frozen)
                return; // 既に凍結済み
            
            Status = AccountStatus.Frozen;
            
            AddDomainEvent(new BankAccountFrozenEvent(Id, AccountNumber, reason, DateTime.UtcNow));
        }
        
        /// <summary>
        /// 口座凍結解除
        /// </summary>
        public void Unfreeze(string reason)
        {
            if (Status != AccountStatus.Frozen)
                throw new DomainException("凍結されていない口座は解除できません");
            
            Status = AccountStatus.Active;
            
            AddDomainEvent(new BankAccountUnfrozenEvent(Id, AccountNumber, reason, DateTime.UtcNow));
        }
        
        /// <summary>
        /// 口座閉鎖
        /// </summary>
        public void Close(string reason)
        {
            if (Status == AccountStatus.Closed)
                throw new DomainException("既に閉鎖済みの口座です");
            
            if (Balance.Amount > 0)
                throw new DomainException("残高がある口座は閉鎖できません");
                
            if (HasPendingTransactions())
                throw new DomainException("未処理の取引がある口座は閉鎖できません");
            
            Status = AccountStatus.Closed;
            ClosedAt = DateTime.UtcNow;
            
            AddDomainEvent(new BankAccountClosedEvent(Id, AccountNumber, reason, DateTime.UtcNow));
        }
        
        /// <summary>
        /// 取引限度額の設定
        /// </summary>
        public void SetLimit(LimitType limitType, Money amount, DateTime? expiryDate = null)
        {
            var existingLimit = _limits.FirstOrDefault(l => l.Type == limitType);
            if (existingLimit != null)
            {
                _limits.Remove(existingLimit);
            }
            
            var newLimit = new AccountLimit(limitType, amount, expiryDate);
            _limits.Add(newLimit);
            
            AddDomainEvent(new AccountLimitSetEvent(Id, limitType, amount, expiryDate));
        }
        
        /// <summary>
        /// 口座明細の取得
        /// </summary>
        public AccountStatement GetStatement(DateRange period)
        {
            var transactions = _transactions
                .Where(t => period.Contains(t.ProcessedAt))
                .OrderBy(t => t.ProcessedAt)
                .ToList();
            
            var openingBalance = CalculateBalanceAt(period.StartDate);
            var closingBalance = CalculateBalanceAt(period.EndDate);
            
            return new AccountStatement(
                AccountNumber,
                period,
                openingBalance,
                closingBalance,
                transactions
            );
        }
        
        // プライベートメソッド
        private void ValidateAccountForTransaction()
        {
            if (!IsActive)
                throw new DomainException($"口座の状態が無効です: \\{Status\\}");
        }
        
        private void ValidateAmount(Money amount)
        {
            if (amount.Amount <= 0)
                throw new ArgumentException("金額は0より大きい必要があります");
        }
        
        private void ValidateWithdrawalLimits(Money amount, TransactionChannel channel)
        {
            // チャネル別限度額チェック
            var channelLimit = channel switch
            {
                TransactionChannel.ATM => GetLimit(LimitType.ATMWithdrawal),
                TransactionChannel.Online => GetLimit(LimitType.OnlineWithdrawal),
                TransactionChannel.Branch => GetLimit(LimitType.DailyWithdrawal),
                _ => GetLimit(LimitType.DailyWithdrawal)
            };
            
            if (channelLimit != null && amount.IsGreaterThan(channelLimit.Amount))
                throw new DomainException($"\\{channel\\} での出金限度額 \\{channelLimit.Amount\\} を超えています");
            
            // 1日の出金合計チェック
            var dailyLimit = GetLimit(LimitType.DailyWithdrawal);
            if (dailyLimit != null)
            {
                var todayWithdrawals = GetTodayTransactions(TransactionType.Withdrawal).Sum(t => t.Amount.Amount);
                if (todayWithdrawals + amount.Amount > dailyLimit.Amount.Amount)
                    throw new DomainException($"1日の出金限度額を超えています");
            }
        }
        
        private Money CalculateAvailableBalance()
        {
            // 基本残高
            var available = Balance;
            
            // 保留中の取引があれば差し引き
            var pendingAmount = _transactions
                .Where(t => t.Status == TransactionStatus.Pending)
                .Sum(t => t.Type == TransactionType.Withdrawal ? t.Amount.Amount : 0);
            
            return new Money(Math.Max(0, available.Amount - pendingAmount), available.Currency);
        }
        
        private List<Transaction> GetTodayTransactions(TransactionType type)
        {
            var today = DateTime.Today;
            return _transactions
                .Where(t => t.ProcessedAt.Date == today && t.Type == type)
                .ToList();
        }
        
        private AccountLimit GetLimit(LimitType limitType)
        {
            return _limits.FirstOrDefault(l => l.Type == limitType && l.IsActive);
        }
        
        private void SetDefaultLimits(AccountType accountType)
        {
            switch (accountType)
            {
                case AccountType.Checking:
                    SetLimit(LimitType.DailyWithdrawal, Money.Yen(500000));
                    SetLimit(LimitType.ATMWithdrawal, Money.Yen(100000));
                    SetLimit(LimitType.DailyTransfer, Money.Yen(1000000));
                    break;
                    
                case AccountType.Savings:
                    SetLimit(LimitType.DailyWithdrawal, Money.Yen(200000));
                    SetLimit(LimitType.ATMWithdrawal, Money.Yen(50000));
                    SetLimit(LimitType.DailyTransfer, Money.Yen(300000));
                    break;
            }
        }
        
        private void CheckLowBalanceWarning()
        {
            var warningThreshold = GetMinimumOpeningBalance(Type);
            if (Balance.IsLessThan(warningThreshold))
            {
                AddDomainEvent(new LowBalanceWarningEvent(Id, AccountNumber, Balance, warningThreshold));
            }
        }
        
        private bool HasPendingTransactions()
        {
            return _transactions.Any(t => t.Status == TransactionStatus.Pending);
        }
        
        private Money CalculateBalanceAt(DateTime date)
        {
            var relevantTransactions = _transactions
                .Where(t => t.ProcessedAt <= date)
                .OrderBy(t => t.ProcessedAt);
            
            var balance = Money.Zero;
            foreach (var transaction in relevantTransactions)
            {
                balance = transaction.Type switch
                {
                    TransactionType.Deposit => balance.Add(transaction.Amount),
                    TransactionType.Opening => balance.Add(transaction.Amount),
                    TransactionType.Interest => balance.Add(transaction.Amount),
                    TransactionType.TransferReceipt => balance.Add(transaction.Amount),
                    TransactionType.Withdrawal => balance.Subtract(transaction.Amount),
                    TransactionType.Transfer => balance.Subtract(transaction.Amount),
                    _ => balance
                };
            }
            
            return balance;
        }
        
        private void UpdateInterestAccrual()
        {
            // 利息計算ロジック（簡略化）
            // 実際の実装では、より複雑な利息計算を行う
        }
        
        private Money CalculateAccruedInterest()
        {
            // 簡略化された利息計算
            var days = (DateTime.UtcNow - OpenedAt).Days;
            var dailyRate = InterestRate.Rate / 365;
            var interest = Balance.Amount * (decimal)dailyRate * days;
            
            return new Money(Math.Round(interest, 0), Balance.Currency);
        }
        
        private static Money GetMinimumOpeningBalance(AccountType accountType)
        {
            return accountType switch
            {
                AccountType.Checking => Money.Yen(10000),
                AccountType.Savings => Money.Yen(1000),
                _ => Money.Yen(1000)
            };
        }
    }
    
    /// <summary>
    /// 取引エンティティ
    /// </summary>
    public class Transaction : Entity<TransactionId>
    {
        public TransactionType Type { get; private set; }
        public Money Amount { get; private set; }
        public string Description { get; private set; }
        public Money BalanceAfter { get; private set; }
        public DateTime ProcessedAt { get; private set; }
        public TransactionStatus Status { get; private set; }
        public TransactionChannel Channel { get; private set; }
        public AccountNumber RelatedAccountNumber { get; private set; } // 振替の場合
        
        private Transaction() { } // for ORM
        
        internal static Transaction CreateDeposit(TransactionId id, Money amount, string description, 
                                                Money balanceAfter, TransactionChannel channel = TransactionChannel.Branch)
        {
            return new Transaction
            {
                Id = id,
                Type = TransactionType.Deposit,
                Amount = amount,
                Description = description,
                BalanceAfter = balanceAfter,
                ProcessedAt = DateTime.UtcNow,
                Status = TransactionStatus.Completed,
                Channel = channel
            };
        }
        
        internal static Transaction CreateWithdrawal(TransactionId id, Money amount, string description, 
                                                   Money balanceAfter, TransactionChannel channel = TransactionChannel.ATM)
        {
            return new Transaction
            {
                Id = id,
                Type = TransactionType.Withdrawal,
                Amount = amount,
                Description = description,
                BalanceAfter = balanceAfter,
                ProcessedAt = DateTime.UtcNow,
                Status = TransactionStatus.Completed,
                Channel = channel
            };
        }
        
        internal static Transaction CreateTransfer(TransactionId id, Money amount, AccountNumber toAccount, 
                                                 string description, Money balanceAfter)
        {
            return new Transaction
            {
                Id = id,
                Type = TransactionType.Transfer,
                Amount = amount,
                Description = description,
                BalanceAfter = balanceAfter,
                ProcessedAt = DateTime.UtcNow,
                Status = TransactionStatus.Completed,
                Channel = TransactionChannel.Online,
                RelatedAccountNumber = toAccount
            };
        }
        
        internal static Transaction CreateTransferReceipt(TransactionId id, Money amount, AccountNumber fromAccount, 
                                                        string description, Money balanceAfter)
        {
            return new Transaction
            {
                Id = id,
                Type = TransactionType.TransferReceipt,
                Amount = amount,
                Description = description,
                BalanceAfter = balanceAfter,
                ProcessedAt = DateTime.UtcNow,
                Status = TransactionStatus.Completed,
                Channel = TransactionChannel.Online,
                RelatedAccountNumber = fromAccount
            };
        }
        
        internal static Transaction CreateOpening(TransactionId id, Money amount, string description, Money balanceAfter)
        {
            return new Transaction
            {
                Id = id,
                Type = TransactionType.Opening,
                Amount = amount,
                Description = description,
                BalanceAfter = balanceAfter,
                ProcessedAt = DateTime.UtcNow,
                Status = TransactionStatus.Completed,
                Channel = TransactionChannel.Branch
            };
        }
        
        internal static Transaction CreateInterestPayment(TransactionId id, Money amount, string description, Money balanceAfter)
        {
            return new Transaction
            {
                Id = id,
                Type = TransactionType.Interest,
                Amount = amount,
                Description = description,
                BalanceAfter = balanceAfter,
                ProcessedAt = DateTime.UtcNow,
                Status = TransactionStatus.Completed,
                Channel = TransactionChannel.System
            };
        }
    }
    
    /// <summary>
    /// 口座制限バリューオブジェクト
    /// </summary>
    public class AccountLimit : ValueObject
    {
        public LimitType Type { get; private set; }
        public Money Amount { get; private set; }
        public DateTime? ExpiryDate { get; private set; }
        public bool IsActive => !ExpiryDate.HasValue || ExpiryDate.Value > DateTime.UtcNow;
        
        public AccountLimit(LimitType type, Money amount, DateTime? expiryDate = null)
        {
            Type = type;
            Amount = amount ?? throw new ArgumentNullException(nameof(amount));
            ExpiryDate = expiryDate;
        }
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Type;
            yield return Amount;
            yield return ExpiryDate;
        }
    }
    
    /// <summary>
    /// 口座明細バリューオブジェクト
    /// </summary>
    public class AccountStatement : ValueObject
    {
        public AccountNumber AccountNumber { get; private set; }
        public DateRange Period { get; private set; }
        public Money OpeningBalance { get; private set; }
        public Money ClosingBalance { get; private set; }
        public IReadOnlyList<Transaction> Transactions { get; private set; }
        
        public Money TotalDeposits => new Money(
            Transactions.Where(t => t.Type == TransactionType.Deposit).Sum(t => t.Amount.Amount));
        public Money TotalWithdrawals => new Money(
            Transactions.Where(t => t.Type == TransactionType.Withdrawal).Sum(t => t.Amount.Amount));
        
        public AccountStatement(AccountNumber accountNumber, DateRange period, 
                              Money openingBalance, Money closingBalance, 
                              List<Transaction> transactions)
        {
            AccountNumber = accountNumber;
            Period = period;
            OpeningBalance = openingBalance;
            ClosingBalance = closingBalance;
            Transactions = transactions.AsReadOnly();
        }
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return AccountNumber;
            yield return Period;
            yield return OpeningBalance;
            yield return ClosingBalance;
            foreach (var transaction in Transactions)
                yield return transaction.Id;
        }
    }
    
    // 列挙型
    public enum AccountType { Checking, Savings }
    public enum AccountStatus { Active, Frozen, Closed }
    public enum TransactionType { Deposit, Withdrawal, Transfer, TransferReceipt, Opening, Interest }
    public enum TransactionStatus { Pending, Completed, Failed, Cancelled }
    public enum TransactionChannel { Branch, ATM, Online, Mobile, System }
    public enum LimitType 
    { 
        DailyWithdrawal, ATMWithdrawal, OnlineWithdrawal, 
        DailyDeposit, DailyTransfer, MonthlyTransfer 
    }
    
    // 例外
    public class InsufficientFundsException : DomainException
    {
        public InsufficientFundsException(string message = "残高不足です") : base(message) { }
    }
    
    public class ConcurrencyException : DomainException
    {
        public ConcurrencyException(string message) : base(message) { }
    }
}

// 使用例
public class Program
{
    public static void Main()
    {
        Console.WriteLine("=== 銀行口座集約の例 ===\\n");
        
        try
        {
            // 口座開設
            var customerId = CustomerId.NewId();
            var initialDeposit = Money.Yen(100000);
            var account = BankAccount.Open(customerId, AccountType.Checking, initialDeposit);
            
            Console.WriteLine($"口座開設: \\{account.AccountNumber\\}");
            Console.WriteLine($"初期残高: \\{account.Balance\\}");
            Console.WriteLine($"利用可能残高: \\{account.AvailableBalance\\}");
            
            // 各種取引の実行
            account.Deposit(Money.Yen(50000), "給与");
            Console.WriteLine($"\\n入金後残高: \\{account.Balance\\}");
            
            account.Withdraw(Money.Yen(20000), "ATM出金", TransactionChannel.ATM);
            Console.WriteLine($"出金後残高: \\{account.Balance\\}");
            
            // 振替処理
            var toAccountNumber = AccountNumber.Generate();
            account.Transfer(Money.Yen(30000), toAccountNumber, "家賃支払い");
            Console.WriteLine($"振替後残高: \\{account.Balance\\}");
            
            // 制限設定
            account.SetLimit(LimitType.DailyWithdrawal, Money.Yen(200000));
            Console.WriteLine("\\n出金限度額を設定しました");
            
            // 取引履歴
            Console.WriteLine($"\\n最近の取引履歴 (\\{account.RecentTransactions.Count\\}件):");
            foreach (var transaction in account.RecentTransactions.Take(5))
            {
                Console.WriteLine($"  \\{transaction.ProcessedAt\\:yyyy/MM/dd HH\\:mm\\} - \\{transaction.Type\\}: \\{transaction.Amount\\} (\\{transaction.Description\\})");
            }
            
            // 口座明細
            var period = new DateRange(DateTime.Today.AddDays(-30), DateTime.Today);
            var statement = account.GetStatement(period);
            Console.WriteLine($"\\n口座明細 (\\{statement.Period\\}):");
            Console.WriteLine($"期初残高: \\{statement.OpeningBalance\\}");
            Console.WriteLine($"期末残高: \\{statement.ClosingBalance\\}");
            Console.WriteLine($"総入金額: \\{statement.TotalDeposits\\}");
            Console.WriteLine($"総出金額: \\{statement.TotalWithdrawals\\}");
            
        }
        catch (DomainException ex)
        {
            Console.WriteLine($"ビジネスエラー: \\{ex.Message\\}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"システムエラー: \\{ex.Message\\}");
        }
    }
}`
    },
    {
      id: 'order-management-domain-service',
      title: '注文管理ドメインサービスの実装',
      description: '複数の集約にまたがる複雑なビジネスロジックを扱うドメインサービスの実装例',
      language: 'csharp',
      code: `using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

// === 注文管理ドメインサービスの実装 ===

namespace OrderManagementDomain
{
    /// <summary>
    /// 注文管理ドメインサービス - 複雑なビジネスロジックを扱う
    /// </summary>
    public class OrderManagementService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly ICustomerRepository _customerRepository;
        private readonly IProductRepository _productRepository;
        private readonly IInventoryService _inventoryService;
        private readonly IPricingService _pricingService;
        private readonly IShippingService _shippingService;
        private readonly IPaymentService _paymentService;
        private readonly IPromotionService _promotionService;
        
        public OrderManagementService(
            IOrderRepository orderRepository,
            ICustomerRepository customerRepository,
            IProductRepository productRepository,
            IInventoryService inventoryService,
            IPricingService pricingService,
            IShippingService shippingService,
            IPaymentService paymentService,
            IPromotionService promotionService)
        {
            _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
            _customerRepository = customerRepository ?? throw new ArgumentNullException(nameof(customerRepository));
            _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
            _inventoryService = inventoryService ?? throw new ArgumentNullException(nameof(inventoryService));
            _pricingService = pricingService ?? throw new ArgumentNullException(nameof(pricingService));
            _shippingService = shippingService ?? throw new ArgumentNullException(nameof(shippingService));
            _paymentService = paymentService ?? throw new ArgumentNullException(nameof(paymentService));
            _promotionService = promotionService ?? throw new ArgumentNullException(nameof(promotionService));
        }
        
        /// <summary>
        /// 注文の包括的検証 - 複数のビジネスルールとサービスを組み合わせ
        /// </summary>
        public async Task<OrderValidationResult> ValidateOrderComprehensively(Order order)
        {
            var validationErrors = new List<string>();
            var warnings = new List<string>();
            var informationMessages = new List<string>();
            
            // 1. 基本的な注文検証
            var basicValidation = order.ValidateForConfirmation();
            validationErrors.AddRange(basicValidation.Errors);
            
            // 2. 顧客の検証
            var customerValidation = await ValidateCustomer(order.CustomerId);
            validationErrors.AddRange(customerValidation.Errors);
            warnings.AddRange(customerValidation.Warnings);
            
            // 3. 商品と在庫の検証
            var inventoryValidation = await ValidateInventoryAvailability(order);
            validationErrors.AddRange(inventoryValidation.Errors);
            warnings.AddRange(inventoryValidation.Warnings);
            
            // 4. 価格の整合性検証
            var pricingValidation = await ValidatePricing(order);
            validationErrors.AddRange(pricingValidation.Errors);
            warnings.AddRange(pricingValidation.Warnings);
            
            // 5. 配送可能性の検証
            var shippingValidation = await ValidateShippingOptions(order);
            validationErrors.AddRange(shippingValidation.Errors);
            warnings.AddRange(shippingValidation.Warnings);
            informationMessages.AddRange(shippingValidation.Information);
            
            // 6. プロモーション適用の検証
            var promotionValidation = await ValidateAndApplyPromotions(order);
            warnings.AddRange(promotionValidation.Warnings);
            informationMessages.AddRange(promotionValidation.Information);
            
            return new OrderValidationResult(validationErrors, warnings, informationMessages);
        }
        
        /// <summary>
        /// インテリジェントな注文処理 - 自動的に最適化と調整を行う
        /// </summary>
        public async Task<OrderProcessingResult> ProcessOrderIntelligently(Order order)
        {
            var processingSteps = new List<ProcessingStep>();
            
            try
            {
                // ステップ1: 包括的検証
                processingSteps.Add(new ProcessingStep("包括的検証", ProcessingStatus.InProgress));
                var validation = await ValidateOrderComprehensively(order);
                
                if (!validation.IsValid)
                {
                    processingSteps.Last().Status = ProcessingStatus.Failed;
                    processingSteps.Last().Message = string.Join(", ", validation.Errors);
                    return new OrderProcessingResult(false, processingSteps, validation.Errors.First());
                }
                
                processingSteps.Last().Status = ProcessingStatus.Completed;
                
                // ステップ2: 在庫の仮押さえ
                processingSteps.Add(new ProcessingStep("在庫仮押さえ", ProcessingStatus.InProgress));
                var reservationResult = await ReserveInventory(order);
                
                if (!reservationResult.Success)
                {
                    processingSteps.Last().Status = ProcessingStatus.Failed;
                    processingSteps.Last().Message = reservationResult.ErrorMessage;
                    return new OrderProcessingResult(false, processingSteps, reservationResult.ErrorMessage);
                }
                
                processingSteps.Last().Status = ProcessingStatus.Completed;
                
                // ステップ3: プロモーションの適用と価格調整
                processingSteps.Add(new ProcessingStep("プロモーション適用", ProcessingStatus.InProgress));
                await ApplyBestPromotions(order);
                processingSteps.Last().Status = ProcessingStatus.Completed;
                
                // ステップ4: 最適配送オプションの選択
                processingSteps.Add(new ProcessingStep("配送オプション最適化", ProcessingStatus.InProgress));
                var shippingOption = await SelectOptimalShipping(order);
                order.SetShippingOption(shippingOption);
                processingSteps.Last().Status = ProcessingStatus.Completed;
                
                // ステップ5: 注文確定
                processingSteps.Add(new ProcessingStep("注文確定", ProcessingStatus.InProgress));
                order.Confirm();
                await _orderRepository.SaveAsync(order);
                processingSteps.Last().Status = ProcessingStatus.Completed;
                
                // ステップ6: 支払い処理準備
                processingSteps.Add(new ProcessingStep("支払い処理準備", ProcessingStatus.InProgress));
                var paymentPreparation = await PreparePaymentProcessing(order);
                
                if (paymentPreparation.RequiresManualReview)
                {
                    processingSteps.Last().Status = ProcessingStatus.PendingReview;
                    processingSteps.Last().Message = "手動レビューが必要です";
                }
                else
                {
                    processingSteps.Last().Status = ProcessingStatus.Completed;
                }
                
                return new OrderProcessingResult(true, processingSteps);
            }
            catch (Exception ex)
            {
                // 失敗した場合は在庫の仮押さえを解除
                await ReleaseReservedInventory(order);
                
                if (processingSteps.Any())
                {
                    processingSteps.Last().Status = ProcessingStatus.Failed;
                    processingSteps.Last().Message = ex.Message;
                }
                
                return new OrderProcessingResult(false, processingSteps, ex.Message);
            }
        }
        
        /// <summary>
        /// 複数注文の最適化統合
        /// </summary>
        public async Task<OrderConsolidationResult> ConsolidateOrders(List<Order> orders)
        {
            if (orders == null || orders.Count < 2)
                throw new ArgumentException("統合には2つ以上の注文が必要です");
            
            var consolidationSteps = new List<string>();
            
            // 1. 統合可能性の検証
            var canConsolidate = orders.All(o => o.CustomerId.Equals(orders.First().CustomerId)) &&
                                orders.All(o => o.DeliveryAddress.Equals(orders.First().DeliveryAddress)) &&
                                orders.All(o => o.Status == OrderStatus.Draft);
            
            if (!canConsolidate)
            {
                return new OrderConsolidationResult(false, "注文の統合条件を満たしていません", consolidationSteps);
            }
            
            consolidationSteps.Add("統合可能性検証完了");
            
            // 2. 商品の重複チェックと数量統合
            var consolidatedItems = new Dictionary<ProductId, (OrderItem Item, int TotalQuantity)>();
            
            foreach (var order in orders)
            {
                foreach (var item in order.Items)
                {
                    if (consolidatedItems.ContainsKey(item.ProductId))
                    {
                        var existing = consolidatedItems[item.ProductId];
                        consolidatedItems[item.ProductId] = (existing.Item, existing.TotalQuantity + item.Quantity.Value);
                    }
                    else
                    {
                        consolidatedItems[item.ProductId] = (item, item.Quantity.Value);
                    }
                }
            }
            
            consolidationSteps.Add($"\\{consolidatedItems.Count\\}種類の商品を統合");
            
            // 3. 新しい統合注文の作成
            var mainOrder = orders.First();
            var consolidatedOrder = Order.Create(mainOrder.CustomerId, mainOrder.DeliveryAddress);
            
            foreach (var kvp in consolidatedItems)
            {
                var item = kvp.Value.Item;
                var totalQuantity = kvp.Value.TotalQuantity;
                
                // 最新価格を取得して適用
                var currentPrice = await _pricingService.GetCurrentPriceAsync(item.ProductId);
                var product = await _productRepository.GetByIdAsync(item.ProductId);
                
                consolidatedOrder.AddItem(product, new Quantity(totalQuantity), currentPrice);
            }
            
            consolidationSteps.Add("統合注文作成完了");
            
            // 4. 統合による割引の適用
            var bulkDiscounts = await _promotionService.CalculateBulkDiscounts(consolidatedOrder);
            foreach (var discount in bulkDiscounts)
            {
                consolidatedOrder.ApplyDiscount(discount);
            }
            
            if (bulkDiscounts.Any())
            {
                consolidationSteps.Add($"\\{bulkDiscounts.Count\\}件の統合割引を適用");
            }
            
            // 5. 元の注文のキャンセル
            foreach (var originalOrder in orders)
            {
                originalOrder.Cancel("注文統合のため");
                await _orderRepository.SaveAsync(originalOrder);
            }
            
            consolidationSteps.Add($"\\{orders.Count\\}件の元注文をキャンセル");
            
            // 6. 統合注文の保存
            await _orderRepository.SaveAsync(consolidatedOrder);
            consolidationSteps.Add("統合注文を保存");
            
            var savings = orders.Sum(o => o.TotalAmount.Amount) - consolidatedOrder.TotalAmount.Amount;
            
            return new OrderConsolidationResult(
                true,
                $"注文統合完了。\\{Money.Yen(savings)\\}の節約効果",
                consolidationSteps,
                consolidatedOrder,
                Money.Yen(savings)
            );
        }
        
        /// <summary>
        /// 注文の自動分割 - 大量注文や配送制約への対応
        /// </summary>
        public async Task<OrderSplitResult> SplitOrderIfNecessary(Order order)
        {
            var splitReasons = new List<string>();
            var splitOrders = new List<Order>();
            
            // 1. サイズ制限による分割が必要かチェック
            if (order.Items.Count > 20)
            {
                splitReasons.Add($"商品数が制限(20)を超過: \\{order.Items.Count\\}");
            }
            
            // 2. 重量制限による分割が必要かチェック
            var totalWeight = await CalculateTotalWeight(order);
            if (totalWeight > 30.0m)
            {
                splitReasons.Add($"総重量が制限(30kg)を超過: \\{totalWeight:F1\\}kg");
            }
            
            // 3. 配送地域制限による分割が必要かチェック
            var restrictedItems = await GetShippingRestrictedItems(order);
            if (restrictedItems.Any())
            {
                splitReasons.Add($"配送制限商品: \\{restrictedItems.Count\\}点");
            }
            
            // 分割が不要な場合
            if (!splitReasons.Any())
            {
                return new OrderSplitResult(false, "分割不要", new List<Order> { order });
            }
            
            // 4. インテリジェントな分割実行
            splitOrders = await PerformIntelligentSplit(order, splitReasons);
            
            // 5. 各分割注文に適切な配送オプションを設定
            foreach (var splitOrder in splitOrders)
            {
                var optimalShipping = await SelectOptimalShipping(splitOrder);
                splitOrder.SetShippingOption(optimalShipping);
            }
            
            return new OrderSplitResult(
                true,
                $"注文を\\{splitOrders.Count\\}つに分割: \\{string.Join(", ", splitReasons)\\}",
                splitOrders
            );
        }
        
        /// <summary>
        /// 動的価格調整 - 市場状況や在庫状況に基づく価格最適化
        /// </summary>
        public async Task<PriceAdjustmentResult> OptimizePricing(Order order)
        {
            var adjustments = new List<PriceAdjustment>();
            
            foreach (var item in order.Items)
            {
                // 1. 現在の市場価格取得
                var currentMarketPrice = await _pricingService.GetCurrentPriceAsync(item.ProductId);
                
                // 2. 在庫状況に基づく価格調整
                var inventoryLevel = await _inventoryService.GetInventoryLevelAsync(item.ProductId);
                var inventoryAdjustment = CalculateInventoryBasedAdjustment(currentMarketPrice, inventoryLevel);
                
                // 3. 顧客セグメントに基づく価格調整
                var customer = await _customerRepository.GetByIdAsync(order.CustomerId);
                var customerAdjustment = CalculateCustomerBasedAdjustment(currentMarketPrice, customer);
                
                // 4. 需要予測に基づく価格調整
                var demandForecast = await _pricingService.GetDemandForecastAsync(item.ProductId);
                var demandAdjustment = CalculateDemandBasedAdjustment(currentMarketPrice, demandForecast);
                
                // 5. 最終価格の決定
                var finalPrice = currentMarketPrice
                    .ApplyAdjustment(inventoryAdjustment)
                    .ApplyAdjustment(customerAdjustment)
                    .ApplyAdjustment(demandAdjustment);
                
                if (!finalPrice.Equals(item.UnitPrice))
                {
                    var adjustment = new PriceAdjustment(
                        item.ProductId,
                        item.UnitPrice,
                        finalPrice,
                        new List<string>
                        {
                            $"在庫調整: \\{inventoryAdjustment.Percentage:+0.0;-0.0;0\\}%",
                            $"顧客セグメント調整: \\{customerAdjustment.Percentage:+0.0;-0.0;0\\}%",
                            $"需要予測調整: \\{demandAdjustment.Percentage:+0.0;-0.0;0\\}%"
                        }
                    );
                    
                    adjustments.Add(adjustment);
                }
            }
            
            return new PriceAdjustmentResult(adjustments);
        }
        
        // プライベートメソッド
        private async Task<ValidationResult> ValidateCustomer(CustomerId customerId)
        {
            var errors = new List<string>();
            var warnings = new List<string>();
            
            var customer = await _customerRepository.GetByIdAsync(customerId);
            if (customer == null)
            {
                errors.Add("顧客情報が見つかりません");
                return new ValidationResult(errors, warnings);
            }
            
            if (customer.Status == CustomerStatus.Suspended)
            {
                errors.Add("顧客アカウントが停止されています");
            }
            else if (customer.Status == CustomerStatus.PendingVerification)
            {
                warnings.Add("顧客アカウントの確認が未完了です");
            }
            
            // 信用限度額のチェック
            if (customer.HasCreditLimit)
            {
                var outstandingAmount = await GetOutstandingOrderAmount(customerId);
                if (outstandingAmount.IsGreaterThan(customer.CreditLimit))
                {
                    warnings.Add($"信用限度額に近づいています (使用額: \\{outstandingAmount\\}, 限度額: \\{customer.CreditLimit\\})");
                }
            }
            
            return new ValidationResult(errors, warnings);
        }
        
        private async Task<ValidationResult> ValidateInventoryAvailability(Order order)
        {
            var errors = new List<string>();
            var warnings = new List<string>();
            
            foreach (var item in order.Items)
            {
                var availability = await _inventoryService.CheckAvailabilityAsync(item.ProductId, item.Quantity.Value);
                
                if (!availability.IsAvailable)
                {
                    errors.Add($"商品 '\\{item.ProductName\\}' の在庫不足 (必要: \\{item.Quantity.Value\\}, 在庫: \\{availability.AvailableQuantity\\})");
                }
                else if (availability.AvailableQuantity < item.Quantity.Value * 2)
                {
                    warnings.Add($"商品 '\\{item.ProductName\\}' の在庫が少なくなっています");
                }
            }
            
            return new ValidationResult(errors, warnings);
        }
        
        private async Task<ValidationResult> ValidatePricing(Order order)
        {
            var errors = new List<string>();
            var warnings = new List<string>();
            
            foreach (var item in order.Items)
            {
                var currentPrice = await _pricingService.GetCurrentPriceAsync(item.ProductId);
                var priceDifference = Math.Abs(currentPrice.Amount - item.UnitPrice.Amount);
                var priceChangeThreshold = item.UnitPrice.Amount * 0.10m; // 10%の変動まで許容
                
                if (priceDifference > priceChangeThreshold)
                {
                    errors.Add($"商品 '\\{item.ProductName\\}' の価格が大きく変更されています (注文時: \\{item.UnitPrice\\}, 現在: \\{currentPrice\\})");
                }
                else if (priceDifference > item.UnitPrice.Amount * 0.05m) // 5%以上の変動で警告
                {
                    warnings.Add($"商品 '\\{item.ProductName\\}' の価格が変更されています");
                }
            }
            
            return new ValidationResult(errors, warnings);
        }
        
        private async Task<ExtendedValidationResult> ValidateShippingOptions(Order order)
        {
            var errors = new List<string>();
            var warnings = new List<string>();
            var information = new List<string>();
            
            var shippingOptions = await _shippingService.GetAvailableOptionsAsync(order.DeliveryAddress, order.Items);
            
            if (!shippingOptions.Any())
            {
                errors.Add("配送可能なオプションがありません");
                return new ExtendedValidationResult(errors, warnings, information);
            }
            
            // 特殊配送要件のチェック
            var fragileItems = order.Items.Where(item => item.IsFragile).ToList();
            if (fragileItems.Any())
            {
                var fragileCompatibleOptions = shippingOptions.Where(o => o.SupportsFragileItems).ToList();
                if (!fragileCompatibleOptions.Any())
                {
                    errors.Add("壊れ物対応の配送オプションがありません");
                }
                else
                {
                    information.Add($"壊れ物対応配送オプション: \\{fragileCompatibleOptions.Count\\}件利用可能");
                }
            }
            
            // 無料配送の可能性
            var freeShippingThreshold = Money.Yen(5000);
            if (order.TotalAmount.IsGreaterThanOrEqual(freeShippingThreshold))
            {
                information.Add("無料配送の条件を満たしています");
            }
            else
            {
                var amountNeeded = freeShippingThreshold.Subtract(order.TotalAmount);
                information.Add($"あと\\{amountNeeded\\}で無料配送対象となります");
            }
            
            return new ExtendedValidationResult(errors, warnings, information);
        }
        
        private async Task<ExtendedValidationResult> ValidateAndApplyPromotions(Order order)
        {
            var warnings = new List<string>();
            var information = new List<string>();
            
            var applicablePromotions = await _promotionService.GetApplicablePromotionsAsync(order);
            
            foreach (var promotion in applicablePromotions)
            {
                if (promotion.IsExpiringSoon)
                {
                    warnings.Add($"プロモーション '\\{promotion.Name\\}' は間もなく終了します");
                }
                
                information.Add($"適用可能: \\{promotion.Name\\} (\\{promotion.DiscountDescription\\})");
            }
            
            return new ExtendedValidationResult(new List<string>(), warnings, information);
        }
        
        // その他のヘルパーメソッド
        private async Task<decimal> CalculateTotalWeight(Order order)
        {
            decimal totalWeight = 0;
            foreach (var item in order.Items)
            {
                var product = await _productRepository.GetByIdAsync(item.ProductId);
                totalWeight += product.Weight * item.Quantity.Value;
            }
            return totalWeight;
        }
        
        private PriceAdjustmentFactor CalculateInventoryBasedAdjustment(Money basePrice, InventoryLevel inventoryLevel)
        {
            // 在庫レベルに基づく価格調整ロジック
            return inventoryLevel.Level switch
            {
                Stock.High => new PriceAdjustmentFactor(-5.0m), // 5%割引
                Stock.Low => new PriceAdjustmentFactor(5.0m),   // 5%割増
                Stock.Critical => new PriceAdjustmentFactor(10.0m), // 10%割増
                _ => PriceAdjustmentFactor.None
            };
        }
        
        // ... 他のメソッドの実装
    }
    
    // 結果クラス群
    public class OrderValidationResult
    {
        public List<string> Errors { get; }
        public List<string> Warnings { get; }
        public List<string> Information { get; }
        public bool IsValid => !Errors.Any();
        
        public OrderValidationResult(List<string> errors, List<string> warnings = null, List<string> information = null)
        {
            Errors = errors ?? new List<string>();
            Warnings = warnings ?? new List<string>();
            Information = information ?? new List<string>();
        }
    }
    
    public class OrderProcessingResult
    {
        public bool Success { get; }
        public List<ProcessingStep> Steps { get; }
        public string ErrorMessage { get; }
        
        public OrderProcessingResult(bool success, List<ProcessingStep> steps, string errorMessage = null)
        {
            Success = success;
            Steps = steps ?? new List<ProcessingStep>();
            ErrorMessage = errorMessage;
        }
    }
    
    public class ProcessingStep
    {
        public string Name { get; }
        public ProcessingStatus Status { get; set; }
        public string Message { get; set; }
        public DateTime StartedAt { get; }
        
        public ProcessingStep(string name, ProcessingStatus status)
        {
            Name = name;
            Status = status;
            StartedAt = DateTime.UtcNow;
        }
    }
    
    public enum ProcessingStatus
    {
        Pending,
        InProgress,
        Completed,
        Failed,
        PendingReview
    }
}

// 使用例
public class Program
{
    public static async Task Main(string[] args)
    {
        Console.WriteLine("=== 注文管理ドメインサービスの例 ===\\n");
        
        // 依存関係の注入（実際の実装では DIコンテナを使用）
        var orderService = new OrderManagementService(
            new MockOrderRepository(),
            new MockCustomerRepository(), 
            new MockProductRepository(),
            new MockInventoryService(),
            new MockPricingService(),
            new MockShippingService(),
            new MockPaymentService(),
            new MockPromotionService()
        );
        
        try
        {
            // サンプル注文の作成
            var customerId = CustomerId.NewId();
            var deliveryAddress = new Address("東京都", "渋谷区", "1-1-1", "150-0001");
            var order = Order.Create(customerId, deliveryAddress);
            
            // 商品の追加（サンプル）
            var product1 = new Product(ProductId.NewId(), "ノートPC", Money.Yen(120000));
            var product2 = new Product(ProductId.NewId(), "マウス", Money.Yen(3000));
            
            order.AddItem(product1, new Quantity(1), product1.Price);
            order.AddItem(product2, new Quantity(2), product2.Price);
            
            Console.WriteLine($"注文作成: \\{order.OrderNumber\\}");
            Console.WriteLine($"商品数: \\{order.Items.Count\\}");
            Console.WriteLine($"合計金額: \\{order.TotalAmount\\}");
            
            // 包括的な注文検証
            Console.WriteLine("\\n=== 包括的検証実行 ===");
            var validation = await orderService.ValidateOrderComprehensively(order);
            
            Console.WriteLine($"検証結果: \\{(validation.IsValid ? "成功" : "失敗")\\}");
            
            if (validation.Errors.Any())
            {
                Console.WriteLine("エラー:");
                validation.Errors.ForEach(e => Console.WriteLine($"  - \\{e\\}"));
            }
            
            if (validation.Warnings.Any())
            {
                Console.WriteLine("警告:");
                validation.Warnings.ForEach(w => Console.WriteLine($"  - \\{w\\}"));
            }
            
            if (validation.Information.Any())
            {
                Console.WriteLine("情報:");
                validation.Information.ForEach(i => Console.WriteLine($"  - \\{i\\}"));
            }
            
            // インテリジェント注文処理
            if (validation.IsValid)
            {
                Console.WriteLine("\\n=== インテリジェント処理実行 ===");
                var processing = await orderService.ProcessOrderIntelligently(order);
                
                Console.WriteLine($"処理結果: \\{(processing.Success ? "成功" : "失敗")\\}");
                Console.WriteLine("処理ステップ:");
                
                foreach (var step in processing.Steps)
                {
                    var statusIcon = step.Status switch
                    {
                        ProcessingStatus.Completed => "✅",
                        ProcessingStatus.Failed => "❌",
                        ProcessingStatus.PendingReview => "⏳",
                        _ => "⚪"
                    };
                    
                    Console.WriteLine($"  \\{statusIcon\\} \\{step.Name\\}");
                    if (!string.IsNullOrEmpty(step.Message))
                        Console.WriteLine($"      \\{step.Message\\}");
                }
            }
            
        }
        catch (Exception ex)
        {
            Console.WriteLine($"エラーが発生しました: \\{ex.Message\\}");
        }
    }
}`
    }
  ],
  exercises: [
    {
      id: 'aggregates-exercise-1',
      title: '図書館システム集約の設計',
      description: '図書、会員、貸出を適切な集約として設計し、ドメインサービスで複雑なビジネスルールを実装してください。',
      difficulty: 'hard',
      starterCode: `using System;
using System.Collections.Generic;

// 図書館システムを集約とドメインサービスで設計してください
// 要件:
// 1. 図書集約（Book Aggregate）- 図書の基本情報と状態管理
// 2. 会員集約（Member Aggregate）- 会員情報と貸出履歴
// 3. 貸出集約（Loan Aggregate）- 貸出の状態とビジネスルール
// 4. 図書館ドメインサービス - 複雑な貸出ルールの実装

public class Book : AggregateRoot<BookId>
{
    // TODO: 図書集約を実装してください
    // - ISBN、タイトル、著者、出版年、状態（在庫中、貸出中、予約中）
    // - 貸出、返却、予約に関するビジネスルール
}

public class Member : AggregateRoot<MemberId>
{
    // TODO: 会員集約を実装してください
    // - 会員情報、会員ステータス、貸出履歴
    // - 貸出上限、延滞に関するビジネスルール
}

public class Loan : AggregateRoot<LoanId>
{
    // TODO: 貸出集約を実装してください
    // - 貸出情報（図書ID、会員ID、貸出日、返却予定日）
    // - 延長、返却、延滞に関するビジネスルール
}

public class LibraryDomainService
{
    // TODO: 図書館ドメインサービスを実装してください
    // - 貸出可能性の総合判定
    // - 予約システムの管理
    // - 延滞料金の計算
    // - 会員の信用度評価
}`,
      solution: `public class Book : AggregateRoot<BookId>
{
    private readonly List<Reservation> _reservations = new();
    
    public ISBN ISBN { get; private set; }
    public string Title { get; private set; }
    public string Author { get; private set; }
    public int PublicationYear { get; private set; }
    public BookStatus Status { get; private set; }
    public MemberId? CurrentBorrowerId { get; private set; }
    public DateTime? LoanDate { get; private set; }
    public DateTime? DueDate { get; private set; }
    
    public IReadOnlyList<Reservation> Reservations => _reservations.AsReadOnly();
    public bool IsAvailable => Status == BookStatus.Available;
    public bool IsOnLoan => Status == BookStatus.OnLoan;
    public bool HasReservations => _reservations.Any();
    
    public static Book Register(ISBN isbn, string title, string author, int publicationYear)
    {
        return new Book
        {
            Id = BookId.NewId(),
            ISBN = isbn,
            Title = title,
            Author = author,
            PublicationYear = publicationYear,
            Status = BookStatus.Available
        };
    }
    
    public Loan LoanTo(MemberId memberId, LoanPeriod period)
    {
        if (!IsAvailable)
            throw new DomainException("この図書は貸出可能ではありません");
            
        Status = BookStatus.OnLoan;
        CurrentBorrowerId = memberId;
        LoanDate = DateTime.UtcNow;
        DueDate = period.DueDate;
        
        AddDomainEvent(new BookLoanedEvent(Id, memberId, period));
        
        return Loan.Create(LoanId.NewId(), Id, memberId, period);
    }
    
    public void Return()
    {
        if (!IsOnLoan)
            throw new DomainException("この図書は貸出中ではありません");
            
        var returnedToBorrower = CurrentBorrowerId;
        
        // 予約がある場合は予約中に、なければ在庫中に
        if (HasReservations)
        {
            Status = BookStatus.Reserved;
            var nextReservation = _reservations.OrderBy(r => r.ReservedAt).First();
            AddDomainEvent(new BookReservedForMemberEvent(Id, nextReservation.MemberId));
        }
        else
        {
            Status = BookStatus.Available;
        }
        
        CurrentBorrowerId = null;
        LoanDate = null;
        DueDate = null;
        
        AddDomainEvent(new BookReturnedEvent(Id, returnedToBorrower.Value));
    }
    
    public void Reserve(MemberId memberId)
    {
        if (IsAvailable)
            throw new DomainException("在庫中の図書は予約できません");
            
        if (_reservations.Any(r => r.MemberId.Equals(memberId)))
            throw new DomainException("既に予約済みです");
            
        var reservation = new Reservation(memberId, DateTime.UtcNow);
        _reservations.Add(reservation);
        
        AddDomainEvent(new BookReservationMadeEvent(Id, memberId));
    }
}

public class Member : AggregateRoot<MemberId>
{
    private readonly List<LoanHistory> _loanHistory = new();
    
    public string Name { get; private set; }
    public EmailAddress Email { get; private set; }
    public MembershipType MembershipType { get; private set; }
    public MemberStatus Status { get; private set; }
    public DateTime RegisteredAt { get; private set; }
    public int CurrentLoanCount { get; private set; }
    public Money OutstandingFines { get; private set; }
    
    public IReadOnlyList<LoanHistory> LoanHistory => _loanHistory.AsReadOnly();
    public bool CanBorrowBooks => Status == MemberStatus.Active && OutstandingFines.Amount < 1000;
    public int MaxLoanCount => MembershipType.MaxLoanCount;
    
    public static Member Register(string name, EmailAddress email, MembershipType membershipType)
    {
        return new Member
        {
            Id = MemberId.NewId(),
            Name = name,
            Email = email,
            MembershipType = membershipType,
            Status = MemberStatus.Active,
            RegisteredAt = DateTime.UtcNow,
            OutstandingFines = Money.Zero
        };
    }
    
    public void RecordLoan(LoanId loanId, BookId bookId)
    {
        if (CurrentLoanCount >= MaxLoanCount)
            throw new DomainException("貸出上限に達しています");
            
        CurrentLoanCount++;
        _loanHistory.Add(new LoanHistory(loanId, bookId, DateTime.UtcNow));
        
        AddDomainEvent(new MemberLoanRecordedEvent(Id, loanId, bookId));
    }
    
    public void RecordReturn(LoanId loanId, Money fineAmount = null)
    {
        CurrentLoanCount--;
        
        if (fineAmount != null && fineAmount.Amount > 0)
        {
            OutstandingFines = OutstandingFines.Add(fineAmount);
            AddDomainEvent(new MemberFineAssessedEvent(Id, loanId, fineAmount));
        }
        
        AddDomainEvent(new MemberReturnRecordedEvent(Id, loanId));
    }
    
    public void PayFines(Money amount)
    {
        if (amount.IsGreaterThan(OutstandingFines))
            throw new DomainException("支払金額が未払い料金を超えています");
            
        OutstandingFines = OutstandingFines.Subtract(amount);
        AddDomainEvent(new MemberFinesPaidEvent(Id, amount));
    }
}

public class Loan : AggregateRoot<LoanId>
{
    public BookId BookId { get; private set; }
    public MemberId MemberId { get; private set; }
    public DateTime LoanDate { get; private set; }
    public DateTime DueDate { get; private set; }
    public DateTime? ReturnDate { get; private set; }
    public LoanStatus Status { get; private set; }
    public int ExtensionCount { get; private set; }
    
    public bool IsOverdue => Status == LoanStatus.Active && DateTime.UtcNow > DueDate;
    public TimeSpan OverdueDays => IsOverdue ? DateTime.UtcNow - DueDate : TimeSpan.Zero;
    
    internal static Loan Create(LoanId id, BookId bookId, MemberId memberId, LoanPeriod period)
    {
        return new Loan
        {
            Id = id,
            BookId = bookId,
            MemberId = memberId,
            LoanDate = DateTime.UtcNow,
            DueDate = period.DueDate,
            Status = LoanStatus.Active,
            ExtensionCount = 0
        };
    }
    
    public void Extend(int days)
    {
        if (Status != LoanStatus.Active)
            throw new DomainException("アクティブでない貸出は延長できません");
            
        if (ExtensionCount >= 2)
            throw new DomainException("延長は2回までです");
            
        if (IsOverdue)
            throw new DomainException("延滞中の貸出は延長できません");
            
        DueDate = DueDate.AddDays(days);
        ExtensionCount++;
        
        AddDomainEvent(new LoanExtendedEvent(Id, days, DueDate));
    }
    
    public Money Return()
    {
        if (Status != LoanStatus.Active)
            throw new DomainException("既に返却済みです");
            
        ReturnDate = DateTime.UtcNow;
        Status = LoanStatus.Returned;
        
        var fineAmount = CalculateOverdueFine();
        AddDomainEvent(new LoanReturnedEvent(Id, ReturnDate.Value, fineAmount));
        
        return fineAmount;
    }
    
    private Money CalculateOverdueFine()
    {
        if (!IsOverdue) return Money.Zero;
        
        var overdueDays = (int)OverdueDays.TotalDays;
        var dailyFineRate = 50; // 1日50円
        
        return Money.Yen(overdueDays * dailyFineRate);
    }
}

public class LibraryDomainService
{
    private readonly IBookRepository _bookRepository;
    private readonly IMemberRepository _memberRepository;
    private readonly ILoanRepository _loanRepository;
    
    public async Task<LoanEligibilityResult> CheckLoanEligibility(MemberId memberId, BookId bookId)
    {
        var member = await _memberRepository.GetByIdAsync(memberId);
        var book = await _bookRepository.GetByIdAsync(bookId);
        
        var eligibilityChecks = new List<string>();
        var warnings = new List<string>();
        
        // 会員ステータスチェック
        if (!member.CanBorrowBooks)
        {
            eligibilityChecks.Add("会員の貸出資格がありません");
        }
        
        // 貸出上限チェック
        if (member.CurrentLoanCount >= member.MaxLoanCount)
        {
            eligibilityChecks.Add("貸出上限に達しています");
        }
        
        // 図書の状態チェック
        if (!book.IsAvailable)
        {
            eligibilityChecks.Add("図書が貸出可能ではありません");
        }
        
        // 延滞料金チェック
        if (member.OutstandingFines.Amount > 0)
        {
            warnings.Add($"未払い延滞料金: {member.OutstandingFines}");
        }
        
        return new LoanEligibilityResult(
            !eligibilityChecks.Any(),
            eligibilityChecks,
            warnings
        );
    }
}`,
      hints: [
        '集約の境界は一貫性が必要な範囲に設定する',
        '集約ルートを通してのみ内部エンティティにアクセスする',
        'ドメインサービスは複数の集約にまたがるロジックを扱う',
        'ドメインイベントを使って集約間の協調を行う'
      ],
      testCases: [
        {
          input: '図書の貸出、返却、予約の一連の流れ',
          expectedOutput: '適切な状態遷移とビジネスルールが守られる'
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'aggregates-quiz-1',
      question: '集約の境界を決定する最も重要な基準は何ですか？',
      options: [
        'データベースのテーブル設計',
        'ユーザーインターフェースの画面構成',
        'トランザクションの一貫性境界',
        'クラスの継承関係'
      ],
      correctAnswer: 2,
      explanation: '集約の境界は、トランザクションの一貫性境界と一致させることが最も重要です。同じトランザクション内で一貫性を保つ必要があるデータをまとめて集約とします。'
    },
    {
      id: 'aggregates-quiz-2',
      question: 'ドメインサービスを使用するのに適した場面はどれですか？',
      options: [
        'エンティティの基本的なCRUD操作',
        '単一エンティティ内の計算処理',
        '複数の集約にまたがる複雑なビジネスロジック',
        'データベースへの永続化処理'
      ],
      correctAnswer: 2,
      explanation: 'ドメインサービスは、単一のエンティティやバリューオブジェクトに属さない、複数の集約にまたがる複雑なビジネスロジックを実装する際に使用します。'
    },
    {
      id: 'aggregates-quiz-3',
      question: '集約間の参照について正しいのはどれですか？',
      options: [
        '直接オブジェクト参照を使用すべき',
        'IDによる参照を使用すべき',
        'どちらも同等に有効',
        '参照は避けるべき'
      ],
      correctAnswer: 1,
      explanation: '集約間の参照はIDによる参照を使用すべきです。直接オブジェクト参照を使うと集約の境界が曖昧になり、一貫性の管理が困難になります。'
    }
  ],
  nextLesson: 'repository-factory',
  estimatedTime: 90
};