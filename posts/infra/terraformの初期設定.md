---
id: d069f6d5-7be8-04e0-d7f8-0ab717449739
title: Terraformの初期設定
date: '2025-06-03'
tags:
  - AWS
  - IaC
  - terraform
---
# Terraformの初期設定

Terraformを利用するにあたり、設定しなければならないものが存在する。

環境としてはM3 Macを使用します。CloudサービスはAWSです。

* Homebrewのインストール(ここはインストール済みの前提とします)
* AWSアカウント(ここは今回作成済みの前提とします)
* AWS Identity Centerの設定とSSOによるコンソールログイン(ここは今回設定済みの前提とします)
* AWS CLIによるSSOログイン(ここは今回設定済みの前提とします)
* terraformのインストール(ここを記載していく)

## Terraformのバージョンマネージャーの導入

まずは、TerraformのバージョンマネージャーであるtenvをHomebrewを使用してインストールしていく

共同署名チェック(共同署名チェックを有効にする必要がある場合)を有効にする必要がある場合はcosignをインストールする

[tenvリポジトリ](https://github.com/tofuutils/tenv#:~:text=%E3%81%AF%E3%81%98%E3%82%81%E3%82%8B,-%E5%89%8D%E6%8F%90%E6%9D%A1%E4%BB%B6)

```bash
brew install  cosign
```

```bash
brew install tenv
```

これでtenvのインストールは完了です。

### バージョン指定

設定できるバージョンの一覧を取得します。

```bash
tenv


  Which tool do you want to manage ? # terraformを選択するとダウンロード可能なバージョン一覧が見れる

[ ] tofu
[ ] terraform
[ ] terragrunt
[ ] terramate
[ ] atmos

# terraformを選択すると下記のように表示される
  Which Terraform version(s) do you want to install(I) or uninstall(U) ? (X mark already installed)

[ ] 1.13.0-alpha20250521
[ ] 1.12.1
[ ] 1.12.0
[ ] 1.12.0-rc2
[ ] 1.12.0-rc1
[ ] 1.12.0-beta3
[ ] 1.12.0-beta2
[ ] 1.12.0-beta1
```

なお、インストール済みのものは[X]となっているはずである

好きなバージョンを選択するとインストールされる

もしくはlatestをインストールしたい場合は

```bash
tenv tf install
```

でlatestがインストールされる。installの後にバージョンを指定すれば指定されたバージョンもインストール可能である。

インストール済み一覧を見たい場合は

```bash
tenv tf list

  1.12.1 (never used)
```

で一覧が表示される。

### tenvでterraformのバージョン決定する

基本的には下記の優先順位で使用バージョンが決定される

* TFENV_TERRAFORM_VERSION 環境変数に設定されたバージョン
* .terraform_versionファイルの中に記載されたバージョン(コマンド実行ディレクトリから上へ探索し、最初に見つかったファイルのバージョン)
* コマンドで指定したデフォルトバージョン

コマンドは下記

```bash
tenv tf use デフォルトにしたいバージョン
```

## Terraformの初期化とデプロイ

初めて使用する場合は初期化を行わなければならない。

VPCとサブネットは作成しておいてください。

1. tfファイルを作成
2. initコマンドで初期化
3. planコマンドで実行計画を確認
4. applyコマンドでリソースをデプロイ

上記の順番で作業を進めていく

### 1.tfファイル作成(プロジェクトを作成)

まず適当にディレクトリを作成し、main.tfを作成する(下記はEC2を作成例)

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

### ２.initを行う

先ほど作成したディレクトリ階層で初期化を実施

```bash
terraform init
```

すると.terraformディレクトリと.terraform-provider-aws_v~のようなバージョンファイルが作成されたはずである。

これで初期化はOK(初期化は初めてterraformで作業をする場合は一度だけ行う)

SSOログインをしていない場合はAWS CLIからログイン実行

```bash
aws sso login --profile your-sso-profile
```

一応、現在の有効ユーザーを確認

```bash
aws sts get-caller-identity
```

使用したいユーザーと違う場合は明示的に指定してあげる

```bash
aws sts get-caller-identity --profile my-sso-admin
```

※providerの設定部分でprofileを使用しているため、基本的にはそこのユーザーが使用されるので恐らくは問題ない



### 3.planを確認する

initが終わったので、planを確認していく

```bash
terraform plan
```

実行計画が表示される

### 4.applyで実行する

applyコマンドで実行をしていく

途中で変更を反映していいかを聞いてくるため、yesを入力

```bash
terraform apply
```

問題なく完了すればAWSのマネジメントコンソールからEC2が構築されているのが確認できる


ここまででterraformの初期設定と開発できる環境は整った

### 最後にお掃除をしておく

destoryコマンドを叩く

こちらも途中で削除していいか聞かれるためyesと入力

```bash
terraform destroy
```

AWSマネジメントコンソールから確認するとEC2が終了済みになっていることが確認できる

また今回作成したVPCとサブネットも削除しておいてください(VPCは課金され続けますので忘れずに！)


以上となります。
