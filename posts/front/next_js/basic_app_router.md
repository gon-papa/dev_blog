---
id: de026472-c3b3-4b06-94b4-8829ab2eaf24
title: Next.js ルーディング基礎
date: '2025-04-02'
tags:
  - Next.js
---

## PJ作成

コマンドを打てば対話的にPJの設定が可能となる

```tsx
npx create-next-app@latest
```

## ディレクトリ構成
| ディレクトリ名 | 説明 |
|:-:|:-:|
| src | アプリケーションのソースフォルダ(オプションで使用しない場合はapp) |
| public | 静的アセット |
| node_modules | ライブラリ群 |


ファイル
| ファイル名 | 説明 |
|:-:|:-:|
| [next-config-js](https://ja.next-community-docs.dev/docs/app-router/api-reference/next-config-js/) | Next.js の設定ファイル |
| package.json | プロジェクトの依存関係およびスクリプト |
| .eslintrc.json | ESLint の設定ファイル |
| .next-env.d.ts | Next.js の TypeScript 定義ファイル |
| tsconfig.json | TypeScript 用の設定ファイル |

## ルーディング

src/appのディレクトリ構成がそのままURLとなる

例：

```tsx
/my-next-app
|-- /app
    |-- /about
        |-- page.tsx
    |-- /blog
        |-- /[slug]
            |-- page.tsx
    |-- /contact
        |-- page.tsx
    |-- /page.tsx
```

•	**/app**: ルートディレクトリ。ここに配置されたファイルがページルートとして使用される。

•	**/about/page.tsx**: /aboutに対応するページ。

•	**/blog/[slug]/page.tsx**: 動的ルーティングで、ブログの各記事に対応するページ。

•	**/contact/page.tsx**: /contactに対応するページ。

•	**/page.tsx**: ルートURL（/）に対応するホームページ。

[]や()でディレクトリ名を囲うことで特殊な動きができる

### 動的ルート

- ディレクトリ名を[]で囲うと動的ルーディングが使用できる。任意パラメータをURLから取得可能となる

```tsx
/app
|-- /products
    |-- /[id]
        |-- page.tsx
```

/products/123 にアクセスすると、[id] の値が 123 になる

### **複数キャッチオールルート**

- URLの残りの部分を配列で取得

```tsx
/app
|-- /docs
    |-- /[...slug]
        |-- page.tsx
```

/docs/guide/introduction にアクセスすると、[...slug] の値が ['guide', 'introduction'] になる。

### **オプショナルキャッチオールルート**

- URLパラメータが存在しない場合に使用する

```tsx
/app
|-- /blog
    |-- /[[...slug]]
        |-- page.tsx
```

/blog にアクセスすると、[[...slug]] の値が [] になるが、	/blog/post/first-post にアクセスすると、[[...slug]] の値が ['post', 'first-post'] になる

### グループ化

ディレクトリ名を()で囲うとページをグループ化できる。URL構造としては()のついた部分は無視される。

- グループ内の共通レイアウトや複数のページやコンポーネントをグループにして、コード整理する場合に使用できる

```tsx
/app
|-- /(dashboard)
    |-- /settings
        |-- page.tsx
    |-- /analytics
        |-- page.tsx
|-- /about
    |-- page.tsx
```

settings と /analytics はグループ化されているが、URLに/dashboardは含まれない。/aboutは(dashbord)の外側のため、グループには含まれない。

### プライベート化(除外)

ディレクトリ名の前に_をつけることで、ディレクトリ内の全ての子ディレクトリをルーディングから除外できる
