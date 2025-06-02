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
