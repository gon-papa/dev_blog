---
id: 6cd82051-f259-3ede-7688-c40c81a53cb6
title: tfStateファイルをS3に保管する
date: '2025-06-12'
tags:
  - IaC
  - terraform
---
# tfstateファイルをS3に保管する
tfstateファイルは実際の環境がterraformの管理下にあるのかを記述している情報が記載されている。個人で運用する分には問題ないが、複数人で運用する際はtfstateファイルのズレが発生する。terraform applyでコードを環境に反映した際にtfstateファイルも更新されるからだ。

そうなると各開発者のローカル環境で統一されたtfstateファイルを運用することは不可能であり、もし運用したとしたら、おそらく環境が壊れる。

GitHubなどのリモートリポジトリ管理も選択肢に入るかもしれないが、これもコンフリクトや機密情報を含む可能性があるため、非推奨の管理となる。

と言ったところで選択肢に入るのがS3での管理である。
ただしここにも注意点があり、Terraform管理対象環境でのS3管理は避けた方が良い。Terraform自身によって環境を変化させてしまう危険性があるからだ。
またS3のみを使用しても今度は同時更新のリスクも出てきてしまう。それらを完全回避するにはDynamoDBを使用した排他制御が必要になる。
今回は練習のためTerraform管理環境でS3+DynamoDBを使用した管理を記載していく。

