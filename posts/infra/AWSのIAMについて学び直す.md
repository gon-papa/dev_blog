---
id: c601e3b4-ab16-f1ea-5b87-aa183efa83c0
title: AWS IAMについて学び直す
date: '2025-06-08'
tags:

- AWS
- IAM
---
# AWS IAMについて学び直す

AWSのIAMはユーザーにポリシーをアタッチして、グループにポリシーをアタッチして、ユーザーをグループに設定して、ロールにポリシーをアタッチして...etc
普段、やっているし意味も理解してるけど、ちゃんと学んどこうと思ったので改めてIAMについて記載していきます。

## IAMとは？

IAM(Identity Access Management)の名の通り、誰が(identity),アクセスするのか(access),管理する(management)するAWSサービスである。
要は、ユーザーやAWSリソースなどに対して細かく権限を設定して、認証・認可を行い安全に運用・構築を行うためのアクセス権限管理サービスだと思えば良い

認証- 相手は誰？
認可- リソースへのアクセス許可を行う

ざっくり理解したところで基本的な概念からおさらいしていく

## 基本概念

IAMは主に以下を理解しなければならない

* IAMポリシー
* IAMユーザー
* IAMグループ
* IAMロール

順番に説明していく。

### IAMポリシー

IAMにおける権限設定のルールとなる設定である。

Json形式で定義され(マネジメントコンソールならポチポチしながらJsonを生成することもできる)、

プリンシパル(主体)に対し、どのリソースへ、どのアクションを許可or拒否するのかを記述する。(AWSは基本、デフォルトは拒否である)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow", // 許可or拒否 = 許可(Allow)
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:user/Hoge"  // 主体 = IAMユーザーのHogeさん
      },
      "Action": "s3:GetObject", // どのアクション = s3のオブジェクトの取得
      "Resource": "arn:aws:s3:::example-bucket/*" // どのリソース = S3バケット
    }
  ]
}
```

※ プリンシパルはアイデンティティベースポリシーでは省略される。(アタッチ先が明示的なため)

ポリシーもいくつか種類がある

* **アイデンティティポリシー**はIAMユーザー、IAMグループ、IAMロールなど、誰が何をするかの設定を行う
* **リソースベースポリシー**はS3やLambda関数など、誰に何を許すかの設定を行う

また種類というわけでないが、マネージドポリシー**も存在し、AWSが用意してくれているポリシーを使用することができる(ある程度の使用用途に対して定義済みポリシーが用意してある)

上記の場合はクロスアカウントアクセスを想定して、別アカウントのHogeさんにexample-bucket(S3)のオブジェクトを取得することを許しているポリシーとなっている

### IAMユーザー

AWSアカウント内で個別に作成されるユーザーIDである。各ユーザーはAWSマネジメントコンソール用のパスワードを持ち、必要に応じてAPI/CLI用のアクセスキーなどを発行できる。
IAMユーザーには直接ポリシーをアタッチして権限を付与する(アイデンティティポリシーやマネージドポリシー)
**各IAMユーザーごとに必要最小限のポリシーを関連付けて利用が推奨されている**

### IAMグループ

複数のIAMユーザーをまとめて同じ権限を付与するためにグループを作成し、そこにポリシーをアタッチする。グループにポリシーがアタッチされるとそのグループに属するユーザー全てに権限を共有することができる。例えば、管理者、開発者、閲覧者や部署などに応じて、グループを作成し、ポリシーを割り当てることで一括で権限の管理が可能になる。

### IAMロール

ユーザーではなく役割に対して権限を紐付けることができる。イメージ的にはユーザーなどではなく、AWSサービスや役割に対して一時的にロールを引き受ける(assumeする)ことで権限を借りるために使用したりする。
IAMロールには2通りの用途がある。

1. AWSサービス用ロール – EC2やLambda等のAWSサービスが他のリソースにアクセスするために付与する権限
2. 人間や外部システムが一時利用するロール – ユーザーが一時的に管理者権限ロールを引き受ける場合や、別AWSアカウント/外部IDプロバイダーからフェデレーションログインする際に割り当てる受け皿として使う。

AWSサービス用ロールは、EC2インスタンスに対しS3読み取り専用のロールをアタッチすれば、そのEC2からAWS SDK経由でS3のデータ取得が可能になるなど、サービスに対して権限を付与することである


人間や外部システムが一時利用するロールは、ロールを使うと必要なときだけ一時的な認証情報(STSトークン)が発行されるため、長期キーの曝露を防ぎ安全性が高めることができる

## IAMポリシーについてもう少し深掘りする

前述と被る部分もあるが、IAMポリシーの種類は大きく分けて4つの種類がある

1. アイデンティティベースのポリシー
   ユーザー、グループ、ロールにアタッチしてその主体に権限を与えるポリシーであり、AMユーザーやロールに直接付けるポリシー（インラインポリシーやAWS管理/カスタマー管理ポリシー）が該当する
2. リソースベースのポリシー
   特定のリソースに直接埋め込むポリシーであり、リソース所有者側が誰にそのリソース操作を許可するか定義できます。リソースベースポリシーでは、別アカウントのプリンシパルを直接許可に含めることも可能
3. サービスコントロールポリシー (SCP)
   複数アカウントを束ねるAWS Organizationsで使用するポリシーで、組織やOU（組織単位）に属するすべてのプリンシパルの許可を制限する。SCPで「禁止」されたアクションはたとえ個々のIAMユーザーやロールで許可していても実行できなくなる
4. アクセス許可の境界 (Permission Boundary)
   特定のIAMユーザーやロールに対し「この上限までしか権限を許可しない」という境界を設定する特殊なポリシーである。開発者にカスタムポリシー管理を委任する場合など、許可できる権限の最大値を管理者が制御する用途に使われる

### 許可と拒否の評価

AWSにリクエストが送信されると、IAMは関連するすべてのポリシーを評価してアクセス許可を判断する。この際の評価ルールは


**明示的な拒否＞明示的な許可＞暗黙の拒否**
である

暗黙的な拒否はデフォルトの挙動となっており、何のポリシーにも許可されていないリクエストは自動的に拒否となる(AWSは何かを実行する際は必ず許可が必要となる)

明示的許可は言葉通りで、EffectにAllowステートメントがあれば許可となる。複数のポリシーやステートメントが適応される場合は、OR評価になるため、1つでも許可されていれば、Allow判定となる

明示的な拒否も言葉通りでEffectにDenyが含まれていればその時点で即座に拒否される。評価はそこで終了するため、これが評価ルールの中で一番強いルールとなる


(組織のSCPやリソースベースポリシーが存在する場合、最終的にそのアクションが許可されるには、IAMアイデンティティポリシー・SCP・リソースポリシーなど関係する全てで許可されていなければならない。例えば、IAMユーザーに許可を与えていてもS3バケットポリシーで拒否されていればアクセス不可になり、SCPで禁止された操作はアカウント内の誰にも許可できない)

簡単にまとめるとデフォルトはDenyだし、明示的にDenyがあればそれは揺るがない拒否である。許可するにはAllowを明示的に記載しない限りはDenyが勝つ仕様である。

### ロールの引き受けや渡す処理

ロールは移譲したり、自動付与したりすることができる。

その設定をAssumeRoleとPassRoleが行う。2つの違いを理解して混同しないよう気を付けたい。

### AssumeRole

ロールを引き受ける

* AssumeRoleは、プリンシパル（IAMユーザー・IAMロール・外部IDプロバイダーなど）が、あらかじめ作成された IAMロール の権限を一時的に借りる（＝引き受ける）操作である
* AWS Security Token Service（STS）が発行する一時的な認証情報（AccessKey／SecretKey／SessionToken）を取得し、そのロールに定義されたポリシーの範囲内でAWS APIを呼び出せるようになる
  * STSとは一時的かつ限定的な権限を持つ認証情報（トークン）を発行するためサービスであり、AssumeRoleで引き受けたロールはトークンの有効期限内でのみ利用可能となる。アクセスキーを発行せずに有効期限の短いトークンを用いることで安全に運用操作が可能となる

ユースケースとしては

* 別AWSアカウントのロールをAssumeしてリソースにアクセス(クロスアカウントアクセス)
* 開発者が管理者ロールを一時的に取得して運用作業(一時昇格, SSOなんかもそう)
* CodeBuild, LambdaなどAssumeRoleして他サービスを呼び出し(AWSサービスのバックエンド処理)

などに用いる

例

1. ロールの作成時にどのプリンシパルがこのロールをAssumeできるかを指定する信頼ポリシーの作成を行う

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::123456789012:user/Hoge" },
    "Action": "sts:AssumeRole"
  }]
}
```

