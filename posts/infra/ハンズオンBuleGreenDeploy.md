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

まだALBからアクセス先を設定するターゲットグループを作成していないため、作成を行う
まずはEC2->ターゲットグループを選択する。
下記のように設定を行う
ターゲットタイプ: IPアドレス
ターゲットグループ名: my-app-tg-1(後で2も作成する)
プロトコル ポート: HTTP:80
IPアドレスタイプ: IPv4
VPC: my-vpc
プロトコルバージョン: HTTP1
ヘルスチェックプロトコル: HTTP(Green環境を作成した際に各コンテナに対してヘルスチェックを行うために設定)
ヘルスチェックパス: /(ここは自由に設定可能である。ヘルスチェックの詳細設定も可能)

次へをクリックす

ネットワークを選択でmy-vpcを選択
IPを指定してポートを定義する: 削除(BlueGreenデプロイでは自動で紐付けを行うため、ここでは何も設定しない)
ポート: 80
ターゲットは何も無しでOK

ターゲットグループを作成をクリックで完了

## ALBの準備

アプリケーションロードバランサーを準備する。

EC2->ロードバランサ->ロードバランサの作成を選択->アプリケーションロードバランサを選択

**基本的な設定**
ロードバランサ名: my-app-alb

スキーム: インターネット向けを選択
ロードバランサのIPアドレスタイプ: IPv4

**ネットワークマッピング**

VPC: my-vpcを選択

**アベイラビリティーゾーンとサブネット**

ap-notheast-1aにチェックを入れる(ここは以前作成したいたため、自動で表示されているはずなのでチェックを入れる)

サブネット: my-subnet-app-public1-a

ap-northeast-1cにチェックを入れる(これは先ほど作成したもの)

サブネット: my-subnet-app-public1-c

**セキュリティーグループ**

my-app-lb-sgを選択する(80と9000ポートを設定したもの)

**リスナーとルーディング**

プロトコル: HTTP

ポート: 80

デフォルトアクション(転送先): my-app-tg-1(先ほど作成したターゲットグループを選択)

ロードバランサーの作成をクリックして完了

ロードバランサー一覧に戻り、状態を確認する。プロビジョニングからアクティブになったら使用できる状態となる
my-app-albを選択して画面下部のメニューより、リスナーとルールを確認する。
![リスナーとルール](images/aws_bg_deploy_alb_status.png)
ALBはHTTP:80のアクセスを検知し、ターゲットグループである、my-app-tg-1へ100%転送する設定になっているはずである。

ここまでで、User(HTTP:80) -> ALB(HTTP:80) -> ALB(TargetGroup※ここまで) -> ECS(Blue環境※これから作成)の流れができている。

## IAMでCodeDeployのための権限ロールを作成する

BlueGreenデプロイをECSで使用する場合にCodeDeployを使用することになる。

CodeDeployがECSのサービスやタスクを作成、更新、削除などを通じて自動で操作を行うため、ECSを操作する権限をCodeDeployに付与する必要がある。

この権限を作成していく

IAMのメニューを開き、ロールを選択する。

ロールの作成をクリックする。

信頼されたエンティティタイプからAWSのサービスを選択し、ユースケースにCodeDeployを入力する。

そうするとユースケースに選択が新たに追加されるため、CodeDeploy-ECSを選択する。

![ロール作成画面](images/aws_bg_deploy_code_deploy_role.png)

次へを選択すると許可ポリシーが表示されているはずである。(AWSCodeDeployRole)

