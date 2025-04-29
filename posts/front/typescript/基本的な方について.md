---
id: 3b709587-2e05-7d62-0d14-7318d831ada3
title: TypeScriptの基本的な型
date: '2025-04-02'
tags:
  - TypeScript
---

## 型アノテーション(型注釈)

```tsx
変数名: 型名 = 値
let name: string = "Name";
```

## プリミティブな型

### number

- 整数、浮動小数、負の値、NaN(not a number)、infinity、2進数(0b)、8進数(0o)、16進数(0x)
- 範囲は約 -9007199254740991`-(2^53 − 1)`から約 9007199254740991`2^53 − 1`

### string

- シングルクウォート、ダブルクウォート、バックティック(テンプレートリテラル)

### boolean

- true/false

### undefined

- 値が存在しないことを表す型(値が代入されていないため値がない)
- 特別な事情がない限りはnullではなくundefinedを使用した方がいい(undefinedを返すメソッドなどが多いため、こちらをデフォルトにした方が楽である)

### null

- 値が存在しないことを表す型(代入すべき値が存在しないため、値がない)

### symbol

- 一意になる値

```tsx
const sym1 = Symbol('foo');
const sym2 = Symbol('foo');

console.log(sym1 === sym2); // false
```

- 名前が同じシンボルを生成したとしても、Symbol()が呼ばれるたびに異なるメモリ位置に新しいシンボルが生成される

### bigint

- number型では扱えない大きな整数を扱える(末尾にnをつける)

```tsx
let x: bigint = 100n;
```

## リテラル型

- constやプリミティブ型の特定の値だけを代入可能にする型
- 下記の場合は1,2,3のみ代入可能になる

```tsx
let num: 1 | 2 | 3 = 1;
```

## ユニオン型

- 型を組み合わせた型でいずれかを受け入れる
- `|` で値を繋ぐ

```tsx
let numberOrString = number | string
```

リテラル型と組み合わせると変数が取りうる値を限定できる

```tsx
let color: "red", "bule", "green"
```

## **型エイリアス**

- 型に名前をつけることができる。名前のついた型を型エイリアスという
- typeキーワードを使用する
- 複数箇所で使用したり、意味を持たせたい値を型安全を保つことに使用できる

```tsx
type StringOrNumber = string | number;
```

## オブジェクト型

- 基本定義(見にくいのであまり使用しない)

```tsx
let book: {
  title: string;
  author: string
  age: number
} = {
  title: "羅生門",
  author: "芥川龍之介",
	age: 30
};
```

- 型エイリアスと組み合わせて使用する方が良い(再利用と可読性がこちらの方が高い)

```tsx
type Book = {
	title: string;
  author: string
  age: number
};

const book: Book = {
  title: "羅生門",
  author: "芥川龍之介",
	age: 30
};
```

- オブジェクト(TypeScript自体)は構造的型付けなので、何かキーやバリューへの代入に過不足があるとエラーになるので安全性が高い

## オプショナル

- プロパティ名の後ろに`?`を使用する

```tsx
type Book = {
	title: string;
  author: string
  age?: number
};

const book: Book = {
  title: "羅生門",
  author: "芥川龍之介",
	// age: 30 任意となる 
};
```

- ageは `number | undefined` のようにundefinedを含むユニオン型となる

## Array

2つの定義方法がある

- Type[]

```tsx
let array: number[];
array = [1, 2, 3];
```

- Array<T>

```tsx
let array: Array<number>;
array = [1, 2, 3];
```

基本的にTypeを使った方が可読性が高く、ジェネリクスとも見間違えないので良いと思う(まあどちらでも良いのでPJとチーム次第で使い分けを決定すればいよい)

## インターセクション型

- AかつBのように組み合わせの全ての型を有している型
- `&`演算子を使用して繋いで表現をする(ちょっと複雑な型定義や自動生成されたコードなどでちょいちょい見る)

