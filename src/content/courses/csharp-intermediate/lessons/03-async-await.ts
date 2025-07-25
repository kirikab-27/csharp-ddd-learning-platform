import type { Lesson } from '../../../../features/learning/types';

export const asyncAwaitLesson: Lesson = {
  id: 'async-await',
  moduleId: 'async-programming',
  title: '非同期プログラミング - async/await',
  description: 'C#の非同期プログラミングモデルを理解し、async/awaitを使用した効率的な非同期処理の実装方法を学びます',
  content: `
# 非同期プログラミング - async/await

現代のアプリケーションでは、I/O操作やネットワーク通信など、時間のかかる処理を効率的に扱うことが重要です。C#のasync/awaitは、非同期処理を同期的なコードのように記述できる強力な機能です。

## なぜ非同期プログラミングが必要か？

### 同期処理の問題点

\`\`\`csharp
// 悪い例：UIがフリーズする
public void DownloadButton_Click(object sender, EventArgs e)
{
    var data = DownloadData(); // この間UIが応答しない
    DisplayData(data);
}
\`\`\`

### 非同期処理の利点

- **UIの応答性向上**: メインスレッドをブロックしない
- **スケーラビリティ**: 同時に多くの操作を処理可能
- **リソース効率**: スレッドプールの効率的な利用

## async/awaitの基本

### 非同期メソッドの定義

\`\`\`csharp
public async Task<string> GetDataAsync()
{
    // awaitキーワードで非同期操作を待機
    string result = await DownloadStringAsync("https://api.example.com/data");
    return result;
}
\`\`\`

### Task vs Task<T>

- **Task**: 戻り値のない非同期操作
- **Task<T>**: 型Tの戻り値を持つ非同期操作

\`\`\`csharp
// 戻り値なし
public async Task SaveDataAsync(string data)
{
    await File.WriteAllTextAsync("data.txt", data);
}

// 戻り値あり
public async Task<int> CalculateAsync()
{
    await Task.Delay(1000); // 1秒待機
    return 42;
}
\`\`\`

## 非同期メソッドの呼び出し

### 基本的な呼び出し

\`\`\`csharp
public async Task ProcessDataAsync()
{
    // 非同期メソッドの呼び出しと待機
    string data = await GetDataAsync();
    Console.WriteLine(data);
    
    // 複数の非同期操作を順次実行
    await SaveDataAsync(data);
    await NotifyCompletionAsync();
}
\`\`\`

### 並列実行

\`\`\`csharp
public async Task ProcessMultipleAsync()
{
    // タスクを開始（まだawaitしない）
    Task<string> task1 = GetDataAsync("source1");
    Task<string> task2 = GetDataAsync("source2");
    Task<string> task3 = GetDataAsync("source3");
    
    // すべてのタスクを並列で待機
    string[] results = await Task.WhenAll(task1, task2, task3);
    
    // または個別に待機
    string result1 = await task1;
    string result2 = await task2;
    string result3 = await task3;
}
\`\`\`

## エラー処理

### try-catchの使用

\`\`\`csharp
public async Task<string> SafeGetDataAsync()
{
    try
    {
        return await GetDataAsync();
    }
    catch (HttpRequestException ex)
    {
        Console.WriteLine($"ネットワークエラー: {ex.Message}");
        return "デフォルトデータ";
    }
    catch (TaskCanceledException)
    {
        Console.WriteLine("操作がキャンセルされました");
        return null;
    }
}
\`\`\`

## キャンセレーション

### CancellationTokenの使用

\`\`\`csharp
public async Task<string> DownloadWithCancellationAsync(
    string url, 
    CancellationToken cancellationToken)
{
    using var client = new HttpClient();
    
    try
    {
        var response = await client.GetAsync(url, cancellationToken);
        return await response.Content.ReadAsStringAsync();
    }
    catch (OperationCanceledException)
    {
        Console.WriteLine("ダウンロードがキャンセルされました");
        throw;
    }
}

// 使用例
var cts = new CancellationTokenSource();
cts.CancelAfter(TimeSpan.FromSeconds(5)); // 5秒でタイムアウト

try
{
    var result = await DownloadWithCancellationAsync(url, cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("タイムアウトしました");
}
\`\`\`

## 進捗報告

### IProgress<T>の使用

\`\`\`csharp
public async Task DownloadWithProgressAsync(
    string url, 
    IProgress<int> progress)
{
    using var client = new HttpClient();
    var response = await client.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);
    var totalBytes = response.Content.Headers.ContentLength ?? 0;
    
    using var stream = await response.Content.ReadAsStreamAsync();
    var buffer = new byte[8192];
    var totalRead = 0L;
    int read;
    
    while ((read = await stream.ReadAsync(buffer, 0, buffer.Length)) > 0)
    {
        totalRead += read;
        var percentage = (int)((totalRead * 100) / totalBytes);
        progress?.Report(percentage);
    }
}

// 使用例
var progress = new Progress<int>(percent => 
{
    Console.WriteLine($"進捗: {percent}%");
});

await DownloadWithProgressAsync(url, progress);
\`\`\`

## 一般的なパターンと最適化

### ConfigureAwait(false)

\`\`\`csharp
public async Task<string> GetDataAsync()
{
    // UIコンテキストへの復帰が不要な場合
    var data = await DownloadAsync().ConfigureAwait(false);
    
    // CPU集約的な処理
    return ProcessData(data);
}
\`\`\`

### ValueTask<T>の使用

\`\`\`csharp
// 頻繁に同期的に完了する可能性がある場合
public async ValueTask<int> GetCachedValueAsync(string key)
{
    if (_cache.TryGetValue(key, out int value))
    {
        return value; // 同期的に返す（割り当てなし）
    }
    
    return await LoadFromDatabaseAsync(key);
}
\`\`\`

## ベストプラクティス

1. **async voidを避ける**: イベントハンドラー以外では使用しない
2. **適切な命名**: 非同期メソッドには"Async"サフィックスを付ける
3. **デッドロックの回避**: .Result や .Wait() の使用を避ける
4. **リソースの解放**: using文やfinallyブロックを適切に使用

\`\`\`csharp
// 良い例
public async Task ProcessAsync()
{
    using var resource = new SomeResource();
    await resource.UseAsync();
} // resourceが適切に解放される

// 悪い例
public void Process()
{
    var task = ProcessAsync();
    task.Wait(); // デッドロックの可能性
}
\`\`\`

## まとめ

async/awaitにより：
- 非同期処理が簡潔に記述可能
- エラー処理が直感的
- アプリケーションの応答性とスケーラビリティが向上

次のレッスンでは、ジェネリクスについて学習します。
`,
  codeExamples: [
    {
      id: 'practical-async-web-client',
      title: '実践的な非同期Webクライアント',
      description: '複数のAPIを並列で呼び出し、結果を集約する例',
      language: 'csharp',
      code: `using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

public class WeatherAggregator
{
    private readonly HttpClient _httpClient;
    
    public WeatherAggregator()
    {
        _httpClient = new HttpClient();
    }
    
    // 複数の天気予報サービスから並列でデータを取得
    public async Task<WeatherSummary> GetAggregatedWeatherAsync(
        string city,
        CancellationToken cancellationToken = default)
    {
        // 複数のAPIを並列で呼び出し
        var tasks = new List<Task<WeatherData>>
        {
            GetWeatherFromServiceAAsync(city, cancellationToken),
            GetWeatherFromServiceBAsync(city, cancellationToken),
            GetWeatherFromServiceCAsync(city, cancellationToken)
        };
        
        try
        {
            // すべてのタスクを待機
            var results = await Task.WhenAll(tasks);
            
            // 結果を集約
            return new WeatherSummary
            {
                City = city,
                AverageTemperature = results.Average(r => r.Temperature),
                MaxTemperature = results.Max(r => r.Temperature),
                MinTemperature = results.Min(r => r.Temperature),
                MostCommonCondition = results
                    .GroupBy(r => r.Condition)
                    .OrderByDescending(g => g.Count())
                    .First().Key,
                DataSources = results.Length,
                Timestamp = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"天気データの取得に失敗: {ex.Message}");
            
            // 部分的な成功を処理
            var completedTasks = tasks.Where(t => t.IsCompletedSuccessfully);
            if (completedTasks.Any())
            {
                var partialResults = completedTasks.Select(t => t.Result).ToList();
                return CreatePartialSummary(city, partialResults);
            }
            
            throw;
        }
    }
    
    private async Task<WeatherData> GetWeatherFromServiceAAsync(
        string city, 
        CancellationToken cancellationToken)
    {
        // タイムアウト付きでAPIを呼び出し
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(5));
        
        try
        {
            var response = await _httpClient.GetAsync(
                $"https://api.weather-a.com/v1/weather?city={city}",
                cts.Token);
            
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            
            // 実際にはJSONをパースして返す
            return new WeatherData 
            { 
                Temperature = 20.5, 
                Condition = "晴れ",
                Source = "ServiceA"
            };
        }
        catch (TaskCanceledException)
        {
            throw new TimeoutException($"ServiceAのタイムアウト: {city}");
        }
    }
    
    private async Task<WeatherData> GetWeatherFromServiceBAsync(
        string city, 
        CancellationToken cancellationToken)
    {
        // リトライロジック付き
        const int maxRetries = 3;
        for (int i = 0; i < maxRetries; i++)
        {
            try
            {
                // API呼び出し（簡略化）
                await Task.Delay(100, cancellationToken); // シミュレーション
                
                return new WeatherData 
                { 
                    Temperature = 21.0, 
                    Condition = "晴れ",
                    Source = "ServiceB"
                };
            }
            catch (HttpRequestException) when (i < maxRetries - 1)
            {
                // 指数バックオフ
                await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, i)), cancellationToken);
            }
        }
        
        throw new Exception("ServiceBへの接続に失敗");
    }
    
    private async Task<WeatherData> GetWeatherFromServiceCAsync(
        string city, 
        CancellationToken cancellationToken)
    {
        // 進捗報告付き
        var progress = new Progress<string>(message => 
        {
            Console.WriteLine($"ServiceC: {message}");
        });
        
        await ReportProgress(progress, "接続中...");
        await Task.Delay(200, cancellationToken);
        
        await ReportProgress(progress, "データ取得中...");
        await Task.Delay(300, cancellationToken);
        
        await ReportProgress(progress, "完了");
        
        return new WeatherData 
        { 
            Temperature = 19.8, 
            Condition = "曇り",
            Source = "ServiceC"
        };
    }
    
    private async Task ReportProgress(IProgress<string> progress, string message)
    {
        await Task.Run(() => progress?.Report(message));
    }
    
    private WeatherSummary CreatePartialSummary(string city, List<WeatherData> results)
    {
        return new WeatherSummary
        {
            City = city,
            AverageTemperature = results.Average(r => r.Temperature),
            MaxTemperature = results.Max(r => r.Temperature),
            MinTemperature = results.Min(r => r.Temperature),
            MostCommonCondition = results.First().Condition,
            DataSources = results.Count,
            IsPartial = true,
            Timestamp = DateTime.UtcNow
        };
    }
}

public class WeatherData
{
    public double Temperature { get; set; }
    public string Condition { get; set; }
    public string Source { get; set; }
}

public class WeatherSummary
{
    public string City { get; set; }
    public double AverageTemperature { get; set; }
    public double MaxTemperature { get; set; }
    public double MinTemperature { get; set; }
    public string MostCommonCondition { get; set; }
    public int DataSources { get; set; }
    public bool IsPartial { get; set; }
    public DateTime Timestamp { get; set; }
}

// 使用例
public class Program
{
    public static async Task Main(string[] args)
    {
        var aggregator = new WeatherAggregator();
        var cts = new CancellationTokenSource();
        
        try
        {
            var weather = await aggregator.GetAggregatedWeatherAsync("東京", cts.Token);
            
            Console.WriteLine($"都市: {weather.City}");
            Console.WriteLine($"平均気温: {weather.AverageTemperature:F1}°C");
            Console.WriteLine($"最高/最低: {weather.MaxTemperature:F1}°C / {weather.MinTemperature:F1}°C");
            Console.WriteLine($"天候: {weather.MostCommonCondition}");
            Console.WriteLine($"データソース数: {weather.DataSources}");
            
            if (weather.IsPartial)
            {
                Console.WriteLine("警告: 一部のデータソースが利用できませんでした");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"エラー: {ex.Message}");
        }
    }
}`
    }
  ],
  exercises: [
    {
      id: 'async-await-1',
      title: '非同期ファイル処理システム',
      description: '複数のファイルを非同期で処理し、進捗を報告するシステムを実装してください。',
      difficulty: 'hard',
      starterCode: `using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

public class FileProcessor
{
    public class ProcessResult
    {
        public string FileName { get; set; }
        public bool Success { get; set; }
        public int LinesProcessed { get; set; }
        public string Error { get; set; }
    }
    
    // 複数のファイルを並列で処理し、進捗を報告するメソッドを実装してください
    // 要件：
    // 1. 各ファイルを非同期で読み込み、行数をカウント
    // 2. 進捗をIProgress<T>で報告（処理済みファイル数/総ファイル数）
    // 3. キャンセレーションをサポート
    // 4. エラーが発生してもOK（結果に含める）
    public async Task<List<ProcessResult>> ProcessFilesAsync(
        string[] filePaths,
        IProgress<double> progress,
        CancellationToken cancellationToken)
    {
        // TODO: 実装
        throw new NotImplementedException();
    }
    
    // ファイルを非同期で処理し、指定された文字列を含む行を抽出するメソッド
    // タイムアウト機能付き（5秒）
    public async Task<List<string>> SearchInFileAsync(
        string filePath,
        string searchText,
        CancellationToken cancellationToken)
    {
        // TODO: 実装
        // ヒント: CancellationTokenSource.CreateLinkedTokenSource を使用
        throw new NotImplementedException();
    }
}`,
      solution: `public async Task<List<ProcessResult>> ProcessFilesAsync(
    string[] filePaths,
    IProgress<double> progress,
    CancellationToken cancellationToken)
{
    var results = new List<ProcessResult>();
    var processedCount = 0;
    var totalFiles = filePaths.Length;
    
    // セマフォで同時実行数を制限（例：4つまで）
    using var semaphore = new SemaphoreSlim(4);
    
    var tasks = filePaths.Select(async filePath =>
    {
        await semaphore.WaitAsync(cancellationToken);
        try
        {
            var result = await ProcessSingleFileAsync(filePath, cancellationToken);
            
            // 進捗を報告
            var currentProgress = Interlocked.Increment(ref processedCount);
            progress?.Report((double)currentProgress / totalFiles * 100);
            
            return result;
        }
        finally
        {
            semaphore.Release();
        }
    }).ToList();
    
    try
    {
        var allResults = await Task.WhenAll(tasks);
        return allResults.ToList();
    }
    catch
    {
        // 部分的な結果を返す
        var completedResults = tasks
            .Where(t => t.IsCompletedSuccessfully)
            .Select(t => t.Result)
            .ToList();
            
        var failedResults = tasks
            .Where(t => t.IsFaulted || t.IsCanceled)
            .Select((t, index) => new ProcessResult
            {
                FileName = filePaths[index],
                Success = false,
                Error = t.Exception?.GetBaseException().Message ?? "キャンセルされました"
            })
            .ToList();
            
        completedResults.AddRange(failedResults);
        return completedResults;
    }
}

private async Task<ProcessResult> ProcessSingleFileAsync(
    string filePath, 
    CancellationToken cancellationToken)
{
    try
    {
        var lines = await File.ReadAllLinesAsync(filePath, cancellationToken);
        
        return new ProcessResult
        {
            FileName = Path.GetFileName(filePath),
            Success = true,
            LinesProcessed = lines.Length
        };
    }
    catch (Exception ex)
    {
        return new ProcessResult
        {
            FileName = Path.GetFileName(filePath),
            Success = false,
            Error = ex.Message
        };
    }
}

public async Task<List<string>> SearchInFileAsync(
    string filePath,
    string searchText,
    CancellationToken cancellationToken)
{
    // タイムアウト付きのキャンセレーショントークンを作成
    using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
    using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
        cancellationToken, timeoutCts.Token);
    
    var matchingLines = new List<string>();
    
    try
    {
        using var reader = new StreamReader(filePath);
        string line;
        int lineNumber = 0;
        
        while ((line = await reader.ReadLineAsync()) != null)
        {
            linkedCts.Token.ThrowIfCancellationRequested();
            
            lineNumber++;
            if (line.Contains(searchText, StringComparison.OrdinalIgnoreCase))
            {
                matchingLines.Add($"{lineNumber}: {line}");
            }
        }
        
        return matchingLines;
    }
    catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested)
    {
        throw new TimeoutException($"ファイル '{filePath}' の処理がタイムアウトしました");
    }
}`,
      hints: [
        'Task.WhenAllを使用して並列処理を実装します',
        'SemaphoreSlimで同時実行数を制限できます',
        'Interlocked.Incrementでスレッドセーフにカウンターを更新します',
        'CancellationTokenSource.CreateLinkedTokenSourceで複数のキャンセルソースを組み合わせます'
      ],
      testCases: [
        {
          input: 'ファイルパスの配列、進捗報告用のIProgress、CancellationToken',
          expectedOutput: '各ファイルの処理結果を含むリスト'
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'async-quiz-1',
      question: 'async voidメソッドを使用してよい場面は？',
      options: [
        'Webサービスのメソッド',
        'イベントハンドラー',
        'ライブラリのパブリックAPI',
        '使用してはいけない'
      ],
      correctAnswer: 1,
      explanation: 'async voidはイベントハンドラーでのみ使用すべきです。他の場合はasync Taskを使用します。'
    },
    {
      id: 'async-quiz-2',
      question: 'ConfigureAwait(false)を使用する主な理由は？',
      options: [
        'パフォーマンスを向上させるため',
        'デッドロックを防ぐため',
        'UIスレッドへの復帰が不要な場合のパフォーマンス最適化',
        'エラー処理を簡単にするため'
      ],
      correctAnswer: 2,
      explanation: 'ConfigureAwait(false)は、継続処理が元のコンテキスト（UIスレッドなど）に戻る必要がない場合に使用し、パフォーマンスを向上させます。'
    }
  ],
  nextLesson: 'generics',
  estimatedTime: 50
};