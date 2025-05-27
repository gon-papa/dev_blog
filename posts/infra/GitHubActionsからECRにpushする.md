---
id: 141e7b35-c01a-2eda-41ef-aaf4af2fff72
title: GitHubActionsからECSにデプロイを行う
date: '2025-05-24'
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


| 変数名                | 意味                                                         | 例                          |
| ----------------------- | -------------------------------------------------------------- | ----------------------------- |
| `AWS_REGION`          | デプロイ対象の AWS リージョン                                | `ap-northeast-1`（東京）    |
| `ECR_REPOSITORY`      | Amazon ECR（Elastic Container Registry）のリポジトリ名       | `my-app-api`                |
| `ECS_SERVICE`         | デプロイ対象の Amazon ECS サービス名                         | `my-app-service`            |
| `ECS_CLUSTER`         | 対象の Amazon ECS クラスター名                               | `my-app-cluster`            |
| `ECS_TASK_DEFINITION` | ECS タスク定義ファイルへのパス（ローカルJSON）               | `.aws/task-definition.json` |
| `CONTAINER_NAME`      | タスク定義内の特定コンテナ名（ECR イメージを差し替える対象） | `my-app-container`          |

使用アクション

GitHubActions用のAWS認証情報設定(OpenIDConnectを利用するため、regionとrole-to-assume(資格情報を取得するロール)を引数で使用する)

[configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials)

GitHubActionsからECRにログインする際に使用するアクション

[amazon-ecr-login](https://github.com/aws-actions/amazon-ecr-login)




## OpenIDConnectとは？
