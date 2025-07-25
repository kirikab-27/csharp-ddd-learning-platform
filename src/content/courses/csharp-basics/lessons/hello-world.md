# Hello, World!

## レッスンの目標
- C#の基本的なプログラム構造を理解する
- Console.WriteLineの使い方を学ぶ
- 最初のC#プログラムを作成する

## C#プログラムの基本構造

C#プログラムは以下の要素で構成されます：

1. **using文**: 必要なライブラリを読み込む
2. **namespace**: プログラムのグループ化
3. **class**: プログラムの基本単位
4. **Mainメソッド**: プログラムの実行開始点

## Hello, World!プログラムの解説

```csharp
using System;

namespace HelloWorld
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello, World!");
        }
    }
}
```

### 各行の説明

- `using System;`: Systemライブラリを使用することを宣言
- `namespace HelloWorld`: HelloWorldという名前空間を定義
- `class Program`: Programクラスを定義
- `static void Main(string[] args)`: プログラムの実行開始点
- `Console.WriteLine("Hello, World!");`: コンソールに文字列を出力

## 重要なポイント

- **セミコロン（;）**: 文の終わりに必ず必要
- **大文字小文字の区別**: C#は大文字小文字を区別します
- **中括弧（{}）**: コードブロックを表現

## 次のステップ

次のレッスンでは、変数とデータ型について学びます。プログラムで扱うデータの種類と、それらを保存する方法を理解しましょう。