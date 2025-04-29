---
id: de9ec8df-d30a-0e46-39dc-e95c3a61cdf4
title: JavaScriptのエクスポート形式について
date: '2025-04-02'
tags:
  - TypeScript
  - JavaScript
---

## エクスポート形式の比較

### 1. `export function` (関数宣言)

- **形式**: 関数宣言をそのままエクスポートする。
- **特徴**:
    - ホイスティングが効くため、宣言前に呼び出すことが可能。
    - デフォルトエクスポートは不可。

```jsx
// utils/math.js

export function add(a, b) {
  return a + b;
}
```

- **使用シーン**: シンプルな関数で、ホイスティングが必要な場合に適している。

### 2. `export const 変数名 = function` (関数式)Named export (import)

- **形式**: 変数に関数を代入してエクスポートする。
- **特徴**:
    - 関数式であるため、ホイスティングされない。関数が定義される前に呼び出せない。
    - 関数を匿名関数やラムダ式としてエクスポート可能。

```jsx
// utils/math.js

export const add = function (a, b) {
  return a + b;
};

// または、アロー関数を使う場合
export const addArrow = (a, b) => a + b;

```

- **使用シーン**: ホイスティングが不要で、アロー関数を使用したい場合や、複数の関数をエクスポートしたい場合に適している。

### 3. `export default function` (デフォルトエクスポート)default export(import)

- **形式**: 関数をデフォルトでエクスポートする。
- **特徴**:
    - モジュールにつき1つだけのデフォルトエクスポート。
    - インポート時に任意の名前で取り込める。

```jsx
// utils/math.js

export default function add(a, b) {
  return a + b;
}

```

- **使用シーン**: モジュール内の主たる関数やコンポーネントをエクスポートする場合に適している。

## 使い分けの基準

### 1. ホイスティングが必要かどうか

- **必要な場合**: `export function`を使って関数宣言をエクスポートする。これにより、関数の呼び出しが定義前でも可能になる。

### 2. 複数の関数をエクスポートするか

- **複数の関数をエクスポートする場合**: `export const`を使って関数式をエクスポートする。これにより、関数を変数として扱えるため、柔軟な構成が可能。

### 3. 関数のスタイル

- **アロー関数や関数式を使いたい場合**: `export const`を使って関数式をエクスポートする。アロー関数を使うことで、短い構文や`this`のスコープを簡潔に管理できる。

### 4. モジュールの主たる機能としてエクスポートするか

- **主たる機能としてエクスポートする場合**: `export default`を使う。これにより、インポート時に任意の名前で取り込むことができ、モジュールの意図を明確にできる。

## 具体例

### シナリオ: 数学関数のユーティリティ

例えば、いくつかの数学的操作を提供するモジュールを考えてみる。この場合、複数の関数をエクスポートする必要があるため、`export const`を使った方法が適している。

```jsx
// utils/math.js

// 名前付きエクスポート
export const add = (a, b) => a + b;

export const subtract = (a, b) => a - b;

export const multiply = (a, b) => a * b;

export const divide = (a, b) => {
  if (b === 0) {
    throw new Error("Division by zero");
  }
  return a / b;
};

// デフォルトエクスポート
export default function square(a) {
  return a * a;
}

```

### インポートの例

これらの関数を別のファイルで使用するには、次のようにインポートする。

```jsx
// app.js

import square, { add, subtract, multiply, divide } from './utils/math';

console.log(add(2, 3)); // 5
console.log(square(4)); // 16

```

## まとめ

- **`export default function`**: モジュールの主たる機能として1つの関数をデフォルトエクスポート。
- **`export function`**: 関数宣言を名前付きでエクスポート。ホイスティングが必要な場合に便利。
- **`export const 変数名 = function`**: 関数式を名前付きでエクスポート。アロー関数や複数のエクスポートが必要な場合に適している。

状況によりけりだが、import時に名前を変更できる利点がない限りNamed export(import)を使うほうが不要な認識のズレを無くせると思う

関数宣言でのexportはホイスティングを理解していれば良いが、不要なバグを生む恐れがあるため、注意が必要である。
