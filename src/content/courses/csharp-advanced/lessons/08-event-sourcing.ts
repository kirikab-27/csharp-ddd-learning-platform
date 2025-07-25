import type { Lesson } from '../../../../features/learning/types';

export const eventSourcingLesson: Lesson = {
  id: 'event-sourcing',
  moduleId: 'ddd-strategic-patterns',
  title: 'イベントソーシング - 状態ではなく変更を記録する',
  description: 'イベントソーシングパターンの理論と実装、イベントストアによる監査可能で拡張性の高いアーキテクチャの構築手法を詳しく学習します',
  duration: 140,
  order: 8,
  content: `
# イベントソーシング（Event Sourcing）

イベントソーシングは、アプリケーションの状態変更を一連のイベントとして保存し、現在の状態をこれらのイベントから再構築するアーキテクチャパターンです。データの完全な監査証跡を提供し、時間を遡った状態の復元や複雑なビジネス分析を可能にします。

## イベントソーシングとは何か？

### イベントソーシングの基本概念

**イベントソーシング**は、従来の状態ベースの永続化とは異なるアプローチです：

1. **イベント中心**: 状態ではなく変更イベントを保存
2. **不変性**: 一度保存されたイベントは変更されない
3. **完全な履歴**: すべての変更が記録される
4. **状態の再構築**: イベントから現在の状態を計算

### 従来の状態ベース vs イベントソーシング

**従来の状態ベースアプローチ**:
\`\`\`
現在の状態のみを保存
┌─────────────────┐
│ Account         │
│ Balance: 1000   │ ← 現在の残高のみ
│ LastUpdate: ... │
└─────────────────┘
\`\`\`

**イベントソーシングアプローチ**:
\`\`\`
すべての変更イベントを保存
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ AccountOpened   │ → │ MoneyDeposited  │ → │ MoneyWithdrawn  │
│ Amount: 500     │    │ Amount: 800     │    │ Amount: 300     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                  ↓
                        Current Balance: 1000
\`\`\`

## イベントストアの実装

### イベントストアのインターフェース

\`\`\`csharp
public interface IEventStore
{
    Task SaveEventsAsync<T>(Guid aggregateId, IEnumerable<IDomainEvent> events, 
                           int expectedVersion, CancellationToken cancellationToken = default);
    
    Task<IEnumerable<IDomainEvent>> GetEventsAsync(Guid aggregateId, 
                                                  int fromVersion = 0, 
                                                  CancellationToken cancellationToken = default);
    
    Task<IEnumerable<IDomainEvent>> GetAllEventsAsync(int fromPosition = 0, 
                                                     int maxCount = 1000,
                                                     CancellationToken cancellationToken = default);
}

// イベントメタデータ
public interface IEventMetadata
{
    Guid AggregateId { get; }
    int Version { get; }
    DateTime Timestamp { get; }
    string EventType { get; }
    string UserId { get; }
    IDictionary<string, object> Headers { get; }
}
\`\`\`

### SQL Serverベースのイベントストア実装

\`\`\`csharp
public class SqlEventStore : IEventStore
{
    private readonly string _connectionString;
    private readonly IEventSerializer _serializer;
    private readonly ILogger<SqlEventStore> _logger;

    public SqlEventStore(string connectionString, IEventSerializer serializer, 
                        ILogger<SqlEventStore> logger)
    {
        _connectionString = connectionString ?? throw new ArgumentNullException(nameof(connectionString));
        _serializer = serializer ?? throw new ArgumentNullException(nameof(serializer));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task SaveEventsAsync<T>(Guid aggregateId, IEnumerable<IDomainEvent> events, 
                                        int expectedVersion, CancellationToken cancellationToken = default)
    {
        if (!events.Any()) return;

        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        
        using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        
        try
        {
            // 楽観的同時実行制御
            var currentVersion = await GetCurrentVersionAsync(connection, transaction, aggregateId);
            if (currentVersion != expectedVersion)
            {
                throw new ConcurrencyException(
                    $"Expected version {expectedVersion} but found {currentVersion} for aggregate {aggregateId}");
            }

            var eventsList = events.ToList();
            var version = expectedVersion;

            foreach (var @event in eventsList)
            {
                version++;
                await SaveEventAsync(connection, transaction, aggregateId, @event, version, cancellationToken);
            }

            await transaction.CommitAsync(cancellationToken);
            
            _logger.LogInformation("Saved {EventCount} events for aggregate {AggregateId}", 
                                 eventsList.Count, aggregateId);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<IEnumerable<IDomainEvent>> GetEventsAsync(Guid aggregateId, 
                                                              int fromVersion = 0, 
                                                              CancellationToken cancellationToken = default)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        
        const string sql = @"
            SELECT EventId, AggregateId, EventType, EventData, Metadata, Version, Timestamp
            FROM EventStore 
            WHERE AggregateId = @AggregateId AND Version > @FromVersion
            ORDER BY Version";

        using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@AggregateId", aggregateId);
        command.Parameters.AddWithValue("@FromVersion", fromVersion);

        var events = new List<IDomainEvent>();
        
        using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var eventType = reader.GetString("EventType");
            var eventData = reader.GetString("EventData");
            var metadata = reader.GetString("Metadata");
            
            var @event = await _serializer.DeserializeAsync(eventType, eventData, metadata);
            events.Add(@event);
        }

        return events;
    }

    private async Task SaveEventAsync(SqlConnection connection, SqlTransaction transaction, 
                                     Guid aggregateId, IDomainEvent @event, int version,
                                     CancellationToken cancellationToken)
    {
        const string sql = @"
            INSERT INTO EventStore (EventId, AggregateId, EventType, EventData, Metadata, Version, Timestamp)
            VALUES (@EventId, @AggregateId, @EventType, @EventData, @Metadata, @Version, @Timestamp)";

        var eventData = await _serializer.SerializeAsync(@event);
        var metadata = CreateMetadata(@event, aggregateId, version);

        using var command = new SqlCommand(sql, connection, transaction);
        command.Parameters.AddWithValue("@EventId", @event.EventId);
        command.Parameters.AddWithValue("@AggregateId", aggregateId);
        command.Parameters.AddWithValue("@EventType", @event.GetType().AssemblyQualifiedName);
        command.Parameters.AddWithValue("@EventData", eventData);
        command.Parameters.AddWithValue("@Metadata", metadata);
        command.Parameters.AddWithValue("@Version", version);
        command.Parameters.AddWithValue("@Timestamp", @event.OccurredOn);

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task<int> GetCurrentVersionAsync(SqlConnection connection, SqlTransaction transaction, 
                                                  Guid aggregateId)
    {
        const string sql = @"
            SELECT ISNULL(MAX(Version), 0) 
            FROM EventStore 
            WHERE AggregateId = @AggregateId";

        using var command = new SqlCommand(sql, connection, transaction);
        command.Parameters.AddWithValue("@AggregateId", aggregateId);
        
        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }
}
\`\`\`

## イベントソーシング対応のアグリゲート

### イベントソーシング用の基底クラス

\`\`\`csharp
public abstract class EventSourcedAggregateRoot<TId> : AggregateRoot<TId>
{
    private readonly List<IDomainEvent> _changes = new();
    
    public int Version { get; protected set; } = -1;
    public IReadOnlyList<IDomainEvent> UncommittedChanges => _changes.AsReadOnly();

    protected EventSourcedAggregateRoot() { }

    protected EventSourcedAggregateRoot(TId id) : base(id) { }

    // イベントからアグリゲートを復元
    public void LoadFromHistory(IEnumerable<IDomainEvent> history)
    {
        foreach (var e in history)
        {
            ApplyChange(e, false);
            Version++;
        }
    }

    // 新しいイベントを適用
    protected void ApplyChange(IDomainEvent @event)
    {
        ApplyChange(@event, true);
    }

    private void ApplyChange(IDomainEvent @event, bool isNew)
    {
        // イベントをアグリゲートの状態に適用
        ((dynamic)this).Apply((dynamic)@event);
        
        if (isNew)
        {
            _changes.Add(@event);
        }
    }

    // 変更をコミット
    public void MarkChangesAsCommitted()
    {
        Version += _changes.Count;
        _changes.Clear();
    }

    // 未コミットの変更をクリア
    public void ClearChanges()
    {
        _changes.Clear();
    }
}
\`\`\`

### 銀行口座アグリゲートの実装例

\`\`\`csharp
public class BankAccount : EventSourcedAggregateRoot<AccountId>
{
    public Money Balance { get; private set; }
    public string AccountNumber { get; private set; }
    public string OwnerName { get; private set; }
    public AccountStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private BankAccount() { } // for reconstruction

    public BankAccount(AccountId id, string accountNumber, string ownerName, Money initialDeposit)
    {
        if (initialDeposit.Amount <= 0)
            throw new ArgumentException("Initial deposit must be positive", nameof(initialDeposit));

        ApplyChange(new AccountOpened(id, accountNumber, ownerName, initialDeposit, DateTime.UtcNow));
    }

    public void Deposit(Money amount, string description)
    {
        if (Status != AccountStatus.Active)
            throw new InvalidOperationException("Cannot deposit to inactive account");
        
        if (amount.Amount <= 0)
            throw new ArgumentException("Deposit amount must be positive", nameof(amount));

        ApplyChange(new MoneyDeposited(Id, amount, description, DateTime.UtcNow));
    }

    public void Withdraw(Money amount, string description)
    {
        if (Status != AccountStatus.Active)
            throw new InvalidOperationException("Cannot withdraw from inactive account");
        
        if (amount.Amount <= 0)
            throw new ArgumentException("Withdrawal amount must be positive", nameof(amount));
        
        if (Balance.Amount < amount.Amount)
            throw new InsufficientFundsException("Insufficient funds for withdrawal");

        ApplyChange(new MoneyWithdrawn(Id, amount, description, DateTime.UtcNow));
    }

    public void Close(string reason)
    {
        if (Status != AccountStatus.Active)
            throw new InvalidOperationException("Can only close active accounts");

        if (Balance.Amount > 0)
            throw new InvalidOperationException("Cannot close account with positive balance");

        ApplyChange(new AccountClosed(Id, reason, DateTime.UtcNow));
    }

    // イベントハンドラー（状態を更新）
    private void Apply(AccountOpened @event)
    {
        Id = @event.AccountId;
        AccountNumber = @event.AccountNumber;
        OwnerName = @event.OwnerName;
        Balance = @event.InitialDeposit;
        Status = AccountStatus.Active;
        CreatedAt = @event.OccurredOn;
    }

    private void Apply(MoneyDeposited @event)
    {
        Balance = Balance.Add(@event.Amount);
    }

    private void Apply(MoneyWithdrawn @event)
    {
        Balance = Balance.Subtract(@event.Amount);
    }

    private void Apply(AccountClosed @event)
    {
        Status = AccountStatus.Closed;
    }
}

// ドメインイベント定義
public record AccountOpened(AccountId AccountId, string AccountNumber, string OwnerName, 
                           Money InitialDeposit, DateTime OccurredOn) : DomainEvent(OccurredOn);

public record MoneyDeposited(AccountId AccountId, Money Amount, string Description, 
                            DateTime OccurredOn) : DomainEvent(OccurredOn);

public record MoneyWithdrawn(AccountId AccountId, Money Amount, string Description, 
                            DateTime OccurredOn) : DomainEvent(OccurredOn);

public record AccountClosed(AccountId AccountId, string Reason, 
                           DateTime OccurredOn) : DomainEvent(OccurredOn);

public enum AccountStatus { Active, Closed, Suspended }
\`\`\`

## イベントソーシング対応のリポジトリ

### イベントソーシングリポジトリの実装

\`\`\`csharp
public interface IEventSourcedRepository<T, TId> 
    where T : EventSourcedAggregateRoot<TId>
{
    Task<T> GetByIdAsync(TId id, CancellationToken cancellationToken = default);
    Task SaveAsync(T aggregate, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(TId id, CancellationToken cancellationToken = default);
}

public class EventSourcedRepository<T, TId> : IEventSourcedRepository<T, TId>
    where T : EventSourcedAggregateRoot<TId>, new()
{
    private readonly IEventStore _eventStore;
    private readonly ILogger<EventSourcedRepository<T, TId>> _logger;

    public EventSourcedRepository(IEventStore eventStore, ILogger<EventSourcedRepository<T, TId>> logger)
    {
        _eventStore = eventStore ?? throw new ArgumentNullException(nameof(eventStore));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<T> GetByIdAsync(TId id, CancellationToken cancellationToken = default)
    {
        var aggregateId = GetAggregateId(id);
        var events = await _eventStore.GetEventsAsync(aggregateId, cancellationToken: cancellationToken);
        
        if (!events.Any())
        {
            return null;
        }

        var aggregate = new T();
        aggregate.LoadFromHistory(events);
        
        _logger.LogDebug("Loaded aggregate {AggregateType} with ID {AggregateId} from {EventCount} events",
                        typeof(T).Name, id, events.Count());
        
        return aggregate;
    }

    public async Task SaveAsync(T aggregate, CancellationToken cancellationToken = default)
    {
        if (aggregate == null) throw new ArgumentNullException(nameof(aggregate));

        var changes = aggregate.UncommittedChanges;
        if (!changes.Any()) return;

        var aggregateId = GetAggregateId(aggregate.Id);
        
        try
        {
            await _eventStore.SaveEventsAsync<T>(aggregateId, changes, aggregate.Version, cancellationToken);
            aggregate.MarkChangesAsCommitted();
            
            _logger.LogDebug("Saved {EventCount} events for aggregate {AggregateType} with ID {AggregateId}",
                           changes.Count, typeof(T).Name, aggregate.Id);
        }
        catch (ConcurrencyException)
        {
            _logger.LogWarning("Concurrency conflict when saving aggregate {AggregateType} with ID {AggregateId}",
                             typeof(T).Name, aggregate.Id);
            throw;
        }
    }

    public async Task<bool> ExistsAsync(TId id, CancellationToken cancellationToken = default)
    {
        var aggregateId = GetAggregateId(id);
        var events = await _eventStore.GetEventsAsync(aggregateId, 0, cancellationToken);
        return events.Any();
    }

    private Guid GetAggregateId(TId id)
    {
        // TIdからGuidへの変換ロジック
        if (id is Guid guid)
            return guid;
        
        if (id is StronglyTypedId<Guid> strongId)
            return strongId.Value;
            
        throw new InvalidOperationException($"Cannot convert {typeof(TId)} to Guid");
    }
}
\`\`\`

## プロジェクション（Projection）とリードモデル

### プロジェクションビルダー

\`\`\`csharp
public interface IProjectionBuilder<T>
{
    Task HandleAsync(IDomainEvent @event, CancellationToken cancellationToken = default);
    Task RebuildAsync(CancellationToken cancellationToken = default);
}

public class AccountSummaryProjectionBuilder : IProjectionBuilder<AccountSummary>
{
    private readonly IAccountSummaryRepository _repository;
    private readonly IEventStore _eventStore;
    private readonly ILogger<AccountSummaryProjectionBuilder> _logger;

    public AccountSummaryProjectionBuilder(IAccountSummaryRepository repository, 
                                         IEventStore eventStore,
                                         ILogger<AccountSummaryProjectionBuilder> logger)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _eventStore = eventStore ?? throw new ArgumentNullException(nameof(eventStore));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task HandleAsync(IDomainEvent @event, CancellationToken cancellationToken = default)
    {
        switch (@event)
        {
            case AccountOpened accountOpened:
                await HandleAccountOpenedAsync(accountOpened, cancellationToken);
                break;
                
            case MoneyDeposited moneyDeposited:
                await HandleMoneyDepositedAsync(moneyDeposited, cancellationToken);
                break;
                
            case MoneyWithdrawn moneyWithdrawn:
                await HandleMoneyWithdrawnAsync(moneyWithdrawn, cancellationToken);
                break;
                
            case AccountClosed accountClosed:
                await HandleAccountClosedAsync(accountClosed, cancellationToken);
                break;
        }
    }

    private async Task HandleAccountOpenedAsync(AccountOpened @event, CancellationToken cancellationToken)
    {
        var summary = new AccountSummary
        {
            AccountId = @event.AccountId.Value,
            AccountNumber = @event.AccountNumber,
            OwnerName = @event.OwnerName,
            Balance = @event.InitialDeposit.Amount,
            Status = "Active",
            CreatedAt = @event.OccurredOn,
            TransactionCount = 1,
            LastTransactionDate = @event.OccurredOn
        };

        await _repository.SaveAsync(summary, cancellationToken);
        _logger.LogDebug("Created account summary for account {AccountId}", @event.AccountId);
    }

    private async Task HandleMoneyDepositedAsync(MoneyDeposited @event, CancellationToken cancellationToken)
    {
        var summary = await _repository.GetByAccountIdAsync(@event.AccountId.Value, cancellationToken);
        if (summary != null)
        {
            summary.Balance += @event.Amount.Amount;
            summary.TransactionCount++;
            summary.LastTransactionDate = @event.OccurredOn;
            
            await _repository.SaveAsync(summary, cancellationToken);
            _logger.LogDebug("Updated account summary for deposit: {AccountId}, Amount: {Amount}", 
                           @event.AccountId, @event.Amount.Amount);
        }
    }

    public async Task RebuildAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting account summary projection rebuild");
        
        await _repository.ClearAllAsync(cancellationToken);
        
        var events = await _eventStore.GetAllEventsAsync(cancellationToken: cancellationToken);
        var accountEvents = events.OfType<AccountOpened>()
                                 .Concat(events.OfType<MoneyDeposited>())
                                 .Concat(events.OfType<MoneyWithdrawn>())
                                 .Concat(events.OfType<AccountClosed>())
                                 .OrderBy(e => e.OccurredOn);

        foreach (var @event in accountEvents)
        {
            await HandleAsync(@event, cancellationToken);
        }
        
        _logger.LogInformation("Completed account summary projection rebuild");
    }
}

// リードモデル
public class AccountSummary
{
    public Guid AccountId { get; set; }
    public string AccountNumber { get; set; }
    public string OwnerName { get; set; }
    public decimal Balance { get; set; }
    public string Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TransactionCount { get; set; }
    public DateTime LastTransactionDate { get; set; }
}
\`\`\`

## イベントソーシングの利点と課題

### 利点

1. **完全な監査証跡**: すべての変更が記録される
2. **時間を遡った分析**: 過去の任意の時点の状態を再現可能
3. **デバッグの容易さ**: 問題の原因を正確に特定可能
4. **拡張性**: 新しいプロジェクションを後から追加可能
5. **イベント駆動アーキテクチャ**: 他のシステムとの疎結合な統合

### 課題

1. **複雑性の増加**: アーキテクチャが複雑になる
2. **クエリの複雑さ**: 状態の再構築が必要
3. **スキーマ進化**: イベント構造の変更が困難
4. **パフォーマンス**: 大量のイベントの処理
5. **最終的整合性**: プロジェクションの遅延

## 実践課題

### 課題1: イベントストアの拡張

現在のイベントストア実装に以下の機能を追加してください：

1. スナップショット機能（一定間隔でアグリゲートの状態を保存）
2. イベントのバージョニング機能
3. イベントの暗号化機能

### 課題2: プロジェクション管理システム

複数のプロジェクションを管理し、以下の機能を持つシステムを実装してください：

1. プロジェクションの進捗追跡
2. エラー時の自動リトライ機能
3. プロジェクションの並列実行

### 課題3: イベント移行機能

古いイベント形式から新しい形式への移行機能を実装してください：

1. イベントのバージョンアップ機能
2. 後方互換性の維持
3. 段階的な移行プロセス

これらの課題を通じて、実際のプロダクション環境で使用できるイベントソーシングシステムの実装経験を積むことができます。
`,
  codeExamples: [
    {
      id: 'event-store-interface',
      title: 'イベントストアインターフェース',
      language: 'csharp',
      code: `public interface IEventStore
{
    Task SaveEventsAsync<T>(Guid aggregateId, IEnumerable<IDomainEvent> events, 
                           int expectedVersion, CancellationToken cancellationToken = default);
    
    Task<IEnumerable<IDomainEvent>> GetEventsAsync(Guid aggregateId, 
                                                  int fromVersion = 0, 
                                                  CancellationToken cancellationToken = default);
}`,
      description: 'イベントストアの基本インターフェース定義'
    },
    {
      id: 'event-sourced-aggregate',
      title: 'イベントソーシング対応アグリゲート',
      language: 'csharp',
      code: `public abstract class EventSourcedAggregateRoot<TId> : AggregateRoot<TId>
{
    private readonly List<IDomainEvent> _changes = new();
    
    public int Version { get; protected set; } = -1;
    public IReadOnlyList<IDomainEvent> UncommittedChanges => _changes.AsReadOnly();

    public void LoadFromHistory(IEnumerable<IDomainEvent> history)
    {
        foreach (var e in history)
        {
            ApplyChange(e, false);
            Version++;
        }
    }

    protected void ApplyChange(IDomainEvent @event)
    {
        ApplyChange(@event, true);
    }

    private void ApplyChange(IDomainEvent @event, bool isNew)
    {
        ((dynamic)this).Apply((dynamic)@event);
        
        if (isNew)
        {
            _changes.Add(@event);
        }
    }
}`,
      description: 'イベントソーシング対応の基底アグリゲートクラス'
    },
    {
      id: 'bank-account-aggregate',
      title: '銀行口座アグリゲート',
      language: 'csharp',
      code: `public class BankAccount : EventSourcedAggregateRoot<AccountId>
{
    public Money Balance { get; private set; }
    public string AccountNumber { get; private set; }
    public AccountStatus Status { get; private set; }

    public BankAccount(AccountId id, string accountNumber, string ownerName, Money initialDeposit)
    {
        ApplyChange(new AccountOpened(id, accountNumber, ownerName, initialDeposit, DateTime.UtcNow));
    }

    public void Deposit(Money amount, string description)
    {
        if (Status != AccountStatus.Active)
            throw new InvalidOperationException("Cannot deposit to inactive account");
        
        ApplyChange(new MoneyDeposited(Id, amount, description, DateTime.UtcNow));
    }

    private void Apply(AccountOpened @event)
    {
        Id = @event.AccountId;
        AccountNumber = @event.AccountNumber;
        Balance = @event.InitialDeposit;
        Status = AccountStatus.Active;
    }

    private void Apply(MoneyDeposited @event)
    {
        Balance = Balance.Add(@event.Amount);
    }
}`,
      description: 'イベントソーシングを使用した銀行口座アグリゲートの実装'
    },
    {
      id: 'projection-builder',
      title: 'プロジェクションビルダー',
      language: 'csharp',
      code: `public class AccountSummaryProjectionBuilder : IProjectionBuilder<AccountSummary>
{
    private readonly IAccountSummaryRepository _repository;

    public async Task HandleAsync(IDomainEvent @event, CancellationToken cancellationToken = default)
    {
        switch (@event)
        {
            case AccountOpened accountOpened:
                await HandleAccountOpenedAsync(accountOpened, cancellationToken);
                break;
                
            case MoneyDeposited moneyDeposited:
                await HandleMoneyDepositedAsync(moneyDeposited, cancellationToken);
                break;
        }
    }

    private async Task HandleAccountOpenedAsync(AccountOpened @event, CancellationToken cancellationToken)
    {
        var summary = new AccountSummary
        {
            AccountId = @event.AccountId.Value,
            AccountNumber = @event.AccountNumber,
            Balance = @event.InitialDeposit.Amount,
            CreatedAt = @event.OccurredOn
        };

        await _repository.SaveAsync(summary, cancellationToken);
    }
}`,
      description: 'イベントからリードモデルを構築するプロジェクションビルダー'
    },
    {
      id: 'event-sourced-repository',
      title: 'イベントソーシングリポジトリ',
      language: 'csharp',
      code: `public class EventSourcedRepository<T, TId> : IEventSourcedRepository<T, TId>
    where T : EventSourcedAggregateRoot<TId>, new()
{
    private readonly IEventStore _eventStore;

    public async Task<T> GetByIdAsync(TId id, CancellationToken cancellationToken = default)
    {
        var aggregateId = GetAggregateId(id);
        var events = await _eventStore.GetEventsAsync(aggregateId, cancellationToken: cancellationToken);
        
        if (!events.Any())
        {
            return null;
        }

        var aggregate = new T();
        aggregate.LoadFromHistory(events);
        
        return aggregate;
    }

    public async Task SaveAsync(T aggregate, CancellationToken cancellationToken = default)
    {
        var changes = aggregate.UncommittedChanges;
        if (!changes.Any()) return;

        var aggregateId = GetAggregateId(aggregate.Id);
        
        await _eventStore.SaveEventsAsync<T>(aggregateId, changes, aggregate.Version, cancellationToken);
        aggregate.MarkChangesAsCommitted();
    }
}`,
      description: 'イベントストアを使用したリポジトリの実装'
    }
  ],
  exercises: [
    {
      id: 'implement-snapshot',
      title: 'スナップショット機能の実装',
      description: 'パフォーマンス向上のため、アグリゲートの状態を定期的に保存するスナップショット機能を実装してください。',
      difficulty: 'hard',
      estimatedTime: 45,
      starterCode: `public interface ISnapshotStore
{
    // TODO: スナップショットの保存・取得メソッドを定義
}

public class SnapshotStore : ISnapshotStore
{
    // TODO: スナップショット機能を実装
}`,
      solution: `public interface ISnapshotStore
{
    Task SaveSnapshotAsync<T>(T aggregate, int version, CancellationToken cancellationToken = default);
    Task<T> GetSnapshotAsync<T>(Guid aggregateId, CancellationToken cancellationToken = default);
}

public class SnapshotStore : ISnapshotStore
{
    private readonly string _connectionString;
    private readonly ISnapshotSerializer _serializer;

    public async Task SaveSnapshotAsync<T>(T aggregate, int version, CancellationToken cancellationToken = default)
    {
        // スナップショットをシリアライズして保存
        var data = await _serializer.SerializeAsync(aggregate);
        // データベースに保存...
    }

    public async Task<T> GetSnapshotAsync<T>(Guid aggregateId, CancellationToken cancellationToken = default)
    {
        // データベースから最新のスナップショットを取得してデシリアライズ
        // return deserialized snapshot
    }
}`,
      hints: [
        'スナップショットは一定間隔（例：100イベントごと）で作成すると効率的です',
        'スナップショットのバージョン管理を忘れずに行ってください',
        'スナップショット取得時は、その後のイベントも適用する必要があります'
      ]
    },
    {
      id: 'projection-manager',
      title: 'プロジェクション管理システム',
      description: '複数のプロジェクションを管理し、エラーハンドリングとリトライ機能を持つシステムを実装してください。',
      difficulty: 'hard',
      estimatedTime: 60,
      starterCode: `public interface IProjectionManager
{
    // TODO: プロジェクション管理のインターフェースを定義
}

public class ProjectionManager : IProjectionManager
{
    // TODO: プロジェクション管理システムを実装
}`,
      solution: `public interface IProjectionManager
{
    Task RegisterProjectionAsync<T>(IProjectionBuilder<T> builder);
    Task ProcessEventAsync(IDomainEvent @event, CancellationToken cancellationToken = default);
    Task RebuildAllProjectionsAsync(CancellationToken cancellationToken = default);
}

public class ProjectionManager : IProjectionManager
{
    private readonly List<IProjectionBuilder<object>> _builders = new();
    private readonly ILogger<ProjectionManager> _logger;

    public async Task ProcessEventAsync(IDomainEvent @event, CancellationToken cancellationToken = default)
    {
        var tasks = _builders.Select(async builder =>
        {
            try
            {
                await builder.HandleAsync(@event, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing event in projection");
                // リトライロジック
            }
        });

        await Task.WhenAll(tasks);
    }
}`,
      hints: [
        'プロジェクションの進捗を追跡するためのテーブルを用意してください',
        'エラー時の指数バックオフによるリトライを実装してください',
        'デッドレターキューでハンドリングできないイベントを管理してください'
      ]
    },
    {
      id: 'event-migration',
      title: 'イベント移行システム',
      description: '古いイベント形式から新しい形式への移行を安全に行うシステムを実装してください。',
      difficulty: 'hard',
      estimatedTime: 50,
      starterCode: `public interface IEventMigrator
{
    // TODO: イベント移行のインターフェースを定義
}

public class EventMigrator : IEventMigrator
{
    // TODO: イベント移行システムを実装
}`,
      solution: `public interface IEventMigrator
{
    Task MigrateEventAsync(IDomainEvent oldEvent, CancellationToken cancellationToken = default);
    Task<bool> CanMigrateAsync(Type eventType);
}

public class EventMigrator : IEventMigrator
{
    private readonly Dictionary<Type, Func<IDomainEvent, IDomainEvent>> _migrations = new();

    public EventMigrator()
    {
        RegisterMigration<OldAccountOpened, AccountOpened>(old => 
            new AccountOpened(old.Id, old.Number, old.Owner, old.Amount, old.Date));
    }

    public async Task MigrateEventAsync(IDomainEvent oldEvent, CancellationToken cancellationToken = default)
    {
        if (_migrations.TryGetValue(oldEvent.GetType(), out var migration))
        {
            var newEvent = migration(oldEvent);
            // 新しいイベントを保存し、古いイベントを無効化
        }
    }
}`,
      hints: [
        'イベントのバージョニングスキームを設計してください',
        '移行は段階的に行い、ロールバック可能にしてください',
        '古いイベント形式も一定期間保持することを考慮してください'
      ]
    }
  ]
};