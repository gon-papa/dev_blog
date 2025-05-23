---
id: d069f6d5-7be8-04e0-d7f8-0ab717449733
title: BlueGreenデプロイ環境をハンズオンで作成してみる
date: '2025-05-24'
tags:
  - AWS
  - ECS
  - コンテナオーケストレータ
  - ハンズオン
---
# BuleGreenデプロイをハンズオンで作成してみる

BlueGreenデプロイとは？

通常、アプリケーションをデプロイする際は下記の流れで行う

```
デプロイ対象サーバーへのアクセスを遮断→デプロイ作業→アクセス再開
```

そのため、ダウンタイムが発生する。

一方、BuleGreenデプロイはダウンタイムなしでデプロイを行うことができる。

現行環境をBule環境

新バージョン環境をGreen環境

として、2つの環境を用意し、Green環境に問題がなければトラフィックをBuleからGreenへ切り替える

こうすることにより、アクセス先が変更されるだけでシステムを止める必要がないため、ダウンタイムが0になる。

またGreen環境をリリース前にテストすることもでき、より安定したデプロイが可能になる。

(徐々にデプロイ済みのサーバーへ切り替えていくローリングアップデートという方法もあるが、詳しくは解説しないこととする)

## BuleGreenデプロイとローリングアップデートのメリデメ比較

### BuleGreen

メリット

* ダウンタイムの最小化
* ロールバックの容易性
* 安全なテスト環境

デメリット

* コスト増加(BlueとGreenの環境分、コストがかかる)
* 管理の複雑さ

### ローリングアップデート

メリット

* 段階的なデプロイが可能
* リソースの効率的な利用(徐々に切り替えるため不要なリソースは使用しない)

デメリット

* ロールバックの複雑さ

## BlueGreenデプロイ環境をECS+FargateとALBで作成してみる

### 概要

順番に手順の概要を書いていく

**1.初期状態**

本番環境:80 User->http:80->ALB(TargetGroup)->Blue環境

テスト環境: 9000 http:9000->ALB(TargatGroup)->Blue環境

ユーザーがhttpでBule環境に接続し、アプリケーションを利用している状態である。(ロードバランサの行き先をまとめたグループ設定をターゲットグループとしてAWSに設定する)

ターゲットグループはBule環境をさしており、ECSのサービスを指定してある。

**2.Green環境の準備**

Green環境がECSで新たに作成される。

本番環境:80 User->http:80->ALB(TargetGroup)->Blue環境

テスト環境: 9000 http:9000->ALB(TargatGroup)->Green環境

ここでテストやヘルスチェックを行い、問題がなければ次のステップへ進む。

この際にテストやヘルスチェックは手動、自動でも行え、次のステップへ進むタイミングも任意(もちろん自動も)に設定可能である。

**3.トラフィックの切り替え**

ターゲットグループを変更し、ロードバランサのトラフィックをBule->Greenへ切り替える

本番環境:80 User->http:80->ALB(TargetGroup)->Green環境

テスト環境: 9000 http:9000->ALB(TargatGroup)->Green環境

デプロイはトラフィックを切り替えれば完了となる。

**4.Green環境で問題なければBule環境の破棄**

デプロイは完了しているため、問題がなければBule環境は破棄する。

コストもこの間は2倍かかることになるため、破棄するまでの時間はコストとのバランスを考え検討すること

もしロールバックが必要な場合はすぐに戻すことができるが、破棄してしまった場合には、再度BlueGrenデプロイをはじめから行う必要がある。この場合は、今の環境がBlueとなり、新たにGreen環境を用意することになる。

ここからハンズオンを行っていくが、

[ECSをハンズオンで作成してみる](https://pengineer.jp/blog/d069f6d5-7be8-04e0-d7f8-0ab717449723)

の環境は作成しておいてください。

## AZ違いのSubnetをもう一つ作成する

現在、ECSハンズオン後であれば、Subnetはpublucとprivateの2つが存在しているはず。

今回はpublicのサブネットをもう一つ追加していく。

Subnet-3 10.0.2.0/24

を作成し、AZはap-northeast1-cとする。(前に作成したものは1-aとなっているはず)

またルートテーブルも作成し、IGWのアタッチも行っておくこと。

## セキュリティグループの作成

EC2->セキュリティグループを選択する。

ここで一般ユーザー向けの80番ポートの許可とテスター向けの9000番ポートの設定を行う。

(テスター向けは0.0.0.0/0としてしまうと公開されてしまうため、自分のIPアドレスを設定することが望ましい。/32で完全一致としてください。)

![セキュリティグループ](images/aws_bg_deploy_security_group.png)

(警告が出ているが、一般ユーザー向けへ全IPアドレスを解放する必要があるため問題ない)


## ターゲットグループの作成






## ALBの準備

アプリケーションロードバランサーを準備する。

EC2->ロードバランサ->ロードバランサの作成を選択->アプリケーションロードバランサを選択


ロードバランサ名: my-app-alb
