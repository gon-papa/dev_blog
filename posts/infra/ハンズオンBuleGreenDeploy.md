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

## CodeDeployを確認する

ECSのサービスでBlueGreenDeployを選択した場合はDeployの責務はCodeDeployに移る。

よってDeployの設定などはCodeDeployで行うことになる(基本的には自動設定だが、トラフィックの切り替えや、移行後のBlue環境の破棄タイミングなどを調整することができるため確認しておく)

CodeDeploy画面を開き、サイドメニューのでアプリケーションを選択する

![CodeDeploy画面](images/aws_bg_deploy_code_deploy_application.png)

命名はAWSによって自動で作成される。AppECS-クラスター名-サービス名となっている

名前をクリックし、さらに詳細を確認するとデプロイグループが見れる

ここをさらに選択すると詳細画面が表示される

ここでは

デプロイタイプ: Blue/Green

サービスロール: AWSCodeDeployRoleForECS(IAMで作成したロール)

デプロイ設定: CodeDeployDefault.ECSAllAtOnce

など設定が見れる。

さらに細かく見ていくために編集をクリックする。

一番下までスクロールするとデプロイ設定があるはずである

トラフィックの再ルーディング->これはBlueとGreenのトラフィックの切り替えタイミングを設定することができる。

すぐにトラフィックを再ルーディングが選択されているが、一旦、タイミング指定を選択する。

![CodeDeploy設定画面](images/aws_bg_deploy_code_deploy_setting.png)

最大2日間再ルーディングするタイミングを指定できる。

この後、BlueGreenDeployを確認するため、1hを選択

元のリビジョン終了は移行後のBlue環境の破棄タイミングである。

これも1hを選択して、変更の保存をクリックする

## ECRの準備を行う

ECRとはAWSのイメージレジストリである

タスク定義でイメージのURIを設定したが、ECRを選択することが可能である。

こうすると自身で作成したイメージをECRにpushすることでタスクの更新が走り、デプロイが自動で行われるようになる

ここでは、nginxの新たなイメージを作成し、ECRにpushを行い、CodeDeployを確認しながら、BlueGreenDeployやロールバックなどを確認するための準備を行なっていく

ECRを検索し、機能欄のリポジトリを選択

ECRにはプライベートリポジトリとパブリックリポジトリが存在する。

基本的には外部に公開する必要のないケースはプライベートリポジトリにすれば良い。

プライベートリポジトリを選択して、リポジトリの作成を行う

リポジトリ名: my-app-nginx

を入力したら作成をクリック

ECRの準備は完了

## imageの作成

ディレクトリを作成し、下記のファイルを設置していってください。

/html/index.html

```html
<html>
    <head>
        <meta charset="utf-8">
        <title>タイトル</title>
    </head>
    <body>
        Hello World!
    </body>
</html>
```

/Dockerfile

```
FROM nginx:1.25.3

COPY /html /var/www
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

/nginx.conf

```
server {
    listen 80;

    location / {
        root /var/www;
        index index.html index.htm;
    }
}
```


ここまで作成できたら、Dockerfileのある階層のディレクトリ内でターミナルからコマンドを叩く

```shell
docker image build . --tag=bg-image
```

これでイメージが作成される

タグがついたイメージが存在するかを確認する

```shell
docker image list

