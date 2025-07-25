import type { Lesson } from '../../../../features/learning/types';

export const entitiesAndValueObjectsLesson: Lesson = {
  id: 'entities-and-value-objects',
  moduleId: 'ddd-basics',
  title: 'エンティティとバリューオブジェクト - DDDの基本構成要素',
  description: 'DDDの戦術的設計における最重要パターン、エンティティとバリューオブジェクトの設計と実装方法を詳しく学習します',
  content: `
# エンティティとバリューオブジェクト

DDDの戦術的設計において、エンティティ（Entity）とバリューオブジェクト（Value Object）は最も基本的で重要な構成要素です。この二つの概念を正しく理解し、適切に使い分けることで、表現力豊かで保守しやすいドメインモデルを構築できます。

## エンティティ（Entity）とは

### エンティティの特徴

エンティティは**アイデンティティ**（同一性）を持つオブジェクトです：

1. **一意の識別子**: ライフサイクルを通じて変わらない識別子を持つ
2. **可変性**: 属性値は変更可能（ただし、識別子は不変）
3. **連続性**: 時間の経過とともに追跡される
4. **ビジネス的重要性**: ドメインにおいて個別に識別する必要がある

### 基本的なエンティティの実装

\`\`\`csharp
public abstract class Entity<TId> where TId : class
{
    public TId Id { get; protected set; }
    
    protected Entity() { }
    
    protected Entity(TId id)
    {
        Id = id ?? throw new ArgumentNullException(nameof(id));
    }
    
    public override bool Equals(object obj)
    {
        if (obj is not Entity<TId> other)
            return false;
            
        if (ReferenceEquals(this, other))
            return true;
            
        if (Id == null || other.Id == null)
            return false;
            
        return Id.Equals(other.Id);
    }
    
    public override int GetHashCode()
    {
        return Id?.GetHashCode() ?? 0;
    }
    
    public static bool operator ==(Entity<TId> left, Entity<TId> right)
    {
        return Equals(left, right);
    }
    
    public static bool operator !=(Entity<TId> left, Entity<TId> right)
    {
        return !Equals(left, right);
    }
}
\`\`\`

### 実践的なエンティティの例 - 顧客

\`\`\`csharp
public class Customer : Entity<CustomerId>
{
    private readonly List<Order> _orders = new();
    
    public string FirstName { get; private set; }
    public string LastName { get; private set; }
    public EmailAddress Email { get; private set; }
    public CustomerStatus Status { get; private set; }
    public DateTime RegisteredAt { get; private set; }
    public DateTime? LastLoginAt { get; private set; }
    public Address ShippingAddress { get; private set; }
    
    // 読み取り専用のビュー
    public string FullName => $"{FirstName} {LastName}";
    public IReadOnlyList<Order> Orders => _orders.AsReadOnly();
    
    private Customer() { } // for ORM
    
    public static Customer Register(string firstName, string lastName, EmailAddress email, Address shippingAddress)
    {
        // ビジネスルールの検証
        if (string.IsNullOrWhiteSpace(firstName))
            throw new DomainException("名は必須です");
            
        if (string.IsNullOrWhiteSpace(lastName))
            throw new DomainException("姓は必須です");
        
        return new Customer
        {
            Id = CustomerId.NewId(),
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            Email = email ?? throw new ArgumentNullException(nameof(email)),
            ShippingAddress = shippingAddress ?? throw new ArgumentNullException(nameof(shippingAddress)),
            Status = CustomerStatus.Active,
            RegisteredAt = DateTime.UtcNow
        };
    }
    
    public void ChangeEmail(EmailAddress newEmail)
    {
        if (Status == CustomerStatus.Suspended)
            throw new DomainException("停止中の顧客はメールアドレスを変更できません");
            
        var oldEmail = Email;
        Email = newEmail ?? throw new ArgumentNullException(nameof(newEmail));
        
        // ドメインイベントの発行
        AddDomainEvent(new CustomerEmailChangedEvent(Id, oldEmail, newEmail));
    }
    
    public void UpdateShippingAddress(Address newAddress)
    {
        if (Status != CustomerStatus.Active)
            throw new DomainException("アクティブな顧客のみ住所変更できます");
            
        ShippingAddress = newAddress ?? throw new ArgumentNullException(nameof(newAddress));
        
        AddDomainEvent(new CustomerAddressChangedEvent(Id, newAddress));
    }
    
    public void RecordLogin()
    {
        if (Status != CustomerStatus.Active)
            throw new DomainException("アクティブでない顧客はログインできません");
            
        LastLoginAt = DateTime.UtcNow;
    }
    
    public void Suspend(string reason)
    {
        if (Status == CustomerStatus.Suspended)
            return; // 既に停止済み
            
        Status = CustomerStatus.Suspended;
        
        AddDomainEvent(new CustomerSuspendedEvent(Id, reason, DateTime.UtcNow));
    }
    
    public Order PlaceOrder(List<OrderItem> items, Address deliveryAddress = null)
    {
        if (Status != CustomerStatus.Active)
            throw new DomainException("アクティブでない顧客は注文できません");
            
        if (items == null || !items.Any())
            throw new DomainException("注文には最低1つの商品が必要です");
        
        var order = Order.Create(
            OrderId.NewId(),
            Id,
            items,
            deliveryAddress ?? ShippingAddress
        );
        
        _orders.Add(order);
        
        AddDomainEvent(new OrderPlacedEvent(Id, order.Id, order.TotalAmount));
        
        return order;
    }
    
    // ビジネスロジック
    public bool IsVipCustomer()
    {
        var totalOrderAmount = _orders
            .Where(o => o.Status == OrderStatus.Completed)
            .Sum(o => o.TotalAmount.Amount);
            
        return totalOrderAmount >= 500000; // 50万円以上
    }
    
    public int GetOrderCountInLastMonth()
    {
        var oneMonthAgo = DateTime.UtcNow.AddMonths(-1);
        return _orders.Count(o => o.OrderDate >= oneMonthAgo);
    }
}
\`\`\`

## バリューオブジェクト（Value Object）とは

### バリューオブジェクトの特徴

バリューオブジェクトは**値そのもの**を表現するオブジェクトです：

1. **不変性**: 一度作成されると変更できない
2. **値による等価性**: 含まれる値が同じなら同じオブジェクト
3. **識別子なし**: アイデンティティを持たない
4. **副作用なし**: メソッド実行により状態が変わらない

### 基本的なバリューオブジェクトの実装

\`\`\`csharp
public abstract class ValueObject
{
    protected abstract IEnumerable<object> GetEqualityComponents();
    
    public override bool Equals(object obj)
    {
        if (obj == null || GetType() != obj.GetType())
            return false;
            
        var other = (ValueObject)obj;
        
        return GetEqualityComponents()
            .SequenceEqual(other.GetEqualityComponents());
    }
    
    public override int GetHashCode()
    {
        return GetEqualityComponents()
            .Select(x => x?.GetHashCode() ?? 0)
            .Aggregate((x, y) => x ^ y);
    }
    
    public static bool operator ==(ValueObject left, ValueObject right)
    {
        return Equals(left, right);
    }
    
    public static bool operator !=(ValueObject left, ValueObject right)
    {
        return !Equals(left, right);
    }
}
\`\`\`

### 実践的なバリューオブジェクトの例

#### 1. 金額（Money）

\`\`\`csharp
public class Money : ValueObject
{
    public decimal Amount { get; private set; }
    public string Currency { get; private set; }
    
    public Money(decimal amount, string currency = "JPY")
    {
        if (amount < 0)
            throw new ArgumentException("金額は0以上である必要があります", nameof(amount));
            
        if (string.IsNullOrWhiteSpace(currency))
            throw new ArgumentException("通貨は必須です", nameof(currency));
            
        Amount = Math.Round(amount, 2); // 小数点以下2桁で丸め
        Currency = currency.ToUpperInvariant();
    }
    
    // 不変な操作メソッド - 新しいインスタンスを返す
    public Money Add(Money other)
    {
        EnsureSameCurrency(other);
        return new Money(Amount + other.Amount, Currency);
    }
    
    public Money Subtract(Money other)
    {
        EnsureSameCurrency(other);
        var newAmount = Amount - other.Amount;
        
        if (newAmount < 0)
            throw new InvalidOperationException("計算結果が負の値になります");
            
        return new Money(newAmount, Currency);
    }
    
    public Money Multiply(decimal factor)
    {
        if (factor < 0)
            throw new ArgumentException("乗数は0以上である必要があります", nameof(factor));
            
        return new Money(Amount * factor, Currency);
    }
    
    public Money Divide(decimal divisor)
    {
        if (divisor <= 0)
            throw new ArgumentException("除数は0より大きい必要があります", nameof(divisor));
            
        return new Money(Amount / divisor, Currency);
    }
    
    // 比較操作
    public bool IsGreaterThan(Money other)
    {
        EnsureSameCurrency(other);
        return Amount > other.Amount;
    }
    
    public bool IsGreaterThanOrEqual(Money other)
    {
        EnsureSameCurrency(other);
        return Amount >= other.Amount;
    }
    
    public bool IsLessThan(Money other)
    {
        EnsureSameCurrency(other);
        return Amount < other.Amount;
    }
    
    public bool IsLessThanOrEqual(Money other)
    {
        EnsureSameCurrency(other);
        return Amount <= other.Amount;
    }
    
    private void EnsureSameCurrency(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException($"異なる通貨同士の操作はできません: {Currency} vs {other.Currency}");
    }
    
    // 便利な静的メソッド
    public static Money Zero => new Money(0);
    public static Money Yen(decimal amount) => new Money(amount, "JPY");
    public static Money Dollar(decimal amount) => new Money(amount, "USD");
    
    // 表示用メソッド
    public override string ToString()
    {
        return Currency switch
        {
            "JPY" => $"¥{Amount:N0}",
            "USD" => $"USD {Amount:N2}",
            "EUR" => $"€{Amount:N2}",
            _ => $"{Amount:N2} {Currency}"
        };
    }
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Amount;
        yield return Currency;
    }
}
\`\`\`

#### 2. メールアドレス（EmailAddress）

\`\`\`csharp
public class EmailAddress : ValueObject
{
    public string Value { get; private set; }
    public string LocalPart => Value.Split('@')[0];
    public string Domain => Value.Split('@')[1];
    
    public EmailAddress(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("メールアドレスは必須です", nameof(value));
            
        value = value.Trim().ToLowerInvariant();
        
        if (!IsValidEmail(value))
            throw new ArgumentException("有効なメールアドレス形式ではありません", nameof(value));
            
        Value = value;
    }
    
    private static bool IsValidEmail(string email)
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
    
    public bool IsSameDomain(EmailAddress other)
    {
        return Domain.Equals(other.Domain, StringComparison.OrdinalIgnoreCase);
    }
    
    public bool IsBusinessEmail()
    {
        var freeEmailDomains = new[] { "gmail.com", "yahoo.com", "hotmail.com", "outlook.com" };
        return !freeEmailDomains.Contains(Domain);
    }
    
    public override string ToString() => Value;
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}
\`\`\`

#### 3. 住所（Address）

\`\`\`csharp
public class Address : ValueObject
{
    public string PostalCode { get; private set; }
    public string Prefecture { get; private set; }
    public string City { get; private set; }
    public string AddressLine1 { get; private set; }
    public string AddressLine2 { get; private set; }
    public string Country { get; private set; }
    
    public Address(string postalCode, string prefecture, string city, 
                   string addressLine1, string addressLine2 = null, string country = "日本")
    {
        PostalCode = ValidateAndFormatPostalCode(postalCode);
        Prefecture = ValidateRequired(prefecture, nameof(prefecture));
        City = ValidateRequired(city, nameof(city));
        AddressLine1 = ValidateRequired(addressLine1, nameof(addressLine1));
        AddressLine2 = addressLine2?.Trim();
        Country = ValidateRequired(country, nameof(country));
    }
    
    private static string ValidateRequired(string value, string paramName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException($"{paramName}は必須です", paramName);
            
        return value.Trim();
    }
    
    private static string ValidateAndFormatPostalCode(string postalCode)
    {
        if (string.IsNullOrWhiteSpace(postalCode))
            throw new ArgumentException("郵便番号は必須です", nameof(postalCode));
            
        // 日本の郵便番号フォーマット（xxx-xxxx）
        postalCode = postalCode.Replace("-", "").Replace(" ", "");
        
        if (postalCode.Length != 7 || !postalCode.All(char.IsDigit))
            throw new ArgumentException("郵便番号は7桁の数字である必要があります", nameof(postalCode));
            
        return $"{postalCode.Substring(0, 3)}-{postalCode.Substring(3, 4)}";
    }
    
    public string GetFullAddress()
    {
        var parts = new List<string> { Country, Prefecture, City, AddressLine1 };
        
        if (!string.IsNullOrWhiteSpace(AddressLine2))
            parts.Add(AddressLine2);
            
        return string.Join(" ", parts);
    }
    
    public bool IsSameCity(Address other)
    {
        return Prefecture.Equals(other.Prefecture, StringComparison.OrdinalIgnoreCase) &&
               City.Equals(other.City, StringComparison.OrdinalIgnoreCase);
    }
    
    public override string ToString() => GetFullAddress();
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return PostalCode;
        yield return Prefecture;
        yield return City;
        yield return AddressLine1;
        yield return AddressLine2;
        yield return Country;
    }
}
\`\`\`

## エンティティ ID のバリューオブジェクト化

エンティティの識別子も、バリューオブジェクトとして実装することで、型安全性と表現力を向上できます：

\`\`\`csharp
public class CustomerId : ValueObject
{
    public Guid Value { get; private set; }
    
    public CustomerId(Guid value)
    {
        if (value == Guid.Empty)
            throw new ArgumentException("顧客IDは空にできません", nameof(value));
            
        Value = value;
    }
    
    public static CustomerId NewId() => new CustomerId(Guid.NewGuid());
    
    public static CustomerId From(string value)
    {
        if (Guid.TryParse(value, out var guid))
            return new CustomerId(guid);
            
        throw new ArgumentException("有効なGUID形式ではありません", nameof(value));
    }
    
    public override string ToString() => Value.ToString();
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}

public class OrderId : ValueObject
{
    public Guid Value { get; private set; }
    
    public OrderId(Guid value)
    {
        if (value == Guid.Empty)
            throw new ArgumentException("注文IDは空にできません", nameof(value));
            
        Value = value;
    }
    
    public static OrderId NewId() => new OrderId(Guid.NewGuid());
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}
\`\`\`

## ドメインの表現力を高める実践例

### 注文システムの実装

\`\`\`csharp
public class Order : Entity<OrderId>
{
    private readonly List<OrderItem> _items = new();
    
    public CustomerId CustomerId { get; private set; }
    public OrderNumber OrderNumber { get; private set; }
    public Address DeliveryAddress { get; private set; }
    public OrderStatus Status { get; private set; }
    public DateTime OrderDate { get; private set; }
    public DateTime? DeliveryDate { get; private set; }
    public Money TotalAmount { get; private set; }
    
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();
    
    private Order() { } // for ORM
    
    internal static Order Create(OrderId orderId, CustomerId customerId, 
                                List<OrderItem> items, Address deliveryAddress)
    {
        if (items == null || !items.Any())
            throw new DomainException("注文には最低1つの商品が必要です");
            
        var order = new Order
        {
            Id = orderId,
            CustomerId = customerId,
            OrderNumber = OrderNumber.Generate(),
            DeliveryAddress = deliveryAddress,
            Status = OrderStatus.Pending,
            OrderDate = DateTime.UtcNow
        };
        
        foreach (var item in items)
        {
            order._items.Add(item);
        }
        
        order.RecalculateTotal();
        
        return order;
    }
    
    public void AddItem(Product product, Quantity quantity)
    {
        if (Status != OrderStatus.Pending)
            throw new DomainException("確定済みの注文には商品を追加できません");
            
        var existingItem = _items.FirstOrDefault(item => item.ProductId == product.Id);
        
        if (existingItem != null)
        {
            existingItem.IncreaseQuantity(quantity);
        }
        else
        {
            var newItem = OrderItem.Create(product, quantity);
            _items.Add(newItem);
        }
        
        RecalculateTotal();
    }
    
    public void Confirm()
    {
        if (Status != OrderStatus.Pending)
            throw new DomainException("ペンディング状態の注文のみ確定できます");
            
        if (!_items.Any())
            throw new DomainException("空の注文は確定できません");
            
        Status = OrderStatus.Confirmed;
        
        AddDomainEvent(new OrderConfirmedEvent(Id, CustomerId, TotalAmount));
    }
    
    public void Ship(DateTime shipmentDate)
    {
        if (Status != OrderStatus.Confirmed)
            throw new DomainException("確定済みの注文のみ出荷できます");
            
        Status = OrderStatus.Shipped;
        DeliveryDate = shipmentDate;
        
        AddDomainEvent(new OrderShippedEvent(Id, shipmentDate));
    }
    
    private void RecalculateTotal()
    {
        TotalAmount = _items.Aggregate(
            Money.Zero,
            (sum, item) => sum.Add(item.SubTotal)
        );
    }
}

// 注文商品（エンティティ）
public class OrderItem : Entity<OrderItemId>
{
    public ProductId ProductId { get; private set; }
    public string ProductName { get; private set; }
    public Money UnitPrice { get; private set; }
    public Quantity Quantity { get; private set; }
    public Money SubTotal { get; private set; }
    
    private OrderItem() { } // for ORM
    
    internal static OrderItem Create(Product product, Quantity quantity)
    {
        var item = new OrderItem
        {
            Id = OrderItemId.NewId(),
            ProductId = product.Id,
            ProductName = product.Name,
            UnitPrice = product.Price,
            Quantity = quantity
        };
        
        item.RecalculateSubTotal();
        return item;
    }
    
    public void IncreaseQuantity(Quantity additionalQuantity)
    {
        Quantity = Quantity.Add(additionalQuantity);
        RecalculateSubTotal();
    }
    
    private void RecalculateSubTotal()
    {
        SubTotal = UnitPrice.Multiply(Quantity.Value);
    }
}

// 数量バリューオブジェクト
public class Quantity : ValueObject
{
    public int Value { get; private set; }
    
    public Quantity(int value)
    {
        if (value <= 0)
            throw new ArgumentException("数量は1以上である必要があります", nameof(value));
            
        Value = value;
    }
    
    public Quantity Add(Quantity other)
    {
        return new Quantity(Value + other.Value);
    }
    
    public Quantity Subtract(Quantity other)
    {
        var newValue = Value - other.Value;
        if (newValue <= 0)
            throw new InvalidOperationException("数量は1以上である必要があります");
            
        return new Quantity(newValue);
    }
    
    public static implicit operator int(Quantity quantity) => quantity.Value;
    public static implicit operator Quantity(int value) => new Quantity(value);
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}

// 注文番号バリューオブジェクト
public class OrderNumber : ValueObject
{
    public string Value { get; private set; }
    
    public OrderNumber(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("注文番号は必須です", nameof(value));
            
        Value = value.ToUpperInvariant();
    }
    
    public static OrderNumber Generate()
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd");
        var randomSuffix = new Random().Next(1000, 9999);
        return new OrderNumber($"ORD-{timestamp}-{randomSuffix}");
    }
    
    public override string ToString() => Value;
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}
\`\`\`

## 設計のガイドライン

### エンティティとして設計するべき場合

1. **個別に追跡する必要がある**: 顧客、注文、商品など
2. **ライフサイクルが重要**: 作成、更新、削除の履歴が重要
3. **状態変化が意味を持つ**: ステータスの変化がビジネス的に重要
4. **他のオブジェクトから参照される**: 識別子による参照が必要

### バリューオブジェクトとして設計するべき場合

1. **値そのものが重要**: 金額、住所、メールアドレスなど
2. **不変であるべき**: 一度作成したら変更しない
3. **計算や操作の対象**: 金額の加算、住所の比較など
4. **置換可能**: 同じ値なら交換しても問題ない

### 実装のベストプラクティス

1. **不変性の確保**: バリューオブジェクトは不変にする
2. **検証ロジック**: コンストラクタで必要な検証を行う
3. **意味のある操作**: ドメインに即したメソッドを提供
4. **適切な等価性**: エンティティはID、バリューオブジェクトは値で比較
5. **型安全性**: プリミティブ型の代わりに専用のバリューオブジェクトを使用

## まとめ

エンティティとバリューオブジェクトは、DDDにおける表現力豊かなドメインモデルの基盤です：

### エンティティの重要ポイント
- **アイデンティティ**による識別
- **ビジネス的に重要**な概念の表現
- **適切な責務**の分担
- **ドメインイベント**による状態変化の通知

### バリューオブジェクトの重要ポイント
- **値による等価性**
- **不変性**の保証
- **ドメイン概念**の明確な表現
- **型安全性**の向上

次のレッスンでは、これらの要素を組み合わせた**集約（Aggregate）**について学習し、より複雑なドメインモデルの設計方法を習得します。
`,
  codeExamples: [
    {
      id: 'complete-entity-implementation',
      title: 'エンティティの完全な実装例',
      description: 'ビジネスロジックを含む実際のエンティティ実装',
      language: 'csharp',
      code: `using System;
using System.Collections.Generic;
using System.Linq;

// === エンティティの実装例: ブログ記事管理システム ===

namespace BlogDomain
{
    /// <summary>
    /// ブログ記事エンティティ - 記事のライフサイクルとビジネスロジックを管理
    /// </summary>
    public class BlogPost : Entity<BlogPostId>
    {
        private readonly List<Comment> _comments = new();
        private readonly List<Tag> _tags = new();
        private readonly List<BlogPostRevision> _revisions = new();
        
        public string Title { get; private set; }
        public string Content { get; private set; }
        public AuthorId AuthorId { get; private set; }
        public BlogPostStatus Status { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? PublishedAt { get; private set; }
        public DateTime LastModifiedAt { get; private set; }
        public int ViewCount { get; private set; }
        public Slug Slug { get; private set; }
        
        // 読み取り専用コレクション
        public IReadOnlyList<Comment> Comments => _comments.AsReadOnly();
        public IReadOnlyList<Tag> Tags => _tags.AsReadOnly();
        public IReadOnlyList<BlogPostRevision> Revisions => _revisions.AsReadOnly();
        
        // 計算プロパティ
        public bool IsPublished => Status == BlogPostStatus.Published;
        public bool CanBeEdited => Status == BlogPostStatus.Draft || Status == BlogPostStatus.Published;
        public TimeSpan TimeSincePublished => PublishedAt.HasValue 
            ? DateTime.UtcNow - PublishedAt.Value 
            : TimeSpan.Zero;
        
        private BlogPost() { } // for ORM
        
        /// <summary>
        /// 新しいブログ記事を作成する（ファクトリーメソッド）
        /// </summary>
        public static BlogPost Create(string title, string content, AuthorId authorId, List<string> tagNames = null)
        {
            // ビジネスルールの検証
            if (string.IsNullOrWhiteSpace(title))
                throw new DomainException("記事のタイトルは必須です");
                
            if (string.IsNullOrWhiteSpace(content))
                throw new DomainException("記事の内容は必須です");
                
            if (title.Length > 200)
                throw new DomainException("タイトルは200文字以内である必要があります");
                
            if (content.Length < 100)
                throw new DomainException("記事の内容は100文字以上である必要があります");
            
            var post = new BlogPost
            {
                Id = BlogPostId.NewId(),
                Title = title.Trim(),
                Content = content.Trim(),
                AuthorId = authorId ?? throw new ArgumentNullException(nameof(authorId)),
                Status = BlogPostStatus.Draft,
                CreatedAt = DateTime.UtcNow,
                LastModifiedAt = DateTime.UtcNow,
                ViewCount = 0,
                Slug = Slug.FromTitle(title)
            };
            
            // 初期リビジョンの作成
            post._revisions.Add(BlogPostRevision.Create(post.Id, title, content, 1));
            
            // タグの追加
            if (tagNames != null && tagNames.Any())
            {
                foreach (var tagName in tagNames.Where(t => !string.IsNullOrWhiteSpace(t)))
                {
                    post._tags.Add(Tag.Create(tagName));
                }
            }
            
            // ドメインイベントの発行
            post.AddDomainEvent(new BlogPostCreatedEvent(post.Id, authorId, title));
            
            return post;
        }
        
        /// <summary>
        /// 記事を編集する
        /// </summary>
        public void Edit(string newTitle, string newContent, List<string> newTagNames = null)
        {
            if (!CanBeEdited)
                throw new DomainException($"ステータス {Status} の記事は編集できません");
                
            if (string.IsNullOrWhiteSpace(newTitle))
                throw new DomainException("記事のタイトルは必須です");
                
            if (string.IsNullOrWhiteSpace(newContent))
                throw new DomainException("記事の内容は必須です");
                
            if (newTitle.Length > 200)
                throw new DomainException("タイトルは200文字以内である必要があります");
                
            if (newContent.Length < 100)
                throw new DomainException("記事の内容は100文字以上である必要があります");
            
            // 変更があるかチェック
            var titleChanged = Title != newTitle.Trim();
            var contentChanged = Content != newContent.Trim();
            
            if (!titleChanged && !contentChanged && !HasTagsChanged(newTagNames))
                return; // 変更なし
            
            // リビジョン作成（変更前の状態を保存）
            var nextRevisionNumber = _revisions.Max(r => r.RevisionNumber) + 1;
            _revisions.Add(BlogPostRevision.Create(Id, Title, Content, nextRevisionNumber));
            
            // 内容更新
            if (titleChanged)
            {
                Title = newTitle.Trim();
                Slug = Slug.FromTitle(Title); // スラッグも更新
            }
            
            if (contentChanged)
            {
                Content = newContent.Trim();
            }
            
            // タグ更新
            if (HasTagsChanged(newTagNames))
            {
                UpdateTags(newTagNames);
            }
            
            LastModifiedAt = DateTime.UtcNow;
            
            // 公開済みの場合は下書きに戻す
            if (Status == BlogPostStatus.Published)
            {
                Status = BlogPostStatus.Draft;
                AddDomainEvent(new BlogPostUnpublishedEvent(Id, "編集により下書きに変更"));
            }
            
            AddDomainEvent(new BlogPostEditedEvent(Id, titleChanged, contentChanged));
        }
        
        /// <summary>
        /// 記事を公開する
        /// </summary>
        public void Publish()
        {
            if (Status == BlogPostStatus.Published)
                throw new DomainException("既に公開済みの記事です");
                
            if (Status == BlogPostStatus.Archived)
                throw new DomainException("アーカイブ済みの記事は公開できません");
                
            if (string.IsNullOrWhiteSpace(Content) || Content.Length < 100)
                throw new DomainException("内容が不十分な記事は公開できません");
                
            if (!_tags.Any())
                throw new DomainException("タグが設定されていない記事は公開できません");
            
            Status = BlogPostStatus.Published;
            PublishedAt = DateTime.UtcNow;
            LastModifiedAt = DateTime.UtcNow;
            
            AddDomainEvent(new BlogPostPublishedEvent(Id, AuthorId, Title));
        }
        
        /// <summary>
        /// 記事を非公開にする
        /// </summary>
        public void Unpublish(string reason)
        {
            if (Status != BlogPostStatus.Published)
                throw new DomainException("公開済みの記事のみ非公開にできます");
                
            if (string.IsNullOrWhiteSpace(reason))
                throw new ArgumentException("非公開理由は必須です", nameof(reason));
            
            Status = BlogPostStatus.Draft;
            LastModifiedAt = DateTime.UtcNow;
            
            AddDomainEvent(new BlogPostUnpublishedEvent(Id, reason));
        }
        
        /// <summary>
        /// 記事をアーカイブする
        /// </summary>
        public void Archive(string reason)
        {
            if (Status == BlogPostStatus.Archived)
                throw new DomainException("既にアーカイブ済みの記事です");
                
            if (string.IsNullOrWhiteSpace(reason))
                throw new ArgumentException("アーカイブ理由は必須です", nameof(reason));
            
            Status = BlogPostStatus.Archived;
            LastModifiedAt = DateTime.UtcNow;
            
            AddDomainEvent(new BlogPostArchivedEvent(Id, reason));
        }
        
        /// <summary>
        /// コメントを追加する
        /// </summary>
        public Comment AddComment(string authorName, EmailAddress authorEmail, string content)
        {
            if (!IsPublished)
                throw new DomainException("公開されていない記事にはコメントできません");
                
            if (string.IsNullOrWhiteSpace(authorName))
                throw new ArgumentException("コメント作成者名は必須です", nameof(authorName));
                
            if (string.IsNullOrWhiteSpace(content))
                throw new ArgumentException("コメント内容は必須です", nameof(content));
                
            if (content.Length > 1000)
                throw new DomainException("コメントは1000文字以内である必要があります");
            
            var comment = Comment.Create(
                CommentId.NewId(),
                Id,
                authorName,
                authorEmail,
                content
            );
            
            _comments.Add(comment);
            
            AddDomainEvent(new CommentAddedEvent(Id, comment.Id, authorName));
            
            return comment;
        }
        
        /// <summary>
        /// 閲覧数を増加させる
        /// </summary>
        public void IncrementViewCount()
        {
            if (!IsPublished)
                return; // 非公開記事の閲覧はカウントしない
                
            ViewCount++;
            
            // 一定の閲覧数に達したらイベント発行
            if (ViewCount % 100 == 0) // 100の倍数
            {
                AddDomainEvent(new BlogPostMilestoneReachedEvent(Id, ViewCount));
            }
        }
        
        /// <summary>
        /// 記事の人気度を計算する
        /// </summary>
        public PopularityScore CalculatePopularityScore()
        {
            if (!IsPublished)
                return PopularityScore.Zero;
            
            var daysSincePublished = (DateTime.UtcNow - PublishedAt.Value).TotalDays;
            if (daysSincePublished <= 0) daysSincePublished = 1;
            
            // 人気度 = (閲覧数 * 1.0) + (コメント数 * 5.0) / 経過日数
            var score = (ViewCount * 1.0 + _comments.Count * 5.0) / daysSincePublished;
            
            return new PopularityScore(score);
        }
        
        /// <summary>
        /// 指定したタグを持つかどうか
        /// </summary>
        public bool HasTag(string tagName)
        {
            return _tags.Any(tag => tag.Name.Equals(tagName, StringComparison.OrdinalIgnoreCase));
        }
        
        /// <summary>
        /// 読了時間を計算する（目安）
        /// </summary>
        public ReadingTime EstimateReadingTime()
        {
            const int averageWordsPerMinute = 250; // 英語の平均
            const int averageCharactersPerWord = 5; // 日本語考慮
            
            var wordCount = Content.Length / averageCharactersPerWord;
            var minutes = Math.Max(1, (int)Math.Ceiling((double)wordCount / averageWordsPerMinute));
            
            return new ReadingTime(minutes);
        }
        
        private bool HasTagsChanged(List<string> newTagNames)
        {
            newTagNames = newTagNames?.Where(t => !string.IsNullOrWhiteSpace(t)).ToList() ?? new List<string>();
            
            if (_tags.Count != newTagNames.Count)
                return true;
                
            return newTagNames.Any(newTag => !HasTag(newTag));
        }
        
        private void UpdateTags(List<string> newTagNames)
        {
            _tags.Clear();
            
            if (newTagNames != null)
            {
                foreach (var tagName in newTagNames.Where(t => !string.IsNullOrWhiteSpace(t)))
                {
                    _tags.Add(Tag.Create(tagName));
                }
            }
        }
    }
    
    /// <summary>
    /// コメントエンティティ
    /// </summary>
    public class Comment : Entity<CommentId>
    {
        public BlogPostId BlogPostId { get; private set; }
        public string AuthorName { get; private set; }
        public EmailAddress AuthorEmail { get; private set; }
        public string Content { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public CommentStatus Status { get; private set; }
        
        private Comment() { } // for ORM
        
        internal static Comment Create(CommentId id, BlogPostId blogPostId, string authorName, 
                                     EmailAddress authorEmail, string content)
        {
            return new Comment
            {
                Id = id,
                BlogPostId = blogPostId,
                AuthorName = authorName.Trim(),
                AuthorEmail = authorEmail,
                Content = content.Trim(),
                CreatedAt = DateTime.UtcNow,
                Status = CommentStatus.Pending // モデレーション待ち
            };
        }
        
        public void Approve()
        {
            if (Status == CommentStatus.Approved)
                return;
                
            Status = CommentStatus.Approved;
        }
        
        public void Reject(string reason)
        {
            Status = CommentStatus.Rejected;
        }
    }
    
    /// <summary>
    /// リビジョンエンティティ - 記事の履歴管理
    /// </summary>
    public class BlogPostRevision : Entity<BlogPostRevisionId>
    {
        public BlogPostId BlogPostId { get; private set; }
        public string Title { get; private set; }
        public string Content { get; private set; }
        public int RevisionNumber { get; private set; }
        public DateTime CreatedAt { get; private set; }
        
        private BlogPostRevision() { } // for ORM
        
        internal static BlogPostRevision Create(BlogPostId blogPostId, string title, string content, int revisionNumber)
        {
            return new BlogPostRevision
            {
                Id = BlogPostRevisionId.NewId(),
                BlogPostId = blogPostId,
                Title = title,
                Content = content,
                RevisionNumber = revisionNumber,
                CreatedAt = DateTime.UtcNow
            };
        }
    }
    
    // エンティティID（バリューオブジェクト）
    public class BlogPostId : ValueObject
    {
        public Guid Value { get; private set; }
        
        public BlogPostId(Guid value)
        {
            Value = value == Guid.Empty ? throw new ArgumentException("IDは空にできません") : value;
        }
        
        public static BlogPostId NewId() => new BlogPostId(Guid.NewGuid());
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Value;
        }
        
        public override string ToString() => Value.ToString();
    }
    
    public class CommentId : ValueObject
    {
        public Guid Value { get; private set; }
        
        public CommentId(Guid value)
        {
            Value = value == Guid.Empty ? throw new ArgumentException("IDは空にできません") : value;
        }
        
        public static CommentId NewId() => new CommentId(Guid.NewGuid());
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Value;
        }
    }
    
    public class AuthorId : ValueObject
    {
        public Guid Value { get; private set; }
        
        public AuthorId(Guid value)
        {
            Value = value == Guid.Empty ? throw new ArgumentException("IDは空にできません") : value;
        }
        
        public static AuthorId NewId() => new AuthorId(Guid.NewGuid());
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Value;
        }
    }
    
    public class BlogPostRevisionId : ValueObject
    {
        public Guid Value { get; private set; }
        
        public BlogPostRevisionId(Guid value)
        {
            Value = value == Guid.Empty ? throw new ArgumentException("IDは空にできません") : value;
        }
        
        public static BlogPostRevisionId NewId() => new BlogPostRevisionId(Guid.NewGuid());
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Value;
        }
    }
    
    // 列挙型
    public enum BlogPostStatus { Draft, Published, Archived }
    public enum CommentStatus { Pending, Approved, Rejected }
}

// 使用例
public class Program
{
    public static void Main()
    {
        Console.WriteLine("=== ブログ記事管理システムの例 ===\\n");
        
        try
        {
            // ブログ記事の作成
            var authorId = AuthorId.NewId();
            var tags = new List<string> { "C#", "DDD", "設計" };
            
            var blogPost = BlogPost.Create(
                "DDDにおけるエンティティとバリューオブジェクト",
                "ドメイン駆動設計では、エンティティとバリューオブジェクトを適切に使い分けることで、表現力豊かなドメインモデルを構築できます。エンティティは一意の識別子を持ち...",
                authorId,
                tags
            );
            
            Console.WriteLine($"記事作成: {blogPost.Title}");
            Console.WriteLine($"ステータス: {blogPost.Status}");
            Console.WriteLine($"スラッグ: {blogPost.Slug}");
            Console.WriteLine($"推定読了時間: {blogPost.EstimateReadingTime()}");
            
            // 記事の編集
            blogPost.Edit(
                "DDDにおけるエンティティとバリューオブジェクトの実装",
                "ドメイン駆動設計では、エンティティとバリューオブジェクトを適切に使い分けることで、表現力豊かなドメインモデルを構築できます。エンティティは一意の識別子を持ち、ライフサイクルを通じて追跡されます。一方、バリューオブジェクトは値そのものを表現し、不変性を保ちます。",
                new List<string> { "C#", "DDD", "設計", "実装" }
            );
            
            Console.WriteLine($"\\n記事編集後:");
            Console.WriteLine($"タイトル: {blogPost.Title}");
            Console.WriteLine($"リビジョン数: {blogPost.Revisions.Count}");
            Console.WriteLine($"推定読了時間: {blogPost.EstimateReadingTime()}");
            
            // 記事の公開
            blogPost.Publish();
            Console.WriteLine($"\\n記事公開: {blogPost.Status}");
            Console.WriteLine($"公開日時: {blogPost.PublishedAt}");
            
            // コメント追加
            var commenterEmail = new EmailAddress("reader@example.com");
            var comment = blogPost.AddComment(
                "読者太郎",
                commenterEmail,
                "とても参考になりました。特にエンティティとバリューオブジェクトの使い分けについて理解が深まりました。"
            );
            
            // 閲覧数増加
            for (int i = 0; i < 150; i++)
            {
                blogPost.IncrementViewCount();
            }
            
            Console.WriteLine($"\\n記事統計:");
            Console.WriteLine($"閲覧数: {blogPost.ViewCount}");
            Console.WriteLine($"コメント数: {blogPost.Comments.Count}");
            Console.WriteLine($"人気度スコア: {blogPost.CalculatePopularityScore()}");
            
            // コメント承認
            comment.Approve();
            Console.WriteLine($"コメント承認: {comment.Status}");
            
        }
        catch (DomainException ex)
        {
            Console.WriteLine($"ドメインエラー: {ex.Message}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"エラー: {ex.Message}");
        }
    }
}`
    },
    {
      id: 'advanced-value-object-implementation',
      title: 'バリューオブジェクトの高度な実装',
      description: '複雑なバリューオブジェクトの設計と実装パターン',
      language: 'csharp',
      code: `using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

// === 高度なバリューオブジェクトの実装例 ===

namespace AdvancedValueObjects
{
    /// <summary>
    /// 日付範囲バリューオブジェクト - 期間を表現
    /// </summary>
    public class DateRange : ValueObject
    {
        public DateTime StartDate { get; private set; }
        public DateTime EndDate { get; private set; }
        
        public TimeSpan Duration => EndDate - StartDate;
        public int DurationInDays => (int)Duration.TotalDays;
        public bool IsEmpty => StartDate == EndDate;
        
        public DateRange(DateTime startDate, DateTime endDate)
        {
            if (startDate > endDate)
                throw new ArgumentException("開始日は終了日より前である必要があります");
                
            StartDate = startDate.Date; // 時間部分を削除
            EndDate = endDate.Date;
        }
        
        // 便利なファクトリーメソッド
        public static DateRange ForSingleDay(DateTime date) => new DateRange(date, date);
        public static DateRange ForWeek(DateTime startOfWeek) => new DateRange(startOfWeek, startOfWeek.AddDays(6));
        public static DateRange ForMonth(DateTime month) => new DateRange(
            new DateTime(month.Year, month.Month, 1),
            new DateTime(month.Year, month.Month, DateTime.DaysInMonth(month.Year, month.Month))
        );
        
        // ビジネスメソッド
        public bool Contains(DateTime date)
        {
            var dateOnly = date.Date;
            return dateOnly >= StartDate && dateOnly <= EndDate;
        }
        
        public bool Overlaps(DateRange other)
        {
            return StartDate <= other.EndDate && EndDate >= other.StartDate;
        }
        
        public DateRange? GetOverlap(DateRange other)
        {
            if (!Overlaps(other))
                return null;
                
            var overlapStart = StartDate > other.StartDate ? StartDate : other.StartDate;
            var overlapEnd = EndDate < other.EndDate ? EndDate : other.EndDate;
            
            return new DateRange(overlapStart, overlapEnd);
        }
        
        public DateRange ExtendBy(TimeSpan duration)
        {
            return new DateRange(StartDate, EndDate.Add(duration));
        }
        
        public DateRange ShrinkBy(TimeSpan duration)
        {
            var newEndDate = EndDate.Subtract(duration);
            if (newEndDate < StartDate)
                throw new InvalidOperationException("期間を縮小すると無効な範囲になります");
                
            return new DateRange(StartDate, newEndDate);
        }
        
        public IEnumerable<DateTime> GetDatesInRange()
        {
            var currentDate = StartDate;
            while (currentDate <= EndDate)
            {
                yield return currentDate;
                currentDate = currentDate.AddDays(1);
            }
        }
        
        public override string ToString() => $"{StartDate:yyyy/MM/dd} - {EndDate:yyyy/MM/dd}";
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return StartDate;
            yield return EndDate;
        }
    }
    
    /// <summary>
    /// 価格バリューオブジェクト - 税込み・税抜きを含む複雑な金額計算
    /// </summary>
    public class Price : ValueObject
    {
        public Money BaseAmount { get; private set; }
        public TaxRate TaxRate { get; private set; }
        public Money TaxAmount { get; private set; }
        public Money TotalAmount { get; private set; }
        
        public Price(Money baseAmount, TaxRate taxRate)
        {
            BaseAmount = baseAmount ?? throw new ArgumentNullException(nameof(baseAmount));
            TaxRate = taxRate ?? throw new ArgumentNullException(nameof(taxRate));
            
            TaxAmount = taxRate.CalculateTax(baseAmount);
            TotalAmount = baseAmount.Add(TaxAmount);
        }
        
        // ファクトリーメソッド
        public static Price FromTaxInclusiveAmount(Money totalAmount, TaxRate taxRate)
        {
            // 税込み金額から本体価格を逆算
            var baseAmount = taxRate.CalculateBaseAmount(totalAmount);
            return new Price(baseAmount, taxRate);
        }
        
        // 計算メソッド
        public Price ApplyDiscount(DiscountRate discountRate)
        {
            var discountedBase = discountRate.ApplyTo(BaseAmount);
            return new Price(discountedBase, TaxRate);
        }
        
        public Price ChangeQuantity(int quantity)
        {
            if (quantity <= 0)
                throw new ArgumentException("数量は1以上である必要があります");
                
            var newBaseAmount = new Money(BaseAmount.Amount * quantity, BaseAmount.Currency);
            return new Price(newBaseAmount, TaxRate);
        }
        
        public Price ChangeTaxRate(TaxRate newTaxRate)
        {
            return new Price(BaseAmount, newTaxRate);
        }
        
        // 比較メソッド
        public bool IsMoreExpensiveThan(Price other)
        {
            return TotalAmount.IsGreaterThan(other.TotalAmount);
        }
        
        public PriceComparison CompareTo(Price other)
        {
            if (TotalAmount.IsGreaterThan(other.TotalAmount))
                return PriceComparison.MoreExpensive;
            else if (TotalAmount.IsLessThan(other.TotalAmount))
                return PriceComparison.LessExpensive;
            else
                return PriceComparison.SamePrice;
        }
        
        public override string ToString() => 
            $"本体: {BaseAmount}, 税額: {TaxAmount}, 合計: {TotalAmount} (税率: {TaxRate})";
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return BaseAmount;
            yield return TaxRate;
        }
    }
    
    /// <summary>
    /// 税率バリューオブジェクト
    /// </summary>
    public class TaxRate : ValueObject
    {
        public decimal Rate { get; private set; }
        public string Name { get; private set; }
        
        public TaxRate(decimal rate, string name = null)
        {
            if (rate < 0 || rate > 1)
                throw new ArgumentException("税率は0から1の間である必要があります");
                
            Rate = rate;
            Name = name ?? $"{rate * 100:0.##}%";
        }
        
        public Money CalculateTax(Money baseAmount)
        {
            var taxAmount = baseAmount.Amount * Rate;
            return new Money(Math.Round(taxAmount, 0), baseAmount.Currency);
        }
        
        public Money CalculateBaseAmount(Money totalAmount)
        {
            var baseAmount = totalAmount.Amount / (1 + Rate);
            return new Money(Math.Round(baseAmount, 0), totalAmount.Currency);
        }
        
        // 日本の標準的な税率
        public static TaxRate StandardJapan => new TaxRate(0.10m, "標準税率");
        public static TaxRate ReducedJapan => new TaxRate(0.08m, "軽減税率");
        public static TaxRate TaxFree => new TaxRate(0.0m, "非課税");
        
        public override string ToString() => Name;
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Rate;
        }
    }
    
    /// <summary>
    /// 割引率バリューオブジェクト
    /// </summary>
    public class DiscountRate : ValueObject
    {
        public decimal Rate { get; private set; }
        public string Description { get; private set; }
        
        public DiscountRate(decimal rate, string description = null)
        {
            if (rate < 0 || rate > 1)
                throw new ArgumentException("割引率は0から1の間である必要があります");
                
            Rate = rate;
            Description = description ?? $"{rate * 100:0.##}%割引";
        }
        
        public Money ApplyTo(Money amount)
        {
            var discountAmount = amount.Amount * Rate;
            var finalAmount = amount.Amount - discountAmount;
            return new Money(Math.Round(finalAmount, 0), amount.Currency);
        }
        
        public Money CalculateDiscountAmount(Money amount)
        {
            var discountAmount = amount.Amount * Rate;
            return new Money(Math.Round(discountAmount, 0), amount.Currency);
        }
        
        public static DiscountRate NoDiscount => new DiscountRate(0.0m, "割引なし");
        public static DiscountRate TenPercent => new DiscountRate(0.10m, "10%割引");
        public static DiscountRate TwentyPercent => new DiscountRate(0.20m, "20%割引");
        
        public override string ToString() => Description;
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Rate;
        }
    }
    
    /// <summary>
    /// 住所バリューオブジェクト - 国際対応版
    /// </summary>
    public class InternationalAddress : ValueObject
    {
        public string Street { get; private set; }
        public string City { get; private set; }
        public string StateOrProvince { get; private set; }
        public PostalCode PostalCode { get; private set; }
        public Country Country { get; private set; }
        
        public InternationalAddress(string street, string city, string stateOrProvince, 
                                  PostalCode postalCode, Country country)
        {
            Street = ValidateRequired(street, nameof(street));
            City = ValidateRequired(city, nameof(city));
            StateOrProvince = stateOrProvince?.Trim(); // 必須ではない国もある
            PostalCode = postalCode ?? throw new ArgumentNullException(nameof(postalCode));
            Country = country ?? throw new ArgumentNullException(nameof(country));
        }
        
        private static string ValidateRequired(string value, string fieldName)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException($"{fieldName}は必須です", fieldName);
            return value.Trim();
        }
        
        public string GetFormattedAddress()
        {
            return Country.Code switch
            {
                "JP" => FormatJapanese(),
                "US" => FormatAmerican(),
                "GB" => FormatBritish(),
                _ => FormatGeneric()
            };
        }
        
        private string FormatJapanese()
        {
            var parts = new List<string>();
            
            if (!string.IsNullOrEmpty(PostalCode.Value))
                parts.Add($"〒{PostalCode.Value}");
                
            parts.Add(StateOrProvince);
            parts.Add(City);
            parts.Add(Street);
            
            return string.Join(" ", parts.Where(p => !string.IsNullOrWhiteSpace(p)));
        }
        
        private string FormatAmerican()
        {
            var addressLine = $"{Street}, {City}";
            
            if (!string.IsNullOrWhiteSpace(StateOrProvince))
                addressLine += $", {StateOrProvince}";
                
            addressLine += $" {PostalCode.Value}";
            addressLine += $", {Country.Name}";
            
            return addressLine;
        }
        
        private string FormatBritish()
        {
            var parts = new List<string> { Street, City };
            
            if (!string.IsNullOrWhiteSpace(StateOrProvince))
                parts.Add(StateOrProvince);
                
            parts.Add(PostalCode.Value);
            parts.Add(Country.Name);
            
            return string.Join(", ", parts.Where(p => !string.IsNullOrWhiteSpace(p)));
        }
        
        private string FormatGeneric()
        {
            var parts = new List<string> { Street, City };
            
            if (!string.IsNullOrWhiteSpace(StateOrProvince))
                parts.Add(StateOrProvince);
                
            parts.Add(PostalCode.Value);
            parts.Add(Country.Name);
            
            return string.Join(", ", parts.Where(p => !string.IsNullOrWhiteSpace(p)));
        }
        
        public bool IsSameCountry(InternationalAddress other)
        {
            return Country.Equals(other.Country);
        }
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Street;
            yield return City;
            yield return StateOrProvince;
            yield return PostalCode;
            yield return Country;
        }
    }
    
    /// <summary>
    /// 郵便番号バリューオブジェクト - 国別対応
    /// </summary>
    public class PostalCode : ValueObject
    {
        public string Value { get; private set; }
        public string CountryCode { get; private set; }
        
        public PostalCode(string value, string countryCode)
        {
            CountryCode = ValidateCountryCode(countryCode);
            Value = ValidateAndFormat(value, CountryCode);
        }
        
        private static string ValidateCountryCode(string countryCode)
        {
            if (string.IsNullOrWhiteSpace(countryCode))
                throw new ArgumentException("国コードは必須です");
                
            return countryCode.ToUpperInvariant();
        }
        
        private static string ValidateAndFormat(string value, string countryCode)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("郵便番号は必須です");
                
            value = value.Replace(" ", "").Replace("-", "").ToUpperInvariant();
            
            return countryCode switch
            {
                "JP" => ValidateJapanese(value),
                "US" => ValidateAmerican(value),
                "GB" => ValidateBritish(value),
                "CA" => ValidateCanadian(value),
                _ => value // その他の国は基本的な検証のみ
            };
        }
        
        private static string ValidateJapanese(string value)
        {
            if (value.Length != 7 || !value.All(char.IsDigit))
                throw new ArgumentException("日本の郵便番号は7桁の数字である必要があります");
                
            return $"{value.Substring(0, 3)}-{value.Substring(3, 4)}";
        }
        
        private static string ValidateAmerican(string value)
        {
            if (value.Length == 5 && value.All(char.IsDigit))
                return value;
            else if (value.Length == 9 && value.All(char.IsDigit))
                return $"{value.Substring(0, 5)}-{value.Substring(5, 4)}";
            else
                throw new ArgumentException("アメリカの郵便番号は5桁または9桁の数字である必要があります");
        }
        
        private static string ValidateBritish(string value)
        {
            var pattern = @"^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\\s?[0-9][A-Z]{2}$";
            if (!Regex.IsMatch(value, pattern))
                throw new ArgumentException("イギリスの郵便番号形式が正しくありません");
                
            return value;
        }
        
        private static string ValidateCanadian(string value)
        {
            if (value.Length != 6)
                throw new ArgumentException("カナダの郵便番号は6文字である必要があります");
                
            var pattern = @"^[A-Z][0-9][A-Z][0-9][A-Z][0-9]$";
            if (!Regex.IsMatch(value, pattern))
                throw new ArgumentException("カナダの郵便番号は文字と数字が交互になる必要があります");
                
            return $"{value.Substring(0, 3)} {value.Substring(3, 3)}";
        }
        
        public override string ToString() => Value;
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Value;
            yield return CountryCode;
        }
    }
    
    /// <summary>
    /// 国バリューオブジェクト
    /// </summary>
    public class Country : ValueObject
    {
        public string Code { get; private set; } // ISO 3166-1 alpha-2
        public string Name { get; private set; }
        public string Currency { get; private set; }
        
        private Country(string code, string name, string currency)
        {
            Code = code;
            Name = name;
            Currency = currency;
        }
        
        public static Country Japan => new Country("JP", "日本", "JPY");
        public static Country UnitedStates => new Country("US", "アメリカ合衆国", "USD");
        public static Country UnitedKingdom => new Country("GB", "イギリス", "GBP");
        public static Country Canada => new Country("CA", "カナダ", "CAD");
        
        public bool UsesSameCurrency(Country other)
        {
            return Currency.Equals(other.Currency, StringComparison.OrdinalIgnoreCase);
        }
        
        public override string ToString() => Name;
        
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Code;
        }
    }
    
    // 列挙型
    public enum PriceComparison { MoreExpensive, LessExpensive, SamePrice }
}

// 使用例
public class Program
{
    public static void Main()
    {
        Console.WriteLine("=== 高度なバリューオブジェクトの例 ===\\n");
        
        // 日付範囲の使用例
        Console.WriteLine("## 日付範囲の例");
        var projectPeriod = new DateRange(DateTime.Today, DateTime.Today.AddDays(30));
        var vacationPeriod = DateRange.ForWeek(DateTime.Today.AddDays(10));
        
        Console.WriteLine($"プロジェクト期間: {projectPeriod}");
        Console.WriteLine($"休暇期間: {vacationPeriod}");
        Console.WriteLine($"重複: {projectPeriod.Overlaps(vacationPeriod)}");
        Console.WriteLine($"重複期間: {projectPeriod.GetOverlap(vacationPeriod)}");
        
        // 価格計算の例
        Console.WriteLine($"\\n## 価格計算の例");
        var basePrice = new Price(new Money(1000), TaxRate.StandardJapan);
        Console.WriteLine($"基本価格: {basePrice}");
        
        var discountedPrice = basePrice.ApplyDiscount(DiscountRate.TwentyPercent);
        Console.WriteLine($"20%割引後: {discountedPrice}");
        
        var quantityPrice = discountedPrice.ChangeQuantity(3);
        Console.WriteLine($"3個購入時: {quantityPrice}");
        
        // 国際住所の例
        Console.WriteLine($"\\n## 国際住所の例");
        
        var japaneseAddress = new InternationalAddress(
            "港区虎ノ門1-1-1",
            "東京",
            "東京都",
            new PostalCode("1050001", "JP"),
            Country.Japan
        );
        
        var americanAddress = new InternationalAddress(
            "123 Main Street",
            "New York",
            "NY",
            new PostalCode("10001", "US"),
            Country.UnitedStates
        );
        
        Console.WriteLine($"日本の住所: {japaneseAddress.GetFormattedAddress()}");
        Console.WriteLine($"アメリカの住所: {americanAddress.GetFormattedAddress()}");
        Console.WriteLine($"同じ国: {japaneseAddress.IsSameCountry(americanAddress)}");
    }
}`
    }
  ],
  exercises: [
    {
      id: 'entity-vo-exercise-1',
      title: '図書館システムの設計',
      description: '図書館の本と貸出記録をエンティティとバリューオブジェクトで設計してください。',
      difficulty: 'hard',
      starterCode: `using System;
using System.Collections.Generic;

// 図書館システムをDDDで設計してください
// 要件:
// 1. 本（Book）エンティティ
// 2. 貸出記録（LoanRecord）エンティティ  
// 3. ISBN（バリューオブジェクト）
// 4. 貸出期間（LoanPeriod）バリューオブジェクト
// 5. 適切なビジネスルールを実装

public class Book : Entity<BookId>
{
    // TODO: 本エンティティを実装してください
}

public class LoanRecord : Entity<LoanRecordId>
{
    // TODO: 貸出記録エンティティを実装してください
}

public class ISBN : ValueObject
{
    // TODO: ISBNバリューオブジェクトを実装してください
}

public class LoanPeriod : ValueObject
{
    // TODO: 貸出期間バリューオブジェクトを実装してください
}`,
      solution: `public class Book : Entity<BookId>
{
    public ISBN ISBN { get; private set; }
    public string Title { get; private set; }
    public string Author { get; private set; }
    public BookStatus Status { get; private set; }
    public DateTime? CurrentLoanDate { get; private set; }
    public MemberId? CurrentBorrowerId { get; private set; }
    
    public bool IsAvailable => Status == BookStatus.Available;
    
    public static Book Register(ISBN isbn, string title, string author)
    {
        return new Book
        {
            Id = BookId.NewId(),
            ISBN = isbn,
            Title = title,
            Author = author,
            Status = BookStatus.Available
        };
    }
    
    public LoanRecord LoanTo(MemberId memberId, LoanPeriod period)
    {
        if (!IsAvailable)
            throw new DomainException("この本は貸出中です");
            
        Status = BookStatus.OnLoan;
        CurrentBorrowerId = memberId;
        CurrentLoanDate = DateTime.UtcNow;
        
        return LoanRecord.Create(Id, memberId, period);
    }
    
    public void Return()
    {
        if (Status != BookStatus.OnLoan)
            throw new DomainException("この本は貸出中ではありません");
            
        Status = BookStatus.Available;
        CurrentBorrowerId = null;
        CurrentLoanDate = null;
    }
}

public class LoanRecord : Entity<LoanRecordId>
{
    public BookId BookId { get; private set; }
    public MemberId MemberId { get; private set; }
    public LoanPeriod Period { get; private set; }
    public DateTime LoanDate { get; private set; }
    public DateTime? ReturnDate { get; private set; }
    public LoanStatus Status { get; private set; }
    
    public bool IsOverdue => Status == LoanStatus.Active && DateTime.UtcNow > Period.DueDate;
    
    internal static LoanRecord Create(BookId bookId, MemberId memberId, LoanPeriod period)
    {
        return new LoanRecord
        {
            Id = LoanRecordId.NewId(),
            BookId = bookId,
            MemberId = memberId,
            Period = period,
            LoanDate = DateTime.UtcNow,
            Status = LoanStatus.Active
        };
    }
    
    public void MarkAsReturned()
    {
        if (Status != LoanStatus.Active)
            throw new DomainException("アクティブでない貸出記録は返却できません");
            
        Status = LoanStatus.Returned;
        ReturnDate = DateTime.UtcNow;
    }
}

public class ISBN : ValueObject
{
    public string Value { get; private set; }
    
    public ISBN(string value)
    {
        if (!IsValidISBN(value))
            throw new ArgumentException("有効なISBNではありません");
        Value = FormatISBN(value);
    }
    
    private bool IsValidISBN(string isbn) => /* 検証ロジック */ true;
    private string FormatISBN(string isbn) => isbn.Replace("-", "");
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}

public class LoanPeriod : ValueObject
{
    public DateTime LoanDate { get; private set; }
    public DateTime DueDate { get; private set; }
    public int DurationDays => (DueDate - LoanDate).Days;
    
    public LoanPeriod(DateTime loanDate, int durationDays)
    {
        if (durationDays <= 0)
            throw new ArgumentException("貸出期間は1日以上である必要があります");
            
        LoanDate = loanDate.Date;
        DueDate = LoanDate.AddDays(durationDays);
    }
    
    public static LoanPeriod Standard => new LoanPeriod(DateTime.Today, 14);
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return LoanDate;
        yield return DueDate;
    }
}`,
      hints: [
        '本は一意に識別される必要があるためエンティティとして設計する',
        'ISBNは値による等価性を持つためバリューオブジェクトとして設計する',
        '貸出期間は開始日と期間日数から自動で終了日を計算する',
        '貸出状態と返却状態の遷移ルールを適切に実装する'
      ],
      testCases: [
        {
          input: '本の登録、貸出、返却の一連の流れ',
          expectedOutput: '適切に状態が変化し、ビジネスルールが守られる'
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'entity-vo-quiz-1',
      question: 'エンティティとバリューオブジェクトの等価性チェックで正しいのはどれですか？',
      options: [
        'エンティティは識別子で比較、バリューオブジェクトは値で比較',
        'エンティティは値で比較、バリューオブジェクトは識別子で比較',  
        'どちらも参照の比較を行う',
        'どちらも値の比較を行う'
      ],
      correctAnswer: 0,
      explanation: 'エンティティはアイデンティティ（識別子）を持つため識別子で等価性を判断し、バリューオブジェクトは値そのものを表現するため含まれる値で等価性を判断します。'
    },
    {
      id: 'entity-vo-quiz-2',
      question: 'バリューオブジェクトが不変（Immutable）である理由として最も適切なのはどれですか？',
      options: [
        'パフォーマンスを向上させるため',
        'データベースへの保存を簡単にするため',
        '値の信頼性を確保し、予期しない変更を防ぐため',
        'メモリ使用量を削減するため'
      ],
      correctAnswer: 2,
      explanation: 'バリューオブジェクトを不変にすることで、値の信頼性が確保され、システムの他の部分で予期しない変更が発生することを防ぐことができます。これにより、より安全で予測可能なシステムを構築できます。'
    },
    {
      id: 'entity-vo-quiz-3',
      question: '以下のうち、バリューオブジェクトとして設計するのに最も適しているものはどれですか？',
      options: [
        '顧客情報',
        '注文履歴',
        '金額',
        '商品在庫'
      ],
      correctAnswer: 2,
      explanation: '金額は値そのものを表現し、同じ金額であれば交換可能で、個別に追跡する必要がないため、バリューオブジェクトとして設計するのが適切です。一方、顧客、注文履歴、商品在庫は個別に識別・追跡する必要があるためエンティティとして設計すべきです。'
    }
  ],
  nextLesson: 'aggregates',
  estimatedTime: 75
};