# C# Static使用法チートシート

## 📋 Static使用判定表

| 項目 | Static使用 ✅ | Static非使用 ❌ | 理由・説明 |
|------|-------------|----------------|----------|
| **定数・読み取り専用値** | `static readonly` | インスタンスフィールド | 全インスタンスで共有すべき値 |
| **ユーティリティメソッド** | `static` | インスタンスメソッド | オブジェクトの状態に依存しない処理 |
| **拡張メソッド** | `static` | - | 既存クラスへの機能追加 |
| **ファクトリメソッド** | `static` | コンストラクタのみ | オブジェクト生成の代替手段 |
| **設定・構成情報** | `static` | インスタンスプロパティ | アプリケーション全体で共有 |
| **ビジネスロジック** | ❌ | インスタンスメソッド | オブジェクトの責務として実装 |
| **状態を持つデータ** | ❌ | インスタンスフィールド | オブジェクト固有の情報 |
| **継承が必要** | ❌ | 仮想メソッド | staticは継承・オーバーライド不可 |
| **インターフェース実装** | ❌ | インスタンスメソッド | インターフェースはインスタンスメンバーのみ |
| **DIコンテナ管理** | ❌ | インスタンス | 依存性注入の対象はインスタンス |

## 🟢 Static使用が適切なケース

### 1. 定数・読み取り専用値
```csharp
public class DatabaseConfig
{
    // アプリケーション全体で共有する設定値
    public static readonly string ConnectionString = "Server=...";
    public static readonly int MaxRetryCount = 3;
}
```

### 2. ユーティリティメソッド
```csharp
public static class MathHelper
{
    // 状態に依存しない計算処理
    public static decimal CalculateTax(decimal amount, decimal rate)
    {
        return amount * rate;
    }
    
    // 汎用的な変換処理
    public static string FormatCurrency(decimal value)
    {
        return value.ToString("C");
    }
}
```

### 3. 拡張メソッド
```csharp
public static class StringExtensions
{
    // 既存のstringクラスに機能を追加
    public static bool IsValidEmail(this string email)
    {
        return email.Contains("@") && email.Contains(".");
    }
}
```

### 4. ファクトリメソッド
```csharp
public class User
{
    public string Name { get; private set; }
    public string Email { get; private set; }
    
    private User(string name, string email)
    {
        Name = name;
        Email = email;
    }
    
    // オブジェクト生成の代替手段
    public static User CreateGuest()
    {
        return new User("Guest", "guest@example.com");
    }
    
    public static User CreateFromEmail(string email)
    {
        var name = email.Split('@')[0];
        return new User(name, email);
    }
}
```

## 🔴 Static使用を避けるべきケース

### 1. ビジネスロジック
```csharp
// ❌ 良くない例
public static class OrderProcessor
{
    public static void ProcessOrder(Order order)
    {
        // ビジネスロジックをstaticで実装するのは避ける
    }
}

// ✅ 良い例
public class OrderService
{
    private readonly IPaymentService _paymentService;
    
    public OrderService(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }
    
    // インスタンスメソッドとして実装
    public void ProcessOrder(Order order)
    {
        // ビジネスロジックの実装
        _paymentService.ProcessPayment(order.Amount);
    }
}
```

### 2. 状態を持つデータ
```csharp
// ❌ 良くない例
public static class UserSession
{
    public static string CurrentUserId; // 複数ユーザーで問題となる
}

// ✅ 良い例
public class UserSession
{
    public string UserId { get; set; }
    public DateTime LoginTime { get; set; }
    
    // ユーザーごとに個別のインスタンスを作成
}
```

### 3. テストが困難なケース
```csharp
// ❌ 良くない例（テストが困難）
public static class FileLogger
{
    public static void Log(string message)
    {
        File.AppendAllText("log.txt", message); // 外部依存でテストが困難
    }
}

// ✅ 良い例（テスト可能）
public interface ILogger
{
    void Log(string message);
}

public class FileLogger : ILogger
{
    public void Log(string message)
    {
        File.AppendAllText("log.txt", message);
    }
}
```

## 💡 DDD（ドメイン駆動設計）での考慮点

### ドメインサービス
```csharp
// 複数のエンティティにまたがるビジネスロジック
public class PriceCalculationService
{
    // staticではなくインスタンスとして実装
    public decimal CalculateDiscountedPrice(Product product, Customer customer)
    {
        // 複雑な価格計算ロジック
        return product.Price * customer.GetDiscountRate();
    }
}
```

### 値オブジェクト
```csharp
public class Money
{
    public decimal Amount { get; }
    public string Currency { get; }
    
    public Money(decimal amount, string currency)
    {
        Amount = amount;
        Currency = currency;
    }
    
    // staticファクトリメソッドは適切
    public static Money Yen(decimal amount)
    {
        return new Money(amount, "JPY");
    }
    
    public static Money Dollar(decimal amount)
    {
        return new Money(amount, "USD");
    }
}
```

## 🎯 判定フローチャート

```
質問：このメソッド/プロパティは...

1. オブジェクトの状態に依存する？
   → YES: インスタンスメンバー
   → NO: 次の質問へ

2. 将来継承やインターフェース実装が必要？
   → YES: インスタンスメンバー
   → NO: 次の質問へ

3. DIコンテナで管理する必要がある？
   → YES: インスタンスメンバー
   → NO: 次の質問へ

4. ユーティリティ的な処理または定数？
   → YES: static使用を検討
   → NO: インスタンスメンバー
```

## 📚 まとめ

- **Static使用**: ユーティリティ、定数、拡張メソッド、ファクトリメソッド
- **Static回避**: ビジネスロジック、状態を持つデータ、テスト対象コード
- **DDD観点**: ドメインロジックは基本的にインスタンスメソッドで実装

適切なstatic使用により、保守性とテスト容易性を両立したC#コードを書きましょう！