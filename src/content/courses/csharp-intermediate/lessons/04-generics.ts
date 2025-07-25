import type { Lesson } from '../../../../features/learning/types';

export const genericsLesson: Lesson = {
  id: 'generics',
  moduleId: 'generics-collections',
  title: 'ジェネリクス - 型安全な汎用プログラミング',
  description: 'ジェネリクスを使用して型安全で再利用可能なコードを作成し、DDDの基盤となる概念を学習します',
  content: `
# ジェネリクス (Generics)

ジェネリクスは、型をパラメータとして扱うことで、型安全で再利用可能なコードを作成するC#の強力な機能です。

## ジェネリクスとは？

ジェネリクスを使用することで、以下のメリットがあります：

- **型安全性**: コンパイル時に型チェックが行われる
- **パフォーマンス**: ボクシング/アンボクシングが不要
- **コードの再利用**: 同じロジックを異なる型で使用可能
- **IntelliSenseサポート**: IDEによる強力な補完機能

## ジェネリクスの基本構文

### ジェネリッククラス

\`\`\`csharp
// 基本的なジェネリッククラス
public class Container<T>
{
    private T _value;
    
    public Container(T value)
    {
        _value = value;
    }
    
    public T GetValue()
    {
        return _value;
    }
    
    public void SetValue(T value)
    {
        _value = value;
    }
}

// 使用例
var stringContainer = new Container<string>("Hello");
var intContainer = new Container<int>(42);
\`\`\`

### ジェネリックメソッド

\`\`\`csharp
public class Utility
{
    // ジェネリックメソッド
    public static void Swap<T>(ref T a, ref T b)
    {
        T temp = a;
        a = b;
        b = temp;
    }
    
    // 複数の型パラメータ
    public static TResult Transform<TInput, TResult>(TInput input, Func<TInput, TResult> transformer)
    {
        return transformer(input);
    }
}

// 使用例
int x = 10, y = 20;
Utility.Swap(ref x, ref y); // 型推論により <int> は省略可能

string result = Utility.Transform<int, string>(42, i => i.ToString());
\`\`\`

## 型制約 (Type Constraints)

型パラメータに制約を設けることで、より安全で表現力豊かなコードが書けます。

### 基本的な制約

\`\`\`csharp
// where T : class - 参照型のみ
public class ReferenceTypeContainer<T> where T : class
{
    private T _value;
    
    public bool IsNull()
    {
        return _value == null; // 参照型なのでnullチェック可能
    }
}

// where T : struct - 値型のみ
public class ValueTypeContainer<T> where T : struct
{
    private T _value;
    
    public T GetValueOrDefault()
    {
        return _value; // 値型なので常に値が存在
    }
}

// where T : new() - デフォルトコンストラクタを持つ型
public class Factory<T> where T : new()
{
    public T CreateInstance()
    {
        return new T(); // newできることが保証される
    }
}
\`\`\`

### インターフェース制約

\`\`\`csharp
// IComparable<T>を実装している型のみ
public class SortedList<T> where T : IComparable<T>
{
    private List<T> _items = new List<T>();
    
    public void Add(T item)
    {
        _items.Add(item);
        _items.Sort(); // CompareTo()メソッドが使用できる
    }
}

// 複数の制約
public class Repository<T> where T : class, IEntity, new()
{
    public T CreateNew(int id)
    {
        var entity = new T();
        entity.Id = id;
        return entity;
    }
}

public interface IEntity
{
    int Id { get; set; }
}
\`\`\`

## DDDでのジェネリクス活用

### エンティティの基底クラス

\`\`\`csharp
// ドメインエンティティの基底クラス
public abstract class Entity<TId> : IEquatable<Entity<TId>>
{
    public TId Id { get; protected set; }
    
    protected Entity(TId id)
    {
        Id = id;
    }
    
    public bool Equals(Entity<TId> other)
    {
        if (other == null) return false;
        return Id.Equals(other.Id);
    }
    
    public override bool Equals(object obj)
    {
        return Equals(obj as Entity<TId>);
    }
    
    public override int GetHashCode()
    {
        return Id.GetHashCode();
    }
}

// 具体的なエンティティ
public class Customer : Entity<int>
{
    public string Name { get; private set; }
    public Email Email { get; private set; }
    
    public Customer(int id, string name, Email email) : base(id)
    {
        Name = name;
        Email = email;
    }
}

public class Product : Entity<Guid>
{
    public string Name { get; private set; }
    public decimal Price { get; private set; }
    
    public Product(Guid id, string name, decimal price) : base(id)
    {
        Name = name;
        Price = price;
    }
}
\`\`\`

### 値オブジェクトの基底クラス

\`\`\`csharp
public abstract class ValueObject<T> : IEquatable<T> where T : ValueObject<T>
{
    protected abstract IEnumerable<object> GetEqualityComponents();
    
    public bool Equals(T other)
    {
        if (other == null) return false;
        
        return GetEqualityComponents().SequenceEqual(other.GetEqualityComponents());
    }
    
    public override bool Equals(object obj)
    {
        return Equals(obj as T);
    }
    
    public override int GetHashCode()
    {
        return GetEqualityComponents()
            .Select(x => x?.GetHashCode() ?? 0)
            .Aggregate((x, y) => x ^ y);
    }
}

// 具体的な値オブジェクト
public class Email : ValueObject<Email>
{
    public string Value { get; }
    
    public Email(string value)
    {
        if (string.IsNullOrEmpty(value) || !IsValidEmail(value))
            throw new ArgumentException("Invalid email format");
            
        Value = value;
    }
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
    
    private static bool IsValidEmail(string email)
    {
        // 簡単なバリデーション
        return email.Contains("@") && email.Contains(".");
    }
    
    public override string ToString() => Value;
}
\`\`\`

### ジェネリックリポジトリパターン

\`\`\`csharp
// ジェネリックリポジトリインターフェース
public interface IRepository<TEntity, TId> where TEntity : Entity<TId>
{
    Task<TEntity> GetByIdAsync(TId id);
    Task<IEnumerable<TEntity>> GetAllAsync();
    Task<TEntity> AddAsync(TEntity entity);
    Task UpdateAsync(TEntity entity);
    Task DeleteAsync(TId id);
}

// 基本実装
public abstract class RepositoryBase<TEntity, TId> : IRepository<TEntity, TId> 
    where TEntity : Entity<TId>
{
    protected readonly List<TEntity> _entities = new List<TEntity>();
    
    public virtual Task<TEntity> GetByIdAsync(TId id)
    {
        var entity = _entities.FirstOrDefault(e => e.Id.Equals(id));
        return Task.FromResult(entity);
    }
    
    public virtual Task<IEnumerable<TEntity>> GetAllAsync()
    {
        return Task.FromResult<IEnumerable<TEntity>>(_entities);
    }
    
    public virtual Task<TEntity> AddAsync(TEntity entity)
    {
        _entities.Add(entity);
        return Task.FromResult(entity);
    }
    
    public virtual Task UpdateAsync(TEntity entity)
    {
        var existing = _entities.FirstOrDefault(e => e.Id.Equals(entity.Id));
        if (existing != null)
        {
            var index = _entities.IndexOf(existing);
            _entities[index] = entity;
        }
        return Task.CompletedTask;
    }
    
    public virtual Task DeleteAsync(TId id)
    {
        var entity = _entities.FirstOrDefault(e => e.Id.Equals(id));
        if (entity != null)
        {
            _entities.Remove(entity);
        }
        return Task.CompletedTask;
    }
}

// 具体的なリポジトリ
public class CustomerRepository : RepositoryBase<Customer, int>
{
    public async Task<IEnumerable<Customer>> GetByEmailDomainAsync(string domain)
    {
        var customers = await GetAllAsync();
        return customers.Where(c => c.Email.Value.EndsWith($"@{domain}"));
    }
}
\`\`\`

## 共変性と反変性

### 共変性 (Covariance) - out

\`\`\`csharp
// 共変性インターフェース
public interface IProducer<out T>
{
    T Produce();
}

public class AnimalProducer : IProducer<Animal>
{
    public Animal Produce() => new Animal();
}

public class DogProducer : IProducer<Dog>
{
    public Dog Produce() => new Dog();
}

// 使用例：DogはAnimalのサブクラス
IProducer<Animal> producer = new DogProducer(); // 共変性により可能
\`\`\`

### 反変性 (Contravariance) - in

\`\`\`csharp
// 反変性インターフェース
public interface IConsumer<in T>
{
    void Consume(T item);
}

public class AnimalConsumer : IConsumer<Animal>
{
    public void Consume(Animal animal) { /* 処理 */ }
}

// 使用例
IConsumer<Dog> consumer = new AnimalConsumer(); // 反変性により可能
\`\`\`

## ベストプラクティス

1. **適切な命名**: 型パラメータは意味のある名前を使用
   - \`T\`: 汎用的な型
   - \`TKey\`, \`TValue\`: キーと値
   - \`TEntity\`: エンティティ型

2. **制約の活用**: 必要な機能を型パラメータに要求

3. **文書化**: ジェネリクスの使用目的と制約を明確に

4. **パフォーマンス**: 不要なボクシングを避ける

## まとめ

ジェネリクスは型安全で再利用可能なコードを作成するための強力な機能です：

- **型安全性**: コンパイル時の型チェック
- **再利用性**: 同じロジックを異なる型で使用
- **DDDでの活用**: エンティティ、値オブジェクト、リポジトリパターン
- **制約**: 型パラメータに必要な機能を要求

次のレッスンでは、コレクションの詳細について学習します。
`,
  codeExamples: [
    {
      id: 'ddd-entity-implementation',
      title: 'DDDエンティティの実装',
      description: 'ジェネリクスを使用したドメインエンティティの基底クラス',
      language: 'csharp',
      code: `using System;
using System.Collections.Generic;
using System.Linq;

// エンティティの基底クラス
public abstract class Entity<TId> : IEquatable<Entity<TId>>
{
    public TId Id { get; protected set; }
    
    protected Entity(TId id)
    {
        if (id == null)
            throw new ArgumentNullException(nameof(id));
        Id = id;
    }
    
    public bool Equals(Entity<TId> other)
    {
        if (other == null) return false;
        if (ReferenceEquals(this, other)) return true;
        return Id.Equals(other.Id);
    }
    
    public override bool Equals(object obj)
    {
        return Equals(obj as Entity<TId>);
    }
    
    public override int GetHashCode()
    {
        return Id.GetHashCode();
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

// 値オブジェクトの基底クラス
public abstract class ValueObject<T> : IEquatable<T> where T : ValueObject<T>
{
    protected abstract IEnumerable<object> GetEqualityComponents();
    
    public bool Equals(T other)
    {
        if (other == null) return false;
        return GetEqualityComponents().SequenceEqual(other.GetEqualityComponents());
    }
    
    public override bool Equals(object obj)
    {
        return Equals(obj as T);
    }
    
    public override int GetHashCode()
    {
        return GetEqualityComponents()
            .Where(x => x != null)
            .Select(x => x.GetHashCode())
            .Aggregate((x, y) => x ^ y);
    }
}

// 具体的な値オブジェクト
public class Money : ValueObject<Money>
{
    public decimal Amount { get; }
    public string Currency { get; }
    
    public Money(decimal amount, string currency)
    {
        if (amount < 0)
            throw new ArgumentException("Amount cannot be negative");
        if (string.IsNullOrEmpty(currency))
            throw new ArgumentException("Currency is required");
            
        Amount = amount;
        Currency = currency;
    }
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Amount;
        yield return Currency;
    }
    
    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new ArgumentException("Cannot add different currencies");
            
        return new Money(Amount + other.Amount, Currency);
    }
    
    public override string ToString()
    {
        return $"{Amount:C} {Currency}";
    }
}

// 具体的なエンティティ
public class Product : Entity<Guid>
{
    public string Name { get; private set; }
    public Money Price { get; private set; }
    public string Description { get; private set; }
    
    public Product(Guid id, string name, Money price, string description) : base(id)
    {
        if (string.IsNullOrEmpty(name))
            throw new ArgumentException("Product name is required");
            
        Name = name;
        Price = price ?? throw new ArgumentNullException(nameof(price));
        Description = description;
    }
    
    public void UpdatePrice(Money newPrice)
    {
        Price = newPrice ?? throw new ArgumentNullException(nameof(newPrice));
    }
    
    public void UpdateDescription(string description)
    {
        Description = description;
    }
}

public class Customer : Entity<int>
{
    public string Name { get; private set; }
    public Email Email { get; private set; }
    public DateTime RegistrationDate { get; private set; }
    
    public Customer(int id, string name, Email email) : base(id)
    {
        if (string.IsNullOrEmpty(name))
            throw new ArgumentException("Customer name is required");
            
        Name = name;
        Email = email ?? throw new ArgumentNullException(nameof(email));
        RegistrationDate = DateTime.UtcNow;
    }
    
    public void UpdateEmail(Email newEmail)
    {
        Email = newEmail ?? throw new ArgumentNullException(nameof(newEmail));
    }
}

public class Email : ValueObject<Email>
{
    public string Value { get; }
    
    public Email(string value)
    {
        if (string.IsNullOrEmpty(value))
            throw new ArgumentException("Email cannot be empty");
        if (!IsValidEmail(value))
            throw new ArgumentException("Invalid email format");
            
        Value = value.ToLowerInvariant();
    }
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
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
    
    public override string ToString() => Value;
}

public class Program
{
    public static void Main()
    {
        // エンティティの作成
        var productId = Guid.NewGuid();
        var price = new Money(99.99m, "USD");
        var product = new Product(productId, "ワイヤレスマウス", price, "高精度ワイヤレスマウス");
        
        var email = new Email("customer@example.com");
        var customer = new Customer(1, "田中太郎", email);
        
        Console.WriteLine($"商品: {product.Name}, 価格: {product.Price}");
        Console.WriteLine($"顧客: {customer.Name}, メール: {customer.Email}");
        
        // 値オブジェクトの同等性テスト
        var price1 = new Money(100m, "USD");
        var price2 = new Money(100m, "USD");
        var price3 = new Money(100m, "JPY");
        
        Console.WriteLine($"price1 == price2: {price1.Equals(price2)}"); // True
        Console.WriteLine($"price1 == price3: {price1.Equals(price3)}"); // False
        
        // エンティティの同等性テスト
        var product1 = new Product(productId, "商品A", price1, "説明A");
        var product2 = new Product(productId, "商品B", price2, "説明B"); // 同じID
        
        Console.WriteLine($"product1 == product2: {product1.Equals(product2)}"); // True (同じID)
    }
}`
    }
  ],
  exercises: [
    {
      id: 'generics-1',
      title: 'ジェネリックコレクションの実装',
      description: 'スタック（Stack）データ構造をジェネリクスを使用して実装してください。',
      difficulty: 'medium',
      starterCode: `using System;
using System.Collections.Generic;

public class Stack<T>
{
    private List<T> _items;
    
    public Stack()
    {
        _items = new List<T>();
    }
    
    // スタックの要素数を返すプロパティ
    public int Count 
    { 
        get 
        { 
            // TODO: 実装
            return 0; 
        } 
    }
    
    // スタックが空かどうかを返すプロパティ
    public bool IsEmpty 
    { 
        get 
        { 
            // TODO: 実装
            return true; 
        } 
    }
    
    // 要素をスタックの上に追加
    public void Push(T item)
    {
        // TODO: 実装
    }
    
    // スタックの一番上の要素を取り出して返す
    public T Pop()
    {
        // TODO: スタックが空の場合はInvalidOperationExceptionを投げる
        throw new NotImplementedException();
    }
    
    // スタックの一番上の要素を取り出さずに返す
    public T Peek()
    {
        // TODO: スタックが空の場合はInvalidOperationExceptionを投げる
        throw new NotImplementedException();
    }
}`,
      solution: `public int Count 
{ 
    get { return _items.Count; } 
}

public bool IsEmpty 
{ 
    get { return _items.Count == 0; } 
}

public void Push(T item)
{
    _items.Add(item);
}

public T Pop()
{
    if (IsEmpty)
        throw new InvalidOperationException("Stack is empty");
        
    T item = _items[_items.Count - 1];
    _items.RemoveAt(_items.Count - 1);
    return item;
}

public T Peek()
{
    if (IsEmpty)
        throw new InvalidOperationException("Stack is empty");
        
    return _items[_items.Count - 1];
}`,
      hints: [
        'List<T>のCountプロパティを使用します',
        'Push操作ではList<T>のAdd()メソッドを使用',
        'Pop操作では最後の要素を取得してからRemoveAt()で削除',
        '空のスタックに対する操作では例外を投げる必要があります'
      ],
      testCases: [
        {
          input: 'Push(1), Push(2), Pop()',
          expectedOutput: '2が返され、スタックには1が残る'
        },
        {
          input: '空のスタックでPop()',
          expectedOutput: 'InvalidOperationExceptionが発生'
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'generics-quiz-1',
      question: 'ジェネリクスの型制約 "where T : class" の意味は何ですか？',
      options: [
        'Tはクラス名でなければならない',
        'Tは参照型でなければならない',
        'Tはclassキーワードを含む必要がある',
        'Tは抽象クラスでなければならない'
      ],
      correctAnswer: 1,
      explanation: '"where T : class"は型パラメータTが参照型（class）でなければならないことを示す制約です。'
    },
    {
      id: 'generics-quiz-2',
      question: 'DDDにおいてジェネリクスが最も有効に活用される場面は？',
      options: [
        'UI層でのデータバインディング',
        'エンティティと値オブジェクトの基底クラス設計',
        'データベース接続の管理',
        'ログ出力の処理'
      ],
      correctAnswer: 1,
      explanation: 'DDDではエンティティや値オブジェクトの共通的な振る舞いをジェネリクスで抽象化することで、型安全で再利用可能な設計が可能になります。'
    }
  ],
  nextLesson: 'collections',
  estimatedTime: 60
};