import type { Lesson } from '../../../../features/learning/types';

export const dddArchitectureLesson: Lesson = {
  id: 'ddd-architecture',
  moduleId: 'ddd-implementation',
  title: 'DDDアーキテクチャパターン - 実装に最適な構造を設計する',
  description: 'レイヤードアーキテクチャ、クリーンアーキテクチャ、ヘキサゴナルアーキテクチャなど、DDDを支える各種アーキテクチャパターンの理論と実装を詳しく学習します',
  duration: 120,
  order: 9,
  content: `
# DDDアーキテクチャパターン

ドメイン駆動設計を効果的に実装するためには、適切なアーキテクチャパターンの選択と実装が重要です。本レッスンでは、DDDでよく使用される主要なアーキテクチャパターンについて詳しく学習します。

## アーキテクチャパターンの概要

### なぜアーキテクチャが重要なのか？

**アーキテクチャの役割**：

1. **関心の分離**: 異なる責任を明確に分離
2. **依存関係の管理**: 依存の方向を制御
3. **テスタビリティ**: 単体テストが書きやすい構造
4. **保守性**: 変更に強い柔軟な設計
5. **可読性**: コードの意図が理解しやすい構造

### DDDに適したアーキテクチャの特徴

- **ドメインロジックの保護**: ビジネスルールがインフラストラクチャの詳細から分離されている
- **依存関係の逆転**: ドメイン層が他の層に依存しない
- **明確な境界**: 各層の責任が明確に定義されている

## レイヤードアーキテクチャ（Layered Architecture）

### 基本構造

従来のレイヤードアーキテクチャをDDD向けに改良した構造：

\`\`\`
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Controllers, Views, Web API)          │
└─────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────┐
│         Application Layer               │
│  (Use Cases, Application Services)      │
└─────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────┐
│           Domain Layer                  │
│  (Entities, Value Objects, Services)    │
└─────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────┐
│        Infrastructure Layer             │
│  (Repositories, External Services)      │
└─────────────────────────────────────────┘
\`\`\`

### 実装例：プロジェクト構造

\`\`\`csharp
// プロジェクト構造
ECommerce.sln
├── src/
│   ├── ECommerce.Domain/           // ドメイン層
│   │   ├── Entities/
│   │   ├── ValueObjects/
│   │   ├── Services/
│   │   └── Interfaces/
│   ├── ECommerce.Application/      // アプリケーション層
│   │   ├── Services/
│   │   ├── DTOs/
│   │   └── Interfaces/
│   ├── ECommerce.Infrastructure/   // インフラストラクチャ層
│   │   ├── Repositories/
│   │   ├── ExternalServices/
│   │   └── Data/
│   └── ECommerce.Web/             // プレゼンテーション層
│       ├── Controllers/
│       ├── Models/
│       └── Views/
└── tests/
    ├── ECommerce.Domain.Tests/
    ├── ECommerce.Application.Tests/
    └── ECommerce.Web.Tests/
\`\`\`

### ドメイン層の実装

\`\`\`csharp
// Domain/Entities/Order.cs
namespace ECommerce.Domain.Entities
{
    public class Order : AggregateRoot<OrderId>
    {
        public CustomerId CustomerId { get; private set; }
        public OrderStatus Status { get; private set; }
        public Money TotalAmount { get; private set; }
        
        private readonly List<OrderItem> _items = new();
        public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();

        public Order(CustomerId customerId, IEnumerable<OrderItem> items)
        {
            Id = OrderId.New();
            CustomerId = customerId ?? throw new ArgumentNullException(nameof(customerId));
            
            foreach (var item in items)
            {
                _items.Add(item);
            }
            
            TotalAmount = CalculateTotalAmount();
            Status = OrderStatus.Draft;
            
            AddDomainEvent(new OrderCreated(Id, CustomerId, TotalAmount));
        }

        public void Confirm(IOrderValidationService validationService)
        {
            if (Status != OrderStatus.Draft)
                throw new InvalidOperationException("Only draft orders can be confirmed");

            if (!validationService.CanConfirmOrder(this))
                throw new OrderValidationException("Order cannot be confirmed");

            Status = OrderStatus.Confirmed;
            AddDomainEvent(new OrderConfirmed(Id, CustomerId, TotalAmount));
        }

        private Money CalculateTotalAmount()
        {
            return _items.Aggregate(
                Money.Zero, 
                (sum, item) => sum.Add(item.LineTotal)
            );
        }
    }
}

// Domain/Services/IOrderValidationService.cs
namespace ECommerce.Domain.Services
{
    public interface IOrderValidationService
    {
        bool CanConfirmOrder(Order order);
    }

    public class OrderValidationService : IOrderValidationService
    {
        private readonly ICustomerRepository _customerRepository;
        private readonly IInventoryService _inventoryService;

        public OrderValidationService(ICustomerRepository customerRepository, 
                                    IInventoryService inventoryService)
        {
            _customerRepository = customerRepository ?? throw new ArgumentNullException(nameof(customerRepository));
            _inventoryService = inventoryService ?? throw new ArgumentNullException(nameof(inventoryService));
        }

        public bool CanConfirmOrder(Order order)
        {
            // 顧客の信用チェック
            var customer = _customerRepository.GetByIdAsync(order.CustomerId).Result;
            if (customer?.CreditStatus != CreditStatus.Good)
                return false;

            // 在庫チェック
            foreach (var item in order.Items)
            {
                if (!_inventoryService.IsAvailable(item.ProductId, item.Quantity))
                    return false;
            }

            return true;
        }
    }
}
\`\`\`

### アプリケーション層の実装

\`\`\`csharp
// Application/Services/OrderApplicationService.cs
namespace ECommerce.Application.Services
{
    public class OrderApplicationService : IOrderApplicationService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly ICustomerRepository _customerRepository;
        private readonly IOrderValidationService _validationService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<OrderApplicationService> _logger;

        public OrderApplicationService(
            IOrderRepository orderRepository,
            ICustomerRepository customerRepository,
            IOrderValidationService validationService,
            IUnitOfWork unitOfWork,
            ILogger<OrderApplicationService> logger)
        {
            _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
            _customerRepository = customerRepository ?? throw new ArgumentNullException(nameof(customerRepository));
            _validationService = validationService ?? throw new ArgumentNullException(nameof(validationService));
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<OrderDto> CreateOrderAsync(CreateOrderCommand command, 
                                                   CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Creating order for customer {CustomerId}", command.CustomerId);

            // 顧客の存在確認
            var customer = await _customerRepository.GetByIdAsync(new CustomerId(command.CustomerId), cancellationToken);
            if (customer == null)
                throw new CustomerNotFoundException(command.CustomerId);

            // 注文項目の構築
            var orderItems = command.Items.Select(item => 
                new OrderItem(
                    new ProductId(item.ProductId), 
                    item.Quantity, 
                    new Money(item.UnitPrice)
                )).ToList();

            // ドメインオブジェクトの作成
            var order = new Order(customer.Id, orderItems);

            // 永続化
            await _orderRepository.AddAsync(order, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Order {OrderId} created successfully", order.Id);

            return MapToDto(order);
        }

        public async Task ConfirmOrderAsync(ConfirmOrderCommand command, 
                                          CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Confirming order {OrderId}", command.OrderId);

            var order = await _orderRepository.GetByIdAsync(new OrderId(command.OrderId), cancellationToken);
            if (order == null)
                throw new OrderNotFoundException(command.OrderId);

            // ドメインロジックの実行
            order.Confirm(_validationService);

            // 永続化
            await _orderRepository.UpdateAsync(order, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Order {OrderId} confirmed successfully", order.Id);
        }

        private static OrderDto MapToDto(Order order)
        {
            return new OrderDto
            {
                Id = order.Id.Value,
                CustomerId = order.CustomerId.Value,
                Status = order.Status.ToString(),
                TotalAmount = order.TotalAmount.Amount,
                Items = order.Items.Select(item => new OrderItemDto
                {
                    ProductId = item.ProductId.Value,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice.Amount,
                    LineTotal = item.LineTotal.Amount
                }).ToList()
            };
        }
    }

    // Command/Query objects
    public record CreateOrderCommand(
        Guid CustomerId,
        List<CreateOrderItemCommand> Items
    );

    public record CreateOrderItemCommand(
        Guid ProductId,
        int Quantity,
        decimal UnitPrice
    );

    public record ConfirmOrderCommand(Guid OrderId);
}
\`\`\`

## ヘキサゴナルアーキテクチャ（Ports and Adapters）

### 基本概念

ヘキサゴナルアーキテクチャは、アプリケーションコアを外部の詳細から完全に分離するパターンです：

\`\`\`
                    ┌─────────────────┐
                    │   UI Adapter    │
                    └─────────────────┘
                           │ Port
                           │
           ┌─────────────────────────────────────┐
           │                                     │
           │        Application Core             │
           │                                     │
           │  ┌─────────────────────────────┐    │
           │  │        Domain Model         │    │
           │  │                             │    │
           │  └─────────────────────────────┘    │
           │                                     │
           └─────────────────────────────────────┘
                           │ Port
                           │
                    ┌─────────────────┐
                    │ Database Adapter│
                    └─────────────────┘
\`\`\`

### ポートとアダプターの実装

\`\`\`csharp
// Application/Ports/IOrderRepository.cs (Port)
namespace ECommerce.Application.Ports
{
    public interface IOrderRepository
    {
        Task<Order> GetByIdAsync(OrderId orderId, CancellationToken cancellationToken = default);
        Task AddAsync(Order order, CancellationToken cancellationToken = default);
        Task UpdateAsync(Order order, CancellationToken cancellationToken = default);
        Task<IEnumerable<Order>> GetByCustomerIdAsync(CustomerId customerId, CancellationToken cancellationToken = default);
    }
}

// Infrastructure/Adapters/SqlOrderRepository.cs (Adapter)
namespace ECommerce.Infrastructure.Adapters
{
    public class SqlOrderRepository : IOrderRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SqlOrderRepository> _logger;

        public SqlOrderRepository(ApplicationDbContext context, ILogger<SqlOrderRepository> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<Order> GetByIdAsync(OrderId orderId, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Getting order {OrderId}", orderId);

            var orderEntity = await _context.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == orderId.Value, cancellationToken);

            if (orderEntity == null)
                return null;

            return MapToDomainObject(orderEntity);
        }

        public async Task AddAsync(Order order, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Adding order {OrderId}", order.Id);

            var orderEntity = MapToEntity(order);
            _context.Orders.Add(orderEntity);
            
            // ドメインイベントの処理
            await PublishDomainEventsAsync(order, cancellationToken);
        }

        public async Task UpdateAsync(Order order, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Updating order {OrderId}", order.Id);

            var existingEntity = await _context.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == order.Id.Value, cancellationToken);

            if (existingEntity == null)
                throw new OrderNotFoundException(order.Id.Value);

            MapToExistingEntity(order, existingEntity);
            await PublishDomainEventsAsync(order, cancellationToken);
        }

        private Order MapToDomainObject(OrderEntity entity)
        {
            var items = entity.Items.Select(i => new OrderItem(
                new ProductId(i.ProductId),
                i.Quantity,
                new Money(i.UnitPrice)
            )).ToList();

            // プライベートコンストラクタを使用してエンティティを再構築
            var order = Order.Reconstruct(
                new OrderId(entity.Id),
                new CustomerId(entity.CustomerId),
                entity.Status,
                items
            );

            return order;
        }

        private async Task PublishDomainEventsAsync(Order order, CancellationToken cancellationToken)
        {
            var domainEvents = order.DomainEvents.ToList();
            order.ClearDomainEvents();

            foreach (var domainEvent in domainEvents)
            {
                await _mediator.Publish(domainEvent, cancellationToken);
            }
        }
    }
}
\`\`\`

## クリーンアーキテクチャ（Clean Architecture）

### 依存関係のルール

クリーンアーキテクチャの最重要原則は**依存関係のルール**です：

\`\`\`
外側の層は内側の層に依存できるが、
内側の層は外側の層に依存してはならない
\`\`\`

### レイヤー構造

\`\`\`
┌─────────────────────────────────────────────┐
│                Framework                    │  ← 外側
│  (Web, Database, External Services)        │
├─────────────────────────────────────────────┤
│            Interface Adapters               │
│  (Controllers, Presenters, Gateways)       │
├─────────────────────────────────────────────┤
│              Use Cases                      │
│  (Application Business Rules)              │
├─────────────────────────────────────────────┤
│               Entities                      │  ← 内側
│  (Enterprise Business Rules)               │
└─────────────────────────────────────────────┘
\`\`\`

### 実装例：依存関係の逆転

\`\`\`csharp
// UseCases/CreateOrder/CreateOrderUseCase.cs
namespace ECommerce.UseCases.CreateOrder
{
    public class CreateOrderUseCase : ICreateOrderUseCase
    {
        private readonly IOrderRepository _orderRepository;
        private readonly ICustomerRepository _customerRepository;
        private readonly IOrderValidationService _validationService;
        private readonly ICreateOrderOutputPort _outputPort;

        public CreateOrderUseCase(
            IOrderRepository orderRepository,
            ICustomerRepository customerRepository,
            IOrderValidationService validationService,
            ICreateOrderOutputPort outputPort)
        {
            _orderRepository = orderRepository;
            _customerRepository = customerRepository;
            _validationService = validationService;
            _outputPort = outputPort;
        }

        public async Task ExecuteAsync(CreateOrderInputData inputData, 
                                     CancellationToken cancellationToken = default)
        {
            try
            {
                // 1. 入力データの検証
                if (!IsValidInput(inputData))
                {
                    await _outputPort.HandleInvalidInputAsync(
                        "Invalid input data", cancellationToken);
                    return;
                }

                // 2. ビジネスルールの実行
                var customer = await _customerRepository.GetByIdAsync(
                    new CustomerId(inputData.CustomerId), cancellationToken);
                
                if (customer == null)
                {
                    await _outputPort.HandleCustomerNotFoundAsync(
                        inputData.CustomerId, cancellationToken);
                    return;
                }

                var orderItems = inputData.Items.Select(item => 
                    new OrderItem(
                        new ProductId(item.ProductId),
                        item.Quantity,
                        new Money(item.UnitPrice)
                    )).ToList();

                var order = new Order(customer.Id, orderItems);

                if (!_validationService.CanCreateOrder(order))
                {
                    await _outputPort.HandleValidationFailureAsync(
                        "Order validation failed", cancellationToken);
                    return;
                }

                // 3. 永続化
                await _orderRepository.AddAsync(order, cancellationToken);

                // 4. 成功レスポンス
                var outputData = new CreateOrderOutputData(
                    order.Id.Value,
                    order.CustomerId.Value,
                    order.TotalAmount.Amount,
                    order.Status.ToString()
                );

                await _outputPort.HandleSuccessAsync(outputData, cancellationToken);
            }
            catch (Exception ex)
            {
                await _outputPort.HandleErrorAsync(ex.Message, cancellationToken);
            }
        }

        private bool IsValidInput(CreateOrderInputData inputData)
        {
            return inputData != null && 
                   inputData.CustomerId != Guid.Empty && 
                   inputData.Items?.Any() == true;
        }
    }

    // Input/Output Data Transfer Objects
    public record CreateOrderInputData(
        Guid CustomerId,
        List<CreateOrderItemData> Items
    );

    public record CreateOrderItemData(
        Guid ProductId,
        int Quantity,
        decimal UnitPrice
    );

    public record CreateOrderOutputData(
        Guid OrderId,
        Guid CustomerId,
        decimal TotalAmount,
        string Status
    );

    // Output Port Interface
    public interface ICreateOrderOutputPort
    {
        Task HandleSuccessAsync(CreateOrderOutputData outputData, CancellationToken cancellationToken);
        Task HandleInvalidInputAsync(string message, CancellationToken cancellationToken);
        Task HandleCustomerNotFoundAsync(Guid customerId, CancellationToken cancellationToken);
        Task HandleValidationFailureAsync(string message, CancellationToken cancellationToken);
        Task HandleErrorAsync(string errorMessage, CancellationToken cancellationToken);
    }
}

// Interface Adapters/Controllers/OrderController.cs
namespace ECommerce.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : ControllerBase, ICreateOrderOutputPort
    {
        private readonly ICreateOrderUseCase _createOrderUseCase;
        private readonly ILogger<OrderController> _logger;

        // レスポンスを一時保存するためのフィールド
        private IActionResult _response;

        public OrderController(ICreateOrderUseCase createOrderUseCase, ILogger<OrderController> logger)
        {
            _createOrderUseCase = createOrderUseCase;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
        {
            var inputData = new CreateOrderInputData(
                request.CustomerId,
                request.Items.Select(i => new CreateOrderItemData(
                    i.ProductId, i.Quantity, i.UnitPrice)).ToList()
            );

            await _createOrderUseCase.ExecuteAsync(inputData);
            return _response;
        }

        // Output Port Implementation
        public Task HandleSuccessAsync(CreateOrderOutputData outputData, CancellationToken cancellationToken)
        {
            _response = Ok(new CreateOrderResponse
            {
                OrderId = outputData.OrderId,
                CustomerId = outputData.CustomerId,
                TotalAmount = outputData.TotalAmount,
                Status = outputData.Status
            });
            return Task.CompletedTask;
        }

        public Task HandleInvalidInputAsync(string message, CancellationToken cancellationToken)
        {
            _response = BadRequest(new { Error = message });
            return Task.CompletedTask;
        }

        public Task HandleCustomerNotFoundAsync(Guid customerId, CancellationToken cancellationToken)
        {
            _response = NotFound(new { Error = $"Customer {customerId} not found" });
            return Task.CompletedTask;
        }

        public Task HandleValidationFailureAsync(string message, CancellationToken cancellationToken)
        {
            _response = BadRequest(new { Error = message });
            return Task.CompletedTask;
        }

        public Task HandleErrorAsync(string errorMessage, CancellationToken cancellationToken)
        {
            _logger.LogError("Error creating order: {ErrorMessage}", errorMessage);
            _response = StatusCode(500, new { Error = "Internal server error" });
            return Task.CompletedTask;
        }
    }
}
\`\`\`

## アーキテクチャの選択指針

### プロジェクトサイズによる選択

**小規模プロジェクト（〜10人月）**:
- シンプルなレイヤードアーキテクチャ
- 過度な抽象化を避ける

**中規模プロジェクト（10〜50人月）**:
- ヘキサゴナルアーキテクチャ
- テスタビリティを重視

**大規模プロジェクト（50人月〜）**:
- クリーンアーキテクチャ
- マイクロサービスとの組み合わせ

### チーム構成による選択

**経験豊富なチーム**:
- より複雑なアーキテクチャも採用可能
- 抽象化レベルを高くできる

**混合チーム**:
- 理解しやすいパターンを選択
- 段階的な導入を検討

## 実践課題

### 課題1: レイヤードアーキテクチャの実装

以下の要件を満たすEコマースシステムをレイヤードアーキテクチャで実装してください：

1. 商品カタログ管理
2. 注文処理
3. 顧客管理
4. 在庫管理

### 課題2: ヘキサゴナルアーキテクチャへの変換

課題1で作成したシステムをヘキサゴナルアーキテクチャに変換してください：

1. ポートとアダプターの定義
2. 依存関係の逆転
3. テスタビリティの向上

### 課題3: クリーンアーキテクチャでのユースケース実装

以下のユースケースをクリーンアーキテクチャのパターンで実装してください：

1. 商品検索ユースケース
2. 注文キャンセルユースケース
3. 顧客登録ユースケース

これらの課題を通じて、各アーキテクチャパターンの特徴と使い分けを理解することができます。
`,
  codeExamples: [
    {
      id: 'layered-domain-entity',
      title: 'レイヤードアーキテクチャのドメインエンティティ',
      language: 'csharp',
      code: `public class Order : AggregateRoot<OrderId>
{
    public CustomerId CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    public Money TotalAmount { get; private set; }
    
    private readonly List<OrderItem> _items = new();
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();

    public Order(CustomerId customerId, IEnumerable<OrderItem> items)
    {
        Id = OrderId.New();
        CustomerId = customerId ?? throw new ArgumentNullException(nameof(customerId));
        
        foreach (var item in items)
        {
            _items.Add(item);
        }
        
        TotalAmount = CalculateTotalAmount();
        Status = OrderStatus.Draft;
        
        AddDomainEvent(new OrderCreated(Id, CustomerId, TotalAmount));
    }

    public void Confirm(IOrderValidationService validationService)
    {
        if (Status != OrderStatus.Draft)
            throw new InvalidOperationException("Only draft orders can be confirmed");

        if (!validationService.CanConfirmOrder(this))
            throw new OrderValidationException("Order cannot be confirmed");

        Status = OrderStatus.Confirmed;
        AddDomainEvent(new OrderConfirmed(Id, CustomerId, TotalAmount));
    }
}`,
      description: 'レイヤードアーキテクチャでのドメインエンティティ実装例'
    },
    {
      id: 'application-service',
      title: 'アプリケーションサービス',
      language: 'csharp',
      code: `public class OrderApplicationService : IOrderApplicationService
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IOrderValidationService _validationService;
    private readonly IUnitOfWork _unitOfWork;

    public async Task<OrderDto> CreateOrderAsync(CreateOrderCommand command, 
                                               CancellationToken cancellationToken = default)
    {
        // 顧客の存在確認
        var customer = await _customerRepository.GetByIdAsync(new CustomerId(command.CustomerId), cancellationToken);
        if (customer == null)
            throw new CustomerNotFoundException(command.CustomerId);

        // 注文項目の構築
        var orderItems = command.Items.Select(item => 
            new OrderItem(
                new ProductId(item.ProductId), 
                item.Quantity, 
                new Money(item.UnitPrice)
            )).ToList();

        // ドメインオブジェクトの作成
        var order = new Order(customer.Id, orderItems);

        // 永続化
        await _orderRepository.AddAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(order);
    }
}`,
      description: 'アプリケーション層でのオーケストレーション例'
    },
    {
      id: 'hexagonal-port-adapter',
      title: 'ヘキサゴナルアーキテクチャのポートとアダプター',
      language: 'csharp',
      code: `// Port (Interface)
public interface IOrderRepository
{
    Task<Order> GetByIdAsync(OrderId orderId, CancellationToken cancellationToken = default);
    Task AddAsync(Order order, CancellationToken cancellationToken = default);
    Task UpdateAsync(Order order, CancellationToken cancellationToken = default);
}

// Adapter (Implementation)
public class SqlOrderRepository : IOrderRepository
{
    private readonly ApplicationDbContext _context;

    public async Task<Order> GetByIdAsync(OrderId orderId, CancellationToken cancellationToken = default)
    {
        var orderEntity = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId.Value, cancellationToken);

        if (orderEntity == null)
            return null;

        return MapToDomainObject(orderEntity);
    }

    public async Task AddAsync(Order order, CancellationToken cancellationToken = default)
    {
        var orderEntity = MapToEntity(order);
        _context.Orders.Add(orderEntity);
        
        await PublishDomainEventsAsync(order, cancellationToken);
    }
}`,
      description: 'ポートとアダプターパターンの実装例'
    },
    {
      id: 'clean-architecture-usecase',
      title: 'クリーンアーキテクチャのユースケース',
      language: 'csharp',
      code: `public class CreateOrderUseCase : ICreateOrderUseCase
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly ICreateOrderOutputPort _outputPort;

    public async Task ExecuteAsync(CreateOrderInputData inputData, 
                                 CancellationToken cancellationToken = default)
    {
        try
        {
            // 1. 入力データの検証
            if (!IsValidInput(inputData))
            {
                await _outputPort.HandleInvalidInputAsync(
                    "Invalid input data", cancellationToken);
                return;
            }

            // 2. ビジネスルールの実行
            var customer = await _customerRepository.GetByIdAsync(
                new CustomerId(inputData.CustomerId), cancellationToken);
            
            if (customer == null)
            {
                await _outputPort.HandleCustomerNotFoundAsync(
                    inputData.CustomerId, cancellationToken);
                return;
            }

            var order = new Order(customer.Id, orderItems);
            await _orderRepository.AddAsync(order, cancellationToken);

            // 3. 成功レスポンス
            var outputData = new CreateOrderOutputData(order.Id.Value, order.TotalAmount.Amount);
            await _outputPort.HandleSuccessAsync(outputData, cancellationToken);
        }
        catch (Exception ex)
        {
            await _outputPort.HandleErrorAsync(ex.Message, cancellationToken);
        }
    }
}`,
      description: 'クリーンアーキテクチャでのユースケース実装'
    },
    {
      id: 'dependency-injection-setup',
      title: '依存性注入の設定',
      language: 'csharp',
      code: `// Program.cs または Startup.cs
public void ConfigureServices(IServiceCollection services)
{
    // Infrastructure Layer
    services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(connectionString));
    
    services.AddScoped<IOrderRepository, SqlOrderRepository>();
    services.AddScoped<ICustomerRepository, SqlCustomerRepository>();
    services.AddScoped<IUnitOfWork, UnitOfWork>();

    // Application Layer
    services.AddScoped<IOrderApplicationService, OrderApplicationService>();
    services.AddScoped<ICustomerApplicationService, CustomerApplicationService>();

    // Domain Services
    services.AddScoped<IOrderValidationService, OrderValidationService>();
    services.AddScoped<IPricingService, PricingService>();

    // Use Cases (for Clean Architecture)
    services.AddScoped<ICreateOrderUseCase, CreateOrderUseCase>();
    services.AddScoped<IConfirmOrderUseCase, ConfirmOrderUseCase>();

    // Output Ports are typically resolved per request
    services.AddScoped<ICreateOrderOutputPort>(provider => 
        provider.GetRequiredService<OrderController>());
}`,
      description: '各アーキテクチャパターンでの依存性注入設定例'
    }
  ],
  exercises: [
    {
      id: 'implement-layered-architecture',
      title: 'レイヤードアーキテクチャの実装',
      description: 'Eコマースシステムの注文管理機能をレイヤードアーキテクチャで実装してください。各層の責任を明確に分離し、適切な依存関係を保ってください。',
      difficulty: 'medium',
      estimatedTime: 45,
      starterCode: `// Domain Layer
public class Order : AggregateRoot<OrderId>
{
    // TODO: 基本プロパティとビジネスロジックを実装
}

// Application Layer
public class OrderApplicationService : IOrderApplicationService
{
    // TODO: ユースケースのオーケストレーションを実装
}

// Infrastructure Layer
public class SqlOrderRepository : IOrderRepository
{
    // TODO: データ永続化を実装
}

// Presentation Layer
[ApiController]
public class OrderController : ControllerBase
{
    // TODO: Web API エンドポイントを実装
}`,
      solution: `// 完全な実装例を提供
public class Order : AggregateRoot<OrderId>
{
    public CustomerId CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    public Money TotalAmount { get; private set; }
    
    private readonly List<OrderItem> _items = new();
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();

    public Order(CustomerId customerId, IEnumerable<OrderItem> items)
    {
        Id = OrderId.New();
        CustomerId = customerId;
        _items.AddRange(items);
        TotalAmount = CalculateTotalAmount();
        Status = OrderStatus.Draft;
    }

    public void Confirm()
    {
        if (Status != OrderStatus.Draft)
            throw new InvalidOperationException("Only draft orders can be confirmed");
            
        Status = OrderStatus.Confirmed;
        AddDomainEvent(new OrderConfirmed(Id));
    }

    private Money CalculateTotalAmount()
    {
        return _items.Aggregate(Money.Zero, (sum, item) => sum.Add(item.LineTotal));
    }
}`,
      hints: [
        'ドメイン層には外部依存を含めないでください',
        'アプリケーション層でトランザクション境界を管理してください',
        'インフラストラクチャ層はインターフェースを通じてのみアクセスしてください'
      ]
    },
    {
      id: 'convert-to-hexagonal',
      title: 'ヘキサゴナルアーキテクチャへの変換',
      description: '課題1で実装したレイヤードアーキテクチャをヘキサゴナルアーキテクチャに変換してください。ポートとアダプターの概念を適用し、テスタビリティを向上させてください。',
      difficulty: 'hard',
      estimatedTime: 60,
      starterCode: `// Primary Port (Driving Port)
public interface IOrderManagementPort
{
    // TODO: アプリケーションが提供する機能を定義
}

// Secondary Port (Driven Port)
public interface IOrderPersistencePort
{
    // TODO: 外部依存への要求を定義
}

// Primary Adapter
public class OrderController : ControllerBase
{
    // TODO: Web API アダプターを実装
}

// Secondary Adapter
public class SqlOrderPersistenceAdapter : IOrderPersistencePort
{
    // TODO: データベースアダプターを実装
}`,
      solution: `// Primary Port
public interface IOrderManagementPort
{
    Task<OrderDto> CreateOrderAsync(CreateOrderCommand command, CancellationToken cancellationToken);
    Task ConfirmOrderAsync(ConfirmOrderCommand command, CancellationToken cancellationToken);
}

// Secondary Port
public interface IOrderPersistencePort
{
    Task<Order> GetByIdAsync(OrderId orderId, CancellationToken cancellationToken);
    Task SaveAsync(Order order, CancellationToken cancellationToken);
}

// Application Core
public class OrderManagementService : IOrderManagementPort
{
    private readonly IOrderPersistencePort _persistencePort;
    
    public async Task<OrderDto> CreateOrderAsync(CreateOrderCommand command, CancellationToken cancellationToken)
    {
        var order = new Order(new CustomerId(command.CustomerId), command.Items);
        await _persistencePort.SaveAsync(order, cancellationToken);
        return MapToDto(order);
    }
}`,
      hints: [
        'ポートはアプリケーションコアが定義するインターフェースです',
        'アダプターはポートを実装する具体的なクラスです',
        'アプリケーションコアは外側の詳細を知ってはいけません'
      ]
    },
    {
      id: 'clean-architecture-usecase',
      title: 'クリーンアーキテクチャでのユースケース実装',
      description: '商品検索機能をクリーンアーキテクチャのパターンで実装してください。Input/Output Port、Use Case、Adapterの概念を正しく適用してください。',
      difficulty: 'hard',
      estimatedTime: 50,
      starterCode: `// Use Case Input Data
public record SearchProductsInputData
{
    // TODO: 検索条件を定義
}

// Use Case Output Data
public record SearchProductsOutputData
{
    // TODO: 検索結果を定義
}

// Output Port
public interface ISearchProductsOutputPort
{
    // TODO: 結果の受け渡し方法を定義
}

// Use Case
public class SearchProductsUseCase : ISearchProductsUseCase
{
    // TODO: ビジネスロジックを実装
}`,
      solution: `public record SearchProductsInputData(
    string SearchTerm,
    string Category,
    decimal? MinPrice,
    decimal? MaxPrice,
    int PageNumber,
    int PageSize
);

public record SearchProductsOutputData(
    IEnumerable<ProductDto> Products,
    int TotalCount,
    int PageNumber,
    int TotalPages
);

public interface ISearchProductsOutputPort
{
    Task HandleSuccessAsync(SearchProductsOutputData outputData, CancellationToken cancellationToken);
    Task HandleNoResultsAsync(CancellationToken cancellationToken);
    Task HandleInvalidInputAsync(string message, CancellationToken cancellationToken);
    Task HandleErrorAsync(string errorMessage, CancellationToken cancellationToken);
}

public class SearchProductsUseCase : ISearchProductsUseCase
{
    private readonly IProductRepository _productRepository;
    private readonly ISearchProductsOutputPort _outputPort;

    public async Task ExecuteAsync(SearchProductsInputData inputData, CancellationToken cancellationToken)
    {
        if (!IsValidInput(inputData))
        {
            await _outputPort.HandleInvalidInputAsync("Invalid search parameters", cancellationToken);
            return;
        }

        var searchCriteria = new ProductSearchCriteria(
            inputData.SearchTerm,
            inputData.Category,
            inputData.MinPrice,
            inputData.MaxPrice
        );

        var (products, totalCount) = await _productRepository.SearchAsync(
            searchCriteria, inputData.PageNumber, inputData.PageSize, cancellationToken);

        if (!products.Any())
        {
            await _outputPort.HandleNoResultsAsync(cancellationToken);
            return;
        }

        var outputData = new SearchProductsOutputData(
            products.Select(MapToDto),
            totalCount,
            inputData.PageNumber,
            (int)Math.Ceiling((double)totalCount / inputData.PageSize)
        );

        await _outputPort.HandleSuccessAsync(outputData, cancellationToken);
    }
}`,
      hints: [
        'Input/Output Dataは単純なデータ構造にしてください',
        'Use Caseはビジネスルールの実行に集中してください',
        'Output Portを通じて結果を伝達してください'
      ]
    }
  ]
};