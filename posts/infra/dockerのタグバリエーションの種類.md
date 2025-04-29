---
id: 6788995b-50d2-cef0-f7c4-e615bd45ccf1
title: タグバリエーションの種類
date: '2025-04-26'
tags:
  - Docker
---

imageのタグバリエーションとしてslimやらbullseyeやらついてるけど、忘れるので忘備録として残します。

[Using Docker Official Images](https://docs.docker.com/trusted-content/official-images/using/)

## 大まかな種別
### slim

- 一般的に使用頻度の低いパッケージが除外された軽量image
- マルチステージビルドの最終段階のベースイメージとして使用するケースなどがある

### Alpine

- AlpineLinux distributionで小さくシンプルでこちらも通常必要なパッケージのみをインストールしてある。silimよりもさらに軽量なケースが多く、Gitやbashなどもない方が多い
- C言語の共通ライブラリに通常のコンテナと差異があり、多くのLinuxディストリビューションはglibcを採用しているが、肥大化防止のためmuslを使用している。よってアプリケーションが動かないケースもありうるので注意が必要。これが元で避けられるケースも。。。

### **Distroless**

- Googleがメンテしている。
- パッケージマネージャーやシェルなどもない超軽量イメージで必要最低限の依存関係のみインストールしてある
- glibcを採用している(Alpineの代わりに採用するケースも多い)

## Debian系のイメージ

Debian系のイメージはトイストーリーのキャラクターのような命名が採用されている(バージョン名である。bookwormやらbullseyeなど)

[Debianのバージョン履歴](https://ja.wikipedia.org/wiki/Debianのバージョン履歴)

## Ubuntu系のイメージ

形容詞動物」の形をとっている

[Ubuntuのバージョン履歴](https://ja.wikipedia.org/wiki/Ubuntuのバージョン履歴)


## 最後に
これで大体、わかるかと思います。

何かあれば追記していきます。