# 表示結果
REPOSITORY                                                       TAG         IMAGE ID       CREATED        SIZE
test-image                                                       latest      54c25c1eb50a   4 days ago     274MB
```

イメージが作成されていることを確認したらローカルで一度確認をする

```shell
docker container run -p 8080:80 test-image
```

nginxが起動され、localhost:8080にアクセスをするとHello World!が表示されているはずである。


## AWS CLIのインストール

[公式インストール手順](https:/docs.aws.amazon.com/ja_jp/cli/latest/userguide/getting-started-install.htmlhttps://)

基本的に公式インストール手順のAWS CLIのインストールと更新の手順から適したOSを選択してインストールすればいい

インストール手順が3つあるため、GUIなのか、PCのユーザーが使用できるようにインストールなのか、今ログインしているユーザーにインストールなのかをユースケースに合わせて選べば良い

選んだらインストール手順をコピペすれば問題なくインストールできるはずです。


## IAMからECRへpushできる権限を持ったユーザーを作成

IAMへ移動し、ユーザーを選択する。

ユーザーの作成を選択し、


ユーザーの詳細を指定

ユーザー名: cli-user

AWSマネジメントコンソールへのアクセス: 不要なのでチェックしない


許可の設定

後ほど設定

ユーザーの作成をクリックでユーザーの作成

ユーザーの作成が完了したら、ユーザーの詳細画面へ遷移して、許可ポリシー(インラインポリシーを作成)を追加する

[公式参考](https://docs.aws.amazon.com/ja_jp/AmazonECR/latest/userguide/image-push-iam.html#:~:text=%E6%AC%A1%E3%81%AE%20IAM%20%E3%83%9D%E3%83%AA%E3%82%B7%E3%83%BC%E3%81%AF%E3%80%81%E3%81%99%E3%81%B9%E3%81%A6%E3%81%AE%E3%83%AA%E3%83%9D%E3%82%B8%E3%83%88%E3%83%AA%E3%81%AB%E3%82%A4%E3%83%A1%E3%83%BC%E3%82%B8%E3%82%92%E3%83%97%E3%83%83%E3%82%B7%E3%83%A5%E3%81%99%E3%82%8B%E3%81%9F%E3%82%81%E3%81%AB%E5%BF%85%E8%A6%81%E3%81%AA%E3%82%A2%E3%82%AF%E3%82%BB%E3%82%B9%E8%A8%B1%E5%8F%AF%E3%82%92%E4%BB%98%E4%B8%8E%E3%81%97%E3%81%BE%E3%81%99%E3%80%82)

権限設定は下記のようにした

ポリシー名： ECRPushImage

```shell
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "Statement1",
			"Effect": "Allow",
			"Action": [
				"ecr:CompleteLayerUpload",
				"ecr:GetAuthorizationToken",
				"ecr:UploadLayerPart",
				"ecr:InitiateLayerUpload",
				"ecr:BatchCheckLayerAvailability",
				"ecr:PutImage"
				"ecr:GetDownloadUrlForLayer", # 公式に足りないpull権限
				"ecr:BatchGetImage", # 公式に足りないpull権限
			],
			"Resource": "*" # ここが気になる場合は、もっと厳密化すること
		}
	]
}
```


## ユーザーのアクセスキーを取得

先ほど作成したユーザーをユーザー一覧から選択して詳細画面に遷移

セキュリティ認証情報を選択してアクセスキーを作成をクリック

ユースケース: コマンドラインインターフェース(CLI)を選択

次へを選択し、アクセスキーを作成

**アクセスキーとシークレットアクセスキーはメモかcsvをダウンロードしておくこと(この画面から離れるとシークレットアクセスキーは見れなくなる)**


## AWS CLIの設定

[公式情報](https://docs.aws.amazon.com/ja_jp/cli/v1/userguide/cli-authentication-user.html#:~:text=configure%20%E3%81%AE%E4%BD%BF%E7%94%A8-,aws%20configure%20%E3%81%AE%E4%BD%BF%E7%94%A8,-%E4%B8%80%E8%88%AC%E7%9A%84%E3%81%AA)

公式情報に則って進める

ターミナルから下記コマンドを叩く

```shell
aws configure
```

下記のように質問されるので、アクセスキー、シークレットアクセスキー、デフォルトリージョン(ap-northeast-1)、デフォルトアウトプットフォーマット(json)とする

AWS Access Key ID [None]: `<code class="replaceable">AKIAIOSFODNN7EXAMPLE</code>`
AWS Secret Access Key [None]: `<code class="replaceable"><span>wJalrXUtnFEMI</span>/K<span>7</span>MDENG/bPxRfiCYEXAMPLEKEY</code>`
Default region name [None]: `<code class="replaceable"><span>us</span>-west-<span>2</span></code>`
Default output format [None]: `<code class="replaceable">json</code>`

この設定はどこに保存されるのかというと、

/Users/ユーザー名/.aws配下に保存される

credebtialsにアクセスキーとシークレットアクセスキー

congifにデフォルトリージョンとデフォルトアウトプットフォーマット

が記録される

ここまででpushの準備が整った形となる


## ECRにimageのpush

マネジメントコンソールからECRの作成したリポジトリを選択し、リポジトリ名を選択して、詳細画面に遷移する。

右上にプッシュコマンドを表示ボタンが存在しているため、ここからOSを選択し表示されているコマンド通りにコンソールに打ち込んでいく

認証(例なのでコピペしないでください)

```shell
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin xxxxxx.dkr.ecr.ap-northeast-1.amazonaws.com
```

dockerのimageのビルド(**platformを入れてビルドすること->ビルドOSに左右されないようにする**)

```shell
docker build --platform linux/x86_64 -t my-app-nginx
```

イメージのタグ付け

```shell
docker tag my-app-nginx:latest xxxxxxxx.dkr.ecr.ap-northeast-1.amazonaws.com/my-app-nginx:latest
```

イメージのpush

```shell
docker push xxxxx.dkr.ecr.ap-northeast-1.amazonaws.com/my-app-nginx:latest
```

これでマネジメントコンソールに戻り、更新をするとimageがpushされていることが確認できる


## BuleGreenデプロイを実施する

ECSからタスク定義を更新して、デプロイを行なっていく。

ECSのタスク定義からmy-app-nginxを選択して新しいリビジョンの作成をクリックする

ここではコンテナ -1のイメージURIを変更する。

現状ではAWSのnginxイメージが入っているが、ここを先ほどpushしたECRのURIに置き換える

サイドメニューからリポジトリをクリック(別タブで開きます)

そこからmy-app-nginxを選択->latestからイメージのURIをコピー

ECSのタスク定義に戻って、コピペする

作成をクリック

リビジョン番号がインクリメントされたタスク定義が作成されていればOK


クラスター->クラスター詳細(my-app-cluster)->サービス->サービス詳細(my-app_nginx-service)をクリックして右上のサービスを更新を選択する

タスク定義のリビジョン: 先ほど作成したタスク定義の最新リビジョン番号を指定

デプロイオプション(必須項目が勝手に表示される)

アプリケーション名: CodeDeployで確認した名前を選択(1つしか出ないと思います)

デプロイグループ名: アプリケーション名を入力すると自動反映

デプロイ設定: アプリケーション名を入力すると自動反映

更新をクリック

下記画像のCodeDeployのデプロイが作成されました。のバーのIDがリンクになっているのでクリック(中身を見てみます)

![CodeDeployバー](images/aws_bg_deploy_service_update.png)

画面を遷移すると下記の画像の画面になる(数分待機後なのでstep3になっている)

![CodeDeployステータス](images/aws_bg_deploy_code_deploy_status.png)

ステップ3で止まっているのは、CodeDeploy設定で1時間トラフィックの切り替えを待機させているからである

ここで、ECSのクラスター→サービス→タスクを確認すると2つのタスクが起動中なのがわかる

それぞれのパブリックIPにアクセスするとnginxのデフォルト画面とHello Worldの画面がそれぞれに表示されているのがわかると思う。

要は変更前(Blue)と変更後(Green)環境ができている状態となる。

またロードバランサーからロードバランサーのDNSをコピーしてアクセスすると、80番ポートはnginxデフォルト画面、9000番ポートはHello World画面とこちらも2つアクセスできることがわかると思う。

ここで、CodeDeployに戻り、トラフィックの再ルーディングを行う

すると、ロードバランサーのDNSは80番がnginxのデフォルト画面からHelloWorldに切り替わり、トラフィックが変わったのがわかる。


この時にはまだCodeDeployのデプロイを停止してロールバックを選択すればデプロイ前の状態に戻る

理由としてはCodeDeployのステップが4で待機になっているはずである。これはBlue環境の破棄までの時間である。現状はまだ、Blue環境を破棄していないため、トラフィックを戻すだけで、ロールバックは簡単にできる状態なのである。

ここからBlueの破棄を行うには、元のタスクセットの終了をクリックする。

こうするとBlue環境は完全に破棄され、起動タスクも1つになるのがわかるはずである。

さらにCodeDeployのステップも全て完了する。

仮にBlue環境を破棄後に戻したい場合はサービスを編集してリビジョンを下げれば対応できるはずである

## お掃除

コストが無駄にかかってしまうので課金対象のお掃除を行う

* ALBを削除(EC2からロードバランサーで作成したロードバランサーを選択して削除)
* CloudFormationからサービス名が入ったものを選択して削除(多分、上にあると思います。CloudFormation(IaC)を内部的にAWSが勝手に使っているため、ここを削除すればECSの要素をあらかた削除できます。)
* ECRリポジトリのイメージを削除する(イメージのサイズで課金されてしまうため)

ここまで削除すれば課金はされないはずです。心配な方は、その他も全て消してください。

これで以上になります！

お疲れ様でした！！！
