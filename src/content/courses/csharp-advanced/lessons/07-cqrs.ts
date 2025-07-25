import type { Lesson } from '../../../../features/learning/types';

export const cqrsLesson: Lesson = {
  id: 'cqrs',
  moduleId: 'ddd-strategic-patterns',
  title: 'CQRS - コマンドとクエリの責任分離',
  description: 'Command Query Responsibility Segregation（CQRS）パターンの設計と実装、読み取りと書き込みモデルの分離による性能とスケーラビリティの向上を詳しく学習します',
  content: `
# CQRS（Command Query Responsibility Segregation）

CQRSは、コマンド（書き込み）とクエリ（読み取り）の責任を分離することで、複雑なドメインロジックと高性能な読み取り処理を両立させるアーキテクチャパターンです。

## CQRSとは何か？

### CQRSの基本概念

**CQRS**は、以下の原則に基づいてシステムを設計するパターンです：

1. **責任の分離**: コマンド（変更）とクエリ（読み取り）を明確に分離
2. **異なるモデル**: 書き込み用と読み取り用で異なるデータモデルを使用
3. **最適化**: それぞれの目的に特化した最適化が可能
4. **スケーラビリティ**: 読み取りと書き込みを独立してスケール

### 従来のCRUDアプローチとの違い

**従来のCRUDアプローチ**:
\`\`\`
[UI] -- [同一モデル] -- [データベース]
\`\`\`

**CQRSアプローチ**:
\`\`\`
[UI] => [コマンド] => [書き込みモデル] => [書き込みDB]
[UI] <= [クエリ] <= [読み取りモデル] <= [読み取りDB]
\`\`\`

## CQRSの利点と課題

### 利点

1. **性能向上**: 読み取り専用モデルの最適化
2. **複雑性の分離**: ビジネスロジックと表示ロジックの分離
3. **独立スケーリング**: 読み取りと書き込みを別々にスケール
4. **セキュリティ**: コマンドとクエリで異なるセキュリティモデル

### 課題

1. **複雑性の増加**: システム全体の複雑性が増す
2. **データ同期**: 書き込みモデルと読み取りモデルの同期
3. **最終的整合性**: 即座にデータが反映されない場合がある
4. **開発コスト**: 実装・保守コストの増加

## 基本的なCQRSの実装

### コマンドとクエリの定義

コマンドは状態を変更し、クエリはデータを返します：

\`\`\`csharp
// コマンド（戻り値なし、または最小限）
public interface ICommand
{
    // マーカーインターフェース
}

public interface ICommandHandler<in TCommand> where TCommand : ICommand
{
    Task HandleAsync(TCommand command, CancellationToken cancellationToken = default);
}

// 戻り値があるコマンド
public interface ICommand<out TResult>
{
    // マーカーインターフェース
}

public interface ICommandHandler<in TCommand, TResult> 
    where TCommand : ICommand<TResult>
{
    Task<TResult> HandleAsync(TCommand command, CancellationToken cancellationToken = default);
}

// クエリ（常に戻り値がある）
public interface IQuery<out TResult>
{
    // マーカーインターフェース
}

public interface IQueryHandler<in TQuery, TResult> 
    where TQuery : IQuery<TResult>
{
    Task<TResult> HandleAsync(TQuery query, CancellationToken cancellationToken = default);
}
\`\`\`

### 実践的なコマンドの実装

注文システムでのコマンド例：

\`\`\`csharp
// 注文作成コマンド
public class CreateOrderCommand : ICommand<OrderId>
{
    public CustomerId CustomerId { get; }
    public Address ShippingAddress { get; }
    public List<OrderItemRequest> Items { get; }
    public PaymentMethod PaymentMethod { get; }
    public string CorrelationId { get; }
    
    public CreateOrderCommand(CustomerId customerId, Address shippingAddress, 
                            List<OrderItemRequest> items, PaymentMethod paymentMethod,
                            string correlationId = null)
    {
        CustomerId = customerId ?? throw new ArgumentNullException(nameof(customerId));
        ShippingAddress = shippingAddress ?? throw new ArgumentNullException(nameof(shippingAddress));
        Items = items ?? throw new ArgumentNullException(nameof(items));
        PaymentMethod = paymentMethod ?? throw new ArgumentNullException(nameof(paymentMethod));
        CorrelationId = correlationId ?? Guid.NewGuid().ToString();
    }
}

public class OrderItemRequest
{
    public ProductId ProductId { get; set; }
    public int Quantity { get; set; }
}

// 注文確定コマンド
public class ConfirmOrderCommand : ICommand
{
    public OrderId OrderId { get; }
    public DateTime RequestedDeliveryDate { get; }
    
    public ConfirmOrderCommand(OrderId orderId, DateTime requestedDeliveryDate)
    {
        OrderId = orderId ?? throw new ArgumentNullException(nameof(orderId));
        RequestedDeliveryDate = requestedDeliveryDate;
    }
}

// 注文キャンセルコマンド
public class CancelOrderCommand : ICommand
{
    public OrderId OrderId { get; }
    public string CancellationReason { get; }
    
    public CancelOrderCommand(OrderId orderId, string cancellationReason)
    {
        OrderId = orderId ?? throw new ArgumentNullException(nameof(orderId));
        CancellationReason = cancellationReason ?? throw new ArgumentNullException(nameof(cancellationReason));
    }
}
\`\`\`

### コマンドハンドラーの実装

\`\`\`csharp
public class CreateOrderCommandHandler : ICommandHandler<CreateOrderCommand, OrderId>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IProductCatalogService _catalogService;
    private readonly IDomainEventDispatcher _eventDispatcher;
    private readonly ILogger<CreateOrderCommandHandler> _logger;
    
    public CreateOrderCommandHandler(
        IOrderRepository orderRepository,
        ICustomerRepository customerRepository,
        IProductCatalogService catalogService,
        IDomainEventDispatcher eventDispatcher,
        ILogger<CreateOrderCommandHandler> logger)
    {
        _orderRepository = orderRepository;
        _customerRepository = customerRepository;
        _catalogService = catalogService;
        _eventDispatcher = eventDispatcher;
        _logger = logger;
    }
    
    public async Task<OrderId> HandleAsync(CreateOrderCommand command, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating order for customer {CustomerId} with correlation {CorrelationId}", 
            command.CustomerId, command.CorrelationId);
        
        // 1. 顧客の存在確認
        var customer = await _customerRepository.GetByIdAsync(command.CustomerId);
        if (customer == null)
        {
            throw new DomainException($"顧客が見つかりません: {command.CustomerId}");
        }
        
        // 2. 商品情報の取得と検証
        var productIds = command.Items.Select(i => i.ProductId).ToList();
        var products = await _catalogService.GetProductsAsync(productIds);
        
        var orderItems = new List<OrderItem>();
        foreach (var itemRequest in command.Items)
        {
            var product = products.FirstOrDefault(p => p.ProductId == itemRequest.ProductId);
            if (product == null || !product.IsActive)
            {
                throw new DomainException($"商品が利用できません: {itemRequest.ProductId}");
            }
            
            var orderItem = new OrderItem(
                product.ProductId,
                product.Name,
                product.CurrentPrice,
                itemRequest.Quantity
            );
            orderItems.Add(orderItem);
        }
        
        // 3. 注文の作成
        var order = Order.Create(
            command.CustomerId,
            orderItems,
            command.ShippingAddress,
            command.PaymentMethod
        );
        
        // 4. 注文の保存
        await _orderRepository.SaveAsync(order);
        
        // 5. ドメインイベントの発行
        await _eventDispatcher.DispatchAsync(order.DomainEvents, cancellationToken);
        order.ClearDomainEvents();
        
        _logger.LogInformation("Order created successfully: {OrderId}", order.Id);
        
        return order.Id;
    }
}

public class ConfirmOrderCommandHandler : ICommandHandler<ConfirmOrderCommand>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IDomainEventDispatcher _eventDispatcher;
    private readonly ILogger<ConfirmOrderCommandHandler> _logger;
    
    public ConfirmOrderCommandHandler(
        IOrderRepository orderRepository,
        IDomainEventDispatcher eventDispatcher,
        ILogger<ConfirmOrderCommandHandler> logger)
    {
        _orderRepository = orderRepository;
        _eventDispatcher = eventDispatcher;
        _logger = logger;
    }
    
    public async Task HandleAsync(ConfirmOrderCommand command, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Confirming order {OrderId}", command.OrderId);
        
        var order = await _orderRepository.GetByIdAsync(command.OrderId);
        if (order == null)
        {
            throw new DomainException($"注文が見つかりません: {command.OrderId}");
        }
        
        order.Confirm(command.RequestedDeliveryDate);
        
        await _orderRepository.SaveAsync(order);
        await _eventDispatcher.DispatchAsync(order.DomainEvents, cancellationToken);
        order.ClearDomainEvents();
        
        _logger.LogInformation("Order confirmed successfully: {OrderId}", command.OrderId);
    }
}
\`\`\`

### クエリとクエリハンドラーの実装

読み取り専用の最適化されたクエリ：

\`\`\`csharp
// 顧客の注文履歴クエリ
public class GetCustomerOrderHistoryQuery : IQuery<CustomerOrderHistoryResult>
{
    public CustomerId CustomerId { get; }
    public int PageNumber { get; }
    public int PageSize { get; }
    public OrderStatus? StatusFilter { get; }
    public DateTime? FromDate { get; }
    public DateTime? ToDate { get; }
    
    public GetCustomerOrderHistoryQuery(CustomerId customerId, int pageNumber = 1, int pageSize = 20,
                                      OrderStatus? statusFilter = null, DateTime? fromDate = null, DateTime? toDate = null)
    {
        CustomerId = customerId;
        PageNumber = pageNumber;
        PageSize = pageSize;
        StatusFilter = statusFilter;
        FromDate = fromDate;
        ToDate = toDate;
    }
}

public class CustomerOrderHistoryResult
{
    public CustomerId CustomerId { get; set; }
    public string CustomerName { get; set; }
    public int TotalOrderCount { get; set; }
    public decimal TotalOrderValue { get; set; }
    public List<OrderSummary> Orders { get; set; } = new();
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class OrderSummary
{
    public OrderId OrderId { get; set; }
    public string OrderNumber { get; set; }
    public DateTime OrderDate { get; set; }
    public OrderStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public int ItemCount { get; set; }
    public List<OrderItemSummary> Items { get; set; } = new();
}

public class OrderItemSummary
{
    public ProductId ProductId { get; set; }
    public string ProductName { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
}

// 注文統計クエリ
public class GetOrderStatisticsQuery : IQuery<OrderStatisticsResult>
{
    public DateTime FromDate { get; }
    public DateTime ToDate { get; }
    public CustomerId? CustomerId { get; }
    public string GroupBy { get; } // "day", "week", "month"
    
    public GetOrderStatisticsQuery(DateTime fromDate, DateTime toDate, 
                                 CustomerId customerId = null, string groupBy = "day")
    {
        FromDate = fromDate;
        ToDate = toDate;
        CustomerId = customerId;
        GroupBy = groupBy;
    }
}

public class OrderStatisticsResult
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageOrderValue { get; set; }
    public List<OrderStatisticsPeriod> Periods { get; set; } = new();
    public List<TopSellingProduct> TopProducts { get; set; } = new();
}

public class OrderStatisticsPeriod
{
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public int OrderCount { get; set; }
    public decimal Revenue { get; set; }
}

public class TopSellingProduct
{
    public ProductId ProductId { get; set; }
    public string ProductName { get; set; }
    public int QuantitySold { get; set; }
    public decimal Revenue { get; set; }
}
\`\`\`

### クエリハンドラーの実装

読み取り専用データベースを使用した最適化されたクエリ処理：

\`\`\`csharp
public class GetCustomerOrderHistoryQueryHandler : IQueryHandler<GetCustomerOrderHistoryQuery, CustomerOrderHistoryResult>
{
    private readonly IReadOnlyDbContext _readContext;
    private readonly ILogger<GetCustomerOrderHistoryQueryHandler> _logger;
    
    public GetCustomerOrderHistoryQueryHandler(IReadOnlyDbContext readContext, 
                                             ILogger<GetCustomerOrderHistoryQueryHandler> logger)
    {
        _readContext = readContext;
        _logger = logger;
    }
    
    public async Task<CustomerOrderHistoryResult> HandleAsync(GetCustomerOrderHistoryQuery query, 
                                                           CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Fetching order history for customer {CustomerId}", query.CustomerId);
        
        var customerQuery = _readContext.Customers
            .Where(c => c.Id == query.CustomerId.Value);
        
        var customer = await customerQuery.FirstOrDefaultAsync(cancellationToken);
        if (customer == null)
        {
            throw new NotFoundException($"顧客が見つかりません: {query.CustomerId}");
        }
        
        // 注文クエリの構築
        var ordersQuery = _readContext.Orders
            .Where(o => o.CustomerId == query.CustomerId.Value);
        
        // フィルタリング
        if (query.StatusFilter.HasValue)
        {
            ordersQuery = ordersQuery.Where(o => o.Status == query.StatusFilter.Value);
        }
        
        if (query.FromDate.HasValue)
        {
            ordersQuery = ordersQuery.Where(o => o.OrderDate >= query.FromDate.Value);
        }
        
        if (query.ToDate.HasValue)
        {
            ordersQuery = ordersQuery.Where(o => o.OrderDate <= query.ToDate.Value);
        }
        
        // 総数の取得
        var totalCount = await ordersQuery.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);
        
        // ページネーション
        var orders = await ordersQuery
            .OrderByDescending(o => o.OrderDate)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .ToListAsync(cancellationToken);
        
        // 統計情報の計算
        var totalOrderValue = await _readContext.Orders
            .Where(o => o.CustomerId == query.CustomerId.Value)
            .SumAsync(o => o.TotalAmount, cancellationToken);
        
        var totalOrderCount = await _readContext.Orders
            .CountAsync(o => o.CustomerId == query.CustomerId.Value, cancellationToken);
        
        // 結果の構築
        var result = new CustomerOrderHistoryResult
        {
            CustomerId = query.CustomerId,
            CustomerName = customer.Name,
            TotalOrderCount = totalOrderCount,
            TotalOrderValue = totalOrderValue,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            TotalPages = totalPages,
            Orders = orders.Select(o => new OrderSummary
            {
                OrderId = new OrderId(o.Id),
                OrderNumber = o.OrderNumber,
                OrderDate = o.OrderDate,
                Status = o.Status,
                TotalAmount = o.TotalAmount,
                ItemCount = o.Items.Count,
                Items = o.Items.Select(i => new OrderItemSummary
                {
                    ProductId = new ProductId(i.ProductId),
                    ProductName = i.Product?.Name ?? "不明な商品",
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    Subtotal = i.UnitPrice * i.Quantity
                }).ToList()
            }).ToList()
        };
        
        _logger.LogDebug("Found {OrderCount} orders for customer {CustomerId}", 
            result.Orders.Count, query.CustomerId);
        
        return result;
    }
}

public class GetOrderStatisticsQueryHandler : IQueryHandler<GetOrderStatisticsQuery, OrderStatisticsResult>
{
    private readonly IReadOnlyDbContext _readContext;
    private readonly ILogger<GetOrderStatisticsQueryHandler> _logger;
    
    public GetOrderStatisticsQueryHandler(IReadOnlyDbContext readContext, 
                                        ILogger<GetOrderStatisticsQueryHandler> logger)
    {
        _readContext = readContext;
        _logger = logger;
    }
    
    public async Task<OrderStatisticsResult> HandleAsync(GetOrderStatisticsQuery query, 
                                                       CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Calculating order statistics from {FromDate} to {ToDate}", 
            query.FromDate, query.ToDate);
        
        var ordersQuery = _readContext.Orders
            .Where(o => o.OrderDate >= query.FromDate && o.OrderDate <= query.ToDate);
        
        if (query.CustomerId.HasValue)
        {
            ordersQuery = ordersQuery.Where(o => o.CustomerId == query.CustomerId.Value.Value);
        }
        
        // 基本統計
        var totalOrders = await ordersQuery.CountAsync(cancellationToken);
        var totalRevenue = await ordersQuery.SumAsync(o => o.TotalAmount, cancellationToken);
        var averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // 期間別統計
        var periods = new List<OrderStatisticsPeriod>();
        var currentDate = query.FromDate;
        
        while (currentDate <= query.ToDate)
        {
            var periodEnd = query.GroupBy switch
            {
                "week" => currentDate.AddDays(7),
                "month" => currentDate.AddMonths(1),
                _ => currentDate.AddDays(1)
            };
            
            var periodOrders = await ordersQuery
                .Where(o => o.OrderDate >= currentDate && o.OrderDate < periodEnd)
                .ToListAsync(cancellationToken);
            
            periods.Add(new OrderStatisticsPeriod
            {
                PeriodStart = currentDate,
                PeriodEnd = periodEnd,
                OrderCount = periodOrders.Count,
                Revenue = periodOrders.Sum(o => o.TotalAmount)
            });
            
            currentDate = periodEnd;
        }
        
        // トップ商品
        var topProducts = await _readContext.OrderItems
            .Where(i => ordersQuery.Any(o => o.Id == i.OrderId))
            .GroupBy(i => new { i.ProductId, i.Product.Name })
            .Select(g => new TopSellingProduct
            {
                ProductId = new ProductId(g.Key.ProductId),
                ProductName = g.Key.Name,
                QuantitySold = g.Sum(i => i.Quantity),
                Revenue = g.Sum(i => i.UnitPrice * i.Quantity)
            })
            .OrderByDescending(p => p.Revenue)
            .Take(10)
            .ToListAsync(cancellationToken);
        
        return new OrderStatisticsResult
        {
            FromDate = query.FromDate,
            ToDate = query.ToDate,
            TotalOrders = totalOrders,
            TotalRevenue = totalRevenue,
            AverageOrderValue = averageOrderValue,
            Periods = periods,
            TopProducts = topProducts
        };
    }
}
\`\`\`

## MediatRを使用したCQRS実装

MediatRを使用することで、CQRSパターンをより簡潔に実装できます：

\`\`\`csharp
// MediatRのIRequestを使用
public class CreateOrderCommand : IRequest<OrderId>
{
    public CustomerId CustomerId { get; }
    public Address ShippingAddress { get; }
    public List<OrderItemRequest> Items { get; }
    
    public CreateOrderCommand(CustomerId customerId, Address shippingAddress, List<OrderItemRequest> items)
    {
        CustomerId = customerId;
        ShippingAddress = shippingAddress;
        Items = items;
    }
}

public class GetCustomerOrderHistoryQuery : IRequest<CustomerOrderHistoryResult>
{
    public CustomerId CustomerId { get; }
    public int PageNumber { get; }
    public int PageSize { get; }
    
    public GetCustomerOrderHistoryQuery(CustomerId customerId, int pageNumber = 1, int pageSize = 20)
    {
        CustomerId = customerId;
        PageNumber = pageNumber;
        PageSize = pageSize;
    }
}

// ハンドラー
public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, OrderId>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ILogger<CreateOrderCommandHandler> _logger;
    
    public CreateOrderCommandHandler(IOrderRepository orderRepository, ILogger<CreateOrderCommandHandler> logger)
    {
        _orderRepository = orderRepository;
        _logger = logger;
    }
    
    public async Task<OrderId> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        // 実装は前述と同じ
        _logger.LogInformation("Processing CreateOrderCommand for customer {CustomerId}", request.CustomerId);
        
        // ビジネスロジックの実装...
        
        return orderId;
    }
}

public class GetCustomerOrderHistoryQueryHandler : IRequestHandler<GetCustomerOrderHistoryQuery, CustomerOrderHistoryResult>
{
    private readonly IReadOnlyDbContext _readContext;
    
    public GetCustomerOrderHistoryQueryHandler(IReadOnlyDbContext readContext)
    {
        _readContext = readContext;
    }
    
    public async Task<CustomerOrderHistoryResult> Handle(GetCustomerOrderHistoryQuery request, CancellationToken cancellationToken)
    {
        // クエリ実装は前述と同じ
        return result;
    }
}
\`\`\`

### Web APIでのCQRS使用

\`\`\`csharp
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<OrdersController> _logger;
    
    public OrdersController(IMediator mediator, ILogger<OrdersController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }
    
    // コマンド - 注文作成
    [HttpPost]
    public async Task<ActionResult<OrderCreatedResponse>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var command = new CreateOrderCommand(
            new CustomerId(request.CustomerId),
            request.ShippingAddress,
            request.Items
        );
        
        var orderId = await _mediator.Send(command);
        
        return Ok(new OrderCreatedResponse 
        { 
            OrderId = orderId.Value,
            Message = "注文が正常に作成されました。"
        });
    }
    
    // コマンド - 注文確定
    [HttpPost("{orderId}/confirm")]
    public async Task<ActionResult> ConfirmOrder(Guid orderId, [FromBody] ConfirmOrderRequest request)
    {
        var command = new ConfirmOrderCommand(
            new OrderId(orderId),
            request.RequestedDeliveryDate
        );
        
        await _mediator.Send(command);
        
        return Ok(new { Message = "注文が確定されました。" });
    }
    
    // クエリ - 顧客の注文履歴
    [HttpGet("customers/{customerId}/history")]
    public async Task<ActionResult<CustomerOrderHistoryResult>> GetCustomerOrderHistory(
        Guid customerId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] OrderStatus? status = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        var query = new GetCustomerOrderHistoryQuery(
            new CustomerId(customerId),
            pageNumber,
            pageSize,
            status,
            fromDate,
            toDate
        );
        
        var result = await _mediator.Send(query);
        return Ok(result);
    }
    
    // クエリ - 注文統計
    [HttpGet("statistics")]
    public async Task<ActionResult<OrderStatisticsResult>> GetOrderStatistics(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] Guid? customerId = null,
        [FromQuery] string groupBy = "day")
    {
        var query = new GetOrderStatisticsQuery(
            fromDate,
            toDate,
            customerId.HasValue ? new CustomerId(customerId.Value) : null,
            groupBy
        );
        
        var result = await _mediator.Send(query);
        return Ok(result);
    }
}
\`\`\`

## イベント駆動のCQRS

ドメインイベントを使用して読み取りモデルを更新：

\`\`\`csharp
// 読み取り専用モデル（プロジェクション）
public class OrderProjection
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; }
    public DateTime OrderDate { get; set; }
    public OrderStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public int ItemCount { get; set; }
    public string ShippingAddress { get; set; }
    public DateTime? ConfirmationDate { get; set; }
    public DateTime LastUpdated { get; set; }
}

// イベントハンドラーによるプロジェクションの更新
public class OrderProjectionUpdater : 
    INotificationHandler<OrderCreated>,
    INotificationHandler<OrderConfirmed>,
    INotificationHandler<OrderCancelled>
{
    private readonly IReadOnlyDbContext _readContext;
    private readonly ILogger<OrderProjectionUpdater> _logger;
    
    public OrderProjectionUpdater(IReadOnlyDbContext readContext, ILogger<OrderProjectionUpdater> logger)
    {
        _readContext = readContext;
        _logger = logger;
    }
    
    public async Task Handle(OrderCreated notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating order projection for {OrderId}", notification.OrderId);
        
        // 顧客情報の取得
        var customer = await _readContext.Customers
            .FirstOrDefaultAsync(c => c.Id == notification.CustomerId.Value, cancellationToken);
        
        var projection = new OrderProjection
        {
            Id = notification.OrderId.Value,
            OrderNumber = notification.OrderNumber,
            CustomerId = notification.CustomerId.Value,
            CustomerName = customer?.Name ?? "不明",
            OrderDate = notification.OrderDate,
            Status = OrderStatus.Draft,
            TotalAmount = notification.TotalAmount.Amount,
            ItemCount = notification.Items?.Count ?? 0,
            ShippingAddress = notification.ShippingAddress?.ToString(),
            LastUpdated = DateTime.UtcNow
        };
        
        _readContext.OrderProjections.Add(projection);
        await _readContext.SaveChangesAsync(cancellationToken);
    }
    
    public async Task Handle(OrderConfirmed notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating order projection for confirmation {OrderId}", notification.OrderId);
        
        var projection = await _readContext.OrderProjections
            .FirstOrDefaultAsync(p => p.Id == notification.OrderId.Value, cancellationToken);
        
        if (projection != null)
        {
            projection.Status = OrderStatus.Confirmed;
            projection.ConfirmationDate = notification.ConfirmationDate;
            projection.LastUpdated = DateTime.UtcNow;
            
            await _readContext.SaveChangesAsync(cancellationToken);
        }
    }
    
    public async Task Handle(OrderCancelled notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating order projection for cancellation {OrderId}", notification.OrderId);
        
        var projection = await _readContext.OrderProjections
            .FirstOrDefaultAsync(p => p.Id == notification.OrderId.Value, cancellationToken);
        
        if (projection != null)
        {
            projection.Status = OrderStatus.Cancelled;
            projection.LastUpdated = DateTime.UtcNow;
            
            await _readContext.SaveChangesAsync(cancellationToken);
        }
    }
}
\`\`\`

## パフォーマンスとスケーラビリティ

### 読み取り専用データベースの使用

異なるデータベースを読み取りと書き込みで使用：

\`\`\`csharp
// 書き込み用DbContext
public class WriteDbContext : DbContext
{
    public DbSet<Order> Orders { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Product> Products { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 複雑なドメインモデルの設定
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(WriteDbContext).Assembly);
    }
}

// 読み取り専用DbContext
public class ReadOnlyDbContext : DbContext, IReadOnlyDbContext
{
    public DbSet<OrderProjection> OrderProjections { get; set; }
    public DbSet<CustomerSummary> CustomerSummaries { get; set; }
    public DbSet<ProductView> ProductViews { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 読み取り最適化された単純なモデル
        modelBuilder.Entity<OrderProjection>().HasKey(o => o.Id);
        modelBuilder.Entity<OrderProjection>().HasIndex(o => o.CustomerId);
        modelBuilder.Entity<OrderProjection>().HasIndex(o => o.OrderDate);
        
        // ビューやマテリアライズドビューの設定
        modelBuilder.Entity<CustomerSummary>().ToView("customer_summary_view");
    }
    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // 読み取り専用接続の設定
        optionsBuilder.UseSqlServer(connectionString, options =>
        {
            options.CommandTimeout(30);
        });
    }
}
\`\`\`

### キャッシュ戦略

\`\`\`csharp
public class CachedOrderQueryHandler : IQueryHandler<GetCustomerOrderHistoryQuery, CustomerOrderHistoryResult>
{
    private readonly IQueryHandler<GetCustomerOrderHistoryQuery, CustomerOrderHistoryResult> _inner;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CachedOrderQueryHandler> _logger;
    
    public CachedOrderQueryHandler(
        IQueryHandler<GetCustomerOrderHistoryQuery, CustomerOrderHistoryResult> inner,
        IMemoryCache cache,
        ILogger<CachedOrderQueryHandler> logger)
    {
        _inner = inner;
        _cache = cache;
        _logger = logger;
    }
    
    public async Task<CustomerOrderHistoryResult> HandleAsync(GetCustomerOrderHistoryQuery query, 
                                                           CancellationToken cancellationToken = default)
    {
        var cacheKey = $"customer_orders_{query.CustomerId}_{query.PageNumber}_{query.PageSize}";
        
        if (_cache.TryGetValue(cacheKey, out CustomerOrderHistoryResult cachedResult))
        {
            _logger.LogDebug("Cache hit for {CacheKey}", cacheKey);
            return cachedResult;
        }
        
        _logger.LogDebug("Cache miss for {CacheKey}", cacheKey);
        var result = await _inner.HandleAsync(query, cancellationToken);
        
        var cacheOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5),
            SlidingExpiration = TimeSpan.FromMinutes(2)
        };
        
        _cache.Set(cacheKey, result, cacheOptions);
        
        return result;
    }
}
\`\`\`

## まとめ

CQRSは、以下の価値を提供します：

### 主な利点

1. **性能向上**: 読み取りクエリの最適化
2. **スケーラビリティ**: 読み取りと書き込みの独立したスケーリング
3. **複雑性の分離**: ビジネスロジックと表示ロジックの明確な分離
4. **柔軟性**: 異なるデータストアや技術の使用が可能

### 実装時の考慮点

1. **複雑性**: システム全体の複雑性が増加
2. **整合性**: 最終的整合性の受け入れ
3. **同期**: 書き込みモデルと読み取りモデルの同期戦略
4. **コスト**: 開発・運用コストの増加

### 次のステップ

- イベントソーシングとの組み合わせ
- 分散システムでのCQRS実装
- マイクロサービスアーキテクチャとの統合
- パフォーマンス監視と最適化

CQRSをマスターすることで、高性能で保守しやすい複雑なシステムを構築できるようになります。
`,
  duration: 110,
  order: 7,
  codeExamples: [
    {
      id: 'cqrs-basic-structure',
      title: 'CQRS基本構造 - コマンドとクエリの分離',
      code: `using System;
using System.Threading;
using System.Threading.Tasks;

// === CQRS基本構造の実装 ===

// コマンド（書き込み操作）
public interface ICommand
{
    // マーカーインターフェース
}

public interface ICommand<out TResult>
{
    // 戻り値があるコマンド用
}

public interface ICommandHandler<in TCommand> where TCommand : ICommand
{
    Task HandleAsync(TCommand command, CancellationToken cancellationToken = default);
}

public interface ICommandHandler<in TCommand, TResult> 
    where TCommand : ICommand<TResult>
{
    Task<TResult> HandleAsync(TCommand command, CancellationToken cancellationToken = default);
}

// クエリ（読み取り操作）
public interface IQuery<out TResult>
{
    // マーカーインターフェース
}

public interface IQueryHandler<in TQuery, TResult> 
    where TQuery : IQuery<TResult>
{
    Task<TResult> HandleAsync(TQuery query, CancellationToken cancellationToken = default);
}

// 実際のコマンド例
public class CreateOrderCommand : ICommand<OrderId>
{
    public CustomerId CustomerId { get; }
    public Address ShippingAddress { get; }
    public List<OrderItemRequest> Items { get; }
    public PaymentMethod PaymentMethod { get; }
    
    public CreateOrderCommand(CustomerId customerId, Address shippingAddress, 
                            List<OrderItemRequest> items, PaymentMethod paymentMethod)
    {
        CustomerId = customerId ?? throw new ArgumentNullException(nameof(customerId));
        ShippingAddress = shippingAddress ?? throw new ArgumentNullException(nameof(shippingAddress));
        Items = items ?? throw new ArgumentNullException(nameof(items));
        PaymentMethod = paymentMethod ?? throw new ArgumentNullException(nameof(paymentMethod));
    }
}

// 実際のクエリ例
public class GetCustomerOrderHistoryQuery : IQuery<CustomerOrderHistoryResult>
{
    public CustomerId CustomerId { get; }
    public int PageNumber { get; }
    public int PageSize { get; }
    public OrderStatus? StatusFilter { get; }
    
    public GetCustomerOrderHistoryQuery(CustomerId customerId, int pageNumber = 1, 
                                      int pageSize = 20, OrderStatus? statusFilter = null)
    {
        CustomerId = customerId;
        PageNumber = pageNumber;
        PageSize = pageSize;
        StatusFilter = statusFilter;
    }
}`,
      language: 'csharp'
    },
    {
      id: 'complete-command-handler',
      title: 'コマンドハンドラーの完全実装',
      code: `using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

// === ビジネスロジックを含む完全なコマンドハンドラー ===

public class CreateOrderCommandHandler : ICommandHandler<CreateOrderCommand, OrderId>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IProductCatalogService _catalogService;
    private readonly IDomainEventDispatcher _eventDispatcher;
    private readonly ILogger<CreateOrderCommandHandler> _logger;
    
    public CreateOrderCommandHandler(
        IOrderRepository orderRepository,
        ICustomerRepository customerRepository,
        IProductCatalogService catalogService,
        IDomainEventDispatcher eventDispatcher,
        ILogger<CreateOrderCommandHandler> logger)
    {
        _orderRepository = orderRepository;
        _customerRepository = customerRepository;
        _catalogService = catalogService;
        _eventDispatcher = eventDispatcher;
        _logger = logger;
    }
    
    public async Task<OrderId> HandleAsync(CreateOrderCommand command, 
                                         CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating order for customer {CustomerId}", command.CustomerId);
        
        // 1. ビジネスルールの検証
        await ValidateBusinessRulesAsync(command);
        
        // 2. 顧客の存在確認
        var customer = await _customerRepository.GetByIdAsync(command.CustomerId);
        if (customer == null)
        {
            throw new DomainException($"顧客が見つかりません: {command.CustomerId}");
        }
        
        // 3. 商品情報の取得と検証
        var orderItems = await BuildOrderItemsAsync(command.Items);
        
        // 4. 注文の作成（ドメインロジック）
        var order = Order.Create(
            command.CustomerId,
            orderItems,
            command.ShippingAddress,
            command.PaymentMethod
        );
        
        // 5. ビジネスルールの適用（割引計算など）
        ApplyBusinessRules(order, customer);
        
        // 6. 注文の保存
        await _orderRepository.SaveAsync(order);
        
        // 7. ドメインイベントの発行
        await _eventDispatcher.DispatchAsync(order.DomainEvents, cancellationToken);
        order.ClearDomainEvents();
        
        _logger.LogInformation("Order created successfully: {OrderId}", order.Id);
        
        return order.Id;
    }
    
    private async Task ValidateBusinessRulesAsync(CreateOrderCommand command)
    {
        // 最小注文金額の確認
        if (!command.Items.Any())
        {
            throw new DomainException("注文には少なくとも1つの商品が必要です。");
        }
        
        // 同一商品の重複チェック
        var duplicateProducts = command.Items
            .GroupBy(i => i.ProductId)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key);
        
        if (duplicateProducts.Any())
        {
            throw new DomainException($"重複した商品があります: {string.Join(", ", duplicateProducts)}");
        }
    }
    
    private async Task<List<OrderItem>> BuildOrderItemsAsync(List<OrderItemRequest> itemRequests)
    {
        var productIds = itemRequests.Select(i => i.ProductId).ToList();
        var products = await _catalogService.GetProductsAsync(productIds);
        
        var orderItems = new List<OrderItem>();
        
        foreach (var itemRequest in itemRequests)
        {
            var product = products.FirstOrDefault(p => p.ProductId == itemRequest.ProductId);
            if (product == null || !product.IsActive)
            {
                throw new DomainException($"商品が利用できません: {itemRequest.ProductId}");
            }
            
            if (itemRequest.Quantity <= 0)
            {
                throw new DomainException($"数量は1以上である必要があります: {itemRequest.ProductId}");
            }
            
            var orderItem = new OrderItem(
                product.ProductId,
                product.Name,
                product.CurrentPrice,
                itemRequest.Quantity
            );
            
            orderItems.Add(orderItem);
        }
        
        return orderItems;
    }
    
    private void ApplyBusinessRules(Order order, Customer customer)
    {
        // VIP顧客の割引適用
        if (customer.Type == CustomerType.VIP)
        {
            var discount = order.TotalAmount.Multiply(0.1m); // 10%割引
            order.ApplyDiscount(new DiscountAmount(discount.Amount, "VIP顧客割引"));
        }
        
        // 大口注文の処理
        if (order.TotalAmount.Amount >= 100000) // 10万円以上
        {
            order.MarkAsHighValue();
        }
    }
}

public class ConfirmOrderCommandHandler : ICommandHandler<ConfirmOrderCommand>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IInventoryService _inventoryService;
    private readonly IDomainEventDispatcher _eventDispatcher;
    private readonly ILogger<ConfirmOrderCommandHandler> _logger;
    
    public ConfirmOrderCommandHandler(
        IOrderRepository orderRepository,
        IInventoryService inventoryService,
        IDomainEventDispatcher eventDispatcher,
        ILogger<ConfirmOrderCommandHandler> logger)
    {
        _orderRepository = orderRepository;
        _inventoryService = inventoryService;
        _eventDispatcher = eventDispatcher;
        _logger = logger;
    }
    
    public async Task HandleAsync(ConfirmOrderCommand command, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Confirming order {OrderId}", command.OrderId);
        
        var order = await _orderRepository.GetByIdAsync(command.OrderId);
        if (order == null)
        {
            throw new DomainException($"注文が見つかりません: {command.OrderId}");
        }
        
        // 在庫の最終確認
        await ValidateInventoryAsync(order);
        
        // 注文の確定
        order.Confirm(command.RequestedDeliveryDate);
        
        await _orderRepository.SaveAsync(order);
        await _eventDispatcher.DispatchAsync(order.DomainEvents, cancellationToken);
        order.ClearDomainEvents();
        
        _logger.LogInformation("Order confirmed successfully: {OrderId}", command.OrderId);
    }
    
    private async Task ValidateInventoryAsync(Order order)
    {
        foreach (var item in order.Items)
        {
            var availability = await _inventoryService.CheckAvailabilityAsync(item.ProductId);
            if (availability.AvailableQuantity < item.Quantity)
            {
                throw new DomainException(
                    $"商品の在庫が不足しています: {item.ProductName} " +
                    $"(必要: {item.Quantity}, 在庫: {availability.AvailableQuantity})");
            }
        }
    }
}`,
      language: 'csharp'
    },
    {
      id: 'optimized-query-handler',
      title: '最適化されたクエリハンドラー',
      code: `using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

// === 読み取り専用に最適化されたクエリハンドラー ===

public class GetCustomerOrderHistoryQueryHandler : IQueryHandler<GetCustomerOrderHistoryQuery, CustomerOrderHistoryResult>
{
    private readonly IReadOnlyDbContext _readContext;
    private readonly ILogger<GetCustomerOrderHistoryQueryHandler> _logger;
    
    public GetCustomerOrderHistoryQueryHandler(IReadOnlyDbContext readContext, 
                                             ILogger<GetCustomerOrderHistoryQueryHandler> logger)
    {
        _readContext = readContext;
        _logger = logger;
    }
    
    public async Task<CustomerOrderHistoryResult> HandleAsync(GetCustomerOrderHistoryQuery query, 
                                                           CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Fetching order history for customer {CustomerId}", query.CustomerId);
        
        // 顧客情報の取得
        var customer = await _readContext.Customers
            .AsNoTracking()
            .Where(c => c.Id == query.CustomerId.Value)
            .Select(c => new { c.Id, c.Name })
            .FirstOrDefaultAsync(cancellationToken);
        
        if (customer == null)
        {
            throw new NotFoundException($"顧客が見つかりません: {query.CustomerId}");
        }
        
        // 基本クエリの構築
        var baseQuery = _readContext.Orders
            .AsNoTracking()
            .Where(o => o.CustomerId == query.CustomerId.Value);
        
        // フィルタリング
        if (query.StatusFilter.HasValue)
        {
            baseQuery = baseQuery.Where(o => o.Status == query.StatusFilter.Value);
        }
        
        // 統計情報の並列取得
        var statisticsTask = GetCustomerStatisticsAsync(query.CustomerId, cancellationToken);
        
        // 総数の取得
        var totalCountTask = baseQuery.CountAsync(cancellationToken);
        
        // ページネーションされた注文の取得
        var ordersTask = baseQuery
            .OrderByDescending(o => o.OrderDate)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(o => new OrderSummary
            {
                OrderId = new OrderId(o.Id),
                OrderNumber = o.OrderNumber,
                OrderDate = o.OrderDate,
                Status = o.Status,
                TotalAmount = o.TotalAmount,
                ItemCount = o.Items.Count(),
                Items = o.Items.Select(i => new OrderItemSummary
                {
                    ProductId = new ProductId(i.ProductId),
                    ProductName = i.ProductName,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    Subtotal = i.UnitPrice * i.Quantity
                }).ToList()
            })
            .ToListAsync(cancellationToken);
        
        // 並列実行の完了を待機
        await Task.WhenAll(statisticsTask, totalCountTask, ordersTask);
        
        var statistics = await statisticsTask;
        var totalCount = await totalCountTask;
        var orders = await ordersTask;
        
        var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);
        
        var result = new CustomerOrderHistoryResult
        {
            CustomerId = query.CustomerId,
            CustomerName = customer.Name,
            TotalOrderCount = statistics.TotalOrderCount,
            TotalOrderValue = statistics.TotalOrderValue,
            AverageOrderValue = statistics.AverageOrderValue,
            LastOrderDate = statistics.LastOrderDate,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            TotalPages = totalPages,
            Orders = orders
        };
        
        _logger.LogDebug("Found {OrderCount} orders for customer {CustomerId} (page {PageNumber})", 
            orders.Count, query.CustomerId, query.PageNumber);
        
        return result;
    }
    
    private async Task<CustomerStatistics> GetCustomerStatisticsAsync(CustomerId customerId, 
                                                                    CancellationToken cancellationToken)
    {
        // 効率的な統計クエリ
        var stats = await _readContext.Orders
            .AsNoTracking()
            .Where(o => o.CustomerId == customerId.Value)
            .GroupBy(o => o.CustomerId)
            .Select(g => new CustomerStatistics
            {
                TotalOrderCount = g.Count(),
                TotalOrderValue = g.Sum(o => o.TotalAmount),
                AverageOrderValue = g.Average(o => o.TotalAmount),
                LastOrderDate = g.Max(o => o.OrderDate)
            })
            .FirstOrDefaultAsync(cancellationToken);
        
        return stats ?? new CustomerStatistics();
    }
}

public class GetOrderStatisticsQueryHandler : IQueryHandler<GetOrderStatisticsQuery, OrderStatisticsResult>
{
    private readonly IReadOnlyDbContext _readContext;
    private readonly ILogger<GetOrderStatisticsQueryHandler> _logger;
    
    public GetOrderStatisticsQueryHandler(IReadOnlyDbContext readContext, 
                                        ILogger<GetOrderStatisticsQueryHandler> logger)
    {
        _readContext = readContext;
        _logger = logger;
    }
    
    public async Task<OrderStatisticsResult> HandleAsync(GetOrderStatisticsQuery query, 
                                                       CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Calculating order statistics from {FromDate} to {ToDate}", 
            query.FromDate, query.ToDate);
        
        var ordersQuery = _readContext.Orders
            .AsNoTracking()
            .Where(o => o.OrderDate >= query.FromDate && o.OrderDate <= query.ToDate);
        
        if (query.CustomerId.HasValue)
        {
            ordersQuery = ordersQuery.Where(o => o.CustomerId == query.CustomerId.Value.Value);
        }
        
        // 並列でタスクを実行
        var basicStatsTask = GetBasicStatisticsAsync(ordersQuery, cancellationToken);
        var periodStatsTask = GetPeriodStatisticsAsync(ordersQuery, query, cancellationToken);
        var topProductsTask = GetTopProductsAsync(ordersQuery, cancellationToken);
        
        await Task.WhenAll(basicStatsTask, periodStatsTask, topProductsTask);
        
        var basicStats = await basicStatsTask;
        var periodStats = await periodStatsTask;
        var topProducts = await topProductsTask;
        
        return new OrderStatisticsResult
        {
            FromDate = query.FromDate,
            ToDate = query.ToDate,
            TotalOrders = basicStats.TotalOrders,
            TotalRevenue = basicStats.TotalRevenue,
            AverageOrderValue = basicStats.AverageOrderValue,
            Periods = periodStats,
            TopProducts = topProducts
        };
    }
    
    private async Task<(int TotalOrders, decimal TotalRevenue, decimal AverageOrderValue)> GetBasicStatisticsAsync(
        IQueryable<Order> ordersQuery, CancellationToken cancellationToken)
    {
        var stats = await ordersQuery
            .GroupBy(o => 1)
            .Select(g => new
            {
                TotalOrders = g.Count(),
                TotalRevenue = g.Sum(o => o.TotalAmount),
                AverageOrderValue = g.Average(o => o.TotalAmount)
            })
            .FirstOrDefaultAsync(cancellationToken);
        
        return (stats?.TotalOrders ?? 0, stats?.TotalRevenue ?? 0, stats?.AverageOrderValue ?? 0);
    }
    
    private async Task<List<OrderStatisticsPeriod>> GetPeriodStatisticsAsync(
        IQueryable<Order> ordersQuery, GetOrderStatisticsQuery query, CancellationToken cancellationToken)
    {
        // SQLレベルでの効率的なグループ化
        var groupByExpression = query.GroupBy switch
        {
            "week" => (o => new { Year = o.OrderDate.Year, Week = EF.Functions.DatePart("week", o.OrderDate) }),
            "month" => (o => new { Year = o.OrderDate.Year, Month = o.OrderDate.Month }),
            _ => (o => new { Year = o.OrderDate.Year, Month = o.OrderDate.Month, Day = o.OrderDate.Day })
        };
        
        var periodStats = await ordersQuery
            .GroupBy(groupByExpression)
            .Select(g => new OrderStatisticsPeriod
            {
                // 期間の計算はここで簡略化
                PeriodStart = g.Min(o => o.OrderDate.Date),
                PeriodEnd = g.Max(o => o.OrderDate.Date).AddDays(1),
                OrderCount = g.Count(),
                Revenue = g.Sum(o => o.TotalAmount)
            })
            .OrderBy(p => p.PeriodStart)
            .ToListAsync(cancellationToken);
        
        return periodStats;
    }
    
    private async Task<List<TopSellingProduct>> GetTopProductsAsync(
        IQueryable<Order> ordersQuery, CancellationToken cancellationToken)
    {
        var topProducts = await _readContext.OrderItems
            .AsNoTracking()
            .Where(i => ordersQuery.Any(o => o.Id == i.OrderId))
            .GroupBy(i => new { i.ProductId, i.ProductName })
            .Select(g => new TopSellingProduct
            {
                ProductId = new ProductId(g.Key.ProductId),
                ProductName = g.Key.ProductName,
                QuantitySold = g.Sum(i => i.Quantity),
                Revenue = g.Sum(i => i.UnitPrice * i.Quantity)
            })
            .OrderByDescending(p => p.Revenue)
            .Take(10)
            .ToListAsync(cancellationToken);
        
        return topProducts;
    }
}

// 読み取り専用データベースコンテキスト
public interface IReadOnlyDbContext
{
    DbSet<CustomerProjection> Customers { get; }
    DbSet<OrderProjection> Orders { get; }
    DbSet<OrderItemProjection> OrderItems { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

// 統計用のヘルパークラス
public class CustomerStatistics
{
    public int TotalOrderCount { get; set; }
    public decimal TotalOrderValue { get; set; }
    public decimal AverageOrderValue { get; set; }
    public DateTime? LastOrderDate { get; set; }
}`,
      language: 'csharp'
    },
    {
      id: 'mediatr-cqrs-integration-impl',
      title: 'MediatRを使用したCQRS統合',
      code: `using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

// === MediatRによるCQRS統合の実装 ===

// MediatRベースのコマンドとクエリ
public class CreateOrderCommand : IRequest<OrderId>
{
    public CustomerId CustomerId { get; }
    public Address ShippingAddress { get; }
    public List<OrderItemRequest> Items { get; }
    public PaymentMethod PaymentMethod { get; }
    
    public CreateOrderCommand(CustomerId customerId, Address shippingAddress, 
                            List<OrderItemRequest> items, PaymentMethod paymentMethod)
    {
        CustomerId = customerId;
        ShippingAddress = shippingAddress;
        Items = items;
        PaymentMethod = paymentMethod;
    }
}

public class GetCustomerOrderHistoryQuery : IRequest<CustomerOrderHistoryResult>
{
    public CustomerId CustomerId { get; }
    public int PageNumber { get; }
    public int PageSize { get; }
    
    public GetCustomerOrderHistoryQuery(CustomerId customerId, int pageNumber = 1, int pageSize = 20)
    {
        CustomerId = customerId;
        PageNumber = pageNumber;
        PageSize = pageSize;
    }
}

// MediatRハンドラー
public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, OrderId>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly ILogger<CreateOrderCommandHandler> _logger;
    
    public CreateOrderCommandHandler(IOrderRepository orderRepository, 
                                   ICustomerRepository customerRepository,
                                   ILogger<CreateOrderCommandHandler> logger)
    {
        _orderRepository = orderRepository;
        _customerRepository = customerRepository;
        _logger = logger;
    }
    
    public async Task<OrderId> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Processing CreateOrderCommand for customer {CustomerId}", request.CustomerId);
        
        // ビジネスロジックの実装
        var customer = await _customerRepository.GetByIdAsync(request.CustomerId);
        if (customer == null)
        {
            throw new DomainException($"顧客が見つかりません: {request.CustomerId}");
        }
        
        var order = Order.Create(
            request.CustomerId,
            request.Items.Select(i => new OrderItem(i.ProductId, i.ProductName, i.UnitPrice, i.Quantity)).ToList(),
            request.ShippingAddress,
            request.PaymentMethod
        );
        
        await _orderRepository.SaveAsync(order);
        
        _logger.LogInformation("Order created successfully: {OrderId}", order.Id);
        return order.Id;
    }
}

public class GetCustomerOrderHistoryQueryHandler : IRequestHandler<GetCustomerOrderHistoryQuery, CustomerOrderHistoryResult>
{
    private readonly IReadOnlyDbContext _readContext;
    private readonly ILogger<GetCustomerOrderHistoryQueryHandler> _logger;
    
    public GetCustomerOrderHistoryQueryHandler(IReadOnlyDbContext readContext, 
                                             ILogger<GetCustomerOrderHistoryQueryHandler> logger)
    {
        _readContext = readContext;
        _logger = logger;
    }
    
    public async Task<CustomerOrderHistoryResult> Handle(GetCustomerOrderHistoryQuery request, 
                                                       CancellationToken cancellationToken)
    {
        _logger.LogDebug("Fetching order history for customer {CustomerId}", request.CustomerId);
        
        // 読み取り専用の最適化されたクエリ
        var customer = await _readContext.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == request.CustomerId.Value, cancellationToken);
        
        if (customer == null)
        {
            throw new NotFoundException($"顧客が見つかりません: {request.CustomerId}");
        }
        
        var orders = await _readContext.Orders
            .AsNoTracking()
            .Where(o => o.CustomerId == request.CustomerId.Value)
            .OrderByDescending(o => o.OrderDate)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Include(o => o.Items)
            .ToListAsync(cancellationToken);
        
        return new CustomerOrderHistoryResult
        {
            CustomerId = request.CustomerId,
            CustomerName = customer.Name,
            Orders = orders.Select(o => new OrderSummary
            {
                OrderId = new OrderId(o.Id),
                OrderNumber = o.OrderNumber,
                OrderDate = o.OrderDate,
                Status = o.Status,
                TotalAmount = o.TotalAmount,
                ItemCount = o.Items.Count
            }).ToList()
        };
    }
}

// Web APIコントローラー
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<OrdersController> _logger;
    
    public OrdersController(IMediator mediator, ILogger<OrdersController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }
    
    // コマンド - 注文作成
    [HttpPost]
    public async Task<ActionResult<OrderCreatedResponse>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        try
        {
            var command = new CreateOrderCommand(
                new CustomerId(request.CustomerId),
                request.ShippingAddress,
                request.Items,
                request.PaymentMethod
            );
            
            var orderId = await _mediator.Send(command);
            
            return Ok(new OrderCreatedResponse 
            { 
                OrderId = orderId.Value,
                Message = "注文が正常に作成されました。"
            });
        }
        catch (DomainException ex)
        {
            _logger.LogWarning(ex, "Domain validation failed for order creation");
            return BadRequest(new { Error = ex.Message });
        }
    }
    
    // コマンド - 注文確定
    [HttpPost("{orderId}/confirm")]
    public async Task<ActionResult> ConfirmOrder(Guid orderId, [FromBody] ConfirmOrderRequest request)
    {
        try
        {
            var command = new ConfirmOrderCommand(
                new OrderId(orderId),
                request.RequestedDeliveryDate
            );
            
            await _mediator.Send(command);
            
            return Ok(new { Message = "注文が確定されました。" });
        }
        catch (DomainException ex)
        {
            _logger.LogWarning(ex, "Failed to confirm order {OrderId}", orderId);
            return BadRequest(new { Error = ex.Message });
        }
    }
    
    // クエリ - 顧客の注文履歴
    [HttpGet("customers/{customerId}/history")]
    public async Task<ActionResult<CustomerOrderHistoryResult>> GetCustomerOrderHistory(
        Guid customerId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var query = new GetCustomerOrderHistoryQuery(
                new CustomerId(customerId),
                pageNumber,
                pageSize
            );
            
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { Error = ex.Message });
        }
    }
    
    // クエリ - 注文統計
    [HttpGet("statistics")]
    public async Task<ActionResult<OrderStatisticsResult>> GetOrderStatistics(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] Guid? customerId = null,
        [FromQuery] string groupBy = "day")
    {
        var query = new GetOrderStatisticsQuery(
            fromDate,
            toDate,
            customerId.HasValue ? new CustomerId(customerId.Value) : null,
            groupBy
        );
        
        var result = await _mediator.Send(query);
        return Ok(result);
    }
}

// パイプライン動作（横断的関心事）
public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse> 
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;
    
    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }
    
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, 
                                      CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        _logger.LogInformation("Handling {RequestName}", requestName);
        
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        
        try
        {
            var response = await next();
            
            stopwatch.Stop();
            _logger.LogInformation("Handled {RequestName} in {ElapsedMilliseconds}ms", 
                requestName, stopwatch.ElapsedMilliseconds);
            
            return response;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Error handling {RequestName} after {ElapsedMilliseconds}ms", 
                requestName, stopwatch.ElapsedMilliseconds);
            throw;
        }
    }
}

public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse> 
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;
    
    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }
    
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, 
                                      CancellationToken cancellationToken)
    {
        if (_validators.Any())
        {
            var context = new ValidationContext<TRequest>(request);
            var validationResults = await Task.WhenAll(_validators.Select(v => v.ValidateAsync(context, cancellationToken)));
            var failures = validationResults.SelectMany(r => r.Errors).Where(f => f != null).ToList();
            
            if (failures.Any())
            {
                throw new ValidationException(failures);
            }
        }
        
        return await next();
    }
}

// DI登録
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddCQRS(this IServiceCollection services)
    {
        // MediatRの登録
        services.AddMediatR(cfg => {
            cfg.RegisterServicesFromAssembly(typeof(CreateOrderCommand).Assembly);
        });
        
        // パイプライン動作の登録
        services.AddScoped(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
        services.AddScoped(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        
        // ハンドラーの登録（自動的に検出される）
        services.AddScoped<IRequestHandler<CreateOrderCommand, OrderId>, CreateOrderCommandHandler>();
        services.AddScoped<IRequestHandler<GetCustomerOrderHistoryQuery, CustomerOrderHistoryResult>, GetCustomerOrderHistoryQueryHandler>();
        
        return services;
    }
}`,
      language: 'csharp'
    },
    {
      id: 'event-driven-cqrs-projections-full',
      title: 'イベント駆動CQRSとプロジェクション更新',
      code: `using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

// === イベント駆動によるプロジェクション更新 ===

// 読み取り専用モデル（プロジェクション）
public class OrderProjection
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; }
    public DateTime OrderDate { get; set; }
    public OrderStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public int ItemCount { get; set; }
    public string ShippingAddress { get; set; }
    public DateTime? ConfirmationDate { get; set; }
    public DateTime? ShipmentDate { get; set; }
    public DateTime LastUpdated { get; set; }
    public List<OrderItemProjection> Items { get; set; } = new();
}

public class OrderItemProjection
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
}

public class CustomerSummaryProjection
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public CustomerType Type { get; set; }
    public int TotalOrderCount { get; set; }
    public decimal TotalOrderValue { get; set; }
    public DateTime? LastOrderDate { get; set; }
    public DateTime LastUpdated { get; set; }
}

// イベントハンドラーによるプロジェクション更新
public class OrderProjectionUpdater : 
    INotificationHandler<OrderCreated>,
    INotificationHandler<OrderConfirmed>,
    INotificationHandler<OrderShipped>,
    INotificationHandler<OrderCancelled>
{
    private readonly IProjectionDbContext _projectionContext;
    private readonly ILogger<OrderProjectionUpdater> _logger;
    
    public OrderProjectionUpdater(IProjectionDbContext projectionContext, 
                                ILogger<OrderProjectionUpdater> logger)
    {
        _projectionContext = projectionContext;
        _logger = logger;
    }
    
    public async Task Handle(OrderCreated notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating order projection for {OrderId}", notification.OrderId);
        
        try
        {
            // 顧客情報の取得
            var customer = await _projectionContext.Customers
                .FirstOrDefaultAsync(c => c.Id == notification.CustomerId.Value, cancellationToken);
            
            // 注文プロジェクションの作成
            var projection = new OrderProjection
            {
                Id = notification.OrderId.Value,
                OrderNumber = notification.OrderNumber,
                CustomerId = notification.CustomerId.Value,
                CustomerName = customer?.Name ?? "不明な顧客",
                OrderDate = notification.OrderDate,
                Status = OrderStatus.Draft,
                TotalAmount = notification.TotalAmount.Amount,
                ItemCount = notification.Items?.Count ?? 0,
                ShippingAddress = notification.ShippingAddress?.ToString(),
                LastUpdated = DateTime.UtcNow,
                Items = notification.Items?.Select(i => new OrderItemProjection
                {
                    Id = Guid.NewGuid(),
                    OrderId = notification.OrderId.Value,
                    ProductId = i.ProductId.Value,
                    ProductName = i.ProductName,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice.Amount,
                    Subtotal = i.UnitPrice.Amount * i.Quantity
                }).ToList() ?? new List<OrderItemProjection>()
            };
            
            _projectionContext.OrderProjections.Add(projection);
            
            // 顧客サマリーの更新
            await UpdateCustomerSummaryAsync(notification.CustomerId.Value, cancellationToken);
            
            await _projectionContext.SaveChangesAsync(cancellationToken);
            
            _logger.LogInformation("Order projection created successfully for {OrderId}", notification.OrderId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create order projection for {OrderId}", notification.OrderId);
            throw;
        }
    }
    
    public async Task Handle(OrderConfirmed notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating order projection for confirmation {OrderId}", notification.OrderId);
        
        var projection = await _projectionContext.OrderProjections
            .FirstOrDefaultAsync(p => p.Id == notification.OrderId.Value, cancellationToken);
        
        if (projection != null)
        {
            projection.Status = OrderStatus.Confirmed;
            projection.ConfirmationDate = notification.ConfirmationDate;
            projection.LastUpdated = DateTime.UtcNow;
            
            await _projectionContext.SaveChangesAsync(cancellationToken);
            
            _logger.LogInformation("Order projection updated for confirmation {OrderId}", notification.OrderId);
        }
        else
        {
            _logger.LogWarning("Order projection not found for confirmation {OrderId}", notification.OrderId);
        }
    }
    
    public async Task Handle(OrderShipped notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating order projection for shipment {OrderId}", notification.OrderId);
        
        var projection = await _projectionContext.OrderProjections
            .FirstOrDefaultAsync(p => p.Id == notification.OrderId.Value, cancellationToken);
        
        if (projection != null)
        {
            projection.Status = OrderStatus.Shipped;
            projection.ShipmentDate = notification.ShipmentDate;
            projection.LastUpdated = DateTime.UtcNow;
            
            await _projectionContext.SaveChangesAsync(cancellationToken);
        }
    }
    
    public async Task Handle(OrderCancelled notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating order projection for cancellation {OrderId}", notification.OrderId);
        
        var projection = await _projectionContext.OrderProjections
            .FirstOrDefaultAsync(p => p.Id == notification.OrderId.Value, cancellationToken);
        
        if (projection != null)
        {
            projection.Status = OrderStatus.Cancelled;
            projection.LastUpdated = DateTime.UtcNow;
            
            // 顧客サマリーの再計算
            await UpdateCustomerSummaryAsync(projection.CustomerId, cancellationToken);
            
            await _projectionContext.SaveChangesAsync(cancellationToken);
        }
    }
    
    private async Task UpdateCustomerSummaryAsync(Guid customerId, CancellationToken cancellationToken)
    {
        // 顧客の注文統計を再計算
        var orderStats = await _projectionContext.OrderProjections
            .Where(o => o.CustomerId == customerId && o.Status != OrderStatus.Cancelled)
            .GroupBy(o => o.CustomerId)
            .Select(g => new
            {
                TotalOrderCount = g.Count(),
                TotalOrderValue = g.Sum(o => o.TotalAmount),
                LastOrderDate = g.Max(o => o.OrderDate)
            })
            .FirstOrDefaultAsync(cancellationToken);
        
        var customerSummary = await _projectionContext.CustomerSummaries
            .FirstOrDefaultAsync(c => c.Id == customerId, cancellationToken);
        
        if (customerSummary != null && orderStats != null)
        {
            customerSummary.TotalOrderCount = orderStats.TotalOrderCount;
            customerSummary.TotalOrderValue = orderStats.TotalOrderValue;
            customerSummary.LastOrderDate = orderStats.LastOrderDate;
            customerSummary.LastUpdated = DateTime.UtcNow;
            
            // VIPステータスの更新
            if (customerSummary.TotalOrderValue >= 1000000 && customerSummary.Type != CustomerType.VIP)
            {
                customerSummary.Type = CustomerType.VIP;
            }
        }
    }
}

// プロジェクション用DbContext
public interface IProjectionDbContext
{
    DbSet<OrderProjection> OrderProjections { get; }
    DbSet<OrderItemProjection> OrderItemProjections { get; }
    DbSet<CustomerSummaryProjection> CustomerSummaries { get; }
    DbSet<Customer> Customers { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class ProjectionDbContext : DbContext, IProjectionDbContext
{
    public DbSet<OrderProjection> OrderProjections { get; set; }
    public DbSet<OrderItemProjection> OrderItemProjections { get; set; }
    public DbSet<CustomerSummaryProjection> CustomerSummaries { get; set; }
    public DbSet<Customer> Customers { get; set; }
    
    public ProjectionDbContext(DbContextOptions<ProjectionDbContext> options) : base(options) { }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // プロジェクション用の最適化されたモデル設定
        modelBuilder.Entity<OrderProjection>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.CustomerId);
            entity.HasIndex(e => e.OrderDate);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => new { e.CustomerId, e.OrderDate });
            
            entity.HasMany(e => e.Items)
                  .WithOne()
                  .HasForeignKey(i => i.OrderId);
        });
        
        modelBuilder.Entity<OrderItemProjection>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.OrderId);
            entity.HasIndex(e => e.ProductId);
        });
        
        modelBuilder.Entity<CustomerSummaryProjection>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.TotalOrderValue);
            entity.HasIndex(e => e.LastOrderDate);
        });
        
        // 読み取り専用ビューの設定（可能な場合）
        modelBuilder.Entity<CustomerSummaryProjection>()
                   .ToView("vw_customer_summary");
    }
}

// プロジェクション再構築サービス
public interface IProjectionRebuildService
{
    Task RebuildOrderProjectionsAsync(CancellationToken cancellationToken = default);
    Task RebuildCustomerSummariesAsync(CancellationToken cancellationToken = default);
}

public class ProjectionRebuildService : IProjectionRebuildService
{
    private readonly IWriteDbContext _writeContext;
    private readonly IProjectionDbContext _projectionContext;
    private readonly ILogger<ProjectionRebuildService> _logger;
    
    public ProjectionRebuildService(IWriteDbContext writeContext, 
                                  IProjectionDbContext projectionContext,
                                  ILogger<ProjectionRebuildService> logger)
    {
        _writeContext = writeContext;
        _projectionContext = projectionContext;
        _logger = logger;
    }
    
    public async Task RebuildOrderProjectionsAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting order projections rebuild");
        
        // 既存のプロジェクションをクリア
        _projectionContext.OrderProjections.RemoveRange(_projectionContext.OrderProjections);
        
        // ソースデータから再構築
        var orders = await _writeContext.Orders
            .Include(o => o.Items)
            .Include(o => o.Customer)
            .ToListAsync(cancellationToken);
        
        var projections = orders.Select(o => new OrderProjection
        {
            Id = o.Id.Value,
            OrderNumber = o.OrderNumber.Value,
            CustomerId = o.CustomerId.Value,
            CustomerName = o.Customer.Name,
            OrderDate = o.OrderDate,
            Status = o.Status,
            TotalAmount = o.TotalAmount.Amount,
            ItemCount = o.Items.Count,
            ShippingAddress = o.ShippingAddress.ToString(),
            ConfirmationDate = o.ConfirmationDate,
            LastUpdated = DateTime.UtcNow,
            Items = o.Items.Select(i => new OrderItemProjection
            {
                Id = Guid.NewGuid(),
                OrderId = o.Id.Value,
                ProductId = i.ProductId.Value,
                ProductName = i.ProductName,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice.Amount,
                Subtotal = i.Subtotal.Amount
            }).ToList()
        });
        
        _projectionContext.OrderProjections.AddRange(projections);
        await _projectionContext.SaveChangesAsync(cancellationToken);
        
        _logger.LogInformation("Completed order projections rebuild with {Count} projections", projections.Count());
    }
    
    public async Task RebuildCustomerSummariesAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting customer summaries rebuild");
        
        // 効率的なクエリで顧客サマリーを再構築
        var customerSummaries = await _projectionContext.OrderProjections
            .Where(o => o.Status != OrderStatus.Cancelled)
            .GroupBy(o => new { o.CustomerId, o.CustomerName })
            .Select(g => new CustomerSummaryProjection
            {
                Id = g.Key.CustomerId,
                Name = g.Key.CustomerName,
                TotalOrderCount = g.Count(),
                TotalOrderValue = g.Sum(o => o.TotalAmount),
                LastOrderDate = g.Max(o => o.OrderDate),
                Type = g.Sum(o => o.TotalAmount) >= 1000000 ? CustomerType.VIP : CustomerType.Regular,
                LastUpdated = DateTime.UtcNow
            })
            .ToListAsync(cancellationToken);
        
        // 既存のサマリーをクリアして新しいものを追加
        _projectionContext.CustomerSummaries.RemoveRange(_projectionContext.CustomerSummaries);
        _projectionContext.CustomerSummaries.AddRange(customerSummaries);
        
        await _projectionContext.SaveChangesAsync(cancellationToken);
        
        _logger.LogInformation("Completed customer summaries rebuild with {Count} summaries", customerSummaries.Count);
    }
}`,
      language: 'csharp'
    }
  ],
  exercises: [
    {
      id: 'ecommerce-cqrs-implementation',
      title: 'ECサイトのCQRS実装',
      description: 'ECサイトの商品管理システムでCQRSパターンを実装してください。商品の作成・更新（コマンド）と商品検索・カタログ表示（クエリ）を分離してください。',
      difficulty: 'intermediate',
      starterCode: `// CQRSパターンの実装を開始してください
public class CreateProductCommand : IRequest<Guid>
{
    public string Name { get; set; }
    public decimal Price { get; set; }
    // TODO: 必要なプロパティを追加
}`,
      requirements: [
        'CreateProductCommand、UpdateProductCommandの実装',
        'GetProductCatalogQuery、SearchProductsQueryの実装',
        'コマンドハンドラーとクエリハンドラーの実装',
        '読み取り専用プロジェクションの設計'
      ]
    },
    {
      id: 'mediatr-pipeline-behaviors',
      title: 'MediatRを使用したCQRS統合',
      description: 'MediatRライブラリを使用してCQRSパターンを実装し、パイプライン動作でロギングとバリデーションを追加してください。',
      difficulty: 'advanced',
      starterCode: `public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
{
    // TODO: ロギングパイプラインを実装
}`,
      requirements: [
        'MediatRベースのコマンドとクエリ実装',
        'LoggingBehaviorとValidationBehaviorの実装',
        'Web APIコントローラーでの統合',
        'エラーハンドリングとレスポンス設計'
      ]
    },
    {
      id: 'event-driven-projection-system',
      title: 'イベント駆動プロジェクション',
      description: 'ドメインイベントを使用して読み取り専用プロジェクションを自動更新するシステムを実装してください。',
      difficulty: 'advanced',
      starterCode: `public class OrderProjectionUpdater : INotificationHandler<OrderCreated>
{
    public async Task Handle(OrderCreated notification, CancellationToken cancellationToken)
    {
        // TODO: プロジェクション更新ロジックを実装
    }
}`,
      requirements: [
        'プロジェクション用のデータモデル設計',
        'イベントハンドラーによるプロジェクション更新',
        'プロジェクション再構築機能',
        '最終的整合性の考慮事項'
      ]
    }
  ]
};