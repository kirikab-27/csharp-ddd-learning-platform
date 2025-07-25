import type { Lesson } from '../../../../features/learning/types';

export const resourceManagementLesson: Lesson = {
  id: 'resource-management',
  moduleId: 'error-resource-management',
  title: 'リソース管理 - メモリとリソースの効率的な使用',
  description: 'usingステートメント、IDisposableパターン、メモリ管理の最適化など、効率的なリソース管理手法を学習します',
  content: `
# リソース管理 (Resource Management)

適切なリソース管理は、高性能で安定したアプリケーションの基盤です。C#では、ガベージコレクションがメモリ管理を自動化しますが、ファイル、データベース接続、ネットワークリソースなどは明示的な管理が必要です。

## IDisposableパターン

### 基本的なIDisposableの実装

\`\`\`csharp
public class BasicResourceManager : IDisposable
{
    private FileStream _fileStream;
    private bool _disposed = false;
    
    public BasicResourceManager(string filePath)
    {
        _fileStream = new FileStream(filePath, FileMode.OpenOrCreate);
    }
    
    public void WriteData(string data)
    {
        if (_disposed)
            throw new ObjectDisposedException(nameof(BasicResourceManager));
            
        var bytes = System.Text.Encoding.UTF8.GetBytes(data);
        _fileStream.Write(bytes);
    }
    
    // IDisposableの実装
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this); // ファイナライザの実行を抑制
    }
    
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                // マネージドリソースの解放
                _fileStream?.Dispose();
            }
            
            // アンマネージドリソースの解放はここで行う
            
            _disposed = true;
        }
    }
    
    // ファイナライザ（デストラクタ）
    ~BasicResourceManager()
    {
        Dispose(false);
    }
}
\`\`\`

### usingステートメント

\`\`\`csharp
public class ResourceUsageExamples
{
    // 基本的なusingステートメント
    public void BasicUsingExample()
    {
        using (var resource = new BasicResourceManager("data.txt"))
        {
            resource.WriteData("Hello, World!");
        } // ここで自動的にDispose()が呼ばれる
    }
    
    // using宣言（C# 8.0以降）
    public void UsingDeclarationExample()
    {
        using var resource = new BasicResourceManager("data.txt");
        resource.WriteData("Hello, World!");
        // メソッド終了時に自動的にDispose()が呼ばれる
    }
    
    // 複数リソースの管理
    public void MultipleResourcesExample()
    {
        using var file1 = new FileStream("input.txt", FileMode.Open);
        using var file2 = new FileStream("output.txt", FileMode.Create);
        using var reader = new StreamReader(file1);
        using var writer = new StreamWriter(file2);
        
        string line;
        while ((line = reader.ReadLine()) != null)
        {
            writer.WriteLine(line.ToUpper());
        }
        // 逆順（writer → reader → file2 → file1）でDispose()される
    }
    
    // 例外安全性
    public async Task SafeAsyncResourceHandling()
    {
        try
        {
            using var httpClient = new HttpClient();
            using var response = await httpClient.GetAsync("https://api.example.com/data");
            using var stream = await response.Content.ReadAsStreamAsync();
            using var reader = new StreamReader(stream);
            
            var content = await reader.ReadToEndAsync();
            ProcessContent(content);
        }
        catch (Exception ex)
        {
            // 例外が発生してもusingによりリソースは適切に解放される
            Console.WriteLine($"エラーが発生しましたが、リソースは安全に解放されました: {ex.Message}");
        }
    }
    
    private void ProcessContent(string content) { /* 処理内容 */ }
}
\`\`\`

## DDDでのリソース管理

### リポジトリパターンでのリソース管理

\`\`\`csharp
// リポジトリでのデータベース接続管理
public class CustomerRepository : ICustomerRepository, IDisposable
{
    private readonly IDbConnection _connection;
    private bool _disposed = false;
    
    public CustomerRepository(string connectionString)
    {
        _connection = new SqlConnection(connectionString);
        _connection.Open();
    }
    
    public async Task<Customer> GetByIdAsync(int id)
    {
        if (_disposed)
            throw new ObjectDisposedException(nameof(CustomerRepository));
            
        const string sql = "SELECT * FROM Customers WHERE Id = @Id";
        
        using var command = _connection.CreateCommand();
        command.CommandText = sql;
        command.Parameters.Add(new SqlParameter("@Id", id));
        
        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new Customer
            {
                Id = reader.GetInt32("Id"),
                Name = reader.GetString("Name"),
                Email = reader.GetString("Email")
            };
        }
        
        return null;
    }
    
    public async Task SaveAsync(Customer customer)
    {
        if (_disposed)
            throw new ObjectDisposedException(nameof(CustomerRepository));
            
        const string sql = @"
            INSERT INTO Customers (Name, Email) 
            VALUES (@Name, @Email);
            SELECT CAST(SCOPE_IDENTITY() as int);";
            
        using var command = _connection.CreateCommand();
        command.CommandText = sql;
        command.Parameters.Add(new SqlParameter("@Name", customer.Name));
        command.Parameters.Add(new SqlParameter("@Email", customer.Email));
        
        customer.Id = (int)await command.ExecuteScalarAsync();
    }
    
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }
    
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                _connection?.Dispose();
            }
            _disposed = true;
        }
    }
}

// 使用例
public class CustomerService
{
    private readonly string _connectionString;
    
    public CustomerService(string connectionString)
    {
        _connectionString = connectionString;
    }
    
    public async Task<Customer> ProcessCustomerAsync(int customerId)
    {
        using var repository = new CustomerRepository(_connectionString);
        var customer = await repository.GetByIdAsync(customerId);
        
        if (customer == null)
            throw new CustomerNotFoundException(customerId);
            
        // ビジネスロジックの処理
        customer.UpdateLastAccessTime();
        await repository.SaveAsync(customer);
        
        return customer;
    }
}
\`\`\`

### Unit of Workパターンでのリソース管理

\`\`\`csharp
public interface IUnitOfWork : IDisposable
{
    ICustomerRepository Customers { get; }
    IOrderRepository Orders { get; }
    Task<int> SaveChangesAsync();
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}

public class DatabaseUnitOfWork : IUnitOfWork
{
    private readonly IDbConnection _connection;
    private IDbTransaction _transaction;
    private bool _disposed = false;
    
    private ICustomerRepository _customers;
    private IOrderRepository _orders;
    
    public DatabaseUnitOfWork(string connectionString)
    {
        _connection = new SqlConnection(connectionString);
        _connection.Open();
    }
    
    public ICustomerRepository Customers => 
        _customers ??= new CustomerRepository(_connection, _transaction);
        
    public IOrderRepository Orders => 
        _orders ??= new OrderRepository(_connection, _transaction);
    
    public async Task BeginTransactionAsync()
    {
        if (_transaction != null)
            throw new InvalidOperationException("Transaction already started");
            
        _transaction = _connection.BeginTransaction();
    }
    
    public async Task CommitTransactionAsync()
    {
        if (_transaction == null)
            throw new InvalidOperationException("No transaction to commit");
            
        try
        {
            _transaction.Commit();
        }
        catch
        {
            _transaction.Rollback();
            throw;
        }
        finally
        {
            _transaction.Dispose();
            _transaction = null;
        }
    }
    
    public async Task RollbackTransactionAsync()
    {
        if (_transaction == null)
            return;
            
        _transaction.Rollback();
        _transaction.Dispose();
        _transaction = null;
    }
    
    public async Task<int> SaveChangesAsync()
    {
        // 実装では、変更の追跡とバッチ保存を行う
        return 0; // 変更されたエンティティ数を返す
    }
    
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }
    
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                _transaction?.Dispose();
                _connection?.Dispose();
            }
            _disposed = true;
        }
    }
}

// 使用例
public class OrderService
{
    public async Task ProcessOrderAsync(int customerId, List<OrderItem> items)
    {
        using var unitOfWork = new DatabaseUnitOfWork("connection_string");
        
        try
        {
            await unitOfWork.BeginTransactionAsync();
            
            var customer = await unitOfWork.Customers.GetByIdAsync(customerId);
            if (customer == null)
                throw new CustomerNotFoundException(customerId);
            
            var order = new Order(customer.Id, items);
            await unitOfWork.Orders.SaveAsync(order);
            
            customer.AddOrder(order);
            await unitOfWork.Customers.SaveAsync(customer);
            
            await unitOfWork.CommitTransactionAsync();
        }
        catch
        {
            await unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }
}
\`\`\`

## メモリ管理の最適化

### オブジェクトプールパターン

\`\`\`csharp
public class ObjectPool<T> : IDisposable where T : class, new()
{
    private readonly ConcurrentQueue<T> _objects = new ConcurrentQueue<T>();
    private readonly Func<T> _objectGenerator;
    private readonly Action<T> _resetAction;
    private bool _disposed = false;
    
    public ObjectPool(Func<T> objectGenerator = null, Action<T> resetAction = null)
    {
        _objectGenerator = objectGenerator ?? (() => new T());
        _resetAction = resetAction;
    }
    
    public T Get()
    {
        if (_disposed)
            throw new ObjectDisposedException(nameof(ObjectPool<T>));
            
        if (_objects.TryDequeue(out T item))
        {
            return item;
        }
        
        return _objectGenerator();
    }
    
    public void Return(T item)
    {
        if (_disposed || item == null)
            return;
            
        _resetAction?.Invoke(item);
        _objects.Enqueue(item);
    }
    
    public void Dispose()
    {
        if (!_disposed)
        {
            while (_objects.TryDequeue(out T item))
            {
                if (item is IDisposable disposable)
                {
                    disposable.Dispose();
                }
            }
            _disposed = true;
        }
    }
}

// 使用例：StringBuilder プール
public class StringBuilderPool
{
    private static readonly ObjectPool<StringBuilder> _pool = new ObjectPool<StringBuilder>(
        objectGenerator: () => new StringBuilder(),
        resetAction: sb => sb.Clear()
    );
    
    public static StringBuilder Get() => _pool.Get();
    public static void Return(StringBuilder sb) => _pool.Return(sb);
    
    public static string BuildString(Action<StringBuilder> buildAction)
    {
        var sb = Get();
        try
        {
            buildAction(sb);
            return sb.ToString();
        }
        finally
        {
            Return(sb);
        }
    }
}

// 実用例
public class ReportGenerator
{
    public string GenerateCustomerReport(Customer customer)
    {
        return StringBuilderPool.BuildString(sb =>
        {
            sb.AppendLine($"顧客レポート: {customer.Name}");
            sb.AppendLine($"メール: {customer.Email}");
            sb.AppendLine($"登録日: {customer.RegistrationDate:yyyy/MM/dd}");
            sb.AppendLine($"総購入額: {customer.TotalPurchases:C}");
        });
    }
}
\`\`\`

### ArrayPoolによる配列の再利用

\`\`\`csharp
public class ArrayPoolExample
{
    private static readonly ArrayPool<byte> _arrayPool = ArrayPool<byte>.Shared;
    
    public async Task ProcessLargeDataAsync(Stream inputStream)
    {
        // 配列をプールから借用
        byte[] buffer = _arrayPool.Rent(8192); // 8KB のバッファ
        
        try
        {
            int bytesRead;
            while ((bytesRead = await inputStream.ReadAsync(buffer, 0, buffer.Length)) > 0)
            {
                // データ処理
                ProcessData(buffer.AsSpan(0, bytesRead));
            }
        }
        finally
        {
            // 配列をプールに返却
            _arrayPool.Return(buffer);
        }
    }
    
    private void ProcessData(ReadOnlySpan<byte> data)
    {
        // データ処理のロジック
    }
}
\`\`\`

## 非同期リソース管理

### IAsyncDisposableパターン

\`\`\`csharp
public class AsyncResourceManager : IAsyncDisposable
{
    private readonly HttpClient _httpClient;
    private readonly SemaphoreSlim _semaphore;
    private bool _disposed = false;
    
    public AsyncResourceManager()
    {
        _httpClient = new HttpClient();
        _semaphore = new SemaphoreSlim(1, 1);
    }
    
    public async Task<string> FetchDataAsync(string url)
    {
        if (_disposed)
            throw new ObjectDisposedException(nameof(AsyncResourceManager));
            
        await _semaphore.WaitAsync();
        try
        {
            var response = await _httpClient.GetStringAsync(url);
            return response;
        }
        finally
        {
            _semaphore.Release();
        }
    }
    
    public async ValueTask DisposeAsync()
    {
        if (!_disposed)
        {
            _httpClient?.Dispose();
            _semaphore?.Dispose();
            _disposed = true;
        }
    }
}

// await usingステートメント
public class AsyncUsageExample
{
    public async Task ProcessDataAsync()
    {
        await using var resourceManager = new AsyncResourceManager();
        
        var data1 = await resourceManager.FetchDataAsync("https://api1.example.com");
        var data2 = await resourceManager.FetchDataAsync("https://api2.example.com");
        
        ProcessCombinedData(data1, data2);
        
        // メソッド終了時に自動的にDisposeAsync()が呼ばれる
    }
    
    private void ProcessCombinedData(string data1, string data2) { /* 処理 */ }
}
\`\`\`

## パフォーマンス監視と診断

### リソース使用量の監視

\`\`\`csharp
public class ResourceMonitor : IDisposable
{
    private readonly Timer _timer;
    private readonly PerformanceCounter _memoryCounter;
    private readonly PerformanceCounter _cpuCounter;
    private bool _disposed = false;
    
    public event EventHandler<ResourceUsageEventArgs> ResourceUsageChanged;
    
    public ResourceMonitor()
    {
        _memoryCounter = new PerformanceCounter("Memory", "Available MBytes");
        _cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total");
        
        _timer = new Timer(MonitorResources, null, TimeSpan.Zero, TimeSpan.FromSeconds(5));
    }
    
    private void MonitorResources(object state)
    {
        if (_disposed) return;
        
        try
        {
            var availableMemoryMB = _memoryCounter.NextValue();
            var cpuUsage = _cpuCounter.NextValue();
            var gcMemory = GC.GetTotalMemory(false);
            
            var usage = new ResourceUsageEventArgs
            {
                AvailableMemoryMB = availableMemoryMB,
                CpuUsagePercent = cpuUsage,
                ManagedMemoryBytes = gcMemory,
                Gen0Collections = GC.CollectionCount(0),
                Gen1Collections = GC.CollectionCount(1),
                Gen2Collections = GC.CollectionCount(2),
                Timestamp = DateTime.UtcNow
            };
            
            ResourceUsageChanged?.Invoke(this, usage);
            
            // しきい値チェック
            if (availableMemoryMB < 100) // 100MB未満
            {
                Console.WriteLine($"⚠️ メモリ不足警告: 利用可能メモリ {availableMemoryMB:F1}MB");
                GC.Collect(); // 強制ガベージコレクション
            }
            
            if (cpuUsage > 80) // CPU使用率80%超
            {
                Console.WriteLine($"⚠️ CPU使用率警告: {cpuUsage:F1}%");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"リソース監視エラー: {ex.Message}");
        }
    }
    
    public void Dispose()
    {
        if (!_disposed)
        {
            _timer?.Dispose();
            _memoryCounter?.Dispose();
            _cpuCounter?.Dispose();
            _disposed = true;
        }
    }
}

public class ResourceUsageEventArgs : EventArgs
{
    public float AvailableMemoryMB { get; set; }
    public float CpuUsagePercent { get; set; }
    public long ManagedMemoryBytes { get; set; }
    public int Gen0Collections { get; set; }
    public int Gen1Collections { get; set; }
    public int Gen2Collections { get; set; }
    public DateTime Timestamp { get; set; }
    
    public override string ToString()
    {
        return $"Memory: {ManagedMemoryBytes / 1024 / 1024:F1}MB, " +
               $"Available: {AvailableMemoryMB:F1}MB, " +
               $"CPU: {CpuUsagePercent:F1}%, " +
               $"GC: [{Gen0Collections}, {Gen1Collections}, {Gen2Collections}]";
    }
}
\`\`\`

## ベストプラクティス

### リソース管理のガイドライン

\`\`\`csharp
public class ResourceManagementBestPractices
{
    // 1. Disposableリソースは必ずusingで管理
    public void GoodExample()
    {
        using var fileStream = new FileStream("data.txt", FileMode.Open);
        using var reader = new StreamReader(fileStream);
        
        var content = reader.ReadToEnd();
        ProcessContent(content);
    }
    
    // 2. 長時間保持するリソースはプロパティで管理
    public class ServiceWithManagedResources : IDisposable
    {
        private readonly HttpClient _httpClient;
        private readonly Timer _timer;
        private bool _disposed = false;
        
        public ServiceWithManagedResources()
        {
            _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
            _timer = new Timer(PeriodicTask, null, TimeSpan.Zero, TimeSpan.FromMinutes(1));
        }
        
        private void PeriodicTask(object state)
        {
            if (_disposed) return;
            // 定期的なタスク
        }
        
        public void Dispose()
        {
            if (!_disposed)
            {
                _timer?.Dispose();
                _httpClient?.Dispose();
                _disposed = true;
            }
        }
    }
    
    // 3. 大きなオブジェクトは必要な時だけ生成
    public async Task ProcessLargeDataSetAsync()
    {
        // 悪い例：全データを一度にメモリに読み込み
        // var allData = LoadAllData(); // 数GB のデータ
        
        // 良い例：ストリーミング処理
        await foreach (var chunk in LoadDataChunksAsync())
        {
            ProcessChunk(chunk);
            // チャンクごとにガベージコレクションの対象となる
        }
    }
    
    private async IAsyncEnumerable<DataChunk> LoadDataChunksAsync()
    {
        // データを小さなチャンクに分けて順次読み込み
        yield return new DataChunk();
    }
    
    private void ProcessContent(string content) { }
    private void ProcessChunk(DataChunk chunk) { }
}

public class DataChunk { }
\`\`\`

## まとめ

効率的なリソース管理は、スケーラブルなアプリケーションの基盤です：

- **IDisposableパターン**: アンマネージドリソースの適切な解放
- **usingステートメント**: 例外安全なリソース管理
- **オブジェクトプール**: メモリ割り当ての最適化
- **非同期リソース管理**: IAsyncDisposableによる非同期対応

DDDでは、ドメインオブジェクトのライフサイクル管理と、インフラストラクチャ層でのリソース管理を明確に分離することが重要です。

これでC#中級コースが完了です。LINQ、非同期プログラミング、ジェネリクス、デリゲート、イベント、例外処理、リソース管理の各分野を習得し、DDDでの実践的な活用方法を学習しました。
`,
  codeExamples: [
    {
      id: 'ddd-repository-resource-management',
      title: 'DDDリポジトリでのリソース管理',
      description: 'Unit of WorkパターンとIDisposableを組み合わせた効率的なデータアクセス層の実装',
      language: 'csharp',
      code: `using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;

// === ドメインモデル ===

public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public DateTime RegistrationDate { get; set; }
    public CustomerStatus Status { get; set; }
    
    private readonly List<Order> _orders = new List<Order>();
    public IReadOnlyList<Order> Orders => _orders.AsReadOnly();
    
    public void AddOrder(Order order)
    {
        _orders.Add(order);
    }
}

public class Order
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public OrderStatus Status { get; set; }
    
    private readonly List<OrderItem> _items = new List<OrderItem>();
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();
    
    public Order(int customerId)
    {
        CustomerId = customerId;
        OrderDate = DateTime.UtcNow;
        Status = OrderStatus.Draft;
    }
    
    public void AddItem(OrderItem item)
    {
        _items.Add(item);
        TotalAmount += item.TotalPrice;
    }
}

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice => UnitPrice * Quantity;
    
    public OrderItem(int productId, string productName, decimal unitPrice, int quantity)
    {
        ProductId = productId;
        ProductName = productName;
        UnitPrice = unitPrice;
        Quantity = quantity;
    }
}

public enum CustomerStatus
{
    Active,
    Inactive,
    Suspended
}

public enum OrderStatus
{
    Draft,
    Confirmed,
    Shipped,
    Delivered,
    Cancelled
}

// === リポジトリインターフェース ===

public interface ICustomerRepository : IDisposable
{
    Task<Customer> GetByIdAsync(int id);
    Task<Customer> GetByEmailAsync(string email);
    Task<IEnumerable<Customer>> GetAllActiveAsync();
    Task SaveAsync(Customer customer);
    Task DeleteAsync(int id);
}

public interface IOrderRepository : IDisposable
{
    Task<Order> GetByIdAsync(int id);
    Task<IEnumerable<Order>> GetByCustomerIdAsync(int customerId);
    Task<IEnumerable<Order>> GetOrdersByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task SaveAsync(Order order);
    Task DeleteAsync(int id);
}

// === Unit of Work パターン ===

public interface IUnitOfWork : IDisposable
{
    ICustomerRepository Customers { get; }
    IOrderRepository Orders { get; }
    
    Task BeginTransactionAsync();
    Task CommitAsync();
    Task RollbackAsync();
    Task<int> SaveChangesAsync();
}

public class DatabaseUnitOfWork : IUnitOfWork
{
    private readonly string _connectionString;
    private IDbConnection _connection;
    private IDbTransaction _transaction;
    private bool _disposed = false;
    
    private ICustomerRepository _customers;
    private IOrderRepository _orders;
    
    public DatabaseUnitOfWork(string connectionString)
    {
        _connectionString = connectionString;
    }
    
    // 遅延初期化でリポジトリを提供
    public ICustomerRepository Customers => 
        _customers ??= new CustomerRepository(GetConnection(), _transaction);
        
    public IOrderRepository Orders => 
        _orders ??= new OrderRepository(GetConnection(), _transaction);
    
    private IDbConnection GetConnection()
    {
        if (_connection == null)
        {
            _connection = new SqlConnection(_connectionString);
            _connection.Open();
        }
        return _connection;
    }
    
    public async Task BeginTransactionAsync()
    {
        if (_transaction != null)
            throw new InvalidOperationException("Transaction already in progress");
            
        _transaction = GetConnection().BeginTransaction();
    }
    
    public async Task CommitAsync()
    {
        if (_transaction == null)
            throw new InvalidOperationException("No transaction to commit");
            
        try
        {
            _transaction.Commit();
        }
        catch
        {
            _transaction.Rollback();
            throw;
        }
        finally
        {
            _transaction.Dispose();
            _transaction = null;
        }
    }
    
    public async Task RollbackAsync()
    {
        if (_transaction != null)
        {
            _transaction.Rollback();
            _transaction.Dispose();
            _transaction = null;
        }
    }
    
    public async Task<int> SaveChangesAsync()
    {
        // 実際の実装では、変更追跡機能を使用して
        // バッチで保存処理を実行する
        return 0;
    }
    
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }
    
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                _transaction?.Dispose();
                _connection?.Dispose();
                
                // リポジトリもDisposeする
                _customers?.Dispose();
                _orders?.Dispose();
            }
            _disposed = true;
        }
    }
}

// === リポジトリの実装 ===

public class CustomerRepository : ICustomerRepository
{
    private readonly IDbConnection _connection;
    private readonly IDbTransaction _transaction;
    private bool _disposed = false;
    
    public CustomerRepository(IDbConnection connection, IDbTransaction transaction = null)
    {
        _connection = connection ?? throw new ArgumentNullException(nameof(connection));
        _transaction = transaction;
    }
    
    public async Task<Customer> GetByIdAsync(int id)
    {
        const string sql = @"
            SELECT Id, Name, Email, RegistrationDate, Status 
            FROM Customers 
            WHERE Id = @Id";
            
        using var command = CreateCommand(sql);
        command.Parameters.Add(new SqlParameter("@Id", id));
        
        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapCustomer(reader);
        }
        
        return null;
    }
    
    public async Task<Customer> GetByEmailAsync(string email)
    {
        const string sql = @"
            SELECT Id, Name, Email, RegistrationDate, Status 
            FROM Customers 
            WHERE Email = @Email";
            
        using var command = CreateCommand(sql);
        command.Parameters.Add(new SqlParameter("@Email", email));
        
        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapCustomer(reader);
        }
        
        return null;
    }
    
    public async Task<IEnumerable<Customer>> GetAllActiveAsync()
    {
        const string sql = @"
            SELECT Id, Name, Email, RegistrationDate, Status 
            FROM Customers 
            WHERE Status = @Status
            ORDER BY Name";
            
        using var command = CreateCommand(sql);
        command.Parameters.Add(new SqlParameter("@Status", (int)CustomerStatus.Active));
        
        var customers = new List<Customer>();
        using var reader = await command.ExecuteReaderAsync();
        
        while (await reader.ReadAsync())
        {
            customers.Add(MapCustomer(reader));
        }
        
        return customers;
    }
    
    public async Task SaveAsync(Customer customer)
    {
        if (customer.Id == 0)
        {
            await InsertCustomerAsync(customer);
        }
        else
        {
            await UpdateCustomerAsync(customer);
        }
    }
    
    private async Task InsertCustomerAsync(Customer customer)
    {
        const string sql = @"
            INSERT INTO Customers (Name, Email, RegistrationDate, Status)
            VALUES (@Name, @Email, @RegistrationDate, @Status);
            SELECT CAST(SCOPE_IDENTITY() as int);";
            
        using var command = CreateCommand(sql);
        AddCustomerParameters(command, customer);
        
        customer.Id = (int)await command.ExecuteScalarAsync();
    }
    
    private async Task UpdateCustomerAsync(Customer customer)
    {
        const string sql = @"
            UPDATE Customers 
            SET Name = @Name, Email = @Email, Status = @Status
            WHERE Id = @Id";
            
        using var command = CreateCommand(sql);
        AddCustomerParameters(command, customer);
        command.Parameters.Add(new SqlParameter("@Id", customer.Id));
        
        await command.ExecuteNonQueryAsync();
    }
    
    public async Task DeleteAsync(int id)
    {
        const string sql = "DELETE FROM Customers WHERE Id = @Id";
        
        using var command = CreateCommand(sql);
        command.Parameters.Add(new SqlParameter("@Id", id));
        
        await command.ExecuteNonQueryAsync();
    }
    
    private IDbCommand CreateCommand(string sql)
    {
        var command = _connection.CreateCommand();
        command.CommandText = sql;
        command.Transaction = _transaction;
        return command;
    }
    
    private static void AddCustomerParameters(IDbCommand command, Customer customer)
    {
        command.Parameters.Add(new SqlParameter("@Name", customer.Name));
        command.Parameters.Add(new SqlParameter("@Email", customer.Email));
        command.Parameters.Add(new SqlParameter("@RegistrationDate", customer.RegistrationDate));
        command.Parameters.Add(new SqlParameter("@Status", (int)customer.Status));
    }
    
    private static Customer MapCustomer(IDataReader reader)
    {
        return new Customer
        {
            Id = reader.GetInt32("Id"),
            Name = reader.GetString("Name"),
            Email = reader.GetString("Email"),
            RegistrationDate = reader.GetDateTime("RegistrationDate"),
            Status = (CustomerStatus)reader.GetInt32("Status")
        };
    }
    
    public void Dispose()
    {
        // 接続とトランザクションはUnitOfWorkで管理されているため、
        // ここでは何もしない
        _disposed = true;
    }
}

public class OrderRepository : IOrderRepository
{
    private readonly IDbConnection _connection;
    private readonly IDbTransaction _transaction;
    private bool _disposed = false;
    
    public OrderRepository(IDbConnection connection, IDbTransaction transaction = null)
    {
        _connection = connection ?? throw new ArgumentNullException(nameof(connection));
        _transaction = transaction;
    }
    
    public async Task<Order> GetByIdAsync(int id)
    {
        const string orderSql = @"
            SELECT Id, CustomerId, OrderDate, TotalAmount, Status 
            FROM Orders 
            WHERE Id = @Id";
            
        const string itemsSql = @"
            SELECT Id, OrderId, ProductId, ProductName, UnitPrice, Quantity
            FROM OrderItems 
            WHERE OrderId = @OrderId";
        
        using var orderCommand = CreateCommand(orderSql);
        orderCommand.Parameters.Add(new SqlParameter("@Id", id));
        
        Order order = null;
        using var orderReader = await orderCommand.ExecuteReaderAsync();
        if (await orderReader.ReadAsync())
        {
            order = MapOrder(orderReader);
        }
        
        if (order != null)
        {
            using var itemsCommand = CreateCommand(itemsSql);
            itemsCommand.Parameters.Add(new SqlParameter("@OrderId", id));
            
            using var itemsReader = await itemsCommand.ExecuteReaderAsync();
            while (await itemsReader.ReadAsync())
            {
                var item = MapOrderItem(itemsReader);
                order.AddItem(item);
            }
        }
        
        return order;
    }
    
    public async Task<IEnumerable<Order>> GetByCustomerIdAsync(int customerId)
    {
        const string sql = @"
            SELECT Id, CustomerId, OrderDate, TotalAmount, Status 
            FROM Orders 
            WHERE CustomerId = @CustomerId
            ORDER BY OrderDate DESC";
            
        using var command = CreateCommand(sql);
        command.Parameters.Add(new SqlParameter("@CustomerId", customerId));
        
        var orders = new List<Order>();
        using var reader = await command.ExecuteReaderAsync();
        
        while (await reader.ReadAsync())
        {
            orders.Add(MapOrder(reader));
        }
        
        return orders;
    }
    
    public async Task<IEnumerable<Order>> GetOrdersByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        const string sql = @"
            SELECT Id, CustomerId, OrderDate, TotalAmount, Status 
            FROM Orders 
            WHERE OrderDate BETWEEN @StartDate AND @EndDate
            ORDER BY OrderDate DESC";
            
        using var command = CreateCommand(sql);
        command.Parameters.Add(new SqlParameter("@StartDate", startDate));
        command.Parameters.Add(new SqlParameter("@EndDate", endDate));
        
        var orders = new List<Order>();
        using var reader = await command.ExecuteReaderAsync();
        
        while (await reader.ReadAsync())
        {
            orders.Add(MapOrder(reader));
        }
        
        return orders;
    }
    
    public async Task SaveAsync(Order order)
    {
        if (order.Id == 0)
        {
            await InsertOrderAsync(order);
        }
        else
        {
            await UpdateOrderAsync(order);
        }
        
        // 注文アイテムの保存
        await SaveOrderItemsAsync(order);
    }
    
    private async Task InsertOrderAsync(Order order)
    {
        const string sql = @"
            INSERT INTO Orders (CustomerId, OrderDate, TotalAmount, Status)
            VALUES (@CustomerId, @OrderDate, @TotalAmount, @Status);
            SELECT CAST(SCOPE_IDENTITY() as int);";
            
        using var command = CreateCommand(sql);
        AddOrderParameters(command, order);
        
        order.Id = (int)await command.ExecuteScalarAsync();
    }
    
    private async Task UpdateOrderAsync(Order order)
    {
        const string sql = @"
            UPDATE Orders 
            SET TotalAmount = @TotalAmount, Status = @Status
            WHERE Id = @Id";
            
        using var command = CreateCommand(sql);
        AddOrderParameters(command, order);
        command.Parameters.Add(new SqlParameter("@Id", order.Id));
        
        await command.ExecuteNonQueryAsync();
    }
    
    private async Task SaveOrderItemsAsync(Order order)
    {
        // 既存のアイテムを削除
        const string deleteSql = "DELETE FROM OrderItems WHERE OrderId = @OrderId";
        using var deleteCommand = CreateCommand(deleteSql);
        deleteCommand.Parameters.Add(new SqlParameter("@OrderId", order.Id));
        await deleteCommand.ExecuteNonQueryAsync();
        
        // 新しいアイテムを挿入
        const string insertSql = @"
            INSERT INTO OrderItems (OrderId, ProductId, ProductName, UnitPrice, Quantity)
            VALUES (@OrderId, @ProductId, @ProductName, @UnitPrice, @Quantity)";
            
        foreach (var item in order.Items)
        {
            using var insertCommand = CreateCommand(insertSql);
            insertCommand.Parameters.Add(new SqlParameter("@OrderId", order.Id));
            insertCommand.Parameters.Add(new SqlParameter("@ProductId", item.ProductId));
            insertCommand.Parameters.Add(new SqlParameter("@ProductName", item.ProductName));
            insertCommand.Parameters.Add(new SqlParameter("@UnitPrice", item.UnitPrice));
            insertCommand.Parameters.Add(new SqlParameter("@Quantity", item.Quantity));
            
            await insertCommand.ExecuteNonQueryAsync();
        }
    }
    
    public async Task DeleteAsync(int id)
    {
        // 関連するOrderItemsも削除
        const string deleteItemsSql = "DELETE FROM OrderItems WHERE OrderId = @OrderId";
        using var deleteItemsCommand = CreateCommand(deleteItemsSql);
        deleteItemsCommand.Parameters.Add(new SqlParameter("@OrderId", id));
        await deleteItemsCommand.ExecuteNonQueryAsync();
        
        const string deleteOrderSql = "DELETE FROM Orders WHERE Id = @Id";
        using var deleteOrderCommand = CreateCommand(deleteOrderSql);
        deleteOrderCommand.Parameters.Add(new SqlParameter("@Id", id));
        await deleteOrderCommand.ExecuteNonQueryAsync();
    }
    
    private IDbCommand CreateCommand(string sql)
    {
        var command = _connection.CreateCommand();
        command.CommandText = sql;
        command.Transaction = _transaction;
        return command;
    }
    
    private static void AddOrderParameters(IDbCommand command, Order order)
    {
        command.Parameters.Add(new SqlParameter("@CustomerId", order.CustomerId));
        command.Parameters.Add(new SqlParameter("@OrderDate", order.OrderDate));
        command.Parameters.Add(new SqlParameter("@TotalAmount", order.TotalAmount));
        command.Parameters.Add(new SqlParameter("@Status", (int)order.Status));
    }
    
    private static Order MapOrder(IDataReader reader)
    {
        var order = new Order(reader.GetInt32("CustomerId"))
        {
            Id = reader.GetInt32("Id"),
            OrderDate = reader.GetDateTime("OrderDate"),
            TotalAmount = reader.GetDecimal("TotalAmount"),
            Status = (OrderStatus)reader.GetInt32("Status")
        };
        
        return order;
    }
    
    private static OrderItem MapOrderItem(IDataReader reader)
    {
        return new OrderItem(
            reader.GetInt32("ProductId"),
            reader.GetString("ProductName"),
            reader.GetDecimal("UnitPrice"),
            reader.GetInt32("Quantity")
        )
        {
            Id = reader.GetInt32("Id"),
            OrderId = reader.GetInt32("OrderId")
        };
    }
    
    public void Dispose()
    {
        _disposed = true;
    }
}

// === アプリケーションサービス ===

public class OrderService
{
    private readonly Func<IUnitOfWork> _unitOfWorkFactory;
    
    public OrderService(Func<IUnitOfWork> unitOfWorkFactory)
    {
        _unitOfWorkFactory = unitOfWorkFactory;
    }
    
    public async Task<Order> CreateOrderAsync(int customerId, List<(int productId, string productName, decimal unitPrice, int quantity)> items)
    {
        using var unitOfWork = _unitOfWorkFactory();
        
        try
        {
            await unitOfWork.BeginTransactionAsync();
            
            // 顧客の存在確認
            var customer = await unitOfWork.Customers.GetByIdAsync(customerId);
            if (customer == null)
                throw new ArgumentException($"Customer with ID {customerId} not found");
            
            // 注文の作成
            var order = new Order(customerId);
            
            foreach (var (productId, productName, unitPrice, quantity) in items)
            {
                var orderItem = new OrderItem(productId, productName, unitPrice, quantity);
                order.AddItem(orderItem);
            }
            
            // 注文の保存
            await unitOfWork.Orders.SaveAsync(order);
            
            // トランザクションのコミット
            await unitOfWork.CommitAsync();
            
            Console.WriteLine($"✅ 注文が作成されました: OrderId={order.Id}, Total={order.TotalAmount:C}");
            return order;
        }
        catch
        {
            await unitOfWork.RollbackAsync();
            throw;
        }
    }
    
    public async Task<Customer> GetCustomerWithOrdersAsync(int customerId)
    {
        using var unitOfWork = _unitOfWorkFactory();
        
        var customer = await unitOfWork.Customers.GetByIdAsync(customerId);
        if (customer == null)
            return null;
        
        var orders = await unitOfWork.Orders.GetByCustomerIdAsync(customerId);
        foreach (var order in orders)
        {
            customer.AddOrder(order);
        }
        
        return customer;
    }
    
    public async Task<IEnumerable<Order>> GetRecentOrdersAsync(int days = 30)
    {
        using var unitOfWork = _unitOfWorkFactory();
        
        var startDate = DateTime.UtcNow.AddDays(-days);
        var endDate = DateTime.UtcNow;
        
        return await unitOfWork.Orders.GetOrdersByDateRangeAsync(startDate, endDate);
    }
}

// === デモプログラム ===

public class Program
{
    private const string ConnectionString = "Server=(localdb)\\\\mssqllocaldb;Database=ECommerceDB;Trusted_Connection=true;";
    
    public static async Task Main()
    {
        Console.WriteLine("=== DDDリソース管理デモ ===\\n");
        
        // Unit of Work ファクトリの設定
        Func<IUnitOfWork> unitOfWorkFactory = () => new DatabaseUnitOfWork(ConnectionString);
        
        var orderService = new OrderService(unitOfWorkFactory);
        
        try
        {
            // シナリオ1: 新規注文の作成
            Console.WriteLine("--- シナリオ1: 新規注文作成 ---");
            var orderItems = new List<(int, string, decimal, int)>
            {
                (1, "ノートPC", 120000m, 1),
                (2, "マウス", 3000m, 2),
                (3, "キーボード", 8000m, 1)
            };
            
            var order = await orderService.CreateOrderAsync(1, orderItems);
            Console.WriteLine($"注文ID: {order.Id}");
            Console.WriteLine($"合計金額: {order.TotalAmount:C}");
            Console.WriteLine($"アイテム数: {order.Items.Count}");
            
            // シナリオ2: 顧客情報と注文履歴の取得
            Console.WriteLine("\\n--- シナリオ2: 顧客情報取得 ---");
            var customerWithOrders = await orderService.GetCustomerWithOrdersAsync(1);
            if (customerWithOrders != null)
            {
                Console.WriteLine($"顧客: {customerWithOrders.Name} ({customerWithOrders.Email})");
                Console.WriteLine($"注文履歴: {customerWithOrders.Orders.Count}件");
                
                foreach (var customerOrder in customerWithOrders.Orders.Take(3))
                {
                    Console.WriteLine($"  注文ID: {customerOrder.Id}, 日付: {customerOrder.OrderDate:yyyy/MM/dd}, 金額: {customerOrder.TotalAmount:C}");
                }
            }
            
            // シナリオ3: 最近の注文一覧
            Console.WriteLine("\\n--- シナリオ3: 最近の注文 ---");
            var recentOrders = await orderService.GetRecentOrdersAsync(30);
            Console.WriteLine($"過去30日間の注文数: {recentOrders.Count()}");
            
            foreach (var recentOrder in recentOrders.Take(5))
            {
                Console.WriteLine($"  注文ID: {recentOrder.Id}, 顧客ID: {recentOrder.CustomerId}, 金額: {recentOrder.TotalAmount:C}");
            }
            
            // シナリオ4: トランザクションロールバックのテスト
            Console.WriteLine("\\n--- シナリオ4: エラーハンドリング ---");
            try
            {
                await orderService.CreateOrderAsync(999, orderItems); // 存在しない顧客ID
            }
            catch (ArgumentException ex)
            {
                Console.WriteLine($"予期されたエラー: {ex.Message}");
                Console.WriteLine("トランザクションが適切にロールバックされました");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ エラーが発生しました: {ex.Message}");
        }
        
        Console.WriteLine("\\n=== デモ完了 ===");
    }
}`
    },
    {
      id: 'object-pool-memory-optimization',
      title: 'オブジェクトプールとメモリ最適化',
      description: 'オブジェクトプール、ArrayPool、リソース監視を組み合わせたメモリ効率的なアプリケーション',
      language: 'csharp',
      code: `using System;
using System.Buffers;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

// === オブジェクトプールの実装 ===

public class ObjectPool<T> : IDisposable where T : class
{
    private readonly ConcurrentQueue<T> _objects = new ConcurrentQueue<T>();
    private readonly Func<T> _objectGenerator;
    private readonly Action<T> _resetAction;
    private readonly int _maxPoolSize;
    private int _currentPoolSize;
    private bool _disposed = false;
    
    public int PoolSize => _currentPoolSize;
    public int MaxPoolSize => _maxPoolSize;
    
    public ObjectPool(Func<T> objectGenerator, Action<T> resetAction = null, int maxPoolSize = 100)
    {
        _objectGenerator = objectGenerator ?? throw new ArgumentNullException(nameof(objectGenerator));
        _resetAction = resetAction;
        _maxPoolSize = maxPoolSize;
    }
    
    public T Get()
    {
        if (_disposed)
            throw new ObjectDisposedException(nameof(ObjectPool<T>));
            
        if (_objects.TryDequeue(out T item))
        {
            Interlocked.Decrement(ref _currentPoolSize);
            return item;
        }
        
        return _objectGenerator();
    }
    
    public void Return(T item)
    {
        if (_disposed || item == null)
            return;
            
        if (_currentPoolSize < _maxPoolSize)
        {
            _resetAction?.Invoke(item);
            _objects.Enqueue(item);
            Interlocked.Increment(ref _currentPoolSize);
        }
        else
        {
            // プールが満杯の場合、Disposableリソースは解放
            if (item is IDisposable disposable)
            {
                disposable.Dispose();
            }
        }
    }
    
    public void Dispose()
    {
        if (!_disposed)
        {
            while (_objects.TryDequeue(out T item))
            {
                if (item is IDisposable disposable)
                {
                    disposable.Dispose();
                }
            }
            _disposed = true;
        }
    }
}

// === プールされるオブジェクトの例 ===

public class PooledStringBuilder : IDisposable
{
    private StringBuilder _stringBuilder;
    private bool _disposed = false;
    
    public PooledStringBuilder()
    {
        _stringBuilder = new StringBuilder();
    }
    
    public PooledStringBuilder Append(string value)
    {
        _stringBuilder.Append(value);
        return this;
    }
    
    public PooledStringBuilder AppendLine(string value = "")
    {
        _stringBuilder.AppendLine(value);
        return this;
    }
    
    public PooledStringBuilder AppendFormat(string format, params object[] args)
    {
        _stringBuilder.AppendFormat(format, args);
        return this;
    }
    
    public override string ToString()
    {
        return _stringBuilder.ToString();
    }
    
    public void Reset()
    {
        _stringBuilder.Clear();
    }
    
    public void Dispose()
    {
        if (!_disposed)
        {
            Reset();
            _disposed = true;
        }
    }
}

public class PooledMemoryStream : IDisposable
{
    private MemoryStream _memoryStream;
    private bool _disposed = false;
    
    public PooledMemoryStream()
    {
        _memoryStream = new MemoryStream();
    }
    
    public Stream Stream => _memoryStream;
    public long Length => _memoryStream.Length;
    public long Position { get => _memoryStream.Position; set => _memoryStream.Position = value; }
    
    public void Write(byte[] buffer, int offset, int count)
    {
        _memoryStream.Write(buffer, offset, count);
    }
    
    public byte[] ToArray()
    {
        return _memoryStream.ToArray();
    }
    
    public void Reset()
    {
        _memoryStream.SetLength(0);
        _memoryStream.Position = 0;
    }
    
    public void Dispose()
    {
        if (!_disposed)
        {
            Reset();
            _disposed = true;
        }
    }
}

// === リソースプールマネージャー ===

public class ResourcePoolManager : IDisposable
{
    private readonly ObjectPool<PooledStringBuilder> _stringBuilderPool;
    private readonly ObjectPool<PooledMemoryStream> _memoryStreamPool;
    private readonly ArrayPool<byte> _byteArrayPool;
    private readonly ArrayPool<char> _charArrayPool;
    
    private long _stringBuilderGets;
    private long _stringBuilderReturns;
    private long _memoryStreamGets;
    private long _memoryStreamReturns;
    private long _byteArrayGets;
    private long _byteArrayReturns;
    
    public ResourcePoolManager()
    {
        _stringBuilderPool = new ObjectPool<PooledStringBuilder>(
            objectGenerator: () => new PooledStringBuilder(),
            resetAction: sb => sb.Reset(),
            maxPoolSize: 50
        );
        
        _memoryStreamPool = new ObjectPool<PooledMemoryStream>(
            objectGenerator: () => new PooledMemoryStream(),
            resetAction: ms => ms.Reset(),
            maxPoolSize: 30
        );
        
        _byteArrayPool = ArrayPool<byte>.Shared;
        _charArrayPool = ArrayPool<char>.Shared;
    }
    
    // StringBuilderプール
    public PooledStringBuilder GetStringBuilder()
    {
        Interlocked.Increment(ref _stringBuilderGets);
        return _stringBuilderPool.Get();
    }
    
    public void ReturnStringBuilder(PooledStringBuilder stringBuilder)
    {
        if (stringBuilder != null)
        {
            Interlocked.Increment(ref _stringBuilderReturns);
            _stringBuilderPool.Return(stringBuilder);
        }
    }
    
    public string BuildString(Action<PooledStringBuilder> buildAction)
    {
        var sb = GetStringBuilder();
        try
        {
            buildAction(sb);
            return sb.ToString();
        }
        finally
        {
            ReturnStringBuilder(sb);
        }
    }
    
    // MemoryStreamプール
    public PooledMemoryStream GetMemoryStream()
    {
        Interlocked.Increment(ref _memoryStreamGets);
        return _memoryStreamPool.Get();
    }
    
    public void ReturnMemoryStream(PooledMemoryStream memoryStream)
    {
        if (memoryStream != null)
        {
            Interlocked.Increment(ref _memoryStreamReturns);
            _memoryStreamPool.Return(memoryStream);
        }
    }
    
    // バイト配列プール
    public byte[] RentByteArray(int minimumLength)
    {
        Interlocked.Increment(ref _byteArrayGets);
        return _byteArrayPool.Rent(minimumLength);
    }
    
    public void ReturnByteArray(byte[] array)
    {
        if (array != null)
        {
            Interlocked.Increment(ref _byteArrayReturns);
            _byteArrayPool.Return(array);
        }
    }
    
    // 文字配列プール
    public char[] RentCharArray(int minimumLength)
    {
        return _charArrayPool.Rent(minimumLength);
    }
    
    public void ReturnCharArray(char[] array)
    {
        if (array != null)
        {
            _charArrayPool.Return(array);
        }
    }
    
    // 統計情報
    public PoolStatistics GetStatistics()
    {
        return new PoolStatistics
        {
            StringBuilderPoolSize = _stringBuilderPool.PoolSize,
            StringBuilderMaxPoolSize = _stringBuilderPool.MaxPoolSize,
            StringBuilderGets = _stringBuilderGets,
            StringBuilderReturns = _stringBuilderReturns,
            
            MemoryStreamPoolSize = _memoryStreamPool.PoolSize,
            MemoryStreamMaxPoolSize = _memoryStreamPool.MaxPoolSize,
            MemoryStreamGets = _memoryStreamGets,
            MemoryStreamReturns = _memoryStreamReturns,
            
            ByteArrayGets = _byteArrayGets,
            ByteArrayReturns = _byteArrayReturns
        };
    }
    
    public void Dispose()
    {
        _stringBuilderPool?.Dispose();
        _memoryStreamPool?.Dispose();
    }
}

public class PoolStatistics
{
    public int StringBuilderPoolSize { get; set; }
    public int StringBuilderMaxPoolSize { get; set; }
    public long StringBuilderGets { get; set; }
    public long StringBuilderReturns { get; set; }
    
    public int MemoryStreamPoolSize { get; set; }
    public int MemoryStreamMaxPoolSize { get; set; }
    public long MemoryStreamGets { get; set; }
    public long MemoryStreamReturns { get; set; }
    
    public long ByteArrayGets { get; set; }
    public long ByteArrayReturns { get; set; }
    
    public double StringBuilderReturnRate => 
        StringBuilderGets > 0 ? (double)StringBuilderReturns / StringBuilderGets * 100 : 0;
        
    public double MemoryStreamReturnRate => 
        MemoryStreamGets > 0 ? (double)MemoryStreamReturns / MemoryStreamGets * 100 : 0;
        
    public double ByteArrayReturnRate => 
        ByteArrayGets > 0 ? (double)ByteArrayReturns / ByteArrayGets * 100 : 0;
}

// === メモリ効率的なデータ処理サービス ===

public class EfficientDataProcessor : IDisposable
{
    private readonly ResourcePoolManager _poolManager;
    private bool _disposed = false;
    
    public EfficientDataProcessor()
    {
        _poolManager = new ResourcePoolManager();
    }
    
    // CSV形式のレポート生成
    public string GenerateCsvReport(IEnumerable<CustomerData> customers)
    {
        return _poolManager.BuildString(sb =>
        {
            sb.AppendLine("ID,Name,Email,TotalPurchases,Status");
            
            foreach (var customer in customers)
            {
                sb.AppendFormat("{0},{1},{2},{3:F2},{4}", 
                    customer.Id, 
                    customer.Name, 
                    customer.Email, 
                    customer.TotalPurchases, 
                    customer.Status);
                sb.AppendLine();
            }
        });
    }
    
    // 大きなファイルの効率的な処理
    public async Task<byte[]> ProcessLargeFileAsync(Stream inputStream)
    {
        using var outputStream = _poolManager.GetMemoryStream();
        
        // 8KBのバッファを借用
        var buffer = _poolManager.RentByteArray(8192);
        
        try
        {
            int bytesRead;
            while ((bytesRead = await inputStream.ReadAsync(buffer, 0, buffer.Length)) > 0)
            {
                // データ変換処理（例：すべてのバイトを大文字に変換）
                for (int i = 0; i < bytesRead; i++)
                {
                    if (buffer[i] >= 97 && buffer[i] <= 122) // a-z
                    {
                        buffer[i] -= 32; // 大文字に変換
                    }
                }
                
                outputStream.Write(buffer, 0, bytesRead);
            }
            
            return outputStream.ToArray();
        }
        finally
        {
            _poolManager.ReturnByteArray(buffer);
            _poolManager.ReturnMemoryStream(outputStream);
        }
    }
    
    // JSON形式のログエントリ生成
    public string GenerateJsonLog(LogLevel level, string message, Dictionary<string, object> properties = null)
    {
        return _poolManager.BuildString(sb =>
        {
            sb.Append("{");
            sb.AppendFormat("\\"timestamp\\": \\"{0:yyyy-MM-ddTHH:mm:ss.fffZ}\\",", DateTime.UtcNow);
            sb.AppendFormat("\\"level\\": \\"{0}\\",", level);
            sb.AppendFormat("\\"message\\": \\"{0}\\"", message.Replace("\\"", "\\\\\\""));
            
            if (properties != null && properties.Any())
            {
                sb.Append(",\\"properties\\": {");
                var propertyPairs = properties.Select(kvp => 
                    $"\\"{kvp.Key}\\": \\"{kvp.Value}\\"");
                sb.Append(string.Join(",", propertyPairs));
                sb.Append("}");
            }
            
            sb.Append("}");
        });
    }
    
    // 並列データ処理
    public async Task<List<ProcessedData>> ProcessDataBatchAsync(IEnumerable<RawData> rawDataBatch)
    {
        var tasks = rawDataBatch.Select(async rawData =>
        {
            return await Task.Run(() =>
            {
                // CPU集約的な処理をプールされたリソースで実行
                var transformedContent = _poolManager.BuildString(sb =>
                {
                    sb.Append("Processed: ");
                    sb.Append(rawData.Content.ToUpper());
                    sb.Append(" [");
                    sb.Append(DateTime.UtcNow.ToString("HH:mm:ss.fff"));
                    sb.Append("]");
                });
                
                return new ProcessedData
                {
                    Id = rawData.Id,
                    ProcessedContent = transformedContent,
                    ProcessedAt = DateTime.UtcNow
                };
            });
        });
        
        return (await Task.WhenAll(tasks)).ToList();
    }
    
    public PoolStatistics GetPoolStatistics()
    {
        return _poolManager.GetStatistics();
    }
    
    public void Dispose()
    {
        if (!_disposed)
        {
            _poolManager?.Dispose();
            _disposed = true;
        }
    }
}

// === データクラス ===

public class CustomerData
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public decimal TotalPurchases { get; set; }
    public string Status { get; set; }
}

public class RawData
{
    public int Id { get; set; }
    public string Content { get; set; }
}

public class ProcessedData
{
    public int Id { get; set; }
    public string ProcessedContent { get; set; }
    public DateTime ProcessedAt { get; set; }
}

public enum LogLevel
{
    Debug,
    Info,
    Warning,
    Error
}

// === パフォーマンス測定ユーティリティ ===

public class PerformanceBenchmark
{
    public static async Task<BenchmarkResult> MeasureAsync(string operationName, Func<Task> operation)
    {
        var stopwatch = Stopwatch.StartNew();
        var startMemory = GC.GetTotalMemory(false);
        var startGen0 = GC.CollectionCount(0);
        var startGen1 = GC.CollectionCount(1);
        var startGen2 = GC.CollectionCount(2);
        
        await operation();
        
        stopwatch.Stop();
        var endMemory = GC.GetTotalMemory(false);
        var endGen0 = GC.CollectionCount(0);
        var endGen1 = GC.CollectionCount(1);
        var endGen2 = GC.CollectionCount(2);
        
        return new BenchmarkResult
        {
            OperationName = operationName,
            ElapsedTime = stopwatch.Elapsed,
            MemoryAllocated = endMemory - startMemory,
            Gen0Collections = endGen0 - startGen0,
            Gen1Collections = endGen1 - startGen1,
            Gen2Collections = endGen2 - startGen2
        };
    }
}

public class BenchmarkResult
{
    public string OperationName { get; set; }
    public TimeSpan ElapsedTime { get; set; }
    public long MemoryAllocated { get; set; }
    public int Gen0Collections { get; set; }
    public int Gen1Collections { get; set; }
    public int Gen2Collections { get; set; }
    
    public override string ToString()
    {
        return $"{OperationName}: {ElapsedTime.TotalMilliseconds:F1}ms, " +
               $"メモリ: {MemoryAllocated / 1024.0:F1}KB, " +
               $"GC: [{Gen0Collections}, {Gen1Collections}, {Gen2Collections}]";
    }
}

// === デモプログラム ===

public class Program
{
    public static async Task Main()
    {
        Console.WriteLine("=== オブジェクトプール＆メモリ最適化デモ ===\\n");
        
        using var processor = new EfficientDataProcessor();
        
        // テストデータの生成
        var customers = GenerateCustomerData(1000);
        var rawDataBatch = GenerateRawData(500);
        
        // ベンチマーク1: CSVレポート生成
        Console.WriteLine("--- ベンチマーク1: CSVレポート生成 ---");
        var csvResult = await PerformanceBenchmark.MeasureAsync("CSV生成", async () =>
        {
            for (int i = 0; i < 100; i++)
            {
                var csv = processor.GenerateCsvReport(customers.Take(100));
                // CSVを使用（ダミー処理）
                _ = csv.Length;
            }
        });
        Console.WriteLine(csvResult);
        
        // ベンチマーク2: 並列データ処理
        Console.WriteLine("\\n--- ベンチマーク2: 並列データ処理 ---");
        var parallelResult = await PerformanceBenchmark.MeasureAsync("並列処理", async () =>
        {
            var processed = await processor.ProcessDataBatchAsync(rawDataBatch);
            Console.WriteLine($"処理済みデータ: {processed.Count}件");
        });
        Console.WriteLine(parallelResult);
        
        // ベンチマーク3: ログ生成
        Console.WriteLine("\\n--- ベンチマーク3: JSON ログ生成 ---");
        var logResult = await PerformanceBenchmark.MeasureAsync("ログ生成", async () =>
        {
            for (int i = 0; i < 1000; i++)
            {
                var logEntry = processor.GenerateJsonLog(
                    LogLevel.Info, 
                    $"Processing item {i}",
                    new Dictionary<string, object>
                    {
                        ["userId"] = i % 100,
                        ["operation"] = "data_process",
                        ["success"] = i % 10 != 0
                    });
                // ログエントリを使用（ダミー処理）
                _ = logEntry.Length;
            }
        });
        Console.WriteLine(logResult);
        
        // ベンチマーク4: ファイル処理
        Console.WriteLine("\\n--- ベンチマーク4: ファイル処理 ---");
        var fileData = Encoding.UTF8.GetBytes(string.Join("\\n", Enumerable.Repeat("sample data line with lowercase text", 1000)));
        var fileResult = await PerformanceBenchmark.MeasureAsync("ファイル処理", async () =>
        {
            using var inputStream = new MemoryStream(fileData);
            var processedData = await processor.ProcessLargeFileAsync(inputStream);
            Console.WriteLine($"処理済みファイルサイズ: {processedData.Length / 1024.0:F1}KB");
        });
        Console.WriteLine(fileResult);
        
        // プール統計の表示
        Console.WriteLine("\\n--- リソースプール統計 ---");
        var stats = processor.GetPoolStatistics();
        Console.WriteLine($"StringBuilderプール: {stats.StringBuilderPoolSize}/{stats.StringBuilderMaxPoolSize} (返却率: {stats.StringBuilderReturnRate:F1}%)");
        Console.WriteLine($"MemoryStreamプール: {stats.MemoryStreamPoolSize}/{stats.MemoryStreamMaxPoolSize} (返却率: {stats.MemoryStreamReturnRate:F1}%)");
        Console.WriteLine($"ByteArray使用統計: Get={stats.ByteArrayGets}, Return={stats.ByteArrayReturns} (返却率: {stats.ByteArrayReturnRate:F1}%)");
        
        // メモリ使用量の表示
        Console.WriteLine("\\n--- メモリ使用状況 ---");
        Console.WriteLine($"現在のマネージドメモリ: {GC.GetTotalMemory(false) / 1024 / 1024:F1}MB");
        Console.WriteLine($"Gen0 GC回数: {GC.CollectionCount(0)}");
        Console.WriteLine($"Gen1 GC回数: {GC.CollectionCount(1)}");
        Console.WriteLine($"Gen2 GC回数: {GC.CollectionCount(2)}");
        
        // 強制ガベージコレクション後
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();
        
        Console.WriteLine($"GC後のマネージドメモリ: {GC.GetTotalMemory(false) / 1024 / 1024:F1}MB");
        
        Console.WriteLine("\\n=== デモ完了 ===");
    }
    
    private static List<CustomerData> GenerateCustomerData(int count)
    {
        var random = new Random();
        var statuses = new[] { "Active", "Inactive", "Premium", "VIP" };
        
        return Enumerable.Range(1, count)
            .Select(i => new CustomerData
            {
                Id = i,
                Name = $"顧客{i}",
                Email = $"customer{i}@example.com",
                TotalPurchases = (decimal)(random.NextDouble() * 100000),
                Status = statuses[random.Next(statuses.Length)]
            })
            .ToList();
    }
    
    private static List<RawData> GenerateRawData(int count)
    {
        return Enumerable.Range(1, count)
            .Select(i => new RawData
            {
                Id = i,
                Content = $"raw data content item {i} with some text to process"
            })
            .ToList();
    }
}`
    }
  ],
  exercises: [
    {
      id: 'resource-1',
      title: 'カスタムリソース管理クラス',
      description: 'データベース接続プールを管理するカスタムクラスをIDisposableパターンで実装してください。',
      difficulty: 'hard',
      starterCode: `using System;
using System.Collections.Concurrent;
using System.Data;
using System.Data.SqlClient;

public class DatabaseConnectionPool : IDisposable
{
    private readonly string _connectionString;
    private readonly int _maxPoolSize;
    private readonly ConcurrentQueue<IDbConnection> _availableConnections;
    private readonly ConcurrentBag<IDbConnection> _allConnections;
    private bool _disposed = false;
    
    public DatabaseConnectionPool(string connectionString, int maxPoolSize = 10)
    {
        _connectionString = connectionString;
        _maxPoolSize = maxPoolSize;
        _availableConnections = new ConcurrentQueue<IDbConnection>();
        _allConnections = new ConcurrentBag<IDbConnection>();
    }
    
    public IDbConnection GetConnection()
    {
        // TODO: プールから接続を取得、または新規作成
        throw new NotImplementedException();
    }
    
    public void ReturnConnection(IDbConnection connection)
    {
        // TODO: 接続をプールに戻す
        throw new NotImplementedException();
    }
    
    private IDbConnection CreateConnection()
    {
        // TODO: 新しい接続を作成
        throw new NotImplementedException();
    }
    
    public void Dispose()
    {
        // TODO: Dispose パターンの実装
        throw new NotImplementedException();
    }
    
    protected virtual void Dispose(bool disposing)
    {
        // TODO: リソースの適切な解放
        throw new NotImplementedException();
    }
}

// 使用例のクラス
public class DatabaseService
{
    private readonly DatabaseConnectionPool _connectionPool;
    
    public DatabaseService(string connectionString)
    {
        _connectionPool = new DatabaseConnectionPool(connectionString);
    }
    
    public async Task<string> ExecuteQueryAsync(string sql)
    {
        // TODO: プールから接続を取得してクエリを実行
        throw new NotImplementedException();
    }
}`,
      solution: `public IDbConnection GetConnection()
{
    if (_disposed)
        throw new ObjectDisposedException(nameof(DatabaseConnectionPool));
        
    if (_availableConnections.TryDequeue(out IDbConnection connection))
    {
        // プールから取得した接続の状態をチェック
        if (connection.State == ConnectionState.Open)
        {
            return connection;
        }
        else
        {
            // 無効な接続は破棄
            connection.Dispose();
        }
    }
    
    // プールに利用可能な接続がない場合、新規作成
    if (_allConnections.Count < _maxPoolSize)
    {
        connection = CreateConnection();
        _allConnections.Add(connection);
        return connection;
    }
    
    throw new InvalidOperationException("接続プールの最大サイズに達しました");
}

public void ReturnConnection(IDbConnection connection)
{
    if (_disposed || connection == null)
        return;
        
    if (connection.State == ConnectionState.Open)
    {
        _availableConnections.Enqueue(connection);
    }
    else
    {
        connection.Dispose();
    }
}

private IDbConnection CreateConnection()
{
    var connection = new SqlConnection(_connectionString);
    connection.Open();
    return connection;
}

public void Dispose()
{
    Dispose(true);
    GC.SuppressFinalize(this);
}

protected virtual void Dispose(bool disposing)
{
    if (!_disposed)
    {
        if (disposing)
        {
            // すべての接続を閉じる
            while (_availableConnections.TryDequeue(out IDbConnection connection))
            {
                connection.Dispose();
            }
            
            foreach (var connection in _allConnections)
            {
                connection.Dispose();
            }
        }
        _disposed = true;
    }
}

// DatabaseServiceの実装
public async Task<string> ExecuteQueryAsync(string sql)
{
    var connection = _connectionPool.GetConnection();
    try
    {
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        var result = await command.ExecuteScalarAsync();
        return result?.ToString() ?? "";
    }
    finally
    {
        _connectionPool.ReturnConnection(connection);
    }
}`,
      hints: [
        'ConcurrentQueueとConcurrentBagを使用してスレッドセーフにする',
        'GetConnectionで利用可能な接続をチェックし、必要に応じて新規作成',
        'ReturnConnectionで接続の状態を確認してからプールに戻す',
        'Disposeですべての接続を適切に閉じる'
      ],
      testCases: [
        {
          input: 'GetConnection() → ReturnConnection()',
          expectedOutput: '接続がプールに戻され、再利用可能になる'
        },
        {
          input: '最大プールサイズを超える接続要求',
          expectedOutput: 'InvalidOperationExceptionがスローされる'
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'resource-quiz-1',
      question: 'IDisposableパターンでファイナライザー（デストラクタ）を実装する理由は？',
      options: [
        'パフォーマンスを向上させるため',
        'アンマネージドリソースの確実な解放を保証するため',
        'メモリ使用量を削減するため',
        'デバッグを簡単にするため'
      ],
      correctAnswer: 1,
      explanation: 'ファイナライザーはDisposeが呼ばれなかった場合の最後の手段として、アンマネージドリソースの解放を保証する役割があります。'
    },
    {
      id: 'resource-quiz-2',
      question: 'オブジェクトプールパターンを使用する主な利点は？',
      options: [
        'コードの可読性向上',
        'オブジェクト生成コストの削減とガベージコレクション圧力の軽減',
        'セキュリティの向上',
        'デバッグの簡素化'
      ],
      correctAnswer: 1,
      explanation: 'オブジェクトプールは、高コストなオブジェクト生成を避け、ガベージコレクションの頻度を減らすことでパフォーマンスを向上させます。'
    }
  ],
  nextLesson: undefined, // 最後のレッスン
  estimatedTime: 70
};