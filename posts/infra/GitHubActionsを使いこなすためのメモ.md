---
id: d069f6d5-7be8-04e0-d7f8-857189480282
title: GitHubActionsを少し上手に使ってみる
date: '2025-05-24'
tags:
  -  GitHubActions
  - CI/CD
---
# GitHubActionsを少し上手に使ってみる

ワークフロー、イベント、ランナー、ジョブ、ステップ、アクションの関係を理解している知識を前提とする。

基礎的な内容も含まれるが、CI/CDをGitHubActionsで行いたい方を対象とする。

## アクションを選ぶ際に注意すること

アクションはGitHubマーケットプレイスから取得することが多いが、注意点がある。

アクションは便利な反面、セキュリティリスクも存在する。一定の信頼度を見るためにはVerified Creatorsかを確認をすること。

GitHubによって検証されたアカウントを意味しており、目印に使用可否を検討すること。
下記画像のチェックアイコンや右側に記載されているVerifiedを確認すること。

![verified creators](images/github_verified_cretors.png)

[GitHubマーケットプレイス](https://github.com/marketplace)

## GitHubコンテキスト

コンテキストは実行情報や、ジョブの実行結果などを保持するオブジェクトである。プロパティが複数定義されており、そこから値を取得することができる。

```yml
steps:
 - run: echo "${{ github.repository }}" # リポジトリ名が出力される
```

以下にコンテキストの種類やプロパティが記載されている。

[ワークフロー実行に関するコンテキスト情報へのアクセス](https://docs.github.com/ja/actions/writing-workflows/choosing-what-your-workflow-does/accessing-contextual-information-about-workflow-runshttps:/)

### 代表的なコンテキスト

### GitHub Actions コンテキスト一覧

**github コンテキスト（GitHub関連の情報）**

- `github.repository`：リポジトリ名（例: `user/repo`）
- `github.ref`：イベント発火元の参照（例: `refs/heads/main`）
- `github.ref_name`：ブランチ名やタグ名のみを抽出（例: `main`）
- `github.sha`：イベント発生時のコミットSHA値
- `github.actor`：ワークフローを実行したユーザー名
- `github.workflow`：現在のワークフローの名前
- `github.event_name`：イベントの種類（例: `push`, `pull_request`）
- `github.event`：トリガーイベントのJSON形式のデータ
- `github.run_number`：このリポジトリ内でのワークフロー実行の通し番号
- `github.run_id`：この実行を一意に識別するID

**runner コンテキスト（実行環境の情報）**

- `runner.os`：実行中のランナーのOS（例: `Linux`, `macOS`）
- `runner.arch`：ランナーのCPUアーキテクチャ（例: `X64`）
- `runner.name`：実行中のランナー名
- `runner.temp`：一時ファイル用のディレクトリパス
- `runner.tool_cache`：ツールキャッシュ用のディレクトリパス

**job コンテキスト（ジョブの状態）**

- `job.status`：ジョブの現在のステータス（例: `success`, `failure`）

**env コンテキスト（環境変数）**

- `env.変数名`：ワークフローやジョブ、ステップ内で定義された環境変数を参照できる。(あくまでenvコンテキストで普通の環境変数ではない)

環境変数は、`GITHUB_ENV` ファイルに書き込むことで現在のジョブ内の **後続ステップ** に渡すことができる。
ただし、**同じステップ内で設定した変数をすぐに参照することはできない**。

そのため、環境変数の設定と利用は必ず別々のステップに分ける必要がある。
（例：ステップAで変数を設定し、ステップBで利用）

環境変数は次のように複数のレベルで設定可能だが、**スコープの狭い方が優先される**：

- ステップレベル（最優先）
- ジョブレベル
-

[デフォルトの環境変数](https://docs.github.com/ja/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#default-environment-variables)

**secrets コンテキスト（シークレット）**

- `secrets.変数名`：GitHubに登録された機密情報（パスワード・トークン等）

**steps コンテキスト（ステップの出力など）**

- `steps.step_id.outputs.変数名`：指定したステップの出力値にアクセス

**inputs コンテキスト（workflow_dispatchでの手動入力）**

- `inputs.変数名`：手動トリガー時の入力値にアクセス

**vars コンテキスト（Organization/Repositoryの変数）**

- `vars.変数名`：管理画面で定義された変数にアクセス（例: デプロイ先リージョンなど）

---

使うときは `${{ github.actor }}` のように `${{ ... }}` で囲んで使用する。

また、コンテキストを直接、シェルコマンドなどに使用すると、コンテキストによっては特殊文字列が使用され、意図しない影響が出てしまう恐れがある。

これを回避するために環境変数経由でコンテキストを渡して、呼び出しはクウォートで囲って呼び出す。これを中間環境変数と呼ぶ

```yml
jobs:
 print:
 runs-on: ubuntu-latest
 env:
  ACTOR: ${{ github.actor }} # コンテキストの値を環境変数へセット
  steps:
   -run: echo "${ ACTOR }" # 環境変数経由でコンテキストのプロパティを参照
```

**コンテキストはシェルコマンドへハードコートせず、環境変数を経由して渡す**

**環境変数は全てダブルクウォーテションで囲って呼び出し**

上記2点を守っていれば大丈夫。

## ステップ間のデータ共有

GitHubActionsはステップを跨いだ環境変数による値の受け渡しは不可能である。

理由としてはステップごとが独立したプロセスで実行されるため、今のstepで環境変数を登録しても、次のステップでは別プロセスで実行されるため、共有はされない。

```yml
steps:
 - run: export HOGE="hoge"
 - run: echo "${HOGE}" # プロセスが違うため、HOGEを参照しても、このステップではHOGEは環境変数として存在していない
```

2つのやり方が存在する。

* GITHUB_OUTPUT環境変数経由で共有する
* GITHUB_ENV環境変数経由で共有する

### GITHUB_OUTPUT環境変数経由で共有する

GitHubActionsが管理するファイルが使用され、GITHUB_OUTPUT環境変数はそこに保存される。(ランナーが一時的に作成したファイルパス)

よってステップを跨いでも参照元は同じなため、値の共有が可能になる。

#### 書き込み方法

書き込むステップにはidを付与すること

```yml
-id: step_id
 run: echo "変数名=値" >> $GITHUB_OUTPUT
```

#### 呼び出し方法

steps.id.outputs.変数名で呼び出しが可能となる

```yml
- name: set output value
  id: step1 # idを付与
  run: echo "greeting=Hello" >> $GITHUB_OUTPUT # GITHUB_OUTPUTへ書き込み

- name: use output value
  run: echo "The greeting is ${{ steps.step1.outputs.greeting }}"
```

注意点

* $GITHUB_OUTPUT に書き込んだ値は 同じジョブ内の後続ステップでしか使えない
* id: をつけ忘れると steps.xxx.outputs.yyy 形式で参照できない

### GITHUB_ENV環境変数経由で共有する
