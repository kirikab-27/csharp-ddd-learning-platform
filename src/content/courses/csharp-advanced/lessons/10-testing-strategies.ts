import type { Lesson } from '../../../../features/learning/types';

export const testingStrategiesLesson: Lesson = {
  id: 'testing-strategies',
  moduleId: 'ddd-implementation',
  title: 'DDDテスト戦略 - 信頼性の高いドメインロジックを保証する',
  description: 'ドメイン駆動設計における効果的なテスト戦略、単体テスト、統合テスト、受け入れテストの実装手法を詳しく学習します',
  duration: 100,
  order: 10,
  content: `
# DDDテスト戦略

ドメイン駆動設計では、複雑なビジネスロジックを正確に実装し、長期的に保守可能なシステムを構築することが重要です。適切なテスト戦略により、ドメインモデルの品質を保証し、リファクタリングを安全に行うことができます。

## テストピラミッドとDDD

### DDDにおけるテストの分類

**テストピラミッド**をDDDの文脈で理解する：

\`\`\`
        ┌─────────────────┐
        │  E2E Tests      │  ← 少数、高コスト
        │ (User Journey)  │
        ├─────────────────┤
        │Integration Tests│  ← 中程度
        │(Infrastructure) │
        ├─────────────────┤
        │  Unit Tests     │  ← 多数、低コスト
        │ (Domain Logic)  │
        └─────────────────┘
\`\`\`

### DDDに特化したテスト分類

1. **ドメインロジックテスト**: エンティティ、値オブジェクト、ドメインサービス
2. **アプリケーションサービステスト**: ユースケースのオーケストレーション
3. **統合テスト**: リポジトリ、外部サービス連携
4. **受け入れテスト**: ビジネス要件の検証

## ドメインロジックの単体テスト

### エンティティのテスト

エンティティのビジネスルールとドメインイベントをテストします：

\`\`\`csharp
// Domain/Entities/Order.cs
public class Order : AggregateRoot<OrderId>
{
    public CustomerId CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    public Money TotalAmount { get; private set; }
    
    private readonly List<OrderItem> _items = new();
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();

    public Order(CustomerId customerId, IEnumerable<OrderItem> items)
    {
        if (customerId == null)
            throw new ArgumentNullException(nameof(customerId));
        
        var itemsList = items?.ToList() ?? throw new ArgumentNullException(nameof(items));
        if (!itemsList.Any())
            throw new ArgumentException("Order must have at least one item", nameof(items));

        Id = OrderId.New();
        CustomerId = customerId;
        _items.AddRange(itemsList);
        TotalAmount = CalculateTotalAmount();
        Status = OrderStatus.Draft;
        
        AddDomainEvent(new OrderCreated(Id, CustomerId, TotalAmount, DateTime.UtcNow));
    }

    public void AddItem(OrderItem item)
    {
        if (Status != OrderStatus.Draft)
            throw new InvalidOperationException("Cannot add items to non-draft order");
        
        if (item == null)
            throw new ArgumentNullException(nameof(item));

        _items.Add(item);
        TotalAmount = CalculateTotalAmount();
        
        AddDomainEvent(new OrderItemAdded(Id, item.ProductId, item.Quantity, DateTime.UtcNow));
    }

    public void Confirm()
    {
        if (Status != OrderStatus.Draft)
            throw new InvalidOperationException("Only draft orders can be confirmed");

        Status = OrderStatus.Confirmed;
        AddDomainEvent(new OrderConfirmed(Id, CustomerId, TotalAmount, DateTime.UtcNow));
    }

    private Money CalculateTotalAmount()
    {
        return _items.Aggregate(Money.Zero, (sum, item) => sum.Add(item.LineTotal));
    }
}

// Tests/Domain/Entities/OrderTests.cs
public class OrderTests
{
    private readonly CustomerId _customerId = CustomerId.New();
    private readonly List<OrderItem> _validItems;

    public OrderTests()
    {
        _validItems = new List<OrderItem>
        {
            new OrderItem(ProductId.New(), 2, new Money(1000)),
            new OrderItem(ProductId.New(), 1, new Money(500))
        };
    }

    [Fact]
    public void Constructor_WithValidParameters_ShouldCreateOrderWithDraftStatus()
    {
        // Act
        var order = new Order(_customerId, _validItems);

        // Assert
        order.CustomerId.Should().Be(_customerId);
        order.Status.Should().Be(OrderStatus.Draft);
        order.Items.Should().HaveCount(2);
        order.TotalAmount.Should().Be(new Money(2500)); // (2 * 1000) + (1 * 500)
        order.Id.Should().NotBe(OrderId.Empty);
    }

    [Fact]
    public void Constructor_WithNullCustomerId_ShouldThrowArgumentNullException()
    {
        // Act & Assert
        var act = () => new Order(null, _validItems);
        act.Should().Throw<ArgumentNullException>()
           .WithParameterName("customerId");
    }

    [Fact]
    public void Constructor_WithEmptyItems_ShouldThrowArgumentException()
    {
        // Act & Assert
        var act = () => new Order(_customerId, new List<OrderItem>());
        act.Should().Throw<ArgumentException>()
           .WithParameterName("items")
           .WithMessage("Order must have at least one item*");
    }

    [Fact]
    public void Constructor_ShouldRaiseOrderCreatedDomainEvent()
    {
        // Act
        var order = new Order(_customerId, _validItems);

        // Assert
        var domainEvent = order.DomainEvents.OfType<OrderCreated>().Single();
        domainEvent.OrderId.Should().Be(order.Id);
        domainEvent.CustomerId.Should().Be(_customerId);
        domainEvent.TotalAmount.Should().Be(order.TotalAmount);
        domainEvent.OccurredOn.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void AddItem_ToValidDraftOrder_ShouldAddItemAndUpdateTotal()
    {
        // Arrange
        var order = new Order(_customerId, _validItems);
        var newItem = new OrderItem(ProductId.New(), 3, new Money(200));
        var originalTotal = order.TotalAmount;

        // Act
        order.AddItem(newItem);

        // Assert
        order.Items.Should().HaveCount(3);
        order.Items.Should().Contain(newItem);
        order.TotalAmount.Should().Be(originalTotal.Add(newItem.LineTotal));
    }

    [Fact]
    public void AddItem_ToConfirmedOrder_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var order = new Order(_customerId, _validItems);
        order.Confirm();
        var newItem = new OrderItem(ProductId.New(), 1, new Money(100));

        // Act & Assert
        var act = () => order.AddItem(newItem);
        act.Should().Throw<InvalidOperationException>()
           .WithMessage("Cannot add items to non-draft order");
    }

    [Fact]
    public void AddItem_ShouldRaiseOrderItemAddedDomainEvent()
    {
        // Arrange
        var order = new Order(_customerId, _validItems);
        var newItem = new OrderItem(ProductId.New(), 3, new Money(200));
        order.ClearDomainEvents(); // クリアして新しいイベントのみをテスト

        // Act
        order.AddItem(newItem);

        // Assert
        var domainEvent = order.DomainEvents.OfType<OrderItemAdded>().Single();
        domainEvent.OrderId.Should().Be(order.Id);
        domainEvent.ProductId.Should().Be(newItem.ProductId);
        domainEvent.Quantity.Should().Be(newItem.Quantity);
    }

    [Fact]
    public void Confirm_DraftOrder_ShouldChangeStatusToConfirmed()
    {
        // Arrange
        var order = new Order(_customerId, _validItems);

        // Act
        order.Confirm();

        // Assert
        order.Status.Should().Be(OrderStatus.Confirmed);
    }

    [Fact]
    public void Confirm_AlreadyConfirmedOrder_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var order = new Order(_customerId, _validItems);
        order.Confirm();

        // Act & Assert
        var act = () => order.Confirm();
        act.Should().Throw<InvalidOperationException>()
           .WithMessage("Only draft orders can be confirmed");
    }

    [Fact]
    public void Confirm_ShouldRaiseOrderConfirmedDomainEvent()
    {
        // Arrange
        var order = new Order(_customerId, _validItems);
        order.ClearDomainEvents(); // 作成時のイベントをクリア

        // Act
        order.Confirm();

        // Assert
        var domainEvent = order.DomainEvents.OfType<OrderConfirmed>().Single();
        domainEvent.OrderId.Should().Be(order.Id);
        domainEvent.CustomerId.Should().Be(order.CustomerId);
        domainEvent.TotalAmount.Should().Be(order.TotalAmount);
    }
}
\`\`\`

### 値オブジェクトのテスト

値オブジェクトの不変性と等価性をテストします：

\`\`\`csharp
// Tests/Domain/ValueObjects/MoneyTests.cs
public class MoneyTests
{
    [Fact]
    public void Constructor_WithValidAmount_ShouldCreateMoney()
    {
        // Arrange & Act
        var money = new Money(100.50m);

        // Assert
        money.Amount.Should().Be(100.50m);
        money.Currency.Should().Be("JPY"); // デフォルト通貨
    }

    [Fact]
    public void Constructor_WithNegativeAmount_ShouldThrowArgumentException()
    {
        // Act & Assert
        var act = () => new Money(-1);
        act.Should().Throw<ArgumentException>()
           .WithParameterName("amount")
           .WithMessage("Amount cannot be negative*");
    }

    [Theory]
    [InlineData(100, 200, 300)]
    [InlineData(0, 0, 0)]
    [InlineData(50.25, 49.75, 100)]
    public void Add_WithValidMoney_ShouldReturnCorrectSum(decimal amount1, decimal amount2, decimal expected)
    {
        // Arrange
        var money1 = new Money(amount1);
        var money2 = new Money(amount2);

        // Act
        var result = money1.Add(money2);

        // Assert
        result.Amount.Should().Be(expected);
        result.Currency.Should().Be(money1.Currency);
    }

    [Fact]
    public void Add_WithDifferentCurrencies_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var jpy = new Money(100, "JPY");
        var usd = new Money(100, "USD");

        // Act & Assert
        var act = () => jpy.Add(usd);
        act.Should().Throw<InvalidOperationException>()
           .WithMessage("Cannot add money with different currencies*");
    }

    [Fact]
    public void Equals_WithSameAmountAndCurrency_ShouldReturnTrue()
    {
        // Arrange
        var money1 = new Money(100, "JPY");
        var money2 = new Money(100, "JPY");

        // Act & Assert
        money1.Should().Be(money2);
        (money1 == money2).Should().BeTrue();
        money1.GetHashCode().Should().Be(money2.GetHashCode());
    }

    [Fact]
    public void Equals_WithDifferentAmount_ShouldReturnFalse()
    {
        // Arrange
        var money1 = new Money(100);
        var money2 = new Money(200);

        // Act & Assert
        money1.Should().NotBe(money2);
        (money1 != money2).Should().BeTrue();
    }

    [Theory]
    [InlineData(0, true)]
    [InlineData(0.01, false)]
    [InlineData(100, false)]
    public void IsZero_ShouldReturnCorrectResult(decimal amount, bool expected)
    {
        // Arrange
        var money = new Money(amount);

        // Act & Assert
        money.IsZero.Should().Be(expected);
    }
}
\`\`\`

### ドメインサービスのテスト

ドメインサービスの複雑なビジネスロジックをテストします：

\`\`\`csharp
// Tests/Domain/Services/PricingServiceTests.cs
public class PricingServiceTests
{
    private readonly Mock<ICustomerRepository> _customerRepositoryMock;
    private readonly Mock<IProductCatalogService> _productCatalogMock;
    private readonly PricingService _pricingService;

    public PricingServiceTests()
    {
        _customerRepositoryMock = new Mock<ICustomerRepository>();
        _productCatalogMock = new Mock<IProductCatalogService>();
        _pricingService = new PricingService(_customerRepositoryMock.Object, _productCatalogMock.Object);
    }

    [Fact]
    public async Task CalculateOrderPrice_ForRegularCustomer_ShouldReturnStandardPrice()
    {
        // Arrange
        var customerId = CustomerId.New();
        var customer = Customer.CreateRegular(customerId, "Test Customer", "test@example.com");
        var productId = ProductId.New();
        var basePrice = new Money(1000);

        _customerRepositoryMock
            .Setup(x => x.GetByIdAsync(customerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(customer);

        _productCatalogMock
            .Setup(x => x.GetPriceAsync(productId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(basePrice);

        var orderItems = new List<OrderItem>
        {
            new OrderItem(productId, 2, basePrice)
        };

        // Act
        var result = await _pricingService.CalculateOrderPriceAsync(customerId, orderItems);

        // Assert
        result.Should().Be(new Money(2000)); // 2 * 1000, no discount
    }

    [Fact]
    public async Task CalculateOrderPrice_ForVipCustomer_ShouldApplyDiscount()
    {
        // Arrange
        var customerId = CustomerId.New();
        var customer = Customer.CreateVip(customerId, "VIP Customer", "vip@example.com");
        var productId = ProductId.New();
        var basePrice = new Money(1000);

        _customerRepositoryMock
            .Setup(x => x.GetByIdAsync(customerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(customer);

        _productCatalogMock
            .Setup(x => x.GetPriceAsync(productId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(basePrice);

        var orderItems = new List<OrderItem>
        {
            new OrderItem(productId, 2, basePrice)
        };

        // Act
        var result = await _pricingService.CalculateOrderPriceAsync(customerId, orderItems);

        // Assert
        result.Should().Be(new Money(1800)); // 2 * 1000 * 0.9 (10% VIP discount)
    }

    [Fact]
    public async Task CalculateOrderPrice_WithLargeQuantity_ShouldApplyVolumeDiscount()
    {
        // Arrange
        var customerId = CustomerId.New();
        var customer = Customer.CreateRegular(customerId, "Test Customer", "test@example.com");
        var productId = ProductId.New();
        var basePrice = new Money(100);

        _customerRepositoryMock
            .Setup(x => x.GetByIdAsync(customerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(customer);

        _productCatalogMock
            .Setup(x => x.GetPriceAsync(productId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(basePrice);

        var orderItems = new List<OrderItem>
        {
            new OrderItem(productId, 50, basePrice) // 50個以上でボリューム割引
        };

        // Act
        var result = await _pricingService.CalculateOrderPriceAsync(customerId, orderItems);

        // Assert
        result.Should().Be(new Money(4750)); // 50 * 100 * 0.95 (5% volume discount)
    }

    [Fact]
    public async Task CalculateOrderPrice_WithNonExistentCustomer_ShouldThrowCustomerNotFoundException()
    {
        // Arrange
        var customerId = CustomerId.New();
        var orderItems = new List<OrderItem>
        {
            new OrderItem(ProductId.New(), 1, new Money(100))
        };

        _customerRepositoryMock
            .Setup(x => x.GetByIdAsync(customerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Customer)null);

        // Act & Assert
        var act = async () => await _pricingService.CalculateOrderPriceAsync(customerId, orderItems);
        await act.Should().ThrowAsync<CustomerNotFoundException>()
                 .WithMessage($"Customer with ID {customerId} was not found");
    }
}
\`\`\`

## アプリケーションサービスの統合テスト

### テスト用のインフラストラクチャ設定

\`\`\`csharp
// Tests/Infrastructure/TestBase.cs
public abstract class IntegrationTestBase : IDisposable
{
    protected readonly WebApplicationFactory<Program> Factory;
    protected readonly HttpClient Client;
    protected readonly IServiceScope Scope;
    protected readonly ApplicationDbContext DbContext;

    protected IntegrationTestBase()
    {
        Factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // テスト用のデータベース設定
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                    if (descriptor != null)
                        services.Remove(descriptor);

                    services.AddDbContext<ApplicationDbContext>(options =>
                        options.UseInMemoryDatabase("TestDb_" + Guid.NewGuid()));

                    // テスト用の外部サービスモック
                    services.Replace(ServiceDescriptor.Scoped<IEmailService, MockEmailService>());
                    services.Replace(ServiceDescriptor.Scoped<IPaymentService, MockPaymentService>());
                });
            });

        Client = Factory.CreateClient();
        Scope = Factory.Services.CreateScope();
        DbContext = Scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    }

    protected async Task SeedDataAsync()
    {
        // テストデータの準備
        var customer = Customer.CreateRegular(
            CustomerId.New(), 
            "Test Customer", 
            "test@example.com"
        );

        var products = new[]
        {
            Product.Create(ProductId.New(), "Product 1", new Money(1000)),
            Product.Create(ProductId.New(), "Product 2", new Money(2000))
        };

        DbContext.Customers.Add(customer);
        DbContext.Products.AddRange(products);
        await DbContext.SaveChangesAsync();
    }

    public void Dispose()
    {
        Scope?.Dispose();
        Client?.Dispose();
        Factory?.Dispose();
    }
}

// Tests/Application/Services/OrderApplicationServiceIntegrationTests.cs
public class OrderApplicationServiceIntegrationTests : IntegrationTestBase
{
    private readonly IOrderApplicationService _orderService;
    private readonly CustomerId _testCustomerId;

    public OrderApplicationServiceIntegrationTests()
    {
        _orderService = Scope.ServiceProvider.GetRequiredService<IOrderApplicationService>();
        _testCustomerId = CustomerId.New();
    }

    [Fact]
    public async Task CreateOrderAsync_WithValidData_ShouldCreateOrderAndRaiseEvents()
    {
        // Arrange
        await SeedDataAsync();
        var products = await DbContext.Products.ToListAsync();
        
        var command = new CreateOrderCommand(
            _testCustomerId.Value,
            new List<CreateOrderItemCommand>
            {
                new(products[0].Id.Value, 2, products[0].Price.Amount),
                new(products[1].Id.Value, 1, products[1].Price.Amount)
            }
        );

        // Act
        var result = await _orderService.CreateOrderAsync(command);

        // Assert
        result.Should().NotBeNull();
        result.CustomerId.Should().Be(_testCustomerId.Value);
        result.Items.Should().HaveCount(2);
        result.TotalAmount.Should().Be(4000m); // (2 * 1000) + (1 * 2000)

        // データベースに保存されていることを確認
        var savedOrder = await DbContext.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == result.Id);
        savedOrder.Should().NotBeNull();
        savedOrder.Items.Should().HaveCount(2);

        // ドメインイベントが発行されていることを確認
        var domainEvents = await DbContext.DomainEvents
            .Where(e => e.AggregateId == result.Id)
            .ToListAsync();
        domainEvents.Should().ContainSingle(e => e.EventType.Contains("OrderCreated"));
    }

    [Fact]
    public async Task ConfirmOrderAsync_WithValidOrder_ShouldConfirmOrderAndSendNotification()
    {
        // Arrange
        await SeedDataAsync();
        var products = await DbContext.Products.ToListAsync();
        
        var createCommand = new CreateOrderCommand(
            _testCustomerId.Value,
            new List<CreateOrderItemCommand>
            {
                new(products[0].Id.Value, 1, products[0].Price.Amount)
            }
        );

        var createdOrder = await _orderService.CreateOrderAsync(createCommand);
        var confirmCommand = new ConfirmOrderCommand(createdOrder.Id);

        // Act
        await _orderService.ConfirmOrderAsync(confirmCommand);

        // Assert
        var confirmedOrder = await DbContext.Orders
            .FirstOrDefaultAsync(o => o.Id == createdOrder.Id);
        confirmedOrder.Status.Should().Be(OrderStatus.Confirmed);

        // 確認メールが送信されたことを確認
        var emailService = (MockEmailService)Scope.ServiceProvider.GetService<IEmailService>();
        emailService.SentEmails.Should().ContainSingle(
            e => e.Subject.Contains("Order Confirmed") && e.To.Contains("test@example.com"));
    }

    [Fact]
    public async Task CreateOrderAsync_WithInvalidCustomer_ShouldThrowCustomerNotFoundException()
    {
        // Arrange
        var invalidCustomerId = Guid.NewGuid();
        var command = new CreateOrderCommand(
            invalidCustomerId,
            new List<CreateOrderItemCommand>
            {
                new(Guid.NewGuid(), 1, 1000m)
            }
        );

        // Act & Assert
        var act = async () => await _orderService.CreateOrderAsync(command);
        await act.Should().ThrowAsync<CustomerNotFoundException>()
                 .WithMessage($"Customer with ID {invalidCustomerId} was not found");
    }
}
\`\`\`

## リポジトリの統合テスト

### データベースとの統合テスト

\`\`\`csharp
// Tests/Infrastructure/Repositories/OrderRepositoryIntegrationTests.cs
public class OrderRepositoryIntegrationTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly OrderRepository _repository;

    public OrderRepositoryIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _repository = new OrderRepository(_context);
    }

    [Fact]
    public async Task AddAsync_WithValidOrder_ShouldPersistOrder()
    {
        // Arrange
        var customerId = CustomerId.New();
        var items = new List<OrderItem>
        {
            new OrderItem(ProductId.New(), 2, new Money(1000)),
            new OrderItem(ProductId.New(), 1, new Money(500))
        };
        var order = new Order(customerId, items);

        // Act
        await _repository.AddAsync(order);
        await _context.SaveChangesAsync();

        // Assert
        var savedOrder = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == order.Id.Value);

        savedOrder.Should().NotBeNull();
        savedOrder.CustomerId.Should().Be(customerId.Value);
        savedOrder.Items.Should().HaveCount(2);
        savedOrder.TotalAmount.Should().Be(2500m);
    }

    [Fact]
    public async Task GetByIdAsync_WithExistingOrder_ShouldReturnOrder()
    {
        // Arrange
        var customerId = CustomerId.New();
        var items = new List<OrderItem>
        {
            new OrderItem(ProductId.New(), 1, new Money(1000))
        };
        var order = new Order(customerId, items);

        await _repository.AddAsync(order);
        await _context.SaveChangesAsync();

        // Act
        var retrievedOrder = await _repository.GetByIdAsync(order.Id);

        // Assert
        retrievedOrder.Should().NotBeNull();
        retrievedOrder.Id.Should().Be(order.Id);
        retrievedOrder.CustomerId.Should().Be(customerId);
        retrievedOrder.Items.Should().HaveCount(1);
    }

    [Fact]
    public async Task UpdateAsync_WithModifiedOrder_ShouldPersistChanges()
    {
        // Arrange
        var customerId = CustomerId.New();
        var items = new List<OrderItem>
        {
            new OrderItem(ProductId.New(), 1, new Money(1000))
        };
        var order = new Order(customerId, items);

        await _repository.AddAsync(order);
        await _context.SaveChangesAsync();

        // Act
        order.Confirm();
        await _repository.UpdateAsync(order);
        await _context.SaveChangesAsync();

        // Assert
        var updatedOrder = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == order.Id.Value);
        updatedOrder.Status.Should().Be(OrderStatus.Confirmed);
    }

    [Fact]
    public async Task GetByCustomerIdAsync_WithMultipleOrders_ShouldReturnCustomerOrders()
    {
        // Arrange
        var customerId = CustomerId.New();
        var otherCustomerId = CustomerId.New();

        var order1 = new Order(customerId, new List<OrderItem>
        {
            new OrderItem(ProductId.New(), 1, new Money(1000))
        });

        var order2 = new Order(customerId, new List<OrderItem>
        {
            new OrderItem(ProductId.New(), 2, new Money(500))
        });

        var otherOrder = new Order(otherCustomerId, new List<OrderItem>
        {
            new OrderItem(ProductId.New(), 1, new Money(2000))
        });

        await _repository.AddAsync(order1);
        await _repository.AddAsync(order2);
        await _repository.AddAsync(otherOrder);
        await _context.SaveChangesAsync();

        // Act
        var customerOrders = await _repository.GetByCustomerIdAsync(customerId);

        // Assert
        customerOrders.Should().HaveCount(2);
        customerOrders.Should().OnlyContain(o => o.CustomerId == customerId);
        customerOrders.Should().Contain(o => o.Id == order1.Id);
        customerOrders.Should().Contain(o => o.Id == order2.Id);
        customerOrders.Should().NotContain(o => o.Id == otherOrder.Id);
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}
\`\`\`

## テストのベストプラクティス

### AAA（Arrange-Act-Assert）パターン

すべてのテストでAAパターンを使用：

\`\`\`csharp
[Fact]
public void MethodName_Condition_ExpectedBehavior()
{
    // Arrange: テストデータとモックの準備
    var input = new SomeInput();
    var expectedOutput = new SomeOutput();
    
    // Act: テスト対象のメソッドを実行
    var result = _sut.MethodUnderTest(input);
    
    // Assert: 結果の検証
    result.Should().Be(expectedOutput);
}
\`\`\`

### テストデータビルダーパターン

複雑なオブジェクトの構築を簡単にする：

\`\`\`csharp
// Tests/Builders/OrderBuilder.cs
public class OrderBuilder
{
    private CustomerId _customerId = CustomerId.New();
    private List<OrderItem> _items = new();
    private OrderStatus _status = OrderStatus.Draft;

    public OrderBuilder WithCustomer(CustomerId customerId)
    {
        _customerId = customerId;
        return this;
    }

    public OrderBuilder WithItem(ProductId productId, int quantity, Money unitPrice)
    {
        _items.Add(new OrderItem(productId, quantity, unitPrice));
        return this;
    }

    public OrderBuilder WithStatus(OrderStatus status)
    {
        _status = status;
        return this;
    }

    public Order Build()
    {
        if (!_items.Any())
        {
            _items.Add(new OrderItem(ProductId.New(), 1, new Money(1000)));
        }

        var order = new Order(_customerId, _items);
        
        if (_status == OrderStatus.Confirmed)
        {
            order.Confirm();
        }

        return order;
    }
}

// Usage in tests
[Fact]
public void SomeTest_WithComplexOrder_ShouldBehaveCorrectly()
{
    // Arrange
    var order = new OrderBuilder()
        .WithCustomer(CustomerId.New())
        .WithItem(ProductId.New(), 2, new Money(1000))
        .WithItem(ProductId.New(), 1, new Money(500))
        .WithStatus(OrderStatus.Confirmed)
        .Build();

    // Act & Assert
    // ...
}
\`\`\`

## パフォーマンステスト

### 大量データでのテスト

\`\`\`csharp
[Fact]
public async Task GetOrdersByCustomer_WithLargeDataset_ShouldPerformWithinAcceptableTime()
{
    // Arrange
    var customerId = CustomerId.New();
    var stopwatch = Stopwatch.StartNew();
    
    // 1000件の注文を作成
    var orders = Enumerable.Range(1, 1000)
        .Select(i => new OrderBuilder()
            .WithCustomer(customerId)
            .WithItem(ProductId.New(), i, new Money(100))
            .Build())
        .ToList();

    foreach (var order in orders)
    {
        await _repository.AddAsync(order);
    }
    await _context.SaveChangesAsync();

    // Act
    stopwatch.Restart();
    var result = await _repository.GetByCustomerIdAsync(customerId);
    stopwatch.Stop();

    // Assert
    result.Should().HaveCount(1000);
    stopwatch.ElapsedMilliseconds.Should().BeLessThan(1000); // 1秒以内
}
\`\`\`

## 実践課題

### 課題1: 完全なエンティティテストスイート

顧客（Customer）エンティティの完全なテストスイートを作成してください：

1. コンストラクタのテスト
2. ビジネスルールのテスト
3. ドメインイベントのテスト
4. 不正な状態遷移のテスト

### 課題2: モックを使用したドメインサービステスト

在庫管理サービス（InventoryService）のテストを実装してください：

1. 在庫チェックロジック
2. 外部依存のモック化
3. 非同期処理のテスト
4. 例外ハンドリングのテスト

### 課題3: 統合テストの実装

注文処理の完全な統合テストを実装してください：

1. エンドツーエンドのワークフロー
2. データベーストランザクション
3. ドメインイベントの検証
4. 外部サービス連携のテスト

これらの課題を通じて、DDDアプリケーションの信頼性の高いテスト戦略を実践的に学ぶことができます。
`,
  codeExamples: [
    {
      id: 'entity-unit-test',
      title: 'エンティティの単体テスト',
      language: 'csharp',
      code: `[Fact]
public void Constructor_WithValidParameters_ShouldCreateOrderWithDraftStatus()
{
    // Arrange
    var customerId = CustomerId.New();
    var items = new List<OrderItem>
    {
        new OrderItem(ProductId.New(), 2, new Money(1000)),
        new OrderItem(ProductId.New(), 1, new Money(500))
    };

    // Act
    var order = new Order(customerId, items);

    // Assert
    order.CustomerId.Should().Be(customerId);
    order.Status.Should().Be(OrderStatus.Draft);
    order.Items.Should().HaveCount(2);
    order.TotalAmount.Should().Be(new Money(2500));
    order.Id.Should().NotBe(OrderId.Empty);
}

[Fact]
public void Constructor_ShouldRaiseOrderCreatedDomainEvent()
{
    // Arrange
    var customerId = CustomerId.New();
    var items = new List<OrderItem> { new OrderItem(ProductId.New(), 1, new Money(1000)) };

    // Act
    var order = new Order(customerId, items);

    // Assert
    var domainEvent = order.DomainEvents.OfType<OrderCreated>().Single();
    domainEvent.OrderId.Should().Be(order.Id);
    domainEvent.CustomerId.Should().Be(customerId);
}`,
      description: 'エンティティのビジネスロジックとドメインイベントをテストする例'
    },
    {
      id: 'value-object-test',
      title: '値オブジェクトのテスト',
      language: 'csharp',
      code: `[Theory]
[InlineData(100, 200, 300)]
[InlineData(0, 0, 0)]
[InlineData(50.25, 49.75, 100)]
public void Add_WithValidMoney_ShouldReturnCorrectSum(decimal amount1, decimal amount2, decimal expected)
{
    // Arrange
    var money1 = new Money(amount1);
    var money2 = new Money(amount2);

    // Act
    var result = money1.Add(money2);

    // Assert
    result.Amount.Should().Be(expected);
    result.Currency.Should().Be(money1.Currency);
}

[Fact]
public void Equals_WithSameAmountAndCurrency_ShouldReturnTrue()
{
    // Arrange
    var money1 = new Money(100, "JPY");
    var money2 = new Money(100, "JPY");

    // Act & Assert
    money1.Should().Be(money2);
    (money1 == money2).Should().BeTrue();
    money1.GetHashCode().Should().Be(money2.GetHashCode());
}`,
      description: '値オブジェクトの不変性と等価性をテストする例'
    },
    {
      id: 'domain-service-test',
      title: 'ドメインサービスのテスト',
      language: 'csharp',
      code: `public class PricingServiceTests
{
    private readonly Mock<ICustomerRepository> _customerRepositoryMock;
    private readonly Mock<IProductCatalogService> _productCatalogMock;
    private readonly PricingService _pricingService;

    public PricingServiceTests()
    {
        _customerRepositoryMock = new Mock<ICustomerRepository>();
        _productCatalogMock = new Mock<IProductCatalogService>();
        _pricingService = new PricingService(_customerRepositoryMock.Object, _productCatalogMock.Object);
    }

    [Fact]
    public async Task CalculateOrderPrice_ForVipCustomer_ShouldApplyDiscount()
    {
        // Arrange
        var customerId = CustomerId.New();
        var customer = Customer.CreateVip(customerId, "VIP Customer", "vip@example.com");
        var basePrice = new Money(1000);

        _customerRepositoryMock
            .Setup(x => x.GetByIdAsync(customerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(customer);

        var orderItems = new List<OrderItem> { new OrderItem(ProductId.New(), 2, basePrice) };

        // Act
        var result = await _pricingService.CalculateOrderPriceAsync(customerId, orderItems);

        // Assert
        result.Should().Be(new Money(1800)); // 10% VIP discount applied
    }
}`,
      description: 'モックを使用したドメインサービスのテスト例'
    },
    {
      id: 'integration-test',
      title: '統合テストの実装',
      language: 'csharp',
      code: `public class OrderApplicationServiceIntegrationTests : IntegrationTestBase
{
    private readonly IOrderApplicationService _orderService;

    public OrderApplicationServiceIntegrationTests()
    {
        _orderService = Scope.ServiceProvider.GetRequiredService<IOrderApplicationService>();
    }

    [Fact]
    public async Task CreateOrderAsync_WithValidData_ShouldCreateOrderAndRaiseEvents()
    {
        // Arrange
        await SeedDataAsync();
        var products = await DbContext.Products.ToListAsync();
        
        var command = new CreateOrderCommand(
            _testCustomerId.Value,
            new List<CreateOrderItemCommand>
            {
                new(products[0].Id.Value, 2, products[0].Price.Amount)
            }
        );

        // Act
        var result = await _orderService.CreateOrderAsync(command);

        // Assert
        result.Should().NotBeNull();
        result.CustomerId.Should().Be(_testCustomerId.Value);

        // データベースに保存されていることを確認
        var savedOrder = await DbContext.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == result.Id);
        savedOrder.Should().NotBeNull();

        // ドメインイベントが発行されていることを確認
        var domainEvents = await DbContext.DomainEvents
            .Where(e => e.AggregateId == result.Id)
            .ToListAsync();
        domainEvents.Should().ContainSingle(e => e.EventType.Contains("OrderCreated"));
    }
}`,
      description: 'データベースとドメインイベントを含む統合テスト例'
    },
    {
      id: 'test-builder-pattern',
      title: 'テストデータビルダーパターン',
      language: 'csharp',
      code: `public class OrderBuilder
{
    private CustomerId _customerId = CustomerId.New();
    private List<OrderItem> _items = new();
    private OrderStatus _status = OrderStatus.Draft;

    public OrderBuilder WithCustomer(CustomerId customerId)
    {
        _customerId = customerId;
        return this;
    }

    public OrderBuilder WithItem(ProductId productId, int quantity, Money unitPrice)
    {
        _items.Add(new OrderItem(productId, quantity, unitPrice));
        return this;
    }

    public OrderBuilder WithStatus(OrderStatus status)
    {
        _status = status;
        return this;
    }

    public Order Build()
    {
        if (!_items.Any())
        {
            _items.Add(new OrderItem(ProductId.New(), 1, new Money(1000)));
        }

        var order = new Order(_customerId, _items);
        
        if (_status == OrderStatus.Confirmed)
        {
            order.Confirm();
        }

        return order;
    }
}

// Usage
var order = new OrderBuilder()
    .WithCustomer(CustomerId.New())
    .WithItem(ProductId.New(), 2, new Money(1000))
    .WithStatus(OrderStatus.Confirmed)
    .Build();`,
      description: '複雑なテストデータを簡単に構築するビルダーパターン'
    }
  ],
  exercises: [
    {
      id: 'complete-entity-test-suite',
      title: '完全なエンティティテストスイート',
      description: '顧客（Customer）エンティティの完全なテストスイートを作成してください。コンストラクタ、ビジネスルール、ドメインイベント、状態遷移のすべてをカバーしてください。',
      difficulty: 'medium',
      estimatedTime: 40,
      starterCode: `public class CustomerTests
{
    [Fact]
    public void Constructor_WithValidParameters_ShouldCreateCustomer()
    {
        // TODO: 正常なコンストラクタのテストを実装
    }

    [Fact]
    public void Constructor_WithInvalidEmail_ShouldThrowException()
    {
        // TODO: 不正なメールアドレスでの例外テストを実装
    }

    [Fact]
    public void UpgradeToVip_WithValidConditions_ShouldChangeStatusAndRaiseEvent()
    {
        // TODO: VIPアップグレードのテストを実装
    }

    [Fact]
    public void AddOrder_WithValidOrder_ShouldUpdateTotalPurchaseAmount()
    {
        // TODO: 注文追加時の購入金額更新テストを実装
    }
}`,
      solution: `public class CustomerTests
{
    [Fact]
    public void Constructor_WithValidParameters_ShouldCreateCustomer()
    {
        // Arrange
        var customerId = CustomerId.New();
        var name = "Test Customer";
        var email = "test@example.com";

        // Act
        var customer = new Customer(customerId, name, email);

        // Assert
        customer.Id.Should().Be(customerId);
        customer.Name.Should().Be(name);
        customer.Email.Should().Be(email);
        customer.Status.Should().Be(CustomerStatus.Regular);
        customer.TotalPurchaseAmount.Should().Be(Money.Zero);
    }

    [Fact]
    public void Constructor_WithInvalidEmail_ShouldThrowException()
    {
        // Arrange
        var customerId = CustomerId.New();
        var name = "Test Customer";
        var invalidEmail = "invalid-email";

        // Act & Assert
        var act = () => new Customer(customerId, name, invalidEmail);
        act.Should().Throw<ArgumentException>()
           .WithParameterName("email")
           .WithMessage("Invalid email format*");
    }

    [Fact]
    public void UpgradeToVip_WithSufficientPurchaseAmount_ShouldChangeStatusAndRaiseEvent()
    {
        // Arrange
        var customer = new Customer(CustomerId.New(), "Test Customer", "test@example.com");
        customer.AddPurchaseAmount(new Money(1000000)); // VIP threshold

        // Act
        customer.UpgradeToVip();

        // Assert
        customer.Status.Should().Be(CustomerStatus.Vip);
        var domainEvent = customer.DomainEvents.OfType<CustomerUpgradedToVip>().Single();
        domainEvent.CustomerId.Should().Be(customer.Id);
    }
}`,
      hints: [
        'AAA（Arrange-Act-Assert）パターンを使用してください',
        'ドメインイベントの検証も忘れずに行ってください',
        'FluentAssertionsを使用して読みやすいアサーションを書いてください'
      ]
    },
    {
      id: 'domain-service-mock-test',
      title: 'ドメインサービスのモックテスト',
      description: '在庫管理サービスのテストを実装してください。外部依存をモック化し、非同期処理と例外ハンドリングも含めてテストしてください。',
      difficulty: 'hard',
      estimatedTime: 50,
      starterCode: `public class InventoryServiceTests
{
    private readonly Mock<IProductRepository> _productRepositoryMock;
    private readonly Mock<IWarehouseService> _warehouseServiceMock;
    private readonly InventoryService _inventoryService;

    public InventoryServiceTests()
    {
        // TODO: モックとサービスの初期化
    }

    [Fact]
    public async Task CheckAvailability_WithSufficientStock_ShouldReturnTrue()
    {
        // TODO: 在庫充分時のテストを実装
    }

    [Fact]
    public async Task ReserveItems_WithValidRequest_ShouldReserveAndUpdateStock()
    {
        // TODO: 在庫予約のテストを実装
    }

    [Fact]
    public async Task ReserveItems_WithInsufficientStock_ShouldThrowException()
    {
        // TODO: 在庫不足時の例外テストを実装
    }
}`,
      solution: `public class InventoryServiceTests
{
    private readonly Mock<IProductRepository> _productRepositoryMock;
    private readonly Mock<IWarehouseService> _warehouseServiceMock;
    private readonly InventoryService _inventoryService;

    public InventoryServiceTests()
    {
        _productRepositoryMock = new Mock<IProductRepository>();
        _warehouseServiceMock = new Mock<IWarehouseService>();
        _inventoryService = new InventoryService(_productRepositoryMock.Object, _warehouseServiceMock.Object);
    }

    [Fact]
    public async Task CheckAvailability_WithSufficientStock_ShouldReturnTrue()
    {
        // Arrange
        var productId = ProductId.New();
        var requestedQuantity = 5;
        var availableStock = 10;

        _warehouseServiceMock
            .Setup(x => x.GetAvailableStockAsync(productId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(availableStock);

        // Act
        var result = await _inventoryService.CheckAvailabilityAsync(productId, requestedQuantity);

        // Assert
        result.Should().BeTrue();
        _warehouseServiceMock.Verify(x => x.GetAvailableStockAsync(productId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ReserveItems_WithInsufficientStock_ShouldThrowException()
    {
        // Arrange
        var productId = ProductId.New();
        var requestedQuantity = 15;
        var availableStock = 10;

        _warehouseServiceMock
            .Setup(x => x.GetAvailableStockAsync(productId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(availableStock);

        // Act & Assert
        var act = async () => await _inventoryService.ReserveItemsAsync(productId, requestedQuantity);
        await act.Should().ThrowAsync<InsufficientStockException>()
                 .WithMessage($"Insufficient stock for product {productId}. Available: {availableStock}, Requested: {requestedQuantity}");
    }
}`,
      hints: [
        'Moq フレームワークを使用して外部依存をモック化してください',
        '非同期メソッドのテストでは async/await を適切に使用してください',
        'Verify メソッドでモックの呼び出しを検証してください'
      ]
    },
    {
      id: 'end-to-end-integration-test',
      title: 'エンドツーエンド統合テスト',
      description: '注文処理の完全な統合テストを実装してください。データベーストランザクション、ドメインイベント、外部サービス連携をすべて含めてテストしてください。',
      difficulty: 'hard',
      estimatedTime: 60,
      starterCode: `public class OrderProcessingIntegrationTests : IntegrationTestBase
{
    [Fact]
    public async Task ProcessOrder_CompleteWorkflow_ShouldExecuteAllSteps()
    {
        // TODO: 注文作成から確定、発送までの完全なワークフローをテスト
    }

    [Fact]
    public async Task ProcessOrder_WithPaymentFailure_ShouldRollbackTransaction()
    {
        // TODO: 支払い失敗時のロールバックテストを実装
    }

    [Fact]
    public async Task ProcessOrder_ShouldPublishAllDomainEvents()
    {
        // TODO: すべてのドメインイベントが正しく発行されることをテスト
    }

    private async Task<Customer> CreateTestCustomerAsync()
    {
        // TODO: テスト用顧客データの作成
    }

    private async Task<List<Product>> CreateTestProductsAsync()
    {
        // TODO: テスト用商品データの作成
    }
}`,
      solution: `public class OrderProcessingIntegrationTests : IntegrationTestBase
{
    [Fact]
    public async Task ProcessOrder_CompleteWorkflow_ShouldExecuteAllSteps()
    {
        // Arrange
        var customer = await CreateTestCustomerAsync();
        var products = await CreateTestProductsAsync();
        
        var orderService = Scope.ServiceProvider.GetRequiredService<IOrderApplicationService>();
        var paymentService = (MockPaymentService)Scope.ServiceProvider.GetService<IPaymentService>();
        var emailService = (MockEmailService)Scope.ServiceProvider.GetService<IEmailService>();

        var createCommand = new CreateOrderCommand(
            customer.Id.Value,
            products.Select(p => new CreateOrderItemCommand(p.Id.Value, 1, p.Price.Amount)).ToList()
        );

        // Act
        var createdOrder = await orderService.CreateOrderAsync(createCommand);
        await orderService.ConfirmOrderAsync(new ConfirmOrderCommand(createdOrder.Id));

        // Assert
        // 注文がデータベースに保存されていることを確認
        var savedOrder = await DbContext.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == createdOrder.Id);
        savedOrder.Should().NotBeNull();
        savedOrder.Status.Should().Be(OrderStatus.Confirmed);

        // 支払いが処理されていることを確認
        paymentService.ProcessedPayments.Should().ContainSingle(
            p => p.OrderId == createdOrder.Id && p.Amount == createdOrder.TotalAmount);

        // 確認メールが送信されていることを確認
        emailService.SentEmails.Should().ContainSingle(
            e => e.To.Contains(customer.Email) && e.Subject.Contains("Order Confirmed"));

        // ドメインイベントが発行されていることを確認
        var domainEvents = await DbContext.DomainEvents
            .Where(e => e.AggregateId == createdOrder.Id)
            .ToListAsync();
        domainEvents.Should().Contain(e => e.EventType.Contains("OrderCreated"));
        domainEvents.Should().Contain(e => e.EventType.Contains("OrderConfirmed"));
    }

    private async Task<Customer> CreateTestCustomerAsync()
    {
        var customer = new Customer(CustomerId.New(), "Test Customer", "test@example.com");
        DbContext.Customers.Add(customer);
        await DbContext.SaveChangesAsync();
        return customer;
    }

    private async Task<List<Product>> CreateTestProductsAsync()
    {
        var products = new List<Product>
        {
            new Product(ProductId.New(), "Product 1", new Money(1000)),
            new Product(ProductId.New(), "Product 2", new Money(2000))
        };
        
        DbContext.Products.AddRange(products);
        await DbContext.SaveChangesAsync();
        return products;
    }
}`,
      hints: [
        'WebApplicationFactory を使用して統合テスト環境を構築してください',
        'InMemoryDatabase を使用してテスト用データベースを設定してください',
        'モックサービスを使って外部依存を制御してください',
        'トランザクションの境界を正しく設定してテストしてください'
      ]
    }
  ]
};