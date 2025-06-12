---
id: 6cd82051-f259-3ede-7688-c40c81a53cb8
title: Terraformの基本構文
date: '2025-06-03'
tags:
  - IaC
  - terraform
---
# Terraformの基本構文

TerraformではHCL2というTerraformの独自構文が用いられる。

その基本構文についてまとめていく

jsonに似ているが、

* 簡単にプログラム(繰り返し、変数、定数などが使用できる)を作成できる
* コメントが書ける
* keyとvalueがコロンではなくイコールで指定
* ヒアドキュメントが利用できる

基本的な構成は下記の通りである

[Terraform言語について](https://developer.hashicorp.com/terraform/language#about-the-terraform-language:~:text=%E3%81%8F%E3%81%A0%E3%81%95%E3%81%84%E3%80%82-,Terraform%E8%A8%80%E8%AA%9E%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6,-Terraform%E8%A8%80%E8%AA%9E%E3%81%AE)

```tf
<block_type> "<label_1>" "<label_2>" {
  key = value
  nested_block {
    ...
  }
}
```

早速、構成要素を見ていく

## HCLの構成

HCL言語はブロックという単位から構成される

下記の定義ある場合はproviderやresourceという単位がブロックである(ブロックの入れ子も存在する)

```tf
provider "aws" {
  region  = "ap-northeast-1"
  profile = "admin" # SSOでログインしたプロファイル名
}

resource "aws_instance" "hello-world" {
  ami = "ami-0c1638aa346a43fe8"
  instance_type = "t2.micro"

  subnet_id = "subnet-0d6271c9f83a42751"
}
```

## ブロックタイプとラベル

先ほどのproviderやresourceなどのブロックの先頭に記載してあるものをブロックタイプという

またブロックタイプごとに決まったラベルを与えることができる

下記は代表的なブロックタイプをまとめたものである


| ブロック形式  | 構文例                                     | ラベルの意味                                                                      | 用途                                          |
| --------------- | -------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------- |
| `provider`    | `provider "aws" { ... }`                   | `"aws"`: プロバイダ名（ラベル1）                                                  | クラウドプロバイダの設定（AWS、GCPなど）      |
| `resource`    | `resource "aws_instance" "web" { ... }`    | `"aws_instance"`: リソースタイプ（ラベル1）<br>`"web"`: インスタンス名（ラベル2） | 実際のリソース（EC2、S3など）の作成           |
| `module`      | `module "vpc" { ... }`                     | `"vpc"`: モジュールインスタンス名（ラベル1）                                      | 再利用可能な構成の呼び出し                    |
| `data`        | `data "aws_ami" "latest" { ... }`          | `"aws_ami"`: データソース名（ラベル1）<br>`"latest"`: インスタンス名（ラベル2）   | 既存の読み取り専用データの参照                |
| `variable`    | `variable "region" { ... }`                | `"region"`: 変数名（ラベル1）                                                     | 変数の定義（外部から値を受け取る）            |
| `output`      | `output "instance_id" { ... }`             | `"instance_id"`: 出力名（ラベル1）                                                | 実行後に表示する出力値の定義                  |
| `locals`      | `locals { name = "web" }`                  | （ラベルなし）                                                                    | ローカルスコープでの再利用変数の定義          |
| `terraform`   | `terraform { required_providers { ... } }` | （ラベルなし）                                                                    | Terraformの全体設定（バージョン、プロバイダ） |
| `backend`     | `backend "s3" { ... }`（terraform内）      | `"s3"`: バックエンド種別（ラベル1）                                               | ステートファイルの保存先設定（S3、localなど） |
| `provisioner` | `provisioner "remote-exec" { ... }`        | `"remote-exec"`: プロビジョナータイプ（ラベル1）                                  | EC2などでのコマンド実行                       |
| `lifecycle`   | `lifecycle { prevent_destroy = true }`     | （ラベルなし）                                                                    | リソースの挙動制御（削除防止など）            |
| `dynamic`     | `dynamic "ingress" { ... }`                | `"ingress"`: 動的に生成するブロック名（ラベル1）                                  | 動的に繰り返しブロックを生成                  |

## ブロックにおける引数

ブロックタイプに対して引数を渡すことができる

下記の形式で引数を渡していく

```tf
key = value

# 例
resource "aws_instance" "hello-world" {
  ami = "ami-0c1638aa346a43fe8" # 引数
  instance_type = "t2.micro" # 引数

  subnet_id = "subnet-0d6271c9f83a42751" 引数
  tag = { # マップ型の引数
    name = "test"
  }
}
```

基本的には引数のキーは

* スネークケース
* 英小文字、数字、アンダースコアを使用
* 引用符で囲まない

これらが推奨されている

記述があったかあやふやだが下記にスタイルガイドのリンクを置いておく

[スタイルガイド](https://developer.hashicorp.com/terraform/language/style)

## 値の型

下記が値の方となる

[Terraformの型](https://developer.hashicorp.com/terraform/language/expressions/types)


| 型（Type） | 書き方例                           | 説明                                                     | 使用例                                 |
| ------------ | ------------------------------------ | ---------------------------------------------------------- | ---------------------------------------- |
| `string`   | `"example"`                        | 文字列型。ダブルクオート(シングルでもOK)で囲む           | `ami = "ami-12345678"`                 |
| `number`   | `123`, `3.14`                      | 数値型（整数・小数）                                     | `instance_count = 2`                   |
| `bool`     | `true`, `false`                    | 真偽値型                                                 | `enable_dns = true`                    |
| `list`     | `["a", "b", "c"]`                  | 同じ型の値の順序付きリスト                               | `cidr_blocks = ["0.0.0.0/0"]`          |
| `tuple`    | `["a", 1, true]`                   | 型が異なる値の順序付きリスト（型順序を固定）             | `output = ["abc", 123, false]`         |
| `map`      | `{ key1 = "val1", key2 = "val2" }` | キーと値のペアのコレクション（値の型は同じでなくても可） | `tags = { Name = "web", Env = "dev" }` |
| `object`   | `{ name = string, port = number }` | 特定の構造をもつマップ型、フィールド名・型を定義         | 変数や出力の型指定に使用               |
| `set`      | `toSet(["a", "b", "c"])`           | 重複のない値の集合。順序は保証されない                   | `allowed_ips = toSet(["1.1.1.1"])`     |
| `null`     | `null`                             | 明示的に値なしとする                                     | `description = null`                   |

## localsとvariablesブロック

HCLで利用可能な変数である


| 種類      | 説明                                                                               |
| ----------- | ------------------------------------------------------------------------------------ |
| locals    | ローカル変数であり、プライベートな変数で外部から変更できない                       |
| variables | 外部から変更可能な変数であり、コマンドラインのオプションやファイル指定で上書き可能 |

### locals定義方法

localsブロックで宣言を行い、`${local.<NAME>}`で参照できる(外部から変更は不可)

```tf
locals {
  env = "dev"
}

<block_type> "<label_1>" "<label_2>" {
  tags {
    env = "${local.env}"
  }
}
```

### variables定義方法

variableブロックで宣言を行い、`${var.<NAME>}`で参照できる(外部からの変更は可能)

宣言にはラベルを必要とし、ラベルには変数名を用いる

内部では型(値の型を参照してください)とデフォルト値を設定可能

```tf
variables "env" {
  type = string
  default = "dev"
}

<block_type> "<label_1>" "<label_2>" {
  tags {
    env = "${var.env}"
  }
}
```

### 変数の上書き方法

1. 環境変数を使って上書きする
2. 変数ファイルを使って上書きする
3. コマンド引数を使って上書きする

この3種類の変更方法がある

上書き順は環境変数<変数ファイル<コマンド引数(同種の値であれば後勝ち)という形で右に行くほど、優先される

### 使い分けは？

環境変数

・実行ログに残らないため、鍵情報や環境依存情報などを設定する際に使用する。(tfstateに残ってしまう可能性はあるため注意)

変数ファイル

・git管理できるため、記録に残せる。プロビジョンとデータを切り離して管理することで変更しやすいソース管理ができる

コマンド引数

・実行ログに残るため、テストやデバッグで一時的に変更したい場合に利用

#### 環境変数を使用した場合

```tf
variables "hoge" {
  type = string
  default = "None"
}
```

環境変数を設定し実行=>この際に変数が環境変数によって上書きされる。`TF_VAR_変数名=値`で上書き可能

```tf
export TF_VAR_hoge="hoge_hoge"

terraform apply
```

#### 変数ファイルを使用した場合

```tf
variables "hoge" {
  type = string
  default = "None"
}

```

変数ファイルを用意する

terraform.tfvars

tfvars拡張子のファイルを用紙する

```tf
hoge = "hoge_hoge"
```

コマンド実行

```bash
terrafrom apply
```

#### コマンド引数を使用した場合

コマンドに`var`オプションを指定して実行する

```bash
terraform apply -var hoge="hoge_hoge"
```

## Terraformブロック

Terraformの設定に関わるブロックである

Terraformの構成は大きく分けて、

* Terraform本体機能
* プロバイダー(AWSやAzure,GCPなどに対応した機能)

に分かれる。

これらは個別にバージョンを持っており、それぞれのバージョン管理や制限が必要になる

主にTerraformブロックではバージョン管理を主として記載することとなる

Terraformのバージョン固定 => required_version

プロバイダのバージョン固定  => required_providers

を用いる

```tf
terraform {
    required_version = "x.x.x" # terraform のバージョンを設定 
  
    required_providers {
        aws = {
        source ="hashicorp/aws" # プロバイダー設定
        version = "x.x.x" # バージョン設定
        }
    }
}
```

### バージョン早見表

| 演算子 | 意味 | 例 | 実際に許可される範囲 |
| ------ | ---- | --- | -------------------- |
| `=` (省略可) | **ピン留め（完全一致）** | `"1.6.4"` | 1.6.4 だけ |
| `!=` | **このバージョンだけ除外** | `">=1.6, !=1.6.2"` | 1.6.0 以上 **かつ** 1.6.2 以外 |
| `>` / `<` / `>=` / `<=` | **上下限** | `">=1.5, <2.0"` | 1.5 以上 2.0 未満 |
| `~>` | **チルダ演算子（悲観的ロック）**<br>右端 1 桁だけ自動追従 | `"~>1.6.0"` | >= 1.6.0 かつ < 1.7.0 |
|  |  | `"~>1.6"` | >= 1.6.0 かつ < 2.0.0 |
| `*` | **ワイルドカード（稀に使用）** | `"1.*"` | 1.x 系すべて |

---

### よくある指定パターン

| 目的 | 書き方 | 例 | 意味 |
| ---- | ------ | --- | ---- |
| **パッチだけ追従** | `~> A.B.C` | `~> 1.6.2` | >= 1.6.2 かつ < 1.7.0 |
| **マイナーまで追従** | `~> A.B` | `~> 1.6` | >= 1.6.0 かつ < 2.0.0 |
| **LTS を複数許可** | OR 条件（複数行） | `"~> 1.6"` <br> `"~> 1.7"` | 1.6.x **または** 1.7.x |
| **完全固定** | `=A.B.C` | `"1.6.4"` | 1.6.4 だけ |

## プロバイダーブロック

プロバイダを使用する際に、リージョンや認証情報の設定などを行う

```tf
provider "aws" {
    region ="ap-northeast-1"
    profile = "admin" # AWSならCLIに設定したプロファイル名を指定できる
}
```

## データブロック

Terraformで管理対象外となっているリソースの参照が可能

リソースによって記載方法が異なるので注意

outputブロックで設定してあるリソースの参照も可能

[もっと詳しめな記事](https://dexall.co.jp/articles/?p=2301#i-0)

```tf
data {}
```

## Outputブロック

作成したリソースの情報を外部から参照できるようにするためのブロック

```tf
resource "aws_instance" "hello-world" {
  ami = "ami-0c1638aa346a43fe8"
  instance_type = "t2.micro"
}

outpur "ec2_instance_id" { # 呼び出し名=>ec2_instance_id
  value = aws_instance.hello_world.id # 出力する値
}
```

## リソース間の参照

HCLでリソースを参照するための記述

```tf
<BLOCK_TYPE>.<LABEL_1>.<LABEL_2>

# ブロックタイプは省略可能なので、通常は下記で呼び出しすることが多そう
<LABEL_1>.<LABEL_2>
```

```tf
# 例えば、vpcのリソースを呼び出したいときは
resource "aws_vpc" "vpc" {
 ...
}

# 必要なブロック内で取得可能
aws_vpc.vpc.id
```

## 終わりに

すごくざっくりと記載しました。

今後はより実践向けの記事を書きたいなと思います。