※tfstateファイルの管理が多い、もしくはS3などを使用したくない場合はTerraform Cloudを使用するのが楽かもしれない。
[Terraform Cloud](https://dev.classmethod.jp/articles/terraform_tfstate_management_tfc/)

## 前提
TerraformでAWS環境を変更できること(AWS CLIやterrafrom init済みなこと)

## main.tfを作成
main.tfは下記のように作成しておく。
この後、S3を作成する際に再度編集する。
main.tf
```tf
terraform {
	required_version = "1.12.1"
	required_providers {
		aws = {
			source = "hashicorp/aws"
			version = "5.99.1"
		}
	}
}

provider "aws" {
	region = "ap-northeast-1"
	profile = "admin"
	default_tags {
		tags = {
			Env = var.environment
			Project = var.project
		}
	}
}
```

variables.tf 変数定義
```tf
variable "project" {
	type = string
	description = "プロジェクト名"
}

  

variable "environment" {
	type = string
	description = "環境名"
}
```

terraform.tfvars 変数への値設定
```tf
project = "tfstate-storage"
environment = "prod"
```
## S3を作成
まずは本体を作成する
s3.tfを作成。
バケット名は一意である必要があるため、randomリソースを使用して命名に使用している
```tf
# ランダム値生成
resource "random_string" "s3_unique_key" {
	length = 6
	upper = false
	lower = true
	numeric = true
	special = false
} 

# 本体
resource "aws_s3_bucket" "tfstate_storage" {
	bucket = "tfstate-storage-${random_string.s3_unique_key.result}"
	tags = {
		Name = "${var.project}-${var.environment}-s3"
	}
}
```

S3のバージョニングを有効にする。
こうすることでtfstateの上書きを避けて、ロールバックが可能な状態にできる。(バージョニングを使用しな場合はそのまま上書きされてしまうため、絶対に必要な設定である)
```tf
# バージョニング設定
resource "aws_s3_bucket_versioning" "tfstate_storage" {
	bucket = aws_s3_bucket.tfstate_storage.id
	versioning_configuration {
		status = "Enabled"
	}
}
```

アクセス設定を行う。publicアクセスは認めない設定で作成
```tf
# アクセス設定(publicアクセスをできないようにした)
resource "aws_s3_bucket_public_access_block" "tfstate_storage" {
	bucket = aws_s3_bucket.tfstate_storage.id

	block_public_acls = true # パブリックACLの設定を拒否する
	block_public_policy = true # すでに存在するパブリックACLを無視する
	ignore_public_acls = true # パブリックポリシー（Principal: "*"）の設定をブロック
	restrict_public_buckets = true # パブリックポリシーが存在しても実際のアクセスを制限
}
```

ここまでで一旦、S3の作成は完了である(この後も追記はする)
全体像
```tf
# ランダム値生成
resource "random_string" "s3_unique_key" {
	length = 6
	upper = false
	lower = true
	numeric = true
	special = false
} 

# 本体
resource "aws_s3_bucket" "tfstate_storage" {
	bucket = "tfstate-storage-${random_string.s3_unique_key.result}"
	tags = {
		Name = "${var.project}-${var.environment}-s3"
	}
}

# バージョニング設定
resource "aws_s3_bucket_versioning" "tfstate_storage" {
	bucket = aws_s3_bucket.tfstate_storage.id
	versioning_configuration {
		status = "Enabled"
	}
}

# アクセス設定(publicアクセスをできないようにした)
resource "aws_s3_bucket_public_access_block" "tfstate_storage" {
	bucket = aws_s3_bucket.tfstate_storage.id

	block_public_acls = true # パブリックACLの設定を拒否する
	block_public_policy = true # すでに存在するパブリックACLを無視する
	ignore_public_acls = true # パブリックポリシー（Principal: "*"）の設定をブロック
	restrict_public_buckets = true # パブリックポリシーが存在しても実際のアクセスを制限
}
```

## Key Management Serviceでキーの作成
tfstateファイルにはVPC IDやDBのパスワードなどが含まれる。
そのため、　S3に保存されたtfstateファイルを暗号化しておきたい。
KMSは暗号鍵を安全に生成・管理・利用するためのマネージドサービスであり、これを連携していく。(実際に暗号化と複合化はS3で行う。そのために設定も追加していく)

key.tfを作成する
```tf
resource "aws_kms_key" "tsstate_storage_key" {
	description = "description" # 説明
	deletion_window_in_days = 7 # 削除する際は7日後に削除される
	enable_key_rotation = true # キーのローテションをするか
	tags = {
		Name = "${var.project}-${var.environment}-kms"
	}
} 

resource "aws_kms_alias" "tsstate_storage_key_alias" {
	name = "alias/tsstate_storage_key_alias"
	target_key_id = aws_kms_key.tsstate_storage_key.id
}
```
エイリアスをつける理由として
key-id(uuid)で呼び出しを行わなければならないため、可読性が非常に低い。かつ、エイリアス先は変更できるため、鍵の変更も容易になる。
```
# エイリアスあり
kms_master_key_id = "alias/terraform-tfstate"
# エイリアスなし
kms_master_key_id = "c8cf2cdc-399f-42fa-8b76-c01efff5f855"
```

S3への追記
S3の暗号化設定で先ほどのKMSの鍵を使用するように指定。
s3.tf
```tf
# ランダム値生成
resource "random_string" "s3_unique_key" {
	length = 6
	upper = false
	lower = true
	numeric = true
	special = false
} 

# 本体
resource "aws_s3_bucket" "tfstate_storage" {
	bucket = "tfstate-storage-${random_string.s3_unique_key.result}"
	tags = {
		Name = "${var.project}-${var.environment}-s3"
	}
}

# 省略~~~~~~~~~~

# 追記
# 暗号化設定
resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate_storage" {
	bucket = aws_s3_bucket.tfstate_storage.id
	
	rule {
		apply_server_side_encryption_by_default {
			kms_master_key_id = aws_kms_key.tsstate_storage_key.arn
			sse_algorithm = "aws:kms"
		}
	}
}
```

ここまででS3の準備は完了である。
これでもtfstateファイルは運用可能な状態であるが、複数人で行う際には問題が発生するケースががある。
それは同時に変更を行った場合である。同時変更が記録され、tfstateファイルの中身が壊れてしまう恐れがある。
これを回避するためにDynamoDBを使用し、terraform plan / apply 開始時に DynamoDB からロック取得できるようにする。

## DynamoDBを作成する(v1.10以前)->飛ばしてOK
db.tfを作成する
```tf
resource "aws_dynamodb_table" "tfstate-lock-db" {
	name = "tfstate-lock"
	billing_mode = "PAY_PER_REQUEST"
	
	hash_key = "LockID" # 主キーの名前
	attribute { # 属性定義
		name = "LockID"
		type = "S" # String
	}
}
```

## コマンド実行
terraformコマンドを実行し、S3、KMS、DynamoDBを実施に反映していく
```bash
terraform apply
```

## main.tfに追記を行う
実際にAWS上にリソースが作成されたのを確認したら、main.tfにtfstateファイルの保存先の設定を記載してく
terraformブロックのbackendでtfstateファイルの保存先を指定できる

backendの中では変数や使えないのでハードコーディングをすることになる
main.tf
```tf
terraform {
	required_version = "1.12.1"
	required_providers {
		aws = {
			source = "hashicorp/aws"
			version = "5.99.1"
		}
	}
	# 設定を追記
	backend "s3" {
		bucket = "tfstate-storage-icpnvm"
		key = "state/terraform.tfsstate"
		region = "ap-northeast-1"
		encrypt = true
		kms_key_id = "alias/tsstate_storage_key_alias"
		dynamodb_table = "tfstate-lock"
	}
}
```

記載し終わったら、
```bash
terraform init
```
を行い
```bash
terraform apply
```
をすれば完了である。

## DynamoDBを作成しなくても良くなった！(v1.10以降)
v1.10以降はDynamoDBを用意しなくてもS3単体でロックファイルを作成して、競合を防ぐことができるようになった。
```tf
terraform {
	required_version = "1.12.1"
	required_providers {
		aws = {
			source = "hashicorp/aws"
			version = "5.99.1"
		}
	}
	# 設定を追記
	backend "s3" {
		bucket = "tfstate-storage-icpnvm"
		key = "state/terraform.tfsstate"
		region = "ap-northeast-1"
		encrypt = true
		kms_key_id = "alias/tsstate_storage_key_alias"
		use_lockfile = true # これでOK! DynamoDBを用意しなくても大丈夫！
	}
}
```

use_lockfileをtureに設定するとS3内でterraform apply中はロックファイルが作成されて競合を防いでくれるようになったため、こちらを使用した方がいいです！


CLIアカウントに適切なポリシーをアタッチしていない場合はエラーになるため、エラー内容に従ってポリシーをアタッチしていけば良い。
筆者は
S3への権限、DynamoDBへの権限でエラーになったのを確認できたため、設定を行い無事にtfstateファイルの保存をs3にすることができた。

簡単ではあるが、以上とする。