import type { Lesson } from '../../../../features/learning/types';

export const boundedContextsLesson: Lesson = {
  id: 'bounded-contexts',
  moduleId: 'ddd-strategic-patterns',
  title: '境界づけられたコンテキスト - ドメインの境界を明確にする',
  description: 'DDDの戦略的設計における最重要概念、境界づけられたコンテキストによるドメイン分割と組織化手法を詳しく学習します',
  content: `
# 境界づけられたコンテキスト（Bounded Context）

境界づけられたコンテキストは、DDDの戦略的設計における最も重要な概念です。複雑なドメインを理解しやすい境界で分割し、各境界内でのモデルの一貫性を保つための仕組みです。

## 境界づけられたコンテキストとは何か？

### 境界づけられたコンテキストの定義

**境界づけられたコンテキスト**は、特定のドメインモデルが適用される明示的な境界です：

1. **境界の明確化**: ドメインモデルが有効な範囲を定義
2. **言語の統一**: 境界内では同じ用語が同じ意味を持つ
3. **モデルの整合性**: 境界内でのモデルの一貫性を保証
4. **チーム責任**: 通常、一つのチームが一つのコンテキストを担当

### コンテキストマップ（Context Map）

複数の境界づけられたコンテキスト間の関係性を可視化する図：

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Sales Context │────│Catalog Context  │────│Inventory Context│
│                 │    │                 │    │                 │
│ • Order         │    │ • Product       │    │ • Stock         │
│ • Customer      │    │ • Category      │    │ • Warehouse     │
│ • Pricing       │    │ • Brand         │    │ • Allocation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│Shipping Context │    │Marketing Context│    │Analytics Context│
│                 │    │                 │    │                 │
│ • Shipment      │    │ • Campaign      │    │ • Report        │
│ • Carrier       │    │ • Lead          │    │ • Metrics       │
│ • Tracking      │    │ • Promotion     │    │ • Dashboard     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

## 実践的なコンテキスト分割

### EC サイトの境界づけられたコンテキスト例

#### 1. Sales Context（販売コンテキスト）

\`\`\`csharp
namespace ECommerce.Sales
{
    // 販売コンテキストでの顧客
    public class Customer : AggregateRoot<CustomerId>
    {
        public string Name { get; private set; }
        public EmailAddress Email { get; private set; }
        public CustomerType Type { get; private set; }  // Regular, VIP, Premium
        public Money TotalPurchaseAmount { get; private set; }
        public Address BillingAddress { get; private set; }
        public PaymentMethod PreferredPaymentMethod { get; private set; }
        
        private readonly List<Order> _orders = new();
        public IReadOnlyList<Order> Orders => _orders.AsReadOnly();
        
        public void PlaceOrder(IEnumerable<OrderItem> items, Address shippingAddress)
        {
            var order = Order.Create(Id, items, shippingAddress);
            _orders.Add(order);
            
            // 購入金額の更新
            TotalPurchaseAmount = TotalPurchaseAmount.Add(order.TotalAmount);
            
            // VIP判定
            if (TotalPurchaseAmount.Amount >= 1000000 && Type != CustomerType.VIP)
            {
                Type = CustomerType.VIP;
                AddDomainEvent(new CustomerBecameVip(Id, Name, TotalPurchaseAmount));
            }
        }
    }
    
    public class Order : AggregateRoot<OrderId>
    {
        public CustomerId CustomerId { get; private set; }
        public OrderNumber OrderNumber { get; private set; }
        public OrderStatus Status { get; private set; }
        public Money TotalAmount { get; private set; }
        public Address ShippingAddress { get; private set; }
        public DateTime OrderDate { get; private set; }
        
        private readonly List<OrderItem> _items = new();
        public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();
        
        public static Order Create(CustomerId customerId, IEnumerable<OrderItem> items, Address shippingAddress)
        {
            var order = new Order
            {
                Id = OrderId.NewId(),
                CustomerId = customerId,
                OrderNumber = OrderNumber.Generate(),
                ShippingAddress = shippingAddress,
                OrderDate = DateTime.UtcNow,
                Status = OrderStatus.Draft
            };
            
            foreach (var item in items)
            {
                order._items.Add(item);
            }
            
            order.CalculateTotalAmount();
            order.AddDomainEvent(new OrderCreated(order.Id, customerId, order.TotalAmount));
            
            return order;
        }
        
        private void CalculateTotalAmount()
        {
            TotalAmount = _items.Aggregate(Money.Zero, (sum, item) => sum.Add(item.Subtotal));
        }
    }
    
    public class OrderItem : Entity<OrderItemId>
    {
        public ProductId ProductId { get; private set; }
        public string ProductName { get; private set; }  // スナップショット
        public Money UnitPrice { get; private set; }    // 注文時の価格
        public int Quantity { get; private set; }
        public Money Subtotal => UnitPrice.Multiply(Quantity);
        
        public OrderItem(ProductId productId, string productName, Money unitPrice, int quantity)
        {
            Id = OrderItemId.NewId();
            ProductId = productId;
            ProductName = productName;
            UnitPrice = unitPrice;
            Quantity = quantity;
        }
    }
}
\`\`\`

#### 2. Catalog Context（カタログコンテキスト）

\`\`\`csharp
namespace ECommerce.Catalog
{
    // カタログコンテキストでの商品
    public class Product : AggregateRoot<ProductId>
    {
        public string Name { get; private set; }
        public string Description { get; private set; }
        public ProductCategory Category { get; private set; }
        public Brand Brand { get; private set; }
        public Money Price { get; private set; }
        public ProductSpecifications Specifications { get; private set; }
        public ProductImages Images { get; private set; }
        public ProductStatus Status { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime LastUpdatedAt { get; private set; }
        
        private readonly List<ProductReview> _reviews = new();
        public IReadOnlyList<ProductReview> Reviews => _reviews.AsReadOnly();
        
        public double AverageRating => _reviews.Any() ? _reviews.Average(r => r.Rating) : 0.0;
        public int ReviewCount => _reviews.Count;
        
        public void UpdatePrice(Money newPrice, string reason)
        {
            if (newPrice.Amount <= 0)
                throw new DomainException("商品価格は0より大きい必要があります。");
            
            var oldPrice = Price;
            Price = newPrice;
            LastUpdatedAt = DateTime.UtcNow;
            
            AddDomainEvent(new ProductPriceChanged(Id, oldPrice, newPrice, reason));
        }
        
        public void AddReview(CustomerId customerId, int rating, string comment)
        {
            if (rating < 1 || rating > 5)
                throw new DomainException("評価は1から5の間で入力してください。");
            
            var review = new ProductReview(customerId, rating, comment);
            _reviews.Add(review);
            
            AddDomainEvent(new ProductReviewAdded(Id, customerId, rating));
        }
        
        public void Discontinue()
        {
            Status = ProductStatus.Discontinued;
            AddDomainEvent(new ProductDiscontinued(Id, Name));
        }
    }
    
    public class ProductCategory : Entity<CategoryId>
    {
        public string Name { get; private set; }
        public string Description { get; private set; }
        public CategoryId ParentCategoryId { get; private set; }
        public bool IsActive { get; private set; }
        
        private readonly List<CategoryId> _subcategories = new();
        public IReadOnlyList<CategoryId> Subcategories => _subcategories.AsReadOnly();
        
        public void AddSubcategory(CategoryId subcategoryId)
        {
            if (!_subcategories.Contains(subcategoryId))
            {
                _subcategories.Add(subcategoryId);
            }
        }
    }
    
    public class Brand : ValueObject
    {
        public string Name { get; private set; }
        public string LogoUrl { get; private set; }
        public string Description { get; private set; }
        
        public Brand(string name, string logoUrl, string description)
        {
            Name = name ?? throw new ArgumentNullException(nameof(name));
            LogoUrl = logoUrl;
            Description = description;
        }
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Name;
            yield return LogoUrl;
            yield return Description;
        }
    }
}
\`\`\`

#### 3. Inventory Context（在庫コンテキスト）

\`\`\`csharp
namespace ECommerce.Inventory
{
    // 在庫コンテキストでの商品（異なる視点）
    public class Product : AggregateRoot<ProductId>
    {
        public string SKU { get; private set; }
        public string Name { get; private set; }  // 管理用の名前
        public ProductDimensions Dimensions { get; private set; }
        public Weight Weight { get; private set; }
        public StorageRequirements StorageRequirements { get; private set; }
        
        private readonly List<StockLevel> _stockLevels = new();
        public IReadOnlyList<StockLevel> StockLevels => _stockLevels.AsReadOnly();
        
        public int TotalAvailableQuantity => 
            _stockLevels.Where(s => s.Status == StockStatus.Available)
                       .Sum(s => s.Quantity);
        
        public void AllocateStock(int quantity, WarehouseId warehouseId, OrderId orderId)
        {
            var availableStock = _stockLevels
                .Where(s => s.WarehouseId == warehouseId && s.Status == StockStatus.Available)
                .Sum(s => s.Quantity);
            
            if (availableStock < quantity)
            {
                AddDomainEvent(new InsufficientStockDetected(Id, quantity, availableStock));
                throw new DomainException($"在庫不足: 必要\{quantity\}、利用可能\{availableStock\}");
            }
            
            // 在庫の引当処理
            var allocation = StockAllocation.Create(Id, warehouseId, orderId, quantity);
            
            AddDomainEvent(new StockAllocated(Id, warehouseId, orderId, quantity));
        }
        
        public void ReceiveStock(int quantity, WarehouseId warehouseId, string batchNumber)
        {
            var stockLevel = new StockLevel(warehouseId, quantity, batchNumber);
            _stockLevels.Add(stockLevel);
            
            AddDomainEvent(new StockReceived(Id, warehouseId, quantity, batchNumber));
        }
    }
    
    public class Warehouse : AggregateRoot<WarehouseId>
    {
        public string Name { get; private set; }
        public Address Address { get; private set; }
        public WarehouseType Type { get; private set; }
        public Capacity MaxCapacity { get; private set; }
        public Capacity CurrentCapacity { get; private set; }
        
        private readonly List<StockAllocation> _allocations = new();
        public IReadOnlyList<StockAllocation> Allocations => _allocations.AsReadOnly();
        
        public bool CanAccommodate(ProductDimensions dimensions, int quantity)
        {
            var requiredCapacity = dimensions.CalculateVolume() * quantity;
            var availableCapacity = MaxCapacity.Value - CurrentCapacity.Value;
            
            return availableCapacity >= requiredCapacity;
        }
        
        public void AllocateStock(ProductId productId, OrderId orderId, int quantity)
        {
            var allocation = StockAllocation.Create(productId, Id, orderId, quantity);
            _allocations.Add(allocation);
            
            AddDomainEvent(new StockAllocationCreated(Id, productId, orderId, quantity));
        }
    }
    
    public class StockLevel : Entity<StockLevelId>
    {
        public WarehouseId WarehouseId { get; private set; }
        public int Quantity { get; private set; }
        public string BatchNumber { get; private set; }
        public StockStatus Status { get; private set; }
        public DateTime ReceivedAt { get; private set; }
        public DateTime? ExpiryDate { get; private set; }
        
        public StockLevel(WarehouseId warehouseId, int quantity, string batchNumber)
        {
            Id = StockLevelId.NewId();
            WarehouseId = warehouseId;
            Quantity = quantity;
            BatchNumber = batchNumber;
            Status = StockStatus.Available;
            ReceivedAt = DateTime.UtcNow;
        }
        
        public void Reserve(int reserveQuantity)
        {
            if (reserveQuantity > Quantity)
                throw new DomainException("予約数量が在庫数量を超えています。");
            
            Quantity -= reserveQuantity;
            if (Quantity == 0)
                Status = StockStatus.Reserved;
        }
    }
}
\`\`\`

#### 4. Shipping Context（配送コンテキスト）

\`\`\`csharp
namespace ECommerce.Shipping
{
    public class Shipment : AggregateRoot<ShipmentId>
    {
        public OrderId OrderId { get; private set; }
        public CustomerId CustomerId { get; private set; }  // 顧客は配送先として認識
        public TrackingNumber TrackingNumber { get; private set; }
        public CarrierId CarrierId { get; private set; }
        public ShippingAddress OriginAddress { get; private set; }
        public ShippingAddress DestinationAddress { get; private set; }
        public ShipmentStatus Status { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? EstimatedDeliveryDate { get; private set; }
        public DateTime? ActualDeliveryDate { get; private set; }
        
        private readonly List<ShipmentItem> _items = new();
        public IReadOnlyList<ShipmentItem> Items => _items.AsReadOnly();
        
        private readonly List<TrackingEvent> _trackingEvents = new();
        public IReadOnlyList<TrackingEvent> TrackingEvents => _trackingEvents.AsReadOnly();
        
        public static Shipment Create(OrderId orderId, CustomerId customerId, 
                                    CarrierId carrierId, ShippingAddress origin, 
                                    ShippingAddress destination, IEnumerable<ShipmentItem> items)
        {
            var shipment = new Shipment
            {
                Id = ShipmentId.NewId(),
                OrderId = orderId,
                CustomerId = customerId,
                CarrierId = carrierId,
                TrackingNumber = TrackingNumber.Generate(),
                OriginAddress = origin,
                DestinationAddress = destination,
                Status = ShipmentStatus.Created,
                CreatedAt = DateTime.UtcNow
            };
            
            foreach (var item in items)
            {
                shipment._items.Add(item);
            }
            
            shipment.AddDomainEvent(new ShipmentCreated(shipment.Id, orderId, shipment.TrackingNumber));
            
            return shipment;
        }
        
        public void Ship()
        {
            if (Status != ShipmentStatus.Created)
                throw new DomainException("作成済みの配送のみ出荷できます。");
            
            Status = ShipmentStatus.Shipped;
            var trackingEvent = new TrackingEvent(TrackingEventType.Shipped, OriginAddress.ToString());
            _trackingEvents.Add(trackingEvent);
            
            AddDomainEvent(new ShipmentShipped(Id, TrackingNumber, DateTime.UtcNow));
        }
        
        public void UpdateLocation(string location, TrackingEventType eventType)
        {
            var trackingEvent = new TrackingEvent(eventType, location);
            _trackingEvents.Add(trackingEvent);
            
            if (eventType == TrackingEventType.OutForDelivery)
            {
                Status = ShipmentStatus.OutForDelivery;
            }
            
            AddDomainEvent(new ShipmentLocationUpdated(Id, TrackingNumber, location, eventType));
        }
        
        public void Deliver()
        {
            Status = ShipmentStatus.Delivered;
            ActualDeliveryDate = DateTime.UtcNow;
            
            var deliveryEvent = new TrackingEvent(TrackingEventType.Delivered, DestinationAddress.ToString());
            _trackingEvents.Add(deliveryEvent);
            
            AddDomainEvent(new ShipmentDelivered(Id, OrderId, ActualDeliveryDate.Value));
        }
    }
    
    public class Carrier : AggregateRoot<CarrierId>
    {
        public string Name { get; private set; }
        public string ContactPhone { get; private set; }
        public string Website { get; private set; }
        public CarrierCapabilities Capabilities { get; private set; }
        
        private readonly List<ServiceArea> _serviceAreas = new();
        public IReadOnlyList<ServiceArea> ServiceAreas => _serviceAreas.AsReadOnly();
        
        public bool CanDeliver(ShippingAddress address)
        {
            return _serviceAreas.Any(area => area.Covers(address));
        }
        
        public ShippingRate CalculateRate(ShippingAddress origin, ShippingAddress destination, 
                                        Weight totalWeight, ShipmentPriority priority)
        {
            // 配送料金計算ロジック
            var baseRate = Capabilities.BaseRate;
            var distanceRate = CalculateDistanceRate(origin, destination);
            var weightRate = CalculateWeightRate(totalWeight);
            var priorityRate = CalculatePriorityRate(priority);
            
            return new ShippingRate(baseRate + distanceRate + weightRate + priorityRate);
        }
        
        private Money CalculateDistanceRate(ShippingAddress origin, ShippingAddress destination)
        {
            // 距離に基づく料金計算
            var distance = origin.CalculateDistanceTo(destination);
            return new Money(distance * 0.1m); // 1km あたり 0.1円
        }
        
        private Money CalculateWeightRate(Weight weight)
        {
            // 重量に基づく料金計算
            return new Money(weight.Kilograms * 50); // 1kg あたり 50円
        }
        
        private Money CalculatePriorityRate(ShipmentPriority priority)
        {
            return priority switch
            {
                ShipmentPriority.Standard => Money.Zero,
                ShipmentPriority.Express => new Money(500),
                ShipmentPriority.Overnight => new Money(1500),
                _ => Money.Zero
            };
        }
    }
}
\`\`\`

## コンテキスト間の統合パターン

### 1. 共有カーネル（Shared Kernel）

複数のコンテキストで共有される共通の概念：

\`\`\`csharp
namespace ECommerce.SharedKernel
{
    // 共通の値オブジェクト
    public class Money : ValueObject
    {
        public decimal Amount { get; private set; }
        public string Currency { get; private set; }
        
        public Money(decimal amount, string currency = "JPY")
        {
            if (amount < 0)
                throw new ArgumentException("金額は0以上である必要があります。");
            
            Amount = amount;
            Currency = currency ?? throw new ArgumentNullException(nameof(currency));
        }
        
        public static readonly Money Zero = new Money(0);
        
        public Money Add(Money other)
        {
            if (Currency != other.Currency)
                throw new InvalidOperationException("異なる通貨の金額は加算できません。");
            
            return new Money(Amount + other.Amount, Currency);
        }
        
        public Money Multiply(int multiplier)
        {
            return new Money(Amount * multiplier, Currency);
        }
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Amount;
            yield return Currency;
        }
    }
    
    public class Address : ValueObject
    {
        public string PostalCode { get; private set; }
        public string Prefecture { get; private set; }
        public string City { get; private set; }
        public string StreetAddress { get; private set; }
        public string BuildingName { get; private set; }
        
        public Address(string postalCode, string prefecture, string city, 
                      string streetAddress, string buildingName = null)
        {
            PostalCode = postalCode ?? throw new ArgumentNullException(nameof(postalCode));
            Prefecture = prefecture ?? throw new ArgumentNullException(nameof(prefecture));
            City = city ?? throw new ArgumentNullException(nameof(city));
            StreetAddress = streetAddress ?? throw new ArgumentNullException(nameof(streetAddress));
            BuildingName = buildingName;
        }
        
        public double CalculateDistanceTo(Address other)
        {
            // 簡単な距離計算（実際にはより精密な計算が必要）
            return Math.Abs(PostalCode.GetHashCode() - other.PostalCode.GetHashCode()) / 1000.0;
        }
        
        public override string ToString()
        {
            var parts = new List<string> \{ PostalCode, Prefecture, City, StreetAddress \};
            if (!string.IsNullOrEmpty(BuildingName))
                parts.Add(BuildingName);
            
            return string.Join(" ", parts);
        }
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return PostalCode;
            yield return Prefecture;
            yield return City;
            yield return StreetAddress;
            yield return BuildingName;
        }
    }
    
    // 共通のID型
    public abstract class TypedId<T> : ValueObject where T : TypedId<T>
    {
        public Guid Value { get; private set; }
        
        protected TypedId(Guid value)
        {
            if (value == Guid.Empty)
                throw new ArgumentException("IDは空のGUIDにできません。");
            
            Value = value;
        }
        
        public static T NewId() where T : TypedId<T>, new()
        {
            return (T)Activator.CreateInstance(typeof(T), Guid.NewGuid());
        }
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Value;
        }
        
        public override string ToString() => Value.ToString();
    }
    
    public class CustomerId : TypedId<CustomerId>
    {
        public CustomerId(Guid value) : base(value) { }
    }
    
    public class ProductId : TypedId<ProductId>
    {
        public ProductId(Guid value) : base(value) { }
    }
    
    public class OrderId : TypedId<OrderId>
    {
        public OrderId(Guid value) : base(value) { }
    }
}
\`\`\`

### 2. 顧客・サプライヤー（Customer-Supplier）

上流コンテキスト（サプライヤー）と下流コンテキスト（顧客）の関係：

\`\`\`csharp
// Catalog Context (上流) → Sales Context (下流)
namespace ECommerce.Sales.Integration
{
    // カタログコンテキストからの商品情報取得
    public interface IProductCatalogService
    {
        Task<ProductInfo> GetProductInfoAsync(ProductId productId);
        Task<IEnumerable<ProductInfo>> GetProductsInfoAsync(IEnumerable<ProductId> productIds);
        Task<bool> IsProductAvailableAsync(ProductId productId);
    }
    
    public class ProductInfo
    {
        public ProductId ProductId { get; set; }
        public string Name { get; set; }
        public Money CurrentPrice { get; set; }
        public bool IsActive { get; set; }
        public string Description { get; set; }
        public string ImageUrl { get; set; }
    }
    
    // Sales Context での使用
    public class OrderService
    {
        private readonly IProductCatalogService _catalogService;
        private readonly IOrderRepository _orderRepository;
        
        public OrderService(IProductCatalogService catalogService, IOrderRepository orderRepository)
        {
            _catalogService = catalogService;
            _orderRepository = orderRepository;
        }
        
        public async Task<Order> CreateOrderAsync(CustomerId customerId, 
                                                IEnumerable<OrderItemRequest> itemRequests, 
                                                Address shippingAddress)
        {
            var productIds = itemRequests.Select(ir => ir.ProductId).ToList();
            var productInfos = await _catalogService.GetProductsInfoAsync(productIds);
            
            var orderItems = new List<OrderItem>();
            
            foreach (var request in itemRequests)
            {
                var productInfo = productInfos.FirstOrDefault(pi => pi.ProductId == request.ProductId);
                if (productInfo == null || !productInfo.IsActive)
                {
                    throw new DomainException($"商品\{request.ProductId\}は利用できません。");
                }
                
                var orderItem = new OrderItem(
                    productInfo.ProductId,
                    productInfo.Name,
                    productInfo.CurrentPrice,
                    request.Quantity
                );
                
                orderItems.Add(orderItem);
            }
            
            var order = Order.Create(customerId, orderItems, shippingAddress);
            await _orderRepository.AddAsync(order);
            
            return order;
        }
    }
    
    public class OrderItemRequest
    {
        public ProductId ProductId { get; set; }
        public int Quantity { get; set; }
    }
}
\`\`\`

### 3. アンチ汚職レイヤー（Anti-Corruption Layer）

外部システムやレガシーシステムとの統合時の防御層：

\`\`\`csharp
namespace ECommerce.Sales.Infrastructure
{
    // 外部の支払いシステムとの統合
    public interface IExternalPaymentGateway
    {
        Task<ExternalPaymentResult> ProcessPaymentAsync(ExternalPaymentRequest request);
        Task<ExternalRefundResult> ProcessRefundAsync(ExternalRefundRequest request);
    }
    
    // 外部システムのモデル（制御できない）
    public class ExternalPaymentRequest
    {
        public string card_number { get; set; }
        public string expiry_month { get; set; }
        public string expiry_year { get; set; }
        public string cvv { get; set; }
        public decimal amount_cents { get; set; }  // セント単位
        public string currency_code { get; set; }
        public string merchant_reference { get; set; }
    }
    
    public class ExternalPaymentResult
    {
        public string transaction_id { get; set; }
        public string status { get; set; }  // "success", "failed", "pending"
        public string error_message { get; set; }
        public DateTime processed_at { get; set; }
    }
    
    // アンチ汚職レイヤー
    public class PaymentGatewayAdapter : IPaymentService
    {
        private readonly IExternalPaymentGateway _externalGateway;
        private readonly ILogger<PaymentGatewayAdapter> _logger;
        
        public PaymentGatewayAdapter(IExternalPaymentGateway externalGateway, 
                                   ILogger<PaymentGatewayAdapter> logger)
        {
            _externalGateway = externalGateway;
            _logger = logger;
        }
        
        public async Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request)
        {
            try
            {
                // ドメインモデルから外部システムのモデルに変換
                var externalRequest = new ExternalPaymentRequest
                {
                    card_number = request.CreditCard.Number,
                    expiry_month = request.CreditCard.ExpiryMonth.ToString("D2"),
                    expiry_year = request.CreditCard.ExpiryYear.ToString(),
                    cvv = request.CreditCard.CVV,
                    amount_cents = (long)(request.Amount.Amount * 100), // 円をセントに変換
                    currency_code = request.Amount.Currency,
                    merchant_reference = request.OrderId.Value.ToString()
                };
                
                var externalResult = await _externalGateway.ProcessPaymentAsync(externalRequest);
                
                // 外部システムの結果をドメインモデルに変換
                return new PaymentResult(
                    TransactionId: new TransactionId(Guid.Parse(externalResult.transaction_id)),
                    Status: MapPaymentStatus(externalResult.status),
                    ProcessedAt: externalResult.processed_at,
                    ErrorMessage: externalResult.error_message
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Payment processing failed for order \{OrderId\}", request.OrderId);
                
                return new PaymentResult(
                    TransactionId: null,
                    Status: PaymentStatus.Failed,
                    ProcessedAt: DateTime.UtcNow,
                    ErrorMessage: "支払い処理中にエラーが発生しました。"
                );
            }
        }
        
        private PaymentStatus MapPaymentStatus(string externalStatus)
        {
            return externalStatus?.ToLower() switch
            {
                "success" => PaymentStatus.Completed,
                "failed" => PaymentStatus.Failed,
                "pending" => PaymentStatus.Pending,
                _ => PaymentStatus.Failed
            };
        }
    }
    
    // ドメインのペイメントサービス（汚染されていない）
    public interface IPaymentService
    {
        Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request);
        Task<RefundResult> ProcessRefundAsync(RefundRequest request);
    }
    
    public record PaymentRequest(
        OrderId OrderId,
        Money Amount,
        CreditCard CreditCard
    );
    
    public record PaymentResult(
        TransactionId TransactionId,
        PaymentStatus Status,
        DateTime ProcessedAt,
        string ErrorMessage
    );
}
\`\`\`

## 実習課題

### 課題1: コンテキストマップの作成

オンライン学習プラットフォームのコンテキストマップを作成してください：

想定される境界づけられたコンテキスト：
- Course Management（コース管理）
- Student Management（学生管理）
- Learning Progress（学習進捗）
- Content Delivery（コンテンツ配信）
- Payment（支払い）
- Analytics（分析）

\`\`\`
// ここにコンテキストマップを図で描いてください
// 各コンテキストの責務と関係性を明確にしてください
\`\`\`

### 課題2: 境界づけられたコンテキストの実装

Course Management コンテキストを実装してください：

\`\`\`csharp
namespace OnlineLearning.CourseManagement
{
    public class Course : AggregateRoot<CourseId>
    {
        // TODO: コース管理の観点での Course を実装
        // - コース作成・編集・公開
        // - インストラクター管理
        // - カリキュラム構成
    }
    
    public class Instructor : AggregateRoot<InstructorId>
    {
        // TODO: インストラクターの実装
    }
    
    public class Curriculum : AggregateRoot<CurriculumId>
    {
        // TODO: カリキュラムの実装
    }
}
\`\`\`

### 課題3: アンチ汚職レイヤーの実装

外部の動画配信サービスとの統合を実装してください：

\`\`\`csharp
// 外部動画配信サービスのAPI（制御できない）
public class ExternalVideoService
{
    public async Task<UploadResponse> UploadVideoAsync(byte[] videoData, VideoMetadata metadata)
    {
        // 外部サービスの実装
    }
}

public class UploadResponse
{
    public string video_id { get; set; }
    public string streaming_url { get; set; }
    public string status { get; set; }
    public VideoQualityInfo[] available_qualities { get; set; }
}

// TODO: アンチ汚職レイヤーを実装
public class VideoContentAdapter : IVideoContentService
{
    // ドメインの IVideoContentService を実装し、
    // 外部サービスとの差異を吸収してください
}
\`\`\`

## まとめ

境界づけられたコンテキストは、DDDの戦略的設計の核心です：

### 主な利点

1. **複雑性の管理**: 大きなドメインを理解しやすい単位に分割
2. **チーム自律性**: 各チームが独立してコンテキストを発展させられる
3. **技術的多様性**: コンテキストごとに最適な技術選択が可能
4. **進化の柔軟性**: 一つのコンテキストの変更が他に影響しにくい

### 設計時の注意点

1. **境界の決定**: ビジネス能力と言語の統一を基準に境界を決める
2. **統合戦略**: コンテキスト間の統合パターンを慎重に選択
3. **データ整合性**: 最終的整合性を受け入れる設計
4. **組織構造**: コンウェイの法則を考慮したチーム構成

### 次のステップ

- CQRS（Command Query Responsibility Segregation）との組み合わせ
- イベントストーミングによるコンテキスト境界の発見
- マイクロサービスアーキテクチャとの関係
- 分散システムでの整合性管理

境界づけられたコンテキストを適切に設計することで、複雑なシステムを管理しやすい形に分割し、長期的な保守性と発展性を確保できます。
`,
  duration: 130,
  order: 6,
  codeExamples: [
    {
      id: 'sales-context-microservice',
      title: 'Sales Context - 完全なマイクロサービス実装',
      code: `using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using MediatR;

// === Sales Bounded Context - 完全な実装例 ===

namespace ECommerce.Sales
{
    // Sales Context での顧客（販売の観点）
    public class Customer : AggregateRoot<CustomerId>
    {
        public string Name { get; private set; }
        public EmailAddress Email { get; private set; }
        public CustomerType Type { get; private set; }
        public Money TotalPurchaseAmount { get; private set; }
        public Address BillingAddress { get; private set; }
        public DateTime RegistrationDate { get; private set; }
        public CustomerPreferences Preferences { get; private set; }
        
        private readonly List<Order> _orders = new();
        public IReadOnlyList<Order> Orders => _orders.AsReadOnly();
        
        // ビジネスロジック
        public bool IsEligibleForDiscount => Type == CustomerType.VIP || TotalPurchaseAmount.Amount >= 500000;
        public decimal LoyaltyDiscountPercentage => Type switch
        {
            CustomerType.VIP => 0.15m,
            CustomerType.Premium => 0.10m,
            CustomerType.Regular => TotalPurchaseAmount.Amount >= 100000 ? 0.05m : 0m,
            _ => 0m
        };
        
        private Customer() { } // for ORM
        
        public static Customer Register(string name, EmailAddress email, Address billingAddress)
        {
            var customer = new Customer
            {
                Id = CustomerId.NewId(),
                Name = name ?? throw new ArgumentNullException(nameof(name)),
                Email = email ?? throw new ArgumentNullException(nameof(email)),
                BillingAddress = billingAddress ?? throw new ArgumentNullException(nameof(billingAddress)),
                Type = CustomerType.Regular,
                TotalPurchaseAmount = Money.Zero,
                RegistrationDate = DateTime.UtcNow,
                Preferences = CustomerPreferences.Default()
            };
            
            customer.AddDomainEvent(new CustomerRegistered(customer.Id, customer.Name, customer.Email));
            return customer;
        }
        
        public Order PlaceOrder(IEnumerable<OrderItem> items, Address shippingAddress, 
                              IDiscountCalculator discountCalculator)
        {
            if (!items.Any())
                throw new DomainException("注文には少なくとも1つの商品が必要です。");
            
            var order = Order.Create(Id, items, shippingAddress);
            
            // 割引の適用
            if (IsEligibleForDiscount)
            {
                var discount = discountCalculator.Calculate(order, this);
                order.ApplyDiscount(discount);
            }
            
            _orders.Add(order);
            
            // 購入金額の更新
            var previousAmount = TotalPurchaseAmount;
            TotalPurchaseAmount = TotalPurchaseAmount.Add(order.TotalAmount);
            
            // VIPステータスの判定
            CheckAndPromoteToVip(previousAmount);
            
            AddDomainEvent(new OrderPlaced(order.Id, Id, order.TotalAmount));
            
            return order;
        }
        
        private void CheckAndPromoteToVip(Money previousAmount)
        {
            const decimal vipThreshold = 1000000m; // 100万円
            
            if (Type != CustomerType.VIP && 
                previousAmount.Amount < vipThreshold && 
                TotalPurchaseAmount.Amount >= vipThreshold)
            {
                Type = CustomerType.VIP;
                AddDomainEvent(new CustomerPromotedToVip(Id, Name, TotalPurchaseAmount));
            }
        }
        
        public void UpdatePreferences(CustomerPreferences newPreferences)
        {
            Preferences = newPreferences ?? throw new ArgumentNullException(nameof(newPreferences));
            AddDomainEvent(new CustomerPreferencesUpdated(Id, newPreferences));
        }
    }
    
    // 注文集約（Sales Context での視点）
    public class Order : AggregateRoot<OrderId>
    {
        public CustomerId CustomerId { get; private set; }
        public OrderNumber OrderNumber { get; private set; }
        public OrderStatus Status { get; private set; }
        public Money SubtotalAmount { get; private set; }
        public Money DiscountAmount { get; private set; }
        public Money TaxAmount { get; private set; }
        public Money TotalAmount { get; private set; }
        public Address ShippingAddress { get; private set; }
        public DateTime OrderDate { get; private set; }
        public DateTime? ConfirmationDate { get; private set; }
        public PaymentMethod PaymentMethod { get; private set; }
        
        private readonly List<OrderItem> _items = new();
        public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();
        
        // ビジネスルール
        public bool CanBeModified => Status == OrderStatus.Draft;
        public bool CanBeCancelled => Status == OrderStatus.Draft || Status == OrderStatus.Confirmed;
        public bool RequiresPayment => Status == OrderStatus.Confirmed && PaymentMethod.RequiresProcessing;
        
        private Order() { } // for ORM
        
        public static Order Create(CustomerId customerId, IEnumerable<OrderItem> items, Address shippingAddress)
        {
            var order = new Order
            {
                Id = OrderId.NewId(),
                CustomerId = customerId,
                OrderNumber = OrderNumber.Generate(),
                ShippingAddress = shippingAddress,
                OrderDate = DateTime.UtcNow,
                Status = OrderStatus.Draft
            };
            
            foreach (var item in items)
            {
                order._items.Add(item);
            }
            
            order.CalculateAmounts();
            order.AddDomainEvent(new OrderCreated(order.Id, customerId, order.TotalAmount));
            
            return order;
        }
        
        public void ApplyDiscount(DiscountAmount discount)
        {
            if (!CanBeModified)
                throw new DomainException("確定済みの注文は変更できません。");
            
            DiscountAmount = discount.Amount;
            CalculateAmounts();
            
            AddDomainEvent(new DiscountApplied(Id, discount));
        }
        
        public void Confirm(PaymentMethod paymentMethod)
        {
            if (Status != OrderStatus.Draft)
                throw new DomainException("ドラフト状態の注文のみ確定できます。");
            
            if (!_items.Any())
                throw new DomainException("商品が登録されていない注文は確定できません。");
            
            Status = OrderStatus.Confirmed;
            ConfirmationDate = DateTime.UtcNow;
            PaymentMethod = paymentMethod;
            
            AddDomainEvent(new OrderConfirmed(Id, CustomerId, ConfirmationDate.Value, TotalAmount));
        }
        
        private void CalculateAmounts()
        {
            SubtotalAmount = _items.Aggregate(Money.Zero, (sum, item) => sum.Add(item.Subtotal));
            TaxAmount = SubtotalAmount.Multiply(0.10m); // 消費税10%
            TotalAmount = SubtotalAmount.Add(TaxAmount).Subtract(DiscountAmount);
        }
    }
    
    // Sales Context 専用のサービス
    public interface IDiscountCalculator
    {
        DiscountAmount Calculate(Order order, Customer customer);
    }
    
    public class SalesDiscountCalculator : IDiscountCalculator
    {
        public DiscountAmount Calculate(Order order, Customer customer)
        {
            var discountRate = customer.LoyaltyDiscountPercentage;
            var discountAmount = order.SubtotalAmount.Multiply(discountRate);
            
            return new DiscountAmount(discountAmount.Amount, $"{discountRate:P0} 顧客割引");
        }
    }
    
    // Sales Context のリポジトリ
    public interface ICustomerRepository
    {
        Task<Customer> GetByIdAsync(CustomerId customerId);
        Task<Customer> GetByEmailAsync(EmailAddress email);
        Task<IEnumerable<Customer>> GetVipCustomersAsync();
        Task<Customer> SaveAsync(Customer customer);
        Task<CustomerSalesStatistics> GetSalesStatisticsAsync(CustomerId customerId);
    }
    
    public class CustomerRepository : ICustomerRepository
    {
        private readonly SalesDbContext _context;
        private readonly IDomainEventDispatcher _eventDispatcher;
        private readonly ILogger<CustomerRepository> _logger;
        
        public CustomerRepository(SalesDbContext context, IDomainEventDispatcher eventDispatcher, 
                                ILogger<CustomerRepository> logger)
        {
            _context = context;
            _eventDispatcher = eventDispatcher;
            _logger = logger;
        }
        
        public async Task<Customer> GetByIdAsync(CustomerId customerId)
        {
            return await _context.Customers
                .Include(c => c.Orders)
                .ThenInclude(o => o.Items)
                .FirstOrDefaultAsync(c => c.Id == customerId);
        }
        
        public async Task<Customer> GetByEmailAsync(EmailAddress email)
        {
            return await _context.Customers
                .FirstOrDefaultAsync(c => c.Email == email);
        }
        
        public async Task<IEnumerable<Customer>> GetVipCustomersAsync()
        {
            return await _context.Customers
                .Where(c => c.Type == CustomerType.VIP)
                .OrderByDescending(c => c.TotalPurchaseAmount.Amount)
                .ToListAsync();
        }
        
        public async Task<Customer> SaveAsync(Customer customer)
        {
            var entry = _context.Customers.Update(customer);
            await _context.SaveChangesAsync();
            
            // ドメインイベントの発行
            await _eventDispatcher.DispatchAsync(customer.DomainEvents);
            customer.ClearDomainEvents();
            
            return entry.Entity;
        }
        
        public async Task<CustomerSalesStatistics> GetSalesStatisticsAsync(CustomerId customerId)
        {
            var customer = await GetByIdAsync(customerId);
            if (customer == null) return null;
            
            return new CustomerSalesStatistics
            {
                CustomerId = customerId,
                TotalOrderCount = customer.Orders.Count,
                TotalPurchaseAmount = customer.TotalPurchaseAmount,
                AverageOrderValue = customer.Orders.Any() 
                    ? new Money(customer.Orders.Average(o => o.TotalAmount.Amount))
                    : Money.Zero,
                LastOrderDate = customer.Orders.Any() 
                    ? customer.Orders.Max(o => o.OrderDate) 
                    : (DateTime?)null
            };
        }
    }
    
    // Sales Context の Web API Controller
    [ApiController]
    [Route("api/sales/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly ICustomerRepository _customerRepository;
        private readonly IMediator _mediator;
        private readonly ILogger<CustomersController> _logger;
        
        public CustomersController(ICustomerRepository customerRepository, IMediator mediator, 
                                 ILogger<CustomersController> logger)
        {
            _customerRepository = customerRepository;
            _mediator = mediator;
            _logger = logger;
        }
        
        [HttpPost]
        public async Task<ActionResult<CustomerDto>> RegisterCustomer([FromBody] RegisterCustomerRequest request)
        {
            try
            {
                var command = new RegisterCustomerCommand(request.Name, request.Email, request.BillingAddress);
                var customerId = await _mediator.Send(command);
                
                var customer = await _customerRepository.GetByIdAsync(customerId);
                return Ok(CustomerDto.FromDomain(customer));
            }
            catch (DomainException ex)
            {
                _logger.LogWarning(ex, "Domain validation failed for customer registration");
                return BadRequest(ex.Message);
            }
        }
        
        [HttpGet("{customerId}")]
        public async Task<ActionResult<CustomerDto>> GetCustomer(Guid customerId)
        {
            var customer = await _customerRepository.GetByIdAsync(new CustomerId(customerId));
            if (customer == null)
                return NotFound();
            
            return Ok(CustomerDto.FromDomain(customer));
        }
        
        [HttpGet("{customerId}/statistics")]
        public async Task<ActionResult<CustomerSalesStatistics>> GetCustomerStatistics(Guid customerId)
        {
            var stats = await _customerRepository.GetSalesStatisticsAsync(new CustomerId(customerId));
            if (stats == null)
                return NotFound();
            
            return Ok(stats);
        }
        
        [HttpPost("{customerId}/orders")]
        public async Task<ActionResult<OrderDto>> PlaceOrder(Guid customerId, [FromBody] PlaceOrderRequest request)
        {
            try
            {
                var command = new PlaceOrderCommand(new CustomerId(customerId), request.Items, request.ShippingAddress);
                var orderId = await _mediator.Send(command);
                
                var customer = await _customerRepository.GetByIdAsync(new CustomerId(customerId));
                var order = customer.Orders.First(o => o.Id.Value == orderId);
                
                return Ok(OrderDto.FromDomain(order));
            }
            catch (DomainException ex)
            {
                _logger.LogWarning(ex, "Failed to place order for customer {CustomerId}", customerId);
                return BadRequest(ex.Message);
            }
        }
    }
    
    // DTOs for API
    public class CustomerDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string CustomerType { get; set; }
        public decimal TotalPurchaseAmount { get; set; }
        public int OrderCount { get; set; }
        
        public static CustomerDto FromDomain(Customer customer)
        {
            return new CustomerDto
            {
                Id = customer.Id.Value,
                Name = customer.Name,
                Email = customer.Email.Value,
                CustomerType = customer.Type.ToString(),
                TotalPurchaseAmount = customer.TotalPurchaseAmount.Amount,
                OrderCount = customer.Orders.Count
            };
        }
    }
}`,
      language: 'csharp'
    },
    {
      id: 'catalog-context-product',
      title: 'Catalog Context - カタログの観点での商品',
      code: `namespace ECommerce.Catalog
{
    public class Product : AggregateRoot<ProductId>
    {
        public string Name { get; private set; }
        public string Description { get; private set; }
        public ProductCategory Category { get; private set; }
        public Brand Brand { get; private set; }
        public Money Price { get; private set; }
        public ProductStatus Status { get; private set; }
        
        private readonly List<ProductReview> _reviews = new();
        public IReadOnlyList<ProductReview> Reviews => _reviews.AsReadOnly();
        
        public double AverageRating => _reviews.Any() ? _reviews.Average(r => r.Rating) : 0.0;
        
        public void UpdatePrice(Money newPrice, string reason)
        {
            var oldPrice = Price;
            Price = newPrice;
            
            AddDomainEvent(new ProductPriceChanged(Id, oldPrice, newPrice, reason));
        }
        
        public void AddReview(CustomerId customerId, int rating, string comment)
        {
            if (rating < 1 || rating > 5)
                throw new DomainException("評価は1から5の間で入力してください。");
            
            var review = new ProductReview(customerId, rating, comment);
            _reviews.Add(review);
            
            AddDomainEvent(new ProductReviewAdded(Id, customerId, rating));
        }
    }
}`,
      language: 'csharp'
    },
    {
      id: 'inventory-context-product',
      title: 'Inventory Context - 在庫の観点での商品',
      code: `namespace ECommerce.Inventory
{
    public class Product : AggregateRoot<ProductId>
    {
        public string SKU { get; private set; }
        public string Name { get; private set; }
        public ProductDimensions Dimensions { get; private set; }
        public Weight Weight { get; private set; }
        
        private readonly List<StockLevel> _stockLevels = new();
        public IReadOnlyList<StockLevel> StockLevels => _stockLevels.AsReadOnly();
        
        public int TotalAvailableQuantity => 
            _stockLevels.Where(s => s.Status == StockStatus.Available)
                       .Sum(s => s.Quantity);
        
        public void AllocateStock(int quantity, WarehouseId warehouseId, OrderId orderId)
        {
            var availableStock = _stockLevels
                .Where(s => s.WarehouseId == warehouseId && s.Status == StockStatus.Available)
                .Sum(s => s.Quantity);
            
            if (availableStock < quantity)
            {
                AddDomainEvent(new InsufficientStockDetected(Id, quantity, availableStock));
                throw new DomainException($"在庫不足: 必要{quantity}、利用可能{availableStock}");
            }
            
            AddDomainEvent(new StockAllocated(Id, warehouseId, orderId, quantity));
        }
    }
}`,
      language: 'csharp'
    },
    {
      id: 'shared-kernel-value-objects',
      title: 'Shared Kernel - 共通の値オブジェクト',
      code: `namespace ECommerce.SharedKernel
{
    public class Money : ValueObject
    {
        public decimal Amount { get; private set; }
        public string Currency { get; private set; }
        
        public Money(decimal amount, string currency = "JPY")
        {
            if (amount < 0)
                throw new ArgumentException("金額は0以上である必要があります。");
            
            Amount = amount;
            Currency = currency ?? throw new ArgumentNullException(nameof(currency));
        }
        
        public static readonly Money Zero = new Money(0);
        
        public Money Add(Money other)
        {
            if (Currency != other.Currency)
                throw new InvalidOperationException("異なる通貨の金額は加算できません。");
            
            return new Money(Amount + other.Amount, Currency);
        }
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Amount;
            yield return Currency;
        }
    }
}`,
      language: 'csharp'
    },
    {
      id: 'context-integration-event-driven',
      title: 'コンテキスト間統合とイベント駆動アーキテクチャ',
      code: `using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using MediatR;
using System.Net.Http;
using System.Text.Json;

// === コンテキスト間統合の実装例 ===

// 1. イベント駆動による疎結合な統合
namespace ECommerce.Integration
{
    // コンテキスト間で共有されるイベント
    public class OrderPlacedIntegrationEvent : INotification
    {
        public Guid OrderId { get; set; }
        public Guid CustomerId { get; set; }
        public decimal TotalAmount { get; set; }
        public List<OrderItemData> Items { get; set; }
        public DateTime OrderDate { get; set; }
        public string CorrelationId { get; set; }
        
        public OrderPlacedIntegrationEvent(Guid orderId, Guid customerId, decimal totalAmount, 
                                         List<OrderItemData> items, DateTime orderDate, string correlationId)
        {
            OrderId = orderId;
            CustomerId = customerId;
            TotalAmount = totalAmount;
            Items = items;
            OrderDate = orderDate;
            CorrelationId = correlationId;
        }
    }
    
    // Sales Context での統合イベント発行
    public class OrderPlacedDomainEventHandler : INotificationHandler<OrderPlaced>
    {
        private readonly IMediator _mediator;
        private readonly ILogger<OrderPlacedDomainEventHandler> _logger;
        
        public OrderPlacedDomainEventHandler(IMediator mediator, ILogger<OrderPlacedDomainEventHandler> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }
        
        public async Task Handle(OrderPlaced notification, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Converting domain event to integration event: {OrderId}", notification.OrderId);
            
            // ドメインイベントを統合イベントに変換
            var integrationEvent = new OrderPlacedIntegrationEvent(
                notification.OrderId.Value,
                notification.CustomerId.Value,
                notification.TotalAmount.Amount,
                notification.Items?.Select(i => new OrderItemData 
                { 
                    ProductId = i.ProductId, 
                    Quantity = i.Quantity 
                }).ToList() ?? new List<OrderItemData>(),
                DateTime.UtcNow,
                Guid.NewGuid().ToString()
            );
            
            // 他のコンテキストに統合イベントを発行
            await _mediator.Publish(integrationEvent, cancellationToken);
        }
    }
    
    // Inventory Context での統合イベント処理
    public class OrderPlacedInventoryHandler : INotificationHandler<OrderPlacedIntegrationEvent>
    {
        private readonly IInventoryService _inventoryService;
        private readonly ILogger<OrderPlacedInventoryHandler> _logger;
        
        public OrderPlacedInventoryHandler(IInventoryService inventoryService, 
                                         ILogger<OrderPlacedInventoryHandler> logger)
        {
            _inventoryService = inventoryService;
            _logger = logger;
        }
        
        public async Task Handle(OrderPlacedIntegrationEvent notification, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Processing order for inventory reservation: {OrderId}", notification.OrderId);
            
            try
            {
                foreach (var item in notification.Items)
                {
                    await _inventoryService.ReserveStockAsync(
                        item.ProductId, 
                        item.Quantity, 
                        notification.OrderId, 
                        notification.CorrelationId);
                }
                
                _logger.LogInformation("Inventory reserved successfully for order: {OrderId}", notification.OrderId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to reserve inventory for order: {OrderId}", notification.OrderId);
                
                // 補償処理イベントを発行
                var compensationEvent = new InventoryReservationFailed(
                    notification.OrderId,
                    notification.CustomerId,
                    ex.Message,
                    notification.CorrelationId
                );
                
                await _mediator.Publish(compensationEvent, cancellationToken);
            }
        }
    }
    
    // Shipping Context での統合イベント処理
    public class OrderPlacedShippingHandler : INotificationHandler<OrderPlacedIntegrationEvent>
    {
        private readonly IShippingService _shippingService;
        private readonly ILogger<OrderPlacedShippingHandler> _logger;
        
        public OrderPlacedShippingHandler(IShippingService shippingService, 
                                        ILogger<OrderPlacedShippingHandler> logger)
        {
            _shippingService = shippingService;
            _logger = logger;
        }
        
        public async Task Handle(OrderPlacedIntegrationEvent notification, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Preparing shipment for order: {OrderId}", notification.OrderId);
            
            // 配送準備処理
            await _shippingService.PrepareShipmentAsync(
                notification.OrderId,
                notification.Items,
                notification.CorrelationId);
        }
    }
}

// 2. HTTP ベースのコンテキスト間通信
namespace ECommerce.Sales.Integration
{
    // Catalog Context との通信インターフェース
    public interface ICatalogService
    {
        Task<ProductInfo> GetProductAsync(Guid productId);
        Task<IEnumerable<ProductInfo>> GetProductsAsync(IEnumerable<Guid> productIds);
        Task<bool> IsProductAvailableAsync(Guid productId);
        Task<ProductPricing> GetProductPricingAsync(Guid productId);
    }
    
    // HTTP クライアントによる実装
    public class HttpCatalogService : ICatalogService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<HttpCatalogService> _logger;
        private readonly CatalogServiceOptions _options;
        
        public HttpCatalogService(HttpClient httpClient, 
                                IOptions<CatalogServiceOptions> options,
                                ILogger<HttpCatalogService> logger)
        {
            _httpClient = httpClient;
            _options = options.Value;
            _logger = logger;
        }
        
        public async Task<ProductInfo> GetProductAsync(Guid productId)
        {
            try
            {
                _logger.LogDebug("Fetching product from catalog service: {ProductId}", productId);
                
                var response = await _httpClient.GetAsync($"api/catalog/products/{productId}");
                response.EnsureSuccessStatusCode();
                
                var content = await response.Content.ReadAsStringAsync();
                var productDto = JsonSerializer.Deserialize<ProductDto>(content, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                
                return new ProductInfo
                {
                    ProductId = productDto.Id,
                    Name = productDto.Name,
                    CurrentPrice = new Money(productDto.Price),
                    IsActive = productDto.Status == "Active",
                    Description = productDto.Description,
                    ImageUrl = productDto.ImageUrl
                };
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Failed to fetch product from catalog service: {ProductId}", productId);
                throw new ExternalServiceException($"カタログサービスから商品情報を取得できませんでした: {productId}", ex);
            }
        }
        
        public async Task<IEnumerable<ProductInfo>> GetProductsAsync(IEnumerable<Guid> productIds)
        {
            var products = new List<ProductInfo>();
            
            // 並列処理で複数の商品情報を取得
            var tasks = productIds.Select(GetProductAsync);
            var results = await Task.WhenAll(tasks);
            
            return results.Where(p => p != null);
        }
        
        public async Task<bool> IsProductAvailableAsync(Guid productId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"api/catalog/products/{productId}/availability");
                return response.IsSuccessStatusCode;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogWarning(ex, "Failed to check product availability: {ProductId}", productId);
                return false; // デフォルトは利用不可
            }
        }
        
        public async Task<ProductPricing> GetProductPricingAsync(Guid productId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"api/catalog/products/{productId}/pricing");
                response.EnsureSuccessStatusCode();
                
                var content = await response.Content.ReadAsStringAsync();
                var pricingDto = JsonSerializer.Deserialize<ProductPricingDto>(content, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                
                return new ProductPricing
                {
                    ProductId = productId,
                    BasePrice = new Money(pricingDto.BasePrice),
                    DiscountedPrice = pricingDto.DiscountedPrice.HasValue 
                        ? new Money(pricingDto.DiscountedPrice.Value) 
                        : null,
                    EffectiveFrom = pricingDto.EffectiveFrom,
                    EffectiveTo = pricingDto.EffectiveTo
                };
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Failed to fetch product pricing: {ProductId}", productId);
                throw new ExternalServiceException($"商品価格情報を取得できませんでした: {productId}", ex);
            }
        }
    }
    
    // Circuit Breaker パターンを実装したカタログサービス
    public class ResilientCatalogService : ICatalogService
    {
        private readonly HttpCatalogService _catalogService;
        private readonly ICircuitBreaker _circuitBreaker;
        private readonly IMemoryCache _cache;
        private readonly ILogger<ResilientCatalogService> _logger;
        
        public ResilientCatalogService(HttpCatalogService catalogService,
                                     ICircuitBreaker circuitBreaker,
                                     IMemoryCache cache,
                                     ILogger<ResilientCatalogService> logger)
        {
            _catalogService = catalogService;
            _circuitBreaker = circuitBreaker;
            _cache = cache;
            _logger = logger;
        }
        
        public async Task<ProductInfo> GetProductAsync(Guid productId)
        {
            var cacheKey = $"product_{productId}";
            
            // キャッシュから取得を試行
            if (_cache.TryGetValue(cacheKey, out ProductInfo cachedProduct))
            {
                _logger.LogDebug("Product found in cache: {ProductId}", productId);
                return cachedProduct;
            }
            
            try
            {
                // Circuit Breaker を通してサービス呼び出し
                var product = await _circuitBreaker.ExecuteAsync(async () =>
                {
                    return await _catalogService.GetProductAsync(productId);
                });
                
                // 成功した場合はキャッシュに保存
                _cache.Set(cacheKey, product, TimeSpan.FromMinutes(5));
                
                return product;
            }
            catch (CircuitBreakerOpenException)
            {
                _logger.LogWarning("Circuit breaker is open for catalog service. Using fallback for: {ProductId}", productId);
                
                // フォールバック処理: 基本的な商品情報を返す
                return CreateFallbackProductInfo(productId);
            }
        }
        
        private ProductInfo CreateFallbackProductInfo(Guid productId)
        {
            return new ProductInfo
            {
                ProductId = productId,
                Name = "商品情報取得中...",
                CurrentPrice = Money.Zero,
                IsActive = false,
                Description = "商品情報を取得できませんでした。",
                ImageUrl = "/images/placeholder.jpg"
            };
        }
        
        public async Task<IEnumerable<ProductInfo>> GetProductsAsync(IEnumerable<Guid> productIds)
        {
            var tasks = productIds.Select(GetProductAsync);
            return await Task.WhenAll(tasks);
        }
        
        public async Task<bool> IsProductAvailableAsync(Guid productId)
        {
            try
            {
                return await _circuitBreaker.ExecuteAsync(async () =>
                {
                    return await _catalogService.IsProductAvailableAsync(productId);
                });
            }
            catch (CircuitBreakerOpenException)
            {
                _logger.LogWarning("Circuit breaker is open. Assuming product is unavailable: {ProductId}", productId);
                return false;
            }
        }
        
        public async Task<ProductPricing> GetProductPricingAsync(Guid productId)
        {
            try
            {
                return await _circuitBreaker.ExecuteAsync(async () =>
                {
                    return await _catalogService.GetProductPricingAsync(productId);
                });
            }
            catch (CircuitBreakerOpenException)
            {
                _logger.LogWarning("Circuit breaker is open. Using fallback pricing for: {ProductId}", productId);
                
                return new ProductPricing
                {
                    ProductId = productId,
                    BasePrice = Money.Zero,
                    EffectiveFrom = DateTime.UtcNow,
                    EffectiveTo = DateTime.UtcNow.AddDays(1)
                };
            }
        }
    }
    
    // サービス登録用の拡張メソッド
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddCatalogIntegration(this IServiceCollection services, 
                                                             IConfiguration configuration)
        {
            // HTTP クライアントの設定
            services.AddHttpClient<HttpCatalogService>(client =>
            {
                client.BaseAddress = new Uri(configuration["Services:Catalog:BaseUrl"]);
                client.Timeout = TimeSpan.FromSeconds(30);
            });
            
            // Circuit Breaker の設定
            services.AddSingleton<ICircuitBreaker>(provider =>
                new CircuitBreaker(
                    failureThreshold: 5,
                    recoveryTimeout: TimeSpan.FromMinutes(1),
                    provider.GetService<ILogger<CircuitBreaker>>()
                ));
            
            // メモリキャッシュ
            services.AddMemoryCache();
            
            // サービスの登録
            services.AddScoped<ICatalogService, ResilientCatalogService>();
            
            // 設定の登録
            services.Configure<CatalogServiceOptions>(configuration.GetSection("Services:Catalog"));
            
            return services;
        }
    }
    
    // 設定クラス
    public class CatalogServiceOptions
    {
        public string BaseUrl { get; set; }
        public int TimeoutSeconds { get; set; } = 30;
        public int RetryCount { get; set; } = 3;
        public int CacheDurationMinutes { get; set; } = 5;
    }
    
    // 例外クラス
    public class ExternalServiceException : Exception
    {
        public ExternalServiceException(string message) : base(message) { }
        public ExternalServiceException(string message, Exception innerException) : base(message, innerException) { }
    }
    
    public class CircuitBreakerOpenException : Exception
    {
        public CircuitBreakerOpenException(string message) : base(message) { }
    }
}

// 3. データ同期とイベント配信のメッセージング
namespace ECommerce.Messaging
{
    // メッセージバス インターフェース
    public interface IMessageBus
    {
        Task PublishAsync<T>(T message, string topic = null) where T : class;
        Task SubscribeAsync<T>(Func<T, Task> handler, string topic = null) where T : class;
        Task SubscribeAsync<T>(IMessageHandler<T> handler, string topic = null) where T : class;
    }
    
    // メッセージハンドラー インターフェース
    public interface IMessageHandler<in T> where T : class
    {
        Task HandleAsync(T message);
    }
    
    // RabbitMQ を使用した実装例
    public class RabbitMQMessageBus : IMessageBus, IDisposable
    {
        private readonly IConnection _connection;
        private readonly IModel _channel;
        private readonly ILogger<RabbitMQMessageBus> _logger;
        private readonly JsonSerializerOptions _jsonOptions;
        
        public RabbitMQMessageBus(IConnectionFactory connectionFactory, ILogger<RabbitMQMessageBus> logger)
        {
            _connection = connectionFactory.CreateConnection();
            _channel = _connection.CreateModel();
            _logger = logger;
            
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
        }
        
        public async Task PublishAsync<T>(T message, string topic = null) where T : class
        {
            var routingKey = topic ?? typeof(T).Name;
            var exchangeName = "ddd_events";
            
            // Exchange の宣言
            _channel.ExchangeDeclare(exchangeName, ExchangeType.Topic, durable: true);
            
            // メッセージのシリアライズ
            var messageBody = JsonSerializer.SerializeToUtf8Bytes(message, _jsonOptions);
            
            // メッセージプロパティの設定
            var properties = _channel.CreateBasicProperties();
            properties.Persistent = true;
            properties.MessageId = Guid.NewGuid().ToString();
            properties.Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds());
            properties.Type = typeof(T).Name;
            
            // メッセージの発行
            _channel.BasicPublish(
                exchange: exchangeName,
                routingKey: routingKey,
                basicProperties: properties,
                body: messageBody
            );
            
            _logger.LogInformation("Published message: {MessageType} to {RoutingKey}", typeof(T).Name, routingKey);
            
            await Task.CompletedTask;
        }
        
        public async Task SubscribeAsync<T>(Func<T, Task> handler, string topic = null) where T : class
        {
            var handlerWrapper = new FuncMessageHandler<T>(handler);
            await SubscribeAsync(handlerWrapper, topic);
        }
        
        public async Task SubscribeAsync<T>(IMessageHandler<T> handler, string topic = null) where T : class
        {
            var routingKey = topic ?? typeof(T).Name;
            var exchangeName = "ddd_events";
            var queueName = $"{typeof(T).Name}_queue";
            
            // Exchange とキューの宣言
            _channel.ExchangeDeclare(exchangeName, ExchangeType.Topic, durable: true);
            _channel.QueueDeclare(queueName, durable: true, exclusive: false, autoDelete: false);
            _channel.QueueBind(queueName, exchangeName, routingKey);
            
            // コンシューマーの設定
            var consumer = new EventingBasicConsumer(_channel);
            consumer.Received += async (model, ea) =>
            {
                try
                {
                    var messageBody = ea.Body.ToArray();
                    var message = JsonSerializer.Deserialize<T>(messageBody, _jsonOptions);
                    
                    await handler.HandleAsync(message);
                    
                    // メッセージの確認応答
                    _channel.BasicAck(ea.DeliveryTag, false);
                    
                    _logger.LogDebug("Processed message: {MessageType}", typeof(T).Name);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to process message: {MessageType}", typeof(T).Name);
                    
                    // エラー時は拒否してリキューしない
                    _channel.BasicNack(ea.DeliveryTag, false, false);
                }
            };
            
            _channel.BasicConsume(queueName, false, consumer);
            
            _logger.LogInformation("Started consuming messages: {MessageType} from {QueueName}", typeof(T).Name, queueName);
            
            await Task.CompletedTask;
        }
        
        public void Dispose()
        {
            _channel?.Dispose();
            _connection?.Dispose();
        }
    }
    
    // Funcのラッパークラス
    internal class FuncMessageHandler<T> : IMessageHandler<T> where T : class
    {
        private readonly Func<T, Task> _handler;
        
        public FuncMessageHandler(Func<T, Task> handler)
        {
            _handler = handler;
        }
        
        public Task HandleAsync(T message)
        {
            return _handler(message);
        }
    }
}`,
      language: 'csharp'
    },
    {
      id: 'anti-corruption-layer',
      title: 'Anti-Corruption Layer - アンチ汚職レイヤー',
      code: `public class PaymentGatewayAdapter : IPaymentService
{
    private readonly IExternalPaymentGateway _externalGateway;
    
    public async Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request)
    {
        // ドメインモデルから外部システムのモデルに変換
        var externalRequest = new ExternalPaymentRequest
        {
            card_number = request.CreditCard.Number,
            expiry_month = request.CreditCard.ExpiryMonth.ToString("D2"),
            expiry_year = request.CreditCard.ExpiryYear.ToString(),
            cvv = request.CreditCard.CVV,
            amount_cents = (long)(request.Amount.Amount * 100),
            currency_code = request.Amount.Currency,
            merchant_reference = request.OrderId.Value.ToString()
        };
        
        var externalResult = await _externalGateway.ProcessPaymentAsync(externalRequest);
        
        // 外部システムの結果をドメインモデルに変換
        return new PaymentResult(
            TransactionId: new TransactionId(Guid.Parse(externalResult.transaction_id)),
            Status: MapPaymentStatus(externalResult.status),
            ProcessedAt: externalResult.processed_at,
            ErrorMessage: externalResult.error_message
        );
    }
}`,
      language: 'csharp'
    }
  ],
  exercises: [
    {
      id: 'online-learning-context-map',
      title: 'オンライン学習プラットフォームのコンテキストマップ作成',
      description: 'オンライン学習プラットフォームの境界づけられたコンテキストを特定し、コンテキストマップを作成してください。',
      difficulty: 'intermediate',
      starterCode: `// コンテキストマップの作成を開始してください
// 1. Learning Management Context
// 2. User Management Context  
// 3. Content Management Context
// TODO: これらのコンテキスト間の関係を定義`,
      requirements: [
        'Course Management、Student Management、Learning Progress等のコンテキスト特定',
        '各コンテキストの責務の明確化',
        'コンテキスト間の関係性の定義',
        '統合パターンの選択'
      ]
    },
    {
      id: 'course-management-context',
      title: 'Course Management コンテキストの実装',
      description: 'Course Management境界づけられたコンテキストでのCourse、Instructor、Curriculumを実装してください。',
      difficulty: 'advanced',
      starterCode: `public class Course : AggregateRoot<CourseId>
{
    public string Title { get; private set; }
    public string Description { get; private set; }
    public InstructorId InstructorId { get; private set; }
    
    // TODO: コンストラクタとメソッドを実装
}`,
      requirements: [
        'コース管理の観点でのCourse集約の実装',
        'インストラクター管理機能',
        'カリキュラム構成管理',
        'コンテキスト固有のビジネスルール'
      ]
    },
    {
      id: 'video-service-integration-acl',
      title: '外部動画配信サービス統合のアンチ汚職レイヤー',
      description: '外部の動画配信サービスとの統合でアンチ汚職レイヤーを実装してください。',
      difficulty: 'advanced',
      starterCode: `public interface IVideoProvider
{
    Task<Video> GetVideoAsync(VideoId videoId);
}

public class ExternalVideoServiceAdapter : IVideoProvider
{
    // TODO: 外部サービスとのアダプターを実装
}`,
      requirements: [
        'VideoContentAdapterの実装',
        '外部APIモデルとドメインモデルの変換',
        'エラーハンドリングと例外変換',
        'ドメインの整合性保護'
      ]
    }
  ]
};