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
