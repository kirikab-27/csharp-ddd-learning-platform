# 変数とデータ型

## レッスンの目標
- C#の基本的なデータ型を理解する
- 変数の宣言と初期化方法を学ぶ
- 型安全性の重要性を理解する
- 文字列補間の使い方を覚える

## 変数とは？

変数は、データを一時的に保存するための「箱」のようなものです。この箱には名前（変数名）があり、中にさまざまな種類のデータを入れることができます。

## C#の基本データ型

### 1. 整数型（int）
整数（小数点のない数）を保存します。

```csharp
int age = 25;
int score = 100;
```

### 2. 文字列型（string）
文字の集合（テキスト）を保存します。

```csharp
string name = "田中太郎";
string message = "こんにちは";
```

### 3. 浮動小数点型（double）
小数点を含む数値を保存します。

```csharp
double height = 175.5;
double price = 1299.99;
```

### 4. 論理型（bool）
true（真）またはfalse（偽）の値を保存します。

```csharp
bool isStudent = true;
bool hasLicense = false;
```

## 変数の宣言と初期化

### 基本的な宣言方法
```csharp
データ型 変数名 = 初期値;
```

### 宣言のみ（後で値を代入）
```csharp
int number;
number = 42;
```

### 複数の変数を一度に宣言
```csharp
int x = 10, y = 20, z = 30;
```

## 文字列補間

変数の値を文字列に埋め込む便利な方法です。

```csharp
string name = "山田花子";
int age = 30;

// 文字列補間を使用
string introduction = $"私の名前は{name}で、{age}歳です。";
Console.WriteLine(introduction);
```

## 型の重要性

C#は「型安全」な言語です。これは、間違った型の操作を防いでくれる機能です。

### 良い例
```csharp
int number = 10;
int result = number + 5; // 正しい：整数同士の計算
```

### エラーになる例
```csharp
int number = 10;
string text = "Hello";
int result = number + text; // エラー：整数と文字列は足せない
```

## 変数の命名規則

### 良い変数名
- `studentName` (キャメルケース)
- `totalScore`
- `isCompleted`

### 避けるべき変数名
- `a`, `b`, `x` (意味が不明)
- `studentname` (読みにくい)
- `123name` (数字から始まってはいけない)

## 実践のヒント

1. **意味のある名前を付ける**: 変数の目的が分かる名前を選ぶ
2. **適切な型を選ぶ**: 保存するデータに最適な型を使う
3. **初期化を忘れない**: 宣言時に適切な初期値を設定する
4. **一つの変数に一つの役割**: 変数は一つの目的にのみ使用する

## 次のステップ

次のレッスンでは、これらの変数を使った計算や、より複雑なデータの操作について学習します。まずは演習問題で基本的な変数操作に慣れましょう！