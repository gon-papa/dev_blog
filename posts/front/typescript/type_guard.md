---
id: f625b58f-ecab-18f6-2345-25167e0bcb6b
title: TypeScriptの型ガード
date: '2025-04-02'
tags:
  - TypeScript
---

## 型ガード

- 変数が特定の型を持っているかどうかを判定する→これをif文などを通して判定していればコンパイラに推論させる

```tsx
function isString(value: any): value is string {
  return typeof value === "string";
}

let x: any = "hello";

if (isString(x)) {
  console.log(x.toUpperCase()); // 型ガードにより、ここでxはstringとして扱われる
}
```

上記はif文の条件に`string` を判定させているため、if文条件をクリアしたものは`string` だとコンパイラが理解できる。だからany型でもstring型で使用できるtoUpperCaseメソッドを使用してもエラーにならない。

- 等価性による絞り込みは `===` `!==` `==` などの等価演算子をif文やswitch文で使用することで型ガードを使用できる
- `let a: string | number` などの場合は、代入した際にstringやnumber型を代入すればコンパイラが勝手に理解してくれるが、三項演算子などを利用してどちらの値が入るのか明示できない場合にはエラーになる→代入による絞り込み
- `typeof` でも絞り込める

```tsx
if (typeof value === "string") {
	console.log(value.toUpperCase());
}
```

- in演算子でも絞り込める

```tsx
interface Car {
  drive: () => void;
}

interface Boat {
  sail: () => void;
}

function move(vehicle: Car | Boat) {
  if ("drive" in vehicle) {
    vehicle.drive(); // ここでvehicleはCar型と判定される
  } else {
    vehicle.sail(); // ここでvehicleはBoat型と判定される
  }
}

let myCar: Car = {
  drive: () => console.log("Driving"),
};

let myBoat: Boat = {
  sail: () => console.log("Sailing"),
};

move(myCar); // "Driving"と出力される
move(myBoat); // "Sailing"と出力される
```

- instanceofでも絞り込める

```tsx
class Dog {
  bark() {
    console.log("Woof!");
  }
}

let pet: any = new Dog();

if (pet instanceof Dog) {
  pet.bark(); // 型ガードにより、ここでpetはDogとして扱われる
}
```

- 複数の型を一つにまとめて、その中で特定の型を区別するために使用される。タグ付きユニオン型では、各ユニオンメンバーに共通のプロパティ（「タグ」となるプロパティ）を持たせて判定する(タグ付きユニオン型による型ガード)

```tsx
interface Square {
  kind: "square";
  size: number;
}

interface Rectangle {
  kind: "rectangle";
  width: number;
  height: number;
}

interface Circle {
  kind: "circle";
  radius: number;
}

type Shape = Square | Rectangle | Circle;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "square":
      return shape.size * shape.size;
    case "rectangle":
      return shape.width * shape.height;
    case "circle":
      return Math.PI * shape.radius * shape.radius;
    default:
      // ここに来ることはないが、型チェックのためにdefaultケースを追加
      return assertNever(shape);
  }
}

function assertNever(x: never): never {
  throw new Error(`Unexpected object: ${x}`);
}

const mySquare: Square = { kind: "square", size: 10 };
const myRectangle: Rectangle = { kind: "rectangle", width: 10, height: 20 };
const myCircle: Circle = { kind: "circle", radius: 5 };

console.log(getArea(mySquare));    // 出力: 100
console.log(getArea(myRectangle)); // 出力: 200
console.log(getArea(myCircle));    // 出力: 78.53981633974483
```

## satisfies

- 型推論の結果を保持したまま、その値と式が特定の型と一致するかどうかを確認できる

```tsx
type Person = {
  name: string;
  age: number;
};

// `john`オブジェクトは `Person`型を満たす必要があるが、プロパティの型は推論されたまま
const john = {
  name: "John Doe",
  age: 25,
} satisfies Person;
```

分かりにくいので`as` を使用した例

tasteはProperty 'taste' does not exist on type 'Fruit'となりany型となってしまう

```tsx
type Fruit = {
  name: string;
  color: string;
};

const apple = {
  name: "Apple",
  color: "red",
  taste: "sweet", // Fruit型には存在しないプロパティ
} as Fruit;
// この場合はtasteはProperty 'taste' does not exist on type 'Fruit'となりエラー
```

しかし、`satisfies` を使用すると型推論が保持するため、string型としてコンパイラには認識される

```tsx
type Fruit = {
  name: string;
  color: string;
};

const apple = {
  name: "Apple",
  color: "red",
  taste: "sweet", // Fruit型には存在しないプロパティ
} satisfies Fruit;

// (property) taste: string
```

satisfiesを使うことで、指定した型を満たしているかどうかのチェックを行いつつ、TypeScriptの型推論を柔軟に活用することができます。as演算子とは異なり、誤ったキャストによる問題を避けつつ、リテラル型の保持や過剰プロパティの利用が可能(リンターなどでは過剰プロパティとして警告などが出るかも)

## 型プリディケート(型述語)

- makeSound関数の中でCatオブジェクトか判定するためのisCat関数をtureで通ったとしても、コンパイラはbooleanが返ることまでしか理解しない。よって下記のように型ガードを使用したとしてもエラーになってしまう

```tsx
interface Cat {
  meow: () => void;
}

interface Dog {
  bark: () => void;
}

function isCat(pet: Cat | Dog): boolean {
  return (pet as Cat).meow !== undefined;
}

function makeSound(pet: Cat | Dog) {
  if (isCat(pet)) {
		// isCatがtureでもエラーとなる
    pet.meow();
  } else {
    pet.bark();
  }
}
```

- 下記のようにisCat関数の戻り値を`pet is Cat` にするとコンパイラはisCat関数の引数がCatだとわかるため、エラーとならずに正しく型ガードを行うことができる

```tsx
interface Cat {
  meow: () => void;
}

interface Dog {
  bark: () => void;
}

function isCat(pet: Cat | Dog): pet is Cat {
  return (pet as Cat).meow !== undefined;
}

function makeSound(pet: Cat | Dog) {
  if (isCat(pet)) {
    pet.meow(); // petがCat型であると推論される
  } else {
    pet.bark(); // petがDog型であると推論される
  }
}
```
