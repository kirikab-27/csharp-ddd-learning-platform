import type { Lesson } from '../../../../features/learning/types';

export const repositoryFactoryLesson: Lesson = {
  id: 'repository-factory',
  title: 'リポジトリとファクトリーパターン - データアクセスとオブジェクト生成の抽象化',
  description: 'DDDにおけるリポジトリパターンとファクトリーパターンの設計と実装、永続化技術からドメインを分離する方法を詳しく学習します',
  content: `
# リポジトリとファクトリーパターン

リポジトリパターンとファクトリーパターンは、DDDにおいてドメインモデルを技術的な詳細から分離するための重要なパターンです。リポジトリは永続化の抽象化を、ファクトリーは複雑なオブジェクト生成の抽象化を提供します。

## リポジトリパターン（Repository Pattern）

### リポジトリパターンの目的

**リポジトリパターン**は、データアクセスロジックをカプセル化し、ドメインモデルから永続化技術を分離します：

1. **永続化の抽象化**: データベースやファイルシステムなどの詳細を隠蔽
2. **テスタビリティ**: モックを使用した単体テストが容易
3. **技術独立性**: 永続化技術の変更がドメインに影響しない
4. **コレクション的インターフェース**: メモリ内コレクションのように扱える

### 基本的なリポジトリインターフェース

\`\`\`csharp
// 汎用リポジトリの基底インターフェース
public interface IRepository<TEntity, TId> 
    where TEntity : AggregateRoot<TId>
    where TId : class
{
    Task<TEntity> GetByIdAsync(TId id);
    Task<IEnumerable<TEntity>> GetAllAsync();
    Task<TEntity> AddAsync(TEntity entity);
    Task<TEntity> UpdateAsync(TEntity entity);
    Task DeleteAsync(TId id);
    Task<bool> ExistsAsync(TId id);
    Task SaveChangesAsync();
}

// 特定の集約に特化したリポジトリ
public interface IOrderRepository : IRepository<Order, OrderId>
{
    Task<IEnumerable<Order>> GetByCustomerIdAsync(CustomerId customerId);
    Task<IEnumerable<Order>> GetOrdersByStatusAsync(OrderStatus status);
    Task<IEnumerable<Order>> GetOrdersByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<Order> GetOrderWithItemsAsync(OrderId orderId);
    Task<IEnumerable<Order>> GetOverdueOrdersAsync();
    Task<IEnumerable<Order>> FindOrdersRequiringAttentionAsync();
    Task<OrderStatistics> GetOrderStatisticsAsync(DateTime startDate, DateTime endDate);
}

public interface ICustomerRepository : IRepository<Customer, CustomerId>
{
    Task<Customer> GetByEmailAsync(EmailAddress email);
    Task<IEnumerable<Customer>> GetActiveCustomersAsync();
    Task<IEnumerable<Customer>> GetCustomersByMembershipTypeAsync(MembershipType membershipType);
    Task<IEnumerable<Customer>> GetVipCustomersAsync();
    Task<Customer> GetCustomerWithOrderHistoryAsync(CustomerId customerId);
    Task<bool> IsEmailAlreadyRegisteredAsync(EmailAddress email);
}

public interface IProductRepository : IRepository<Product, ProductId>
{
    Task<IEnumerable<Product>> GetByCategoryAsync(ProductCategory category);
    Task<IEnumerable<Product>> GetAvailableProductsAsync();
    Task<IEnumerable<Product>> SearchProductsAsync(string searchTerm);
    Task<IEnumerable<Product>> GetFeaturedProductsAsync();
    Task<IEnumerable<Product>> GetRelatedProductsAsync(ProductId productId);
    Task<PaginatedResult<Product>> GetProductsPagedAsync(int pageSize, int pageNumber, ProductFilter filter);
}
\`\`\`

## 高度なリポジトリ実装パターン

### 仕様パターン（Specification Pattern）との組み合わせ

\`\`\`csharp
// 仕様インターフェース
public interface ISpecification<T>
{
    Expression<Func<T, bool>> ToExpression();
    bool IsSatisfiedBy(T entity);
}

// 具体的な仕様の実装
public class CustomerSpecifications
{
    public static ISpecification<Customer> ActiveCustomers()
    {
        return new Specification<Customer>(customer => customer.Status == CustomerStatus.Active);
    }
    
    public static ISpecification<Customer> VipCustomers()
    {
        return new Specification<Customer>(customer => 
            customer.TotalOrderAmount.Amount >= 1000000); // 100万円以上
    }
    
    public static ISpecification<Customer> CustomersInRegion(string region)
    {
        return new Specification<Customer>(customer => 
            customer.Address.Prefecture == region);
    }
    
    public static ISpecification<Customer> RecentlyActiveCustomers(DateTime sinceDate)
    {
        return new Specification<Customer>(customer => 
            customer.LastOrderDate >= sinceDate);
    }
    
    // 仕様の組み合わせ
    public static ISpecification<Customer> VipCustomersInTokyo()
    {
        return VipCustomers().And(CustomersInRegion("東京都"));
    }
}

// 仕様対応リポジトリ
public interface ICustomerRepository : IRepository<Customer, CustomerId>
{
    Task<IEnumerable<Customer>> FindAsync(ISpecification<Customer> specification);
    Task<PaginatedResult<Customer>> FindPagedAsync(
        ISpecification<Customer> specification, 
        int pageSize, 
        int pageNumber,
        OrderBy<Customer> orderBy = null);
    Task<int> CountAsync(ISpecification<Customer> specification);
    Task<bool> AnyAsync(ISpecification<Customer> specification);
}

// 仕様の基底実装
public class Specification<T> : ISpecification<T>
{
    private readonly Expression<Func<T, bool>> _expression;
    
    public Specification(Expression<Func<T, bool>> expression)
    {
        _expression = expression ?? throw new ArgumentNullException(nameof(expression));
    }
    
    public Expression<Func<T, bool>> ToExpression()
    {
        return _expression;
    }
    
    public bool IsSatisfiedBy(T entity)
    {
        var func = _expression.Compile();
        return func(entity);
    }
    
    public ISpecification<T> And(ISpecification<T> other)
    {
        return new AndSpecification<T>(this, other);
    }
    
    public ISpecification<T> Or(ISpecification<T> other)
    {
        return new OrSpecification<T>(this, other);
    }
    
    public ISpecification<T> Not()
    {
        return new NotSpecification<T>(this);
    }
}

// 論理演算仕様
public class AndSpecification<T> : ISpecification<T>
{
    private readonly ISpecification<T> _left;
    private readonly ISpecification<T> _right;
    
    public AndSpecification(ISpecification<T> left, ISpecification<T> right)
    {
        _left = left;
        _right = right;
    }
    
    public Expression<Func<T, bool>> ToExpression()
    {
        var leftExpression = _left.ToExpression();
        var rightExpression = _right.ToExpression();
        
        var parameter = Expression.Parameter(typeof(T));
        var leftVisitor = new ReplaceExpressionVisitor(leftExpression.Parameters[0], parameter);
        var rightVisitor = new ReplaceExpressionVisitor(rightExpression.Parameters[0], parameter);
        
        var left = leftVisitor.Visit(leftExpression.Body);
        var right = rightVisitor.Visit(rightExpression.Body);
        
        return Expression.Lambda<Func<T, bool>>(Expression.AndAlso(left, right), parameter);
    }
    
    public bool IsSatisfiedBy(T entity)
    {
        return _left.IsSatisfiedBy(entity) && _right.IsSatisfiedBy(entity);
    }
}
\`\`\`

### Entity Framework Core でのリポジトリ実装

\`\`\`csharp
// EF Core を使用したリポジトリの実装
public class EfCustomerRepository : ICustomerRepository
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<EfCustomerRepository> _logger;
    
    public EfCustomerRepository(ApplicationDbContext context, ILogger<EfCustomerRepository> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
    
    public async Task<Customer> GetByIdAsync(CustomerId id)
    {
        _logger.LogDebug("顧客ID \\{CustomerId\\} を検索しています", id.Value);
        
        var customer = await _context.Customers
            .Include(c => c.Orders)
            .ThenInclude(o => o.Items)
            .FirstOrDefaultAsync(c => c.Id == id);
            
        if (customer == null)
        {
            _logger.LogWarning("顧客ID \\{CustomerId\\} が見つかりませんでした", id.Value);
        }
        
        return customer;
    }
    
    public async Task<Customer> GetByEmailAsync(EmailAddress email)
    {
        _logger.LogDebug("メールアドレス \\{Email\\} で顧客を検索しています", email.Value);
        
        return await _context.Customers
            .FirstOrDefaultAsync(c => c.Email.Value == email.Value);
    }
    
    public async Task<IEnumerable<Customer>> FindAsync(ISpecification<Customer> specification)
    {
        _logger.LogDebug("仕様に基づいて顧客を検索しています");
        
        return await _context.Customers
            .Where(specification.ToExpression())
            .ToListAsync();
    }
    
    public async Task<PaginatedResult<Customer>> FindPagedAsync(
        ISpecification<Customer> specification, 
        int pageSize, 
        int pageNumber,
        OrderBy<Customer> orderBy = null)
    {
        var query = _context.Customers.Where(specification.ToExpression());
        
        // 並び順の適用
        if (orderBy != null)
        {
            query = orderBy.IsDescending 
                ? query.OrderByDescending(orderBy.Expression)
                : query.OrderBy(orderBy.Expression);
        }
        
        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
            
        return new PaginatedResult<Customer>(items, totalCount, pageNumber, pageSize);
    }
    
    public async Task<Customer> AddAsync(Customer customer)
    {
        _logger.LogDebug("新しい顧客を追加しています: \\{CustomerName\\}", customer.Name);
        
        var entry = await _context.Customers.AddAsync(customer);
        return entry.Entity;
    }
    
    public async Task<Customer> UpdateAsync(Customer customer)
    {
        _logger.LogDebug("顧客を更新しています: \\{CustomerId\\}", customer.Id.Value);
        
        _context.Entry(customer).State = EntityState.Modified;
        return customer;
    }
    
    public async Task DeleteAsync(CustomerId id)
    {
        _logger.LogDebug("顧客を削除しています: \\{CustomerId\\}", id.Value);
        
        var customer = await _context.Customers.FindAsync(id);
        if (customer != null)
        {
            _context.Customers.Remove(customer);
        }
    }
    
    public async Task<bool> ExistsAsync(CustomerId id)
    {
        return await _context.Customers.AnyAsync(c => c.Id == id);
    }
    
    public async Task<bool> IsEmailAlreadyRegisteredAsync(EmailAddress email)
    {
        return await _context.Customers.AnyAsync(c => c.Email.Value == email.Value);
    }
    
    public async Task SaveChangesAsync()
    {
        try
        {
            await _context.SaveChangesAsync();
            _logger.LogDebug("データベースへの変更が保存されました");
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "データベースの更新中にエラーが発生しました");
            throw new RepositoryException("データベースの更新に失敗しました", ex);
        }
    }
    
    // 高度なクエリメソッド
    public async Task<IEnumerable<Customer>> GetVipCustomersAsync()
    {
        return await _context.Customers
            .Where(c => c.Orders.Sum(o => o.TotalAmount.Amount) >= 1000000)
            .OrderByDescending(c => c.Orders.Sum(o => o.TotalAmount.Amount))
            .ToListAsync();
    }
    
    public async Task<CustomerStatistics> GetCustomerStatisticsAsync(DateTime startDate, DateTime endDate)
    {
        var statistics = await _context.Customers
            .Where(c => c.RegisteredAt >= startDate && c.RegisteredAt <= endDate)
            .GroupBy(c => 1)
            .Select(g => new CustomerStatistics
            {
                TotalCustomers = g.Count(),
                ActiveCustomers = g.Count(c => c.Status == CustomerStatus.Active),
                VipCustomers = g.Count(c => c.Orders.Sum(o => o.TotalAmount.Amount) >= 1000000),
                AverageOrderValue = g.SelectMany(c => c.Orders).Average(o => o.TotalAmount.Amount)
            })
            .FirstOrDefaultAsync();
            
        return statistics ?? new CustomerStatistics();
    }
}

// リポジトリ基底クラス
public abstract class EfRepositoryBase<TEntity, TId> : IRepository<TEntity, TId>
    where TEntity : AggregateRoot<TId>
    where TId : class
{
    protected readonly ApplicationDbContext Context;
    protected readonly DbSet<TEntity> DbSet;
    protected readonly ILogger Logger;
    
    protected EfRepositoryBase(ApplicationDbContext context, ILogger logger)
    {
        Context = context ?? throw new ArgumentNullException(nameof(context));
        Logger = logger ?? throw new ArgumentNullException(nameof(logger));
        DbSet = context.Set<TEntity>();
    }
    
    public virtual async Task<TEntity> GetByIdAsync(TId id)
    {
        return await DbSet.FindAsync(id);
    }
    
    public virtual async Task<IEnumerable<TEntity>> GetAllAsync()
    {
        return await DbSet.ToListAsync();
    }
    
    public virtual async Task<TEntity> AddAsync(TEntity entity)
    {
        var entry = await DbSet.AddAsync(entity);
        return entry.Entity;
    }
    
    public virtual async Task<TEntity> UpdateAsync(TEntity entity)
    {
        Context.Entry(entity).State = EntityState.Modified;
        return entity;
    }
    
    public virtual async Task DeleteAsync(TId id)
    {
        var entity = await DbSet.FindAsync(id);
        if (entity != null)
        {
            DbSet.Remove(entity);
        }
    }
    
    public virtual async Task<bool> ExistsAsync(TId id)
    {
        return await DbSet.FindAsync(id) != null;
    }
    
    public virtual async Task SaveChangesAsync()
    {
        await Context.SaveChangesAsync();
    }
}
\`\`\`

## ファクトリーパターン（Factory Pattern）

### ファクトリーパターンの目的

**ファクトリーパターン**は、複雑なオブジェクト生成ロジックをカプセル化し、適切な初期状態でオブジェクトを作成します：

1. **複雑な生成ロジック**: 複数のパラメータや条件分岐を含む生成
2. **不変性の保証**: 作成時にビジネスルールを適用
3. **依存関係の解決**: 必要な依存オブジェクトの自動作成
4. **ポリモーフィズム**: 条件に応じて異なる実装を作成

### ドメインファクトリーの実装

\`\`\`csharp
// 顧客ファクトリーインターフェース
public interface ICustomerFactory
{
    Task<Customer> CreateNewCustomerAsync(CustomerRegistration registration);
    Task<Customer> CreateCorporateCustomerAsync(CorporateCustomerData data);
    Task<Customer> CreateFromExternalDataAsync(ExternalCustomerData externalData);
    Customer CreateGuestCustomer(EmailAddress email);
}

// 顧客ファクトリーの実装
public class CustomerFactory : ICustomerFactory
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IAddressValidationService _addressValidationService;
    private readonly ICreditCheckService _creditCheckService;
    private readonly ILogger<CustomerFactory> _logger;
    
    public CustomerFactory(
        ICustomerRepository customerRepository,
        IAddressValidationService addressValidationService,
        ICreditCheckService creditCheckService,
        ILogger<CustomerFactory> logger)
    {
        _customerRepository = customerRepository ?? throw new ArgumentNullException(nameof(customerRepository));
        _addressValidationService = addressValidationService ?? throw new ArgumentNullException(nameof(addressValidationService));
        _creditCheckService = creditCheckService ?? throw new ArgumentNullException(nameof(creditCheckService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
    
    public async Task<Customer> CreateNewCustomerAsync(CustomerRegistration registration)
    {
        _logger.LogDebug("新規顧客を作成しています: \\{Email\\}", registration.Email.Value);
        
        // 1. 重複チェック
        if (await _customerRepository.IsEmailAlreadyRegisteredAsync(registration.Email))
        {
            throw new DomainException($"メールアドレス \\{registration.Email\\} は既に登録されています");
        }
        
        // 2. 住所の検証
        var validatedAddress = await _addressValidationService.ValidateAndNormalizeAsync(registration.Address);
        if (!validatedAddress.IsValid)
        {
            throw new DomainException($"住所が無効です: \\{validatedAddress.ErrorMessage\\}");
        }
        
        // 3. 信用度チェック（オプション）
        var creditRating = CreditRating.Unknown;
        if (registration.RequestCreditCheck)
        {
            try
            {
                creditRating = await _creditCheckService.GetCreditRatingAsync(
                    registration.PersonName, 
                    validatedAddress.ValidatedAddress);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "信用度チェックに失敗しました");
                // 信用度チェックの失敗は顧客作成を阻害しない
            }
        }
        
        // 4. 会員タイプの決定
        var membershipType = DetermineMembershipType(registration, creditRating);
        
        // 5. 顧客オブジェクトの作成
        var customer = Customer.Register(
            registration.PersonName,
            registration.Email,
            validatedAddress.ValidatedAddress,
            membershipType,
            creditRating);
        
        // 6. 初期設定の適用
        ApplyInitialCustomerSettings(customer, registration);
        
        _logger.LogInformation("新規顧客が作成されました: \\{CustomerId\\} (\\{Email\\})", 
            customer.Id.Value, customer.Email.Value);
        
        return customer;
    }
    
    public async Task<Customer> CreateCorporateCustomerAsync(CorporateCustomerData data)
    {
        _logger.LogDebug("法人顧客を作成しています: \\{CompanyName\\}", data.CompanyName);
        
        // 法人固有の検証
        await ValidateCorporateDataAsync(data);
        
        // 法人顧客の作成
        var customer = Customer.RegisterCorporate(
            data.CompanyName,
            data.ContactPersonName,
            data.Email,
            data.BusinessAddress,
            data.TaxNumber,
            data.BusinessType);
        
        // 法人向け初期設定
        customer.SetCreditLimit(data.RequestedCreditLimit);
        customer.SetPaymentTerms(data.PaymentTerms);
        
        return customer;
    }
    
    public async Task<Customer> CreateFromExternalDataAsync(ExternalCustomerData externalData)
    {
        _logger.LogDebug("外部データから顧客を作成しています: \\{ExternalId\\}", externalData.ExternalId);
        
        // 外部データの変換とマッピング
        var mappedData = await MapExternalDataAsync(externalData);
        
        // 標準的な顧客作成プロセスを使用
        var registration = new CustomerRegistration
        {
            PersonName = mappedData.Name,
            Email = mappedData.Email,
            Address = mappedData.Address,
            RequestCreditCheck = false // 外部データからの場合は信用度チェックをスキップ
        };
        
        var customer = await CreateNewCustomerAsync(registration);
        
        // 外部データ固有の情報を設定
        customer.SetExternalReference(externalData.ExternalId, externalData.SourceSystem);
        
        return customer;
    }
    
    public Customer CreateGuestCustomer(EmailAddress email)
    {
        _logger.LogDebug("ゲスト顧客を作成しています: \\{Email\\}", email.Value);
        
        return Customer.CreateGuest(email);
    }
    
    // プライベートヘルパーメソッド
    private MembershipType DetermineMembershipType(CustomerRegistration registration, CreditRating creditRating)
    {
        // 会員タイプの決定ロジック
        if (registration.IsVipApplication && creditRating.IsGoodOrBetter())
        {
            return MembershipType.VIP;
        }
        
        if (creditRating.IsExcellent())
        {
            return MembershipType.Premium;
        }
        
        return MembershipType.Standard;
    }
    
    private void ApplyInitialCustomerSettings(Customer customer, CustomerRegistration registration)
    {
        // 初期設定の適用
        if (registration.NewsletterSubscription)
        {
            customer.SubscribeToNewsletter();
        }
        
        if (registration.MarketingEmails)
        {
            customer.EnableMarketingEmails();
        }
        
        if (registration.PreferredLanguage != null)
        {
            customer.SetPreferredLanguage(registration.PreferredLanguage);
        }
    }
    
    private async Task ValidateCorporateDataAsync(CorporateCustomerData data)
    {
        // 法人固有の検証ロジック
        if (string.IsNullOrWhiteSpace(data.TaxNumber))
        {
            throw new DomainException("法人番号は必須です");
        }
        
        // 法人番号の形式チェック
        if (!IsValidTaxNumber(data.TaxNumber))
        {
            throw new DomainException("法人番号の形式が正しくありません");
        }
        
        // 既存法人の重複チェック
        var existingCorporate = await _customerRepository.GetByTaxNumberAsync(data.TaxNumber);
        if (existingCorporate != null)
        {
            throw new DomainException($"法人番号 \\{data.TaxNumber\\} は既に登録されています");
        }
    }
    
    private async Task<MappedCustomerData> MapExternalDataAsync(ExternalCustomerData externalData)
    {
        // 外部システム固有のデータマッピングロジック
        return externalData.SourceSystem switch
        {
            "CRM_SYSTEM_A" => await MapFromCrmSystemA(externalData),
            "ERP_SYSTEM_B" => await MapFromErpSystemB(externalData),
            "LEGACY_SYSTEM" => await MapFromLegacySystem(externalData),
            _ => throw new NotSupportedException($"未対応の外部システムです: \\{externalData.SourceSystem\\}")
        };
    }
    
    private bool IsValidTaxNumber(string taxNumber)
    {
        // 法人番号の検証ロジック（簡略化）
        return taxNumber.Length == 13 && taxNumber.All(char.IsDigit);
    }
}

// 注文ファクトリーの実装
public class OrderFactory : IOrderFactory
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IProductRepository _productRepository;
    private readonly IInventoryService _inventoryService;
    private readonly IPricingService _pricingService;
    private readonly IPromotionService _promotionService;
    private readonly ILogger<OrderFactory> _logger;
    
    public OrderFactory(
        ICustomerRepository customerRepository,
        IProductRepository productRepository,
        IInventoryService inventoryService,
        IPricingService pricingService,
        IPromotionService promotionService,
        ILogger<OrderFactory> logger)
    {
        _customerRepository = customerRepository ?? throw new ArgumentNullException(nameof(customerRepository));
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _inventoryService = inventoryService ?? throw new ArgumentNullException(nameof(inventoryService));
        _pricingService = pricingService ?? throw new ArgumentNullException(nameof(pricingService));
        _promotionService = promotionService ?? throw new ArgumentNullException(nameof(promotionService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
    
    public async Task<Order> CreateOrderFromCartAsync(ShoppingCart cart)
    {
        _logger.LogDebug("ショッピングカートから注文を作成しています: \\{CartId\\}", cart.Id.Value);
        
        // 1. 顧客の検証
        var customer = await _customerRepository.GetByIdAsync(cart.CustomerId);
        if (customer == null)
        {
            throw new DomainException("顧客が見つかりません");
        }
        
        if (!customer.CanPlaceOrder())
        {
            throw new DomainException("この顧客は注文を行うことができません");
        }
        
        // 2. 注文の作成
        var order = Order.Create(cart.CustomerId, cart.DeliveryAddress);
        
        // 3. カート内商品の処理
        foreach (var cartItem in cart.Items)
        {
            await AddCartItemToOrder(order, cartItem);
        }
        
        // 4. プロモーションの適用
        await ApplyEligiblePromotions(order);
        
        // 5. 配送オプションの設定
        var shippingOption = await DetermineOptimalShipping(order);
        order.SetShippingOption(shippingOption);
        
        _logger.LogInformation("ショッピングカートから注文が作成されました: \\{OrderId\\}", order.Id.Value);
        
        return order;
    }
    
    public async Task<Order> CreateQuickOrderAsync(CustomerId customerId, ProductId productId, int quantity)
    {
        _logger.LogDebug("クイック注文を作成しています: 顧客\\{CustomerId\\}, 商品\\{ProductId\\}", 
            customerId.Value, productId.Value);
        
        var customer = await _customerRepository.GetByIdAsync(customerId);
        var product = await _productRepository.GetByIdAsync(productId);
        
        if (customer == null || product == null)
        {
            throw new DomainException("顧客または商品が見つかりません");
        }
        
        // 在庫確認
        var availability = await _inventoryService.CheckAvailabilityAsync(productId, quantity);
        if (!availability.IsAvailable)
        {
            throw new DomainException($"商品の在庫が不足しています (必要: \\{quantity\\}, 在庫: \\{availability.AvailableQuantity\\})");
        }
        
        // 現在価格の取得
        var currentPrice = await _pricingService.GetCurrentPriceAsync(productId);
        
        // 注文作成
        var order = Order.Create(customerId, customer.DefaultShippingAddress);
        order.AddItem(product, new Quantity(quantity), currentPrice);
        
        return order;
    }
    
    public async Task<Order> CreateSubscriptionOrderAsync(SubscriptionPlan plan, CustomerId customerId)
    {
        _logger.LogDebug("定期購入注文を作成しています: プラン\\{PlanId\\}, 顧客\\{CustomerId\\}", 
            plan.Id.Value, customerId.Value);
        
        var customer = await _customerRepository.GetByIdAsync(customerId);
        if (customer == null)
        {
            throw new DomainException("顧客が見つかりません");
        }
        
        // 定期購入可能性のチェック
        if (!customer.CanSubscribeToPlans())
        {
            throw new DomainException("この顧客は定期購入プランに加入できません");
        }
        
        // 定期購入注文の作成
        var order = Order.CreateSubscriptionOrder(customerId, customer.DefaultShippingAddress, plan);
        
        // プラン内容の注文アイテムへの変換
        foreach (var planItem in plan.Items)
        {
            var product = await _productRepository.GetByIdAsync(planItem.ProductId);
            order.AddItem(product, planItem.Quantity, planItem.DiscountedPrice);
        }
        
        // 定期購入割引の適用
        var subscriptionDiscount = await _promotionService.GetSubscriptionDiscountAsync(plan);
        if (subscriptionDiscount != null)
        {
            order.ApplyDiscount(subscriptionDiscount);
        }
        
        return order;
    }
    
    private async Task AddCartItemToOrder(Order order, CartItem cartItem)
    {
        var product = await _productRepository.GetByIdAsync(cartItem.ProductId);
        if (product == null)
        {
            _logger.LogWarning("商品が見つかりません: \\{ProductId\\}", cartItem.ProductId.Value);
            return; // スキップ
        }
        
        // 在庫確認
        var availability = await _inventoryService.CheckAvailabilityAsync(cartItem.ProductId, cartItem.Quantity.Value);
        if (!availability.IsAvailable)
        {
            throw new DomainException($"商品 '\\{product.Name\\}' の在庫が不足しています");
        }
        
        // 現在価格の取得
        var currentPrice = await _pricingService.GetCurrentPriceAsync(cartItem.ProductId);
        
        order.AddItem(product, cartItem.Quantity, currentPrice);
    }
    
    private async Task ApplyEligiblePromotions(Order order)
    {
        var applicablePromotions = await _promotionService.GetApplicablePromotionsAsync(order);
        
        foreach (var promotion in applicablePromotions.OrderBy(p => p.Priority))
        {
            if (promotion.CanBeAppliedTo(order))
            {
                order.ApplyPromotion(promotion);
            }
        }
    }
    
    private async Task<ShippingOption> DetermineOptimalShipping(Order order)
    {
        var availableOptions = await _shippingService.GetAvailableOptionsAsync(order.DeliveryAddress, order.Items);
        
        // 最適な配送オプションの選択ロジック
        return availableOptions
            .Where(option => option.IsCompatibleWith(order))
            .OrderBy(option => option.Cost.Amount)
            .ThenBy(option => option.EstimatedDays)
            .First();
    }
}
\`\`\`

## 抽象ファクトリーパターン

### 複数のファクトリーを組み合わせた抽象ファクトリー

\`\`\`csharp
// 抽象ファクトリーインターフェース
public interface IDomainFactory
{
    ICustomerFactory CustomerFactory { get; }
    IOrderFactory OrderFactory { get; }
    IProductFactory ProductFactory { get; }
    IPaymentFactory PaymentFactory { get; }
}

// 具体的な抽象ファクトリーの実装
public class DomainFactory : IDomainFactory
{
    public ICustomerFactory CustomerFactory { get; }
    public IOrderFactory OrderFactory { get; }
    public IProductFactory ProductFactory { get; }
    public IPaymentFactory PaymentFactory { get; }
    
    public DomainFactory(
        ICustomerFactory customerFactory,
        IOrderFactory orderFactory,
        IProductFactory productFactory,
        IPaymentFactory paymentFactory)
    {
        CustomerFactory = customerFactory ?? throw new ArgumentNullException(nameof(customerFactory));
        OrderFactory = orderFactory ?? throw new ArgumentNullException(nameof(orderFactory));
        ProductFactory = productFactory ?? throw new ArgumentNullException(nameof(productFactory));
        PaymentFactory = paymentFactory ?? throw new ArgumentNullException(nameof(paymentFactory));
    }
}

// 設定可能なファクトリー選択
public class ConfigurableDomainFactory : IDomainFactory
{
    private readonly IServiceProvider _serviceProvider;
    private readonly FactoryConfiguration _configuration;
    
    public ConfigurableDomainFactory(IServiceProvider serviceProvider, FactoryConfiguration configuration)
    {
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
    }
    
    public ICustomerFactory CustomerFactory => 
        _serviceProvider.GetRequiredService(_configuration.CustomerFactoryType) as ICustomerFactory;
    
    public IOrderFactory OrderFactory => 
        _serviceProvider.GetRequiredService(_configuration.OrderFactoryType) as IOrderFactory;
    
    public IProductFactory ProductFactory => 
        _serviceProvider.GetRequiredService(_configuration.ProductFactoryType) as IProductFactory;
    
    public IPaymentFactory PaymentFactory => 
        _serviceProvider.GetRequiredService(_configuration.PaymentFactoryType) as IPaymentFactory;
}

public class FactoryConfiguration
{
    public Type CustomerFactoryType { get; set; } = typeof(CustomerFactory);
    public Type OrderFactoryType { get; set; } = typeof(OrderFactory);
    public Type ProductFactoryType { get; set; } = typeof(ProductFactory);
    public Type PaymentFactoryType { get; set; } = typeof(PaymentFactory);
}
\`\`\`

## 実践的な設計パターンの組み合わせ

### リポジトリとファクトリーの協調

\`\`\`csharp
// アプリケーションサービスでの使用例
public class CustomerApplicationService
{
    private readonly ICustomerRepository _customerRepository;
    private readonly ICustomerFactory _customerFactory;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CustomerApplicationService> _logger;
    
    public CustomerApplicationService(
        ICustomerRepository customerRepository,
        ICustomerFactory customerFactory,
        IUnitOfWork unitOfWork,
        ILogger<CustomerApplicationService> logger)
    {
        _customerRepository = customerRepository ?? throw new ArgumentNullException(nameof(customerRepository));
        _customerFactory = customerFactory ?? throw new ArgumentNullException(nameof(customerFactory));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
    
    public async Task<CustomerId> RegisterNewCustomerAsync(CustomerRegistrationCommand command)
    {
        _logger.LogInformation("新規顧客登録を開始します: \\{Email\\}", command.Email);
        
        try
        {
            // 1. ファクトリーを使用して顧客を作成
            var registration = new CustomerRegistration
            {
                PersonName = new PersonName(command.FirstName, command.LastName),
                Email = new EmailAddress(command.Email),
                Address = new Address(command.PostalCode, command.Prefecture, 
                                    command.City, command.AddressLine1, command.AddressLine2),
                RequestCreditCheck = command.RequestCreditCheck,
                NewsletterSubscription = command.SubscribeToNewsletter,
                MarketingEmails = command.AllowMarketingEmails
            };
            
            var customer = await _customerFactory.CreateNewCustomerAsync(registration);
            
            // 2. リポジトリを使用して永続化
            await _customerRepository.AddAsync(customer);
            
            // 3. 作業単位でコミット
            await _unitOfWork.CommitAsync();
            
            _logger.LogInformation("新規顧客登録が完了しました: \\{CustomerId\\}", customer.Id.Value);
            
            return customer.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "新規顧客登録中にエラーが発生しました");
            await _unitOfWork.RollbackAsync();
            throw;
        }
    }
    
    public async Task<PaginatedResult<CustomerSummary>> SearchCustomersAsync(CustomerSearchQuery query)
    {
        _logger.LogDebug("顧客検索を実行します: \\{SearchTerm\\}", query.SearchTerm);
        
        // 仕様パターンを使用した検索
        var specification = BuildSearchSpecification(query);
        var orderBy = BuildOrderByExpression(query.SortBy, query.SortDirection);
        
        var customers = await _customerRepository.FindPagedAsync(
            specification, 
            query.PageSize, 
            query.PageNumber, 
            orderBy);
        
        // DTOに変換
        var customerSummaries = customers.Items.Select(MapToCustomerSummary).ToList();
        
        return new PaginatedResult<CustomerSummary>(
            customerSummaries, 
            customers.TotalCount, 
            customers.PageNumber, 
            customers.PageSize);
    }
    
    private ISpecification<Customer> BuildSearchSpecification(CustomerSearchQuery query)
    {
        var specifications = new List<ISpecification<Customer>>();
        
        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
        {
            specifications.Add(new Specification<Customer>(c => 
                c.Name.FullName.Contains(query.SearchTerm) ||
                c.Email.Value.Contains(query.SearchTerm)));
        }
        
        if (query.Status.HasValue)
        {
            specifications.Add(new Specification<Customer>(c => c.Status == query.Status.Value));
        }
        
        if (query.MembershipType.HasValue)
        {
            specifications.Add(new Specification<Customer>(c => c.MembershipType == query.MembershipType.Value));
        }
        
        if (query.RegisteredAfter.HasValue)
        {
            specifications.Add(new Specification<Customer>(c => c.RegisteredAt >= query.RegisteredAfter.Value));
        }
        
        // すべての仕様をAND結合
        return specifications.Aggregate((left, right) => left.And(right));
    }
    
    private CustomerSummary MapToCustomerSummary(Customer customer)
    {
        return new CustomerSummary
        {
            CustomerId = customer.Id.Value,
            Name = customer.Name.FullName,
            Email = customer.Email.Value,
            Status = customer.Status,
            MembershipType = customer.MembershipType,
            RegisteredAt = customer.RegisteredAt,
            TotalOrderCount = customer.Orders.Count,
            TotalOrderAmount = customer.CalculateTotalOrderAmount().Amount
        };
    }
}

// 作業単位パターンの実装
public interface IUnitOfWork
{
    Task<int> CommitAsync();
    Task RollbackAsync();
    void RegisterNew<T>(T entity) where T : class;
    void RegisterModified<T>(T entity) where T : class;
    void RegisterDeleted<T>(T entity) where T : class;
}

public class EfUnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<EfUnitOfWork> _logger;
    
    public EfUnitOfWork(ApplicationDbContext context, ILogger<EfUnitOfWork> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
    
    public async Task<int> CommitAsync()
    {
        try
        {
            var result = await _context.SaveChangesAsync();
            _logger.LogDebug("\\{ChangeCount\\} 件の変更がコミットされました", result);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "コミット中にエラーが発生しました");
            throw;
        }
    }
    
    public async Task RollbackAsync()
    {
        _logger.LogDebug("トランザクションをロールバックしています");
        
        foreach (var entry in _context.ChangeTracker.Entries())
        {
            switch (entry.State)
            {
                case EntityState.Modified:
                    entry.State = EntityState.Unchanged;
                    break;
                case EntityState.Added:
                    entry.State = EntityState.Detached;
                    break;
                case EntityState.Deleted:
                    entry.State = EntityState.Unchanged;
                    break;
            }
        }
        
        await Task.CompletedTask;
    }
    
    public void RegisterNew<T>(T entity) where T : class
    {
        _context.Set<T>().Add(entity);
    }
    
    public void RegisterModified<T>(T entity) where T : class
    {
        _context.Entry(entity).State = EntityState.Modified;
    }
    
    public void RegisterDeleted<T>(T entity) where T : class
    {
        _context.Set<T>().Remove(entity);
    }
}
\`\`\`

## 設計のベストプラクティス

### リポジトリパターンのガイドライン

1. **集約ごとにリポジトリを作成**: 一つの集約に対して一つのリポジトリ
2. **コレクションライクなインターフェース**: メモリ内コレクションのように扱える
3. **仕様パターンの活用**: 複雑な検索条件を表現力豊かに記述
4. **ページング対応**: 大量データの効率的な処理
5. **非同期処理の採用**: I/O集約的な操作の性能向上

### ファクトリーパターンのガイドライン

1. **複雑な生成ロジックの抽象化**: 条件分岐やバリデーションを含む生成
2. **不変性の保証**: 作成時点でビジネスルールを適用
3. **依存関係の解決**: 必要なサービスの自動注入
4. **エラーハンドリング**: 適切な例外処理とログ出力
5. **テスタビリティ**: モックしやすいインターフェース設計

## まとめ

リポジトリパターンとファクトリーパターンは、DDDにおけるドメインモデルの品質を保つための重要なパターンです：

### リポジトリパターンの価値
- **永続化技術からの分離**: ドメインロジックをデータベースから独立
- **テスタビリティの向上**: モックを使った単体テストが容易
- **技術的柔軟性**: データストアの変更が容易
- **表現力の向上**: ビジネス的な意味を持つクエリメソッド

### ファクトリーパターンの価値
- **複雑性の隠蔽**: オブジェクト生成の複雑さをカプセル化
- **一貫性の保証**: 作成時のビジネスルール適用
- **再利用性**: 共通の生成ロジックの再利用
- **保守性**: 生成ロジックの変更が局所化

次のレッスンでは、ドメインイベントパターンについて学習し、集約間の疎結合な連携方法を詳しく学びます。
`,
  codeExamples: [
    {
      id: 'repository-pattern-example',
      title: '高度なリポジトリパターンの実装',
      description: '仕様パターンと組み合わせた柔軟性の高いリポジトリの実装例',
      language: 'csharp',
      code: `using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

// === 高度なリポジトリパターンの実装 ===

namespace AdvancedRepositoryPattern
{
    /// <summary>
    /// 仕様パターンとページング対応リポジトリの実装
    /// </summary>
    public class AdvancedOrderRepository : IOrderRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdvancedOrderRepository> _logger;
        private readonly IQueryOptimizer _queryOptimizer;
        
        public AdvancedOrderRepository(
            ApplicationDbContext context, 
            ILogger<AdvancedOrderRepository> logger,
            IQueryOptimizer queryOptimizer)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _queryOptimizer = queryOptimizer ?? throw new ArgumentNullException(nameof(queryOptimizer));
        }
        
        public async Task<Order> GetByIdAsync(OrderId id)
        {
            _logger.LogDebug("注文ID \\{OrderId\\} を検索しています", id.Value);
            
            var order = await _context.Orders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .Include(o => o.Customer)
                .Include(o => o.ShippingAddress)
                .AsSplitQuery() // 複数のIncludeを効率的に処理
                .FirstOrDefaultAsync(o => o.Id == id);
                
            if (order == null)
            {
                _logger.LogWarning("注文ID \\{OrderId\\} が見つかりませんでした", id.Value);
            }
            else
            {
                _logger.LogDebug("注文を取得しました: \\{OrderNumber\\} (\\{Status\\})", 
                    order.OrderNumber.Value, order.Status);
            }
            
            return order;
        }
        
        public async Task<PagedResult<Order>> FindOrdersAsync(
            ISpecification<Order> specification,
            OrderSortOptions sortOptions,
            PagingOptions pagingOptions)
        {
            _logger.LogDebug("仕様に基づいて注文を検索しています - ページ: \\{Page\\}, サイズ: \\{Size\\}", 
                pagingOptions.PageNumber, pagingOptions.PageSize);
            
            var query = _context.Orders.AsQueryable();
            
            // 仕様の適用
            if (specification != null)
            {
                query = query.Where(specification.ToExpression());
            }
            
            // 総件数の取得（ソート前に実行して効率化）
            var totalCount = await query.CountAsync();
            
            // ソートの適用
            query = ApplySorting(query, sortOptions);
            
            // ページングの適用
            var orders = await query
                .Skip((pagingOptions.PageNumber - 1) * pagingOptions.PageSize)
                .Take(pagingOptions.PageSize)
                .Include(o => o.Items)
                .Include(o => o.Customer)
                .AsSplitQuery()
                .ToListAsync();
            
            _logger.LogDebug("\\{Count\\} 件の注文を取得しました（全\\{Total\\}件中）", 
                orders.Count, totalCount);
            
            return new PagedResult<Order>(orders, totalCount, pagingOptions.PageNumber, pagingOptions.PageSize);
        }
        
        public async Task<IEnumerable<Order>> GetOrdersRequiringActionAsync()
        {
            _logger.LogDebug("対応が必要な注文を検索しています");
            
            var cutoffDate = DateTime.UtcNow.AddDays(-7); // 7日前
            
            var query = _context.Orders.Where(o => 
                (o.Status == OrderStatus.Pending && o.CreatedAt < cutoffDate) ||
                (o.Status == OrderStatus.PaymentFailed) ||
                (o.Status == OrderStatus.Shipped && o.EstimatedDeliveryDate < DateTime.UtcNow.AddDays(-3)) ||
                (o.Status == OrderStatus.Confirmed && !o.PaymentDate.HasValue && o.CreatedAt < DateTime.UtcNow.AddHours(-24))
            );
            
            var orders = await query
                .Include(o => o.Customer)
                .Include(o => o.Items)
                .OrderBy(o => o.CreatedAt)
                .ToListAsync();
            
            _logger.LogInformation("対応が必要な注文: \\{Count\\}件", orders.Count);
            
            return orders;
        }
        
        public async Task<OrderAnalytics> GetOrderAnalyticsAsync(DateRange dateRange, CustomerId? customerId = null)
        {
            _logger.LogDebug("注文分析データを取得しています: \\{StartDate\\} - \\{EndDate\\}", 
                dateRange.StartDate, dateRange.EndDate);
            
            var query = _context.Orders.Where(o => 
                o.CreatedAt >= dateRange.StartDate && 
                o.CreatedAt <= dateRange.EndDate);
            
            if (customerId.HasValue)
            {
                query = query.Where(o => o.CustomerId == customerId.Value);
            }
            
            var analytics = await query
                .GroupBy(o => 1)
                .Select(g => new OrderAnalytics
                {
                    DateRange = dateRange,
                    TotalOrders = g.Count(),
                    TotalRevenue = g.Sum(o => o.TotalAmount.Amount),
                    AverageOrderValue = g.Average(o => o.TotalAmount.Amount),
                    CompletedOrders = g.Count(o => o.Status == OrderStatus.Completed),
                    CancelledOrders = g.Count(o => o.Status == OrderStatus.Cancelled),
                    PendingOrders = g.Count(o => o.Status == OrderStatus.Pending),
                    TopSellingProducts = g.SelectMany(o => o.Items)
                        .GroupBy(i => new \\{ i.ProductId, i.ProductName \\})
                        .OrderByDescending(pg => pg.Sum(i => i.Quantity.Value))
                        .Take(10)
                        .Select(pg => new ProductSalesInfo
                        {
                            ProductId = pg.Key.ProductId,
                            ProductName = pg.Key.ProductName,
                            TotalQuantitySold = pg.Sum(i => i.Quantity.Value),
                            TotalRevenue = pg.Sum(i => i.SubTotal.Amount)
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync();
            
            return analytics ?? new OrderAnalytics \\{ DateRange = dateRange \\};
        }
        
        public async Task<bool> HasRecentOrdersAsync(CustomerId customerId, TimeSpan timespan)
        {
            var cutoffDate = DateTime.UtcNow.Subtract(timespan);
            
            return await _context.Orders
                .AnyAsync(o => o.CustomerId == customerId && o.CreatedAt >= cutoffDate);
        }
        
        public async Task<IEnumerable<Order>> GetSimilarOrdersAsync(Order referenceOrder, int maxResults = 10)
        {
            _logger.LogDebug("類似注文を検索しています: \\{OrderId\\}", referenceOrder.Id.Value);
            
            // 同じ顧客の過去の注文から類似するものを検索
            var productIds = referenceOrder.Items.Select(i => i.ProductId).ToList();
            
            var similarOrders = await _context.Orders
                .Where(o => o.CustomerId == referenceOrder.CustomerId && 
                           o.Id != referenceOrder.Id &&
                           o.Items.Any(i => productIds.Contains(i.ProductId)))
                .Include(o => o.Items)
                .OrderByDescending(o => o.CreatedAt)
                .Take(maxResults)
                .ToListAsync();
            
            // 類似度でソート（共通商品数が多いほど類似度が高い）
            return similarOrders
                .OrderByDescending(o => o.Items.Count(i => productIds.Contains(i.ProductId)))
                .ToList();
        }
        
        public async Task<Order> AddAsync(Order order)
        {
            _logger.LogDebug("新しい注文を追加しています: \\{OrderNumber\\}", order.OrderNumber.Value);
            
            // 楽観的並行性制御の設定
            _context.Entry(order).Property("Version").CurrentValue = 0;
            
            var entry = await _context.Orders.AddAsync(order);
            
            _logger.LogInformation("注文が追加されました: \\{OrderId\\} (\\{OrderNumber\\})", 
                order.Id.Value, order.OrderNumber.Value);
            
            return entry.Entity;
        }
        
        public async Task<Order> UpdateAsync(Order order)
        {
            _logger.LogDebug("注文を更新しています: \\{OrderId\\}", order.Id.Value);
            
            try
            {
                _context.Entry(order).State = EntityState.Modified;
                
                // 楽観的並行性制御
                _context.Entry(order).Property("Version").OriginalValue = order.Version;
                
                return order;
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogWarning(ex, "注文の並行性エラーが発生しました: \\{OrderId\\}", order.Id.Value);
                throw new ConcurrencyException($"注文 \\{order.Id.Value\\} は他のユーザーによって更新されています", ex);
            }
        }
        
        public async Task DeleteAsync(OrderId id)
        {
            _logger.LogDebug("注文を削除しています: \\{OrderId\\}", id.Value);
            
            var order = await _context.Orders.FindAsync(id);
            if (order != null)
            {
                // 物理削除ではなく論理削除
                order.MarkAsDeleted();
                _context.Entry(order).State = EntityState.Modified;
                
                _logger.LogInformation("注文が論理削除されました: \\{OrderId\\}", id.Value);
            }
            else
            {
                _logger.LogWarning("削除対象の注文が見つかりませんでした: \\{OrderId\\}", id.Value);
            }
        }
        
        public async Task SaveChangesAsync()
        {
            try
            {
                var savedEntities = await _context.SaveChangesAsync();
                _logger.LogDebug("\\{Count\\} 件のエンティティが保存されました", savedEntities);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "データベース更新中にエラーが発生しました");
                throw new RepositoryException("注文の保存に失敗しました", ex);
            }
        }
        
        public async Task BulkUpdateStatusAsync(IEnumerable<OrderId> orderIds, OrderStatus newStatus, string reason)
        {
            _logger.LogDebug("\\{Count\\} 件の注文ステータスを一括更新しています: \\{Status\\}", 
                orderIds.Count(), newStatus);
            
            var orderIdList = orderIds.ToList();
            
            // 大量データの効率的な更新
            await _context.Database.ExecuteSqlRawAsync(
                "UPDATE Orders SET Status = \\{0\\}, LastModifiedAt = \\{1\\}, StatusChangeReason = \\{2\\} WHERE Id IN (\\{3\\})",
                newStatus.ToString(),
                DateTime.UtcNow,
                reason,
                string.Join(",", orderIdList.Select(id => $"'\\{id.Value\\}'")));
            
            _logger.LogInformation("\\{Count\\} 件の注文ステータスが更新されました", orderIdList.Count);
        }
        
        public async Task<Dictionary<OrderStatus, int>> GetStatusDistributionAsync(DateRange? dateRange = null)
        {
            var query = _context.Orders.AsQueryable();
            
            if (dateRange != null)
            {
                query = query.Where(o => o.CreatedAt >= dateRange.StartDate && o.CreatedAt <= dateRange.EndDate);
            }
            
            return await query
                .GroupBy(o => o.Status)
                .ToDictionaryAsync(g => g.Key, g => g.Count());
        }
        
        // プライベートヘルパーメソッド
        private IQueryable<Order> ApplySorting(IQueryable<Order> query, OrderSortOptions sortOptions)
        {
            if (sortOptions == null)
            {
                return query.OrderByDescending(o => o.CreatedAt); // デフォルトソート
            }
            
            return sortOptions.SortBy switch
            {
                OrderSortBy.CreatedAt => sortOptions.IsDescending 
                    ? query.OrderByDescending(o => o.CreatedAt)
                    : query.OrderBy(o => o.CreatedAt),
                    
                OrderSortBy.TotalAmount => sortOptions.IsDescending
                    ? query.OrderByDescending(o => o.TotalAmount.Amount)
                    : query.OrderBy(o => o.TotalAmount.Amount),
                    
                OrderSortBy.Status => sortOptions.IsDescending
                    ? query.OrderByDescending(o => o.Status)
                    : query.OrderBy(o => o.Status),
                    
                OrderSortBy.CustomerName => sortOptions.IsDescending
                    ? query.OrderByDescending(o => o.Customer.Name.FullName)
                    : query.OrderBy(o => o.Customer.Name.FullName),
                    
                _ => query.OrderByDescending(o => o.CreatedAt)
            };
        }
    }
    
    /// <summary>
    /// 注文検索用の仕様実装
    /// </summary>
    public static class OrderSpecifications
    {
        public static ISpecification<Order> ByCustomer(CustomerId customerId)
        {
            return new Specification<Order>(order => order.CustomerId == customerId);
        }
        
        public static ISpecification<Order> ByStatus(OrderStatus status)
        {
            return new Specification<Order>(order => order.Status == status);
        }
        
        public static ISpecification<Order> ByDateRange(DateTime startDate, DateTime endDate)
        {
            return new Specification<Order>(order => 
                order.CreatedAt >= startDate && order.CreatedAt <= endDate);
        }
        
        public static ISpecification<Order> ByTotalAmountRange(decimal minAmount, decimal maxAmount)
        {
            return new Specification<Order>(order => 
                order.TotalAmount.Amount >= minAmount && order.TotalAmount.Amount <= maxAmount);
        }
        
        public static ISpecification<Order> ContainsProduct(ProductId productId)
        {
            return new Specification<Order>(order => 
                order.Items.Any(item => item.ProductId == productId));
        }
        
        public static ISpecification<Order> IsOverdue()
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-30);
            return new Specification<Order>(order => 
                order.Status == OrderStatus.Pending && order.CreatedAt < cutoffDate);
        }
        
        public static ISpecification<Order> RequiresAttention()
        {
            return new Specification<Order>(order => 
                order.Status == OrderStatus.PaymentFailed ||
                order.Status == OrderStatus.ShippingDelayed ||
                (order.Status == OrderStatus.Pending && 
                 order.CreatedAt < DateTime.UtcNow.AddDays(-7)));
        }
        
        public static ISpecification<Order> IsHighValue(decimal threshold = 100000)
        {
            return new Specification<Order>(order => order.TotalAmount.Amount >= threshold);
        }
        
        public static ISpecification<Order> HasMultipleItems()
        {
            return new Specification<Order>(order => order.Items.Count > 1);
        }
        
        // 複合仕様の例
        public static ISpecification<Order> RecentHighValueOrders(int days = 30, decimal minAmount = 50000)
        {
            var recentSpec = ByDateRange(DateTime.UtcNow.AddDays(-days), DateTime.UtcNow);
            var highValueSpec = IsHighValue(minAmount);
            var completedSpec = ByStatus(OrderStatus.Completed);
            
            return recentSpec.And(highValueSpec).And(completedSpec);
        }
        
        public static ISpecification<Order> ProblematicOrders()
        {
            var overdueSpec = IsOverdue();
            var attentionSpec = RequiresAttention();
            var failedPaymentSpec = ByStatus(OrderStatus.PaymentFailed);
            
            return overdueSpec.Or(attentionSpec).Or(failedPaymentSpec);
        }
    }
    
    /// <summary>
    /// クエリ最適化サービス
    /// </summary>
    public interface IQueryOptimizer
    {
        IQueryable<T> OptimizeQuery<T>(IQueryable<T> query) where T : class;
        void WarmUpCache();
        QueryStatistics GetStatistics();
    }
    
    public class QueryOptimizer : IQueryOptimizer
    {
        private readonly ILogger<QueryOptimizer> _logger;
        private readonly Dictionary<string, QueryStats> _queryStats = new();
        
        public QueryOptimizer(ILogger<QueryOptimizer> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }
        
        public IQueryable<T> OptimizeQuery<T>(IQueryable<T> query) where T : class
        {
            var queryString = query.ToQueryString();
            var queryHash = queryString.GetHashCode().ToString();
            
            // クエリ統計の記録
            if (!_queryStats.ContainsKey(queryHash))
            {
                _queryStats[queryHash] = new QueryStats \\{ QueryText = queryString \\};
            }
            
            _queryStats[queryHash].ExecutionCount++;
            _queryStats[queryHash].LastExecuted = DateTime.UtcNow;
            
            // 最適化ヒントの適用
            if (typeof(T) == typeof(Order))
            {
                // 注文クエリの最適化
                return query.Cast<Order>()
                    .AsSplitQuery() // 複数のIncludeがある場合に有効
                    .AsNoTracking() // 読み取り専用の場合
                    .Cast<T>();
            }
            
            return query.AsNoTracking(); // デフォルト最適化
        }
        
        public void WarmUpCache()
        {
            _logger.LogInformation("クエリキャッシュのウォームアップを開始します");
            
            // よく使用されるクエリを事前実行してキャッシュを準備
            // 実装は環境に応じて調整
        }
        
        public QueryStatistics GetStatistics()
        {
            return new QueryStatistics
            {
                TotalQueries = _queryStats.Count,
                TotalExecutions = _queryStats.Sum(kvp => kvp.Value.ExecutionCount),
                MostExecutedQueries = _queryStats
                    .OrderByDescending(kvp => kvp.Value.ExecutionCount)
                    .Take(10)
                    .ToDictionary(kvp => kvp.Key, kvp => kvp.Value)
            };
        }
    }
    
    // 支援クラスとデータ型
    public class PagedResult<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
        public bool HasPreviousPage => PageNumber > 1;
        public bool HasNextPage => PageNumber < TotalPages;
        
        public PagedResult(List<T> items, int totalCount, int pageNumber, int pageSize)
        {
            Items = items ?? new List<T>();
            TotalCount = totalCount;
            PageNumber = pageNumber;
            PageSize = pageSize;
        }
    }
    
    public class OrderSortOptions
    {
        public OrderSortBy SortBy { get; set; } = OrderSortBy.CreatedAt;
        public bool IsDescending { get; set; } = true;
    }
    
    public enum OrderSortBy
    {
        CreatedAt,
        TotalAmount,
        Status,
        CustomerName
    }
    
    public class PagingOptions
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        
        public void Validate()
        {
            if (PageNumber < 1) PageNumber = 1;
            if (PageSize < 1) PageSize = 20;
            if (PageSize > 100) PageSize = 100; // 最大制限
        }
    }
    
    public class QueryStats
    {
        public string QueryText { get; set; }
        public int ExecutionCount { get; set; }
        public DateTime LastExecuted { get; set; }
        public TimeSpan AverageExecutionTime { get; set; }
    }
    
    public class QueryStatistics
    {
        public int TotalQueries { get; set; }
        public int TotalExecutions { get; set; }
        public Dictionary<string, QueryStats> MostExecutedQueries { get; set; } = new();
    }
    
    public class OrderAnalytics
    {
        public DateRange DateRange { get; set; }
        public int TotalOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal AverageOrderValue { get; set; }
        public int CompletedOrders { get; set; }
        public int CancelledOrders { get; set; }
        public int PendingOrders { get; set; }
        public List<ProductSalesInfo> TopSellingProducts { get; set; } = new();
    }
    
    public class ProductSalesInfo
    {
        public ProductId ProductId { get; set; }
        public string ProductName { get; set; }
        public int TotalQuantitySold { get; set; }
        public decimal TotalRevenue { get; set; }
    }
    
    // 例外クラス
    public class RepositoryException : Exception
    {
        public RepositoryException(string message) : base(message) { }
        public RepositoryException(string message, Exception innerException) : base(message, innerException) { }
    }
    
    public class ConcurrencyException : RepositoryException
    {
        public ConcurrencyException(string message) : base(message) { }
        public ConcurrencyException(string message, Exception innerException) : base(message, innerException) { }
    }
}

// 使用例
public class Program
{
    public static async Task Main(string[] args)
    {
        Console.WriteLine("=== 高度なリポジトリパターンの例 ===\\n");
        
        // DIコンテナの設定（実際の実装）
        var serviceProvider = ConfigureServices();
        
        using var scope = serviceProvider.CreateScope();
        var orderRepository = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
        
        try
        {
            // 1. 仕様パターンを使用した検索
            Console.WriteLine("## 仕様パターンによる検索");
            
            var recentHighValueSpec = OrderSpecifications.RecentHighValueOrders(30, 50000);
            var sortOptions = new OrderSortOptions \\{ SortBy = OrderSortBy.TotalAmount, IsDescending = true \\};
            var pagingOptions = new PagingOptions \\{ PageNumber = 1, PageSize = 10 \\};
            
            var recentOrders = await orderRepository.FindOrdersAsync(recentHighValueSpec, sortOptions, pagingOptions);
            
            Console.WriteLine($"最近の高額注文: \\{recentOrders.Items.Count\\}件 (全\\{recentOrders.TotalCount\\}件中)");
            
            foreach (var order in recentOrders.Items.Take(5))
            {
                Console.WriteLine($"  - \\{order.OrderNumber\\}: \\{order.TotalAmount\\} (\\{order.Status\\})");
            }
            
            // 2. 分析データの取得
            Console.WriteLine("\\n## 注文分析データ");
            
            var dateRange = new DateRange(DateTime.UtcNow.AddDays(-30), DateTime.UtcNow);
            var analytics = await orderRepository.GetOrderAnalyticsAsync(dateRange);
            
            Console.WriteLine($"期間: \\{analytics.DateRange\\}");
            Console.WriteLine($"総注文数: \\{analytics.TotalOrders\\\\:N0\\}件");
            Console.WriteLine($"総売上: ¥\\{analytics.TotalRevenue\\\\:N0\\}");
            Console.WriteLine($"平均注文額: ¥\\{analytics.AverageOrderValue\\\\:N0\\}");
            Console.WriteLine($"完了率: \\{(double)analytics.CompletedOrders / analytics.TotalOrders * 100\\\\:F1\\}%");
            
            // 3. 対応が必要な注文の取得
            Console.WriteLine("\\n## 対応が必要な注文");
            
            var actionRequiredOrders = await orderRepository.GetOrdersRequiringActionAsync();
            
            Console.WriteLine($"対応が必要な注文: \\{actionRequiredOrders.Count()\\}件");
            
            foreach (var order in actionRequiredOrders.Take(3))
            {
                Console.WriteLine($"  - \\{order.OrderNumber\\}: \\{order.Status\\} (\\{order.CreatedAt\\\\:yyyy/MM/dd\\})");
            }
            
            // 4. ステータス分布の取得
            Console.WriteLine("\\n## ステータス分布");
            
            var statusDistribution = await orderRepository.GetStatusDistributionAsync(dateRange);
            
            foreach (var status in statusDistribution)
            {
                Console.WriteLine($"  \\{status.Key\\}: \\{status.Value\\}件");
            }
            
        }
        catch (Exception ex)
        {
            Console.WriteLine($"エラーが発生しました: \\{ex.Message\\}");
        }
    }
    
    private static IServiceProvider ConfigureServices()
    {
        var services = new ServiceCollection();
        
        // データベース設定
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("TestDb"));
        
        // リポジトリの登録
        services.AddScoped<IOrderRepository, AdvancedOrderRepository>();
        services.AddScoped<IQueryOptimizer, QueryOptimizer>();
        
        // ロギング設定
        services.AddLogging(builder => builder.AddConsole());
        
        return services.BuildServiceProvider();
    }
}`
    },
    {
      id: 'factory-pattern-example',
      title: '高度なファクトリーパターンの実装',
      description: 'DI対応の柔軟性と拡張性を持つファクトリーパターンの実装例',
      language: 'csharp',
      code: `using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

// === 高度なファクトリーパターンの実装 ===

namespace AdvancedFactoryPattern
{
    /// <summary>
    /// 構成可能で拡張性の高いファクトリーパターンの実装
    /// </summary>
    public interface IDynamicOrderFactory
    {
        Task<Order> CreateOrderAsync(OrderCreationContext context);
        Task<Order> CreateOrderFromTemplateAsync(OrderTemplate template, CustomerId customerId);
        Task<Order> CreateRecurringOrderAsync(RecurringOrderPlan plan, DateTime scheduleDate);
        Task<Order> CreateBulkOrderAsync(BulkOrderRequest request);
        bool CanCreateOrder(OrderType orderType, OrderCreationContext context);
        IEnumerable<OrderType> GetSupportedOrderTypes();
    }
    
    /// <summary>
    /// 動的ファクトリーの実装 - 戦略パターンとファクトリーパターンの組み合わせ
    /// </summary>
    public class DynamicOrderFactory : IDynamicOrderFactory
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DynamicOrderFactory> _logger;
        private readonly OrderFactoryConfiguration _configuration;
        private readonly Dictionary<OrderType, Type> _factoryStrategies;
        private readonly IOrderValidationService _validationService;
        
        public DynamicOrderFactory(
            IServiceProvider serviceProvider,
            ILogger<DynamicOrderFactory> logger,
            IOptions<OrderFactoryConfiguration> configuration,
            IOrderValidationService validationService)
        {
            _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _configuration = configuration?.Value ?? throw new ArgumentNullException(nameof(configuration));
            _validationService = validationService ?? throw new ArgumentNullException(nameof(validationService));
            
            _factoryStrategies = InitializeFactoryStrategies();
        }
        
        public async Task<Order> CreateOrderAsync(OrderCreationContext context)
        {
            _logger.LogDebug("注文作成を開始します: タイプ \\{OrderType\\}, 顧客 \\{CustomerId\\}", 
                context.OrderType, context.CustomerId?.Value);
            
            try
            {
                // 1. 事前検証
                var validationResult = await _validationService.ValidateCreationContextAsync(context);
                if (!validationResult.IsValid)
                {
                    throw new OrderCreationException($"注文作成の検証に失敗しました: \\{string.Join(", ", validationResult.Errors)\\}");
                }
                
                // 2. 適切な戦略の選択
                var strategyType = GetFactoryStrategy(context.OrderType);
                var strategy = (IOrderCreationStrategy)_serviceProvider.GetRequiredService(strategyType);
                
                // 3. ファクトリー戦略による注文作成
                var order = await strategy.CreateOrderAsync(context);
                
                // 4. 作成後の処理
                await ApplyPostCreationRules(order, context);
                
                _logger.LogInformation("注文が正常に作成されました: \\{OrderId\\} (\\{OrderType\\})", 
                    order.Id.Value, context.OrderType);
                
                return order;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "注文作成中にエラーが発生しました: \\{OrderType\\}", context.OrderType);
                throw;
            }
        }
        
        public async Task<Order> CreateOrderFromTemplateAsync(OrderTemplate template, CustomerId customerId)
        {
            _logger.LogDebug("テンプレートから注文を作成します: \\{TemplateId\\}, 顧客 \\{CustomerId\\}", 
                template.Id.Value, customerId.Value);
            
            var context = new OrderCreationContext
            {
                OrderType = template.OrderType,
                CustomerId = customerId,
                DeliveryAddress = template.DefaultDeliveryAddress,
                Items = template.Items.Select(ti => new OrderItemRequest
                {
                    ProductId = ti.ProductId,
                    Quantity = ti.Quantity,
                    SpecialInstructions = ti.SpecialInstructions
                }).ToList(),
                SpecialInstructions = template.DefaultInstructions,
                RequestedDeliveryDate = template.DefaultDeliveryDate,
                Metadata = new Dictionary<string, object>
                {
                    ["SourceTemplate"] = template.Id.Value,
                    ["TemplateName"] = template.Name
                }
            };
            
            var order = await CreateOrderAsync(context);
            
            // テンプレート固有の後処理
            if (template.AutoApplyPromotions)
            {
                await ApplyTemplatePromotions(order, template);
            }
            
            return order;
        }
        
        public async Task<Order> CreateRecurringOrderAsync(RecurringOrderPlan plan, DateTime scheduleDate)
        {
            _logger.LogDebug("定期注文を作成します: プラン \\{PlanId\\}, 予定日 \\{ScheduleDate\\}", 
                plan.Id.Value, scheduleDate);
            
            // 定期注文のコンテキスト作成
            var context = new OrderCreationContext
            {
                OrderType = OrderType.Recurring,
                CustomerId = plan.CustomerId,
                DeliveryAddress = plan.DeliveryAddress,
                Items = plan.Items.Select(pi => new OrderItemRequest
                {
                    ProductId = pi.ProductId,
                    Quantity = pi.Quantity
                }).ToList(),
                RequestedDeliveryDate = scheduleDate.Add(plan.DeliveryTimeOffset),
                RecurringPlan = plan,
                Metadata = new Dictionary<string, object>
                {
                    ["RecurringPlanId"] = plan.Id.Value,
                    ["ScheduledDate"] = scheduleDate,
                    ["RecurrenceCount"] = plan.ExecutionCount + 1
                }
            };
            
            var order = await CreateOrderAsync(context);
            
            // 定期注文固有の設定
            order.MarkAsRecurring(plan.Id);
            
            // 次回実行日の更新
            plan.UpdateNextExecutionDate();
            
            return order;
        }
        
        public async Task<Order> CreateBulkOrderAsync(BulkOrderRequest request)
        {
            _logger.LogDebug("一括注文を作成します: \\{ItemCount\\} 種類の商品", request.Items.Count);
            
            if (request.Items.Count > _configuration.MaxBulkOrderItems)
            {
                throw new OrderCreationException($"一括注文の上限 (\\{_configuration.MaxBulkOrderItems\\}種類) を超えています");
            }
            
            var context = new OrderCreationContext
            {
                OrderType = OrderType.Bulk,
                CustomerId = request.CustomerId,
                DeliveryAddress = request.DeliveryAddress,
                Items = request.Items,
                SpecialInstructions = request.SpecialInstructions,
                RequestedDeliveryDate = request.RequestedDeliveryDate,
                Metadata = new Dictionary<string, object>
                {
                    ["BulkOrderReference"] = request.Reference,
                    ["BulkDiscount"] = request.ExpectedDiscount
                }
            };
            
            var order = await CreateOrderAsync(context);
            
            // 一括注文割引の適用
            if (request.ExpectedDiscount > 0)
            {
                var bulkDiscount = new BulkOrderDiscount(request.ExpectedDiscount);
                order.ApplyDiscount(bulkDiscount);
            }
            
            return order;
        }
        
        public bool CanCreateOrder(OrderType orderType, OrderCreationContext context)
        {
            try
            {
                var strategyType = GetFactoryStrategy(orderType);
                var strategy = (IOrderCreationStrategy)_serviceProvider.GetService(strategyType);
                
                return strategy?.CanHandle(context) ?? false;
            }
            catch
            {
                return false;
            }
        }
        
        public IEnumerable<OrderType> GetSupportedOrderTypes()
        {
            return _factoryStrategies.Keys;
        }
        
        // プライベートメソッド
        private Dictionary<OrderType, Type> InitializeFactoryStrategies()
        {
            var strategies = new Dictionary<OrderType, Type>();
            
            // 設定ファイルまたは属性スキャンから戦略を登録
            strategies[OrderType.Standard] = typeof(StandardOrderCreationStrategy);
            strategies[OrderType.Express] = typeof(ExpressOrderCreationStrategy);
            strategies[OrderType.Bulk] = typeof(BulkOrderCreationStrategy);
            strategies[OrderType.Recurring] = typeof(RecurringOrderCreationStrategy);
            strategies[OrderType.Subscription] = typeof(SubscriptionOrderCreationStrategy);
            strategies[OrderType.Corporate] = typeof(CorporateOrderCreationStrategy);
            strategies[OrderType.International] = typeof(InternationalOrderCreationStrategy);
            
            _logger.LogInformation("\\{Count\\} 個の注文作成戦略が登録されました", strategies.Count);
            
            return strategies;
        }
        
        private Type GetFactoryStrategy(OrderType orderType)
        {
            if (!_factoryStrategies.TryGetValue(orderType, out var strategyType))
            {
                throw new NotSupportedException($"注文タイプ \\{orderType\\} はサポートされていません");
            }
            
            return strategyType;
        }
        
        private async Task ApplyPostCreationRules(Order order, OrderCreationContext context)
        {
            // 作成後のビジネスルール適用
            foreach (var rule in _configuration.PostCreationRules)
            {
                if (rule.AppliesTo(context.OrderType))
                {
                    await rule.ApplyAsync(order, context);
                }
            }
        }
        
        private async Task ApplyTemplatePromotions(Order order, OrderTemplate template)
        {
            var promotionService = _serviceProvider.GetRequiredService<IPromotionService>();
            var templatePromotions = await promotionService.GetTemplatePromotionsAsync(template.Id);
            
            foreach (var promotion in templatePromotions)
            {
                if (promotion.IsApplicableToOrder(order))
                {
                    order.ApplyPromotion(promotion);
                }
            }
        }
    }
    
    /// <summary>
    /// 注文作成戦略のインターフェース
    /// </summary>
    public interface IOrderCreationStrategy
    {
        Task<Order> CreateOrderAsync(OrderCreationContext context);
        bool CanHandle(OrderCreationContext context);
        OrderType SupportedType { get; }
    }
    
    /// <summary>
    /// 標準注文の作成戦略
    /// </summary>
    public class StandardOrderCreationStrategy : IOrderCreationStrategy
    {
        private readonly ICustomerRepository _customerRepository;
        private readonly IProductRepository _productRepository;
        private readonly IPricingService _pricingService;
        private readonly IInventoryService _inventoryService;
        private readonly ILogger<StandardOrderCreationStrategy> _logger;
        
        public OrderType SupportedType => OrderType.Standard;
        
        public StandardOrderCreationStrategy(
            ICustomerRepository customerRepository,
            IProductRepository productRepository,
            IPricingService pricingService,
            IInventoryService inventoryService,
            ILogger<StandardOrderCreationStrategy> logger)
        {
            _customerRepository = customerRepository ?? throw new ArgumentNullException(nameof(customerRepository));
            _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
            _pricingService = pricingService ?? throw new ArgumentNullException(nameof(pricingService));
            _inventoryService = inventoryService ?? throw new ArgumentNullException(nameof(inventoryService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }
        
        public async Task<Order> CreateOrderAsync(OrderCreationContext context)
        {
            _logger.LogDebug("標準注文を作成しています");
            
            // 顧客の取得
            var customer = await _customerRepository.GetByIdAsync(context.CustomerId);
            if (customer == null)
            {
                throw new OrderCreationException("顧客が見つかりません");
            }
            
            // 注文の作成
            var order = Order.Create(context.CustomerId, context.DeliveryAddress);
            
            // 商品の追加
            foreach (var itemRequest in context.Items)
            {
                await AddItemToOrder(order, itemRequest);
            }
            
            // 特別指示の設定
            if (!string.IsNullOrEmpty(context.SpecialInstructions))
            {
                order.SetSpecialInstructions(context.SpecialInstructions);
            }
            
            return order;
        }
        
        public bool CanHandle(OrderCreationContext context)
        {
            return context.OrderType == OrderType.Standard &&
                   context.CustomerId != null &&
                   context.Items?.Any() == true;
        }
        
        private async Task AddItemToOrder(Order order, OrderItemRequest itemRequest)
        {
            var product = await _productRepository.GetByIdAsync(itemRequest.ProductId);
            if (product == null)
            {
                _logger.LogWarning("商品が見つかりません: \\{ProductId\\}", itemRequest.ProductId.Value);
                return;
            }
            
            // 在庫確認
            var availability = await _inventoryService.CheckAvailabilityAsync(itemRequest.ProductId, itemRequest.Quantity.Value);
            if (!availability.IsAvailable)
            {
                throw new OrderCreationException($"商品 '\\{product.Name\\}' の在庫が不足しています");
            }
            
            // 現在価格の取得
            var currentPrice = await _pricingService.GetCurrentPriceAsync(itemRequest.ProductId);
            
            order.AddItem(product, itemRequest.Quantity, currentPrice);
        }
    }
    
    /// <summary>
    /// 急送注文の作成戦略
    /// </summary>
    public class ExpressOrderCreationStrategy : StandardOrderCreationStrategy
    {
        private readonly IShippingService _shippingService;
        private readonly ILogger<ExpressOrderCreationStrategy> _logger;
        
        public new OrderType SupportedType => OrderType.Express;
        
        public ExpressOrderCreationStrategy(
            ICustomerRepository customerRepository,
            IProductRepository productRepository,
            IPricingService pricingService,
            IInventoryService inventoryService,
            IShippingService shippingService,
            ILogger<ExpressOrderCreationStrategy> logger)
            : base(customerRepository, productRepository, pricingService, inventoryService, 
                   logger as ILogger<StandardOrderCreationStrategy>)
        {
            _shippingService = shippingService ?? throw new ArgumentNullException(nameof(shippingService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }
        
        public override async Task<Order> CreateOrderAsync(OrderCreationContext context)
        {
            _logger.LogDebug("急送注文を作成しています");
            
            // 基本的な注文作成
            var order = await base.CreateOrderAsync(context);
            
            // 急送固有の処理
            await ApplyExpressShipping(order, context);
            
            // 急送料金の追加
            var expressFee = await CalculateExpressFee(order);
            order.AddServiceFee("急送料", expressFee);
            
            // 優先度の設定
            order.SetPriority(OrderPriority.High);
            
            return order;
        }
        
        public override bool CanHandle(OrderCreationContext context)
        {
            return context.OrderType == OrderType.Express &&
                   base.CanHandle(context) &&
                   context.RequestedDeliveryDate.HasValue &&
                   context.RequestedDeliveryDate.Value <= DateTime.UtcNow.AddDays(1); // 24時間以内
        }
        
        private async Task ApplyExpressShipping(Order order, OrderCreationContext context)
        {
            var expressOptions = await _shippingService.GetExpressOptionsAsync(order.DeliveryAddress);
            var fastestOption = expressOptions.OrderBy(o => o.EstimatedDays).First();
            
            order.SetShippingOption(fastestOption);
        }
        
        private async Task<Money> CalculateExpressFee(Order order)
        {
            // 急送料金の計算ロジック
            var baseFee = Money.Yen(2000); // 基本急送料
            var weightSurcharge = order.CalculateTotalWeight() > 5.0m ? Money.Yen(500) : Money.Zero;
            
            return baseFee.Add(weightSurcharge);
        }
    }
    
    /// <summary>
    /// 定期購入注文の作成戦略
    /// </summary>
    public class SubscriptionOrderCreationStrategy : IOrderCreationStrategy
    {
        private readonly ICustomerRepository _customerRepository;
        private readonly ISubscriptionService _subscriptionService;
        private readonly IPricingService _pricingService;
        private readonly ILogger<SubscriptionOrderCreationStrategy> _logger;
        
        public OrderType SupportedType => OrderType.Subscription;
        
        public SubscriptionOrderCreationStrategy(
            ICustomerRepository customerRepository,
            ISubscriptionService subscriptionService,
            IPricingService pricingService,
            ILogger<SubscriptionOrderCreationStrategy> logger)
        {
            _customerRepository = customerRepository ?? throw new ArgumentNullException(nameof(customerRepository));
            _subscriptionService = subscriptionService ?? throw new ArgumentNullException(nameof(subscriptionService));
            _pricingService = pricingService ?? throw new ArgumentNullException(nameof(pricingService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }
        
        public async Task<Order> CreateOrderAsync(OrderCreationContext context)
        {
            _logger.LogDebug("定期購入注文を作成しています");
            
            if (context.SubscriptionPlan == null)
            {
                throw new OrderCreationException("定期購入プランが指定されていません");
            }
            
            var customer = await _customerRepository.GetByIdAsync(context.CustomerId);
            if (customer == null)
            {
                throw new OrderCreationException("顧客が見つかりません");
            }
            
            // 定期購入資格の確認
            if (!customer.CanSubscribe())
            {
                throw new OrderCreationException("この顧客は定期購入を利用できません");
            }
            
            // 定期購入注文の作成
            var order = Order.CreateSubscriptionOrder(
                context.CustomerId,
                context.DeliveryAddress,
                context.SubscriptionPlan);
            
            // プラン商品の追加
            foreach (var planItem in context.SubscriptionPlan.Items)
            {
                var subscriptionPrice = await _pricingService.GetSubscriptionPriceAsync(
                    planItem.ProductId, context.SubscriptionPlan.Id);
                
                order.AddSubscriptionItem(planItem.Product, planItem.Quantity, subscriptionPrice);
            }
            
            // 定期購入割引の適用
            var subscriptionDiscount = await _subscriptionService.CalculateDiscountAsync(context.SubscriptionPlan);
            if (subscriptionDiscount.Amount > 0)
            {
                order.ApplyDiscount(subscriptionDiscount);
            }
            
            return order;
        }
        
        public bool CanHandle(OrderCreationContext context)
        {
            return context.OrderType == OrderType.Subscription &&
                   context.SubscriptionPlan != null &&
                   context.CustomerId != null;
        }
    }
    
    /// <summary>
    /// 注文作成コンテキスト
    /// </summary>
    public class OrderCreationContext
    {
        public OrderType OrderType { get; set; }
        public CustomerId CustomerId { get; set; }
        public Address DeliveryAddress { get; set; }
        public List<OrderItemRequest> Items { get; set; } = new();
        public string SpecialInstructions { get; set; }
        public DateTime? RequestedDeliveryDate { get; set; }
        public SubscriptionPlan SubscriptionPlan { get; set; }
        public RecurringOrderPlan RecurringPlan { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();
        
        // 検証メソッド
        public ValidationResult Validate()
        {
            var errors = new List<string>();
            
            if (CustomerId == null)
                errors.Add("顧客IDは必須です");
                
            if (DeliveryAddress == null)
                errors.Add("配送先住所は必須です");
                
            if (!Items.Any())
                errors.Add("注文商品が指定されていません");
                
            if (OrderType == OrderType.Subscription && SubscriptionPlan == null)
                errors.Add("定期購入にはプランの指定が必要です");
                
            return new ValidationResult(errors);
        }
    }
    
    public class OrderItemRequest
    {
        public ProductId ProductId { get; set; }
        public Quantity Quantity { get; set; }
        public string SpecialInstructions { get; set; }
        public Dictionary<string, object> CustomAttributes { get; set; } = new();
    }
    
    public enum OrderType
    {
        Standard,
        Express,
        Bulk,
        Recurring,
        Subscription,
        Corporate,
        International
    }
    
    public enum OrderPriority
    {
        Low,
        Normal,
        High,
        Critical
    }
    
    // 設定クラス
    public class OrderFactoryConfiguration
    {
        public int MaxBulkOrderItems { get; set; } = 100;
        public TimeSpan DefaultExpressDeliveryWindow { get; set; } = TimeSpan.FromHours(24);
        public List<IPostCreationRule> PostCreationRules { get; set; } = new();
        public Dictionary<OrderType, Type> CustomStrategies { get; set; } = new();
    }
    
    public interface IPostCreationRule
    {
        bool AppliesTo(OrderType orderType);
        Task ApplyAsync(Order order, OrderCreationContext context);
    }
    
    // 例外クラス
    public class OrderCreationException : Exception
    {
        public OrderCreationException(string message) : base(message) { }
        public OrderCreationException(string message, Exception innerException) : base(message, innerException) { }
    }
}

// 使用例
public class Program
{
    public static async Task Main(string[] args)
    {
        Console.WriteLine("=== 高度なファクトリーパターンの例 ===\\n");
        
        var serviceProvider = ConfigureServices();
        
        using var scope = serviceProvider.CreateScope();
        var orderFactory = scope.ServiceProvider.GetRequiredService<IDynamicOrderFactory>();
        
        try
        {
            // 1. 標準注文の作成
            Console.WriteLine("## 標準注文の作成");
            
            var standardContext = new OrderCreationContext
            {
                OrderType = OrderType.Standard,
                CustomerId = CustomerId.NewId(),
                DeliveryAddress = new Address("東京都", "渋谷区", "1-1-1", "150-0001"),
                Items = new List<OrderItemRequest>
                {
                    new OrderItemRequest \\{ ProductId = ProductId.NewId(), Quantity = new Quantity(2) \\},
                    new OrderItemRequest \\{ ProductId = ProductId.NewId(), Quantity = new Quantity(1) \\}
                }
            };
            
            var standardOrder = await orderFactory.CreateOrderAsync(standardContext);
            Console.WriteLine($"標準注文が作成されました: \\{standardOrder.OrderNumber\\}");
            
            // 2. 急送注文の作成
            Console.WriteLine("\\n## 急送注文の作成");
            
            var expressContext = new OrderCreationContext
            {
                OrderType = OrderType.Express,
                CustomerId = CustomerId.NewId(),
                DeliveryAddress = new Address("大阪府", "大阪市北区", "1-1-1", "530-0001"),
                Items = new List<OrderItemRequest>
                {
                    new OrderItemRequest \\{ ProductId = ProductId.NewId(), Quantity = new Quantity(1) \\}
                },
                RequestedDeliveryDate = DateTime.UtcNow.AddHours(12) // 12時間後配送
            };
            
            if (orderFactory.CanCreateOrder(OrderType.Express, expressContext))
            {
                var expressOrder = await orderFactory.CreateOrderAsync(expressContext);
                Console.WriteLine($"急送注文が作成されました: \\{expressOrder.OrderNumber\\} (優先度: \\{expressOrder.Priority\\})");
            }
            else
            {
                Console.WriteLine("急送注文の作成条件を満たしていません");
            }
            
            // 3. サポートされている注文タイプの確認
            Console.WriteLine("\\n## サポートされている注文タイプ");
            
            var supportedTypes = orderFactory.GetSupportedOrderTypes();
            Console.WriteLine($"サポート対象: \\{string.Join(", ", supportedTypes)\\}");
            
        }
        catch (Exception ex)
        {
            Console.WriteLine($"エラーが発生しました: \\{ex.Message\\}");
        }
    }
    
    private static IServiceProvider ConfigureServices()
    {
        var services = new ServiceCollection();
        
        // ファクトリーの登録
        services.AddScoped<IDynamicOrderFactory, DynamicOrderFactory>();
        
        // 戦略の登録
        services.AddScoped<StandardOrderCreationStrategy>();
        services.AddScoped<ExpressOrderCreationStrategy>();
        services.AddScoped<SubscriptionOrderCreationStrategy>();
        
        // 依存サービスの登録
        services.AddScoped<ICustomerRepository, MockCustomerRepository>();
        services.AddScoped<IProductRepository, MockProductRepository>();
        services.AddScoped<IPricingService, MockPricingService>();
        services.AddScoped<IInventoryService, MockInventoryService>();
        services.AddScoped<IOrderValidationService, MockOrderValidationService>();
        
        // 設定の登録
        services.Configure<OrderFactoryConfiguration>(config =>
        {
            config.MaxBulkOrderItems = 50;
            config.DefaultExpressDeliveryWindow = TimeSpan.FromHours(24);
        });
        
        // ロギング設定
        services.AddLogging(builder => builder.AddConsole());
        
        return services.BuildServiceProvider();
    }
}`
    }
  ],
  exercises: [
    {
      id: 'repository-factory-exercise-1',
      title: '図書館システムのリポジトリとファクトリー実装',
      description: '図書館システムに適したリポジトリパターンとファクトリーパターンを設計・実装してください。',
      difficulty: 'hard',
      starterCode: `using System;
using System.Collections.Generic;
using System.Threading.Tasks;

// 図書館システムのリポジトリとファクトリーを実装してください
// 要件:
// 1. 図書リポジトリ（BookRepository）- 検索、フィルタリング、分析機能
// 2. 会員リポジトリ（MemberRepository）- 仕様パターン対応
// 3. 貸出ファクトリー（LoanFactory）- 複雑な貸出ルールに対応
// 4. 適切なエラーハンドリングとログ出力

public interface IBookRepository : IRepository<Book, BookId>
{
    // TODO: 図書固有の検索メソッドを定義してください
    // - ISBN検索、タイトル検索、著者検索
    // - カテゴリ別検索、利用可能図書検索
    // - 人気図書ランキング取得
}

public interface IMemberRepository : IRepository<Member, MemberId>
{
    // TODO: 会員固有の検索メソッドを定義してください
    // - 仕様パターンによる柔軟な検索
    // - 延滞会員の検索
    // - 会員統計情報の取得
}

public interface ILoanFactory
{
    // TODO: 貸出ファクトリーのインターフェースを定義してください
    // - 通常貸出の作成
    // - 予約からの貸出作成
    // - 延長処理
    // - 複雑なビジネスルールの適用
}

public class BookRepository : IBookRepository
{
    // TODO: Entity Framework Coreを使用したリポジトリを実装してください
}

public class MemberRepository : IMemberRepository
{
    // TODO: 仕様パターン対応のリポジトリを実装してください
}

public class LoanFactory : ILoanFactory
{
    // TODO: 複雑な貸出ルールに対応したファクトリーを実装してください
}`,
      solution: `public interface IBookRepository : IRepository<Book, BookId>
{
    Task<Book> GetByIsbnAsync(ISBN isbn);
    Task<IEnumerable<Book>> SearchByTitleAsync(string title);
    Task<IEnumerable<Book>> SearchByAuthorAsync(string author);
    Task<IEnumerable<Book>> GetByCategoryAsync(BookCategory category);
    Task<IEnumerable<Book>> GetAvailableBooksAsync();
    Task<IEnumerable<Book>> GetPopularBooksAsync(int count = 10);
    Task<PaginatedResult<Book>> SearchBooksPagedAsync(BookSearchCriteria criteria, int pageNumber, int pageSize);
    Task<BookStatistics> GetBookStatisticsAsync();
}

public class BookRepository : IBookRepository
{
    private readonly LibraryDbContext _context;
    private readonly ILogger<BookRepository> _logger;
    
    public BookRepository(LibraryDbContext context, ILogger<BookRepository> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
    
    public async Task<Book> GetByIdAsync(BookId id)
    {
        return await _context.Books
            .Include(b => b.Loans)
            .Include(b => b.Reservations)
            .FirstOrDefaultAsync(b => b.Id == id);
    }
    
    public async Task<Book> GetByIsbnAsync(ISBN isbn)
    {
        return await _context.Books
            .FirstOrDefaultAsync(b => b.ISBN.Value == isbn.Value);
    }
    
    public async Task<IEnumerable<Book>> GetAvailableBooksAsync()
    {
        return await _context.Books
            .Where(b => b.Status == BookStatus.Available)
            .OrderBy(b => b.Title)
            .ToListAsync();
    }
    
    public async Task<IEnumerable<Book>> GetPopularBooksAsync(int count = 10)
    {
        return await _context.Books
            .OrderByDescending(b => b.Loans.Count)
            .Take(count)
            .ToListAsync();
    }
    
    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}

public interface IMemberRepository : IRepository<Member, MemberId>
{
    Task<IEnumerable<Member>> FindAsync(ISpecification<Member> specification);
    Task<Member> GetByEmailAsync(EmailAddress email);
    Task<IEnumerable<Member>> GetOverdueMembersAsync();
    Task<MemberStatistics> GetMemberStatisticsAsync();
}

public class LoanFactory : ILoanFactory
{
    private readonly IBookRepository _bookRepository;
    private readonly IMemberRepository _memberRepository;
    private readonly ILibraryPolicyService _policyService;
    
    public LoanFactory(
        IBookRepository bookRepository,
        IMemberRepository memberRepository,
        ILibraryPolicyService policyService)
    {
        _bookRepository = bookRepository;
        _memberRepository = memberRepository;
        _policyService = policyService;
    }
    
    public async Task<Loan> CreateLoanAsync(BookId bookId, MemberId memberId)
    {
        var book = await _bookRepository.GetByIdAsync(bookId);
        var member = await _memberRepository.GetByIdAsync(memberId);
        
        // ビジネスルールの検証
        var eligibility = await _policyService.CheckLoanEligibilityAsync(member, book);
        if (!eligibility.IsEligible)
        {
            throw new LoanCreationException(eligibility.Reason);
        }
        
        // 貸出期間の決定
        var loanPeriod = await _policyService.DetermineLoanPeriodAsync(member, book);
        
        // 貸出オブジェクトの作成
        var loan = book.LoanTo(memberId, loanPeriod);
        
        return loan;
    }
}`,
      hints: [
        'リポジトリは集約ルートのみを対象とする',
        '仕様パターンで複雑な検索条件を表現する', 
        'ファクトリーで複雑な生成ロジックを隠蔽する',
        '適切な例外処理とログ出力を実装する'
      ]
    }
  ],
  estimatedTime: 80,
  order: 4,
  nextLesson: 'domain-events'
};