2. ロールにアタッチする通常のIAMポリシーを権限ポリシーといい、Assumeごにこのポリシーが適用される

```bash
aws sts assume-role \
  --role-arn arn:aws:iam::123456789012:role/ReadOnlyRole \
  --role-session-name MySession
```

返却されるCredintialsを仕様すれば、その間はReadOnlyRole権限で操作が可能となる(Roleを引き受けた状態)

### PassRole

ロールを渡す

* PassRoleはAWSサービス(Lambda, ECSなど)に対してIAMロールを紐つけるAPIを呼ぶ際に必要な権限である
* ロールを渡す操作を制御するものでサービスロールを不正に渡されてしまうのを防ぐ

ユースケース

* CI/CDの実行時にロールを渡してAWSリソースへアクセス
* LambだやECSタスクに対して専用のサービスロールを設定
* IaCがリソース作成時にロールを紐つける

など

例

1. PassRoleを許可(MyServiceRole対して)

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "iam:PassRole",
    "Resource": "arn:aws:iam::123456789012:role/MyServiceRole"
  }]
}
```

2. Lambda関数作成API

```bash
aws lambda create-function \
  --function-name MyFunc \
  --runtime python3.9 \
  --role arn:aws:iam::123456789012:role/MyServiceRole \
  --handler handler.main \
  --zip-file fileb://function.zip
```

この際にiam:PassRoleがMyServiceRoleに付与されていない場合にはエラーとなる

### AssumeRoleとPassRoleの違い


| **項目**          | **AssumeRole**                                   | **PassRole**                                       |
| ------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| **目的**          | ロールの権限を一時的に借りる                     | AWSサービスに対してロールを割り当てる操作を許可    |
| **APIアクション** | sts:AssumeRole                                   | iam:PassRole                                       |
| **主な利用者**    | 人間ユーザー、他ロール、フェデレーションされたID | AWSサービス（Lambda/ECS/CodeBuild/etc）            |
| **設定場所**      | ロールの信頼ポリシー (**TrustPolicy**)           | IAMユーザー/ロールに付与するパーミッションポリシー |

1. AssumeRole(誰がこのロールを使えるかをロール側で制御して実行者が明示的にsts:AssumeRoleを呼び出す)

   ▶︎ 一時的な認証情報を取得し、別のロールの権限で操作したいときに使う。

   ▶︎ ロール側の信頼ポリシーで「誰がAssumeできるか」を定義する。
2. PassRole(サービスにロールを渡して良いのかをポリシーで制御し、サービスAPIの中で自動的にロールが渡される操作)

   ▶︎ Lambda や ECS などの サービスを呼び出してロールを割り当てる API を実行できるようにする権限。

   ▶︎ 呼び出し元に iam:PassRole を許可するポリシーを付与する必要がある。