プラスマークを押して展開して、jsonを見てみると

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "autoscaling:CompleteLifecycleAction",
                "autoscaling:DeleteLifecycleHook",
                "autoscaling:DescribeAutoScalingGroups",
                "autoscaling:DescribeLifecycleHooks",
                "autoscaling:PutLifecycleHook",
                "autoscaling:RecordLifecycleActionHeartbeat",
                "autoscaling:CreateAutoScalingGroup",
                "autoscaling:CreateOrUpdateTags",
                "autoscaling:UpdateAutoScalingGroup",
                "autoscaling:EnableMetricsCollection",
                "autoscaling:DescribePolicies",
                "autoscaling:DescribeScheduledActions",
                "autoscaling:DescribeNotificationConfigurations",
                "autoscaling:SuspendProcesses",
                "autoscaling:ResumeProcesses",
                "autoscaling:AttachLoadBalancers",
                "autoscaling:AttachLoadBalancerTargetGroups",
                "autoscaling:PutScalingPolicy",
                "autoscaling:PutScheduledUpdateGroupAction",
                "autoscaling:PutNotificationConfiguration",
                "autoscaling:PutWarmPool",
                "autoscaling:DescribeScalingActivities",
                "autoscaling:DeleteAutoScalingGroup",
                "ec2:DescribeInstances",
                "ec2:DescribeInstanceStatus",
                "ec2:TerminateInstances",
                "tag:GetResources",
                "sns:Publish",
                "cloudwatch:DescribeAlarms",
                "cloudwatch:PutMetricAlarm",
                "elasticloadbalancing:DescribeLoadBalancerAttributes",
                "elasticloadbalancing:DescribeTargetGroupAttributes",
                "elasticloadbalancing:DescribeLoadBalancers",
                "elasticloadbalancing:DescribeInstanceHealth",
                "elasticloadbalancing:RegisterInstancesWithLoadBalancer",
                "elasticloadbalancing:DeregisterInstancesFromLoadBalancer",
                "elasticloadbalancing:DescribeTargetGroups",
                "elasticloadbalancing:DescribeTargetHealth",
                "elasticloadbalancing:RegisterTargets",
                "elasticloadbalancing:DeregisterTargets"
            ],
            "Resource": "*"
        }
    ]
}
```

これらの許可があればCodeDeployは操作が可能となるため、次へを選択

ロール名: AWSCodeDeployRoleForECS

ロールを作成をクリックして完了となる




## ECSのサービスの作成を行う

ECSのメニューへ遷移し、クラスターを選択する(my-app-cluster)

画面下部のメニューからサービスを選択し、作成をクリックする

**サービスの詳細**

タスク定義ファミリー: 以前作成したmy-app-nginxを選択

タスク定義のリビジョン: 最新のものを選択

サービス名: my-app-service


**環境**

既存のクラスター: 自動選択されているはず

コンピューティング設定: 起動タイプ

起動タイプ: FARGATE

プラットフォームバージョン: LATEST


**デプロイ設定**

サービスタイプ: レプリカ

必要なタスク: 1
アベイラビリティーゾーンの再調整: チェック

デプロイオプション
デプロイタイプ: ブルーグリーンデプロイ(AWS CodeDeployを使用)
デプロイ設定: CodeDeployDefault.ECSAllAtOnce
CodeDeployのサービスロール: AWSCodeDeployRoleForECS(先ほど作成したものを選択)

**ネットワーキング**
VPC: my-vpcを選択
サブネット: my-subnet-app-public1-aとmy-subnet-app-public1-cを選択
セキュリティグループ: 既存のセキュリティグループを選択で、my-app-nginx-sgを選択(コンテナのポート80番を許可したもの)
パブリックIP: オン

**ロードバランシング**
ロードバランシングを使用: チェック
VPC: 自動選択
ロードバランサーの種類: Application Load Balancer
コンテナ: nginx 80:80(以前作成したタスク定義が表示されているはず)
Application Load Balancer: 既存のロードバランサーを選択でmy-app-albを選択

リスナー
プロダクションリスナー: 既存のリスナーを使用でHTTP:80を選択(リスナーとルーディングで作成したものでmy-app-tg-1がターゲットグループとして表示されているはず)

テストリスナー: 新しいリスナーの作成(ここでGreen環境の切り替え前のテストを行うために使用するリスナーを設定する)
テストリスナーポート: 9000
テストリスナープロトコル: HTTP

ターゲットグループ
ターゲットグループ1(リスナーに紐つく): 既存のターゲットグループを選択でmy-app-tg-1を選択
ターゲットグループ2(テストリスナーに紐つく): 新しいターゲットグループの作成
ターゲットグループ名: my-app-tg-2
ターゲットグループ2のプロトコル: HTTP

ここまで設定したら、作成をクリックする。
サービスのデプロイが開始されるため、アクティブになるのを待つ。

アクティブになったら、クラスター->サービス->タスクを見ると、タスクが起動していることが確認できる。
タスクの詳細に記載してあるパブリックIPをブラウザで開くと、nginxのページが表示されるはずである。

ここまででデプロイは完了である。