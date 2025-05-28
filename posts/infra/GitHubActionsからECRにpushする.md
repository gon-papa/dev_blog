id: 141e7b35-c01a-2eda-41ef-aaf4af2fff72
title: GitHubActionsからECSにデプロイを行う
date: '2025-05-28'
tags:

- GitHubActions
- CI/CD

---

# GitHubActionsからECSにデプロイを行う

今回は簡単なGolangのアプリケーション(/にアクセスでHelloWorldが帰ってくるだけ)をGitHubActionsからデプロイしていく

ビルド->テスト->デプロイのパイプラインを組んでいく

下記の構成でCIを作成していく

今回はGitHubActionsがメインのため、その他の説明は省略する

[ソース](https://github.com/gon-papa/cicd_practice)

```
.
├── app
│   ├── go.mod
│   ├── go.sum
│   ├── main.go
│   └── main_test.go
│  
├── Dockerfile
├── makefile
├── .github
│   └── workflows
│       └── hello.yml
├── tmp
│   ├── build-errors.log
│   └── main             # Airなどでビルドされた実行ファイル
```

## テストを回してビルドまでを行う

要点としては

1. pushイベントで発火
2. appディレクトリ配下(アプリケーション本体)が変更された場合のみ実行で無駄な実行を抑止
3. concurrencyで重複起動を避ける
4. ワーキングディレクトリを相対パスで指定(CheckOut前にpwdとかやるとまだディレクトリがないのでエラーになる。CheckOut後はPJのルートがワーキングディレクトリになるため、絶対パス(/home/runner/work/cicd_practice/app)ではなく相対パスで指定したほうがいい。jobsに対してデフォルト定義しているため、各ステップに毎回ワーキングディレクトリが反映されるため、ステップごとに指定しなくて済む)

```yml
name: API Deploy Pipeline
on:
  push:
    paths:
      - 'app/**' # app配下が変更された時のみ動くように設定

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }} # 同じワークフローと同じブランチが並列で実行される場合(後勝ち)
  cancel-in-progress: true

jobs:
  build-and-test:
    defaults:
      run:
        working-directory: app # checkout後にPjのルートに対して相対パスを指定
    runs-on: ubuntu-latest
    steps:
      - name: Check Out Code # コードの取得
        uses: actions/checkout@v4

      - name: SetUp Go WithCache # Golangのセットアップ(ランナーのGoはバージョンが合わないため基本使わない)
        uses: actions/setup-go@v5
        with:
          go-version: '1.23'
          cache: true # デフォルトでtrueだが明示的に設定

      - name: Download Dependencies
        run: go mod tidy

      - name: Build
        run: go build ./...

      - name: Run tests
        run: go test ./... -v
```

ここまでで、CIは完了である。

この後は、実際にECRにpushしたり、ECSのタスク定義の書き換えを行いデプロイしていく

## ECRへイメージをpush

[GitHub公式情報](https://docs.github.com/ja/actions/use-cases-and-examples/deploying/deploying-to-amazon-elastic-container-service#creating-the-workflow)

上記を参照するとenv設定が必要なことがわかる


| 変数名                | 意味                                                                                 | 例                          |
| ----------------------- | -------------------------------------------------------------------------------------- | ----------------------------- |
| `AWS_REGION`          | デプロイ対象の AWS リージョン                                                        | `ap-northeast-1`（東京）    |
| `ECR_REPOSITORY`      | Amazon ECR（Elastic Container Registry）のリポジトリ名                               | `my-app-api`                |
| `ECS_SERVICE`         | デプロイ対象の Amazon ECS サービス名                                                 | `my-app-service`            |
| `ECS_CLUSTER`         | 対象の Amazon ECS クラスター名                                                       | `my-app-cluster`            |
| `ECS_TASK_DEFINITION` | ECS タスク定義ファイルへのパス（ローカルJSON）                                       | `.aws/task-definition.json` |
| `CONTAINER_NAME`      | タスク定義内の特定コンテナ名（ECR イメージを差し替える対象）<br />※今回は使用しない | `my-app-container`          |

使用アクション

GitHubActions用のAWS認証情報設定(OpenIDConnectを利用するため、regionとrole-to-assume(資格情報を取得するロール)を引数で使用する)

[configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials)

GitHubActionsからECRにログインする際に使用するアクション

[amazon-ecr-login](https://github.com/aws-actions/amazon-ecr-login)

まずはpushするまでの完成形から

```yml

name: API Deploy Pipeline
on:
  push:
    paths:
      - 'app/**' # app配下が変更された時のみ動くように設定

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }} # 同じワークフローと同じブランチが並列で実行される場合
  cancel-in-progress: true

permissions: #　追記 OIDCで使用する権限をAction内で許可する
  id-token: write
  contents: read

env: # 追記
  AWS_REGION: ap-northeadt-1
  ECR_REPOSITORY: xxxrepository
  ECS_SERVICE: xxxservice
  ECS_CLUSTER: xxxcluster
  ECS_TASK_DEFINITION: xxxx # まだ使用しない

jobs:
  build-and-test:
    defaults:
      run:
        working-directory: app # checkout後にPjのルートに対して相対パスを指定
    runs-on: ubuntu-latest
    steps:
      - name: Check Out Code # コードの取得
        uses: actions/checkout@v4

      - name: SetUp Go WithCache # Golangのセットアップ(ランナーのGoはバージョンが合わないため基本使わない)
        uses: actions/setup-go@v5
        with:
          go-version: '1.23'
          cache: true # デフォルトでtrueだが明示的に設定

      - name: Download Dependencies
        run: go mod tidy

      - name: Build
        run: go build ./...

      - name: Run tests
        run: go test ./... -v

      # =======ここから下を追記========
      - name: Image Build # イメージをビルドして仮のタグを設置
        run: docker image build -t temp_api_image:latest .
   
      - name: Configure AWS credentials # OIDCを利用するために認証情報を取得する
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-region: ${{ env.AWS_REGION }}
          role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }} # 秘匿情報のためシークレットを活用
  
      - name: Login to Amazon ECR
        id: login-ecr # この後のステップでログイン時に取得したレジストリ情報を得るためにidを付与
        uses: aws-actions/amazon-ecr-login@v2

      - name: Push the image to Amazon ECR # イメージのタグを書き換えとECRのイメージpushコマンドを実行してくれるアクション
        env:
            ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          docker image tag temp_api_image:latest $ECR_REGISTRY/$ECR_REPOSITORY:${{ github.sha }}
          docker image push $ECR_REGISTRY/$ECR_REPOSITORY:${{ github.sha }}
```

変更した部分について説明していくと

```yml
permissions: #　追記 OIDCで使用する権限をAction内で許可する
  id-token: write
  contents: read
```

id-token: writeはランナーが実行中のジョブの身元を証明するJWTをGitHub OIDCプロバイダーへ、くださいとリクエストする許可が必要になるため設定している。

contens: readはGutHubActionsがリポジトリの内容に読み取りアクセスできるようにする設定である。

```yml
env: # 追記
  AWS_REGION: ap-northeadt-1
  ECR_REPOSITORY: xxxrepository
  ECS_SERVICE: xxxservice
  ECS_CLUSTER: xxxcluster
  ECS_TASK_DEFINITION: xxxx # まだ使用しない
```

上記については、AWSへのアクセスやアクションで必要になる情報である。前述で説明を記載しているため、省略する。

```yml
　　　- name: Image Build # イメージをビルドして仮のタグを設置・・・1
        run: docker image build -t temp_api_image:latest .
   
      - name: Configure AWS credentials # OIDCを利用して認証情報を取得する・・・2
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-region: ${{ env.AWS_REGION }}
          role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }} # 秘匿情報のためシークレットを活用・・・2-1
  
      - name: Login to Amazon ECR
        id: login-ecr # この後のステップでログイン時に取得したレジストリ情報を得るためにidを付与・・・3
        uses: aws-actions/amazon-ecr-login@v2

      - name: Push the image to Amazon ECR # イメージのタグを書き換えとECRのイメージpushコマンドを実行してくれるアクション・・・4
        env:
            ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          docker image tag temp_api_image:latest $ECR_REGISTRY/$ECR_REPOSITORY:${{ github.sha }}
          docker image push $ECR_REGISTRY/$ECR_REPOSITORY:${{ github.sha }}
```

ここからが本題となる。

1. ECRへpushするためのイメージを作成している。タグは一時的につけている。ECRにログインした際に得られるレジストリ名を使用したタグ名にpush前に変更するため、一旦、temp_api_imageとしている
2. OIDCトークンを取得してAWSに渡す。AWSから返却されたアクセスキーをランナーの.aws/直下にアクセストークン情報を保存する
   1. role-to-assumeはAWS側で作成したロールのARNを使用するため、シークレット情報としてGitHubに登録する。なお、シークレットとして登録した場合は、yml定義にも出てこないし、実行中のログにもマスクされるため安全に定義することができる。
3. ECRにログインを行っている。id付与は4で得たログイン情報をGITHUB_OUTPUT環境変数へ登録して、ステップ間のデータを共有するために付与している。[GITHUB_OUTPUT環境変数](https://pengineer.jp/blog/d069f6d5-7be8-04e0-d7f8-857189480282#:~:text=%E3%81%A7%E5%85%B1%E6%9C%89%E3%81%99%E3%82%8B-,GITHUB_OUTPUT%E7%92%B0%E5%A2%83%E5%A4%89%E6%95%B0%E7%B5%8C%E7%94%B1%E3%81%A7%E5%85%B1%E6%9C%89%E3%81%99%E3%82%8B,-GitHubActions%E3%81%8C%E7%AE%A1%E7%90%86)  [Actionsのソース](https://github.com/aws-actions/amazon-ecr-login/blob/main/index.js)
4. イメージタグを一時的なものから、レジストリ名+リポジトリ名+一意な値(コミットハッシュ)につけ直して、pushを行っている

実際の中身はそこまで難しいことを行なっていない。usesでアクションを使用すると裏で環境変数に値をセットしたりなど隠蔽してくれている部分もあるため、ドキュメントか、ソースを観に行くのがいいと思う。

次はOICDの説明を挟んだ後に、一旦、AWS側でrole-to-assume(GitHubシークレット)に登録するための、ロールを作成し、ARNを取得していく。

## OICD(OpenIDConnect)とは？

ユーザー認証を簡略化するための認証プロトコル(OAuth2.0をベースにしている)

OAuth2.0(認可)+IDトークン(認証)とした形となる

id_tokenはJWT形式のトークンである。

フロー(IDプロバイダー=GitHubでリポジトリや誰かを保証している)

```
開発者
↓
① GitHub Actions のジョブ実行開始（ワークフロー起動）
↓
② GitHub が OIDC トークン（JWT）を生成（署名付き。これでActionsの環境やユーザーなど一通りわかる情報が詰まっている）

開発者
↓
① GitHub Actions のワークフローが開始される

- `.github/workflows/deploy.yml` などがトリガーされる

↓
② GitHub が OIDC トークン（JWT）を生成（ID プロバイダーとしての役割）

- `iss`（issuer）: https://token.actions.githubusercontent.com
- `aud`（audience）: sts.amazonaws.com
- `sub`（subject）: repo:<org>/<repo>:ref:refs/heads/main など
- JWT は GitHub の **秘密鍵で署名（RS256）**

↓
③ GitHub Actions ランナーが、AWS に対して `AssumeRoleWithWebIdentity` を実行

- 使用ライブラリ例: `aws-actions/configure-aws-credentials`
- 渡す情報：
  └ `role-to-assume`: IAM Role ARN（事前に設定）
  └ `web_identity_token`: GitHub が発行した OIDC JWT

↓
④ AWS が GitHub を信頼した OIDC プロバイダーとして JWT を検証

- GitHub の `.well-known/jwks` から **公開鍵を取得**
- 以下の内容をすべて検証：
  - `iss`（発行元）が信頼済みか？
  - `aud` が `sts.amazonaws.com` か？
  - `sub` が IAM Role の trust policy 条件と一致するか？
  - JWT の **署名が正当か？**（RS256で検証）
  - `exp`, `nbf`, `iat` などの有効期限が妥当か？

↓
⑤ 条件をすべて満たせば、AWS は STS 経由で一時的な認証情報を発行

- `AccessKeyId`
- `SecretAccessKey`
- `SessionToken`
- 有効期限は通常 1時間未満

↓
⑥ GitHub Actions はその認証情報を使って AWS API を操作

- 例：`aws s3 cp`, `aws ecs update-service`, `aws deploy push` など
- `iss`: https://token.actions.githubusercontent.com
- `aud`: sts.amazonaws.com
- `sub`: repo:<org>/<repo>:ref:refs/heads/main など
  ↓
  ③ Actionsランナーが `configure-aws-credentials` アクションなどを通じて
  STS の AssumeRoleWithWebIdentity API を実行：
  └ role-to-assume: arn:aws:iam::<account>:role/<role>
  └ web_identity_token: <JWT>
  ↓
  ④ AWS が OIDC Provider を使って検証：
- `issuer`（iss）が一致しているか？
- `aud` が `sts.amazonaws.com` か？
- `sub` が IAM Role の trust policy に合致しているか？
- `signature` を GitHub の公開鍵（JWKS）で検証
- `exp` が過ぎてないか？ `nbf` は未来じゃないか？
  ↓
  ⑤ 検証OKなら、AWS は STS 経由で一時的な認証情報（access key, secret, session token）を発行
  ↓
  ⑥ GitHub Actions がその認証情報で S3 / ECS / Lambda など AWS API を呼び出す
```

めちゃくちゃ要約すると

GitHub: AWSのリソースにアクセスしたいなぁ。せや、自分を証明する情報を作って送りつけたろ。JWTでええか。秘密鍵で暗号化してAWS側で公開鍵で復号すればワイやと証明できるしな！

AWS: GitHubからなんかきたな。。。JWT?本物か確認するわ。。。。。。本物やな。アクセストークンやるよ。ただし怖いから短い有効時間のアクセストークンな！

GitHub: ナイスAWS!! これでAWSリソースにアクセスできるわ！

て感じです。

## AWSでロールを作成していく

特定のリポジトリ、特定のブランチからの要求に対して、アクセストークンを付与するためのロールを作成していく。

### AWSにGitHubのIDプロバイダーを登録

AWSのIAMに移動してサイドメニューからIDプロバイダを選択する。

![AWS IAM IDプロバイダーメニュー](images/github_actions_aws_id_provider_menu.png)

プロバイダーの作成をクリックし、新規作成画面に入る

プロバイダのタイプ: OpenID Connectを選択

プロバイダのURL: token.actions.githubusercontent.com

対象者: sts.amazonaws.com

参照: [公式にプロバイダのURLが記載してある](https://docs.github.com/ja/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services#:~:text=%E3%81%94%E8%A6%A7%E3%81%8F%E3%81%A0%E3%81%95%E3%81%84%E3%80%82-,AWS%20%E3%81%B8%E3%81%AE%20ID%20%E3%83%97%E3%83%AD%E3%83%90%E3%82%A4%E3%83%80%E3%83%BC%E3%81%AE%E8%BF%BD%E5%8A%A0,-GitHub%20OIDC%20%E3%83%97%E3%83%AD%E3%83%90%E3%82%A4%E3%83%80%E3%83%BC)

これでIDプロバイダー登録は完了である。

もしかしたらサムプリントを取得ボタンが表示されているかもしれないが、それは取得してしまって構わない。

### ロールを作成

サイドメニューからロールを選択し、ロールの新規作成をクリック

信頼されたエンティティタイプ: ウェブアイデンティティを選択

アイデンティティプロバイダー: token.actions.githubusercontent.comが選択できるはず

Audience: sts.amazonaws.comが選択できるはず

GitHub組織: 個人である場合はGitHubのユーザー名を入力(GitHubリポジトリの右側にあるユーザー名)

GitHubリポジトリ: GitHubリポジトリ名

GitHubブランチ: ブランチ名(オプション)

次へを選択する。

許可ポリシーは一旦、何もせず、次へ

ロールの詳細

ロール名: GitHubActionsブランチ名(ここは明示的な命名がいいと思います)

説明: 説明を記載(日本語不可)

ロールを作成で完了。

作成したロールにポリシーをアタッチしていく。

ロールの詳細に入り、インラインポリシーをアタッチを選択

下記を貼り付ける

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "Statement1",
			"Effect": "Allow",
			"Action": [
				"ecr:BatchGetImage",
				"ecr:GetDownloadUrlForLayer",
				"ecr:BatchCheckLayerAvailability",
				"ecr:PutImage",
				"ecr:InitiateLayerUpload",
				"ecr:UploadLayerPart",
				"ecr:CompleteLayerUpload",
				"ecr:GetAuthorizationToken",
				"ecs:UpdateService",
				"ecs:RegisterTaskDefinition",
				"ecs:ListTaskDefinitions",
				"ecs:DescribeServices"
			],
			"Resource": "*"
		}
	]
}
```

ポリシー名: UpdateECSTask(任意でいいです)

ポリシーの作成をクリック

ポリシーのアタッチができたら、作成したロールの詳細画面にARNが表示されているため、これをGitHubのシークレットに登録していく。

## GitHubActions　シークレットの登録

GitHubのリポジトリ画面に戻って、Settings->Secrets and Variablesを選択

![GitHub Secrets and Variables](images/github_action_secret.png)

New Repository Secretを選択する

Name: AWS_ROLE_TO_ASSUME(Actionsに記載したsecrets.AWS_ROLE_TO_ASSUMEがこれ)

Secret: AWS ロールのARNを貼り付け

Add Secretをクリックで完了。

これでAWS<->GitHub間の設定は完了となった。

AWSにECRが作成してある場合はActions経由でpushできる状態になっているはずである。

## ECSにデプロイを行う

ざっくりイメージを記載すると
ECSのタスク定義を書き換え→タスク定義を更新→リビジョンが上がりECSによってFargateにデプロイされる