```tsx
type TwoDimensionalPoint = {
  x: number;
  y: number;
};
 
type Z = {
  z: number;
};
 
type ThreeDimensionalPoint = TwoDimensionalPoint & Z;
 
const p: ThreeDimensionalPoint = {
  x: 0,
  y: 1,
  z: 2,
};
```

プリミティブな型でインターセクション型を定義すると、両方の特性を持つ型は存在しない為、`never` 型となる

```tsx
type Never = string & number;
 
const n: Never = "2";
```

## any型

任意の型を受け付ける

- 型チェックが適応されない(当然、他の型にも代入できる)
- 基本は使用しない
- どうしても必要な場合はunknown型が使用できないか検討する

## unknown型

任意の型を受け付けるが他の型には代入ができない

- 型チェックは行われる
- unknown型は任意の値を受け入れるが、別の型に直接的にできないため、型安全は担保される
- メソッドやプロパティへのアクセスも不可
- 算術演算も不可(比較演算は可能である)

```tsx
const value: unknown = 10
const int: number = value // NG

// 型をチェックして確定させることができればその型として扱うことができる
if (typeof value === "number") {
	return value + 1
}
```

## 関数

- 関数パラメータに関しては型推論は行われない

```tsx
function 関数名(引数名: 引数の型): 戻り値の型 {
	return a
}

function functionName(arg: string): string {
	return a
}
```

## 関数型

- 関数の構造を型として明示的に表現する
- 引数、戻り値を定義する

```tsx
const 変数名 = (引数: 引数の型) => 戻り値の型

const myFunction = (arg: string) => string

// 例
const addNumbers: (a: number, b: number) => number = (a, b) => a + b;
```

- 型エイリアスなどを使用して可読性を高めることも可能

```tsx
type NameType = (lastName: string, firstName: string) => string;

const fullName: NameType = (lastName, firstName) => `${lastName+firstName}`;
console.log(fullName("first", "last"));
// => "firstlast" 
```

## void型

- 関数の戻り値がないことを表現している
- TypeScriptではreturnを省略するとundefined型が帰るがその場合でもvoid型として型推論される

```tsx
const 変数名 = (引数: 引数の型) => void
```

## never型

- 何も値が代入できない型である
- 基本的に関数が戻り値を返さず、正常に終了しない場合に使用することが多い
- voidは値を返さないがneverは関数が正常に終了点を持たないことを意味する(例外など)
- 値を持たないことを表現している型である
- never型から他の型への代入は可能である

```tsx
const value: never = 1;
// never型に代入は認められていないため、エラーになる

const value: never = 1 as never;
// never型にnever型を代入することだけは可能である(これ以外は不可)

const nev = 1 as never;
const a: string = nev; // 代入可能
const b: number = nev; // 代入可能
```

- 例外などはnever型になる(戻り値を取得できないため)

```tsx
function throwError(): never {
  throw new Error();
}
```

## 型アサーション

TypeScriptが推論した型を任意の方法で上書きする(型推論による不正確を強制する)

具体的な型を知ることのできないケースで使用する

**キャストはされないので注意すること。あくまでコンパイラに対して型を伝えるだけである。また違いすぎる型はアサーションできない(型同士がいずれかのサブタイプである場合は可能)。**

- 型アサーションの書き方は2つある。
    - as構文(こちらを使う機会が多い)
    - アングルブラケット(JSXと見分けがつかない場合があるため、使用頻度は下がる)

```tsx
// as構文
変数 = 値 as 型
// アングルブラケット
変数 = <型>値
```

**型アサーションの注意点**

下記のようにプロパティの追加をしてない場合でも型アサーションはコンパイラはエラーを返さない

```tsx
interface Foo {
    bar: number;
    bas: string;
}
var foo = {} as Foo;
// 必要なプロパティの追加を忘れてもコンパイラはエラーを起こさない
```

この場合は下記のように型アノテーションで記載する方が望ましい

