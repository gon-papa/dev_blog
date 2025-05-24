---
id: d069f6d5-7be8-04e0-d7f8-857189480281
title: GittHubActionsについてまとめる
date: '2025-05-24'
tags:
  -  GitHubActions
  - CI/CD
---
# GitHubActionsについてのまとめ

GitHub Actions は、GitHub が提供する CI/CD（継続的インテグレーション／継続的デリバリー）プラットフォームです。
コードをプッシュしたタイミングでテストを自動で走らせたり、本番環境にデプロイしたりといった作業を自動化できます。

[GitHub Actions を理解する - GitHub Docs](https://docs.github.com/ja/actions/learn-github-actions/understanding-github-actions)

## [**GitHub Actions のコンポーネント**](https://docs.github.com/ja/actions/learn-github-actions/understanding-github-actions#github-actions-%E3%81%AE%E3%82%B3%E3%83%B3%E3%83%9D%E3%83%BC%E3%83%8D%E3%83%B3%E3%83%88)

GitHubActionsにはいくつかのコンポーネントが存在する

![ランナー 1 をトリガーしてジョブ 1 を実行し、それによってランナー 2 がジョブ 2 の実行をトリガーするイベントの図。 各ジョブは複数のステップに分割されています。](https://docs.github.com/assets/cb-25535/images/help/actions/overview-actions-simple.png)

* workflows
* イベント
* ジョブ
* アクション
* ランナー

## workflows

---

1 つ以上のジョブを実行する構成可能な自動化プロセスであり、リポジトリの `.github/workflows` ディレクトリ内のYAMLファイルによって定義される。

リポジトリには複数のワークフローを含めることができ、各ワークフローはそれぞれ異なる一連のタスクを実行できる。ただしワークフローは並列で実行される

例：

PRを自動ビルドしてテストする

リリースが作成される度にアプリケーションをデプロイする

issueが開かれるたびにラベルを追加する

….etc

リポジトリ内のイベントによってトリガーされ、実行される(手動やスケジューリングでも実行可能)

ワークフローは再利用も可能で、ワークフローから別のワークフローを呼び出すことも可能である

[ワークフローの再利用 - GitHub Docs](https://docs.github.com/ja/actions/using-workflows/reusing-workflows)

ワークフローの使用方法

[ワークフローの使用 - GitHub Docs](https://docs.github.com/ja/actions/using-workflows)

## イベント

---

イベントはワークフロー実行をトリガーするリポジトリ内の特定のアクティビティである

例

PRが作成された時

issueが開かれた時

リポジトリにコミットがプッシュされた時

…etc

[REST API に投稿](https://docs.github.com/ja/rest/repos#create-a-repository-dispatch-event)、または手動で、ワークフロー実行をトリガーすることもできる

イベント一覧

[ワークフローをトリガーするイベント - GitHub Docs](https://docs.github.com/ja/actions/using-workflows/events-that-trigger-workflows)

## ランナー

---

ワークフローがトリガーされると実行されるサーバーである。各ランナーでは1度に1つのジョブを実行できる。

ランナーの種類

Ubuntu

Linux

Microsoft Windows

macOS

これらの仮想マシン内で処理が行われる

大きな構成で使用可能なランナーは別途用意してある

[About larger runners - GitHub Docs](https://docs.github.com/ja/actions/using-github-hosted-runners/about-larger-runners/about-larger-runners)

独自でランナーをホストすることも可能(自前でサーバー用意すれば仕様できるよってこと)

[自分のランナーをホストする - GitHub Docs](https://docs.github.com/ja/actions/hosting-your-own-runners)

インストール済みの代表的なソフトウェア
Node.js, Java, Python, Go, Rubyなど(パッケージマネージャーもインストールされている)
jq, OepnSSL, Docker, GitHubCLI, AWS CLIなどもインストールされている

## ジョブ

同じランナー内で実行されるワークフロー内の一連のステップがまとまったものである

各ジョブはそれぞれの環境で実行されるため、ジョブ間では環境変数やファイル、セットアップの処理などは共有されない。

意図的にジョブと他のジョブに依存関係を構成できる。

その場合は依存ジョブが完了するまで待ってから実行される。

例：なるアーキテクチャ用で依存関係のない複数のビルド ジョブがあり、それらのジョブに依存するパッケージ化ジョブがあるとします。 ビルド ジョブは並列で実行され、それらがすべて正常に完了したら、パッケージ化ジョブが実行されます。

[ジョブの使用 - GitHub Docs](https://docs.github.com/ja/actions/using-jobs)

## ステップ

各ステップは

シェル

スクリプト

アクション

上記のいずれかとなる。

ステップは順番位実行され、相互に依存する。各ステップは同じランナーで実行されるため、データの共有が可能。

アプリケーションをビルドするステップ→テストするステップと状態を保持してステップを続けることができる。

## アクション

GitHub Actions用のカスタムアプリケーションであり、workflowsの最小構成単位である。

workflows(定義)>ランナー(環境)>ジョブ(1つの環境に1つのジョブ→実行単位)>ステップ>アクション

アクションでは、GitHub からの Git リポジトリのプル、ビルド環境に適したツールチェーンの設定、またはクラウド プロバイダーに対する認証の設定を実行できる。

runでコマンド実行も可能である、useで公開されているアクションを利用することもできる

[アクションの作成 - GitHub Docs](https://docs.github.com/ja/actions/creating-actions)

プロジェクトルートに.github/workflows/code_quality.ymlを作成

作成してpushした時点でGitHub側に何か設定を行わなくても勝手に読み込み実行するようになる

参考

[[Flutter] GitHub Actionsでコード検査](https://deku.posstree.com/flutter/github-actions/code-quality/)

実際のコード

```yaml
name: Check and test the source code
on:
  pull_request:
    branches:
      - main
jobs:
  check_and_test_the_code:
    name: Check and Test the source code
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.13.2'
      - name: pub get
        run: flutter pub get
      - name: Analyze
        run: flutter analyze
      - name: Test
        run: flutter test
```

## 説明

```jsx
このワークフローの名前でGitHub上で表示される
name: Check and test the source code
on:
　メインブランチがプルリクエスト対象とされた場合に実行する
  pull_request:
    branches:
      - main
```


ジョブとステップとアクション

```jsx
jobs:
　上部の識別名(表示はないが、処理で内部的に使用)
  check_and_test_the_code:
    name: Check and Test the source code
　　使用する仮想マシン
    runs-on: ubuntu-latest
    steps:
				GitHubマーケットプレイスのcheckout(これがブランチ情報取得やチェックアウトを行う)
      - uses: actions/checkout@v4
				GitHubマーケットプレイスのcheckout(Flutter環境)
      - uses: subosito/flutter-action@v2
        with:
					バージョン指定(subosito/flutter-action@v2ドキュメントに記載されていた)
          flutter-version: '3.13.2'
      - name: pub get
        run: flutter pub get
      - name: Analyze
        run: flutter analyze
      - name: Test
        run: flutter test
```

actions/checkout@v4が何をしているのかが記載されている

1. ランナー内のリポジトリのGitの処理設定
2. Gitの認証設定
3. リモートリポジトリから処理を実行するブランチのリポジトリのソースコードをfetch
4. fetchしたソースコードと同じブランチをチェックアウト

要するにランナー内にリモートリポジトリにあるソースコードをクローンに限りなく近い形(厳密には違う)で複製していることになります。

クローンだとデフォルトのブランチ(main、develop)のソースコードしか抽出できず、作業する際に使うfeatureブランチのソースコードだけテストできないからfetchとcheckoutをしているのだと筆者は考えています

[【初心者向け】【入門】GitHub Actionsの書き方についてデバッグ設定、runs-onやcheckoutなどの仕組みや構造も含めて徹底解説 - Qiita](https://qiita.com/shun198/items/14cdba2d8e58ab96cf95#actionscheckoutv3%E3%81%A3%E3%81%A6%E4%BD%95%E3%81%97%E3%81%A6%E3%82%8B%E3%81%AE)

サービスに記載すればDockerイメージも使える

```jsx
name: Laravel Test

on:
  workflow_dispatch:
  pull_request:
    branches: [ develop ]

jobs:
  laravel-tests:

    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ALLOW_EMPTY_PASSWORD: yes
          MYSQL_ROOT_PASSWORD:
          MYSQL_DATABASE: test_db
          MYSQL_USER: user
          MYSQL_PASSWORD: pass
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3

      redis:
        image: redis
        ports:
          - 6379:6379
        env:
          ALLOW_EMPTY_PASSWORD: 'yes'
        options: --health-cmd="redis-cli ping" --health-interval=10s --health-timeout=5s --health-retries=3  
    env:
      DB_HOST: 127.0.0.1

    steps:
    - name: Get Repository
      uses: actions/checkout@v4

    - name: Create .env
      run: |
        cp .env.sample .env
        cp .env.testing.sample .env.testing

    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.2'
        extensions: crypto, curl, dom, fileinfo, filter, hash, mbstring, openssl, pcre, pdo, pdo_mysql, session, tokenizer, xml, zip, redis

    - name: Php Version
      run: php -v

    - name: Show databases
      run: mysql --protocol=tcp -h localhost --port 3306 -uuser -ppass -e "show databases;"

    - name: Cache composer dependencies
      id: cache
      uses: actions/cache@v2
      with:
        path: vendor
        key: composer-${{ hashFiles('**/composer.lock') }}
        restore-keys: |
          composer-

    - name: Composer install
      if: steps.cache.outputs.cache-hit != 'true'
      run: composer install -n --prefer-dist

    - name: Dump-autoload
      run: composer dump-autoload

    - name: Generate key
      run: |
        php artisan key:generate
        php artisan key:generate --env=testing

    - name: Clear Config
      run: php artisan config:clear

    - name: Migrate
      run: php artisan migrate --env=testing
      env:
        DB_HOST: 127.0.0.1

    - name: Run Test
      run: ./vendor/bin/phpunit
      env:
        DB_HOST: 127.0.0.1
        REDIS_HOST: 127.0.0.1

```