```tsx
interface Foo {
    bar: number;
    bas: string;
}
var foo:Foo = {
    // 型 '{}' には 型 'Foo' からの次のプロパティがありません: bar, basts(2739)とエラーになる
};
```

## 型エイリアス

型に名前をつけることができる。名前のついた型を型エイリアスという

typeキーワードを使用する

```tsx
type StringOrNumber = string | number;
```

どんな型アノテーションにも与えることができる

```tsx
type Text = string | { text: string };
type Coordinates = [number, number];
type Callback = (data: string) => void;
// プリミティブ型
type Str = string;
// リテラル型
type OK = 200;
// 配列型
type Numbers = number[];
// オブジェクト型
type UserObject = { id: number; name: string };
// ユニオン型
type NumberOrNull = number | null;
// 関数型
type CallbackFunction = (value: string) => boolean;
```

複数箇所で使用したり、意味を持たせたい値を型安全を保つことに使用できる

## typeof演算子

TypeScriptの`typeof`は変数から型を抽出する型演算子

下記は変数pointにtypeof型演算子を用いてPoint型を定義している例

```tsx
const point = { x: 135, y: 35 };
type Point = typeof point;

// type Point = {
    // x: number;
    // y: number;
// }
```

バニラのtypeof演算子は値の型を調べることができるが、別物なので注意

## keyof型演算子

オブジェクトの型からプロパティ名を型として返す型演算子である

`name`プロパティを持つ型に対して、`keyof`を使うと文字列リテラル型の`"name"`が得られる

```tsx
type Person = {
  name: string;
};
type PersonKey = keyof Person;
// type PersonKey = "name"

type Book = {
  title: string;
  price: number;
  rating: number;
};
type BookKey = keyof Book;
// 上は次と同じ意味になる
type BookKey = "title" | "price" | "rating";

const colors = {
  red: 'red',
  blue: 'blue'
}
type Colors = keyof typeof colors;

let color: Colors; // same as let color: "red" | "blue"
color = 'red'; // okay
color = 'blue'; // okay
color = 'anythingElse'; // Error: Type '"anythingElse"' is not assignable to type '"red" | "blue"'

type MapLike = { [K: string]: any };
type MapKeys = keyof MapLike;
       
type MapKeys = string | number
// type MapKeys = string | number
// number型のキーアクセスのobj[0]はobj["0"]のため、stringのインデックス型は、stringではなくstring | numberが返る
```

## ジェネリクス

型の安全性とコードの共通化を両立させたいときに使用する

ジェネリクスは、型も引数のように扱うという発想である

numberを格納することを想定したQueueクラスに文字列を与えてしまいエラーになる

```tsx
class Queue {
  private data = [];
  push(item) { this.data.push(item); }
  pop() { return this.data.shift(); }
}

const queue = new Queue();
queue.push(0);
queue.push("1"); // numberのはずがstringをキューに格納

// a developer walks into a bar
console.log(queue.pop().toPrecision(1));
console.log(queue.pop().toPrecision(1)); // numberのメソッドを使用しエラー
```

ここからnumber型による型制限を設ける

```tsx
class QueueNumber extends Queue {
  push(item: number) { super.push(item); }
  pop(): number { return this.data.shift(); }
}

const queue = new QueueNumber();
queue.push(0);
queue.push("1"); // 格納時点でエラー
```

ここで文字列型も格納できるQueueが必要になった場合、string型を受け入れるキュークラスを作成すると思われるが、同じようなコードが重複されることになる。

これを解消するのがジェネリクスである

```tsx
class Queue<T> {
  private data = [];
  push(item: T) { this.data.push(item); }
  pop(): T | undefined { return this.data.shift(); }
}

const queue = new Queue<number>();// 型も引数のように扱うことができる
queue.push(0);
queue.push("1"); // number型を渡しているのでエラー

const queue = new Queue<string>();
queue.push("1");
queue.push(0); // string型を渡しているのでエラー
```
